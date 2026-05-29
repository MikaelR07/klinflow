/**
 * CommunityCollective.jsx — The Social-Economic Hub for Weavers.
 * Solves Problem #11 (Logistics Fragmentation) and #12 (Formal Recognition)
 * through group goals and collective swarm pickups.
 */
import { useEffect } from 'react';
import {
  Users, ArrowLeft, Truck, Target,
  Flame, Award, MapPin, Zap,
  ChevronRight, ArrowRight, Share2, Plus,
  ShieldCheck, Info, X
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { OptimizedImage } from '@klinflow/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useCollectiveStore } from '@klinflow/core';
import { toast } from 'sonner';

export default function CommunityCollective() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const estateName = profile?.location?.estate || profile?.estate || 'Nairobi';
  const isSeller = profile?.role === 'seller';

  const {
    swarms, goals, estateStats, loadingSwarms, loadingGoals,
    fetchSwarms, fetchGoals, fetchEstateStats,
    setupSubscriptions, cleanupSubscriptions
  } = useCollectiveStore();

  useEffect(() => {
    fetchSwarms(estateName);
    fetchGoals(estateName);
    fetchEstateStats(estateName);
    setupSubscriptions(estateName);
    return () => cleanupSubscriptions();
  }, [estateName]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600/60 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Collective Hub</h1>
              <p className="text-[10px] font-bold text-emerald-600 capitalize tracking-widest flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-500" /> {estateName} Group
              </p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 active:scale-95 transition-all">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+3.75rem)] pb-[1rem] max-w-lg mx-auto w-full px-1.5 space-y-7">

        {/* ── COMMUNITY PRIDE BANNER ── */}
        <div className="bg-[#0b3c2d] rounded-2xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[75%] pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b3c2d] via-[#0b3c2d]/50 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b3c2d]/40 to-[#0b3c2d] z-10" />
            <OptimizedImage src="/vectors/community.webp" alt="Community" className="w-full h-full object-cover object-right-top mix-blend-screen opacity-90 relative z-0" wrapperClassName="absolute inset-0 z-0" />
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
                  <p className="text-[22px] font-black tracking-tight">
                    {estateStats?.totalRecovery !== undefined ? estateStats.totalRecovery.toLocaleString() : '...'}
                  </p>
                  <span className="text-xs font-medium text-emerald-100/80">kg</span>
                </div>

              </div>
              <div className="pl-2">
                <p className="text-[9px] font-semibold text-emerald-200/60 uppercase tracking-widest mb-1">Active Sellers</p>
                <p className="text-[22px] font-black tracking-tight mb-1">
                  {estateStats?.activeSellers !== undefined ? estateStats.activeSellers.toLocaleString() : '...'}
                </p>

              </div>
            </div>
          </div>
        </div>

        {/* ── CONSOLIDATION SWARMS ── */}
        {isSeller && (
          <div className="space-y-4">
            <Link
              to="/community-collective/swarm/create"
              className="w-full py-4 bg-white dark:bg-slate-900  border-2 border-dashed border-indigo-100/80 dark:border-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400 font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 "
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} /> Start Neighbourhood Swarm
            </Link>
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-bold text-slate-500 capitalise tracking-widest">Active Logistics Swarms</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Live</span>
              </div>
            </div>

            <div className="space-y-3">
              {loadingSwarms && swarms.length === 0 && (
                <>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 animate-pulse h-[110px]" />
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 animate-pulse h-[110px]" />
                </>
              )}

              {swarms.length === 0 && !loadingSwarms && (
                <div className="p-4 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No active swarms in your estate. Be the first to start one!</p>
                </div>
              )}
              {swarms.map((swarm) => (
                <div key={swarm.id} className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50/80 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Truck className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-0.5 tracking-tight">{swarm.material}</h4>
                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">{swarm.estate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${swarm.status === 'active' ? 'text-green-500' : 'text-emerald-500'}`}>{swarm.status}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 tracking-wide">{swarm.current_weight} / {swarm.target_weight} KG</p>
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{Math.min(100, Math.round((swarm.current_weight / swarm.target_weight) * 100))}%</p>
                    </div>
                    <div className="h-1.5 w-full bg-slate-300 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (swarm.current_weight / swarm.target_weight) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{swarm.participants_count || 0}</p>
                    </div>
                    <Link to={`/community-collective/swarm/${swarm.id}`} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[9px] uppercase tracking-widest font-bold active:scale-95 transition-all shadow-sm">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}


            </div>
          </div>
        )}

        {/* ── COLLECTIVE MISSIONS ── */}
        <div className="space-y-4 ">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Collective Missions</h3>
            <Link to="/community-collective/goal/create" className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Create Goal</Link>
          </div>

          {loadingGoals && goals.length === 0 && (
            <>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 animate-pulse h-[140px] shadow-sm" />
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 animate-pulse h-[140px] shadow-sm" />
            </>
          )}

          {goals.length === 0 && !loadingGoals && (
            <div className="p-4 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No active goals in your estate.</p>
            </div>
          )}

          {goals.map((goal) => {
            const percentage = Math.min(100, Math.round((goal.current_weight / goal.target_weight) * 100));
            return (
              <Link to={`/community-collective/goal/${goal.id}`} key={goal.id} className="block bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 active:scale-[0.98] transition-all shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex-1 pr-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-[#0b3c2d] dark:text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight tracking-tight">{goal.title}</h4>
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Community Goal</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00b634] rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-[#00b634] tracking-wide">{goal.current_weight.toLocaleString()} / {goal.target_weight.toLocaleString()} KG</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative w-[64px] h-[64px] flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="5" fill="none" />
                      <circle cx="32" cy="32" r="28" className="stroke-[#00b634]" strokeWidth="5" fill="none" strokeDasharray="176" strokeDashoffset={176 - (176 * percentage) / 100} strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-xs font-bold text-slate-800 dark:text-white">{percentage}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400">{goal.participants_count || 0} members contributing</p>
                  <div className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest">
                    View Goal
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* ── COLLECTIVE BENEFITS ── */}
        <div className="space-y-4 ">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Collective Benefits</h3>
          </div>

          <div className="grid grid-cols-1 gap-3 px-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 flex gap-4 items-start hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-colors">
              <div className="w-12 h-12 shrink-0 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1.5 tracking-tight">Community Projects</h4>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Get educational opportunities raising awareness about recycling and sustainable living within your estate.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 flex gap-4 items-start hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors">
              <div className="w-12 h-12 shrink-0 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1.5 tracking-tight">Free Logistics</h4>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Access free pickups every time you hit your collective goal to collect your materials.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 flex gap-4 items-start hover:border-amber-200 dark:hover:border-amber-800/50 transition-colors">
              <div className="w-12 h-12 shrink-0 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1.5 tracking-tight">Community Rewards</h4>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Grow your community efforts by getting access to finances for waste management tools and materials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
