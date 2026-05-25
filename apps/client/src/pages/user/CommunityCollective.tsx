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

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+3.75rem)] pb-[2rem] max-w-lg mx-auto w-full px-1.5 space-y-7">

        {/* ── COMMUNITY PRIDE BANNER ── */}
        <div className="bg-[#0b3c2d] rounded-2xl p-4 text-white relative overflow-hidden">
          {/* Vector Image - Background on top half with fade */}
          <div className="absolute top-0 left-0 right-0 h-[75%] pointer-events-none">
            {/* Horizontal fade to protect text on the left */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b3c2d] via-[#0b3c2d]/50 to-transparent z-10" />
            {/* Vertical fade to blend seamlessly into the bottom stats area */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b3c2d]/40 to-[#0b3c2d] z-10" />
            <img src="/vectors/community.webp" alt="Community" className="w-full h-full object-cover object-right-top mix-blend-screen opacity-90 relative z-0" />
          </div>

          <div className="relative z-10 space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-1 tracking-widest text-white">Estate Impact</h2>
              <p className="text-[10px] font-semibold text-emerald-100/80 tracking-widest capitalize">Power in Unity</p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#105641] rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-bold text-slate-200 tracking-widest uppercase">NEMA Verified</span>
            </div>

            <div className="pt-5 border-t border-white/10 grid grid-cols-2 gap-4">
              <div className="border-r border-white/10">
                <p className="text-[9px] font-semibold text-emerald-100/60 uppercase tracking-widest mb-1">Total Recovery</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <p className="text-[22px] font-black tracking-tight">3,200</p>
                  <span className="text-xs font-medium text-emerald-100/80">kg</span>
                </div>
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">+12% this week</p>
              </div>
              <div className="pl-2">
                <p className="text-[9px] font-semibold text-emerald-200/60 uppercase tracking-widest mb-1">Active Weavers</p>
                <p className="text-[22px] font-black tracking-tight mb-1">128</p>
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">+8 this week</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONSOLIDATION SWARMS ── */}
        <div className="space-y-4 ">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold text-slate-500 capitalise tracking-widest">Active Logistics Swarms</h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
            </div>
          </div>

          <div className="space-y-3">
            {ACTIVE_SWARMS.map((swarm) => (
              <div key={swarm.id} className="bg-white rounded-2xl p-4 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-indigo-50/80 rounded-xl flex items-center justify-center text-indigo-600">
                      <Truck className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight mb-0.5 tracking-tight">{swarm.material}</h4>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{swarm.estate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Closes in</p>
                    <p className="text-xs font-bold text-rose-500">{swarm.timeLeft}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-[11px] font-bold text-slate-700 tracking-wide">{swarm.currentWeight} / {swarm.targetWeight} KG</p>
                    <p className="text-[11px] font-bold text-indigo-600">{Math.round((swarm.currentWeight / swarm.targetWeight) * 100)}%</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(swarm.currentWeight / swarm.targetWeight) * 100}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-7 h-7 rounded-full border-2 border-white object-cover" alt="avatar" />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">+{swarm.participants} members</p>
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] uppercase tracking-widest font-bold active:scale-95 transition-all">
                    Join Swarm
                  </button>
                </div>
              </div>
            ))}

            <button className="w-full py-4 bg-white border-2 border-dashed border-indigo-100/80 rounded-2xl text-indigo-600 font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-indigo-50/50">
              <Plus className="w-4 h-4" strokeWidth={2.5} /> Start Neighbourhood Swarm
            </button>
          </div>
        </div>

        {/* ── COLLECTIVE MISSIONS ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Collective Missions</h3>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">View all</span>
          </div>

          {COLLECTIVE_GOALS.map((goal) => {
            const percentage = Math.round((goal.progress / goal.target) * 100);
            return (
              <div key={goal.id} className="bg-white rounded-2xl p-5 border border-slate-200">
                <div className="flex justify-between items-center mb-5">
                  {/* Left Side: Header & Linear Progress */}
                  <div className="flex-1 pr-10 space-y-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-[#0b3c2d]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight mb-0.5 tracking-tight">{goal.title}</h4>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Community Goal</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00b634] rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[11px] font-bold text-[#00b634] tracking-wide">{goal.progress.toLocaleString()} / {goal.target.toLocaleString()} KG</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">12 days left</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Large Circular Progress */}
                  <div className="relative w-[88px] h-[88px] flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="44" cy="44" r="38" className="stroke-slate-100" strokeWidth="6" fill="none" />
                      <circle cx="44" cy="44" r="38" className="stroke-[#00b634]" strokeWidth="6" fill="none" strokeDasharray="239" strokeDashoffset={239 - (239 * percentage) / 100} strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-base font-bold text-slate-800">{percentage}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <img key={i} src={`https://i.pravatar.cc/100?img=${i + 20}`} className="w-7 h-7 rounded-full border-2 border-white object-cover" alt="avatar" />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">128 members contributing</p>
                </div>

                <button className="w-full mt-5 py-3.5 bg-green-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all">
                  Contribute Stock
                </button>
              </div>
            )
          })}
        </div>

        {/* ── COLLECTIVE BENEFITS ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Collective Benefits</h3>

          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar -mx-2 px-2">
            {/* Benefit 1 */}
            <div className="min-w-[140px] w-[140px] bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-start shrink-0">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-[13px] font-bold text-slate-900 leading-tight mb-1.5">Community Projects</h4>
              <p className="text-[10px] font-medium text-slate-500 leading-snug">Get educational opportunities raising awareness about recycling and sustainable living</p>
            </div>

            {/* Benefit 2 */}
            <div className="min-w-[140px] w-[140px] bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-start shrink-0">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
                <Truck className="w-4 h-4 text-indigo-600" />
              </div>
              <h4 className="text-[13px] font-bold text-slate-900 leading-tight mb-1.5">Free Logistics</h4>
              <p className="text-[10px] font-medium text-slate-500 leading-snug">Access Free Pickups everytime you notify to collect your materials</p>
            </div>

            {/* Benefit 3 */}
            <div className="min-w-[140px] w-[140px] bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-start shrink-0">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <h4 className="text-[13px] font-bold text-slate-900 leading-tight mb-1.5">Community Rewards</h4>
              <p className="text-[10px] font-medium text-slate-500 leading-snug">Grow your community Efforts by getting access to finances for waste management tools, and educational materials.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
