import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, BellRing, Smartphone, MessageSquare } from 'lucide-react';
import { useAuthStore, useNotificationStore, ROLES } from '@klinflow/core';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const authStore = useAuthStore() as any;
  const { notificationPrefs, updateNotificationPrefs, role } = authStore;
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

  const handleToggle = (key: string) => setPrefs(prev => ({ ...prev, [key]: !(prev as any)[key] }));
  
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

  const ToggleSwitch = ({ label, description, checked, onChange }: { label: string, description: string, checked: boolean, onChange: () => void }) => (
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
        <h1 className="text-xl font-semibold dark:text-white">Notification Settings</h1>
      </header>

      <div className="space-y-6">
        
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
                 <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">Device Notifications</h3>
                 <p className="text-[10px] text-slate-400 font-medium mt-0.5">Alerts when app is closed</p>
               </div>
             </div>
             
             <button 
               onClick={async () => {
                 const ok = await useNotificationStore.getState().subscribeToPush();
                 if (ok) {
                   toast.success('System Ready! 🔔', { description: 'Native push alerts are now active.' });
                 } else {
                   toast.error('Permission Denied', { description: 'Please enable notifications in your browser settings.' });
                 }
               }}
               className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
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
