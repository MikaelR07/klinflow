import { useEffect } from 'react';
import {
  ArrowLeft, HelpCircle, Leaf, Users, TrendingUp, ShieldCheck,
  CheckCircle2, ChevronRight, Trophy, Gift, Award, Handshake, Target
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { OptimizedImage } from '@klinflow/ui';
import { useAuthStore, useCollectiveStore } from '@klinflow/core';

export default function CommunityCollective() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const estateName = profile?.location?.estate || profile?.estate || 'Nairobi';

  const {
    swarms, goals, estateStats,
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
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors pb-5">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 flex border-b border-slate-200 dark:border-slate-900/50  items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-slate-800 dark:text-white active:scale-95 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Community Collective</h1>

          <button className="p-2 -mr-2 rounded-xl text-slate-800 dark:text-white active:scale-95 transition-all">
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+3.25rem)] max-w-lg mx-auto w-full px-1.5 space-y-4">

        {/* ── HERO SECTION ── */}
        <div
          className="relative flex flex-col space-y-2 p-3 rounded-xl overflow-hidden  border border-slate-200 dark:border-slate-800"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-60 dark:opacity-30 z-0"
            style={{ backgroundImage: "url('/vectors/collective-banner.webp')" }}
          />

          <div className="relative z-10 flex flex-col space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-500/20 rounded-full w-fit border border-green-100 dark:border-green-800 shadow-sm backdrop-blur-sm">
              <Leaf className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-[10px] font-bold text-green-700 dark:text-green-400">Stronger Together</span>
            </div>

            <div className="w-[85%] md:w-[70%] space-y-3">
              <h1 className="text-3xl font-black leading-[1.1] tracking-tight drop-shadow-sm">
                <span className="text-[#0e1d2c] dark:text-white block">More Impact.</span>
                <span className="text-[#138a53] block">More Rewards.</span>
              </h1>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed pr-2">
                Collaborate with others, consolidate waste pickups, and unlock bigger opportunities for your community.
              </p>
            </div>
          </div>
        </div>



        {/* ── STATS BANNER ── */}
        <div className="bg-gradient-to-br from-primary to-emerald-700 rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/3">
            <p className="text-[10px] font-semibold text-emerald-100/80 tracking-wide mb-1">Together, We Achieve More</p>
            <h3 className="text-sm sm:text-base font-bold leading-tight">Communities are driving real change</h3>
          </div>

          <div className="flex gap-4 md:w-2/3 justify-between">
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold">1,248+</p>
                <p className="text-[9px] text-emerald-100 leading-tight mt-0.5">Active<br />Collectives</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Leaf className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold">256K+</p>
                <p className="text-[9px] text-emerald-100 leading-tight mt-0.5">Kg Waste<br />Consolidated</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold">KSh 135k+</p>
                <p className="text-[9px] text-emerald-100 leading-tight mt-0.5">Earned by<br />Communities</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CHOOSE HOW TO GROW ── */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-[#0e1d2c] dark:text-white">Choose how you want to grow</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Two powerful ways to collaborate</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* SWARMS CARD */}
            <div className="bg-white dark:bg-slate-900/60 rounded-xl p-2 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
              <div className="relative h-32 mb-4 rounded-xl overflow-hidden bg-gradient-to-tr from-green-50 to-emerald-100/50 dark:from-slate-700 dark:to-slate-700/50">
                <div className="absolute top-3 left-3 w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm z-10">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <OptimizedImage
                  src="/vectors/recycle-banner.webp"
                  alt="Swarms"
                  wrapperClassName="w-full h-full"
                  className="w-full h-full object-cover object-bottom mix-blend-multiply dark:mix-blend-screen opacity-80"
                />
              </div>

              <div className="flex justify-between items-start mb-1">
                <h3 className="text-base font-black text-[#0e1d2c] dark:text-white">Bulk Selling Groups</h3>
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">
                  {swarms.length} Groups
                </span>
              </div>
              <p className="text-xs font-bold text-[#0e1d2c] dark:text-white mb-2">Team up for pickup opportunities</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed flex-1">
                Join or create a swarm to combine waste pickups in your area and earn more together.
              </p>

              <ul className="space-y-2.5 mb-5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Better Prices for materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Priority Pickups from agents</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Group Bonuses to everyone</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Unlock Klinflow Group Rewards</span>
                </li>
              </ul>

              <Link
                to="/swarms"
                className="w-full py-3.5 bg-[#258a50] hover:bg-[#1f7343] text-white rounded-xl font-bold text-sm flex items-center justify-between px-5 transition-colors"
              >
                Explore Swarms
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            {/* COMMUNITY GOALS CARD */}
            <div className="bg-white dark:bg-slate-900/60 rounded-xl p-2 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
              <div className="relative h-32 mb-4 rounded-xl overflow-hidden bg-gradient-to-tr from-green-50 to-emerald-100/50 dark:from-slate-700 dark:to-slate-700/50">
                <div className="absolute top-3 left-3 w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm z-10">
                  <Target className="w-4 h-4 text-green-600" />
                </div>
                <OptimizedImage
                  src="/vectors/community.webp"
                  alt="Community Goals"
                  wrapperClassName="w-full h-full"
                  className="w-full h-full object-cover object-bottom mix-blend-multiply dark:mix-blend-screen opacity-80"
                />
              </div>

              <div className="flex justify-between items-start mb-1">
                <h3 className="text-base font-black text-[#0e1d2c] dark:text-white">Community Challenges</h3>
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">
                  {goals.length}
                </span>
              </div>
              <p className="text-xs font-bold text-[#0e1d2c] dark:text-white mb-2">Work together. Achieve bigger. Earn more.</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed flex-1">
                Set goals as a community, track progress, and unlock milestone rewards for everyone.
              </p>

              <ul className="space-y-2.5 mb-5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Create and join community goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Track progress in real-time</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Unlock milestone rewards</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Celebrate impact together</span>
                </li>
              </ul>

              <Link
                to="/community-goals"
                className="w-full py-3.5 bg-[#258a50] hover:bg-[#1f7343] text-white rounded-xl font-bold text-sm flex items-center justify-between px-5 transition-colors"
              >
                View Community Goals
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

          </div>
        </div>

        {/* ── FOOTER REAL REWARDS ── */}
        <div className="bg-[#F4F6F9] dark:bg-slate-900/60 rounded-xl p-2 space-y-4 border border-slate-100 dark:border-slate-700">
          <h3 className="text-[13px] font-bold text-[#0e1d2c] dark:text-white">Real Rewards. Real Impact.</h3>

          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#fdeec8] dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-[#eab308]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">Group Bonuses</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Extra points for collective achievements</p>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#dcfce7] dark:bg-green-500/20 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4 text-[#22c55e]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">Exclusive Rewards</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Access special rewards for collectives</p>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#e0e7ff] dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-[#3b82f6]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">Impact Recognition</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Get recognized on leaderboards and beyond</p>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#ffedd5] dark:bg-orange-500/20 flex items-center justify-center shrink-0">
                <Handshake className="w-4 h-4 text-[#f97316]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">Stronger Communities</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Build connections that last</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
