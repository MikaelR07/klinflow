import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BellRing, CircleCheckBig, MessageSquareCheck, Truck, 
  Zap, ShieldCheck, Coins, Package, Trash2, CheckCheck
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';

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

// ── V3 Notification Icon & Style Config ──
function getNotifConfig(category: string, priority: string) {
  let config = { icon: MessageSquareCheck, bg: 'bg-slate-50 dark:bg-slate-800', iconColor: 'text-slate-500 dark:text-slate-400', accent: 'border-l-slate-400', priorityClass: '' };

  switch (category) {
    case 'pickups':
      config = { icon: Truck, bg: 'bg-emerald-50 dark:bg-emerald-500/10', iconColor: 'text-emerald-500', accent: 'border-l-emerald-500', priorityClass: '' };
      break;
    case 'earnings':
    case 'rewards':
      config = { icon: Coins, bg: 'bg-amber-50 dark:bg-amber-500/10', iconColor: 'text-amber-500', accent: 'border-l-amber-500', priorityClass: '' };
      break;
    case 'marketplace':
    case 'business':
      config = { icon: Package, bg: 'bg-blue-50 dark:bg-blue-500/10', iconColor: 'text-blue-500', accent: 'border-l-blue-500', priorityClass: '' };
      break;
    case 'security':
    case 'account':
      config = { icon: ShieldCheck, bg: 'bg-indigo-50 dark:bg-indigo-500/10', iconColor: 'text-indigo-500', accent: 'border-l-indigo-500', priorityClass: '' };
      break;
    case 'system':
    default:
      config = { icon: Zap, bg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-500 dark:text-slate-400', accent: 'border-l-slate-400', priorityClass: '' };
  }

  // Priority Visual Overrides
  if (priority === 'critical') {
    config.accent = 'border-l-rose-500';
    config.priorityClass = 'ring-1 ring-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)] bg-rose-50/50 dark:bg-rose-950/20';
    config.iconColor = 'text-rose-600 dark:text-rose-400';
    config.bg = 'bg-rose-100 dark:bg-rose-500/20';
  } else if (priority === 'high') {
    config.priorityClass = 'shadow-md shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800';
  } else {
    config.priorityClass = 'shadow-sm bg-slate-50/50 dark:bg-slate-800/40 opacity-90 hover:opacity-100';
  }

  return config;
}

// ── Filter tabs ──
type FilterTab = 'all' | 'pickups' | 'marketplace' | 'earnings' | 'system';

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

  // ── Tap navigation (V3 Dynamic Routing) ──
  const handleTap = useCallback((n: any) => {
    markAsRead(n.id);
    if (n.actionUrl) {
      if (n.actionUrl.startsWith('http')) {
        window.open(n.actionUrl, '_blank');
      } else {
        navigate(n.actionUrl);
      }
    }
  }, [navigate, markAsRead]);

  // ── Filter & group ──
  const visibleNotifications = notifications
    .filter((n: any) => !dismissedIds.has(n.id) && !n.archived)
    .filter((n: any) => activeTab === 'all' || n.category === activeTab);

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
    { key: 'pickups', label: 'Pickups', icon: Truck },
    { key: 'earnings', label: 'Wallet', icon: Coins },
    { key: 'marketplace', label: 'Trades', icon: Package },
    { key: 'system', label: 'System', icon: Zap },
  ];

  return (
    <div className="pb-4 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* ── FIXED HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 max-w-lg mx-auto pt-[calc(env(safe-area-inset-top,1rem)+1rem)]">
        {/* Top row */}
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center active:scale-95 transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase -mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={() => userId && markAllAsRead(userId)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 active:scale-95 transition-all"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                </button>
                <button
                  onClick={clearAll}
                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 active:scale-95 transition-all"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-4 mt-3 pb-3 overflow-x-auto no-scrollbar scroll-smooth">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = tab.key === 'all'
              ? notifications.filter((n: any) => !dismissedIds.has(n.id) && !n.read).length
              : notifications.filter((n: any) => !dismissedIds.has(n.id) && !n.read && n.category === tab.key).length;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 border ${
                  isActive
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className={`min-w-[18px] h-[18px] rounded-full text-[9px] font-black flex items-center justify-center ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'
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
              Syncing Feed...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NOTIFICATIONS FEED ── */}
      <div
        className="max-w-lg mx-auto pt-[calc(env(safe-area-inset-top,1rem)+7.5rem)] px-3 pb-8"
        onTouchEnd={() => {
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
              <div className="flex items-center gap-2 mb-3 px-2 mt-2">
                <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{group}</h3>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                  {items.length}
                </span>
              </div>

              {/* Notification cards */}
              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {items.map((n: any, idx: number) => {
                    const config = getNotifConfig(n.category, n.priority);
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
                        className={`relative overflow-hidden rounded-2xl border border-transparent cursor-pointer transition-all touch-pan-y
                          ${!n.read ? 'border-l-[4px]' : 'border-l-[4px] border-l-slate-300 dark:border-l-slate-700'} 
                          ${!n.read ? config.accent : ''}
                          ${config.priorityClass}
                        `}
                      >
                        {/* Swipe hint background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none opacity-0 hover:opacity-100 transition-opacity" />

                        <div className="p-4 flex gap-4 rounded-r-2xl">
                          {/* Icon */}
                          <div className={`w-11 h-11 rounded-xl ${!n.read ? config.bg : 'bg-slate-100 dark:bg-slate-800/50'} flex items-center justify-center shrink-0`}>
                            <IconComponent className={`w-5 h-5 ${!n.read ? config.iconColor : 'text-slate-400 dark:text-slate-500'}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className={`text-[13px] font-bold leading-tight ${
                                !n.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                              }`}>
                                {n.title}
                              </p>
                              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                <p className="text-[10px] text-slate-400 font-medium tabular-nums whitespace-nowrap">
                                  {formatRelativeTime(n.createdAt || n.date)}
                                </p>
                                {!n.read && (
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                                )}
                              </div>
                            </div>
                            <p className={`text-[12px] leading-relaxed pr-2 ${
                              !n.read
                                ? 'text-slate-600 dark:text-slate-300'
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
            className="py-24 px-6 flex flex-col items-center justify-center text-center"
          >
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none">
                <BellRing className="w-10 h-10 text-slate-300 dark:text-slate-700" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CircleCheckBig className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              {activeTab !== 'all' ? `No ${activeTab} alerts` : 'All Caught Up!'}
            </h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium max-w-[240px] leading-relaxed">
              {activeTab !== 'all'
                ? `You have no ${activeTab} notifications right now.`
                : 'Your feed is clear. New system alerts and dispatches will appear here instantly.'
              }
            </p>
            {activeTab !== 'all' && (
              <button
                onClick={() => setActiveTab('all')}
                className="mt-6 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-widest rounded-xl active:scale-95 transition-all shadow-sm hover:border-emerald-500/30"
              >
                View Inbox
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
