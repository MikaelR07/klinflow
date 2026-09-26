import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BellRing, CircleCheckBig, AlertTriangle, Gift,
  MessageSquareCheck, Truck, Zap, ShieldCheck, Coins,
  Package, Trash2, CheckCheck
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore, NOTIFICATION_TYPES } from '@klinflow/core/stores/notificationStore';

// ── Date grouping helpers ──
function getDateGroup(dateString: string | null): string {
  if (!dateString) return 'Today';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Today';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    if (date >= today) return 'Today';
    if (date >= yesterday) return 'Yesterday';
    if (date >= weekAgo) return 'This Week';
    return 'Earlier';
  } catch {
    return 'Today';
  }
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'just now';
  try {
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) return 'just now';

    const now = new Date();
    const diffInSeconds = Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / 1000));

    if (diffInSeconds < 60) return 'just now';

    const month = parsed.toLocaleDateString([], { month: 'short' });
    const day = parsed.getDate();
    const time = parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    return `${day} ${month} ${time}`;
  } catch {
    return 'just now';
  }
}

// ── Notification icon config ──
function getNotifConfig(type: string, title?: string) {
  const titleLower = (title || '').toLowerCase();

  // Context-aware icon selection based on notification content
  if (titleLower.includes('arrived') || titleLower.includes('route') || titleLower.includes('dispatch') || titleLower.includes('pickup') || titleLower.includes('collection')) {
    return { icon: Truck, bg: 'bg-blue-50 dark:bg-blue-500/10', iconColor: 'text-blue-500', accent: 'border-l-blue-500' };
  }
  if (titleLower.includes('trade') || titleLower.includes('offer') || titleLower.includes('material') || titleLower.includes('market')) {
    return { icon: Package, bg: 'bg-amber-50 dark:bg-amber-500/10', iconColor: 'text-amber-500', accent: 'border-l-amber-500' };
  }
  if (titleLower.includes('paid') || titleLower.includes('payout') || titleLower.includes('earning') || titleLower.includes('wallet') || titleLower.includes('funds')) {
    return { icon: Coins, bg: 'bg-emerald-50 dark:bg-emerald-500/10', iconColor: 'text-emerald-500', accent: 'border-l-emerald-500' };
  }
  if (titleLower.includes('verified') || titleLower.includes('verification') || titleLower.includes('approved')) {
    return { icon: ShieldCheck, bg: 'bg-teal-50 dark:bg-teal-500/10', iconColor: 'text-teal-500', accent: 'border-l-teal-500' };
  }

  // Fallback to type-based
  switch (type) {
    case NOTIFICATION_TYPES.SUCCESS:
      return { icon: CircleCheckBig, bg: 'bg-emerald-50 dark:bg-emerald-500/10', iconColor: 'text-emerald-500', accent: 'border-l-emerald-500' };
    case NOTIFICATION_TYPES.WARNING:
      return { icon: AlertTriangle, bg: 'bg-rose-50 dark:bg-rose-500/10', iconColor: 'text-rose-500', accent: 'border-l-rose-500' };
    case NOTIFICATION_TYPES.REWARD:
      return { icon: Gift, bg: 'bg-amber-50 dark:bg-amber-500/10', iconColor: 'text-amber-500', accent: 'border-l-amber-500' };
    default:
      return { icon: MessageSquareCheck, bg: 'bg-blue-50 dark:bg-blue-500/10', iconColor: 'text-blue-500', accent: 'border-l-blue-500' };
  }
}

// ── Filter tabs ──
type FilterTab = 'all' | 'pickups' | 'trades' | 'system';

function getFilterTab(n: any): FilterTab {
  const title = (n.title || '').toLowerCase();
  if (title.includes('pickup') || title.includes('collection') || title.includes('dispatch') || title.includes('arrived')) return 'pickups';
  if (title.includes('trade') || title.includes('offer') || title.includes('material') || title.includes('market') || title.includes('paid') || title.includes('payout') || title.includes('funds') || title.includes('wallet')) return 'trades';
  return 'system';
}

export default function NotificationsFeed() {
  const navigate = useNavigate();
  const authStore = useAuthStore() as any;
  const { userId } = authStore;
  const { notifications, markAllAsRead, clearAll, markAsRead } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Auto-clear badges when viewing inbox
  useEffect(() => {
    if (userId) {
      const timer = setTimeout(() => markAllAsRead(userId), 1500);
      return () => clearTimeout(timer);
    }
  }, [markAllAsRead, userId]);

  // Pulse to keep times fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Swipe to dismiss ──
  const handleDismiss = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    markAsRead(id);
  }, [markAsRead]);

  // ── Pull to refresh ──
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const { fetchNotifications } = useNotificationStore.getState();
    const { userId: uid, role } = useAuthStore.getState();
    if (uid) await fetchNotifications(uid, role);
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  // ── Tap navigation ──
  const handleTap = useCallback((n: any) => {
    markAsRead(n.id);
  }, [markAsRead]);

  // ── Filter & group ──
  const visibleNotifications = notifications
    .filter((n: any) => !dismissedIds.has(n.id))
    .filter((n: any) => activeTab === 'all' || getFilterTab(n) === activeTab);

  const grouped = visibleNotifications.reduce((acc: Record<string, any[]>, n: any) => {
    const group = getDateGroup(n.createdAt || n.date);
    if (!acc[group]) acc[group] = [];
    acc[group].push(n);
    return acc;
  }, {});

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const TABS: { key: FilterTab; label: string; icon: any }[] = [
    { key: 'all', label: 'All', icon: BellRing },
    { key: 'trades', label: 'Trades', icon: Package },
    { key: 'pickups', label: 'Pickups', icon: Truck },
    { key: 'system', label: 'System', icon: Zap },
  ];

  return (
    <div className="pb-4 bg-white dark:bg-slate-800 min-h-screen">
      {/* ── FIXED HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl max-w-lg mx-auto pt-[calc(env(safe-area-inset-top,1rem)+1rem)]">
        {/* Top row */}
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 flex items-center justify-center active:scale-95 transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase -mt-0.5">
                  {unreadCount} new
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={() => userId && markAllAsRead(userId)}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-500" />
                </button>
                <button
                  onClick={clearAll}
                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 active:scale-95 transition-all"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 px-4 mt-3 pb-3 border-b border-slate-100 dark:border-slate-700/50 overflow-x-auto no-scrollbar scroll-smooth">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = tab.key === 'all'
              ? notifications.filter((n: any) => !dismissedIds.has(n.id)).length
              : notifications.filter((n: any) => !dismissedIds.has(n.id) && getFilterTab(n) === tab.key).length;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className={`min-w-[18px] h-[18px] rounded-full text-[9px] font-black flex items-center justify-center ${
                    isActive ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── PULL TO REFRESH INDICATOR ── */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[calc(env(safe-area-inset-top,1rem)+8rem)] left-0 right-0 z-40 flex justify-center"
          >
            <div className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Refreshing...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NOTIFICATIONS FEED ── */}
      <div
        className="max-w-lg mx-auto pt-[calc(env(safe-area-inset-top,1rem)+7rem)] px-3 pb-8"
        onTouchEnd={() => {
          // Simple pull-to-refresh: if user scrolls to top
          if (window.scrollY <= 0 && !isRefreshing) {
            handleRefresh();
          }
        }}
      >
        {groupOrder.map(group => {
          const items = grouped[group];
          if (!items || items.length === 0) return null;

          return (
            <div key={group} className="mb-6">
              {/* Group label */}
              <div className="flex items-center gap-2 mb-3 px-1 mt-2">
                <h3 className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.2em]">{group}</h3>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/50" />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                  {items.length}
                </span>
              </div>

              {/* Notification cards */}
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {items.map((n: any, idx: number) => {
                    const config = getNotifConfig(n.type, n.title);
                    const IconComponent = config.icon;

                    return (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 300, scale: 0.8 }}
                        transition={{
                          duration: 0.3,
                          delay: idx * 0.03,
                          exit: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.3}
                        onDragEnd={(_, info) => {
                          if (info.offset.x > 120) {
                            handleDismiss(n.id);
                          }
                        }}
                        onClick={() => handleTap(n)}
                        className={`relative overflow-hidden rounded-2xl border-l-[3px] ${config.accent} cursor-pointer active:scale-[0.98] transition-transform touch-pan-y ${!n.read ? 'shadow-md shadow-slate-200/50 dark:shadow-none' : 'shadow-sm'}`}
                      >
                        {/* Swipe hint background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100" />

                        <div className={`p-4 flex gap-3.5 ${
                          !n.read
                            ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600'
                            : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700'
                        } rounded-r-2xl`}>
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                            <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className={`text-[13px] font-bold leading-tight ${
                                !n.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                              }`}>
                                {n.title}
                              </p>
                              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tabular-nums whitespace-nowrap">
                                  {formatRelativeTime(n.createdAt || n.date)}
                                </p>
                                {!n.read && (
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                                )}
                              </div>
                            </div>
                            <p className={`text-[11px] leading-relaxed pr-2 ${
                              !n.read
                                ? 'text-slate-600 dark:text-slate-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              {n.content}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {/* ── EMPTY STATE ── */}
        {visibleNotifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 px-6 flex flex-col items-center justify-center text-center"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/30 rounded-3xl flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm">
                <BellRing className="w-9 h-9 text-slate-300 dark:text-slate-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                <CircleCheckBig className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1 tracking-tight">
              {activeTab !== 'all' ? `No ${activeTab} alerts` : 'All Caught Up!'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium max-w-[220px] leading-relaxed">
              {activeTab !== 'all'
                ? `You have no ${activeTab} notifications right now.`
                : 'You have no active alerts at the moment. New notifications will appear here in real-time.'
              }
            </p>
            {activeTab !== 'all' && (
              <button
                onClick={() => setActiveTab('all')}
                className="mt-4 px-5 py-2 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-xl active:scale-95 transition-all"
              >
                View All
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
