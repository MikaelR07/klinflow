/**
 * Seller Wallet — Financial dashboard for marketplace sellers
 * Clean, dark greenish theme matching the resident wallet hero card
 */
import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft, Eye, EyeOff, ArrowUpRight,
  Gift, Send, Banknote, Package,
  TrendingUp, BarChart2, ShieldCheck, CheckCircle2,
  Receipt, Landmark, ChevronRight,
  ArrowLeftRight,
  BadgeDollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';

import { walletService } from '@klinflow/core';
import { SellerWalletStats } from '@klinflow/core/services/walletService';
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
    if (userId) {
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
    }
  }, [userId]);

  const totalEarningsLifetime = stats?.lifetime_earnings || 0;
  const pendingSettlement = stats?.pending_settlement || 0;
  const totalEarningsThisMonth = stats?.earnings_this_month || 0;
  const recentTrades = stats?.recent_trades || [];
  const topMaterials = stats?.top_materials || [];

  return (
    <div className="space-y-4 pb-8">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-600">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors active:scale-95">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-slate-600 dark:text-white">Seller Wallet</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed nav */}
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)]" />

      {/* ── BALANCE HERO CARD ── */}
      <div className="mx-1">
        <div className="bg-primary rounded-2xl p-5 overflow-hidden ">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-bold text-emerald-100 mb-1 tracking-wider uppercase">
                Total Available
              </p>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight leading-none">
                  {balanceVisible ? `KSH ${Number(cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••••'}
                </h2>
                <button onClick={() => setBalanceVisible(!balanceVisible)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  {balanceVisible ? <Eye className="w-5 h-5 text-emerald-100/80" /> : <EyeOff className="w-5 h-5 text-emerald-100/80" />}
                </button>
              </div>
              <p className="text-[10px] font-medium text-emerald-200 mt-1">Ready for withdrawal</p>
            </div>

          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 border-t border-emerald-700/50 pt-4">
            <div>
              <p className="text-[9px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Pending Settlement</p>
              <p className="text-sm font-bold text-white">KES {pendingSettlement.toLocaleString() || '8,200.00'}</p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Total Earnings</p>
                <p className="text-sm font-bold text-white">KES {isLoadingStats ? '...' : totalEarningsLifetime.toLocaleString()}</p>
              </div>
              <BarChart2 className="w-5 h-5 text-[#c2ed7d]" />
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="mx-1">
        <h3 className="text-sm font-bold text-slate-600 dark:text-white px-1">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2">
          {/* Withdraw */}
          <button
            onClick={() => navigate('/withdraw')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.98] transition-colors"
          >
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <BadgeDollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">Withdraw</p>
          </button>

          {/* Redeem Rewards */}
          <button
            onClick={() => {
              if (gfpBalance < 0) {
                toast.warning('You need at least 100 points to redeem rewards.');
              } else {
                navigate('/redeem-gfp');
              }
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.98] transition-colors"
          >
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">Redeem Points</p>
          </button>

          {/* Transfer Points */}
          <button
            onClick={() => navigate('/transfer-gfp')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.98] transition-colors"
          >
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">Transfer Points</p>
          </button>

          {/* Earn More */}
          <button
            onClick={() => navigate('/post-trade')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.98] transition-colors"
          >
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Banknote className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">Earn More</p>
          </button>
        </div>
      </div>

      {/* ── RECENT TRANSACTIONS ── */}
      <div className="mx-1 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
          <button onClick={() => navigate('/transactions-history')} className="text-[10px] font-bold text-[#c2ed7d] tracking-wide hover:underline">
            View all
          </button>
        </div>

        <div className="w-full">
          <div className="flex text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex-[2]">Material</div>
            <div className="flex-[2]">Buyer</div>
            <div className="flex-1 text-right">Amount</div>
            <div className="flex-1 text-right">Status</div>
          </div>

          <div className="space-y-3">
            {isLoadingStats ? (
              <div className="py-4 text-center text-xs text-slate-500">Loading...</div>
            ) : recentTrades.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">No recent transactions found.</div>
            ) : (
              recentTrades.slice(0, 4).map(item => (
                <div key={item.id} className="flex items-center text-xs">
                  <div className="flex-[2] flex items-center gap-2 text-slate-900 dark:text-slate-200 font-medium">
                    {item.material}
                  </div>
                  <div className="flex-[2] text-slate-500 dark:text-slate-400 truncate pr-2">
                    {item.buyer || 'Unknown Buyer'}
                  </div>
                  <div className="flex-1 text-right font-medium text-slate-900 dark:text-slate-200">
                    KES {item.amount.toLocaleString()}
                  </div>
                  <div className="flex-1 text-right">
                    <span className="inline-block border border-emerald-500/30 text-emerald-500 text-[9px] font-semibold px-2 py-0.5 rounded-full">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── CHARTS SECTION ── */}
      <div className="mx-1 grid grid-cols-2 gap-2">

        {/* Earnings Overview */}
        <div
          className="
      bg-white
      dark:bg-slate-900
      rounded-2xl
      border
      border-slate-200
      dark:border-slate-800
      p-4
      flex
      flex-col
      overflow-hidden
      transform-gpu
    "
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-600 dark:text-white">
              Earnings Overview
            </h4>

            <span className="text-[10px] font-bold text-slate-400 uppercase">
              This Month
            </span>
          </div>

          <p className="text-lg font-black text-slate-800 dark:text-white mb-1 leading-none truncate">
            KES {isLoadingStats ? '...' : totalEarningsThisMonth.toLocaleString()}
          </p>

          <div className="flex items-center gap-1.5 mb-4">
            {totalEarningsThisMonth > 0 ? (
              <>
                <TrendingUp className="w-3 h-3 text-[#c2ed7d] shrink-0" />
                <p className="text-[10px] font-bold text-[#84cc16] dark:text-[#c2ed7d] truncate">
                  Active earning
                </p>
              </>
            ) : (
              <p className="text-[10px] font-bold text-slate-400 truncate">
                No earnings yet
              </p>
            )}
          </div>
        </div>

        {/* Top Material Sold */}
        <div
          className="
      bg-white
      dark:bg-slate-900
      rounded-2xl
      border
      border-slate-200
      dark:border-slate-800
      p-4
      overflow-hidden
      transform-gpu
    "
        >
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-4">
            Top Material Sold
          </h4>

          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">

              {isLoadingStats ? (
                <div className="py-2 text-xs text-slate-500">Loading...</div>
              ) : topMaterials.length === 0 ? (
                <div className="py-2 text-xs text-slate-500">No data available</div>
              ) : (
                topMaterials.map((mat, idx) => {
                  const colors = ['bg-[#c2ed7d]', 'bg-[#65a30d]', 'bg-slate-600', 'bg-slate-500'];
                  const total = topMaterials.reduce((acc, m) => acc + m.amount_sold, 0);
                  const percentage = total > 0 ? Math.round((mat.amount_sold / total) * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className={`w-2 h-2 rounded-sm ${colors[idx % colors.length]} shrink-0`} />
                        <span className="truncate">{mat.material}</span>
                      </div>
                      <span className="shrink-0">{percentage}%</span>
                    </div>
                  );
                })
              )}

            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
