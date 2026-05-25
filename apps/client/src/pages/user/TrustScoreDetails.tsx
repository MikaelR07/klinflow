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
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';

export default function TrustScoreDetails() {
  const navigate = useNavigate();
  const { profile, walletBalance, fetchProfile, subscribeToProfileChanges } = useAuthStore();
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
    const marketplaceBookings = bookings.filter(b => b.bookingType === 'marketplace' || b.bookingType === 'marketplace_pickup');
    const completed = marketplaceBookings.filter(b => b.status === 'completed');
    const pending = marketplaceBookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled');

    // Earnings from completed marketplace trades
    const lifetimeEarnings = completed.reduce((sum, o: any) => sum + (parseFloat(String(o.totalPrice || 0))), 0);

    // Escrow: Active bookings + Accepted offers not yet in bookings
    const activeBookingsValue = pending.reduce((sum, o: any) => sum + (parseFloat(String(o.totalPrice || 0))), 0);
    const acceptedOffersValue = receivedOffers
      .filter(o => o.status === 'accepted')
      .reduce((sum, o: any) => sum + (o.offeredPrice * o.quantity), 0);

    const pendingBalance = activeBookingsValue || acceptedOffersValue;

    // Weight: Using actual verified weight from completed trades
    const totalWeight = completed.reduce((sum, o) => sum + (parseFloat(String(o.actualWeightKg || o.weightKg || 0))), 0);
    const tradesCompleted = completed.length;

    // Fulfillment Rate Calculation
    const cancelled = marketplaceBookings.filter(b => b.status === 'cancelled').length;
    const totalAttempted = tradesCompleted + cancelled;
    const fulfillmentRate = totalAttempted > 0 ? (tradesCompleted / totalAttempted) * 100 : 100;

    // Days Traded (Unique days with a successful completion)
    const uniqueActiveDays = new Set(
      completed.map((b: any) => new Date(b.createdAt || Date.now()).toDateString())
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
        const acceptedOffers = (receivedOffers as any[]).filter((o: any) => o.status === 'accepted' || o.status === 'completed');
        if (acceptedOffers.length === 0) return 0;

        const totalMs = acceptedOffers.reduce((sum, o: any) => {
          const start = new Date(o.createdAt);
          // If updatedAt is missing, fallback to 15 mins
          const end = o.updatedAt ? new Date(o.updatedAt) : new Date(start.getTime() + 15 * 60000);
          return sum + (end.getTime() - start.getTime());
        }, 0);

        return Math.round(totalMs / acceptedOffers.length / 60000); // Return in minutes
      })()
    };
  }, [bookings, profile, receivedOffers]);

  const score = getCalculatedScore(receivedOffers as any, profile);
  const milestones = [
    { label: 'Verified Pro', status: profile?.isVerified ? 'Completed' : 'Pending', icon: ShieldCheck, desc: 'Complete identity verification to unlock higher loan limits.' },
    { label: 'Century Club', status: stats.tradesCompleted >= 100 ? 'Completed' : 'Pending', icon: Award, desc: 'Complete 100 successful trades on the Klinflow marketplace.' },
    { label: 'Bulk Master', status: stats.totalWeight >= 1000 ? 'Completed' : 'Pending', icon: Scale, desc: 'Successfully trade over 1,000kg of recyclable materials.' },
  ];

  return (
    <div className="pb-2 px-1.5 animate-fade-in">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800  transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Trust Score</h1>
              <p className="text-[10px] font-bold text-emerald-600 capitalize tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Merchant Integrity
              </p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 active:scale-95 transition-all">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="pt-[calc(env(safe-area-inset-top,1rem)+4rem)] space-y-6">
        {/* ── MASTER DASHBOARD CARD ── */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-2.5">

          <div className="grid grid-cols-2 gap-2.5">

            {/* 1. Lifetime Earnings */}
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-800 p-4 min-h-[140px] flex flex-col justify-between">

              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>

              <div className="space-y-2 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Lifetime Earnings
                </p>

                <div className="flex items-end gap-1 min-w-0">
                  <span className="text-xs font-bold text-slate-400 mb-1 shrink-0">
                    KSh
                  </span>

                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none truncate">
                    {stats.lifetimeEarnings.toLocaleString()}
                  </h2>
                </div>
              </div>
            </div>

            {/* 2. Available Balance */}
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-800 p-4 min-h-[140px] flex flex-col justify-between">

              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>

              <div className="space-y-2 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Available Balance
                </p>

                <div className="flex items-end gap-1 min-w-0">
                  <span className="text-xs font-bold text-slate-400 mb-1 shrink-0">
                    KSh
                  </span>

                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none truncate">
                    {walletBalance.toLocaleString()}
                  </h2>
                </div>
              </div>
            </div>

            {/* 3. In Escrow */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 min-h-[118px] flex flex-col justify-between">

              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>

              <div className="space-y-1.5 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  In Escrow
                </p>

                <div className="flex items-end gap-1 min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 mb-0.5 shrink-0">
                    KSh
                  </span>

                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none truncate">
                    {stats.pendingBalance.toLocaleString()}
                  </h3>
                </div>
              </div>
            </div>

            {/* 4. Total Traded */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 min-h-[118px] flex flex-col justify-between">

              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Scale className="w-4 h-4 text-indigo-500" />
              </div>

              <div className="space-y-1.5 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total Traded
                </p>

                <div className="flex items-end gap-1 min-w-0">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none truncate">
                    {stats.totalWeight.toLocaleString()}
                  </h3>

                  <span className="text-[11px] font-bold text-slate-400 mb-0.5 shrink-0">
                    KG
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Total Trades */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 min-h-[118px] flex flex-col justify-between">

              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Handshake className="w-4 h-4 text-purple-500" />
              </div>

              <div className="space-y-1.5 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total Trades
                </p>

                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none truncate">
                  {stats.tradesCompleted}
                </h3>
              </div>
            </div>

            {/* 6. Fulfillment */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 min-h-[118px] flex flex-col justify-between">

              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>

              <div className="space-y-1.5 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Fulfillment
                </p>

                <div className="flex items-end gap-1 min-w-0">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none truncate">
                    {stats.fulfillmentRate}
                  </h3>

                  <span className="text-[11px] font-bold text-slate-400 mb-0.5 shrink-0">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* ── PERFORMANCE STRIP ── */}
            <div className="col-span-2 rounded-2xl bg-slate-50 dark:bg-slate-800 px-2 py-4">

              <div className="grid grid-cols-3">

                {/* Days */}
                <div className="flex flex-col items-center justify-center px-2 min-w-0">

                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Days
                    </p>
                  </div>

                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {stats.daysTraded}
                  </p>
                </div>

                {/* Avg Time */}
                <div className="flex flex-col items-center justify-center border-x border-slate-200 dark:border-slate-700 px-2 min-w-0">

                  <div className="flex items-center gap-1 mb-1">
                    <Zap className="w-3.5 h-3.5 text-slate-400" />

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Avg Time
                    </p>
                  </div>

                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {stats.avgResponseTime || '15'}m
                  </p>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center justify-center px-2 min-w-0">

                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Score
                    </p>
                  </div>

                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {score}%
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* ── TRUST SCORE METER CARD ── */}
        <div className="bg-white dark:bg-slate-900 !mt-2 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/80 ">
          <div className="flex justify-center mb-4.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[11px] font-bold capitalize tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Your Credit Score
            </div>
          </div>

          <div className="flex items-center gap-6 w-full">
            {/* Info & Action Left */}
            <div className="flex-1 space-y-4">
              <div>
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{score}%</span>
                <div className="mt-1">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 capitalize tracking-tight">Exceptional!</p>
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 italic">Excellent profile</p>
                </div>
              </div>
              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold capitalize tracking-widest rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap">
                Apply Loan
              </button>
            </div>

            {/* Gauge Right - Expanded to fill more space */}
            <div className="flex-[1.4] relative aspect-[2/1]">
              <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 55">
                <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="0" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#f97316" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="-21.5" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#eab308" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="-43" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="-64.5" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="-86" />

                <path d="M 18 50 A 32 32 0 0 1 82 50" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeOpacity="0.5" strokeWidth="0.5" fill="none" strokeDasharray="2 4" />

                <g
                  className="transition-transform duration-1000 ease-out origin-[50px_50px]"
                  style={{ transform: `rotate(${(score / 100) * 180 - 90}deg)` }}
                >
                  <line
                    x1="50" y1="50" x2="50" y2="22"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="text-emerald-500"
                  />
                </g>
                <circle cx="50" cy="50" r="4" fill="currentColor" className="text-emerald-500" />
              </svg>
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
              <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 group">
                <div className={`w-12 h-12 rounded-2xl ${m.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'} flex items-center justify-center shrink-0`}>
                  <m.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{m.label}</h4>
                    <span className={`text-xs font-semibold capitalize tracking-widest px-2 py-0.5 rounded-lg ${m.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
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
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary shadow-sm shrink-0">
            <Zap className="w-6 h-6 fill-primary" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-primary capitalize tracking-widest">Boost Your Score</h4>
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Consistently posting Grade A materials and confirming pickups instantly can boost your score by up to <span className="font-semibold">50 points</span> this month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
