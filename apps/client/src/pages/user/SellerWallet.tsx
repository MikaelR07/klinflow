/**
 * Seller Wallet — Financial dashboard for marketplace sellers
 * Clean, dark greenish theme matching the resident wallet hero card
 */
import { useState, useMemo } from 'react';
import {
  ArrowLeft, Eye, EyeOff, ArrowUpRight,
  Gift, Send, Banknote, Package,
  TrendingUp, BarChart2, ShieldCheck, CheckCircle2,
  Receipt, Landmark, ChevronRight,
  ArrowLeftRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { toast } from 'sonner';

export default function SellerWallet() {
  const navigate = useNavigate();
  const { profile, walletBalance, rewardPoints } = useAuthStore();
  const [balanceVisible, setBalanceVisible] = useState(true);

  // Use marketplace store or dummy data for stats
  const receivedOrders = useMarketplaceStore(s => s.receivedOrders) || [];

  const pendingSettlement = useMemo(() =>
    receivedOrders
      .filter((o: any) => o.status === 'accepted')
      .reduce((acc, o: any) => acc + (parseFloat(String(o.totalPrice || 0)) || 0), 0)
    , [receivedOrders]);

  const totalEarningsThisMonth = useMemo(() =>
    receivedOrders
      .filter((o: any) => o.status === 'completed')
      .reduce((acc, o: any) => acc + (parseFloat(String(o.totalPrice || 0)) || 0), 0)
    , [receivedOrders]);

  // Mock data for Marketplace Earnings
  const marketplaceEarnings = [
    { id: '1', material: 'Plastic (PET)', buyer: 'GreenCycle Ltd', amount: 2400, status: 'Paid' },
    { id: '2', material: 'Cardboard', buyer: 'EcoPack Solutions', amount: 1800, status: 'Paid' },
    { id: '3', material: 'Aluminum Cans', buyer: 'Recyclers Hub', amount: 3150, status: 'Paid' },
    { id: '4', material: 'Mixed Paper', buyer: 'PaperMart', amount: 950, status: 'Paid' },
  ];

  // Mock data for Recent Payouts
  const recentPayouts = [
    { id: '1', method: 'M-Pesa Withdrawal', date: '12 May 2024 • 9:41 AM', amount: 10000, status: 'Completed', icon: Landmark },
    { id: '2', method: 'Bank Transfer', date: '03 May 2024 • 11:20 AM', amount: 7500, status: 'Completed', icon: Landmark },
  ];

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
              <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Seller Wallet</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed nav */}
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)]" />

      {/* ── BALANCE HERO CARD ── */}
      <div className="mx-1">
        <div className="bg-gradient-to-br from-[#064e3b] to-primary dark:from-emerald-900 dark:to-primary rounded-2xl p-5 overflow-hidden border border-emerald-800/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-bold text-emerald-100/80 mb-1 tracking-wider uppercase">
                Total Available
              </p>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                  {balanceVisible ? `KES ${walletBalance.toLocaleString()}.00` : '••••••••'}
                </h2>
                <button onClick={() => setBalanceVisible(!balanceVisible)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  {balanceVisible ? <Eye className="w-5 h-5 text-emerald-100/80" /> : <EyeOff className="w-5 h-5 text-emerald-100/80" />}
                </button>
              </div>
              <p className="text-[10px] font-medium text-emerald-200/70 mt-1">Ready for withdrawal</p>
            </div>

          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 border-t border-emerald-700/50 pt-4">
            <div>
              <p className="text-[9px] font-bold text-emerald-100/60 uppercase tracking-widest mb-1">Pending Settlement</p>
              <p className="text-sm font-bold text-white">KES {pendingSettlement.toLocaleString() || '8,200.00'}</p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-bold text-emerald-100/60 uppercase tracking-widest mb-1">Total Earnings</p>
                <p className="text-sm font-bold text-white">KES {totalEarningsThisMonth.toLocaleString() || '56,430.00'}</p>
              </div>
              <BarChart2 className="w-5 h-5 text-[#c2ed7d]" />
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="mx-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 px-1">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2">
          {/* Withdraw */}
          <button
            onClick={() => navigate('/withdraw')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.98] transition-colors"
          >
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">Withdraw</p>
          </button>

          {/* Redeem Rewards */}
          <button
            onClick={() => {
              if (rewardPoints < 50) {
                toast.warning('You need at least 50 points to redeem rewards.');
              } else {
                toast.info('Redeem coming soon!');
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
            onClick={() => toast.info('Transfer coming soon!')}
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

      {/* ── MARKETPLACE EARNINGS ── */}
      <div className="mx-1 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Marketplace Earnings</h3>
          <button className="text-[10px] font-bold  tracking-wide">
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
            {marketplaceEarnings.map(item => (
              <div key={item.id} className="flex items-center text-xs">
                <div className="flex-[2] flex items-center gap-2 text-slate-900 dark:text-slate-200 font-medium">

                  {item.material}
                </div>
                <div className="flex-[2] text-slate-500 dark:text-slate-400 truncate pr-2">
                  {item.buyer}
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
            ))}
          </div>
        </div>
      </div>

      {/* ── CHARTS SECTION ── */}
      <div className="mx-1 grid grid-cols-2 gap-2">
        {/* Earnings Overview */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Earnings Overview</h4>
            <span className="text-[8px] font-bold text-slate-400 uppercase">This Month</span>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mb-1">
            KES 56,430.00
          </p>
          <div className="flex items-center gap-1.5 mb-4">
            <TrendingUp className="w-3 h-3 text-[#c2ed7d]" />
            <p className="text-[9px] font-bold text-[#c2ed7d]">23% vs last month</p>
          </div>


        </div>

        {/* Top Material Sold */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-4">Top Material Sold</h4>

          <div className="flex items-center gap-3">


            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#c2ed7d]" /> Plastic</div>
                <span>45%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#65a30d]" /> Cardboard</div>
                <span>25%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-slate-600" /> Aluminum</div>
                <span>15%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-slate-500" /> Paper</div>
                <span>10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT PAYOUTS ── */}
      <div className="mx-1 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Payouts</h3>
          <button className="text-[10px] font-bold text-[#c2ed7d] tracking-wide">
            View all
          </button>
        </div>

        <div className="space-y-4">
          {recentPayouts.map(payout => (
            <div key={payout.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <payout.icon className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{payout.method}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{payout.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">- KES {payout.amount.toLocaleString()}.00</p>
                <p className="text-[10px] font-medium text-emerald-500">{payout.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
