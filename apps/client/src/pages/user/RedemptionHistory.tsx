/**
 * RedemptionHistory — View all past point redemptions
 * Uses scrollable pill tabs instead of dropdowns for filtering
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, CheckCircle2, XCircle,
  Landmark, Phone, Gift, Loader2,
  AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService, RedemptionRecord, RedemptionType, RedemptionStatus } from '@klinflow/core';

const TYPE_CONFIG: Record<string, { icon: typeof Landmark; label: string; color: string; bg: string }> = {
  money: { icon: Landmark, label: 'Cash', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  airtime: { icon: Phone, label: 'Airtime', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-500/10' },
  voucher: { icon: Gift, label: 'Voucher', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; label: string; color: string; bg: string }> = {
  completed: { icon: CheckCircle2, label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  processing: { icon: Clock, label: 'Processing', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  pending: { icon: Clock, label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  failed: { icon: XCircle, label: 'Failed', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  rejected: { icon: AlertTriangle, label: 'Rejected', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
};

const TYPE_TABS: { value: 'all' | RedemptionType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'airtime', label: 'Airtime' },
  { value: 'voucher', label: 'Voucher' },
];

const STATUS_TABS: { value: 'all' | RedemptionStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
];

export default function RedemptionHistory() {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [typeFilter, setTypeFilter] = useState<'all' | RedemptionType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | RedemptionStatus>('all');
  const [history, setHistory] = useState<RedemptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) loadHistory();
  }, [userId, typeFilter, statusFilter]);

  const loadHistory = async () => {
    setIsLoading(true);
    const data = await walletService.getRedemptionHistory(userId!, typeFilter, statusFilter);
    setHistory(data);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors pb-10 min-h-screen">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600/60 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all">
                <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Redemption History</h1>
                <p className="text-[10px] font-semibold text-slate-400">{history.length} redemptions</p>
              </div>
            </div>
          </div>


          {/* Status filter tabs — scrollable */}
          <div className="-mx-4 px-4 flex gap-2 overflow-x-auto scrollbar-hide pb-0.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-200 border ${
                  statusFilter === tab.value
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                    : 'bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+8.5rem)] px-4 space-y-4">

        {/* ── HISTORY LIST ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-400">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20">
            <Gift className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No redemptions yet</p>
            <p className="text-xs text-slate-400 mt-1">Your redemption history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((item) => {
              const typeConf = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.money!;
              const statusConf = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending!;
              const TypeIcon = typeConf.icon;
              const StatusIcon = statusConf.icon;

              return (
                <div key={item.id} className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeConf.bg}`}>
                      <TypeIcon className={`w-5 h-5 ${typeConf.color}`} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{typeConf.label} Redemption</h4>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          -{item.amount.toLocaleString()} GFP
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400">{item.reference_number}</span>
                        <span className="text-xs font-bold text-green-600">KES {item.kes_equivalent?.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${statusConf.bg}`}>
                          <StatusIcon className={`w-3 h-3 ${statusConf.color}`} />
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${statusConf.color}`}>{statusConf.label}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {item.failure_reason && (
                        <p className="text-[10px] text-rose-500 mt-2 font-medium">{item.failure_reason}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
