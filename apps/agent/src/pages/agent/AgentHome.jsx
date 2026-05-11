/**
 * AgentHome.jsx — Pro Command Center for CleanFlow Agents
 */
import { useEffect, useState, useMemo } from 'react';
import { 
  Package, 
  TrendingUp, 
  Truck, 
  MapPin, 
  Star, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  ShieldCheck,
  LayoutDashboard,
  Wallet,
  Briefcase,
  History,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Handshake
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentStore, useAuthStore, supabase } from '@cleanflow/core';
import { toast } from 'sonner';

export default function AgentHome() {
  const navigate = useNavigate();
  const { 
    earnings, 
    coachInsights, 
    currentInsightIndex, 
    nextInsight,
    jobHistory,
    fetchEarnings,
    fetchActiveJobs,
    fetchAvailableJobs,
    activeJobs
  } = useAgentStore();
  
  const { profile, userId } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchEarnings();
    fetchActiveJobs();
    fetchAvailableJobs();
    
    // Auto-rotate insights every 8 seconds
    const interval = setInterval(() => nextInsight(), 8000);
    return () => clearInterval(interval);
  }, []);

  const currentInsight = coachInsights[currentInsightIndex];

  // Calculate some real-time metrics
  const activeJobsCount = activeJobs.length;
  const acceptedTradesCount = jobHistory.filter(j => j.status === 'completed' && j.is_market_trade).length;

  return (
    <div className="space-y-6 animate-fade-in pb-24 pt-4 px-4">
      
      {/* ── TOP NAVIGATION ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shadow-sm overflow-hidden">
             <img 
               src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name}`} 
               alt="Avatar" 
               className="w-full h-full object-cover rounded-xl"
             />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Agent Hub</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Commander</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => navigate('/agent/profile')}
          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm"
        >
          <Sparkles className="w-5 h-5 text-indigo-500" />
        </button>
      </div>

      {/* ── QUICK NAV TABS ── */}
      <div className="grid grid-cols-4 gap-2">
        <button 
          onClick={() => navigate('/agent/jobs')}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-2xl shadow-sm flex flex-col items-center gap-1.5 transition-all active:scale-95 group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center group-active:bg-indigo-500 group-active:text-white transition-colors">
            <LayoutDashboard className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 group-active:text-inherit" />
          </div>
          <div className="text-center">
            <p className="text-[8px] font-semibold text-indigo-600 uppercase tracking-widest mb-0.5">Missions</p>
            <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">Radar</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/agent/wallet')}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-2xl shadow-sm flex flex-col items-center gap-1.5 transition-all active:scale-95 group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center group-active:bg-emerald-500 group-active:text-white transition-colors">
            <Wallet className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 group-active:text-inherit" />
          </div>
          <div className="text-center">
            <p className="text-[8px] font-semibold text-emerald-600 uppercase tracking-widest mb-0.5">Earnings</p>
            <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">Wallet</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/agent/inventory')}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-2xl shadow-sm flex flex-col items-center gap-1.5 transition-all active:scale-95 group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center group-active:bg-amber-500 group-active:text-white transition-colors">
            <Briefcase className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 group-active:text-inherit" />
          </div>
          <div className="text-center">
            <p className="text-[8px] font-semibold text-amber-600 uppercase tracking-widest mb-0.5">Stock</p>
            <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">Inventory</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/agent/history')}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-2xl shadow-sm flex flex-col items-center gap-1.5 transition-all active:scale-95 group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center group-active:bg-indigo-500 group-active:text-white transition-colors">
            <History className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 group-active:text-inherit" />
          </div>
          <div className="text-center">
            <p className="text-[8px] font-semibold text-indigo-600 uppercase tracking-widest mb-0.5">Stats</p>
            <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">Dashboard</p>
          </div>
        </button>
      </div>

      {/* ── AGENT HERO CARD: COMMAND CENTER ── */}
      <div className="relative group">

        <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-800 dark:from-orange-800 dark:via-amber-800 dark:to-rose-950 border border-slate-200 dark:border-white/10 rounded-3xl p-5 dark:shadow-xl overflow-hidden transition-all duration-500">
          
          <div className="relative z-10">
            <div className="grid grid-cols-2 gap-2.5">
              
              {/* 1. Main Stock Value (Vertical Hero) */}
              <div className="row-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-white/20 dark:border-white/10 shadow-sm flex flex-col justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-white/5 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-200" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">KSh</span>
                    {earnings.inventoryValue?.toLocaleString() || 0}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 dark:text-white/50 uppercase tracking-widest mt-1">Inventory Value</p>
                </div>
              </div>

              {/* 2. Rating */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-white/20 dark:border-white/10 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-none">
                    {profile.rating ? Number(profile.rating).toFixed(1) : '5.0'}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 dark:text-white/50 uppercase tracking-widest mt-1">Rating</p>
                </div>
              </div>

              {/* 3. Points */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-white/20 dark:border-white/10 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{profile.rewardPoints || 0}</p>
                  <p className="text-[10px] font-black text-slate-400 dark:text-white/50 uppercase tracking-widest mt-1">Points</p>
                </div>
              </div>

              {/* 4. Accepted Bids */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-white/20 dark:border-white/10 shadow-sm flex flex-col justify-between h-24">
                <Handshake className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">{acceptedTradesCount || 0}</h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-white/50 uppercase tracking-widest mt-1">Accepted Bids</p>
                </div>
              </div>

              {/* 5. Pickups Today */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-white/20 dark:border-white/10 shadow-sm flex flex-col justify-between h-24">
                <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">{earnings.completedToday || 0}</h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-white/50 uppercase tracking-widest mt-1">Pickups Today</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── ROUTE OPTIMIZER CTA ── */}
      <button
        onClick={() => navigate('/agent/routes')}
        className="w-full relative group overflow-hidden rounded-3xl p-6 bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-between transition-all active:scale-[0.98] shadow-lg"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-black tracking-tight leading-none mb-1">Route Optimizer</h3>
            <p className="text-xs font-semibold opacity-60">Optimize current missions</p>
          </div>
        </div>
        <div className="relative z-10 w-10 h-10 rounded-full border border-white/20 dark:border-slate-200 flex items-center justify-center">
          <ArrowRight className="w-5 h-5" />
        </div>
      </button>

      {/* ── COACH INSIGHTS: TIKTOK-STYLE CAROUSEL ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Strategy Engine</h3>
          <div className="flex gap-1">
            {coachInsights.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentInsightIndex ? 'w-4 bg-indigo-500' : 'w-1 bg-slate-200 dark:bg-slate-800'}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentInsight?.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-sm"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                  <span className="text-sm">{currentInsight?.icon || '🧠'}</span>
                </div>
                <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{currentInsight?.title}</h4>
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {currentInsight?.message}
              </p>
              <button 
                onClick={() => navigate(currentInsight?.target || '/agent/jobs')}
                className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest group"
              >
                {currentInsight?.action}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <Target className="w-24 h-24" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── RECENT PERFORMANCE SNEAK-PEEK ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Activity</h3>
          <button onClick={() => navigate('/agent/history')} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Full History</button>
        </div>

        <div className="space-y-3">
          {jobHistory.slice(0, 3).map((job) => (
            <div key={job.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">{job.wasteType} Collection</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.location} • {job.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-emerald-500">+ KSh {job.payout}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <ShieldCheck className="w-3 h-3 text-slate-300" />
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Verified</span>
                </div>
              </div>
            </div>
          ))}
          {jobHistory.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
              <Clock className="w-12 h-12 mb-3" />
              <p className="text-xs font-black uppercase tracking-widest">No recent missions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
