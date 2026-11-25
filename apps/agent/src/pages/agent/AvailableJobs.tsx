/**
 * AvailableJobs.jsx — Job cards with AI recommendations, accept/reject
 */
import { useEffect, useState, useMemo } from 'react';
import {
  Sparkles, MapPin, Clock, Package, CheckCircle, XCircle, Users,
  RefreshCw, Loader2, Navigation, Zap, Truck, User, ArrowLeft,
  ChevronRight, Calendar, Scale, ChevronDown, Info, DollarSign,
  Search, X, SlidersHorizontal, Home, FileText, Store
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
  const [requestedTab, setRequestedTab] = useState<'available' | 'rejected'>('available');
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
        toast.success(`Pickup accepted!`);
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
    ? (requestedTab === 'available' ? availableJobs : rejectedJobs.slice(0, 10))
    : activeTab === 'active'
      ? combinedActiveJobs
      : combinedCompletedJobs;

  const filteredJobs = useMemo(() => {
    let result = currentJobs;

    if ((activeTab === 'active' || activeTab === 'completed') && selectedBookingType !== 'All') {
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
    { id: 'available', label: 'Requested', count: availableJobs.length + rejectedJobs.length },
    { id: 'active', label: 'Accepted', count: combinedActiveJobs.length },
    { id: 'completed', label: 'Completed', count: combinedCompletedJobs.length },
  ];

  useEffect(() => {
    if (isFleetDriver && activeTab === 'available') {
      setActiveTab('active');
    }
  }, [isFleetDriver, activeTab]);

  return (
    <div className="flex flex-col bg-white dark:bg-slate-800 transition-colors min-h-screen">
      {/* ── TOP NAV (Fixed PWA Style) ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2.5 px-3 border-b border-slate-200/80 dark:border-slate-800 max-w-lg mx-auto">
        <div className="space-y-2.5">
          <div className="relative flex items-center justify-between min-h-[40px]">
            <button onClick={() => navigate(-1)} className="p-2.5 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center active:scale-90 transition-all z-10">
              <ArrowLeft className="w-4 h-4 text-slate-800 dark:text-white" />
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">Pickup Requests</h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Available jobs in your area</p>
            </div>

            <button
              onClick={() => fetchAvailableJobs()}
              className="p-2.5 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center active:scale-90 transition-all text-slate-600 dark:text-slate-300"
              aria-label="Refresh jobs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingJobs ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          {/* Compact Search Bar & Filter Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search missions or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500/40 transition-all"
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
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shrink-0 relative ${isFilterOpen || filterMaterial !== 'All' || filterTime !== 'All'
                ? 'bg-emerald-950 border-emerald-950 text-white'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300'
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {(filterMaterial !== 'All' || filterTime !== 'All') && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
                className="overflow-hidden bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-xl"
              >
                <div className="p-3 grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Material</label>
                    <div className="relative">
                      <select
                        value={filterMaterial}
                        onChange={(e) => setFilterMaterial(e.target.value)}
                        className="w-full py-2 pl-2.5 pr-6 text-xs font-semibold rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 appearance-none focus:outline-none focus:border-emerald-500"
                      >
                        <option value="All">All Materials</option>
                        {categories.map(c => (
                          <option key={c.id || c.slug} value={c.label || c.slug}>{c.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Timing</label>
                    <div className="relative">
                      <select
                        value={filterTime}
                        onChange={(e) => setFilterTime(e.target.value)}
                        className="w-full py-2 pl-2.5 pr-6 text-xs font-semibold rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 appearance-none focus:outline-none focus:border-emerald-500"
                      >
                        <option value="All">All Times</option>
                        <option value="asap">ASAP (Urgent)</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs - Segmented Pill style */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
              >
                <span className="truncate">{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${activeTab === tab.id
                  ? 'bg-white/20 dark:bg-slate-900/15 text-current'
                  : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 pb-24 relative max-w-lg mx-auto w-full pt-[calc(env(safe-area-inset-top,1rem)+10rem)]">

        {/* Slim Sub-Filter Strip */}
        {activeTab === 'available' && (
          <div className="px-3 pb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {(['available', 'rejected'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setRequestedTab(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    requestedTab === type
                      ? 'bg-emerald-950 border-emerald-950 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>{type === 'available' ? 'Available' : 'Rejected'}</span>
                  <span className={`text-[10px] font-bold ${requestedTab === type ? 'text-emerald-300' : 'text-slate-400'}`}>
                    {type === 'available' ? availableJobs.length : rejectedJobs.length}
                  </span>
                </button>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
            </span>
          </div>
        )}

        {(activeTab === 'active' || activeTab === 'completed') && (
          <div className="px-3 pb-3 flex items-center justify-between gap-2">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {(['All', 'Resident', 'Market trades', 'RFQ'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedBookingType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                    selectedBookingType === type
                      ? 'bg-emerald-950 border-emerald-950 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {activeTab === 'completed' && currentJobs.length > 0 && (
              <button
                onClick={async () => {
                  await clearJobHistory();
                  fetchEarnings();
                  toast.success('Completed history cleared');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 text-[11px] font-bold shrink-0 active:scale-95 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {isLoadingJobs ? (
          <div className="space-y-2.5 px-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/50 animate-pulse rounded-2xl" />)}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="mx-3 mt-1 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/60 py-14 px-6 text-center">
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{`No ${activeTab} jobs`}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-[220px] mx-auto leading-relaxed">
              New pickup requests will appear here as they are posted in your area.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {expandedId ? (
              <motion.div
                key="mission-focus"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-900 overflow-y-auto no-scrollbar pb-6"
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
                      <div className="fixed top-0 left-0 right-0 z-50 w-full max-w-lg mx-auto bg-slate-50/95 dark:bg-slate-800 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
                        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center justify-between relative">
                          <button onClick={() => setExpandedId(null)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0 z-10">
                            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                          </button>
                          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Mission Details</h1>
                            <p className="text-[10px] font-bold text-indigo-500 capitalize tracking-widest flex items-center justify-center gap-1.5 mt-0.5">
                              Pickup Request
                            </p>
                          </div>
                          <div className="w-10 h-10 shrink-0" />
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
                                <Package className="w-16 h-16 text-slate-400 mb-4" />
                                <p className="text-[10px] font-bold text-slate-500 capitalize tracking-[0.2em]">Asset Visual Unavailable</p>
                              </div>
                            )}
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />

                          {photos.length > 1 && (
                            <>
                              <div className="absolute top-4 right-4 z-10 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
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

                        {/* ── MATERIAL SPECIFICATIONS & DETAILS DIRECTLY ON PAGE ── */}
                        <div className="space-y-4 px-4">
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
                                requestedTab === 'rejected' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-500/20' :
                                job.time?.toUpperCase() === 'ASAP' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-500/20' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 border-indigo-200 dark:border-indigo-500/20'
                              }`}>
                              {activeTab === 'completed' ? <CheckCircle className="w-3.5 h-3.5" /> : activeTab === 'active' ? <Clock className="w-3.5 h-3.5" /> : requestedTab === 'rejected' ? <XCircle className="w-3.5 h-3.5" /> : job.time?.toUpperCase() === 'ASAP' ? <Zap className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">
                                {activeTab === 'completed' ? 'completed' : requestedTab === 'rejected' ? 'rejected' : formatJobTime(job)}
                              </span>
                            </div>
                          </div>

                          <hr className="border-slate-200 dark:border-slate-700/60" />

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
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">KSh {(job.total_price || job.fee || job.pay || 0).toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Verified Weight</p>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">{job.actual_weight_kg || 0} KG</span>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3 col-span-2">
                                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Payment Settled</p>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
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
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
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
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">{job.weight_kg || job.actual_weight_kg || 0} KG</span>
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
                              <hr className="border-slate-200 dark:border-slate-700/60" />
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
                          {activeTab === 'available' && requestedTab === 'available' ? (
                            <>
                              <button
                                onClick={() => { rejectJob(job.id); setExpandedId(null); }}
                                className="flex-[1] py-4 bg-red-500 text-white rounded-2xl font-bold text-xs capitalize tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                <XCircle className="w-4 h-4" /> Dismiss
                              </button>
                              <button
                                onClick={() => { handleAccept(job); setExpandedId(null); }}
                                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs capitalize tracking-widest  active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                <Truck className="w-4 h-4" /> Accept Mission
                              </button>
                            </>
                          ) : activeTab === 'active' ? (
                            <button
                              onClick={() => navigate(`/jobs/navigate/${job.id}`)}
                              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-xs capitalize tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <Navigation className="w-4 h-4" /> Start Navigation
                            </button>
                          ) : activeTab === 'completed' ? (
                            <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl font-bold text-xs capitalize tracking-widest flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-500/20">
                              <CheckCircle className="w-4 h-4" /> Mission Completed
                            </div>
                          ) : (
                            <button
                              onClick={() => { restoreJob(job.id); setExpandedId(null); }}
                              className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-xs capitalize tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
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
                transition={{ duration: 0.15 }}
                className="space-y-1.5 px-1.5"
              >
                {filteredJobs.map((job) => {
                  const waste = categories.find((w) => w.slug === job.material) ||
                    categories.find((w) => w.id === job.material);
                  const photoUrl = job.photoUrl || job.photo_url || job.photos?.[0];
                  
                  // Determine Origin Badge and Navigation Route
                  let badgeIcon = <Home className="w-3 h-3" />;
                  let badgeText = 'Resident';
                  let badgeColor = 'bg-sky-100/90 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40';
                  let navRoute = `/jobs/${job.id}`;

                  if (job.booking_type === 'rfq' && job.is_group_pickup) {
                    badgeIcon = <Users className="w-3 h-3" />;
                    badgeText = 'Group RFQ';
                    badgeColor = 'bg-indigo-100/90 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40';
                    navRoute = `/pickups/${job.id}`;
                  } else if (job.booking_type === 'rfq') {
                    badgeIcon = <FileText className="w-3 h-3" />;
                    badgeText = 'RFQ';
                    badgeColor = 'bg-violet-100/90 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200/60 dark:border-violet-800/40';
                    navRoute = `/pickups/${job.id}`;
                  } else if (job.booking_type === 'marketplace_pickup' || job.is_market_trade) {
                    badgeIcon = <Store className="w-3 h-3" />;
                    badgeText = 'Trade';
                    badgeColor = 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40';
                    navRoute = `/trades/${job.id}`;
                  } else if (job.is_group_pickup) {
                    badgeIcon = <Users className="w-3 h-3" />;
                    badgeText = 'Group';
                    badgeColor = 'bg-indigo-100/90 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40';
                    navRoute = `/jobs/${job.id}`;
                  }

                  const isUrgent = job.time?.toUpperCase() === 'ASAP' && activeTab === 'available';
                  const timeLabel = activeTab === 'completed' ? 'Completed' : activeTab === 'rejected' ? 'Rejected' : formatJobTime(job);
                  const displayValue = activeTab === 'completed'
                    ? `KSh ${(job.total_price || job.fee || job.pay || 0).toLocaleString()}`
                    : job.is_market_trade
                      ? `KSh ${Math.floor((job.weight_kg || job.actual_weight_kg || 0) * getPriceForMaterial(job.material || '')).toLocaleString()}`
                      : 'Pending Verification';

                  return (
                    <div
                      key={job.id}
                      onClick={() => navigate(navRoute)}
                      className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-3 cursor-pointer select-none hover:border-emerald-500/40 active:scale-[0.99] transition-all space-y-1.5 group"
                    >
                      {/* Top Row: Thumbnail, Material + Customer + Location/Weight, Origin Pill + Time */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                            {photoUrl ? (
                              <OptimizedImage src={getThumbnailUrl(photoUrl, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" alt={waste?.label || job.material} />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white capitalize truncate tracking-tight leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                              {waste?.label || job.material}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{job.customerName || job.customer || 'Resident'}</span>
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                              <span className="flex items-center gap-1 truncate max-w-[150px]">
                                <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate">{job.location || 'Nairobi'}</span>
                              </span>
                              {(job.weight_kg || job.actual_weight_kg) > 0 && (
                                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                                  <Scale className="w-3 h-3 text-slate-400 shrink-0" />
                                  {job.actual_weight_kg || job.weight_kg} KG
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badgeColor}`}>
                            {badgeIcon} {badgeText}
                          </span>
                          <span className={`flex items-center gap-1 text-[11px] font-medium ${isUrgent ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                            <Clock className="w-3 h-3 shrink-0" />
                            {timeLabel}
                          </span>
                        </div>
                      </div>

                      {/* Footer Row */}
                      <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Value:{' '}
                          <span className={`font-bold ${displayValue.startsWith('KSh') ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                            {displayValue}
                          </span>
                        </span>

                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          View Job <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Clear History Button */}
        {activeTab === 'rejected' && currentJobs.length > 0 && (
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={async () => {
                rejectedJobs.forEach(j => restoreJob(j.id));
                toast.success('Rejected history cleared');
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
