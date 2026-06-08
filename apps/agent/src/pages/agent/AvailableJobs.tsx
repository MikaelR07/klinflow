/**
 * AvailableJobs.jsx — Job cards with AI recommendations, accept/reject
 */
import { useEffect, useState } from 'react';
import {
  Sparkles, MapPin, Clock, Package, CheckCircle, XCircle, Users,
  RefreshCw, Loader2, Navigation, Zap, Truck, User, ArrowLeft,
  ChevronRight, Calendar, Scale, ChevronDown, Info, DollarSign
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

  const TABS = [
    { id: 'available', label: 'Requested', count: availableJobs.length },
    { id: 'active', label: 'Accepted', count: activeJobs.length },
    { id: 'completed', label: 'Completed', count: completedJobs.length },
    { id: 'rejected', label: 'Rejected', count: rejectedJobs.length },
  ];

  return (
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV (Fixed PWA Style) ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+0.5rem)] pb-0 px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
        <div className="flex items-center justify-between max-w-lg mx-auto pb-3">
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

        {/* Tabs - Edge to edge underline style */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 py-3 text-[10px] font-bold capitalize tracking-widest transition-all flex items-center justify-center border-b-2 ${activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="absolute -top-0.5 right-1 min-w-[16px] h-4 px-1 text-[8px] font-bold rounded-full flex items-center justify-center bg-indigo-600 text-white">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-px pb-24 pt-[calc(env(safe-area-inset-top,1rem)+4.75rem)] relative max-w-lg mx-auto w-full">

        {isLoadingJobs ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />)}
          </div>
        ) : currentJobs.length === 0 ? (
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
                className="fixed inset-0 z-[9999] bg-[#F2F3F4] dark:bg-slate-800 overflow-y-auto no-scrollbar pb-5"
              >
                {(() => {
                  const job = currentJobs.find(j => j.id === expandedId);
                  if (!job) return null;
                  const waste = categories.find((w) => w.slug === job.material) ||
                    categories.find((w) => w.id === job.material);
                  const photoUrl = job.photoUrl || job.photo_url;

                  return (
                    <div className="max-w-lg mx-auto">
                      {/* Edge-to-Edge Hero Image */}
                      <div className="w-full aspect-[4/5] sm:aspect-square bg-slate-200 dark:bg-slate-800 relative overflow-hidden shadow-xl">
                        {photoUrl ? (
                          <OptimizedImage src={getThumbnailUrl(photoUrl, { width: 800 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800">
                            <div className="text-6xl mb-4">{waste?.icon || '📦'}</div>
                            <p className="text-[10px] font-bold text-slate-500 capitalize tracking-[0.2em]">Asset Visual Unavailable</p>
                          </div>
                        )}

                        <button
                          onClick={() => setExpandedId(null)}
                          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
                          className="absolute left-6 z-20 p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-all shadow-xl"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Content Sheet */}
                      <div className="relative -mt-36 bg-[#F2F3F4] dark:bg-slate-800 rounded-t-[1rem] px-3 pt-4 pb-5 space-y-4 z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.15)]">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[11px] font-black text-indigo-600 capitalize tracking-[0.2em]">Mission Request</p>
                            <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mt-0.5 leading-none">Pickup ID: {job.id.slice(0, 8).toUpperCase()}</p>
                          </div>
                          <div className="text-right">
                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black capitalize tracking-tighter border ${job.time?.toUpperCase() === 'ASAP'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                              : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                              }`}>
                              {job.time?.toLowerCase() || 'scheduled'}
                            </div>
                          </div>
                        </div>

                        {/* Material, Client & Location */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
                            <Package className="w-3.5 h-3.5 text-indigo-500 mb-2" />
                            <p className="text-[9px] font-bold text-slate-400 capitalize tracking-widest leading-none mb-1">Material-Type</p>
                            <p className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{waste?.label || job.material}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
                            <User className="w-3.5 h-3.5 text-emerald-500 mb-2" />
                            <p className="text-[9px] font-bold text-slate-400 capitalize tracking-widest leading-none mb-1">Client's Name</p>
                            <p className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{job.customerName || job.customer || 'Resident'}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 mb-2" />
                            <p className="text-[9px] font-bold text-slate-400 capitalize tracking-widest leading-none mb-1">Location</p>
                            <p className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{job.location}</p>
                          </div>
                        </div>

                        {/* Earnings & Load */}
                        {activeTab === 'completed' ? (
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4 shadow-sm">
                            {/* Payout Amount */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-0.5">Amount Paid to Client</p>
                                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                  <DollarSign className="w-4 h-4" /> KSh {(job.total_price || job.fee || job.pay || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black capitalize tracking-wider border ${job.is_group_pickup
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                : (job.is_market_trade || job.booking_type === 'marketplace_pickup' || job.listing_id)
                                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                }`}>
                                {job.is_group_pickup ? '👥 Group Pickup' : (job.is_market_trade || job.booking_type === 'marketplace_pickup' || job.listing_id) ? '🤝 Seller Trade' : '🏠 Resident Pickup'}
                              </div>
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-700" />

                            {/* Payment Timestamp */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shrink-0">
                                  <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-0.5">Payment Settled</p>
                                  <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                                    {job.completed_at
                                      ? new Date(job.completed_at).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                      : job.date || 'N/A'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-700" />

                            {/* Verified Weight */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                                  <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-0.5">Verified Weight</p>
                                  <p className="text-sm font-black text-slate-900 dark:text-white capitalize tracking-tight">{job.actual_weight_kg || 0} KG</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 capitalize tracking-widest mb-1">EST. Material value</p>
                              <p className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" /> KSh {Math.floor((job.actual_weight_kg || job.bags || 0) * getPriceForMaterial(job.material || ''))}
                              </p>
                            </div>

                            <div className="w-px h-8 bg-slate-100 dark:bg-slate-700" />

                            <div className="text-right">
                              <p className="text-[9px] font-bold text-slate-400 capitalize tracking-widest mb-1">EST. LOAD</p>
                              <div className="flex items-center justify-end gap-1">
                                <p className="text-base font-black text-slate-900 dark:text-white capitalize tracking-tight">{job.actual_weight_kg || job.bags || 0} KG</p>
                                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {job.notes && (
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h4 className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-3 flex items-center gap-2">
                              <Info className="w-3.5 h-3.5" /> Description
                            </h4>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                              "{job.notes}"
                            </p>
                          </div>
                        )}

                        <div className="pt-4 flex gap-3">
                          {activeTab === 'available' ? (
                            <>
                              <button
                                onClick={() => { rejectJob(job.id); setExpandedId(null); }}
                                className="flex-[1] py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl font-black text-xs capitalize tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
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
                className="space-y-1"
              >
                {currentJobs.map((job) => {
                  const waste = categories.find((w) => w.slug === job.material) ||
                    categories.find((w) => w.id === job.material);
                  const photoUrl = job.photoUrl || job.photo_url || job.photos?.[0];

                  return (
                    <div
                      key={job.id}
                      className="bg-white dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 transition-all overflow-hidden"
                    >
                      <button
                        className="w-full p-4 text-left active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                        onClick={() => setExpandedId(job.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3.5">
                            <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-700 shrink-0 overflow-hidden">
                              {photoUrl ? (
                                <OptimizedImage src={getThumbnailUrl(photoUrl, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                              ) : (
                                waste?.icon || '📦'
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[12px] font-bold text-slate-400 captitalize tracking-widest flex items-center">
                                Material: <span className="text-indigo-600 dark:text-indigo-400 ml-1.5 capitalize">{waste?.label || job.material}</span>
                              </p>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest flex items-center truncate">
                                  Client: <span className="text-slate-900 dark:text-white ml-1.5 capitalize truncate">
                                    {job.customerName || job.customer || 'Resident'}
                                  </span>
                                </p>
                                {job.is_group_pickup && (
                                  <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center gap-0.5 shrink-0">
                                    <Users className="w-2.5 h-2.5" /> Group
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px]  font-bold text-slate-400 capitalize tracking-widest flex items-center">
                                Pickup Ref: <span className="text-indigo-600 dark:text-indigo-400 font-mono ml-1.5">{job.id.slice(0, 8).toUpperCase()}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end justify-between self-stretch py-0.5">
                            <span className={`text-[9px] font-black tracking-widest  px-2.5 py-1 rounded-lg uppercase ${job.time?.toUpperCase() === 'ASAP'
                              ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20'
                              : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20'
                              }`}>
                              {job.time?.toLowerCase() || 'scheduled'}
                            </span>
                            <div className="flex flex-col items-end mt-2">
                              <p className="text-[9px] font-semibold text-slate-500 flex items-center gap-1 capitalize tracking-wide">
                                {job.location} <MapPin className="w-3 h-3 text-green-500" />
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
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
