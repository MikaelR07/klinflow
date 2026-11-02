/**
 * Seller Wallet — Financial dashboard for marketplace sellers
 * Clean, dark greenish theme matching the resident wallet hero card
 */
import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft, Eye, EyeOff, ArrowUpRight,
  Gift, Send, Banknote, Package,
  TrendingUp, ShieldCheck,
  Receipt, Landmark, ChevronRight,
  ArrowLeftRight,
  Store,
  BanknoteArrowUp,
  Bell,
  Headset
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';

import { walletService } from '@klinflow/core';
import { SellerWalletStats } from '@klinflow/core/services/walletService';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

export default function SellerWallet() {
  const navigate = useNavigate();
  const { profile, userId, walletBalance } = useAuthStore();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [gfpBalance, setGfpBalance] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [stats, setStats] = useState<SellerWalletStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const getUnreadCount = useNotificationStore(s => s.getUnreadCount);
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const unreadCount = getUnreadCount();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId, 'client');
    }
  }, [userId, fetchNotifications]);

  useEffect(() => {
    if (!userId) {
      setIsLoadingStats(false);
      return;
    }

    const loadData = () => {
      walletService.getWalletDetails(userId).then(data => {
        if (data) {
          setGfpBalance(data.available_points);
          setCashBalance(data.cash_balance);
        }
      });
      walletService.getSellerDashboard(userId).then(data => {
        if (data) {
          setStats(data);
        }
        setIsLoadingStats(false);
      });
    };

    loadData();

    // Instant Realtime Subscription for incoming Hub Payouts & Trades
    const channel = supabase
      .channel(`seller-wallet-realtime-${userId}`)
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
  }, [userId]);

  const totalEarningsLifetime = stats?.lifetime_earnings || 0;
  const pendingSettlement = stats?.pending_settlement || 0;
  const totalEarningsThisMonth = stats?.earnings_this_month || 0;
  const recentTrades = stats?.recent_trades || [];
  const topMaterials = stats?.top_materials || [];

  const formatTxDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const dateFormatted = d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    const timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateFormatted} • ${timeFormatted}`;
  };

  return (
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#f8fafc] dark:bg-slate-800 font-sans pb-6">

      {/* ── FIXED TOP NAV ── */}
      <div className={`fixed top-0 left-0 right-0 z-50 pt-[calc(env(safe-area-inset-top,1.5rem)+1rem)] pb-2.5 transition-all duration-300 bg-gradient-to-tr from-emerald-700 via-emerald-800 to-emerald-900 `}>
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between relative">
          {/* Left: Back Arrow */}
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 shrink-0 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-sm transition-all active:scale-95 group z-10"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* Center: My Wallet */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h1 className="text-[17px] font-bold text-white tracking-tight leading-none">
              My Wallet
            </h1>
          </div>

          {/* Right: Notifications & Support */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
            <button
              onClick={() => navigate("/notifications")}
              className="relative w-10 h-10 shrink-0 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-sm transition-all active:scale-95 group"
            >
              <Bell className="w-5 h-5 text-white group-hover:animate-swing" />
              {Number(unreadCount) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-emerald-800 shadow-md animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate("/settings/support")}
              className="relative w-10 h-10 shrink-0 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-sm transition-all active:scale-95 group"
            >
              <Headset className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* ── TOP SECTION WITH BACKGROUND COLOR ── */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white relative overflow-hidden rounded-b-[1.25rem]  pb-6 pt-[calc(env(safe-area-inset-top,1.5rem)+7.5rem)]">
        {/* Decorative background orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.08] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-teal-300/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto px-4">

          {/* Balance */}
          <div className="mb-3 text-center">
            <p className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.2em] mb-2">Available Balance</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-medium opacity-70 text-white">KSh</span>
              <span className={`text-3xl font-bold leading-none tracking-tight transition-all duration-300 text-white ${!balanceVisible ? 'blur-lg select-none' : ''}`}>
                {Number(cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <button onClick={() => setBalanceVisible(!balanceVisible)} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90">
                {balanceVisible ? <Eye className="w-4.5 h-4.5 text-white/60" /> : <EyeOff className="w-4.5 h-4.5 text-white/60" />}
              </button>
            </div>
          </div>

          {/* Secure Klin Wallet */}
          <div className="flex justify-center mb-5">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/80 uppercase tracking-widest bg-white/10 px-3.5 py-1 rounded-full border border-white/15 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Klin Wallet
            </div>
          </div>

          {/* ── Quick Actions inside Top Section ── */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/15">
            {/* Withdraw */}
            <button
              onClick={() => navigate('/withdraw')}
              className="bg-white/15 backdrop-blur-sm border border-white/15 rounded-xl p-2.5 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-all group hover:bg-white/25 shadow-sm"
            >
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BanknoteArrowUp className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-[12px] font-bold text-white text-center leading-tight">Withdraw</p>
            </button>

            {/* Redeem Points */}
            <button
              onClick={() => {
                if (gfpBalance < 0) {
                  toast.warning('You need at least 100 points to redeem rewards.');
                } else {
                  navigate('/redeem-gfp');
                }
              }}
              className="bg-white/15 backdrop-blur-sm border border-white/15 rounded-xl p-2.5 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-all group hover:bg-white/25 shadow-sm"
            >
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Gift className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-[12px] font-bold text-white text-center leading-tight">Redeem</p>
            </button>

            {/* Transfer Points */}
            <button
              onClick={() => navigate('/transfer-gfp')}
              className="bg-white/15 backdrop-blur-sm border border-white/15 rounded-xl p-2.5 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-all group hover:bg-white/25 shadow-sm"
            >
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-[12px] font-bold text-white text-center leading-tight">Transfer</p>
            </button>

            {/* Earn More */}
            <button
              onClick={() => navigate('/post-trade')}
              className="bg-white/15 backdrop-blur-sm border border-white/15 rounded-xl p-2.5 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-all group hover:bg-white/25 shadow-sm"
            >
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Banknote className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-[12px] font-bold text-white text-center leading-tight">Earn More</p>
            </button>
          </div>
        </div>
      </div>

      {/* ── Content area below top section ── */}
      <div className="px-4 sm:px-4 py-4 max-w-lg mx-auto space-y-4">

        {/* ── RECENT TRANSACTIONS ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-600 dark:text-white capitalize tracking-wider">
              Recent Transactions
            </h3>
            <button
              onClick={() => navigate('/transactions-history')}
              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide hover:underline cursor-pointer"
            >
              View History
            </button>
          </div>

          <div className="space-y-2">
            {isLoadingStats ? (
              <div className="py-6 text-center text-xs text-slate-500 font-medium bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                Loading transactions...
              </div>
            ) : recentTrades.length === 0 ? (
              <div className="py-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Package className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">No transactions yet</p>
                <p className="text-[10px] font-semibold text-slate-400/70 dark:text-slate-500 mb-4">
                  Hub payouts will appear here when you sell materials
                </p>
                <button
                  onClick={() => navigate('/post-trade')}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                >
                  Post a Trade
                </button>
              </div>
            ) : (
              recentTrades.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-900/30">
                      <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight mb-0.5">
                        {item.buyer && !['Agent', 'Klinflow Hub Payout', 'Unknown Buyer'].includes(item.buyer)
                          ? item.buyer
                          : (item.metadata?.hub_name || 'Klinflow Hub')}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                          {item.material && item.material !== 'Material' ? item.material : 'Recyclables Drop-off'}
                        </p>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        {item.created_at && (
                          <p className="text-[10px] font-medium text-slate-400">
                            {formatTxDate(item.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      +KES {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400 mt-0.5 capitalize">
                      {item.status || 'Completed'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── SECURITY FOOTER ── */}
        <div className="flex items-center justify-center gap-2 py-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/40" />
          <p className="text-[9px] font-bold text-slate-400/50 dark:text-slate-500/50 uppercase tracking-[0.2em]">
            Secured by Klinflow Escrow
          </p>
        </div>
      </div>
    </div>
  );
}
