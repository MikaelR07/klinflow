import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, BellRing, Smartphone, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { ROLES } from '@klinflow/constants';
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
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm transition-all hover:border-emerald-100 dark:hover:border-emerald-900/30 group">
      <div className="pr-4 flex-1">
        <h4 className="text-[13px] font-bold text-slate-900 dark:text-white capitalize tracking-wide">{label}</h4>
        {description && <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>}
      </div>
      <button 
        onClick={onChange}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}
      >
        <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F8FF] dark:bg-slate-950 transition-colors ">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 border-b border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => navigate('/settings')} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-500 transition-colors" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tight leading-none">Notifications</h1>
            <p className="text-[10px] font-bold text-emerald-500 capitalize tracking-widest mt-1">System Alerts</p>
          </div>
          <div className="w-10 h-10 shrink-0" />
        </div>
      </div>

      <div className="pt-[calc(env(safe-area-inset-top,1rem)+5rem)] px-1.5 space-y-6 max-w-lg mx-auto">
        
        {/* Native Push Authorization (Hero Style) */}
        <div className="relative overflow-hidden bg-emerald-600 dark:bg-emerald-900/40 rounded-3xl p-6 shadow-lg shadow-emerald-500/10 border border-emerald-500/20">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 blur-2xl rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
              <BellRing className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mb-2">Native Push Alerts</h2>
            <p className="text-xs text-emerald-100 mb-6 font-medium leading-relaxed px-4">
              Receive background notifications even when the app is closed. Essential for real-time updates.
            </p>
            <button 
              onClick={async () => {
                const ok = await useNotificationStore.getState().subscribeToPush();
                if (ok) {
                  toast.success('System Ready! 🔔', { description: 'Native push alerts are now active.' });
                } else {
                  toast.error('Permission Denied', { description: 'Please enable notifications in your browser settings.' });
                }
              }}
              className="w-full py-3.5 bg-white text-emerald-600 rounded-xl text-[13px] font-bold tracking-widest uppercase active:scale-95 transition-all shadow-md shadow-black/5 flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Enable Push
            </button>
          </div>
        </div>

        {/* Delivery Channels */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Delivery Method</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setPrefs({...prefs, channel: 'push'})} 
              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${prefs.channel === 'push' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'}`}
            >
              <Smartphone className="w-6 h-6" />
              <span className="text-[11px] font-bold uppercase tracking-wider">App Push</span>
            </button>
            <button 
              onClick={() => setPrefs({...prefs, channel: 'sms'})} 
              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${prefs.channel === 'sms' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'}`}
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-[11px] font-bold uppercase tracking-wider">SMS Text</span>
            </button>
          </div>
        </div>

        {/* Triggers */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mt-6">Alert Preferences</h3>
          <div className="space-y-3">
            {(role === ROLES.USER || role === 'resident') && (
              <>
                <ToggleSwitch label="Pickup Reminders" description="Alerts before scheduled waste pickups." checked={prefs.pickupReminders} onChange={() => handleToggle('pickupReminders')} />
                <ToggleSwitch label="Reward Alerts" description="Notifications for earned green points." checked={prefs.rewardAlerts} onChange={() => handleToggle('rewardAlerts')} />
                <ToggleSwitch label="Emergency & Odour" description="Real-time hazards & air quality updates." checked={prefs.emergencyAlerts} onChange={() => handleToggle('emergencyAlerts')} />
              </>
            )}
            <ToggleSwitch label="HygeneX Insights" description="AI tips on sorting and reducing waste." checked={prefs.aiInsights} onChange={() => handleToggle('aiInsights')} />
            {isAgent && <ToggleSwitch label="Job Assignments" description="Alerts for new dispatch routes." checked={prefs.agentJobAlerts} onChange={() => handleToggle('agentJobAlerts')} />}
          </div>
        </div>
      </div>

      {/* Save Button (Scrolls with page) */}
      <div className="pt-6 pb-12 px-4 max-w-lg mx-auto">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl text-[13px] font-bold capitalize tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 shadow-xl shadow-slate-900/20 dark:shadow-emerald-900/20"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
          Save Configuration
        </button>
      </div>
    </div>
  );
}
