/**
 * CommunityCollective.jsx — The Social-Economic Hub for Weavers.
 * Solves Problem #11 (Logistics Fragmentation) and #12 (Formal Recognition)
 * through group goals and collective swarm pickups.
 */
import { useState, useEffect, useMemo } from 'react';
import { 
  Users, ArrowLeft, Truck, Target, 
  Flame, Award, MapPin, Zap,
  ChevronRight, ArrowRight, Share2, Plus,
  ShieldCheck, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';

const ACTIVE_SWARMS = [
  { id: 'swarm-1', estate: 'Eastleigh Section 3', material: 'Mixed Plastic', currentWeight: 145, targetWeight: 200, participants: 4, timeLeft: '2h 15m' },
  { id: 'swarm-2', estate: 'Pangani', material: 'Cardboard', currentWeight: 80, targetWeight: 300, participants: 2, timeLeft: '5h 45m' },
];

const COLLECTIVE_GOALS = [
  { id: 'goal-1', title: 'The 5-Ton Challenge', description: 'Our community goal to recover 5,000kg this month.', progress: 3200, target: 5000, reward: 'Community Health Day' },
];

export default function CommunityCollective() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const estateName = profile?.location?.estate || profile?.estate || 'Nairobi';

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800  transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Collective Hub</h1>
              <p className="text-[10px] font-bold text-emerald-600 capitalize tracking-widest flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-500" /> {estateName} Sacco
              </p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 active:scale-95 transition-all">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+3.75rem)] pb-2 max-w-lg mx-auto w-full px-1.5 space-y-6">
        
        {/* ── COMMUNITY PRIDE BANNER ── */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-xl shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                🏙️
              </div>
              <div>
                <h3 className="text-sm font-bold capitalize tracking-tight leading-none mb-1.5">Estate Impact</h3>
                <p className="text-[10px] font-bold text-emerald-100/80 capitalize tracking-widest leading-none">Power in Unity</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-xl font-black text-white leading-none mb-1">3,200kg</p>
                <p className="text-[10px] font-bold text-emerald-200/60 capitalize tracking-widest">Total Recovery</p>
              </div>
              <div>
                <p className="text-xl font-black text-white leading-none mb-1">128</p>
                <p className="text-[10px] font-bold text-emerald-200/60 capitalize tracking-widest">Active Weavers</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONSOLIDATION SWARMS (Problem #11) ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">Active Logistics Swarms</h3>
            <span className="px-2 py-0.5 bg-indigo-500 text-white text-[8px] font-black capitalize rounded-full animate-pulse">Live</span>
          </div>

          <div className="space-y-3">
            {ACTIVE_SWARMS.map((swarm) => (
              <div key={swarm.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize leading-none mb-1 tracking-tight">{swarm.material}</h4>
                      <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">{swarm.estate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 capitalize tracking-widest mb-1">Closing In</p>
                    <p className="text-xs font-bold text-rose-500 capitalize">{swarm.timeLeft}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 capitalize tracking-widest">Payload: {swarm.currentWeight} / {swarm.targetWeight} KG</p>
                    <p className="text-[10px] font-bold text-indigo-600">{Math.round((swarm.currentWeight / swarm.targetWeight) * 100)}%</p>
                  </div>
                  <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(swarm.currentWeight / swarm.targetWeight) * 100}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">👤</div>
                    ))}
                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black">+{swarm.participants}</div>
                  </div>
                  <button className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold capitalize tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-500/20">
                    Join Swarm
                  </button>
                </div>
              </div>
            ))}

            <button className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 font-bold text-[10px] capitalize tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
              <Plus className="w-4 h-4" /> Start Neighborhood Swarm
            </button>
          </div>
        </div>

        {/* ── COLLECTIVE GOALS ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">Collective Missions</h3>
            <Target className="w-4 h-4 text-slate-300" />
          </div>

          {COLLECTIVE_GOALS.map((goal) => (
            <div key={goal.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize tracking-tight mb-1.5">{goal.title}</h4>
                    <p className="text-xs font-medium text-slate-500 leading-tight italic">{goal.description}</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-bold text-primary capitalize">Community Reward: {goal.reward}</p>
                    <p className="text-[10px] font-bold text-slate-400">{goal.progress} / {goal.target} KG</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.3)]" style={{ width: `${(goal.progress / goal.target) * 100}%` }} />
                  </div>
                </div>

                <button className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-[10px] capitalize tracking-widest active:scale-95 transition-all">
                  Contribute Stock
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── FORMAL RECOGNITION (Problem #12) ── */}
        <div className="bg-slate-900 dark:bg-emerald-950/20 rounded-2xl p-5 text-white space-y-4 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
              🤝
            </div>
            <div>
              <h3 className="text-sm font-bold capitalize tracking-tight leading-none mb-1.5">Formal Recognition</h3>
              <p className="text-[10px] font-bold text-slate-400/80 capitalize tracking-widest">Institutional Access</p>
            </div>
          </div>
          <p className="text-xs font-medium text-slate-400 leading-relaxed italic">
            "Weavers in this collective are eligible for subsidized health insurance and NEMA-certified transport permits through the Sacco program."
          </p>
          <button className="w-full py-3.5 bg-white text-slate-900 rounded-xl font-bold text-[10px] capitalize tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Apply for Permits
          </button>
        </div>

      </main>
    </div>
  );
}
