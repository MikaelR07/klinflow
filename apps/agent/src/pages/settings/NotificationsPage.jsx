import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, BellRing, Smartphone, MessageSquare, CheckCircle2, AlertTriangle, Gift, Info } from 'lucide-react';
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

  const getIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS: return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case NOTIFICATION_TYPES.WARNING: return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case NOTIFICATION_TYPES.REWARD: return <Gift className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
    <div className="animate-slide-up pb-24 pt-4 px-4">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold dark:text-white">Notification Center</h1>
      </header>

      <div className="space-y-6">
        
        {/* Inbox */}
        <div className="card p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 border-b-4 border-b-primary shadow-lg">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <BellRing className="w-4 h-4 text-primary" />
                 <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Live Feed</h2>
              </div>
              <button 
                onClick={clearAll}
                className="text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition-all"
              >
                Clear All
              </button>
           </div>
           
           <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {notifications.map((n) => (
                <div key={n.id} className={`p-4 flex gap-4 transition-colors ${!n.read ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}>
                   <div className="mt-1">{getIcon(n.type)}</div>
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold dark:text-white">{n.title}</p>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatTime(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{n.body}</p>
                   </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="py-12 px-6 text-center">
                   <BellRing className="w-12 h-12 text-slate-200 mx-auto mb-3 opacity-20" />
                   <p className="text-xs text-slate-400 font-semibold">No Active Notifications</p>
                </div>
              )}
           </div>
        </div>

        {/* Channels */}
        <div className="card p-5">
           <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-400" /> Delivery Channels
           </h2>

           {/* Native Push Authorization */}
           <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-3 mb-3">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <BellRing className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white">Native System Alerts</h3>
                 <p className="text-[9px] text-slate-400 font-medium mt-0.5 uppercase">Critical for mission dispatch</p>
               </div>
             </div>
             
             <button 
               onClick={async () => {
                 const ok = await useNotificationStore.getState().subscribeToPush();
                 if (ok) {
                   toast.success('Agent Radar Ready! 🛰️', { description: 'Native mission alerts are now active.' });
                 } else {
                   toast.error('Auth Failed', { description: 'Please enable notifications in device settings.' });
                 }
               }}
               className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
             >
               Enable Native Push
             </button>
           </div>

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
          <ToggleSwitch label="Job Requests" description="Get notified before a new pickup is available." checked={prefs.agentJobAlerts} onChange={() => handleToggle('agentJobAlerts')} />
          <ToggleSwitch label="HygeneX Insights" description="Weekly professional tips on logistics and safety." checked={prefs.aiInsights} onChange={() => handleToggle('aiInsights')} />
          <ToggleSwitch label="Emergency Alerts" description="Real-time alerts for road hazards or bad weather." checked={prefs.emergencyAlerts} onChange={() => handleToggle('emergencyAlerts')} />
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Preferences
        </button>

      </div>
    </div>
  );
}

