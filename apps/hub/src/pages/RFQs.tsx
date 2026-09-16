import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore, NOTIFICATION_TYPES } from '@klinflow/core/stores/notificationStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Receipt, Plus,Filter, Clock, CheckCircle2, XCircle,
  MapPin, Scale, MessageSquare, DollarSign, Calendar, Info, Trash2, ArrowRight, Package, X, ImageIcon, Timer
, TrendingUp, TrendingDown, AlertTriangle, MoreVertical, Search, FileText,Truck, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@klinflow/supabase';
import { compressImage, getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';

const getSubcategoryLabel = (catId: string, subId: string, materialPrices: any[]) => {
  // If subId is already a human readable name (contains space or capital letter), just return it
  if (subId && (subId.includes(' ') || /[A-Z]/.test(subId))) {
    return subId;
  }
  const sub = materialPrices.find(m => `${catId}_${m.id}` === subId || m.id === subId);
  return sub ? sub.material_name : subId;
};

export default function RFQs() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const currentCompanyId = useAuthStore(s => s.currentCompanyId);
  const { agentConfig, fetchAgentConfig } = useAgentStore();
  const { categories, fetchCategories, materialPrices = [], fetchMaterialPrices } = useServiceStore();
  const [myRfqs, setMyRfqs] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'closed' | 'cancelled'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // 1. Fetch data & Realtime subscription
  useEffect(() => {
    fetchAgentConfig();
    fetchCategories();
    if (fetchMaterialPrices) fetchMaterialPrices();

    const fetchRFQs = async () => {
      if (!profile?.id) return;

      let storeMaterials = useServiceStore.getState().materialPrices;
      if (!storeMaterials || storeMaterials.length === 0) {
        if (useServiceStore.getState().fetchMaterialPrices) {
          await useServiceStore.getState().fetchMaterialPrices();
          storeMaterials = useServiceStore.getState().materialPrices;
        }
      }

      setIsLoading(true);
      let queryMy = supabase.from('rfqs').select(`*, rfq_offers(count)`);
      if (currentCompanyId) {
        queryMy = queryMy.eq('company_id', currentCompanyId);
      } else {
        queryMy = queryMy.eq('buyer_id', profile.id);
      }
      queryMy = queryMy.order('created_at', { ascending: false });

      const { data: myResData } = await queryMy;

      const mapData = (data: any[]) => data.map((r: any) => ({
          id: r.id,
          trackingId: r.id.split('-')[0].toUpperCase(),
          material: getSubcategoryLabel(r.category, r.material_grade, storeMaterials) || r.material_grade,
          category: r.category,
          quantity: `${r.requested_weight} ${r.weight_unit || 'kg'}`,
          rawWeight: parseFloat(r.requested_weight) || 0,
          targetPrice: r.target_price || 0,
          location: r.pickup_area,
          status: r.status === 'open' ? 'pending' : r.status,
          createdAt: new Date(r.created_at).toLocaleString(),
          rawDate: r.created_at,
          bidsCount: r.rfq_offers?.[0]?.count || 0,
          deadline: r.deadline ? new Date(r.deadline).toLocaleString() : '',
          rawDeadline: r.deadline,
          description: r.notes || '',
          deliveryMethod: r.delivery_method || 'Flexible'
      }));

      if (myResData) setMyRfqs(mapData(myResData));
      setIsLoading(false);
    };

    fetchRFQs();

    // 2. Realtime listener for offers
    if (profile?.id) {
      const channel = supabase.channel('my_incoming_offers')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'rfq_offers',
          filter: `buyer_id=eq.${currentCompanyId || profile.id}`
        }, (payload) => {
          toast.info('New Bid Received!', { description: 'A seller has sent a proposal for your RFQ.' });
          fetchRFQs();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.id, currentCompanyId]);

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
    notes: '',
    isGroupCollection: false,
    visibilityScope: 'global'
  });


  const activeCategories = useMemo(() => {
    const rawMaterials = agentConfig?.accepted_materials;
    if (!rawMaterials || !Array.isArray(rawMaterials) || rawMaterials.length === 0) {
      return categories;
    }
    const acceptedSlugs = rawMaterials.map((item: any) => {
      if (!item) return '';
      if (typeof item === 'string') return item.toLowerCase();
      if (typeof item === 'object') return (item.id || item.name || '').toLowerCase();
      return '';
    }).filter(Boolean);
    if (acceptedSlugs.length === 0) return categories;
    return categories.filter(cat => acceptedSlugs.includes(cat.slug || cat.id));
  }, [agentConfig, categories]);

  const subcategories = useMemo(() => {
    const cat = activeCategories.find(c => (c.slug || c.id) === formData.category);
    if (!cat) return [];
    return materialPrices.filter(m => m.category === cat.id || m.category === cat.slug || m.category === cat.label).map(m => ({
      id: `${cat.slug || cat.id}_${m.id}`,
      label: m.material_name,
      name: m.material_name
    }));
  }, [formData.category, activeCategories, materialPrices]);

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

  const displayRfqs = myRfqs;
  const filteredRFQs = displayRfqs.filter(rfq => {
    const matchesFilter = rfq.status === filter;
    const matchesSearch = rfq.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) || 
      rfq.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const isThisWeek = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    return d >= weekStart;
  };

  // Calculate Pipeline statistics for all time
  const stats = useMemo(() => {
    const total = myRfqs.length;
    const open = myRfqs.filter(q => q.status === 'pending').length;
    const fulfilled = myRfqs.filter(q => q.status === 'accepted' || q.status === 'fulfilled').length;
    const pendingReviews = myRfqs.filter(q => q.status === 'pending' && q.bidsCount > 0).length;
    const totalBids = myRfqs.reduce((acc, q) => acc + q.bidsCount, 0);
    const totalValue = myRfqs.reduce((acc, q) => acc + (q.targetPrice * q.rawWeight), 0);
    
    const formatKSh = (num: number) => {
      return `KSh ${num.toLocaleString()}`;
    };

    return { total, open, fulfilled, pendingReviews, totalBids, totalValue: formatKSh(totalValue) };
  }, [myRfqs]);

  // Actions state
  const [actionModal, setActionModal] = useState<{ isOpen: boolean, type: 'cancel' | 'deadline', rfqId: string }>({ isOpen: false, type: 'cancel', rfqId: '' });
  const [newDeadlinePreset, setNewDeadlinePreset] = useState<number>(48);
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [newDeadlineTime, setNewDeadlineTime] = useState('');

  const handleExecuteAction = async () => {
    if (actionModal.type === 'cancel') {
      const { error } = await supabase.from('rfqs').update({ status: 'cancelled' }).eq('id', actionModal.rfqId);
      if (error) { toast.error('Failed to cancel RFQ'); return; }
      toast.success('RFQ Cancelled');
    } else {
      let deadlineTimestamp;
      if (newDeadlineDate && newDeadlineTime) {
        deadlineTimestamp = new Date(`${newDeadlineDate}T${newDeadlineTime}`).toISOString();
      } else {
        const d = new Date();
        d.setHours(d.getHours() + newDeadlinePreset);
        deadlineTimestamp = d.toISOString();
      }
      const { error } = await supabase.from('rfqs').update({ deadline: deadlineTimestamp }).eq('id', actionModal.rfqId);
      if (error) { toast.error('Failed to update deadline'); return; }
      toast.success('Deadline Extended successfully');
    }
    setActionModal({ isOpen: false, type: 'cancel', rfqId: '' });
    // Refetch rfqs...
    const fetchEvent = new CustomEvent('refetch_rfqs');
    document.dispatchEvent(fetchEvent); // Quick hack to avoid moving fetchRFQs to top, wait, better: just update state.
    setMyRfqs(prev => prev.map(r => r.id === actionModal.rfqId ? { ...r, status: actionModal.type === 'cancel' ? 'cancelled' : r.status } : r));
    // It's fine to just refresh the page or manually update the state.
    setTimeout(() => window.location.reload(), 1000);
  };

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
        if (!timeStr) return"00:00";
        if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) return timeStr;
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!match) return"00:00";
        let hours = parseInt(match[1], 10);
        if (match[3] && match[3].toUpperCase() ==="PM" && hours < 12) hours += 12;
        if (match[3] && match[3].toUpperCase() ==="AM" && hours === 12) hours = 0;
        return `${hours.toString().padStart(2,"0")}:${match[2]}`;
      };

      const deadlineDateObj = new Date(`${formData.deadlineDate}T${parseTime(formData.deadlineTime)}`);
      const insertPayload: any = {
        buyer_id: profile!.id,
        company_id: currentCompanyId || null,
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
        status: 'open',
        is_group_collection: formData.isGroupCollection,
        visibility_scope: formData.visibilityScope
      };

      const { data: insertData, error: insertError } = await supabase.from('rfqs').insert(insertPayload).select();

      if (insertError) throw insertError;

      // Broadcast Notification to all sellers (client role)
      const materialLabel = getSubcategoryLabel(formData.category, formData.materialName, materialPrices) || formData.materialName;
      await useNotificationStore.getState().addNotification(
        'New Market Request 🔔',
        `A fleet is requesting ${formData.weight}kg of ${materialLabel} in ${formData.pickupArea}.`,
        NOTIFICATION_TYPES.INFO,
        'seller',
        null
      );

      const r = insertData?.[0];
      if (r) {
        const newRFQ = {
          id: r.id,
          trackingId: r.id.split('-')[0].toUpperCase(),
          material: getSubcategoryLabel(r.category, r.material_grade, materialPrices) || r.material_grade,
          category: r.category,
          quantity: `${r.requested_weight} ${r.weight_unit || 'kg'}`,
          rawWeight: parseFloat(r.requested_weight) || 0,
          targetPrice: r.target_price || 0,
          location: r.pickup_area,
          status: 'pending',
          createdAt: new Date(r.created_at).toLocaleString(),
          rawDate: r.created_at,
          bidsCount: 0,
          deadline: r.deadline ? new Date(r.deadline).toLocaleString() : '',
          rawDeadline: r.deadline,
          description: r.notes || '',
          deliveryMethod: r.delivery_method || 'Flexible'
        };
        setMyRfqs(prev => [newRFQ, ...prev]);
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
        notes: '',
        isGroupCollection: false,
        visibilityScope: 'global'
      });
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to broadcast RFQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DYNAMIC DATA FOR CHARTS ---
  const sentVsAcceptedData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(name => ({ name, sent: 0, accepted: 0 }));
    myRfqs.filter(r => r.rawDate && isThisWeek(r.rawDate)).forEach(r => {
      const d = new Date(r.rawDate);
      const dayName = days[d.getDay()];
      const dayData = data.find(x => x.name === dayName);
      if (dayData) {
        dayData.sent++;
        if (r.status === 'accepted' || r.status === 'fulfilled') dayData.accepted++;
      }
    });

    let runningSent = 0;
    let runningAccepted = 0;
    data.forEach(d => {
      runningSent += d.sent;
      runningAccepted += d.accepted;
      d.sent = runningSent;
      d.accepted = runningAccepted;
    });

    return data;
  }, [myRfqs]);

  const materialDonutData = useMemo(() => {
    const counts: Record<string, number> = {};
    myRfqs.filter(r => r.rawDate && isThisWeek(r.rawDate)).forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.keys(counts).map(k => ({
      name: k,
      value: total > 0 ? Math.round((counts[k] / total) * 100) : 0
    })).filter(x => x.value > 0).slice(0, 4);
  }, [myRfqs]);
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

  const expiringRFQs = useMemo(() => {
    return myRfqs.filter(r => r.status === 'pending' && r.rawDeadline).sort((a, b) => new Date(a.rawDeadline).getTime() - new Date(b.rawDeadline).getTime()).slice(0, 5);
  }, [myRfqs]);



  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-2">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[#131722] dark:text-white leading-none">RFQ Requests</h1>
            <span className="font-medium px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs uppercase tracking-wider">Fleet Sourcing</span>
          </div>
          <p className="font-medium text-sm text-slate-500 dark:text-slate-400 tracking-tight">
            Broadcast request for quotes (RFQs) and source materials directly from local sellers for {profile?.companyName}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/marketplace/rfqs/responses')}
            className="relative p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 text-slate-500 hover:text-blue-600 transition-colors shadow-sm group"
            title="View RFQ Responses"
          >
            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900"></div>
          </button>
          
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, pickupArea: profile?.location?.estate || profile?.estate || prev.pickupArea }));
              setIsModalOpen(true);
            }}
            className="font-medium bg-primary text-white dark:text-[#131722] px-4 py-3 rounded-xl text-xs capitalize tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-102 active:scale-98 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Broadcast New RFQ
          </button>
        </div>
      </div>

      
      {/* ── ROW 1: KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { name: 'Total Broadcasted', value: stats.total, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { name: 'Open RFQs', value: stats.open, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { name: 'Pending Review', value: stats.pendingReviews, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { name: 'Fulfilled RFQs', value: stats.fulfilled, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { name: 'Seller Responses', value: stats.totalBids, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { name: 'Total RFQ Value', value: stats.totalValue, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-xl p-4 shadow-none flex flex-col justify-between hover:shadow-none transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.name}</p>
              <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                <Receipt className={`w-4 h-4 ${item.color}`} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#131722] dark:text-white leading-none">{item.value}</h3>
          </div>
        ))}
      </div>

      {/* ── ROW 2: MAIN RFQ TABLE & SIDEBAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 mt-6">
        
        {/* Left Col: Main RFQ Table */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-[1rem] shadow-none flex flex-col overflow-hidden">
          
          {/* Top Section: View Mode & Search */}
          <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white dark:bg-slate-900">
            {/* Left: Analytics Toggle */}
            <div className="flex items-center justify-start">
              <button 
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${showAnalytics ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
              >
                <TrendingUp className="w-4 h-4" /> Analytics
              </button>
            </div>

            {/* Center: Search */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search RFQs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all shadow-none"
                />
              </div>
            </div>

            {/* Right: Status Filter */}
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800/50 p-1 rounded-xl w-fit border border-[#e0e3eb] dark:border-slate-700/50 overflow-x-auto no-scrollbar shrink-0">
                {['pending', 'accepted', 'closed', 'cancelled'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filter === tab ? 'bg-slate-200 dark:bg-slate-700 text-[#131722] dark:text-white shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    {tab === 'pending' ? 'Open' : tab === 'accepted' ? 'Fulfilled' : tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Data */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead className="bg-white dark:bg-slate-800/50 border-b border-[#e0e3eb] dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">RFQ & Material</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volume & Delivery</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deadline</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pricing</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bids & Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center">
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <h3 className="text-sm font-bold text-[#131722] dark:text-white uppercase tracking-widest">Loading...</h3>
                    </td>
                  </tr>
                ) : filteredRFQs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-sm font-bold text-[#131722] dark:text-white uppercase tracking-widest">No RFQs Found</h3>
                    </td>
                  </tr>
                ) : filteredRFQs.map(rfq => (
                  <tr key={rfq.id} className="hover:bg-white dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                           <Package className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-600 mb-0.5">RFQ ID: {rfq.trackingId}</p>
                          <p className="text-sm font-bold text-[#131722] dark:text-white">{rfq.material}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{rfq.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {rfq.quantity}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 capitalize">
                            <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {rfq.deliveryMethod || 'Flexible'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {rfq.location}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-rose-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {rfq.deadline || 'No deadline'}
                        </p>
                      </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-[#131722] dark:text-white">KSh {rfq.targetPrice.toLocaleString()} <span className="text-xs font-medium text-slate-400">/kg</span></p>
                      <p className="text-[10px] font-bold text-emerald-600 mt-1">Total: KSh {(rfq.targetPrice * rfq.rawWeight).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold flex items-center gap-1 ${rfq.bidsCount > 0 && rfq.status === 'pending' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {rfq.bidsCount} Bids <span className={`${rfq.bidsCount > 0 && rfq.status === 'pending' ? 'text-blue-400 dark:text-blue-500' : 'text-slate-400'} font-normal`}>received</span>
                          </p>
                          {rfq.bidsCount > 0 && (
                            <span className="relative flex h-2 w-2">
                              {rfq.status === 'pending' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${rfq.status === 'pending' ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 items-center">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i < Math.min(rfq.bidsCount, 5) ? (rfq.status === 'pending' ? 'bg-blue-500' : 'bg-slate-400') : 'bg-slate-200 dark:bg-slate-700'}`} />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/marketplace/rfqs/${rfq.id}`)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          rfq.status !== 'pending'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent'
                            : rfq.bidsCount > 0 
                              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md border border-blue-500 ring-4 ring-blue-500/20' 
                              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-transparent'
                        }`}
                      >
                        {rfq.status !== 'pending' ? 'View Details' : rfq.bidsCount > 0 ? 'Review Offers' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Action Needed & Promos */}
        <div className="lg:col-span-1 space-y-6">


          <div className="bg-blue-600 rounded-[1rem] p-6 text-white shadow-none relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-sm font-bold mb-2">New Market RFQs</h3>
              <p className="text-xs text-blue-100 mb-4 opacity-90 leading-relaxed">
                Integration from Business App to Hub is coming soon.
              </p>
              <button disabled className="text-xs font-bold bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed">
                Coming Soon <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <Package className="absolute -bottom-4 -right-4 w-32 h-32 text-blue-500/30" />
          </div>
        </div>
      </div>

      {/* ── ROW 3: ANALYSIS CARDS ── */}
      {showAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-6 animate-fade-in">
        {/* Chart 1: Sent vs Accepted */}
        <div className="bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-xl p-5 shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#131722] dark:text-white">RFQs Sent vs Accepted</h3>
            <select className="text-xs bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-md px-2 py-1 text-slate-600 outline-none">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-48 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={sentVsAcceptedData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} domain={[0, (dataMax: number) => Math.max(10, dataMax)]} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" />
                <Area type="monotone" dataKey="accepted" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAccepted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Material Donut */}
        <div className="bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-xl p-5 shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#131722] dark:text-white">Response by Material</h3>
            <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4"/></button>
          </div>
          <div className="flex-1 flex items-center gap-2">
            
            {/* Custom Legend on the Left */}
            <div className="w-2/5 flex flex-col justify-center space-y-3">
              {materialDonutData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div>
                    <p className="text-[10px] font-bold text-[#131722] dark:text-white leading-none line-clamp-1">{entry.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{entry.value}%</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Donut Chart on the Right */}
            <div className="w-3/5 flex items-center justify-center relative h-[220px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie data={materialDonutData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {materialDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total</span>
                <span className="text-xl font-black text-[#131722] dark:text-white">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

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
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-[1rem] overflow-hidden border border-slate-150 dark:border-slate-700/60"
            >
              {/* Header */}
              <div className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="font-medium w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#131722] dark:text-white tracking-tight leading-none">Broadcast New RFQ</h3>
                    <p className="font-medium text-xs text-slate-400 mt-1.5 tracking-tight">Source recyclable materials from local networks.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="font-medium w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 transition-all active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateRFQ} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="font-medium block text-xs text-slate-400 uppercase tracking-widest ml-1">Material Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value, materialName: '' })}
                      className="font-medium w-full h-12 bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl px-4 text-sm text-[#131722] dark:text-white"
                      required
                    >
                      <option value="">Select Category</option>
                      {activeCategories.map(cat => (
                        <option key={cat.id} value={cat.slug || cat.id}>{cat.label || cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Material Name / Grade */}
                  <div className="space-y-2">
                    <label className="font-medium block text-xs text-slate-400 uppercase tracking-widest ml-1">Material Type</label>
                    {formData.category ? (
                      <select
                        value={formData.materialName}
                        onChange={(e) => {
                          const selectedSub = e.target.value;
                          const customRates = (agentConfig?.custom_rates || {}) as Record<string, any>;
                          const price = customRates[selectedSub] || customRates[formData.category] || '';
                          setFormData({ ...formData, materialName: selectedSub, price: price ? String(price) : '' });
                        }}
                        className="font-medium w-full h-12 bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl px-4 text-sm text-[#131722] dark:text-white"
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
                        className="font-medium w-full h-12 bg-slate-100 dark:bg-slate-750/30 border border-[#e0e3eb] dark:border-slate-700 rounded-xl px-4 text-sm text-slate-400 cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Weight Requested */}
                  <div className="space-y-2">
                    <label className="font-medium block text-xs text-slate-400 uppercase tracking-widest ml-1">Requested Weight (kg)</label>
                    <div className="relative">
                      <Scale className="font-medium absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        placeholder="e.g. 1500"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="font-medium w-full h-12 bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl pl-12 pr-4 text-sm text-[#131722] dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Target Price */}
                  <div className="space-y-2">
                    <label className="font-medium block text-xs text-slate-400 uppercase tracking-widest ml-1">Target Price (KSh / kg)</label>
                    <div className="relative">
                      <DollarSign className="font-medium absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        placeholder="e.g. 25"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="font-medium w-full h-12 bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl pl-12 pr-4 text-sm text-[#131722] dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Pickup Area */}
                  <div className="space-y-2">
                    <label className="font-medium block text-xs text-slate-400 uppercase tracking-widest ml-1">Pickup Area / Region</label>
                    <div className="relative">
                      <MapPin className="font-medium absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Kasarani, Nairobi"
                        value={formData.pickupArea}
                        onChange={(e) => setFormData({ ...formData, pickupArea: e.target.value })}
                        className="font-medium w-full h-12 bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl pl-12 pr-4 text-sm text-[#131722] dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Delivery Method Selector */}
                  <div className="space-y-2 col-span-2 mt-2 pt-4 border-t border-[#e0e3eb] dark:border-slate-750">
                    <label className="font-medium block text-xs text-slate-400 uppercase tracking-widest ml-1">Delivery Method</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, deliveryMethod: 'agent_pickup' })}
                        className={`h-12 text-sm rounded-xl border transition-all ${formData.deliveryMethod === 'agent_pickup'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-none'
                          : 'bg-white dark:bg-slate-800 border-[#e0e3eb] dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                          }`}
                      >
                        We Pick Up
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, deliveryMethod: 'self_drop' })}
                        className={`h-12 text-sm rounded-xl border transition-all ${formData.deliveryMethod === 'self_drop'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-none'
                          : 'bg-white dark:bg-slate-800 border-[#e0e3eb] dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                          }`}
                      >
                        You Drop Off
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, deliveryMethod: 'flexible' })}
                        className={`h-12 text-sm rounded-xl border transition-all ${formData.deliveryMethod === 'flexible'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-none'
                          : 'bg-white dark:bg-slate-800 border-[#e0e3eb] dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                          }`}
                      >
                        Flexible
                      </button>
                    </div>
                  </div>

                  {/* Deadline Date & Time */}
                  <div className="space-y-2">
                    <label className="font-medium block text-xs text-slate-400 uppercase tracking-widest ml-1">Deadline Date & Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={formData.deadlineDate}
                        onChange={(e) => setFormData({ ...formData, deadlineDate: e.target.value })}
                        className="font-medium w-full h-12 bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl px-4 text-sm text-[#131722] dark:text-white"
                        required
                      />
                      <input
                        type="time"
                        value={formData.deadlineTime}
                        onChange={(e) => setFormData({ ...formData, deadlineTime: e.target.value })}
                        className="font-medium w-full h-12 bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl px-4 text-sm text-[#131722] dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Group Collection Toggle */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex items-start gap-3 shadow-none h-full">
                    <div className="pt-0.5">
                      <div
                        onClick={() => setFormData(prev => ({ ...prev, isGroupCollection: !prev.isGroupCollection }))}
                        className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${formData.isGroupCollection ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-none transform transition-transform ${formData.isGroupCollection ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#131722] dark:text-emerald-100 uppercase tracking-wider">Group Collection</h3>
                      <p className="font-medium text-[10px] text-slate-500 dark:text-emerald-200/70 leading-relaxed mt-0.5">
                        Allow multiple sellers to fulfill this volume.
                      </p>
                    </div>
                  </div>

                  {/* Visibility Scope Toggle */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 flex items-start gap-3 shadow-none h-full">
                    <div className="pt-0.5">
                      <div
                        onClick={() => setFormData(prev => ({ ...prev, visibilityScope: prev.visibilityScope === 'global' ? 'local' : 'global' }))}
                        className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${formData.visibilityScope === 'local' ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-none transform transition-transform ${formData.visibilityScope === 'local' ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#131722] dark:text-blue-100 uppercase tracking-wider">Local Territory Only</h3>
                      <p className="font-medium text-[10px] text-slate-500 dark:text-blue-200/70 leading-relaxed mt-0.5">
                        Restrict visibility to sellers within your mapped polygon.

                      </p>
                    </div>
                  </div>
                </div>

                {/* Image Upload Area */}
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-lg border border-slate-150 dark:border-slate-700/50 shadow-none space-y-3">
                  <div className="flex items-center gap-2 border-b border-[#e0e3eb] dark:border-slate-750 pb-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <h2 className="text-xs font-semibold text-[#131722] dark:text-slate-200 uppercase tracking-wider">Sample Images <span className="text-[10px] text-slate-400 font-medium font-mono">(Max 3)</span></h2>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    {images.map((img, idx) => (
                      <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-[#e0e3eb] dark:border-slate-700 bg-white dark:bg-slate-800 group">
                        <OptimizedImage src={img.url} className="w-full h-full object-cover" wrapperClassName="w-full h-full" alt="sample" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="font-medium absolute top-1 right-1 p-1 bg-rose-500/90 text-white rounded-lg hover:bg-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {images.length < 3 && (
                      <label className="aspect-square rounded-xl border border-dashed border-slate-250 dark:border-slate-700 hover:border-amber-500/50 hover:bg-white dark:hover:bg-slate-850/50 transition-all flex flex-col items-center justify-center cursor-pointer bg-white/20 dark:bg-slate-800 group">
                        <Plus className="font-medium w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                        <span className="font-medium text-[8px] text-slate-400 uppercase tracking-widest mt-1.5">Add Photo</span>
                        <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <label className="font-medium block text-xs text-slate-400 uppercase tracking-widest ml-1">Additional Specifications / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about purity, sorting (baled vs loose), pickup logistics..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="font-medium w-full bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl p-4 text-sm text-[#131722] dark:text-white resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-6 border-t border-slate-150 dark:border-slate-700 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="font-medium px-6 py-3 rounded-xl border border-slate-250 dark:border-slate-650 text-slate-500 text-xs capitalize tracking-widest hover:bg-white dark:hover:bg-slate-750 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="font-medium px-8 py-3 bg-emerald-600 text-white rounded-xl text-xs capitalize tracking-widest  flex items-center gap-2 hover:scale-102 active:scale-98 disabled:opacity-50 transition-all"
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

      {/* ── ACTION MODAL ── */}
      <AnimatePresence>
        {actionModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActionModal({ isOpen: false, type: 'cancel', rfqId: '' })} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-150 dark:border-slate-700/60 p-6">
              <h3 className="text-lg font-bold text-[#131722] dark:text-white mb-2">
                {actionModal.type === 'cancel' ? 'Cancel RFQ' : 'Extend Deadline'}
              </h3>
              
              {actionModal.type === 'cancel' ? (
                <p className="text-sm text-slate-500 mb-6">Are you sure you want to cancel this RFQ? Sellers will no longer be able to bid on it.</p>
              ) : (
                <div className="space-y-4 mb-6">
                  <p className="text-sm text-slate-500">Choose how long to extend the deadline:</p>
                  <div className="flex gap-2">
                    {[24, 48, 72].map(hrs => (
                      <button key={hrs} type="button" onClick={() => { setNewDeadlinePreset(hrs); setNewDeadlineDate(''); setNewDeadlineTime(''); }} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${newDeadlinePreset === hrs && !newDeadlineDate ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-emerald-300'}`}>
                        +{hrs} hrs
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Or set custom date/time</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={newDeadlineDate} onChange={e => setNewDeadlineDate(e.target.value)} className="w-full h-10 bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg px-3 text-sm" />
                      <input type="time" value={newDeadlineTime} onChange={e => setNewDeadlineTime(e.target.value)} className="w-full h-10 bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg px-3 text-sm" />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2">
                    <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Note: If the RFQ is still not dealt with after the extended time, it will be automatically removed from the system.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setActionModal({ isOpen: false, type: 'cancel', rfqId: '' })} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="button" onClick={handleExecuteAction} className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors ${actionModal.type === 'cancel' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                  {actionModal.type === 'cancel' ? 'Confirm Cancel' : 'Extend'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );  
}
