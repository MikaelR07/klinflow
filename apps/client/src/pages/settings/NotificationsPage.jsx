import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, BellRing, Smartphone, MessageSquare, Trash2, CheckCircle2, AlertTriangle, Gift, Info, Clock } from 'lucide-react';
import { useAuthStore, useNotificationStore, NOTIFICATION_TYPES, ROLES } from '@cleanflow/core';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const { notificationPrefs, updateNotificationPrefs, role } = useAuthStore();
  const { notifications, markAllAsRead, clearAll } = useNotificationStore();
  const navigate = useNavigate();
  const isAgent = role === ROLES.AGENT;

  const [prefs, setPrefs] = useState({
    pickupReminders: notificationPrefs?.pickupReminders ?? true,
    aiInsights: notificationPrefs?.aiInsights ?? true,
    rewardAlerts: notificationPrefs?.rewardAlerts ?? true,
    emergencyAlerts: notificationPrefs?.emergencyAlerts ?? true,
    agentJobAlerts: notificationPrefs?.agentJobAlerts ?? true,
    channel: notificationPrefs?.channel ?? 'push'
  });
  const [isLoading, setIsLoading] = useState(false);

  // Auto-clear badges when viewing inbox
  useEffect(() => {
    const timer = setTimeout(() => markAllAsRead(), 1500);
    return () => clearTimeout(timer);
  }, [markAllAsRead]);

  const handleToggle = (key) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  
  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateNotificationPrefs(prefs);
      toast.success('Preferences Saved', { description: 'Your notification channels are updated.' });
      navigate('/settings');
    } catch (err) {
      toast.error('Failed to update', { description: 'Please try again later' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'just now';
    try {
      const parsed = new Date(dateString);
      if (isNaN(parsed.getTime())) return 'just now';
      
      const now = new Date();
      // Use Math.max to handle cases where local clock is slightly behind server clock
      const diffInSeconds = Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / 1000));

      if (diffInSeconds < 30) return 'just now';
      if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      
      // If more than a day, show the actual date
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

  const getIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS: return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case NOTIFICATION_TYPES.WARNING: return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case NOTIFICATION_TYPES.REWARD: return <Gift className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const ToggleSwitch = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-3">
      <div className="pr-4">
        <div className="text-sm font-semibold text-slate-800 dark:text-white">{label}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{description}</div>
      </div>
      <button 
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${checked ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="animate-slide-up pb-24 px-2">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold dark:text-white">Notification Hub</h1>
      </header>

      <div className="space-y-6">
        
        {/* Inbox */}
        <div className="card p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 border-b-4 border-b-primary shadow-lg">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-900 dark:text-white">Recent Alerts</h2>
               </div>
               <div className="flex items-center gap-2">
                 <button 
                   onClick={clearAll}
                   className="text-xs font-semibold uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2 py-1 rounded-md transition-all"
                 >
                   Clear All
                 </button>
               </div>
            </div>
           
           <div className="max-h-[300px] overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className={`p-4 flex gap-4 transition-colors ${!n.read ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}>
                   <div className="mt-1">{getIcon(n.type)}</div>
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold dark:text-white">{n.title}</p>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-300" />
                          <span className="text-xs text-slate-400 font-medium tabular-nums">
                            {formatRelativeTime(n.created_at || n.date)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{n.body}</p>
                   </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="py-12 px-6 text-center">
                   <BellRing className="w-12 h-12 text-slate-200 mx-auto mb-3 opacity-20" />
                   <p className="text-xs text-slate-400 font-semibold uppercase tracking-tighter">No Active Notifications</p>
                </div>
              )}
           </div>
        </div>

        {/* Channels */}
        <div className="card p-5">
           <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-400" /> Delivery Preferences
           </h2>
           <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPrefs({...prefs, channel: 'push'})} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${prefs.channel === 'push' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                <Smartphone className="w-6 h-6" />
                <span className="text-sm font-semibold">Push Alerts</span>
              </button>
              <button onClick={() => setPrefs({...prefs, channel: 'sms'})} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${prefs.channel === 'sms' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                <MessageSquare className="w-6 h-6" />
                <span className="text-sm font-semibold">SMS Texts</span>
              </button>
           </div>
        </div>

        {/* Triggers */}
        <div className="card p-5 divide-y divide-slate-100 dark:divide-slate-800">
          {(role === ROLES.USER || role === 'resident') && (
            <>
              <ToggleSwitch label="Pickup Reminders" description="Get notified before your scheduled waste pickup." checked={prefs.pickupReminders} onChange={() => handleToggle('pickupReminders')} />
              <ToggleSwitch label="Reward Alerts" description="Get notified when you earn green points." checked={prefs.rewardAlerts} onChange={() => handleToggle('rewardAlerts')} />
              <ToggleSwitch label="Emergency & Odour" description="Real-time alerts for local hazards or bad air quality." checked={prefs.emergencyAlerts} onChange={() => handleToggle('emergencyAlerts')} />
            </>
          )}
          <ToggleSwitch label="HygeneX Insights" description="Weekly AI tips on sorting and reducing waste." checked={prefs.aiInsights} onChange={() => handleToggle('aiInsights')} />
          {isAgent && <ToggleSwitch label="New Job Assignments" description="Instant notifications when dispatch assigns a route." checked={prefs.agentJobAlerts} onChange={() => handleToggle('agentJobAlerts')} />}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-12 py-3.5 bg-primary text-white rounded-2xl text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 shadow-lg shadow-primary/20"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Preferences
          </button>
        </div>

      </div>
    </div>
  );
}
