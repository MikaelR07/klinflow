/**
 * Resident Wallet — Full-featured wallet management for residents
 * Dark greenish theme matching agent performance card styling
 */
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft,
  TrendingUp, Clock, CheckCircle2, Eye, EyeOff,
  ChevronRight, ShieldCheck, Banknote, Sparkles,
  Gift, Send, Recycle, Leaf, Trophy,
  ArrowRight, Package, CheckCircle,
  Landmark,
  ArrowRightLeft,
  ArrowDownSquare,
  ArrowUpSquare,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { walletService } from '@klinflow/core';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

export default function ResidentWallet() {
  const navigate = useNavigate();
  const { profile, userId } = useAuthStore();
  const { bookings, fetchBookings } = useBookingStore(s => s);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [gfpBalance, setGfpBalance] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [walletStats, setWalletStats] = useState<any>(null);
  const [walletTxns, setWalletTxns] = useState<any[]>([]);

  // Fetch real wallet balance and bookings
  useEffect(() => {
    if (!userId) return;

    const loadData = () => {
      walletService.getWalletDetails(userId).then(data => {
        if (data) {
          setGfpBalance(data.available_points || 0);
          setCashBalance(data.cash_balance || 0);
          setWalletStats(data);
        }
      });
      walletService.getWalletTransactions(userId).then(data => {
        setWalletTxns(data || []);
      });
      fetchBookings();
    };

    loadData();

    const channel = supabase
      .channel(`resident-wallet-realtime-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_transactions', filter: `profile_id=eq.${userId}` },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_wallets', filter: `user_id=eq.${userId}` },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchBookings]);

  // Derived metrics
  const now = new Date();
  const currentMonthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), []);

  const completedBookings = useMemo(() =>
    bookings.filter((b: any) => ['completed', 'paid', 'verified'].includes(b.status)),
    [bookings]
  );

  const thisMonthPickups = useMemo(() =>
    completedBookings.filter((b: any) => new Date(b.completedAt || b.updatedAt || b.createdAt) >= currentMonthStart),
    [completedBookings, currentMonthStart]
  );



  // True Transactions from ledger (Moved up to be used by metrics)
  const transactions = useMemo(() => {
    return walletTxns.map((t: any) => ({
      id: t.id,
      type: t.amount > 0 ? 'earned' : 'reward',
      buyerName: t.metadata?.hub_name || t.metadata?.buyer_name || (t.metadata?.type === 'material_buyback' ? 'Recycling Agent' : 'Klinflow Payout'),
      materialSummary: t.metadata?.materials_summary || t.metadata?.material || t.metadata?.description || (t.amount > 0 ? 'Recyclables Sale Payout' : 'Wallet Transfer / Reward'),
      amount: t.amount,
      date: new Date(t.created_at),
      status: 'completed' as const,
      reference: t.metadata?.waybill_id || `TRX-${String(t.id).substring(0, 6).toUpperCase()}`,
      metadata: t.metadata
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [walletTxns]);

  const kgRecoveredThisMonth = useMemo(() => {
    return thisMonthPickups.reduce((sum, b) => sum + (Number(b.actualWeightKg) || Number(b.weightKg) || 0), 0);
  }, [thisMonthPickups]);

  const getRewardMessages = () => {
    if (impact.level === 4) {
      return {
        title: "True Climate Guardian!",
        subtitle: `Your impact is monumental. You've recycled ${kgRecoveredThisMonth}kg this month alone!`
      };
    }
    if (impact.level === 3) {
      return {
        title: "You're an Eco Hero!",
        subtitle: `Incredible work. You've recycled ${kgRecoveredThisMonth}kg this month.`
      };
    }
    if (impact.level === 2) {
      return {
        title: "You're making a difference!",
        subtitle: `Keep it up, Green Scout! You're getting closer to Eco Hero.`
      };
    }
    // Level 1
    if (completedBookings.length > 0) {
      return {
        title: "Great start!",
        subtitle: `You've taken the first steps. Keep recycling to level up to Green Scout!`
      };
    }
    return {
      title: "Start your journey!",
      subtitle: "Complete your first pickup to start earning rewards."
    };
  };

  // True Transactions from ledger moved up

  // Impact level calculation
  const getImpactLevel = () => {
    const pts = gfpBalance || 0;
    if (pts >= 1000) return { level: 4, label: 'Climate Guardian', nextThreshold: 2000, icon: '🏆' };
    if (pts >= 500) return { level: 3, label: 'Eco Hero', nextThreshold: 1000, icon: '🛡️' };
    if (pts >= 100) return { level: 2, label: 'Green Scout', nextThreshold: 500, icon: '🌱' };
    return { level: 1, label: 'Seedling', nextThreshold: 100, icon: '🥚' };
  };
  const impact = getImpactLevel();
  const progressPercent = Math.min(((gfpBalance || 0) / impact.nextThreshold) * 100, 100);

  return (
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#F8F9FF] dark:bg-slate-950 relative overflow-x-hidden min-h-screen">

      {/* ── TOP SECTION: GRADIENT WITH ROUNDED BOTTOM ── */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 pt-[calc(env(safe-area-inset-top,1.5rem)+5.5rem)] pb-6 rounded-b-[2rem] shadow-sm relative z-20">

        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-tr from-emerald-600/90 to-emerald-800/90 dark:from-emerald-600/90 dark:to-emerald-800/90 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1.5rem)+1rem)] pb-3 px-4 max-w-lg mx-auto flex items-center justify-between shadow-sm">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-all border border-white/20">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-[17px] font-bold tracking-wide text-white leading-tight">Resident Wallet</h1>
          </div>
          <div className="w-10 h-10"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {/* Balance */}
          <div className="text-center px-4 mb-4">
            <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Available Balance</p>
            <div className="flex items-center justify-center gap-2 text-white">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">KSh</span>
                <span className={`text-3xl font-black leading-none transition-all duration-300 ${!balanceVisible ? 'blur-md select-none' : ''}`}>
                  {Number(cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <button onClick={() => setBalanceVisible(!balanceVisible)} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors active:scale-95">
                {balanceVisible ? <Eye className="w-5 h-5 text-white/80" /> : <EyeOff className="w-5 h-5 text-white/80" />}
              </button>
            </div>
            <div className="flex justify-center mt-3">
              <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-white capitalize tracking-widest bg-white/20 px-3 py-1.5 rounded-full border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5" /> Secure Klin Wallet
              </div>
            </div>
          </div>

          {/* Quick Actions inside hero */}
          <div className="relative z-10 grid grid-cols-4 gap-2 mt-3 pt-3 px-4 border-t border-white/15">
            {/* Withdraw */}
            <button
              onClick={() => navigate('/withdraw')}
              className="bg-white/15 backdrop-blur-sm border border-white/10 rounded-xl p-2 flex flex-col items-center gap-2 active:scale-[0.97] transition-all group hover:bg-white/25"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <p className="text-[10px] font-bold text-white/90 text-center leading-tight">Withdraw</p>
            </button>

            {/* Redeem Rewards */}
            <button
              onClick={() => navigate('/redeem-gfp')}
              className="bg-white/15 backdrop-blur-sm border border-white/10 rounded-xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.97] transition-all group hover:bg-white/25"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <p className="text-[10px] font-bold text-white/90 text-center leading-tight">Redeem GFP</p>
            </button>

            {/* Transfer Points */}
            <button
              onClick={() => navigate('/transfer-gfp')}
              className="bg-white/15 backdrop-blur-sm border border-white/10 rounded-xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.97] transition-all group hover:bg-white/25"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </div>
              <p className="text-[10px] font-bold text-white/90 text-center leading-tight">Transfer GFP</p>
            </button>

            {/* Earn More */}
            <button
              onClick={() => navigate('/book-pickup')}
              className="bg-white/15 backdrop-blur-sm border border-white/10 rounded-xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.97] transition-all group hover:bg-white/25"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Banknote className="w-5 h-5 text-white" />
              </div>
              <p className="text-[10px] font-bold text-white/90 text-center leading-tight">Earn More</p>
            </button>
          </div>
        </motion.div>
      </div>

      <div className="px-1.5 mt-2 space-y-4 relative z-10 max-w-lg mx-auto pb-4">

      {/* ── RECENT TRANSACTIONS ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mx-1 bg-white dark:bg-slate-900 rounded-2xl !mt-1 border border-slate-200 dark:border-slate-700 overflow-hidden p-4 shadow-sm"
      >

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-600 dark:text-white">
            Recent Transactions
          </h3>
          <button
            onClick={() => navigate('/transactions-history')}
            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide"
          >
            View History
          </button>
        </div>

        <div className="space-y-0.5">
          <AnimatePresence mode="popLayout">
            {transactions.length > 0 ? (
              transactions.slice(0, 4).map((txn, i) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${txn.type === 'earned'
                      ? 'bg-emerald-50 dark:bg-emerald-900/30'
                      : 'bg-red-50 dark:bg-red-900/30'
                      }`}>
                      {txn.type === 'earned'
                        ? <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
                        : <ArrowUpCircle className="w-5 h-5 text-red-500" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight mb-0.5">
                        {txn.buyerName}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                          {txn.materialSummary}
                        </p>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <p className="text-[10px] font-medium text-slate-400">
                          {txn.date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })} • {txn.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-sm font-bold ${txn.type === 'earned'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                      }`}>
                      KES {Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400 mt-0.5 capitalize">
                      {txn.type === 'earned' ? 'Received' : 'Credited'}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">No transactions yet</p>
                <p className="text-[10px] font-semibold text-slate-400/70 dark:text-slate-500 mb-4">
                  Complete your first pickup to start earning
                </p>
                <button
                  onClick={() => navigate('/book-pickup')}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                >
                  Book a Pickup
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── RECYCLING REWARDS & SUMMARY ── */}
      <div className="mx-1 bg-white dark:bg-slate-900 !mt-1 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">

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

            <div className="w-12 h-12 bg-emerald-200 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
              <span className="text-xl">{impact.icon}</span>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5 truncate">
                {getRewardMessages().title}
              </p>

              <p className="text-[10px] font-medium text-slate-400 leading-snug">
                {getRewardMessages().subtitle}
              </p>
            </div>

          </div>

          {/* Right side — Level */}
          <div className="text-right shrink-0">

            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              Level {impact.level}
            </p>
            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight capitalize">
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
              {gfpBalance}/{impact.nextThreshold} pts
            </p>

          </div>

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
      </div>
    </div >
  );
}
