import { useEffect, useState } from 'react';
import {
  ArrowLeft, HelpCircle, Leaf, Users, TrendingUp, ShieldCheck,
  CheckCircle2, ChevronRight, Trophy, Gift, Award, Handshake, Target, DollarSign, X, Search,
  MonitorCheck,
  Coins
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
  }, [estateName, profile?.id]);

  return (
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors pb-5">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 flex border-b border-slate-200 dark:border-slate-900/50  items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-slate-800 dark:text-white active:scale-95 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Community Collective</h1>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 capitalize tracking-wide">A greener way to connect</span>
          </div>

          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="p-2 -mr-2 rounded-xl text-slate-800 dark:text-white active:scale-95 transition-all"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+4.25rem)] max-w-lg mx-auto w-full px-1.5 space-y-4">

        {/* ── HERO & STATS GROUP ── */}
        <div className="flex flex-col">
          {/* ── HERO SECTION ── */}
          <div className="relative w-full rounded-3xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800/60">
          {/* Background Image & Overlay */}
          <img 
            src={profile?.role === 'user' ? "/vectors/resident-banner.webp" : "/vectors/community-banner-real.webp"} 
            alt="Community Background" 
            className="absolute inset-0 w-full h-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 to-transparent dark:from-slate-950/95 dark:via-emerald-950/80"></div>
          {/* via-emerald-950/80 */}
          <div className="relative z-10 p-4 flex flex-col gap-4">
            {/* Top: Text */}
            {profile?.role === 'user' ? (
              <div className="min-h-[200px] flex flex-col justify-center">
                <h2 className="text-2xl font-black text-white leading-tight mb-1.5 tracking-tight">
                  Recycle Together.<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Earn Together.</span>
                </h2>
                <p className="text-[12px] text-slate-200 font-medium leading-relaxed max-w-[280px]">
                  Join your neighborhood's group pickups. Pool your recyclables to unlock premium rates and build a cleaner estate!
                </p>
              </div>
            ) : (
              <div className="min-h-[180px] flex flex-col justify-center">
                <h2 className="text-2xl font-black text-white leading-tight mb-1.5 tracking-tight">
                  More Impact.<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">More Rewards.</span>
                </h2>
                <p className="text-[12px] text-slate-200 font-medium leading-relaxed max-w-[280px]">
                  Access contracts from trusted buyers and earn premium rates by joining the community network.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RESIDENT STATS BLOCK (Below Hero) ── */}
        {profile?.role === 'user' && (
          <div className="relative z-20 -mt-5 mx-4 bg-gradient-to-tr from-emerald-600 to-primary rounded-xl p-3 shadow-lg mb-2 flex flex-col gap-2 border border-emerald-500/30">
            {/* <div className="text-center px-2">
              <h3 className="text-white font-black text-[13px] tracking-wide">Communities are driving real change</h3>
            </div> */}
            
            <div className="grid grid-cols-3 gap-2 mt-1">
              <div className="flex items-center gap-2 justify-center">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0">
                  <Handshake className="w-4 h-4 text-black" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-base font-black text-white leading-none mb-0.5">{estateStats?.fulfilledGroupRFQs || 0}</p>
                  <p className="text-[9px] text-white/90 font-bold uppercase tracking-wider leading-none">
                    Completed
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 border-x border-white/20 px-2 justify-center">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 text-black" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-base font-black text-white leading-none mb-0.5">
                    {estateStats?.totalEarned ? (estateStats.totalEarned >= 1000000 ? (estateStats.totalEarned / 1000000).toFixed(1) + 'M' : (estateStats.totalEarned >= 1000 ? (estateStats.totalEarned / 1000).toFixed(1) + 'k' : estateStats.totalEarned.toString())) : 0}
                  </p>
                  <p className="text-[9px] text-white/90 font-bold uppercase tracking-wider leading-none">
                    Payout
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pl-2 justify-center">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-black" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-base font-black text-white leading-none mb-0.5">{swarms.filter(s => s.status === 'active' && new Date(s.closes_at) > new Date()).length}</p>
                  <p className="text-[9px] text-white/90 font-bold uppercase tracking-wider leading-none">
                    Active
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SELLER STATS BLOCK (Below Hero) ── */}
        {profile?.role === 'seller' && (
          <div className="relative z-20 -mt-6 mx-4 bg-slate-200 dark:bg-primary rounded-xl p-3  mb-2 flex flex-col gap-2 border border-blue-500/30">
            <div className="grid grid-cols-3 gap-2 mt-1">
              <div className="flex items-center gap-2 justify-center">
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <Handshake className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-sm font-black text-slate-800 dark:text-white leading-none mb-0.5">{estateStats?.fulfilledGroupRFQs || 0}</p>
                  <p className="text-[10px] text-slate-600 dark:text-white font-bold capitalize tracking-wider leading-none">
                    Group RFQs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 border-x border-black/20 px-2 justify-center">
                <div className="w-6 h-6  flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-sm font-black text-slate-800 dark:text-white leading-none mb-0.5">
                    {(() => {
                      const val = estateStats?.totalEarned || 0;
                      if (!val) return '0';
                      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
                      if (val >= 100000) return (val / 1000).toFixed(1) + 'k';
                      return Math.floor(val).toLocaleString();
                    })()}
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-white font-bold capitalize tracking-wider leading-none">
                    Earned
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pl-2 justify-center">
                <div className="w-6 h-6  flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-sm font-black text-slate-800 dark:text-white leading-none mb-0.5">{estateStats?.fulfilledIndividualRFQs || 0}</p>
                  <p className="text-[10px] text-slate-600 dark:text-white font-bold capitalize tracking-wider leading-none">
                    Solo RFQs
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>


        <div className="space-y-4 mt-2">
          {/* GROUP & INDIVIDUAL CONTRACTS (Horizontal Scroll) */}
          {profile?.role === 'seller' && (
            <div className="flex flex-col">
              <div className="mb-2 px-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                 
                  <h2 className="text-[15px] font-black text-slate-600 dark:text-white tracking-tight">
                    View Active Contracts
                  </h2>
                </div>
                
              </div>
              
              <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1.5 px-1.5 no-scrollbar">
                {/* GROUP RFQS */}
              <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col relative group min-w-[280px] w-[80%] max-w-[320px] snap-center shrink-0 overflow-hidden">
                <div className="w-full h-36 relative bg-slate-100 dark:bg-slate-800">
                  <img src="/vectors/klin-contract-real.webp" alt="Group Contracts" className="w-full h-full object-cover" />
                  {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /> */}
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight mb-1.5">Group Contracts</h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mb-4 flex-1 leading-relaxed">
                    Fulfill large volume orders from major buyers.
                  </p>
                  <Link
                    to="/group-rfqs"
                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 transition-all group-hover:bg-blue-600 group-hover:text-white"
                  >
                    View Contracts
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>

              {/* INDIVIDUAL RFQS */}
              <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col relative group min-w-[280px] w-[80%] max-w-[320px] snap-center shrink-0 overflow-hidden">
                <div className="w-full h-36 relative bg-slate-100 dark:bg-slate-800">
                  <img src="/vectors/individual-rfq-real.webp" alt="Individual RFQs" className="w-full h-full object-cover" />
                  {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /> */}
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight mb-1.5">Individual Contracts</h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mb-4 flex-1 leading-relaxed">
                    Go solo. Bid on and fulfill direct requests.
                  </p>
                  <Link
                    to="/individual-rfqs"
                    className="w-full py-2.5 bg-rose-600 text-white rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 transition-all"
                  >
                    View Open RFQs
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            </div>
            </div>
          )}

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
