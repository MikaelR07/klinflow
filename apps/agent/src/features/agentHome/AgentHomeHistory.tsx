/**
 * AgentHome Mission History
 * Extracted from AgentHome.tsx
 */
import type { AgentJobHistoryItem } from './agentHome.types';

interface AgentHomeHistoryProps {
  jobHistory: AgentJobHistoryItem[];
  clearJobHistory: () => void;
}

export default function AgentHomeHistory({ jobHistory, clearJobHistory }: AgentHomeHistoryProps) {
  return (
    <div className="bg-white dark:bg-slate-900/40 rounded-2xl p-6 !mt-3 border border-slate-200/50 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6 px-1">
        <h3 className="font-semibold text-xs capitalize tracking-widest text-slate-400">Mission History</h3>
        {jobHistory.length > 0 && (
          <button
            onClick={clearJobHistory}
            className="text-xs font-semibold text-rose-500 capitalize tracking-widest px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors active:scale-95"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-6">
        {jobHistory.slice(0, 4).map((item, i) => {
          const isCompleted = item.status === 'completed';
          const isCancelled = item.status === 'cancelled';
          const pillColor = isCompleted
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
            : isCancelled
              ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
              : 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
          const statusLabel = {
            completed: 'Completed',
            cancelled: 'Cancelled',
            confirmed: 'Confirmed',
            in_progress: 'In Progress',
            picked_up: 'Picked Up',
          }[item.status] || item.status;

          return (
            <div key={item.id || i} className="flex items-center justify-between group px-1">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center text-lg">
                  {item.wasteType === 'general' ? '🗑️' : '♻️'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">{item.location || 'Local'} Pickup</p>
                  <p className="text-[10px] font-semibold text-slate-400">{item.date}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-semibold capitalize tracking-widest px-2.5 py-1 rounded-full ${pillColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          );
        })}

        {jobHistory.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-slate-400 font-semibold capitalize tracking-widest">No recent activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
