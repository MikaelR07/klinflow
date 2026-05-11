/**
 * Trust Score Details Page — High-fidelity merchant integrity dashboard
 */
import { motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Star, TrendingUp, ShieldAlert, 
  ArrowLeft, Info, Zap, CheckCircle2, Award,
  Users, BarChart3, Heart, Scale, AlertTriangle, PackageCheck, Wallet, Sparkles,
  Clock, Handshake, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useMarketplaceStore, useBookingStore } from '@cleanflow/core';

export default function TrustScoreDetails() {
  const navigate = useNavigate();
  const { profile, fetchProfile, subscribeToProfileChanges } = useAuthStore();
  const { bookings, fetchBookings } = useBookingStore();
  const { receivedOffers, fetchReceivedOffers, isLoading, getCalculatedScore } = useMarketplaceStore();
  
  useEffect(() => {
    fetchReceivedOffers();
    fetchBookings();
    fetchProfile();
    
    if (profile?.id) {
      subscribeToProfileChanges(profile.id);
    }
  }, [fetchReceivedOffers, fetchBookings, profile?.id, fetchProfile, subscribeToProfileChanges]);

  const stats = useMemo(() => {
    const marketplaceBookings = bookings.filter(b => b.is_market_trade || b.isMarketTrade);
    const completed = marketplaceBookings.filter(b => b.status === 'completed');
    const pending = marketplaceBookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled');
    
    // Earnings from completed marketplace trades
    const lifetimeEarnings = completed.reduce((sum, o) => sum + (parseFloat(o.total_price || o.totalPrice) || 0), 0);
    
    // Escrow: Active bookings + Accepted offers not yet in bookings
    const activeBookingsValue = pending.reduce((sum, o) => sum + (parseFloat(o.total_price || o.totalPrice) || 0), 0);
    const acceptedOffersValue = receivedOffers
      .filter(o => o.status === 'accepted')
      .reduce((sum, o) => sum + (parseFloat(o.totalPrice || o.total_price) || 0), 0);

    const pendingBalance = activeBookingsValue || acceptedOffersValue;

    // Weight: Using actual verified weight from completed trades
    const totalWeight = completed.reduce((sum, o) => sum + (parseFloat(o.actual_weight_kg) || 0), 0);
    const tradesCompleted = completed.length;
    
    // Fulfillment Rate Calculation
    const cancelled = marketplaceBookings.filter(b => b.status === 'cancelled').length;
    const totalAttempted = tradesCompleted + cancelled;
    const fulfillmentRate = totalAttempted > 0 ? (tradesCompleted / totalAttempted) * 100 : 100;

    // Days Traded (Unique days with a successful completion)
    const uniqueActiveDays = new Set(
      completed.map(b => new Date(b.createdAt || b.date || b.created_at).toDateString())
    ).size;
    const daysTraded = uniqueActiveDays || 1;

    return {
      lifetimeEarnings: Math.round(lifetimeEarnings),
      pendingBalance: Math.round(pendingBalance),
      totalWeight,
      tradesCompleted,
      fulfillmentRate: fulfillmentRate.toFixed(1),
      daysTraded,
      avgResponseTime: (() => {
        const acceptedOffers = receivedOffers.filter(o => o.status === 'accepted' || o.status === 'completed');
        if (acceptedOffers.length === 0) return 0;
        
        const totalMs = acceptedOffers.reduce((sum, o) => {
          const start = new Date(o.created_at);
          // If updated_at is missing, fallback to 15 mins
          const end = o.updated_at ? new Date(o.updated_at) : new Date(start.getTime() + 15 * 60000);
          return sum + (end - start);
        }, 0);
        
        return Math.round(totalMs / acceptedOffers.length / 60000); // Return in minutes
      })()
    };
  }, [bookings, profile, receivedOffers]);

  const rawScore = getCalculatedScore(receivedOffers, profile);
  // Convert 300-850 range to 0-100%
  const score = Math.round(((rawScore - 300) / 550) * 100);
  
  const milestones = [
    { label: 'Verified Pro', status: profile?.is_verified ? 'Completed' : 'Pending', icon: ShieldCheck, desc: 'Complete identity verification to unlock higher loan limits.' },
    { label: 'Century Club', status: stats.tradesCompleted >= 100 ? 'Completed' : 'Pending', icon: Award, desc: 'Complete 100 successful trades on the CleanFlow marketplace.' },
    { label: 'Bulk Master', status: stats.totalWeight >= 1000 ? 'Completed' : 'Pending', icon: Scale, desc: 'Successfully trade over 1,000kg of recyclable materials.' },
  ];

  return (
    <div className="pb-20 space-y-6 animate-fade-in px-4">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-4 py-4">
         <button 
           onClick={() => navigate(-1)} 
           className="p-3 bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-95 transition-all"
         >
           <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
         </button>
         <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">Merchant Dashboard</h1>
      </div>

      <div className="space-y-6">
        {/* ── MASTER DASHBOARD CARD ── */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white shadow-none dark:shadow-xl dark:shadow-slate-900/10 border border-slate-100 dark:border-white/5 relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
          
          {/* Top Row: Lifetime & Weight */}
          <div className="relative z-10 flex items-center justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Lifetime Earnings</p>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight leading-none text-emerald-600 dark:text-emerald-400">KSh {stats.lifetimeEarnings.toLocaleString()}</h2>
            </div>
            
            <div className="w-px h-10 bg-slate-100 dark:bg-slate-700/50 mx-4" />
            
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end gap-2 mb-2">
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Weight Traded</p>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight leading-none text-slate-900 dark:text-white">{stats.totalWeight.toLocaleString()} <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">KG</span></h2>
            </div>
          </div>
          
          {/* Metrics Bento Grid */}
          <div className="relative z-10 grid grid-cols-4 gap-2.5 pt-6 border-t border-slate-100 dark:border-white/5">
             {/* Large Card: Available Balance */}
             <div className="col-span-2 flex flex-col justify-between bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl p-4">
               <div className="flex items-center gap-2 mb-2">
                 <Wallet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                 <p className="text-xs font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70">Available Balance</p>
               </div>
               <p className="text-base font-bold text-slate-900 dark:text-white leading-none">KSh {profile?.walletBalance?.toLocaleString() || '0'}</p>
             </div>
             
             {/* Large Card: In Escrow */}
             <div className="col-span-2 flex flex-col justify-between bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-600/70 dark:text-amber-400/70">In Escrow</p>
                </div>
                <p className="text-base font-bold text-amber-600 dark:text-amber-400 leading-none">KSh {stats.pendingBalance.toLocaleString()}</p>
             </div>

             {/* Small Card: Trades */}
             <div className="col-span-1 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-white/5 rounded-2xl p-3 text-center">
               <Handshake className="w-3.5 h-3.5 text-slate-400" />
               <div className="space-y-0.5">
                 <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{stats.tradesCompleted}</p>
                 <p className="text-[7px] font-bold uppercase tracking-tighter text-slate-400">Trades</p>
               </div>
             </div>

             {/* Small Card: Rate */}
             <div className="col-span-1 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-white/5 rounded-2xl p-3 text-center">
               <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
               <div className="space-y-0.5">
                 <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-none">{stats.fulfillmentRate}%</p>
                 <p className="text-[7px] font-bold uppercase tracking-tighter text-slate-400">Rate</p>
               </div>
             </div>

             {/* Small Card: Days */}
             <div className="col-span-1 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-white/5 rounded-2xl p-3 text-center">
               <Calendar className="w-3.5 h-3.5 text-slate-400" />
               <div className="space-y-0.5">
                 <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{stats.daysTraded}</p>
                 <p className="text-[7px] font-bold uppercase tracking-tighter text-slate-400">Days</p>
               </div>
             </div>
             
             {/* Small Card: Time */}
             <div className="col-span-1 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-white/5 rounded-2xl p-3 text-center">
               <Zap className="w-3.5 h-3.5 text-primary" />
               <div className="space-y-0.5">
                 <p className="text-sm font-bold text-primary leading-none">{stats.avgResponseTime || '15'}m</p>
                 <p className="text-[7px] font-bold uppercase tracking-tighter text-slate-400">Time</p>
               </div>
             </div>
          </div>

          {/* Integrated Trust Score Gauge & Loan Action */}
          <div className="relative z-10 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
             <div className="flex justify-center mb-8">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest">
                 <ShieldCheck className="w-3 h-3" /> Your Credit Score
               </div>
             </div>

             <div className="flex items-center gap-6 w-full">
                {/* Gauge Left - Expanded to fill more space */}
                <div className="flex-[1.6] relative aspect-[2/1]">
                   <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 55">
                     <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="0" />
                     <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#f97316" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="-21.5" />
                     <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#eab308" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="-43" />
                     <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="-64.5" />
                     <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="-86" />
                     
                     <path d="M 18 50 A 32 32 0 0 1 82 50" stroke="currentColor" className="text-slate-900 dark:text-white" strokeOpacity="0.1" strokeWidth="0.5" fill="none" strokeDasharray="2 4" />
                     
                     <g 
                       className="transition-transform duration-1000 ease-out origin-[50px_50px]" 
                       style={{ transform: `rotate(${(score / 100) * 180 - 90}deg)` }}
                     >
                       <line 
                         x1="50" y1="50" x2="50" y2="22" 
                         stroke="currentColor" 
                         strokeWidth="2.5" 
                         strokeLinecap="round" 
                         className="text-slate-900 dark:text-white" 
                       />
                     </g>
                     <circle cx="50" cy="50" r="4" fill="currentColor" className="text-slate-900 dark:text-white" />
                   </svg>
                </div>

                {/* Info & Action Right */}
                <div className="flex-1 space-y-4">
                   <div>
                      <span className="text-4xl font-semibold text-slate-900 dark:text-white tracking-tighter leading-none">{score}%</span>
                      <div className="mt-1">
                         <p className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Exceptional!</p>
                         <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 italic">Reach your goals</p>
                      </div>
                   </div>
                   <button className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap">
                     Apply Loan
                   </button>
                </div>
             </div>
          </div>
        </div>



        {/* ── HUSTLE MILESTONES ── */}
        <div className="space-y-4">
           <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
             <Award className="w-4 h-4 text-amber-500" /> Merchant Milestones
           </h2>
           <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 group">
                   <div className={`w-12 h-12 rounded-2xl ${m.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'} flex items-center justify-center shrink-0`}>
                      <m.icon className="w-6 h-6" />
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center justify-between">
                         <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{m.label}</h4>
                         <span className={`text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-lg ${m.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                           {m.status}
                         </span>
                      </div>
                      <p className="text-xs font-medium text-slate-400 mt-1 leading-relaxed">{m.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* ── IMPROVEMENT TIP ── */}
        <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl border border-primary/10 flex gap-4">
           <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-primary shadow-sm shrink-0">
              <Zap className="w-6 h-6 fill-primary" />
           </div>
           <div>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-widest">Boost Your Score</h4>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Consistently posting Grade A materials and confirming pickups instantly can boost your score by up to <span className="font-semibold">50 points</span> this month.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
