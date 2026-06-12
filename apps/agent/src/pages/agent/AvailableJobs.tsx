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
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { usePriceStore } from '@klinflow/core/stores/priceStore';
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

  useEffect(() => {
    fetchAvailableJobs();
    fetchActiveJobs();
    fetchCategories();
    fetchEarnings();
    fetchPrices();
  }, []);

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

  const currentJobs = activeTab === 'available'
    ? availableJobs
    : activeTab === 'active'
      ? activeJobs
      : activeTab === 'completed'
        ? completedJobs
        : rejectedJobs.slice(0, 10);

  const filteredJobs = useMemo(() => {
    let result = currentJobs;

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
  }, [currentJobs, searchTerm, filterMaterial, filterTime, categories]);

  const TABS = [
    { id: 'available', label: 'Requested', count: availableJobs.length },
    { id: 'active', label: 'Accepted', count: activeJobs.length },
    { id: 'completed', label: 'Completed', count: completedJobs.length },
    { id: 'rejected', label: 'Rejected', count: rejectedJobs.length },
  ];

  return (
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV (Fixed PWA Style) ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-0 px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
        <div className="flex items-center justify-between max-w-lg mx-auto pb-2">
          <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none">Missions</h1>
            <p className="text-[10px] font-bold text-slate-500 capitalize tracking-[0.2em] mt-1">Available Jobs</p>
          </div>

          <div className="w-10 flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 text-slate-300 ${isLoadingJobs ? 'animate-spin' : ''}`} onClick={() => fetchAvailableJobs()} />
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
        <div className="mt-1 flex bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-xl">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 py-1 text-[10px] font-bold capitalize tracking-widest rounded-lg transition-all flex items-center justify-center gap-0.5 ${activeTab === tab.id
                ? 'bg-indigo-600 shadow-sm text-white font-black'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
            >
              <span className="truncate">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`min-w-[16px] h-4 px-1 text-[8px] font-bold rounded-full flex items-center justify-center ${activeTab === tab.id ? 'bg-white text-indigo-600' : 'bg-indigo-500/20 text-indigo-600 dark:bg-indigo-500/30 dark:text-indigo-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-px pb-24 pt-[calc(env(safe-area-inset-top,1rem)+8rem)] relative max-w-lg mx-auto w-full">

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
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material-Type</p>
                              <h2 className="text-[16px] font-semibold text-indigo-700 dark:text-white capitalize leading-tight">
                                {waste?.label || job.material}
                              </h2>
                            </div>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${job.time?.toUpperCase() === 'ASAP'
                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-500/20'
                                : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 border-indigo-200 dark:border-indigo-500/20'
                              }`}>
                              {job.time?.toUpperCase() === 'ASAP' ? <Zap className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">{job.time?.toLowerCase() || 'scheduled'}</span>
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
                                    <p className="text-xs font-black text-slate-900 dark:text-white">KSh {Math.floor((job.actual_weight_kg || job.bags || 0) * getPriceForMaterial(job.material || ''))}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Est. Load</p>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">{job.actual_weight_kg || job.bags || 0} KG</span>
                                  </div>
                                </div>
                              </>
                            )}

                            <div className="flex items-start gap-3 col-span-2">
                              <Package className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pickup ID / Type</p>
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  {job.id.slice(0, 8).toUpperCase()} • {job.is_group_pickup ? 'Group Pickup' : (job.is_market_trade || job.booking_type === 'marketplace_pickup' || job.listing_id) ? 'Seller Trade' : 'Resident Pickup'}
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

                  return (
                    <div
                      key={job.id}
                      className="bg-white dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 transition-all overflow-hidden"
                    >
                      <div
                        onClick={() => setExpandedId(job.id)}
                        className="bg-white dark:bg-slate-900/60 py-3 px-3.5 shadow-sm border-b border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <div className="flex gap-3">
                          <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-800">
                            {photoUrl ? (
                              <OptimizedImage src={getThumbnailUrl(photoUrl, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" alt={waste?.label || job.material} />
                            ) : (
                              waste?.icon || '📦'
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            {/* Row 1: Material & Value/Time */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h3 className="text-[11px] font-bold text-slate-900 dark:text-white capitalize truncate tracking-tight">{waste?.label || job.material}</h3>
                                {job.is_group_pickup && (
                                  <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center gap-0.5 shrink-0">
                                    <Users className="w-2.5 h-2.5" /> Group
                                  </span>
                                )}
                              </div>
                              <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md uppercase shrink-0 ml-2 ${job.time?.toUpperCase() === 'ASAP' ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20'}`}>
                                {job.time?.toLowerCase() || 'scheduled'}
                              </span>
                            </div>

                            {/* Row 2: Location & Client */}
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize truncate max-w-[150px]">
                                <MapPin className="w-2.5 h-2.5 text-green-500" /> {job.location}
                              </p>
                            </div>

                            {/* Row 3: Timestamp/User & Quantity/Value */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/50 mt-1">
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0">
                                <User className="w-2.5 h-2.5 text-slate-400" /> {job.customerName || job.customer || 'Resident'}
                              </p>
                              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize shrink-0">
                                <span className="text-[10px] text-slate-400 not-italic font-bold mr-1 opacity-70">Value:</span>
                                KSh {activeTab === 'completed' ? (job.total_price || job.fee || job.pay || 0).toLocaleString() : Math.floor((job.actual_weight_kg || job.bags || 0) * getPriceForMaterial(job.material || ''))}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center text-slate-300">
                            <ChevronRight className="w-4 h-4" />
                          </div>
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
