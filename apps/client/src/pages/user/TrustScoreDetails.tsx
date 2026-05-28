/**
 * Trust Score Details Page — High-fidelity merchant integrity dashboard
 */
import { motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import {
  ShieldCheck, Star, TrendingUp, ShieldAlert,
  ArrowLeft, Info, Zap, CheckCircle2, Award,
  Users, BarChart3, Heart, Scale, AlertTriangle, PackageCheck, Wallet, Sparkles,
  Clock, Handshake, Calendar,
  SparklesIcon, ChevronRight
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
    <div className="pb-8 min-h-screen bg-slate-50 dark:bg-slate-800 animate-fade-in relative z-10">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-slate-50/90 dark:bg-slate-800 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Trust Score

              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-[calc(env(safe-area-inset-top,1rem)+3.5rem)] px-1.5 space-y-4">



        {/* ── HERO CARD ── */}
        <div className="bg-white dark:bg-slate-900/60 rounded-[1rem] p-5 border border-slate-200 dark:border-slate-700/50 ">
          <div className="flex items-center justify-between gap-4">

            {/* Left: Text Details */}
            <div className="flex-1">

              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold mb-3">
                <Star className="w-3.5 h-3.5" /> Excellent Standing
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-200 leading-relaxed">
                You're a trusted Collection partner in Klinflow Ecosystem.
              </p>
              <div className="mt-4 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px] font-bold text-green-500">8 pts</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-200">from last month</span>
              </div>
            </div>

            {/* Right: Circle Gauge */}
            <div className="relative w-32 h-32 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background track */}
                <circle cx="50" cy="50" r="44" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="3" />
                {/* Progress arc */}
                <circle
                  cx="50" cy="50" r="44"
                  fill="transparent"
                  stroke="#10b926ff"
                  strokeWidth="3.5"
                  strokeDasharray="276.46"
                  strokeDashoffset={276.46 - (276.46 * score) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Score Inside */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{score}</span>
                <span className="text-[10px] font-bold text-slate-400 mt-1">/100</span>
              </div>
            </div>

          </div>

          <button className="w-full mt-6 py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-green-600 dark:text-green-500 transition-colors border border-slate-200 dark:border-slate-700/50">
            View Score History <TrendingUp className="w-4 h-4" />
          </button>
        </div>

        {/* ── FINANCING ELIGIBILITY ── */}
        <div className="bg-white dark:bg-slate-900/60 rounded-[1rem] p-5 border border-slate-200 dark:border-slate-700/50  relative overflow-hidden">


          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Financing Eligibility</h3>
              <Info className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-200 mb-1 font-medium">Eligible Amount</p>
                <h2 className="text-3xl font-black text-emerald-500 dark:text-green-500 tracking-tight mb-2">KES 15,000</h2>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-green-500 rounded-md text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" /> High approval chance
                </div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border border-emerald-200 dark:border-slate-700">
                <Wallet className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6 pt-5 border-t border-slate-100  dark:border-slate-600">
              <div>
                <p className="text-[9px] text-slate-500 dark:text-slate-300 mb-1 font-medium">Risk Level</p>
                <p className="text-[11px] font-bold text-emerald-500 dark:text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Low
                </p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 dark:text-slate-300 mb-1 font-medium">Repayment Confidence</p>
                <p className="text-[11px] font-bold text-emerald-500 dark:text-emerald-500">96%</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 dark:text-slate-300 mb-1 font-medium">Next Review</p>
                <p className="text-[11px] font-bold text-slate-900 dark:text-white">12 Jun 2025</p>
              </div>
            </div>

            <button className="w-full py-3.5 bg-green-600  text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-colors  active:scale-[0.98]">
              Request Financing <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── PERFORMANCE INSIGHTS ── */}
        <div>

          {/* Header */}
          <div className="flex items-center justify-between mb-2 px-1">

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Performance Insights
            </h3>

            <button className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-white dark:bg-[#151e32] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">

              This Month

              <ChevronRight className="w-3 h-3" />

            </button>

          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-2">

            {/* Fulfillment */}
            <div className="min-h-[132px] bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">

              <div className="flex items-center gap-2 mb-3">

                <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">

                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />

                </div>

                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                  Fulfillment Rate
                </span>

              </div>

              <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">
                {stats.fulfillmentRate}%
              </h4>

              <p className="text-[9px] font-bold text-emerald-500 mb-2.5">
                Excellent
              </p>

              <p className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1">

                <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />

                <span className="text-emerald-500">
                  +4%
                </span>

                from last month

              </p>

            </div>

            {/* Avg Response */}
            <div className="min-h-[132px] bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">

              <div className="flex items-center gap-2 mb-3">

                <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">

                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />

                </div>

                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                  Avg. Response Time
                </span>

              </div>

              <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">
                {stats.avgResponseTime}m
              </h4>

              <p className="text-[9px] font-bold text-emerald-500 mb-2.5">
                Excellent
              </p>

              <p className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1">

                <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />

                <span className="text-emerald-500">
                  -6m
                </span>

                improvement

              </p>

            </div>

            {/* Total Volume */}
            <div className="min-h-[132px] bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">

              <div className="flex items-center gap-2 mb-3">

                <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">

                  <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />

                </div>

                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  Total Volume
                </span>

              </div>

              <div className="flex items-baseline gap-1 mb-3.5">

                <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                  {(stats.totalWeight / 1000).toFixed(1)}
                </h4>

                <span className="text-xs font-semibold text-slate-500">
                  Ton
                </span>

              </div>

              <p className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1">

                <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />

                <span className="text-emerald-500">
                  +18%
                </span>

                from last month

              </p>

            </div>

            {/* Total Trades */}
            <div className="min-h-[132px] bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">

              <div className="flex items-center gap-2 mb-3">

                <div className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">

                  <Handshake className="w-3.5 h-3.5 text-purple-600 dark:text-purple-500" />

                </div>

                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  Total Trades
                </span>

              </div>

              <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-3.5">
                {stats.tradesCompleted}
              </h4>

              <p className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1">

                <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />

                <span className="text-emerald-500">
                  +11%
                </span>

                from last month

              </p>

            </div>

          </div>

        </div>

        {/* ── TRUST MILESTONES (HORIZONTAL) ── */}
        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 ">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Trust Milestones</h3>
            <button className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
              See all <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="relative flex justify-between items-start px-2">
            {/* Connecting Line Base */}
            <div className="absolute left-6 right-6 top-4 h-0.5 bg-slate-100 dark:bg-slate-800 z-0">
              {/* Connecting Line Active (2/3 filled) */}
              <div className="h-full bg-emerald-500 w-[66%]" />
            </div>

            {/* Node 1 */}
            <div className="relative z-10 flex flex-col items-center gap-2 w-16">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-white dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-900 dark:text-white leading-tight">Identity Verified</p>
                <p className="text-[8px] font-semibold text-emerald-600 dark:text-emerald-500 mt-0.5">Completed</p>
              </div>
            </div>

            {/* Node 2 */}
            <div className="relative z-10 flex flex-col items-center gap-2 w-16">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-white dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-900 dark:text-white leading-tight">Reliable Partner</p>
                <p className="text-[8px] font-semibold text-emerald-600 dark:text-emerald-500 mt-0.5">Completed</p>
              </div>
            </div>

            {/* Node 3 */}
            <div className="relative z-10 flex flex-col items-center gap-2 w-16">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center border-4 border-white dark:border-slate-800 text-slate-400">
                <Star className="w-3.5 h-3.5" />
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-900 dark:text-white leading-tight">Financing Eligible</p>
                <p className="text-[8px] font-medium text-slate-500 mt-0.5">In Progress</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
