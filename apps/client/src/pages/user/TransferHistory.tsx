import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowDownLeft, ArrowUpRight, Clock,
  Filter, Calendar, ChevronDown, CheckCircle2, XCircle
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService, PointTransferRecord } from '@klinflow/core';

export default function TransferHistory() {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [history, setHistory] = useState<PointTransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FF] dark:bg-slate-800 transition-colors pb-10">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600/60 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-1 px-4 flex flex-col gap-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </button>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Transfer History</h1>
            </div>
          </div>

          {/* TABS */}
          <div className="bg-slate-100/80 dark:bg-slate-900/50 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50 dark:border-slate-800/50">
            {['all', 'sent', 'received'].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t as any)}
                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${filter === t ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+6.5rem)] max-w-lg mx-auto w-full px-4 space-y-4">

        {/* LIST */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-400">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No transfers found</h3>
            <p className="text-xs text-slate-500 max-w-[200px]">You haven't made any point transfers yet.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {history.map(record => {
                const isSent = record.sender_id === userId;
                return (
                  <div key={record.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isSent ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                      {isSent ? <ArrowUpRight className="w-5 h-5 text-rose-500" /> : <ArrowDownLeft className="w-5 h-5 text-emerald-500" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="text-[13px] font-bold text-slate-900 dark:text-white truncate pr-2">
                          {isSent ? `To ${record.receiver_name}` : `From ${record.sender_name}`}
                        </h4>
                        <span className={`text-[13px] font-black shrink-0 ${isSent ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {isSent ? '-' : '+'}{record.amount.toLocaleString()} GFP
                        </span>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] text-slate-400 font-mono tracking-wide">{record.reference_number}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{new Date(record.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {record.status === 'completed' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          ) : record.status === 'failed' ? (
                            <XCircle className="w-3 h-3 text-rose-500" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-500" />
                          )}
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{record.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
