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
  Store
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';

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
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#F8F9FF] dark:bg-slate-950 relative overflow-x-hidden min-h-screen">

      {/* ── TOP SECTION: PREMIUM FINTECH GRADIENT ── */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 pt-[calc(env(safe-area-inset-top,1.5rem)+5rem)] pb-8 rounded-b-[2.5rem] shadow-sm relative z-20 overflow-hidden">

        {/* Decorative background orbs for depth */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.08] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        {/* Fixed Header — transparent, minimal */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-tr from-emerald-600/90 to-emerald-800/90 dark:from-emerald-600/90 dark:to-emerald-800/90 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1.5rem)+0.75rem)] pb-2.5 px-5 max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-all border border-white/15">
            <ArrowLeft className="w-4.5 h-4.5 text-white" />
          </button>
          <p className="text-[13px] font-semibold tracking-wide text-white/80">Seller Wallet</p>
          <div className="w-9 h-9" />
        </div>

        {/* Balance */}
        <div className="text-center px-4 mb-5 relative z-10">
          <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.2em] mb-2">Available Balance</p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-baseline gap-1.5 text-white">
              <span className="text-lg font-medium opacity-70">KSh</span>
              <span className={`text-[2.5rem] font-black leading-none tracking-tight transition-all duration-300 ${!balanceVisible ? 'blur-lg select-none' : ''}`}>
                {Number(cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <button onClick={() => setBalanceVisible(!balanceVisible)} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90">
              {balanceVisible ? <Eye className="w-4.5 h-4.5 text-white/50" /> : <EyeOff className="w-4.5 h-4.5 text-white/50" />}
            </button>
          </div>
          <div className="flex justify-center mt-3">
            <div className="flex items-center justify-center gap-1.5 text-[8px] font-semibold text-white/70 uppercase tracking-[0.15em] bg-white/10 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/10">
              <ShieldCheck className="w-3 h-3" /> Secured by Klinflow
            </div>
          </div>
        </div>

        {/* Pending Settlement & Total Earnings */}
        <div className="grid grid-cols-2 gap-2.5 px-5 mt-1 relative z-10">
          <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.08] rounded-2xl px-3.5 py-2.5 text-center">
            <p className="text-[8px] font-semibold text-white/45 uppercase tracking-[0.15em] mb-1">Pending</p>
            <p className="text-[15px] font-bold text-white tracking-tight">KES {pendingSettlement.toLocaleString()}</p>
          </div>
          <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.08] rounded-2xl px-3.5 py-2.5 text-center">
            <p className="text-[8px] font-semibold text-white/45 uppercase tracking-[0.15em] mb-1">Total Earned</p>
            <p className="text-[15px] font-bold text-white tracking-tight">KES {isLoadingStats ? '...' : totalEarningsLifetime.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="px-1.5 mt-2 space-y-4 relative z-10 max-w-lg mx-auto pb-8">

      {/* ── QUICK ACTIONS ── */}
      <div className="mx-1">
        <div className="bg-slate-200 dark:bg-slate-800/40 rounded-[12px] p-1.5 !mt-1 shadow-sm border border-slate-200/50 dark:border-slate-800/60 space-y-2">
          <h3 className="text-[12px] font-black text-slate-600 dark:text-white capitalize tracking-widest px-1">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-1">
            {/* Withdraw */}
            <button
              onClick={() => navigate('/withdraw')}
              className="bg-white dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group"
            >
              <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Landmark className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Withdraw</span>
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
              className="bg-white dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group"
            >
              <div className="w-9 h-9 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Gift className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Redeem</span>
            </button>

            {/* Transfer Points */}
            <button
              onClick={() => navigate('/transfer-gfp')}
              className="bg-white dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group"
            >
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Transfer</span>
            </button>

            {/* Earn More */}
            <button
              onClick={() => navigate('/post-trade')}
              className="bg-white dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group"
            >
              <div className="w-9 h-9 bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Banknote className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Earn More</span>
            </button>
          </div>

          {/* ── RECENT TRANSACTIONS ── */}
          <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800 p-3 shadow-sm mt-2">

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-black text-slate-600 dark:text-white capitalize tracking-widest">Recent Transactions</h3>
              <button
                onClick={() => navigate('/transactions-history')}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide"
              >
                View History
              </button>
            </div>

        <div className="space-y-0.5">
          {isLoadingStats ? (
            <div className="py-6 text-center text-xs text-slate-500 font-medium">Loading transactions...</div>
          ) : recentTrades.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
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
            recentTrades.slice(0, 4).map((item, i) => (
              <div
                key={item.id}
                className="px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl shadow-sm hover:shadow-md transition-shadow"
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
