/**
 * AvailableJobs.jsx — Job cards with AI recommendations, accept/reject
 */
import { useEffect, useState, useMemo } from 'react';
import {
  Sparkles, MapPin, Clock, Package, CheckCircle, XCircle, Users,
  RefreshCw, Loader2, Navigation, Zap, Truck, User, ArrowLeft,
  ChevronRight, Calendar, Scale, ChevronDown, Info, DollarSign,
  Search, X, SlidersHorizontal
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@klinflow/supabase';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { usePriceStore } from '@klinflow/core/stores/priceStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import type { AgentJob } from '@klinflow/core/stores/agentStore.types';
import EmptyState from '@klinflow/ui/components/EmptyState';
import { SkeletonCard } from '@klinflow/ui/components/Skeletons';

export default function AvailableJobs() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'available');
  const [weighingJob, setWeighingJob] = useState(null);
  const [weightValue, setWeightValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterMaterial, setFilterMaterial] = useState('All');
  const [filterTime, setFilterTime] = useState('All');
  const [selectedBookingType, setSelectedBookingType] = useState(location.state?.filter || 'All');

  const availableJobs = useAgentStore(s => s.availableJobs);
  const activeJobs = useAgentStore(s => s.activeJobs);
  const rejectedJobs = useAgentStore(s => s.rejectedJobs);
  const completedJobs = useAgentStore(s => s.jobHistory).filter(j => ['completed', 'verified'].includes(j.status)).slice(0, 10);
  const acceptJob = useAgentStore(s => s.acceptJob);
  const rejectJob = useAgentStore(s => s.rejectJob);
  const restoreJob = useAgentStore(s => s.restoreJob);
  const completeJob = useAgentStore(s => s.completeJob);
  const fetchAvailableJobs = useAgentStore(s => s.fetchAvailableJobs);
  const fetchActiveJobs = useAgentStore(s => s.fetchActiveJobs);
  const subscribeToJobs = useAgentStore(s => s.subscribeToJobs);
  const cleanupJobs = useAgentStore(s => s.cleanupJobs);
  const isLoadingJobs = useAgentStore(s => s.isLoadingJobs);
  const profile = useAuthStore(s => s.profile);
  const categories = useServiceStore(s => s.categories);
  const fetchCategories = useServiceStore(s => s.fetchCategories);
  const fetchEarnings = useAgentStore(s => s.fetchEarnings);
  const clearJobHistory = useAgentStore(s => s.clearJobHistory);
  const fetchPrices = usePriceStore(s => s.fetchPrices);
  const getPriceForMaterial = usePriceStore(s => s.getPriceForMaterial);

  const activeFulfillments = useFulfillmentStore(s => s.activeFulfillments);
  const fetchActiveFulfillments = useFulfillmentStore(s => s.fetchActiveFulfillments);

  const [activeTrades, setActiveTrades] = useState<any[]>([]);

  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';

  useEffect(() => {
    fetchAvailableJobs();
    fetchActiveJobs();
    fetchCategories();
    fetchEarnings();
    fetchPrices();
    if (profile?.id) {
      fetchActiveFulfillments(profile.id, 'agent');
      fetchActiveTrades();
    }
  }, [profile?.id]);

  const fetchActiveTrades = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          listing:marketplace_listings(*)
        `)
        .eq('agent_id', profile.id)
        .or('is_market_trade.eq.true,booking_type.eq.marketplace_pickup')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setActiveTrades(data);
      }
    } catch (err) {
      console.error('Fetch trades failed:', err);
    }
  };

  const handleAccept = async (job: AgentJob) => {
    try {
      const success = await acceptJob(job.id);
      if (success) {
        setActiveTab('active');
        toast.success(`Pickup accepted! 🚀`);
      } else {
        toast.error("Could not claim job");
        fetchAvailableJobs();
      }
    } catch (err) {
      toast.error("Failed to accept job");
    }
  };

  const combinedActiveJobs = useMemo(() => {
    const rfqs = activeFulfillments
      .filter(f => !['completed', 'cancelled'].includes(f.status))
      .map(f => ({
        id: f.id,
        material: f.rfq?.material_type || 'Mixed Material',
        weight_kg: (f as any).proposal?.offered_weight || (f as any).rfq?.target_quantity || 0,
        actual_weight_kg: 0,
        location: f.pickup_address,
        time: f.scheduled_time || 'ASAP',
        status: f.status === 'agent_assigned' ? 'accepted' : f.status,
        agent_id: f.assigned_agent_id || null,
        user_id: f.seller_id,
        customerName: 'Marketplace Seller',
        pay: 0,
        photo_url: null,
        photo_url: null,
        photoUrl: null,
        photos: [],
        phone: '',
        is_market_trade: false,
        booking_type: 'rfq'
      } as AgentJob));
      
    const trades = activeTrades
      .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
      .map(t => ({
        ...t,
        material: t.waste_type || t.listing?.material || 'Recyclables',
        weight_kg: t.actual_weight_kg || t.listing?.quantity || 0,
        location: t.estate,
        time: t.scheduled_time || 'ASAP',
        customerName: 'Verified Partner',
        is_market_trade: true,
        booking_type: 'marketplace_pickup'
      } as any));

    const combined = [...activeJobs, ...rfqs, ...trades];
    const uniqueIds = new Set();
    return combined.filter(job => {
      if (uniqueIds.has(job.id)) return false;
      uniqueIds.add(job.id);
      return true;
    });
  }, [activeJobs, activeFulfillments, activeTrades]);

  const combinedCompletedJobs = useMemo(() => {
    const rfqs = activeFulfillments
      .filter(f => f.status === 'completed')
      .map(f => ({
        id: f.id,
        material: f.rfq?.material_type || 'Mixed Material',

        actual_weight_kg: f.verified_weight || f.actual_weight || 0,
        location: f.pickup_address,
        time: f.scheduled_time,
        status: 'completed',
        agent_id: f.assigned_agent_id || null,
        user_id: f.seller_id,
        customerName: 'Marketplace Seller',
        pay: 0,
        photo_url: null,
        photo_url: null,
        photoUrl: null,
        photos: [],
        phone: '',
        is_market_trade: false,
        booking_type: 'rfq'
      } as AgentJob));
      
    const trades = activeTrades
      .filter(t => t.status === 'completed')
      .map(t => ({
        ...t,
        material: t.waste_type || t.listing?.material || 'Recyclables',
        weight_kg: t.actual_weight_kg || t.listing?.quantity || 0,
        location: t.estate,
        time: t.scheduled_time || 'ASAP',
        customerName: 'Verified Partner',
        is_market_trade: true,
        booking_type: 'marketplace_pickup'
      } as any));

    const combined = [...completedJobs, ...rfqs, ...trades];
    const uniqueIds = new Set();
    return combined.filter(job => {
      if (uniqueIds.has(job.id)) return false;
      uniqueIds.add(job.id);
      return true;
    });
  }, [completedJobs, activeFulfillments, activeTrades]);

  const currentJobs = activeTab === 'available'
    ? availableJobs
    : activeTab === 'active'
      ? combinedActiveJobs
      : activeTab === 'completed'
        ? combinedCompletedJobs
        : rejectedJobs.slice(0, 10);

  const filteredJobs = useMemo(() => {
    let result = currentJobs;

    if (activeTab === 'active' && selectedBookingType !== 'All') {
      result = result.filter(j => {
        if (selectedBookingType === 'RFQ') return j.booking_type === 'rfq';
        if (selectedBookingType === 'Market trades') return j.is_market_trade === true;
        if (selectedBookingType === 'Resident') return j.booking_type !== 'rfq' && j.is_market_trade !== true;
        return true;
      });
    }

    if (filterMaterial !== 'All') {
      result = result.filter(j => {
        const waste = categories.find((w) => w.slug === j.material) || categories.find((w) => w.id === j.material);
        const matName = (waste?.label || j.material || '').toLowerCase();
        return matName.includes(filterMaterial.toLowerCase());
      });
    }

    if (filterTime !== 'All') {
      result = result.filter(j => {
        if (filterTime === 'asap') return j.time?.toUpperCase() === 'ASAP';
        if (filterTime === 'scheduled') return j.time?.toUpperCase() !== 'ASAP';
        return true;
      });
    }

    if (!searchTerm) return result;
    const term = searchTerm.toLowerCase();
    return result.filter(j => {
      const waste = categories.find((w) => w.slug === j.material) || categories.find((w) => w.id === j.material);
      const matName = (waste?.label || j.material || '').toLowerCase();
      const loc = (j.location || '').toLowerCase();
      const client = (j.customerName || j.customer || '').toLowerCase();
      return matName.includes(term) || loc.includes(term) || client.includes(term);
    });
  }, [currentJobs, searchTerm, filterMaterial, filterTime, categories, activeTab, selectedBookingType]);

  const formatJobTime = (job: AgentJob) => {
    if (job.time?.toUpperCase() === 'ASAP') return 'ASAP';
    
    if (job.date) {
      const d = new Date(job.date);
      if (!isNaN(d.getTime())) {
        const dd = d.getDate();
        const mm = d.getMonth() + 1;
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        
        let formatted = `${dd}/${mm}/${yyyy}`;
        
        if (job.time && job.time.toLowerCase() !== 'scheduled' && job.time.trim() !== '') {
          let timePart = job.time;
          if (timePart.includes('@')) {
            timePart = timePart.split('@').pop()?.trim() || timePart;
          }
          // Strip any standalone YYYY-MM-DD date just in case
          timePart = timePart.replace(/\d{4}-\d{2}-\d{2}/g, '').trim();
          formatted += ` ${timePart}`;
        } else {
          formatted += ` ${hh}:${min}`;
        }
        return formatted;
      }
    }
    
    if (job.time) {
      let timePart = job.time;
      if (timePart.includes('@')) {
        const parts = timePart.split('@');
        const d = new Date(parts[0].trim());
        if (!isNaN(d.getTime())) {
          return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${parts[1]?.trim() || ''}`.trim();
        }
      }
      return timePart.toLowerCase() === 'scheduled' ? 'Scheduled' : timePart;
    }
    
    return 'Scheduled';
  };

  const TABS = isFleetDriver ? [
    { id: 'active', label: 'Dispatched', count: combinedActiveJobs.length },
    { id: 'completed', label: 'Completed', count: combinedCompletedJobs.length },
  ] : [
    { id: 'available', label: 'Requested', count: availableJobs.length },
    { id: 'active', label: 'Accepted', count: combinedActiveJobs.length },
    { id: 'completed', label: 'Completed', count: combinedCompletedJobs.length },
    { id: 'rejected', label: 'Rejected', count: rejectedJobs.length },
  ];

  useEffect(() => {
    if (isFleetDriver && (activeTab === 'available' || activeTab === 'rejected')) {
      setActiveTab('active');
    }
  }, [isFleetDriver, activeTab]);

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV (Fixed PWA Style) ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-0 px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
        <div className="flex items-center gap-3 max-w-lg mx-auto pb-2">
          <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
          </button>

          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-600 dark:text-white capitalize tracking-tighter leading-none">Pickup Missions</h1>
            <p className="text-[10px] font-bold text-slate-500 capitalize tracking-widest mt-1">view available jobs in the area</p>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 text-slate-300 hover:text-indigo-500 cursor-pointer transition-colors ${isLoadingJobs ? 'animate-spin' : ''}`} onClick={() => fetchAvailableJobs()} />
          </div>
        </div>

        {/* Compact Search Bar & Filter Toggle */}
        <div className=" flex items-center gap-2">
          <div className="relative group flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search missions or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all shrink-0 ${isFilterOpen || filterMaterial !== 'All' || filterTime !== 'All'
              ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-750'
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {(filterMaterial !== 'All' || filterTime !== 'All') && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
          </button>
        </div>

        {/* Dropdown Filters Expandable Panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <div className="p-3 grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Material</label>
                  <div className="relative">
                    <select
                      value={filterMaterial}
                      onChange={(e) => setFilterMaterial(e.target.value)}
                      className="w-full py-1.5 pl-2 pr-6 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 appearance-none focus:outline-none focus:border-indigo-500"
                    >
                      <option value="All">All Materials</option>
                      {categories.map(c => (
                        <option key={c.id || c.slug} value={c.label || c.slug}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Timing</label>
                  <div className="relative">
                    <select
                      value={filterTime}
                      onChange={(e) => setFilterTime(e.target.value)}
                      className="w-full py-1.5 pl-2 pr-6 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 appearance-none focus:outline-none focus:border-indigo-500"
                    >
                      <option value="All">All Times</option>
                      <option value="asap">ASAP (Urgent)</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs - Pill style */}
        <div className="mt-1 flex bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 py-1.5 text-[11px] font-bold capitalize tracking-widest rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === tab.id
                ? 'bg-indigo-600 shadow-sm text-white font-black'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
            >
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-px pb-12 relative max-w-lg mx-auto w-full pt-[calc(env(safe-area-inset-top,1rem)+8.5rem)]">

        {/* Accepted Pickups Filter Card */}
        {activeTab === 'active' && (
          <div className="mx-4 mt-4 mb-2 p-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {(['All', 'Resident', 'Market trades', 'RFQ'] as const).map((type) => {
                const count = currentJobs.filter(j => {
                  if (type === 'RFQ') return j.booking_type === 'rfq';
                  if (type === 'Market trades') return j.is_market_trade === true;
                  if (type === 'Resident') return j.booking_type !== 'rfq' && j.is_market_trade !== true;
                  return true;
                }).length;

                return (
                  <button
                    key={type}
                    onClick={() => setSelectedBookingType(type)}
                    className={`py-2 px-3.5 rounded-xl text-[10px] flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider transition-all shrink-0 ${
                      selectedBookingType === type
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isLoadingJobs ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />)}
          </div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            title={`No ${activeTab} missions`}
            subtitle="New jobs will appear here as they are posted in your area."
          />
        ) : (
          <AnimatePresence mode="wait">
            {expandedId ? (
              <motion.div
                key="mission-focus"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-800 overflow-y-auto no-scrollbar pb-6"
              >
                {(() => {
                  const job = currentJobs.find(j => j.id === expandedId);
                  if (!job) return null;
                  const waste = categories.find((w) => w.slug === job.material) ||
                    categories.find((w) => w.id === job.material);
                  const photoUrl = job.photoUrl || job.photo_url;
                  
                  // mock photos array if only one
                  const photos = photoUrl ? [photoUrl] : [];

                  return (
                    <div className="max-w-lg mx-auto">
                      {/* ── FIXED TOP NAV ── */}
                      <div className="fixed top-0 left-0 right-0 z-50 w-full max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
                        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
                          <button onClick={() => setExpandedId(null)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
                            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                          </button>
                          <div>
                            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Mission Details</h1>
                            <p className="text-[10px] font-bold text-indigo-500 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Pickup Request
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)]">
                        {/* ── IMAGE CAROUSEL ── */}
                        <div className="relative h-[270px] w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-900">
                          <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                            {photos.length > 0 ? photos.map((imgUrl, idx) => (
                              <div key={idx} className="w-full h-full shrink-0 snap-center">
                                <OptimizedImage src={getThumbnailUrl(imgUrl, { width: 800 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" alt={`${job.material} - View ${idx + 1}`} />
                              </div>
                            )) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800">
                                <div className="text-6xl mb-4">{waste?.icon || '📦'}</div>
                                <p className="text-[10px] font-bold text-slate-500 capitalize tracking-[0.2em]">Asset Visual Unavailable</p>
                              </div>
                            )}
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />

                          {photos.length > 1 && (
                            <>
                              <div className="absolute top-4 right-4 z-10 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                                <span>Photos ({photos.length})</span>
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                              </div>
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {photos.map((_, i) => (
                                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white shadow-lg opacity-50 first:opacity-100" />
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* ── MATERIAL SPECIFICATIONS CARD ── */}
                        <div className="bg-slate-200 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material-Type</p>
                              <h2 className="text-[16px] font-semibold text-indigo-700 dark:text-white capitalize leading-tight">
                                {waste?.label || job.material}
                              </h2>
                            </div>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
                                activeTab === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-500/20' :
                                activeTab === 'active' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-500/20' :
                                activeTab === 'rejected' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-500/20' :
                                job.time?.toUpperCase() === 'ASAP' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-500/20' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 border-indigo-200 dark:border-indigo-500/20'
                              }`}>
                              {activeTab === 'completed' ? <CheckCircle className="w-3.5 h-3.5" /> : activeTab === 'active' ? <Clock className="w-3.5 h-3.5" /> : activeTab === 'rejected' ? <XCircle className="w-3.5 h-3.5" /> : job.time?.toUpperCase() === 'ASAP' ? <Zap className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">
                                {activeTab === 'completed' ? 'completed' : activeTab === 'rejected' ? 'rejected' : formatJobTime(job)}
                              </span>
                            </div>
                          </div>

                          <hr className="border-slate-100 dark:border-slate-800/60" />

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                              <User className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Client's Name</p>
                                <p className="text-[13px] font-semibold text-slate-900 dark:text-white capitalize">{job.customerName || job.customer || 'Resident'}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Location</p>
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{job.location}</span>
                              </div>
                            </div>

                            {activeTab === 'completed' ? (
                              <>
                                <div className="flex items-start gap-3">
                                  <DollarSign className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Amount Paid</p>
                                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">KSh {(job.total_price || job.fee || job.pay || 0).toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Verified Weight</p>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">{job.actual_weight_kg || 0} KG</span>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3 col-span-2">
                                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Payment Settled</p>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">
                                      {job.completed_at
                                        ? new Date(job.completed_at).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : job.date || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-start gap-3">
                                  <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Est. Value</p>
                                    <p className="text-xs font-black text-slate-900 dark:text-white">
                                      {job.is_market_trade 
                                        ? `KSh ${Math.floor((job.weight_kg || job.actual_weight_kg || 0) * getPriceForMaterial(job.material || ''))}` 
                                        : 'Pending Verification'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Est. Load</p>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">{job.weight_kg || job.actual_weight_kg || 0} KG</span>
                                  </div>
                                </div>
                              </>
                            )}

                            <div className="flex items-start justify-between col-span-2">
                              <div className="flex items-start gap-3">
                                <Package className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pickup ID</p>
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    {job.id.slice(0, 8).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Type</p>
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  {job.is_group_pickup ? 'Group Pickup' : (job.is_market_trade || job.booking_type === 'marketplace_pickup' || job.listing_id) ? 'Seller Trade' : 'Resident Pickup'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {job.notes && (
                            <>
                              <hr className="border-slate-100 dark:border-slate-800/60" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                  <Info className="w-3.5 h-3.5" /> Description
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-350 italic">"{job.notes}"</p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 pb-8 flex gap-3">
                          {activeTab === 'available' ? (
                            <>
                              <button
                                onClick={() => { rejectJob(job.id); setExpandedId(null); }}
                                className="flex-[1] py-4 bg-red-500 text-white rounded-2xl font-black text-xs capitalize tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                <XCircle className="w-4 h-4" /> Dismiss
                              </button>
                              <button
                                onClick={() => { handleAccept(job); setExpandedId(null); }}
                                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs capitalize tracking-widest  active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                <Truck className="w-4 h-4" /> Accept Mission
                              </button>
                            </>
                          ) : activeTab === 'active' ? (
                            <button
                              onClick={() => navigate(`/jobs/navigate/${job.id}`)}
                              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs capitalize tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <Navigation className="w-4 h-4" /> Start Navigation
                            </button>
                          ) : activeTab === 'completed' ? (
                            <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black text-xs capitalize tracking-widest flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-500/20">
                              <CheckCircle className="w-4 h-4" /> Mission Completed
                            </div>
                          ) : (
                            <button
                              onClick={() => { restoreJob(job.id); setExpandedId(null); }}
                              className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs capitalize tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <RefreshCw className="w-4 h-4" /> Restore Mission
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div
                key="list-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredJobs.map((job) => {
                  const waste = categories.find((w) => w.slug === job.material) ||
                    categories.find((w) => w.id === job.material);
                  const photoUrl = job.photoUrl || job.photo_url || job.photos?.[0];
                  
                  // Determine Origin Badge and Navigation Route
                  let badgeIcon = '🏠';
                  let badgeText = 'Resident';
                  let badgeColor = 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300 border-sky-300 dark:border-sky-500/40';
                  let navRoute = `/jobs/${job.id}`;

                  if (job.booking_type === 'rfq' && job.is_group_pickup) {
                    badgeIcon = '👥';
                    badgeText = 'Group RFQ';
                    badgeColor = 'bg-blue-200 text-blue-900 dark:bg-blue-500/30 dark:text-blue-300 border-blue-400 dark:border-blue-500/50';
                    navRoute = `/pickups/${job.id}`;
                  } else if (job.booking_type === 'rfq') {
                    badgeIcon = '📋';
                    badgeText = 'RFQ';
                    badgeColor = 'bg-violet-200 text-violet-900 dark:bg-violet-500/30 dark:text-violet-300 border-violet-400 dark:border-violet-500/50';
                    navRoute = `/pickups/${job.id}`;
                  } else if (job.booking_type === 'marketplace_pickup' || job.is_market_trade) {
                    badgeIcon = '🏪';
                    badgeText = 'Trade';
                    badgeColor = 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-300 border-emerald-400 dark:border-emerald-500/50';
                    navRoute = `/trades/${job.id}`;
                  } else if (job.is_group_pickup) {
                    badgeIcon = '👥';
                    badgeText = 'Swarm';
                    badgeColor = 'bg-indigo-200 text-indigo-900 dark:bg-indigo-500/30 dark:text-indigo-300 border-indigo-400 dark:border-indigo-500/50';
                    navRoute = `/jobs/${job.id}`;
                  }

                  return (
                    <div
                      key={job.id}
                      className="bg-white dark:bg-slate-900/60 shadow-sm border-b border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer relative overflow-hidden"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        job.booking_type === 'rfq' ? 'bg-violet-500' :
                        job.booking_type === 'marketplace_pickup' || job.is_market_trade ? 'bg-emerald-500' :
                        job.is_group_pickup ? 'bg-indigo-500' :
                        'bg-blue-500'
                      }`} />
                      <div
                        onClick={() => navigate(navRoute)}
                        className="flex gap-3 pl-4 pr-3.5 py-3"
                      >
                          <div className="relative w-[72px] h-[72px] rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-2xl border border-slate-200 dark:border-slate-700">
                            {photoUrl ? (
                              <OptimizedImage src={getThumbnailUrl(photoUrl, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" alt={waste?.label || job.material} />
                            ) : (
                              waste?.icon || '📦'
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                            {/* Row 1: Material & Origin Badge */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h3 className="text-[15px] font-black text-slate-900 dark:text-white capitalize truncate tracking-tight leading-tight">{waste?.label || job.material}</h3>
                              </div>
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1.5 shrink-0 ml-2 uppercase tracking-wider ${badgeColor}`}>
                                <span className="text-sm">{badgeIcon}</span> {badgeText}
                              </span>
                            </div>

                            {/* Row 2: Location & Status */}
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1 capitalize truncate max-w-[150px]">
                                <MapPin className="w-3 h-3 text-emerald-600" /> {job.location || 'Nairobi'}
                              </p>
                              <span className={`text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-md uppercase shrink-0 ${
                                activeTab === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' :
                                activeTab === 'active' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20' :
                                activeTab === 'rejected' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20' :
                                job.time?.toUpperCase() === 'ASAP' ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20' : 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20'
                              }`}>
                                {activeTab === 'completed' ? 'completed' : activeTab === 'rejected' ? 'rejected' : formatJobTime(job)}
                              </span>
                            </div>

                            {/* Row 3: Timestamp/User & Quantity/Value */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/50 mt-1">
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0">
                                {job.booking_type === 'marketplace_pickup' || job.booking_type === 'rfq' ? (
                                  <><Zap className="w-2.5 h-2.5 text-amber-500" /> {job.weight_kg} KG Locked</>
                                ) : (
                                  <><User className="w-2.5 h-2.5 text-slate-400" /> {job.customerName || job.customer || 'Resident'}</>
                                )}
                              </p>
                              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize shrink-0">
                                <span className="text-[10px] text-slate-400 not-italic font-bold mr-1 opacity-70">Value:</span>
                                {activeTab === 'completed' 
                                  ? `KSh ${(job.total_price || job.fee || job.pay || 0).toLocaleString()}`
                                  : job.is_market_trade
                                    ? `KSh ${Math.floor((job.weight_kg || job.actual_weight_kg || 0) * getPriceForMaterial(job.material || ''))}`
                                    : 'Pending Verification'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center text-slate-300">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Clear History Button */}
        {(activeTab === 'completed' || activeTab === 'rejected') && currentJobs.length > 0 && (
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={async () => {
                if (activeTab === 'completed') {
                  await clearJobHistory();
                  fetchEarnings();
                  toast.success('Completed history cleared');
                } else {
                  rejectedJobs.forEach(j => restoreJob(j.id));
                  toast.success('Rejected history cleared');
                }
              }}
              className="w-full py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl font-bold text-xs capitalize tracking-widest border border-rose-200 dark:border-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
