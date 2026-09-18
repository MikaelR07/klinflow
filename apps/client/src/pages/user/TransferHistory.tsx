import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowDownLeft, ArrowUpRight, Clock,
  Users
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService, PointTransferRecord } from '@klinflow/core';

export default function TransferHistory() {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [history, setHistory] = useState<PointTransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId, filter]);

  const loadHistory = async () => {
    setIsLoading(true);
    const data = await walletService.getTransferHistory(userId!, filter);
    setHistory(data);
    setIsLoading(false);
  };

  const formatTxDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const dateFormatted = date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateFormatted} • ${timeFormatted}`;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2 shadow-2xs">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Transfer History
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Peer-to-peer GFP transfers
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
              {history.length} Total
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+3.25rem)] space-y-3">
        {/* ── FILTERS HERO CARD ── */}
        <div className="bg-gradient-to-br from-primary to-emerald-600 dark:from-slate-900 dark:to-slate-900 border border-emerald-800/30 dark:border-slate-800 text-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between mb-1">
             <div className="flex items-center gap-2">
               <Users className="w-4 h-4 text-emerald-200" />
               <p className="text-xs font-semibold text-white/90">Filter Transfers</p>
             </div>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'sent', 'received'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilter(type as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 border ${
                  filter === type
                    ? 'bg-white text-emerald-700 dark:bg-emerald-500 dark:text-slate-950 border-white dark:border-emerald-500 shadow-sm'
                    : 'bg-black/10 dark:bg-slate-900 border-white/10 text-white/80 hover:bg-black/20'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* ── TRANSACTION FEED CARD ── */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-2xs">
          <div className="space-y-1">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500 font-medium">
                Loading transfer history...
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Clock className="w-8 h-8 mx-auto opacity-30" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No transfers found
                </p>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                  You haven't made any point transfers matching this filter.
                </p>
              </div>
            ) : (
              history.slice(0, visibleCount).map(record => {
                const isSent = record.sender_id === userId;
                return (
                  <div
                    key={record.id}
                    className="px-4 py-3 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold border ${isSent ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'}`}>
                        {isSent ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {isSent ? `To ${record.receiver_name}` : `From ${record.sender_name}`}
                        </p>
                        <p className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {record.reference_number}
                        </p>
                        <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatTxDate(record.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold font-mono ${isSent ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isSent ? '-' : '+'}{record.amount.toLocaleString()} GFP
                      </p>
                      <span className={`inline-block border text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mt-0.5 ${
                        record.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : record.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {history.length > visibleCount && (
              <button
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="w-full py-3 mt-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
              >
                Load More ({history.length - visibleCount} remaining)
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
