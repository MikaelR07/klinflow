import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore, NOTIFICATION_TYPES } from '@klinflow/core/stores/notificationStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { WASTE_CATEGORIES } from '@klinflow/core/data/wasteDefinitions';
import {
  Receipt, Plus, Search, Filter, Clock, CheckCircle2, XCircle,
  MapPin, Scale, MessageSquare, DollarSign, Calendar, Info, Trash2, ArrowRight, Package, X, ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@klinflow/supabase';
import { compressImage } from '@klinflow/core/utils/imageUtils';

const getSubcategoryLabel = (catId: string, subId: string) => {
  const cat = WASTE_CATEGORIES.find(c => c.id === catId);
  const sub = cat?.subcategories.find(s => s.id === subId);
  return sub ? sub.label : subId;
};

export default function FleetRFQs() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const { agentConfig, fetchAgentConfig } = useAgentStore();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'closed' | 'cancelled'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch data & Realtime subscription
  useEffect(() => {
    fetchAgentConfig();

    const fetchRFQs = async () => {
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from('rfqs')
        .select(`*, rfq_offers(count)`)
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: false });

      if (data) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          material: getSubcategoryLabel(r.category, r.material_grade) || r.material_grade,
          category: r.category,
          quantity: `${r.requested_weight} ${r.weight_unit || 'kg'}`,
          targetPrice: r.target_price?.toString() || '0',
          location: r.pickup_area,
          status: r.status === 'open' ? 'pending' : r.status,
          createdAt: new Date(r.created_at).toLocaleString(),
          bidsCount: r.rfq_offers?.[0]?.count || 0,
          deadline: r.deadline ? new Date(r.deadline).toLocaleString() : '',
          description: r.notes || ''
        }));
        setRfqs(mapped);
      }
    };

    fetchRFQs();

    // 2. Realtime listener for offers
    if (profile?.id) {
      const channel = supabase.channel('my_incoming_offers')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'rfq_offers',
          filter: `buyer_id=eq.${profile.id}`
        }, (payload) => {
          toast.info('New Bid Received!', { description: 'A seller has sent a proposal for your RFQ.' });
          fetchRFQs();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.id]);

  // RFQ Submission state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<{ file: File, url: string }[]>([]);
  const [formData, setFormData] = useState({
    category: '',
    materialName: '',
    weight: '',
    pickupArea: profile?.location?.estate || profile?.estate || '',
    price: '',
    deliveryMethod: 'flexible',
    deadlineDate: '',
    deadlineTime: '',
    notes: ''
  });


  const activeCategories = useMemo(() => {
    const rawMaterials = agentConfig?.accepted_materials;
    if (!rawMaterials || !Array.isArray(rawMaterials) || rawMaterials.length === 0) {
      return WASTE_CATEGORIES;
    }
    const acceptedSlugs = rawMaterials.map((item: any) => {
      if (!item) return '';
      if (typeof item === 'string') return item.toLowerCase();
      if (typeof item === 'object') return (item.id || item.name || '').toLowerCase();
      return '';
    }).filter(Boolean);
    if (acceptedSlugs.length === 0) return WASTE_CATEGORIES;
    return WASTE_CATEGORIES.filter(cat => acceptedSlugs.includes(cat.id));
  }, [agentConfig]);

  const subcategories = useMemo(() => {
    const cat = activeCategories.find(c => c.id === formData.category);
    return cat ? cat.subcategories : [];
  }, [formData.category, activeCategories]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    if (images.length + files.length > 3) {
      toast.error('You can upload at most 3 sample images.');
      return;
    }

    const newImages = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesFilter = rfq.status === filter;
    const matchesSearch = rfq.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate Pipeline statistics
  const stats = useMemo(() => {
    const total = rfqs.length;
    const open = rfqs.filter(q => q.status === 'pending').length;
    const fulfilled = rfqs.filter(q => q.status === 'accepted').length;
    const totalBids = rfqs.reduce((acc, q) => acc + q.bidsCount, 0);
    return { total, open, fulfilled, totalBids };
  }, [rfqs]);

  const handleCreateRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.materialName || !formData.weight || !formData.pickupArea || !formData.price || !formData.deadlineDate || !formData.deadlineTime) {
      toast.error('Validation Error', { description: 'Please complete all required fields.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedUrls: string[] = [];

      for (const img of images) {
        const compressed = await compressImage(img.file, { maxWidth: 1024, quality: 0.7 });
        const fileExt = compressed.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${profile?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('rfq-images').upload(filePath, compressed);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('rfq-images').getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }

      const parseTime = (timeStr: string) => {
        if (!timeStr) return "00:00";
        if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) return timeStr;
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!match) return "00:00";
        let hours = parseInt(match[1], 10);
        if (match[3] && match[3].toUpperCase() === "PM" && hours < 12) hours += 12;
        if (match[3] && match[3].toUpperCase() === "AM" && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, "0")}:${match[2]}`;
      };

      const deadlineDateObj = new Date(`${formData.deadlineDate}T${parseTime(formData.deadlineTime)}`);
      const insertPayload: any = {
        buyer_id: profile!.id,
        buyer_type: profile?.agentAccountType === 'company_admin' ? 'company' : 'agent',
        category: formData.category,
        material_grade: formData.materialName,
        requested_weight: parseFloat(formData.weight),
        weight_unit: 'kg',
        target_price: parseFloat(formData.price),
        pickup_area: formData.pickupArea,
        delivery_method: formData.deliveryMethod,
        images: uploadedUrls,
        notes: formData.notes,
        deadline: isNaN(deadlineDateObj.getTime()) ? null : deadlineDateObj.toISOString(),
        status: 'open'
      };

      const { data: insertData, error: insertError } = await supabase.from('rfqs').insert(insertPayload).select();

      if (insertError) throw insertError;

      // Broadcast Notification to all sellers (client role)
      await useNotificationStore.getState().addNotification(
        'New Market Request 🔔',
        `A fleet is requesting ${formData.weight}kg of ${formData.materialName} in ${formData.pickupArea}.`,
        NOTIFICATION_TYPES.INFO,
        'seller',
        null
      );

      const r = insertData?.[0];
      if (r) {
        const newRFQ = {
          id: r.id,
          material: getSubcategoryLabel(r.category, r.material_grade) || r.material_grade,
          category: r.category,
          quantity: `${r.requested_weight} ${r.weight_unit || 'kg'}`,
          targetPrice: r.target_price?.toString() || '0',
          location: r.pickup_area,
          status: 'pending',
          createdAt: new Date(r.created_at).toLocaleString(),
          bidsCount: 0,
          deadline: r.deadline ? new Date(r.deadline).toLocaleString() : '',
          description: r.notes || ''
        };
        setRfqs(prev => [newRFQ, ...prev]);
      }

      toast.success('RFQ Broadcasted Successfully! 🚀', {
        description: 'Nearby sellers have been notified of your new request.'
      });

      // Reset form
      setImages([]);
      setFormData({
        category: '',
        materialName: '',
        weight: '',
        pickupArea: profile?.location?.estate || profile?.estate || '',
        price: '',
        deliveryMethod: 'flexible',
        deadlineDate: '',
        deadlineTime: '',
        notes: ''
      });
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to broadcast RFQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white leading-none">RFQ Requests</h1>
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-bold uppercase tracking-wider">Fleet Sourcing</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight">
            Broadcast request for quotes (RFQs) and source materials directly from local sellers for {profile?.companyName}.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData(prev => ({ ...prev, pickupArea: profile?.location?.estate || profile?.estate || prev.pickupArea }));
            setIsModalOpen(true);
          }}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-bold text-xs capitalize tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-102 active:scale-98 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Broadcast New RFQ
        </button>
      </div>

      {/* ── PIPELINE STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'Total Broadcasts', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-500/10' },
          { name: 'Open RFQs', value: stats.open, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { name: 'Fulfilled', value: stats.fulfilled, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { name: 'Seller Responses', value: stats.totalBids, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center`}>
              <Receipt className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs font-semibold capitalize tracking-widest text-slate-400">{item.name}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1.5">{item.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by material grade or pickup area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto no-scrollbar">
          {(['pending', 'accepted', 'closed', 'cancelled'] as const).map((status) => {
            const label = { pending: 'Open / Bidding', accepted: 'Fulfilled', closed: 'Closed', cancelled: 'Cancelled' }[status];
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold capitalize tracking-widest shrink-0 transition-all flex items-center justify-center gap-2 ${filter === status
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
              >
                <span>{label}</span>
                {status === 'pending' && stats.open > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 bg-red-500 text-white rounded-full text-[10px] font-bold px-1 shadow-sm">
                    {stats.open}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FLEET RFQS GRID ── */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-sm">
        {filteredRFQs.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">No matching RFQs found</h3>
            <p className="text-xs text-slate-500 mt-2 font-medium">Create a new broadcast to source materials.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/30">
                  <th className="p-6 text-xs font-semibold text-slate-400 capitalize tracking-widest">Material Grade</th>
                  <th className="p-6 text-xs font-semibold text-slate-400 capitalize tracking-widest">Location</th>
                  <th className="p-6 text-xs font-semibold text-slate-400 capitalize tracking-widest">Requested Weight</th>
                  <th className="p-6 text-xs font-semibold text-slate-400 capitalize tracking-widest">Target Price</th>
                  <th className="p-6 text-xs font-semibold text-slate-400 capitalize tracking-widest text-center">Active Bids</th>
                  <th className="p-6 text-xs font-semibold text-slate-400 capitalize tracking-widest">Status</th>
                  <th className="p-6 text-xs font-semibold text-slate-400 capitalize tracking-widest text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredRFQs.map((rfq) => {
                  const statusConfig = {
                    pending: { icon: Clock, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'Bidding Open' },
                    accepted: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'Fulfilled' },
                    closed: { icon: XCircle, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', label: 'Closed' },
                    cancelled: { icon: XCircle, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', label: 'Cancelled' }
                  }[rfq.status as 'pending' | 'accepted' | 'closed' | 'cancelled'];

                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={rfq.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-700/20 transition-all duration-150">
                      <td className="p-6">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{rfq.material}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{rfq.category}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rfq.location}</span>
                        </div>
                      </td>
                      <td className="p-6 text-sm font-bold text-slate-900 dark:text-white">
                        {rfq.quantity}
                      </td>
                      <td className="p-6 text-sm font-bold text-emerald-600">
                        KSh {rfq.targetPrice}/kg
                      </td>
                      <td className="p-6 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/5 border border-purple-500/10 text-purple-600 font-bold text-xs">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {rfq.bidsCount}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold capitalize tracking-widest ${statusConfig.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <button
                          onClick={() => navigate(`/rfqs/${rfq.id}`)}
                          className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-755 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── BROADCAST RFQ MODAL (DESKTOP FORM COMPLIANT) ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-150 dark:border-slate-700/60"
            >
              {/* Header */}
              <div className="px-8 py-6 bg-slate-50 dark:bg-slate-750/30 border-b border-slate-150 dark:border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">Broadcast New RFQ</h3>
                    <p className="text-xs text-slate-400 mt-1.5 font-medium tracking-tight">Source recyclable materials from local networks.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 transition-all active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateRFQ} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Material Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value, materialName: '' })}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold text-slate-900 dark:text-white"
                      required
                    >
                      <option value="">Select Category</option>
                      {activeCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Material Name / Grade */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Material Type</label>
                    {formData.category ? (
                      <select
                        value={formData.materialName}
                        onChange={(e) => {
                          const selectedSub = e.target.value;
                          const customRates = (agentConfig?.custom_rates || {}) as Record<string, any>;
                          const price = customRates[selectedSub] || customRates[formData.category] || '';
                          setFormData({ ...formData, materialName: selectedSub, price: price ? String(price) : '' });
                        }}
                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold text-slate-900 dark:text-white"
                        required
                      >
                        <option value="">Select Material Type</option>
                        {subcategories.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        placeholder="Select category first..."
                        className="w-full h-12 bg-slate-100 dark:bg-slate-750/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold text-slate-400 cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Weight Requested */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Requested Weight (kg)</label>
                    <div className="relative">
                      <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        placeholder="e.g. 1500"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 text-sm font-semibold text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Target Price */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Target Price (KSh / kg)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        placeholder="e.g. 25"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 text-sm font-semibold text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Pickup Area */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Pickup Area / Region</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Kasarani, Nairobi"
                        value={formData.pickupArea}
                        onChange={(e) => setFormData({ ...formData, pickupArea: e.target.value })}
                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 text-sm font-semibold text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Delivery Method Selector */}
                  <div className="space-y-2 col-span-2 mt-2 pt-4 border-t border-slate-100 dark:border-slate-750">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Delivery Method</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, deliveryMethod: 'agent_pickup' })}
                        className={`h-12 text-sm font-bold rounded-xl border transition-all ${formData.deliveryMethod === 'agent_pickup'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                          }`}
                      >
                        We Pick Up
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, deliveryMethod: 'self_drop' })}
                        className={`h-12 text-sm font-bold rounded-xl border transition-all ${formData.deliveryMethod === 'self_drop'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                          }`}
                      >
                        You Drop Off
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, deliveryMethod: 'flexible' })}
                        className={`h-12 text-sm font-bold rounded-xl border transition-all ${formData.deliveryMethod === 'flexible'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                          }`}
                      >
                        Flexible
                      </button>
                    </div>
                  </div>

                  {/* Deadline Date & Time */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Deadline Date & Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={formData.deadlineDate}
                        onChange={(e) => setFormData({ ...formData, deadlineDate: e.target.value })}
                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold text-slate-900 dark:text-white"
                        required
                      />
                      <input
                        type="time"
                        value={formData.deadlineTime}
                        onChange={(e) => setFormData({ ...formData, deadlineTime: e.target.value })}
                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Image Upload Area */}
                <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-150 dark:border-slate-700/50 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-750 pb-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Sample Images <span className="text-[10px] text-slate-400 font-medium font-mono">(Max 3)</span></h2>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    {images.map((img, idx) => (
                      <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 group">
                        <img src={img.url} className="w-full h-full object-cover" alt="sample" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-500/90 text-white rounded-lg hover:bg-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {images.length < 3 && (
                      <label className="aspect-square rounded-xl border border-dashed border-slate-250 dark:border-slate-700 hover:border-amber-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-all flex flex-col items-center justify-center cursor-pointer bg-slate-50/20 dark:bg-slate-800 group">
                        <Plus className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Add Photo</span>
                        <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Additional Specifications / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about purity, sorting (baled vs loose), pickup logistics..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm font-semibold text-slate-900 dark:text-white resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-6 border-t border-slate-150 dark:border-slate-700 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 rounded-xl border border-slate-250 dark:border-slate-650 text-slate-500 font-semibold text-xs capitalize tracking-widest hover:bg-slate-50 dark:hover:bg-slate-750 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs capitalize tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 hover:scale-102 active:scale-98 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Broadcast RFQ
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
