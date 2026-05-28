/**
 * Resident Wallet — Full-featured wallet management for residents
 * Dark greenish theme matching agent performance card styling
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft,
  TrendingUp, Clock, CheckCircle2, Eye, EyeOff,
  ChevronRight, ShieldCheck, Banknote, Sparkles,
  Gift, Send, Recycle, Leaf, Trophy,
  ArrowRight, Package, CheckCircle,
  Landmark,
  ArrowRightLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { toast } from 'sonner';

export default function ResidentWallet() {
  const navigate = useNavigate();
  const { profile, walletBalance, rewardPoints } = useAuthStore();
  const bookings = useBookingStore(s => s.bookings);
  const [balanceVisible, setBalanceVisible] = useState(true);

  // Derived metrics
  const now = new Date();
  const currentMonthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), []);

  const completedBookings = useMemo(() =>
    bookings.filter((b: any) => b.status === 'completed'),
    [bookings]
  );

  const thisMonthPickups = useMemo(() =>
    completedBookings.filter((b: any) => new Date(b.completedAt || b.updatedAt || b.createdAt) >= currentMonthStart),
    [completedBookings, currentMonthStart]
  );

  const totalPickups = completedBookings.length;
  const upcomingPickups = useMemo(() =>
    bookings.filter((b: any) => ['pending', 'accepted', 'in_progress'].includes(b.status)).length,
    [bookings]
  );

  const kgRecoveredThisMonth = useMemo(() =>
    thisMonthPickups.reduce((sum: number, b: any) => sum + (Number(b.actualWeightKg) || Number(b.weightKg) || 0), 0),
    [thisMonthPickups]
  );

  const totalEarnedThisMonth = useMemo(() =>
    thisMonthPickups.reduce((sum: number, b: any) => sum + (Number(b.payout) || Number(b.agreedPrice) || 0), 0),
    [thisMonthPickups]
  );

  const sparklineData = useMemo(() => {
    const days = 10;
    const data = new Array(days).fill(0);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    completedBookings.forEach((b: any) => {
      const date = new Date(b.completedAt || b.updatedAt || b.createdAt);
      const diffTime = today.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < days) {
        data[days - 1 - diffDays] += (Number(b.payout) || Number(b.agreedPrice) || 0);
      }
    });

    const max = Math.max(...data, 1);
    return data.map(val => Math.max((val / max) * 100, 5));
  }, [completedBookings]);

  // Transactions derived from bookings
  const transactions = useMemo(() => {
    return completedBookings
      .map((b: any) => {
        const earnings = Number(b.payout) || Number(b.agreedPrice) || 0;
        return {
          id: b.id,
          type: earnings > 0 ? 'earned' : 'reward',
          label: `${b.wasteType || 'Recycling'} Pickup`,
          amount: earnings,
          date: new Date(b.completedAt || b.updatedAt || b.createdAt),
          status: 'completed' as const,
          reference: `#PKP-${String(b.id).slice(0, 4).toUpperCase()}`,
          wasteType: b.wasteType,
          weight: Number(b.actualWeightKg) || Number(b.weightKg) || 0,
        };
      })
      .filter(t => t.amount > 0)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [completedBookings]);

  // Impact level calculation
  const getImpactLevel = () => {
    const pts = rewardPoints || 0;
    if (pts >= 1000) return { level: 4, label: 'Climate Guardian', nextThreshold: 2000, icon: '🏆' };
    if (pts >= 500) return { level: 3, label: 'Eco Hero', nextThreshold: 1000, icon: '🛡️' };
    if (pts >= 100) return { level: 2, label: 'Green Scout', nextThreshold: 500, icon: '🌱' };
    return { level: 1, label: 'Seedling', nextThreshold: 100, icon: '🥚' };
  };
  const impact = getImpactLevel();
  const progressPercent = Math.min(((rewardPoints || 0) / impact.nextThreshold) * 100, 100);

  return (
    <div className="space-y-4 pb-8">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+0.6rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-600">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors active:scale-95">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div className="flex items-center gap-2">

              <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Resident Wallet</h1>
            </div>
          </div>

        </div>
      </div>

      {/* Spacer for fixed nav */}
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)]" />

      {/* ── BALANCE HERO CARD (Agent Performance Card Style) ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mx-1"
      >
        <div className="relative bg-gradient-to-br from-[#064e3b] to-primary dark:from-emerald-900 dark:to-primary rounded-2xl p-5 overflow-hidden">
          {/* Balance Section */}
          <div className="relative z-10 mb-4 pl-1">
            <p className="text-[10px] font-bold text-emerald-50 mb-1 tracking-wider uppercase">
              Available Balance
            </p>
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                {balanceVisible ? `KES ${walletBalance.toLocaleString()}.00` : '••••••••'}
              </h2>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                {balanceVisible
                  ? <Eye className="w-5 h-5 text-slate-400" />
                  : <EyeOff className="w-5 h-5 text-slate-400" />
                }
              </button>
            </div>
            <p className="text-[10px] font-semibold text-emerald-200/70">Klinflow Wallet</p>
          </div>

          {/* Stats Row */}
          <div className="relative z-10 grid grid-cols-2 gap-2">
            <div className="bg-emerald-950/40 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Leaf className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-emerald-100/60 uppercase tracking-widest mb-0.5">Eco Points</p>
                <p className="text-sm font-black text-white leading-none">{rewardPoints}</p>
                <p className="text-[8px] font-semibold text-emerald-300/60 mt-0.5">Worth KES {rewardPoints}</p>
              </div>
            </div>
            <div className="bg-emerald-950/40 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Recycle className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-emerald-100/60 uppercase tracking-widest mb-0.5">Recycled This Month</p>
                <p className="text-sm font-black text-white leading-none">{kgRecoveredThisMonth} kg</p>
                <p className="text-[8px] font-semibold text-emerald-300/60 mt-0.5">Great job! 💪</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── QUICK ACTIONS ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mx-1"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 px-1">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2">
          {/* Withdraw */}
          <button
            onClick={() => navigate('/withdraw')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.97] transition-all group"
          >
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">Withdraw</p>
          </button>

          {/* Redeem Rewards */}
          <button
            onClick={() => {
              if (rewardPoints < 0) {
                toast.warning('You need at least 50 GFP to redeem rewards.');
              } else {
                navigate('/redeem-gfp');
              }
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.97] transition-all group"
          >
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">Redeem </p>
          </button>

          {/* Transfer Points */}
          <button
            onClick={() => navigate('/transfer-gfp')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.97] transition-all group"
          >
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowRightLeft className="w-5 h-5 text-blue-600 dark:text-green-300" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">Transfer Points</p>
          </button>

          {/* Earn More */}
          <button
            onClick={() => navigate('/book-pickup')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.97] transition-all group"
          >
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Banknote className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">Earn More</p>
          </button>
        </div>
      </motion.div>

      {/* ── RECYCLING REWARDS ── */}
      <div className="mx-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Recycling Rewards
          </h3>

          <button
            onClick={() => navigate('/impact-hub')}
            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide"
          >
            View all
          </button>
        </div>

        <div className="flex items-center gap-4">

          {/* Left side — Message */}
          <div className="flex items-start gap-3 flex-1 min-w-0">

            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
              <span className="text-xl">{impact.icon}</span>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5 truncate">
                {thisMonthPickups.length > 0
                  ? "You're doing amazing!"
                  : "Start your journey!"}
              </p>

              <p className="text-[10px] font-medium text-slate-400 leading-snug">
                {thisMonthPickups.length > 0
                  ? `You recycled ${kgRecoveredThisMonth}kg this month. Keep going!`
                  : 'Complete your first pickup to start earning rewards.'}
              </p>
            </div>

          </div>

          {/* Right side — Level */}
          <div className="text-right shrink-0">

            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              Level {impact.level}
            </p>

            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {impact.label}
            </p>

            {/* Static Progress Bar */}
            <div className="w-24 h-2 bg-slate-400 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">

              <div
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
              />

            </div>

            <p className="text-[8px] font-bold text-slate-400 mt-1">
              {rewardPoints}/{impact.nextThreshold} pts
            </p>

          </div>

        </div>
      </div>

      {/* ── SAVINGS + PICKUP SUMMARY ── */}
      <div className="mx-1 grid grid-cols-2 gap-3">

        {/* Savings This Month */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">

          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
            Savings This Month
          </h4>

          <p className="text-[9px] font-semibold text-slate-400 mb-3">
            Money earned by recycling
          </p>

          <p className="text-xl font-black text-slate-900 dark:text-white mb-1.5">
            KES {totalEarnedThisMonth.toLocaleString()}.00
          </p>

          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />

            <p className="text-[9px] font-bold text-emerald-500">
              {thisMonthPickups.length > 0
                ? `${thisMonthPickups.length} pickups completed this month`
                : 'Start recycling to earn'}
            </p>
          </div>

          {/* Dynamic Sparkline */}
          <div className="mt-3 h-8 flex items-end gap-0.5">

            {sparklineData.map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 bg-primary rounded-sm min-h-[2px] transition-all duration-500"
              />
            ))}

          </div>

        </div>

        {/* Pickup Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">

          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Pickup Summary
            </h4>

            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
              This Month
            </span>
          </div>

          <div className="space-y-3.5">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-blue-500 shrink-0" />

                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Total Pickups
                </p>
              </div>

              <p className="text-sm font-black text-slate-900 dark:text-white">
                {totalPickups}
              </p>

            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />

                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Upcoming
                </p>
              </div>

              <p className="text-sm font-black text-slate-900 dark:text-white">
                {upcomingPickups}
              </p>

            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />

                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Completed
                </p>
              </div>

              <p className="text-sm font-black text-slate-900 dark:text-white">
                {completedBookings.length}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ── RECENT TRANSACTIONS ── */}
      <div className="mx-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

        <div className="p-4 pb-2">

          <div className="flex items-center justify-between">

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h3>

            <button className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">
              View all
            </button>

          </div>

        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <AnimatePresence mode="popLayout">
            {transactions.length > 0 ? (
              transactions.slice(0, 6).map((txn, i) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${txn.type === 'earned'
                      ? 'bg-emerald-50 dark:bg-emerald-900/30'
                      : 'bg-purple-50 dark:bg-purple-900/30'
                      }`}>
                      {txn.type === 'earned'
                        ? <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                        : <Sparkles className="w-5 h-5 text-purple-500" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate leading-tight mb-0.5">
                        {txn.type === 'earned' ? 'Pickup Payment' : 'Recycling Reward'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-wide">
                          {txn.reference}
                        </p>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <p className="text-[10px] font-medium text-slate-400">
                          {txn.date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-sm font-bold ${txn.type === 'earned'
                      ? 'text-red-500'
                      : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                      {txn.type === 'earned' ? '- ' : '+ '}KES {txn.amount.toLocaleString()}.00
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400 mt-0.5 capitalize">
                      {txn.type === 'earned' ? 'Paid' : 'Credited'}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-10 text-center">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-1">No transactions yet</p>
                <p className="text-[10px] font-semibold text-slate-400/70 mb-4">
                  Complete your first pickup to start earning
                </p>
                <button
                  onClick={() => navigate('/book-pickup')}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all "
                >
                  Book a Pickup
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── SECURITY FOOTER ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mx-1 flex items-center justify-center gap-2 py-3"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/40" />
        <p className="text-[9px] font-bold text-slate-400/50 dark:text-slate-500/50 uppercase tracking-[0.2em]">
          Secured by Klinflow Escrow
        </p>
      </motion.div>
    </div >
  );
}
