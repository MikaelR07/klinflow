import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Wallet, 
  Factory, 
  Truck, 
  Settings, 
  Clock,
  MoreVertical,
  Check,
  Search,
  Filter
} from 'lucide-react';

import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';

type NotificationType = 'system' | 'operations' | 'finance' | 'fleet' | 'alert' | 'success' | 'info' | 'warning' | 'reward';

const getTypeConfig = (type: string) => {
  switch (type) {
    case 'finance':
    case 'reward':
      return { icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' };
    case 'fleet':
    case 'success':
      return { icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' };
    case 'operations':
      return { icon: Factory, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' };
    case 'alert':
    case 'warning':
      return { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' };
    case 'system':
    case 'info':
    default:
      return { icon: Info, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
  }
};

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'system' | 'operations' | 'finance'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleMarkAllRead = () => {
    if (profile?.id) {
      markAllAsRead(profile.id, 'hub');
    }
  };

  const handleToggleRead = (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
      markAsRead(id);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (searchQuery) {
      if (!n.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !(n.content || '').toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'system') return n.type === 'system' || n.type === 'alert';
    if (activeTab === 'operations') return n.type === 'operations' || n.type === 'fleet';
    if (activeTab === 'finance') return n.type === 'finance';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (isoString: string) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-20">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white flex items-center gap-3">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {unreadCount} New
                  </span>
                )}
              </h1>
              <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">
                Stay updated on alerts, financial movements, and operational events.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-slate-500 hover:text-[#131722] dark:hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" /> Mark All Read
              </button>
              <button className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                <Settings className="w-4 h-4" /> Preferences
              </button>
            </div>
          </div>

          {/* Controls & Filters */}
          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
            
            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl w-full md:w-auto overflow-x-auto hide-scrollbar">
              {['all', 'unread', 'system', 'operations', 'finance'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`
                    px-4 py-2 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all duration-200
                    ${activeTab === tab 
                      ? 'bg-white dark:bg-slate-800 text-[#131722] dark:text-white shadow-sm' 
                      : 'text-slate-500 hover:text-[#131722] dark:hover:text-slate-300'
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">All Caught Up!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  You have no {activeTab !== 'all' ? activeTab : ''} notifications at this time. We'll alert you when something happens.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                  {filteredNotifications.map((notification) => {
                    const config = getTypeConfig(notification.type);
                    const Icon = config.icon;
                    return (
                      <div
                        key={notification.id}
                        className={`
                          p-4 md:p-5 flex gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group relative cursor-pointer
                          ${!notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                        `}
                        onClick={() => handleToggleRead(notification.id)}
                      >
                        {/* Unread Indicator Line */}
                        {!notification.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                        )}
                        
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-sm truncate pr-4 ${!notification.read ? 'font-bold text-[#131722] dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                              <Clock className="w-3 h-3" />
                              <span className="text-[10px] font-medium whitespace-nowrap">{formatTime(notification.createdAt)}</span>
                            </div>
                          </div>
                          <p className={`text-xs leading-relaxed ${!notification.read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                            {notification.content}
                          </p>
                        </div>
                        
                        <div className="shrink-0 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleRead(notification.id); }}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-[#131722] dark:hover:text-white transition-colors"
                            title={notification.read ? "Mark as unread" : "Mark as read"}
                           >
                             {notification.read ? <Info className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                           </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
