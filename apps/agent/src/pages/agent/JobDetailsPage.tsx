import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@klinflow/supabase';
import {
  ArrowLeft, MapPin, Scale, Clock, CheckCircle, XCircle,
  Zap, User, DollarSign, Package, Info, Truck, RefreshCw, Navigation,
  FastForward, Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { usePriceStore } from '@klinflow/core/stores/priceStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore, NOTIFICATION_TYPES } from '@klinflow/core/stores/notificationStore';
import { useAssetStore } from '@klinflow/core/stores/assetStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import AIScannerModal from '@klinflow/ui/components/AIScannerModal';
import type { AgentJob } from '@klinflow/core/stores/agentStore.types';

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState<AgentJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnTheWay, setIsOnTheWay] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [prefillCategory, setPrefillCategory] = useState<string | null>(null);

  // Derive activeTab from state or job status
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed' | 'rejected'>(location.state?.tab || 'active');

  const { profile } = useAuthStore();
  const categories = useServiceStore(s => s.categories);
  const fetchCategories = useServiceStore(s => s.fetchCategories);
  const getPriceForMaterial = usePriceStore(s => s.getPriceForMaterial);
  const fetchPrices = usePriceStore(s => s.fetchPrices);
  const { verifyAsset } = useAssetStore();
  const { addNotification } = useNotificationStore();
  
  const acceptJob = useAgentStore(s => s.acceptJob);
  const rejectJob = useAgentStore(s => s.rejectJob);
  const restoreJob = useAgentStore(s => s.restoreJob);
  const arrivedJobIds = useAgentStore(s => s.arrivedJobIds);
  const setJobArrived = useAgentStore(s => s.setJobArrived);
  
  // Try to find job in store first, else fetch
  const allJobs = [
    ...useAgentStore(s => s.availableJobs),
    ...useAgentStore(s => s.activeJobs),
    ...useAgentStore(s => s.rejectedJobs),
    ...useAgentStore(s => s.jobHistory)
  ];

  useEffect(() => {
    fetchCategories();
    fetchPrices();
    
    if (id) {
      // Sync arrival state from store
      if (arrivedJobIds.includes(id)) {
        setHasArrived(true);
      }

      const storeJob = allJobs.find(j => j.id === id);
      if (storeJob) {
        setJob(storeJob);
        setIsLoading(false);
        if (storeJob.status === 'pending') setActiveTab('available');
        else if (['completed', 'verified'].includes(storeJob.status)) setActiveTab('completed');
        else if (storeJob.status === 'rejected') setActiveTab('rejected');
        else setActiveTab('active');
      } else {
        fetchJobDetails(id);
      }
    }
  }, [id]);

  const fetchJobDetails = async (jobId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      
      // Need to map this to AgentJob, but for simplicity we can just use the raw data 
      // and adapt the fields since AgentJob is very similar to the row.
      setJob({
        ...data,
        material: data.waste_type,
        weight_kg: data.bags, // Fallback mapping
        location: data.estate,
        time: data.scheduled_time || 'ASAP',
        customerName: data.user_id ? 'Resident' : 'Customer'
      } as any);

      if (data.status === 'pending') setActiveTab('available');
      else if (['completed', 'verified'].includes(data.status)) setActiveTab('completed');
      else if (data.status === 'rejected') setActiveTab('rejected');
      else setActiveTab('active');

    } catch (err) {
      console.error('Fetch job details failed:', err);
      toast.error('Failed to load job details');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!job) return;
    try {
      const success = await acceptJob(job.id);
      if (success) {
        setActiveTab('active');
        toast.success(`Pickup accepted! 🚀`);
        navigate(-1);
      } else {
        toast.error("Could not claim job");
      }
    } catch (err) {
      toast.error("Failed to accept job");
    }
  };

  const formatJobTime = (jobItem: AgentJob) => {
    if (jobItem.time?.toUpperCase() === 'ASAP') return 'ASAP';
    if (!jobItem.time) return 'Pending';
    return jobItem.time;
  };

  if (isLoading || !job) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-800">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const waste = categories.find((w) => w.slug === job.material) || categories.find((w) => w.id === job.material);
  const photoUrl = job.photoUrl || (job as any).photo_url;
  const photos = photoUrl ? [photoUrl] : [];

  return (
    <div className="bg-white dark:bg-slate-800 min-h-screen pb-6">
      <div className="max-w-lg mx-auto">
        {/* ── FIXED TOP NAV ── */}
        <div className="fixed top-0 left-0 right-0 z-50 w-full max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
          <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
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
          </div>

          {/* ── MATERIAL SPECIFICATIONS CARD ── */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4">
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
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white capitalize">{job.customerName || (job as any).customer || 'Resident'}</p>
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
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">KSh {(job.pay || (job as any).total_price || (job as any).fee || 0).toLocaleString()}</p>
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
                        {(job as any).completed_at
                          ? new Date((job as any).completed_at).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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
                    {job.is_group_pickup ? 'Community Swarm' : (job.is_market_trade || (job as any).booking_type === 'marketplace_pickup' || (job as any).listing_id) ? 'Seller Trade' : 'Resident Pickup'}
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
                  onClick={() => { rejectJob(job.id); navigate(-1); }}
                  className="flex-[1] py-4 bg-red-500 text-white rounded-2xl font-black text-xs capitalize tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Dismiss
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs capitalize tracking-widest  active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4" /> Accept Mission
                </button>
              </>
            ) : activeTab === 'active' ? (
              !isOnTheWay && !hasArrived ? (
                /* ── STEP 1: Choose navigation method ── */
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => navigate(`/jobs/navigate/${job.id}`)}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" /> Navigate to Client
                  </button>
                  <button
                    onClick={() => {
                      setIsOnTheWay(true);
                      toast.success("On your way!", { description: "Tap 'I've Arrived' when you reach the location." });
                    }}
                    className="w-full py-4 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-2 border-blue-100 dark:border-blue-900/30 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <FastForward className="w-4 h-4" /> I Know The Way
                  </button>
                </div>
              ) : !hasArrived ? (
                /* ── STEP 2: Agent is on the way, confirm arrival ── */
                <div className="flex flex-col gap-3 w-full">
                  <div className="w-full py-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-500/20">
                    <Navigation className="w-4 h-4 animate-pulse" /> En Route to Client
                  </div>
                  <button
                    onClick={async () => {
                      const isGroup = job.is_group_pickup && (job as any).swarm_id;
                      const agentName = profile?.name || 'Agent';

                      if (isGroup) {
                        try {
                          const { data: participants } = await supabase
                            .from('swarm_participants')
                            .select('user_id')
                            .eq('swarm_id', (job as any).swarm_id)
                            .neq('status', 'withdrawn');
                          const participantIds = participants?.map((p: any) => p.user_id).filter(Boolean) || [];
                          const allTargets = [...new Set([...participantIds, job.user_id || (job as any).userId])].filter(Boolean);
                          addNotification(
                            "Agent has Arrived at your Community! 🏘️",
                            `${agentName} has arrived for your community group pickup. Please meet them with your materials ready.`,
                            NOTIFICATION_TYPES.SUCCESS,
                            'user',
                            allTargets
                          );
                        } catch (err) {
                          addNotification(
                            "Agent has Arrived!",
                            `${agentName} has arrived at your location. Please meet them to begin the pickup.`,
                            NOTIFICATION_TYPES.SUCCESS,
                            'client',
                            job.user_id || (job as any).userId
                          );
                        }
                      } else {
                        addNotification(
                          "Agent has Arrived!",
                          `${agentName} has arrived at your location. Please meet them to begin the pickup.`,
                          NOTIFICATION_TYPES.SUCCESS,
                          'client',
                          job.user_id || (job as any).userId
                        );
                      }

                      setHasArrived(true);
                      setJobArrived(job.id);
                      toast.success("Welcome to Mission Site!", {
                        description: isGroup
                          ? "Please coordinate with the community to weigh each participant's materials."
                          : "Please weigh the recyclables to complete pickup."
                      });
                    }}
                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" /> I've Arrived
                  </button>
                </div>
              ) : (
                /* ── STEP 3: Arrived — Record Collection ── */
                <div className="flex flex-col gap-3 w-full">
                  <div className="w-full py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-500/20">
                    <CheckCircle className="w-4 h-4" /> You've Arrived — Ready to Collect
                  </div>
                  <button
                    onClick={() => {
                      setPrefillCategory(null);
                      setIsScannerOpen(true);
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
                  >
                    <Edit3 className="w-5 h-5 shrink-0" />
                    <div className="flex flex-col items-start text-left">
                      <span className="font-bold text-sm">Record Collection</span>
                      <span className="text-[11px] opacity-70">Asset Intake & Verification</span>
                    </div>
                  </button>
                </div>
              )
            ) : activeTab === 'completed' ? (
              <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black text-xs capitalize tracking-widest flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle className="w-4 h-4" /> Mission Completed
              </div>
            ) : (
              <button
                onClick={() => { restoreJob(job.id); navigate(-1); }}
                className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs capitalize tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Restore Mission
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Scanner Modal — Record Collection */}
      {job && (
        <AIScannerModal 
          isOpen={isScannerOpen}
          onClose={() => {
            setIsScannerOpen(false);
            setPrefillCategory(null);
          }}
          booking={job}
          prefillCategory={prefillCategory}
          onVerify={async (data) => {
            try {
              const isMarketTrade = !!(job.is_market_trade || (job as any).booking_type === 'marketplace_pickup');
              
              if (isMarketTrade) {
                if (data.isCounterOffer) {
                  const { error } = await supabase.rpc('submit_counter_offer', {
                    p_booking_id: job.id,
                    p_new_amount: data.counterOfferAmount
                  });
                  if (error) throw error;
                  toast.success("Counter-Offer Sent!", { description: "Waiting for seller approval." });
                  navigate('/trades');
                  return;
                } else {
                  const { error } = await supabase.rpc('complete_booking_trade_payout', {
                    p_booking_id: job.id,
                    p_actual_weight: data.weightKg,
                    p_payout_amount: (job as any).total_price || job.pay || 0
                  });
                  if (error) throw error;

                  await supabase.from('assets')
                    .update({
                      material_category: data.category || data.materialCategory,
                      sourcing_tag: 'Seller'
                    })
                    .eq('booking_id', job.id);

                  await useAuthStore.getState().fetchProfile();
                  await useAgentStore.getState().fetchActiveJobs();
                  await useAgentStore.getState().fetchEarnings();
                  toast.success("Verification Complete!", { description: "Funds transferred to seller." });
                  navigate('/trades');
                  return;
                }
              } else {
                await verifyAsset(job.id, {
                  ...data,
                  ownerId: (job as any).userId || job.user_id
                });
                await useAuthStore.getState().fetchProfile();
                await useAgentStore.getState().fetchActiveJobs();
                await useAgentStore.getState().fetchEarnings();

                if (job.is_group_pickup && (job as any).swarm_id) {
                  try {
                    const { data: participants } = await supabase
                      .from('swarm_participants')
                      .select('user_id')
                      .eq('swarm_id', (job as any).swarm_id)
                      .neq('status', 'withdrawn');
                    const participantIds = participants?.map((p: any) => p.user_id).filter(Boolean) || [];
                    const bookingOwner = (job as any).userId || job.user_id;
                    const otherParticipants = participantIds.filter((uid: string) => uid !== bookingOwner);
                    if (otherParticipants.length > 0) {
                      addNotification(
                        "Community Pickup Completed! 💰",
                        `Your group pickup of ${data.weightKg}kg has been verified. Payouts and GFP are being distributed to all contributors.`,
                        NOTIFICATION_TYPES.SUCCESS,
                        'user',
                        otherParticipants
                      );
                    }
                  } catch (err) {
                    console.error('[JobDetails] Failed to notify group participants on completion:', err);
                  }
                }

                toast.success("Verification Complete!", { description: "Moving to next mission." });
                navigate('/jobs');
              }
            } catch (err) {
              toast.error("Verification failed.", { description: (err as Error).message || "Please try again." });
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}
