import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BellRing, CheckCircle2, AlertTriangle, Gift, Info, Clock } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore, NOTIFICATION_TYPES } from '@klinflow/core/stores/notificationStore';

export default function NotificationsFeed() {
  const navigate = useNavigate();
  const authStore = useAuthStore() as any;
  const { userId } = authStore;
  const { notifications, markAllAsRead, clearAll } = useNotificationStore();

  // Auto-clear badges when viewing inbox
  useEffect(() => {
    if (userId) {
      const timer = setTimeout(() => markAllAsRead(userId), 1500);
      return () => clearTimeout(timer);
    }
  }, [markAllAsRead, userId]);

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'just now';
    try {
      const parsed = new Date(dateString);
      if (isNaN(parsed.getTime())) return 'just now';
      
      const now = new Date();
      const diffInSeconds = Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / 1000));

      if (diffInSeconds < 30) return 'just now';
      if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      
      return parsed.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'just now';
    }
  };

  // Pulse to keep times fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS: return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case NOTIFICATION_TYPES.WARNING: return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case NOTIFICATION_TYPES.REWARD: return <Gift className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="animate-slide-up pb-24">
      {/* ── FIXED TOPNAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F8F8FF]/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 max-w-lg mx-auto pt-[calc(env(safe-area-inset-top,1rem)+0.5rem)] pb-3">
        <div className="flex items-center justify-between px-4 h-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h1>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button 
                onClick={clearAll}
                className="text-[10px] font-bold uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
            <button 
              onClick={() => navigate('/settings/notifications')}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* ── NOTIFICATIONS FEED ── */}
      <div className="max-w-lg mx-auto pt-[calc(env(safe-area-inset-top,1rem)+3.5rem)] divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.map((n: any) => (
          <div key={n.id} className={`p-4 flex gap-4 transition-colors ${!n.read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
             <div className="mt-1 shrink-0">{getIcon(n.type)}</div>
             <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5 gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{n.title}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium tabular-nums uppercase tracking-wider">
                      {formatRelativeTime(n.createdAt || n.date)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pr-2">{n.body}</p>
             </div>
             {!n.read && (
               <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             )}
          </div>
        ))}
        
        {notifications.length === 0 && (
          <div className="py-24 px-6 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                <BellRing className="w-7 h-7 text-slate-300 dark:text-slate-600" />
             </div>
             <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">All Caught Up!</h3>
             <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium max-w-[200px]">You have no active alerts at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
