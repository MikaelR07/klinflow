import React from 'react';
import { 
  Bell, 
  Trash2, 
  CheckCheck, 
  Clock, 
  AlertCircle,
  Truck,
  Building2,
  Zap,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useNotificationStore, useAuthStore } from '@cleanflow/core';
import { toast } from 'sonner';

export default function Notifications() {
  const { profile } = useAuthStore();
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll, 
    isLoading 
  } = useNotificationStore();

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(profile.id, 'hub');
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error("Failed to update notifications");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'cargo': return Truck;
      case 'security': return ShieldAlert;
      case 'facility': return Building2;
      case 'system': return Zap;
      default: return AlertCircle;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'cargo': return 'text-blue-500 bg-blue-500/10';
      case 'security': return 'text-rose-500 bg-rose-500/10';
      case 'facility': return 'text-emerald-500 bg-emerald-500/10';
      default: return 'text-primary bg-primary/10';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-4xl mx-auto">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">Notifications</h1>
          <p className="text-xs text-slate-500 font-semibold mt-2 uppercase tracking-widest">
            Facility Alerts & Operational Logs
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleMarkAllRead}
            className="px-5 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-semibold uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2 shadow-sm"
          >
            <CheckCheck className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* ── NOTIFICATION LIST ── */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Syncing with Relay Server...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-20 text-center border border-slate-100 dark:border-white/5">
             <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Bell className="w-10 h-10 text-slate-300" />
             </div>
             <h2 className="text-xl font-semibold text-slate-900 dark:text-white">All Clear!</h2>
             <p className="text-sm text-slate-500 font-medium mt-2">No new operational alerts for this terminal.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-50 dark:divide-white/5">
              {notifications.map((notif) => {
                const Icon = getIcon(notif.type);
                return (
                  <div 
                    key={notif.id}
                    className={`p-6 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer group ${!notif.read ? 'bg-primary/5' : ''}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${getColor(notif.type)}`}>
                       <Icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate pr-4">{notif.title}</h3>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter whitespace-nowrap flex items-center gap-1">
                             <Clock className="w-3 h-3" />
                             {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                       <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                         {notif.message}
                       </p>
                    </div>

                    {!notif.read && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 animate-pulse" />
                    )}
                    
                    <ChevronRight className="w-4 h-4 text-slate-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── SECURITY FOOTER ── */}
      <div className="p-8 bg-slate-900 rounded-[2.5rem] text-center">
         <ShieldAlert className="w-6 h-6 text-primary mx-auto mb-4" />
         <p className="text-xs font-semibold text-white uppercase tracking-[0.2em] mb-2">Automated Audit Trail</p>
         <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
           Notifications are cryptographically logged and cannot be deleted for NEMA compliance reasons.
         </p>
      </div>

    </div>
  );
}
