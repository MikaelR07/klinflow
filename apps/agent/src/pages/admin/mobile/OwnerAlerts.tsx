import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { 
  ShieldAlert, AlertTriangle, Info, Bell, CheckCircle2, ArrowLeft, Search,
  Mail, Zap, Users, DollarSign, TrendingDown, Shield, Settings, ChevronRight,
  SlidersHorizontal
} from 'lucide-react';

export default function OwnerAlerts() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { notifications, markAsRead } = useNotificationStore();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const alerts = notifications.filter(n => n.type === 'alert' || n.priority === 'high' || n.type === 'dispute');
  const unreadAlerts = alerts.filter(a => !a.read);
  const criticalAlerts = alerts.filter(a => a.priority === 'high' || a.type === 'dispute');
  const resolvedToday = alerts.filter(a => a.read);


  // Alerts by type
  const alertTypes = [
    { label: 'Disputes', icon: ShieldAlert, count: alerts.filter(a => a.type === 'dispute').length, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10', borderColor: 'border-rose-600 ' },
    { label: 'Deposits', icon: DollarSign, count: Math.floor(alerts.length * 0.3), color: 'text-emerald-600', bg: 'bg-[#F8F8FF] dark:bg-slate-800', borderColor: 'border-emerald-600 ' },
    { label: 'Fleet', icon: Users, count: Math.floor(alerts.length * 0.2), color: 'text-blue-600', bg: 'bg-[#F8F8FF] dark:bg-slate-800', borderColor: 'border-blue-600 ' },
    { label: 'Performance', icon: TrendingDown, count: Math.floor(alerts.length * 0.15), color: 'text-violet-600', bg: 'bg-[#F8F8FF] dark:bg-slate-800', borderColor: 'border-violet-600 ' },
    { label: 'Security', icon: Shield, count: Math.floor(alerts.length * 0.1), color: 'text-amber-600', bg: 'bg-[#F8F8FF] dark:bg-slate-800', borderColor: 'border-amber-600 ' },
    { label: 'System', icon: Settings, count: Math.floor(alerts.length * 0.1), color: 'text-gray-600', bg: 'bg-[#F8F8FF] dark:bg-slate-800', borderColor: 'border-gray-600 ' },
  ];

  const tabs = ['All', 'Unread', 'Critical', 'Resolved'];

  const getPriorityConfig = (priority: string, type: string) => {
    if (priority === 'high' || type === 'dispute') return { icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Critical', tagColor: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400' };
    if (priority === 'medium') return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Warning', tagColor: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' };
    return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Info', tagColor: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400' };
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Mock alert type for display
  const getAlertType = (alert: any): string => {
    if (alert.type === 'dispute') return 'Critical';
    if (alert.priority === 'high') return 'Critical';
    if (alert.priority === 'medium') return 'Fleet';
    return 'System';
  };

  const getAlertTypeColor = (type: string): string => {
    switch (type) {
      case 'Critical': return 'text-rose-600';
      case 'Deposits': return 'text-emerald-600';
      case 'Fleet': return 'text-blue-600';
      case 'Performance': return 'text-violet-600';
      case 'Security': return 'text-amber-600';
      default: return 'text-slate-500';
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const matchSearch = !searchQuery || 
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchTab = true;
    if (activeTab === 'Unread') matchTab = !a.read;
    if (activeTab === 'Critical') matchTab = a.priority === 'high' || a.type === 'dispute';
    if (activeTab === 'Resolved') matchTab = !!a.read;

    return matchSearch && matchTab;
  });

  const markAllAsRead = () => {
    alerts.forEach(a => { if (!a.read) markAsRead(a.id); });
  };

  return (
    <div className="animate-in fade-in duration-300">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-lg mx-auto bg-[#F8F8FF] dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')} 
                className="p-2 -ml-2 bg-white dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-600 dark:text-white tracking-tight">Alerts</h1>
                <p className="text-[11px] font-medium text-slate-500">Monitor important activities and issues in real-time.</p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-emerald-600 active:scale-95 transition-all">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">Filter</span>
            </button>
          </div>

          {/* Tabs inside topnav */}
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            {tabs.map(tab => {
              const count = tab === 'All' ? alerts.length 
                : tab === 'Unread' ? unreadAlerts.length 
                : tab === 'Critical' ? criticalAlerts.length 
                : resolvedToday.length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all shrink-0 border ${
                    activeTab === tab
                      ? 'bg-primary dark:bg-white border-primary dark:border-white text-white dark:text-slate-600 shadow-sm'
                      : 'bg-[#F8F8FF] dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {tab}
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeTab === tab ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content with top padding for fixed nav */}
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+8rem)] pb-6 space-y-5 px-1.5">

        {/* ── ALERTS BY TYPE ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-white">Alerts by Type</h3>
            <button className="text-[10px] font-bold text-emerald-600">slide to view more</button>
          </div>
          <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
            <div className="flex gap-1.5 w-max">
              {alertTypes.map((type, i) => (
                <div 
                  key={i}
                  className={`w-[calc(25vw-0.75rem)] max-w-[100px] rounded-xl border ${type.borderColor} ${type.bg} p-2 flex flex-col gap-1.5 shrink-0`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-white leading-none">{type.count}</span>
                    <type.icon className={`w-4 h-4 ${type.color} opacity-60 shrink-0`} />
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-widest ${type.color}`}>{type.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SEARCH ── */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8F8FF] dark:bg-slate-800 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold dark:text-white outline-none transition-all"
          />
        </div>

        {/* ── RECENT ALERTS ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-600 dark:text-white">Recent Alerts</h3>
            <button 
              onClick={markAllAsRead}
              className="text-[10px] font-bold text-emerald-600"
            >
              Mark all as read
            </button>
          </div>

          {/* ── ALERTS LIST ── */}
          <div className="space-y-1">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center bg-[#F8F8FF] dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4 opacity-50" />
                <p className="text-sm font-black text-slate-900 dark:text-white mb-1">No Alerts</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operations are running smoothly.</p>
              </div>
            ) : (
              filteredAlerts.map(alert => {
                const config = getPriorityConfig(alert.priority, alert.type);
                const alertType = getAlertType(alert);
                const typeColor = getAlertTypeColor(alertType);
                return (
                  <div 
                    key={alert.id}
                    onClick={() => {
                      if (!alert.read) markAsRead(alert.id);
                    }}
                    className={`bg-[#F8F8FF] dark:bg-slate-800 rounded-xl p-4 border transition-all cursor-pointer active:scale-[0.98] ${
                      !alert.read 
                        ? 'border-slate-200 dark:border-slate-700' 
                        : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Unread dot */}
                      <div className="shrink-0 w-2">
                        {!alert.read && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </div>
                      
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                        <config.icon className="w-5 h-5" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-bold text-slate-700 dark:text-white leading-tight truncate">{alert.title}</h4>
                        <p className="text-[10px] font-medium text-slate-500 line-clamp-1 mt-0.5">{alert.message}</p>
                      </div>

                      {/* Right side */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="text-[9px] font-medium text-slate-400">{getTimeAgo(alert.created_at)}</span>
                        <span className={`text-[9px] font-bold ${typeColor}`}>{alertType}</span>
                        {!alert.read && <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">New</span>}
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {filteredAlerts.length > 0 && (
            <button className="w-full text-center text-[11px] font-bold text-emerald-600 py-2">
              View all alerts
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
