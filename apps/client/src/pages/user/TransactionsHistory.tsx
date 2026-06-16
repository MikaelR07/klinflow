import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDownLeft, Sparkles, Wallet, HandCoins } from 'lucide-react';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService } from '@klinflow/core';

export default function TransactionsHistory() {
  const navigate = useNavigate();
  const { profile, userId } = useAuthStore();
  const bookings = useBookingStore(s => s.bookings);
  const [sellerTrades, setSellerTrades] = useState<any[]>([]);
  const [walletTxns, setWalletTxns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isSeller = profile?.role === 'seller';

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    if (isSeller) {
      walletService.getSellerDashboard(userId).then(data => {
        if (data && data.recent_trades) {
          setSellerTrades(data.recent_trades);
        }
        setIsLoading(false);
      });
    } else {
      walletService.getWalletTransactions(userId).then(data => {
        setWalletTxns(data || []);
        setIsLoading(false);
      });
    }
  }, [isSeller, userId]);

  const completedBookings = useMemo(() => 
    bookings.filter((b: any) => b.status === 'completed'),
    [bookings]
  );

  const transactions = useMemo(() => {
    if (isSeller) {
      return sellerTrades.map(trade => ({
        id: trade.id,
        type: 'earned',
        label: `${trade.material} Sale to ${trade.buyer || 'Unknown'}`,
        amount: trade.amount,
        date: new Date(trade.date),
        reference: trade.reference || `TRX-${trade.id.substring(0, 6).toUpperCase()}`
      })).sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    // Resident true transactions
    return walletTxns.map((t: any) => ({
      id: t.id,
      type: t.amount > 0 ? 'earned' : 'reward',
      label: t.metadata?.type === 'material_buyback' ? 'Recycling Pickup' : 'Wallet Transaction',
      amount: t.amount,
      date: new Date(t.created_at),
      reference: `TRX-${String(t.id).substring(0, 6).toUpperCase()}`
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [walletTxns, sellerTrades, isSeller]);

  return (
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors pb-10">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto  bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600/60">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3.5 px-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </button>
            <h1 className="text-lg font-bold text-slate-600 dark:text-white tracking-tight">Transactions History</h1>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+3.5rem)] pb-[20px] max-w-lg mx-auto w-full px-1.5 space-y-4">
        
        
        {/* TRANSACTIONS LIST */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">All Transactions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your lifetime earnings and rewards.</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <div className="py-10 text-center text-slate-500">Loading transactions...</div>
            ) : transactions.length > 0 ? (
              transactions.map((txn) => (
                <div key={txn.id} className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
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
                        {txn.label}
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
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-purple-600 dark:text-purple-400'
                      }`}>
                      + KES {Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400 mt-0.5 capitalize">
                      {txn.type === 'earned' ? 'Received' : 'Credited'}
                    </p>
                  </div>
                </div>
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
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
