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
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-70 z-0"
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

        {/* ── CHOOSE HOW TO GROW ── */}
        <div className="flex items-center justify-center gap-2 py-2 pt-4">
          <Leaf className="w-4 h-4 text-[#329845]" />
          <h2 className="text-[15px] font-bold text-[#0e1d2c] dark:text-white">How do you want to grow together?</h2>
          <Leaf className="w-4 h-4 text-[#329845] scale-x-[-1]" />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* SWARMS CARD */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden">
              <div className="flex gap-4">
                {/* Left side: Illustration */}
                <div className="w-[45%] shrink-0 flex items-end justify-center -ml-2">
                  <OptimizedImage
                    src="/vectors/recycle-banner.webp"
                    alt="Swarms"
                    className="w-[115%] h-auto object-contain object-bottom origin-bottom-left"
                    wrapperClassName="w-full flex items-end justify-center"
                  />
                </div>
                {/* Right side: Info */}
                <div className="flex-1 space-y-2 py-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-[#329845] dark:text-green-400" />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#0e1d2c] dark:text-white leading-tight">Join a Swarm</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-[1.4] font-medium pr-2">
                    Team up nearby.<br />Fill the truck. Earn more.
                  </p>
                </div>
              </div>

              {/* 3 Steps */}
              <div className="flex items-center justify-between mt-6 mb-5 px-1 relative">
              
                <div className="flex flex-col items-center gap-2 z-10 w-1/3">
                  <div className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#329845] dark:text-green-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center">1. Join others</span>
                </div>

                <div className="z-10 bg-white dark:bg-slate-900 px-1 -mt-5">
                  <ChevronRight className="w-3 h-3 text-[#329845] dark:text-green-400" />
                </div>

                <div className="flex flex-col items-center gap-2 z-10 w-1/3">
                  <div className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#329845] dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center">2. Add your waste</span>
                </div>

                <div className="z-10 bg-white dark:bg-slate-900 px-1 -mt-5">
                  <ChevronRight className="w-3 h-3 text-[#329845] dark:text-green-400" />
                </div>

                <div className="flex flex-col items-center gap-2 z-10 w-1/3">
                  <div className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#329845] dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center leading-[1.2]">3. Truck comes<br />& everyone earns</span>
                </div>
              </div>

              <Link
                to="/swarms"
                className="w-full py-3.5 bg-[#329845] hover:bg-[#287d37] text-white rounded-[10px] font-bold text-xs flex items-center justify-center gap-2 transition-colors relative shadow-sm"
              >
                <span>Explore Swarms</span>
                <ChevronRight className="w-4 h-4 absolute right-4" />
              </Link>
            </div>

            {/* COMMUNITY GOALS CARD */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden">
              <div className="flex gap-4">
                {/* Left side: Illustration */}
                <div className="w-[45%] shrink-0 flex items-end justify-center -ml-2">
                  <OptimizedImage
                    src="/vectors/community.webp"
                    alt="Community Goals"
                    className="w-[115%] h-auto object-contain object-bottom origin-bottom-left"
                    wrapperClassName="w-full flex items-end justify-center"
                  />
                </div>
                {/* Right side: Info */}
                <div className="flex-1 space-y-2 py-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-[#329845] dark:text-green-400" />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#0e1d2c] dark:text-white leading-tight">Join a Goal</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-[1.4] font-medium pr-2">
                    Work together.<br />Hit the target. Unlock rewards.
                  </p>
                </div>
              </div>

              {/* 3 Steps */}
              <div className="flex items-center justify-between mt-6 mb-5 px-1 relative">
      
                <div className="flex flex-col items-center gap-2 z-10 w-1/3">
                  <div className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#329845] dark:text-green-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center">1. Many contribute</span>
                </div>

                <div className="z-10 bg-white dark:bg-slate-900 px-1 -mt-5">
                  <ChevronRight className="w-3 h-3 text-[#329845] dark:text-green-400" />
                </div>

                <div className="flex flex-col items-center gap-2 z-10 w-1/3">
                  <div className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-[#329845] dark:text-green-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center">2. Reach the goal</span>
                </div>

                <div className="z-10 bg-white dark:bg-slate-900 px-1 -mt-5">
                  <ChevronRight className="w-3 h-3 text-[#329845] dark:text-green-400" />
                </div>

                <div className="flex flex-col items-center gap-2 z-10 w-1/3">
                  <div className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-[#329845] dark:text-green-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center leading-[1.2]">3. Unlock rewards<br />together</span>
                </div>
              </div>

              <Link
                to="/community-goals"
                className="w-full py-3.5 bg-[#329845] hover:bg-[#287d37] text-white rounded-[10px] font-bold text-xs flex items-center justify-center gap-2 transition-colors relative shadow-sm"
              >
                <span>View Goals</span>
                <ChevronRight className="w-4 h-4 absolute right-4" />
              </Link>
            </div>

          </div>
        </div>

       
        {/* ── STATS BANNER ── */}
        <div className="bg-gradient-to-br from-primary to-emerald-700 rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/3">
            <p className="text-[10px] font-semibold text-emerald-100/80 tracking-wide mb-1">Together, We Achieve More</p>
            <h3 className="text-sm sm:text-base text-white font-bold leading-tight">Communities are driving real change</h3>
          </div>

          <div className="flex gap-4 md:w-2/3 justify-between">
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold">876+</p>
                <p className="text-[9px] text-emerald-100 leading-tight mt-0.5">Active<br />Collectives</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Leaf className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold">58K+</p>
                <p className="text-[9px] text-emerald-100 leading-tight mt-0.5">Kg Waste<br />Consolidated</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold">KSh 127k+</p>
                <p className="text-[9px] text-emerald-100 leading-tight mt-0.5">Earned by<br />Communities</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
