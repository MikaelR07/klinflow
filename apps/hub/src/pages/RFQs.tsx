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
, TrendingUp, TrendingDown, AlertTriangle, MoreVertical, Search, FileText } from 'lucide-react';
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
  const { agentConfig, fetchAgentConfig } = useAgentStore();
  const { categories, fetchCategories, materialPrices = [], fetchMaterialPrices } = useServiceStore();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'closed' | 'cancelled'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'my' | 'market'>('my');

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

      let query = supabase.from('rfqs').select(`*, rfq_offers(count)`).order('created_at', { ascending: false });
      if (viewMode === 'my') {
        query = query.eq('buyer_id', profile.id);
      } else {
        query = query.neq('buyer_id', profile.id);
      }
      const { data, error } = await query;

      if (data) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          material: getSubcategoryLabel(r.category, r.material_grade, storeMaterials) || r.material_grade,
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
  }, [profile?.id, viewMode]);

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
    isGroupCollection: false
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
        is_group_collection: formData.isGroupCollection
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
          material: getSubcategoryLabel(r.category, r.material_grade, materialPrices) || r.material_grade,
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
        notes: '',
        isGroupCollection: false
      });
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to broadcast RFQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- MOCK DATA FOR CHARTS ---
  const sentVsAcceptedData = [
    { name: 'Mon', sent: 4, accepted: 2 },
    { name: 'Tue', sent: 7, accepted: 3 },
    { name: 'Wed', sent: 5, accepted: 4 },
    { name: 'Thu', sent: 12, accepted: 8 },
    { name: 'Fri', sent: 8, accepted: 6 },
    { name: 'Sat', sent: 3, accepted: 2 },
    { name: 'Sun', sent: 5, accepted: 4 },
  ];

  const materialDonutData = [
    { name: 'PET Flakes', value: 45 },
    { name: 'Aluminium', value: 25 },
    { name: 'OCC Paper', value: 20 },
    { name: 'Glass', value: 10 },
  ];
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

  const actionNeeded = [
    { id: 'RFQ-2041', material: 'Mixed Glass', weight: '120kg', issue: 'Closes in 2 hrs - 1 bid', urgency: 'high' },
    { id: 'RFQ-1988', material: 'PET Bottles', weight: '500kg', issue: 'Price 18% above market', urgency: 'medium' },
    { id: 'RFQ-2022', material: 'OCC Paper', weight: '2000kg', issue: 'Awaiting approval', urgency: 'low' },
  ];

  const marketFlow = [
    { material: 'PET Plastic', trend: 'up', percentage: '8%' },
    { material: 'OCC Paper', trend: 'up', percentage: '4%' },
    { material: 'Aluminium', trend: 'down', percentage: '2%' },
    { material: 'Clear Glass', trend: 'up', percentage: '12%' },
  ];



  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">

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

      
      {/* ── ROW 1: KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { name: 'Total Broadcasted', value: stats.total, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { name: 'Open RFQs', value: stats.open, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { name: 'Pending Review', value: 8, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { name: 'Fulfilled RFQs', value: stats.fulfilled, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { name: 'Seller Responses', value: stats.totalBids, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { name: 'RFQ Value (Week)', value: 'KSh 1.24M', color: 'text-rose-500', bg: 'bg-rose-500/10' },
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

      {/* ── ROW 2: ANALYSIS CARDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mt-6">
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
            <ResponsiveContainer width="100%" height="100%">
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
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
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
              <ResponsiveContainer width="100%" height="100%">
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

        {/* Action Needed */}
        <div className="bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-xl shadow-none flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e0e3eb] dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
            <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Action Needed
            </h3>
            <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">View All</button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[220px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">RFQ & Material</th>
                  <th className="px-5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weight</th>
                  <th className="px-5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {actionNeeded.map((action, i) => (
                  <tr key={i} className="hover:bg-white dark:hover:bg-slate-800/30 transition-colors cursor-pointer group">
                    <td className="px-5 py-3">
                      <p className="text-xs font-bold text-[#131722] dark:text-white group-hover:text-blue-500 transition-colors">{action.id}</p>
                      <p className="text-[10px] text-slate-500">{action.material}</p>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-slate-700 dark:text-slate-300">{action.weight}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        action.urgency === 'high' ? 'bg-rose-500/10 text-rose-600' :
                        action.urgency === 'medium' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-blue-500/10 text-blue-600'
                      }`}>
                        {action.issue}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── ROW 3: MAIN RFQ TABLE & SIDEBAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 !mt-2">
        
        {/* Left Col: Main RFQ Table */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-[1rem] shadow-none flex flex-col overflow-hidden">
          
          {/* Top Section: View Mode & Search */}
          <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white dark:bg-slate-900">
            {/* Left: View Tabs */}
            <div className="flex items-center justify-start">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit shrink-0">
                <button
                  onClick={() => setViewMode('my')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'my' ? 'bg-white dark:bg-slate-700 text-[#131722] dark:text-white shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  My RFQs
                </button>
                <button
                  onClick={() => setViewMode('market')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'market' ? 'bg-white dark:bg-slate-700 text-[#131722] dark:text-white shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Market RFQs
                </button>
              </div>
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
              {viewMode === 'my' && (
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
              )}
            </div>
          </div>

          {/* Table Data */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead className="bg-white dark:bg-slate-800/50 border-b border-[#e0e3eb] dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">RFQ & Material</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Details</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pricing</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bids & Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredRFQs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
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
                          <p className="text-xs font-bold text-blue-600 mb-0.5">{rfq.id.substring(0, 8).toUpperCase()}</p>
                          <p className="text-sm font-bold text-[#131722] dark:text-white">{rfq.material}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{rfq.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-slate-400" /> {rfq.quantity}
                        </p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {rfq.location}
                        </p>
                        <p className="text-xs font-medium text-rose-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {rfq.deadline || 'No deadline'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Price</p>
                      <p className="text-sm font-black text-[#131722] dark:text-white">KSh {rfq.targetPrice} <span className="text-xs font-medium text-slate-400">/kg</span></p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          {rfq.bidsCount} Bids <span className="text-slate-400 font-normal">received</span>
                        </p>
                        <div className="flex gap-1 items-center">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i < Math.min(rfq.bidsCount, 5) ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/marketplace/rfqs/${rfq.id}`)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#131722] dark:text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        View Bids
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Market Flow */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-[1rem] p-5 shadow-none">
            <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Market Flow
            </h3>
            <div className="space-y-4">
              {marketFlow.map((flow, idx) => (
                <div key={idx} className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                  <div>
                    <p className="text-xs font-bold text-[#131722] dark:text-white">{flow.material}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">High Volume</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold ${flow.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {flow.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {flow.percentage}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors uppercase tracking-widest">
              View All Trends
            </button>
          </div>

          <div className="bg-blue-600 rounded-[1rem] p-6 text-white shadow-none relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-sm font-bold mb-2">New Market RFQs Available</h3>
              <p className="text-xs text-blue-100 mb-4 opacity-90 leading-relaxed">
                12 new opportunities matching your usual material requirements have been posted.
              </p>
              <button className="text-xs font-bold bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2">
                View Opportunities <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <Package className="absolute -bottom-4 -right-4 w-32 h-32 text-blue-500/30" />
          </div>
        </div>
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
      </div>
    </div>
  );  
}
