/**
 * AvailableJobs.jsx — Job cards with AI recommendations, accept/reject
 */
import { useEffect, useState } from 'react';
import { 
  Sparkles, MapPin, Clock, Package, CheckCircle, XCircle, 
  RefreshCw, Loader2, Navigation, Zap, Truck, User, ArrowLeft,
  ChevronRight, Calendar, Scale
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAgentStore, useAuthStore, useServiceStore, getThumbnailUrl } from '@cleanflow/core';
import EmptyState from '@cleanflow/ui/components/EmptyState';
import { SkeletonCard } from '@cleanflow/ui/components/Skeletons';

export default function AvailableJobs() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'available'); // Respect navigation hints
  const [weighingJob, setWeighingJob] = useState(null);
  const [weightValue, setWeightValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const availableJobs = useAgentStore(s => s.availableJobs);
  const activeJobs = useAgentStore(s => s.activeJobs);
  const rejectedJobs = useAgentStore(s => s.rejectedJobs);
  const acceptJob = useAgentStore(s => s.acceptJob);
  const rejectJob = useAgentStore(s => s.rejectJob);
  const restoreJob = useAgentStore(s => s.restoreJob);
  const completeJob = useAgentStore(s => s.completeJob);
  const fetchAvailableJobs = useAgentStore(s => s.fetchAvailableJobs);
  const fetchActiveJobs = useAgentStore(s => s.fetchActiveJobs);
  const subscribeToJobs = useAgentStore(s => s.subscribeToJobs);
  const cleanupJobs = useAgentStore(s => s.cleanupJobs);
  const isLoadingJobs = useAgentStore(s => s.isLoadingJobs);
  const arrivedJobIds = useAgentStore(s => s.arrivedJobIds);
  const userId = useAuthStore(s => s.userId);
  const profile = useAuthStore(s => s.profile);
  const categories = useServiceStore(s => s.categories);
  const fetchCategories = useServiceStore(s => s.fetchCategories);

  useEffect(() => {
    fetchAvailableJobs();
    fetchActiveJobs();
    fetchCategories();
    
    // Subscribe to real-time job updates if online
    if (profile?.isOnline) {
      subscribeToJobs();
    }
    
    return () => cleanupJobs();
  }, [profile?.isOnline, subscribeToJobs, cleanupJobs]);

  const handleAccept = async (job) => {
    try {
      const success = await acceptJob(job.id);
      
      if (success) {
        setActiveTab('active'); // Switch to active tab so user sees the job move
        toast.success(`Job accepted! 🚀`, {
          description: "Mission activated. Your earnings will be credited to your wallet upon completion.",
        });
      } else {
        toast.error("Could not claim job", {
          description: "This mission might have been claimed by another agent or is no longer available."
        });
        fetchAvailableJobs();
      }
    } catch (err) {
      console.error('[handleAccept] Error:', err);
      toast.error("Failed to accept job");
    }
  };

  const handleReject = async (job) => {
    await rejectJob(job.id);
    toast.info(`Job dismissed`, {
      description: "Mission moved to Rejected tab."
    });
  };

  const handleRestore = async (job) => {
    await restoreJob(job.id);
    toast.success(`Job restored!`, {
      description: "Mission is back in your Requested pool."
    });
  };

  const submitCompletion = async () => {
    if (!weightValue || isNaN(weightValue)) {
      toast.error("Please enter a valid weight");
      return;
    }

    setIsSubmitting(true);
    try {
      await completeJob(weighingJob.id, parseFloat(weightValue));
      toast.success("Weight Recorded! ⚖️", {
        description: `Client notified. Your earnings will be sent to your account shortly.`,
      });
      setWeighingJob(null);
      fetchActiveJobs();
    } catch (err) {
      toast.error("Failed to record weight");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [selectedJob, setSelectedJob] = useState(null);

  const currentJobs = activeTab === 'available' 
    ? availableJobs 
    : activeTab === 'active' 
      ? activeJobs 
      : rejectedJobs;

  return (
    <div className="animate-fade-in pb-10 bg-[#F2F3F4] dark:bg-slate-900 px-2">
      {/* ── HEADER TERMINAL (UNIFIED) ── */}
      {!selectedJob && (
        <div className="px-3 pb-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-slate-100 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 dark:text-white" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white leading-none">Available Missions</h1>
            </div>
            <div className="w-9 h-9 flex items-center justify-center">
              <RefreshCw className={`w-4 h-4 text-slate-300 ${isLoadingJobs ? 'animate-spin' : ''}`} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50 mb-1">
            {[
              { id: 'available', label: 'Requested', count: availableJobs.length },
              { id: 'active', label: 'Accepted', count: activeJobs.length },
              { id: 'rejected', label: 'Rejected', count: rejectedJobs.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full transition-all ${
                    activeTab === tab.id 
                      ? 'bg-indigo-600 text-white scale-110 shadow-sm shadow-indigo-500/30' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTENT AREA ── */}
      <div className={selectedJob ? "animate-fade-in" : ""}>
        <AnimatePresence mode="wait">
          {selectedJob ? (
            /* ── FOCUSED MISSION DETAIL (Immersive Kilimall Style) ── */
            <motion.div 
              key="mission-focus"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-[#F2F3F4] dark:bg-slate-900 overflow-y-auto no-scrollbar pb-24"
            >
               {/* Edge-to-Edge Hero Image */}
               <div className="relative w-full aspect-[4/5] sm:aspect-square bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full w-full">
                    {(selectedJob.photos?.length > 0 
                      ? selectedJob.photos 
                      : (selectedJob.photo_url || selectedJob.photoUrl || selectedJob.photo) 
                        ? [selectedJob.photo_url || selectedJob.photoUrl || selectedJob.photo] 
                        : []
                    ).map((imgUrl, idx) => (
                      <div key={idx} className="flex-none w-full h-full snap-start">
                        <img src={getThumbnailUrl(imgUrl, { width: 400 })} loading="lazy" className="w-full h-full object-cover" alt={`Load View ${idx + 1}`} />
                      </div>
                    ))}
                    
                    {/* Fallback if zero images */}
                    {(!selectedJob.photos?.length && !selectedJob.photo_url && !selectedJob.photoUrl && !selectedJob.photo) && (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                        <Package className="w-20 h-20 text-slate-200 dark:text-slate-700" />
                      </div>
                    )}
                  </div>

                  {/* Floating Back Button - Now with Notch Support */}
                  <button 
                    onClick={() => setSelectedJob(null)}
                    style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
                    className="absolute left-6 z-20 p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-all shadow-xl"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {/* Status Badge - Now with Notch Support */}
                  <div 
                    style={{ top: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
                    className="absolute right-6 px-3 py-1.5 bg-emerald-500/80 backdrop-blur-xl text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] z-10 shadow-lg"
                  >
                    {activeTab === 'available' ? 'Available' : 'Accepted'}
                  </div>


               </div>

              {/* Content Sheet (Overlaps Image) */}
              <div className="relative -mt-6 bg-[#F2F3F4] dark:bg-slate-900 rounded-t-xl px-3 pt-10 pb-10 space-y-6 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                
                {/* Title & Customer */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-white uppercase tracking-tight leading-tight">
                      {(categories.find(c => c.slug === selectedJob.material) || categories.find(c => c.id === selectedJob.material))?.label || selectedJob.material}
                    </h2>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest shrink-0 ${
                      selectedJob.time?.toUpperCase() === 'ASAP' ? 'bg-rose-500 text-white animate-pulse' : 'bg-primary/10 text-primary'
                    }`}>
                      {selectedJob.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{selectedJob.customerName || selectedJob.customer || 'Client Account'}</p>
                    <span className="text-xs text-slate-300">•</span>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {selectedJob.location}
                    </p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-white truncate">{selectedJob.location}</p>
                    <p className="text-xs font-semibold text-slate-300 uppercase">Area</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Est. Load</p>
                    <p className="text-base font-semibold text-slate-700 dark:text-white">{selectedJob.actual_weight_kg || selectedJob.bags || 0}</p>
                    <p className="text-xs font-semibold text-slate-300 uppercase">KG</p>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Client Instructions</h4>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedJob.notes ? (
                      `"${selectedJob.notes.replace(/Est\. Total: KSh \d+( \| Item: )?/, '').replace(/^ \| /, '') || 'No additional instructions provided'}"`
                    ) : (
                      "No special instructions provided for this material pickup."
                    )}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {activeTab === 'available' ? (
                    <>
                      <button 
                        onClick={() => { handleReject(selectedJob); setSelectedJob(null); }}
                        className="flex-1 py-4 bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-800 rounded-2xl font-semibold text-xs uppercase tracking-widest active:scale-[0.97] transition-all"
                      >
                        Dismiss
                      </button>
                      <button 
                        onClick={() => { handleAccept(selectedJob); setSelectedJob(null); }}
                        className="flex-[2] py-4 bg-primary text-white rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                      >
                      <CheckCircle className="w-4 h-4" /> Accept Job
                    </button>
                  </>
                ) : activeTab === 'rejected' ? (
                    <button 
                      onClick={() => { handleRestore(selectedJob); setSelectedJob(null); }}
                      className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" /> Restore Mission
                    </button>
                  ) : (
                    <button 
                      onClick={() => { navigate(`/jobs/navigate/${selectedJob.id}`); setSelectedJob(null); }}
                      className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                    >
                      <Truck className="w-5 h-5" /> Start Navigation
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : isLoadingJobs ? (
             <div className="space-y-4">
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
             </div>
          ) : currentJobs.length === 0 ? (
            <EmptyState 
              title={
                activeTab === 'available' ? "No Requested Jobs" : 
                activeTab === 'active' ? "No Accepted Jobs" : 
                "No Rejected Jobs"
              }
              subtitle={
                activeTab === 'available' ? "Your queue is clear. New jobs will appear here as they are posted." : 
                activeTab === 'active' ? "You haven't accepted any jobs yet. Check the requests to start earning." : 
                "You haven't dismissed any missions yet."
              }
              action={activeTab === 'available' ? "Refresh Requests" : activeTab === 'active' ? "Check Requests" : null}
              onAction={activeTab === 'available' ? fetchAvailableJobs : () => setActiveTab('available')}
            />
          ) : (
            <div className="flex flex-col">
              {currentJobs.map((job) => {
                const waste = categories.find((w) => w.slug === job.material) || 
                              categories.find((w) => w.id === job.material);
                return (
                  <motion.div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    whileTap={{ scale: 0.98 }}
                    className={`group px-3 py-4 border-b transition-all cursor-pointer ${
                      job.isAI && activeTab === 'available' 
                        ? 'bg-emerald-500/5 border-emerald-500/10' 
                        : 'bg-white dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900/60 border-slate-50 dark:border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Material Icon Anchor */}
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-2xl shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                        {waste?.icon || '♻️'}
                      </div>

                      {/* Content Strip */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-12">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase truncate tracking-tight italic leading-none mb-1.5">
                              {waste?.label || job.material}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                              {job.customerName || job.customer || 'Client'}
                            </p>
                          </div>
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg font-black text-xs uppercase tracking-tighter shrink-0 ${
                            job.time?.toUpperCase() === 'ASAP' 
                              ? 'bg-rose-500 text-white animate-pulse' 
                              : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'
                          }`}>
                            <Clock className={`w-2.5 h-2.5 ${job.time?.toUpperCase() === 'ASAP' ? 'animate-bounce' : ''}`} /> 
                            {job.time}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/50 pt-1.5 mt-auto">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <MapPin className="w-3 h-3 text-slate-300" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                              {job.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 pl-2">
                            <div className="flex items-center gap-1 text-xs font-black text-emerald-600 italic tracking-tighter">
                              <Scale className="w-3 h-3 not-italic" />
                              <span>{job.actual_weight_kg || job.bags || 0} <span className="text-[7px] uppercase not-italic opacity-50">KG</span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Weight Entry Modal */}
      {weighingJob && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                <Navigation className="w-8 h-8 text-emerald-600 rotate-45" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">Vehicle Scale Entry</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8">Enter the final measured weight for this pickup.</p>
              
              <div className="w-full relative mb-8">
                <input 
                  type="number" autoFocus placeholder="0.0" value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-3xl font-semibold text-center focus:border-primary outline-none transition-all placeholder:opacity-20"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-semibold tracking-widest text-sm pointer-events-none">KG</span>
              </div>

              <div className="flex w-full gap-3">
                <button onClick={() => setWeighingJob(null)} className="flex-1 py-4 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Cancel</button>
                <button onClick={submitCompletion} disabled={isSubmitting} className="flex-[2] py-4 rounded-2xl bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Confirm & Complete</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
