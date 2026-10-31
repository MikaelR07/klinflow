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
  BanknoteArrowUp
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
    <div className="bg-white dark:bg-slate-800 ">

      {/* ── FIXED HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 max-w-lg mx-auto border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <p className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight">My Wallet</p>
          <div className="w-10 h-10" />
        </div>
      </div>

      <div className="pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)] px-1.5 pb-2 max-w-lg mx-auto space-y-4">

      {/* ── WALLET CARD ── */}
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        {/* Decorative background orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.08] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10">
          {/* Balance */}
          <div className="mb-4 text-center">
            <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.2em] mb-2">Available Balance</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-medium opacity-70 text-white">KSh</span>
              <span className={`text-2xl font-bold leading-none tracking-tight transition-all duration-300 text-white ${!balanceVisible ? 'blur-lg select-none' : ''}`}>
                {Number(cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <button onClick={() => setBalanceVisible(!balanceVisible)} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90">
                {balanceVisible ? <Eye className="w-4.5 h-4.5 text-white/50" /> : <EyeOff className="w-4.5 h-4.5 text-white/50" />}
              </button>
            </div>
          </div>

          {/* Pending Settlement & Total Earnings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.08] rounded-xl px-3 py-2.5">
              <p className="text-[8px] font-semibold text-white/45 uppercase tracking-[0.15em] mb-1">Pending</p>
              <p className="text-[15px] font-bold text-white tracking-tight">KES {pendingSettlement.toLocaleString()}</p>
            </div>
            <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.08] rounded-xl px-3 py-2.5">
              <p className="text-[8px] font-semibold text-white/45 uppercase tracking-[0.15em] mb-1">Total Earned</p>
              <p className="text-[15px] font-bold text-white tracking-tight">KES {isLoadingStats ? '...' : totalEarningsLifetime.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS & RECENT TRANSACTIONS ── */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Quick Actions */}
        <div>
          <h3 className="text-[12px] font-bold text-slate-600 dark:text-white capitalize tracking-widest mb-3">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-3">
            {/* Withdraw */}
            <button
              onClick={() => navigate('/withdraw')}
              className="flex flex-col items-center  justify-center gap-2 group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                <BanknoteArrowUp className="w-6 h-6 text-slate-700 dark:text-slate-300" />
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
              className="flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                <Gift className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Redeem</span>
            </button>

            {/* Transfer Points */}
            <button
              onClick={() => navigate('/transfer-gfp')}
              className="flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                <ArrowLeftRight className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Transfer</span>
            </button>

            {/* Earn More */}
            <button
              onClick={() => navigate('/post-trade')}
              className="flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                <Banknote className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Earn More</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800" />

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] font-bold text-slate-600 dark:text-white capitalize tracking-widest">Recent Transactions</h3>
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
    </div>
  );
}
