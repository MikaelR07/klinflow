/**
 * AvailableJobs.jsx — Job cards with AI recommendations, accept/reject
 */
import { useEffect, useState } from 'react';
import { 
  Sparkles, MapPin, Clock, Package, CheckCircle, XCircle, 
  RefreshCw, Loader2, Navigation, Zap, Truck, User, ArrowLeft,
  ChevronRight, Calendar, Scale, ChevronDown
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
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'available');
  const [weighingJob, setWeighingJob] = useState(null);
  const [weightValue, setWeightValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

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
  const profile = useAuthStore(s => s.profile);
  const categories = useServiceStore(s => s.categories);
  const fetchCategories = useServiceStore(s => s.fetchCategories);

  useEffect(() => {
    fetchAvailableJobs();
    fetchActiveJobs();
    fetchCategories();
    if (profile?.isOnline) subscribeToJobs();
    return () => cleanupJobs();
  }, [profile?.isOnline]);

  const handleAccept = async (job) => {
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
      : rejectedJobs;

  const TABS = [
    { id: 'available', label: 'Requested', count: availableJobs.length },
    { id: 'active', label: 'Accepted', count: activeJobs.length },
    { id: 'rejected', label: 'Rejected', count: rejectedJobs.length },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F8FF] dark:bg-slate-900 transition-colors">
      {/* ── TOP NAV (Edge to Edge PWA Style) ── */}
      <div className="-mx-1 -mt-6 bg-white dark:bg-slate-900 pt-[calc(env(safe-area-inset-top,1.5rem)+0.75rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-11 h-11 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Missions</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Available Jobs</p>
          </div>
          
          <div className="w-11 flex items-center justify-center">
             <RefreshCw className={`w-4 h-4 text-slate-300 ${isLoadingJobs ? 'animate-spin' : ''}`} onClick={() => fetchAvailableJobs()} />
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2 pb-24 pt-0 relative max-w-lg mx-auto w-full">
        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 border-b border-slate-200 dark:border-slate-800">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

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
          <div className="space-y-1">
            {currentJobs.map((job) => {
              const waste = categories.find((w) => w.slug === job.material) || 
                            categories.find((w) => w.id === job.material);
              const isExpanded = expandedId === job.id;
              
              return (
                <div 
                  key={job.id} 
                  className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden"
                >
                  <div 
                    className="p-4 cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : job.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-inner border border-slate-100 dark:border-slate-700 shrink-0">
                          {waste?.icon || '📦'}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            material-type:<span className="text-slate-900 dark:text-white">{waste?.label || job.material}</span>
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            ID: <span className="text-indigo-600 font-mono">{job.id.slice(0, 8).toUpperCase()}</span>
                          </p>
                          <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400" /> {job.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-lg ${
                          job.time?.toUpperCase() === 'ASAP' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {job.time?.toLowerCase() || 'scheduled'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-4 border-t border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30 animate-in fade-in slide-in-from-top-1 duration-300">
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/50">
                         <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Client Name</p>
                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{job.customerName || job.customer || 'Resident'}</p>
                         </div>
                         <div className="space-y-1 text-right">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Est. Payload</p>
                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{job.actual_weight_kg || job.bags || 0}kg</p>
                         </div>
                      </div>

                      <div className="py-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Potential Earning</p>
                         <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest italic flex items-center gap-1.5">
                            <Zap className="w-3 h-3 fill-emerald-500" /> KSh {Math.floor((job.actual_weight_kg || job.bags || 0) * 10)} est.
                         </p>
                      </div>

                      <div className="flex flex-col gap-3 py-4">
                        {job.notes && (
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Instructions</p>
                            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 italic">"{job.notes}"</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 mt-2">
                        {activeTab === 'available' ? (
                          <>
                            <button 
                              onClick={() => rejectJob(job.id)}
                              className="flex-1 py-3 text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Dismiss
                            </button>
                            <button 
                              onClick={() => handleAccept(job)}
                              className="flex-[2] py-3 text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                            >
                              <Truck className="w-3.5 h-3.5" /> Accept Mission
                            </button>
                          </>
                        ) : activeTab === 'active' ? (
                          <button 
                            onClick={() => navigate(`/jobs/navigate/${job.id}`)}
                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <Navigation className="w-4 h-4" /> Start Navigation
                          </button>
                        ) : (
                          <button 
                            onClick={() => restoreJob(job.id)}
                            className="w-full py-3 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Restore
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
