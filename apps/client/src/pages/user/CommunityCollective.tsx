import { useEffect, useState } from 'react';
import {
  ArrowLeft, HelpCircle, Leaf, Users, TrendingUp, ShieldCheck,
  CheckCircle2, ChevronRight, Trophy, Gift, Award, Handshake, Target, DollarSign, X, Search
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { OptimizedImage } from '@klinflow/ui';
import { useAuthStore, useCollectiveStore } from '@klinflow/core';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommunityCollective() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const estateName = profile?.location?.estate || profile?.estate || 'Nairobi';
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const {
    swarms, estateStats,
    fetchSwarms, fetchEstateStats,
    setupSubscriptions, cleanupSubscriptions
  } = useCollectiveStore();

  useEffect(() => {
    fetchSwarms(estateName, profile?.role);
    fetchEstateStats(estateName);
    setupSubscriptions(estateName, profile?.role);
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

          <h1 className="text-lg font-bold text-slate-600 dark:text-white">Community Collective</h1>

          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="p-2 -mr-2 rounded-xl text-slate-800 dark:text-white active:scale-95 transition-all"
          >
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
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat  z-0"
            style={{ backgroundImage: "url('/vectors/community-banner.webp')" }}
          />

          <div className="relative z-10 flex flex-col space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-200  rounded-full w-fit  shadow-sm backdrop-blur-sm">
              <Leaf className="w-3.5 h-3.5 text-green-600 " />
              <span className="text-[10px] font-bold text-green-700 ">Stronger Together</span>
            </div>

            <div className="w-[85%] md:w-[70%] space-y-3">
              <h1 className="text-3xl font-black leading-[1.1] tracking-tight drop-shadow-sm">
                <span className="text-[#0e1d2c] dark:text-white block">More Impact.</span>
                <span className="text-white block">More Rewards.</span>
              </h1>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-100 leading-relaxed pr-2">
                Collaborate with others, Combine waste pickups, and earn rewards with community.
              </p>
            </div>
          </div>
        </div>

        {/* ── CHOOSE HOW TO GROW ── */}
        <div className="flex items-center justify-center gap-2 py-2 ">
          <Leaf className="w-4 h-4 text-[#329845]" />
          <h2 className="text-[15px] font-bold text-[#0e1d2c] dark:text-white">How do you want to grow together?</h2>
          <Leaf className="w-4 h-4 text-[#329845] scale-x-[-1]" />
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-1">
            {/* SWARMS CARD */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden">
              <div className="flex">
                {/* Left side: Illustration */}
                <div className="w-[40%] shrink-0 relative bg-emerald-50/50 dark:bg-slate-800/50">
                  <img
                    src="/vectors/goals.webp"
                    alt="Swarms"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </div>
                {/* Right side: Info + Steps */}
                <div className="w-[60%] flex flex-col justify-center items-center gap-2 p-3 pl-3">
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-[#329845] dark:text-green-400" />
                      </div>
                      <h3 className="text-[14px] font-bold text-[#0e1d2c] dark:text-white leading-tight">Join a Swarm</h3>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-[1.4] font-medium pr-1">
                      Team up nearby.<br />Fill the truck. Earn more.
                    </p>
                  </div>
                  
                  {/* 3 Steps */}
                  <div className="flex flex-col gap-1 pl-0.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-[#329845] dark:text-green-400 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">1. Join others</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-[#329845] dark:text-green-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">2. Add your waste</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-[#329845] dark:text-green-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">3. Truck comes & earn</span>
                    </div>
                  </div>
                  
                  <Link
                    to="/swarms"
                    className="w-full py-1.5 mt-1 bg-[#329845] hover:bg-[#287d37] text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 transition-colors relative shadow-sm"
                  >
                    <span>Explore Swarms</span>
                    <ChevronRight className="w-3.5 h-3.5 absolute right-2" />
                  </Link>
                </div>
              </div>
            </div>

            {/* GROUP RFQS CARD (ONLY FOR SELLERS) */}
            {profile?.role === 'seller' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden">
                <div className="flex">
                  {/* Left side: Illustration */}
                  <div className="w-[40%] shrink-0 relative bg-emerald-50/50 dark:bg-slate-800/50">
                    <img
                      src="/vectors/klin-challenges.webp"
                      alt="Group Contracts"
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  </div>
                  {/* Right side: Info + Steps */}
                  <div className="w-[60%] flex flex-col justify-center items-center gap-2 p-3 pl-3">
                    <div>
                      <div className="flex items-center gap-1 mb-1.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Handshake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-[14px] font-bold text-[#0e1d2c] dark:text-white leading-tight">Group RFQs</h3>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-[1.4] font-medium pr-1">
                        Pool resources.<br />Fulfill large volume orders.
                      </p>
                    </div>
                    
                    {/* 3 Steps */}
                    <div className="flex flex-col gap-1 pl-0.5">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">1. Take a contract</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">2. Others join in</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">3. Fulfill and earn</span>
                      </div>
                    </div>

                    <Link
                      to="/group-rfqs"
                      className="w-full py-1.5 mt-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 transition-colors relative shadow-sm"
                    >
                      <span>View Contracts</span>
                      <ChevronRight className="w-3.5 h-3.5 absolute right-2" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* INDIVIDUAL RFQS CARD (ONLY FOR SELLERS) */}
            {profile?.role === 'seller' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden">
                <div className="flex">
                  {/* Left side: Illustration */}
                  <div className="w-[40%] shrink-0 relative bg-emerald-50/50 dark:bg-slate-800/50">
                    <img
                      src="/vectors/individual-rfq.webp"
                      alt="Individual RFQs"
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  </div>
                  {/* Right side: Info + Steps */}
                  <div className="w-[60%] flex flex-col justify-center items-center gap-2 p-3 pl-3">
                    <div>
                      <div className="flex items-center gap-1 mb-1.5">
                        <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                          <Target className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <h3 className="text-[14px] font-bold text-[#0e1d2c] dark:text-white leading-tight">Individual RFQs</h3>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-[1.4] font-medium pr-1">
                        Go solo.<br />Fulfill direct buyer requests.
                      </p>
                    </div>
                    
                    {/* 3 Steps */}
                    <div className="flex flex-col gap-1 pl-0.5 w-full">
                      <div className="flex items-center gap-2">
                        <Search className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">1. Find a request</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Handshake className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">2. Submit your bid</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">3. Win the contract</span>
                      </div>
                    </div>

                    <Link
                      to="/individual-rfqs"
                      className="w-full py-1.5 mt-1 bg-purple-600 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 transition-colors relative shadow-sm"
                    >
                      <span>View Open RFQs</span>
                      <ChevronRight className="w-3.5 h-3.5 absolute right-2" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

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

      {/* ── HELP MODAL ── */}
      <AnimatePresence>
        {isHelpModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[60] bg-white dark:bg-slate-900 flex flex-col items-center"
          >
            {/* Header - Truly Fixed */}
            <div className="w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-5 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">How it Works</h2>
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 w-full max-w-lg overflow-y-auto no-scrollbar">
              <div className="p-5 space-y-8 pb-24">
                
                {/* Swarm Groups */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm overflow-hidden">
                  <div className="w-full aspect-[16/9] bg-emerald-50 dark:bg-emerald-900/20 relative flex items-center justify-center border-b border-emerald-100 dark:border-emerald-800/40 overflow-hidden">
                    <img src="/vectors/klin-swarms.webp" alt="Swarms Illustration" className="w-full h-full object-fit" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-black text-slate-600 dark:text-white tracking-tight">Swarm Groups</h3>
                    </div>
                    <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Swarms allow residents and sellers in the same location to pool their materials together. Once the swarm reaches its weight goal, an agent comes to pick it up, and everyone gets paid based on their individual contribution. It's a great way to save time and fuel on transport costs and earn more together!
                    </p>
                  </div>
                </div>

                {/* Group Contracts */}
                {profile?.role === 'seller' && (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm overflow-hidden">
                    <div className="w-full aspect-[16/9] bg-blue-50 dark:bg-blue-900/20 relative flex items-center justify-center border-b border-blue-100 dark:border-blue-800/40 overflow-hidden">
                      <img src="/vectors/klin-contract.webp" alt="Group Contracts Illustration" className="w-full h-full object-fit" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                          <Handshake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-black text-slate-600 dark:text-white tracking-tight">Group Contracts</h3>
                      </div>
                      <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        Group Contracts are massive, high-paying orders from major buyers that require a huge amount of material. Since one seller might not have enough stock, multiple sellers can pledge their available materials to fulfill the contract collectively. It's a collaborative way to secure big deals and guarantee sales!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
