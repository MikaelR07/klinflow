import { useEffect, useState } from 'react';
import {
  ArrowLeft, HelpCircle, Leaf, Users, TrendingUp, ShieldCheck,
  CheckCircle2, ChevronRight, Trophy, Gift, Award, Handshake, Target, DollarSign, X, Search
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
          <img 
            src="/vectors/community-banner-real.webp" 
            alt="Community Collective"
            className="w-full h-auto object-contain"
          />
        </div>

        {/* ── CHOOSE HOW TO GROW ── */}
        <div className="flex items-center justify-center gap-2 py-2 ">
          <Leaf className="w-4 h-4 text-[#329845]" />
          <h2 className="text-[15px] font-bold text-[#0e1d2c] dark:text-white">How do you want to grow together?</h2>
          <Leaf className="w-4 h-4 text-[#329845] scale-x-[-1]" />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* SWARMS CARD */}
            <motion.div whileHover={{ y: -2 }} className="bg-slate-200 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden">
              <div className="w-full aspect-[2/1] relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src="/vectors/klin-swarms-real.webp"
                  alt="Swarms"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border border-emerald-500/30">
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-[18px] font-black text-white leading-tight drop-shadow-sm">Join a Swarm</h3>
                </div>
              </div>
              
              <div className="flex flex-col p-4 md:p-5">
                <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium mb-5">
                  Team up nearby. Fill the truck together. Unlock premium rates and earn more.
                </p>
                
                {/* 3 Steps */}
                <div className="flex items-center justify-between gap-2 mb-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">1. Join</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                  <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                    <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">2. Add Waste</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                  <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">3. Earn</span>
                  </div>
                </div>
                
                <Link
                  to="/swarms"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                >
                  <span>Explore Swarms</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* GROUP RFQS CARD (ONLY FOR SELLERS) */}
            {profile?.role === 'seller' && (
              <motion.div whileHover={{ y: -2 }} className="bg-slate-200 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden">
                <div className="w-full aspect-[2/1] relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src="/vectors/klin-contract-real.webp"
                    alt="Group Contracts"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 backdrop-blur-md flex items-center justify-center border border-blue-500/30">
                      <Handshake className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="text-[18px] font-black text-white leading-tight drop-shadow-sm">Group Contracts</h3>
                  </div>
                </div>
                
                <div className="flex flex-col p-4 md:p-5">
                  <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium mb-5">
                    Pool resources with other sellers to fulfill large volume orders from major buyers.
                  </p>
                  
                  {/* 3 Steps */}
                  <div className="flex items-center justify-between gap-2 mb-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                      <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">1. Find</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                    <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">2. Pool</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                    <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                      <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">3. Fulfill</span>
                    </div>
                  </div>

                  <Link
                    to="/group-rfqs"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                  >
                    <span>View Contracts</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )}

            {/* INDIVIDUAL RFQS CARD (ONLY FOR SELLERS) */}
            {profile?.role === 'seller' && (
              <motion.div whileHover={{ y: -2 }} className="bg-slate-200 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden">
                <div className="w-full aspect-[2/1] relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src="/vectors/individual-rfq-real.webp"
                    alt="Individual RFQs"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 backdrop-blur-md flex items-center justify-center border border-rose-500/30">
                      <Target className="w-4 h-4 text-rose-400" />
                    </div>
                    <h3 className="text-[18px] font-black text-white leading-tight drop-shadow-sm">Individual Contracts</h3>
                  </div>
                </div>
                
                <div className="flex flex-col p-4 md:p-5">
                  <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium mb-5">
                    Go solo. Bid on and fulfill direct requests from verified buyers on the network.
                  </p>
                  
                  {/* 3 Steps */}
                  <div className="flex items-center justify-between gap-2 mb-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                      <Search className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">1. Find</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                    <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                      <Handshake className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">2. Bid</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                    <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                      <CheckCircle2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">3. Win</span>
                    </div>
                  </div>

                  <Link
                    to="/individual-rfqs"
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-rose-600/20"
                  >
                    <span>View Open RFQs</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* ── STATS BANNER ── */}
        <div className="bg-primary rounded-xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 mt-2 text-white">
          <div className="md:w-1/3 border-b md:border-b-0 border-white/10 pb-3 md:pb-0">
            <p className="text-[10px] font-semibold text-white/80 tracking-wide mb-1">Together, We Achieve More</p>
            <h3 className="text-sm sm:text-base font-bold leading-tight">Communities are driving real change</h3>
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-6 md:w-2/3 justify-between items-center">
            {/* 1. Group RFQs */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shrink-0 shadow-sm">
                <Handshake className="w-3.5 h-3.5 text-black" />
              </div>
              <div>
                <p className="text-sm font-black leading-tight">154</p>
                <p className="text-[9px] text-white/80 font-medium uppercase tracking-wider">Group RFQs</p>
              </div>
            </div>

            {/* 2. KSh Earned (Middle) */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shrink-0 shadow-sm">
                <Trophy className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="text-sm font-black leading-tight">KSh 4.2M+</p>
                <p className="text-[9px] text-white/80 font-medium uppercase tracking-wider">Earned</p>
              </div>
            </div>

            {/* 3. Indiv RFQs */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shrink-0 shadow-sm">
                <Target className="w-3.5 h-3.5 text-black" />
              </div>
              <div>
                <p className="text-sm font-black leading-tight">892</p>
                <p className="text-[9px] text-white/80 font-medium uppercase tracking-wider">Indiv. RFQs</p>
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
                    <img src="/vectors/klin-swarms-real.webp" alt="Swarms Illustration" className="w-full h-full object-cover" />
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
                      <img src="/vectors/klin-contract-real.webp" alt="Group Contracts Illustration" className="w-full h-full object-cover" />
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
