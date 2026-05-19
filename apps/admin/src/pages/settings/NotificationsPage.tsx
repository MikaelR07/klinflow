import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, BellRing, Smartphone, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const { notificationPrefs, updateNotificationPrefs } = useAuthStore();
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState({
    systemAlerts: notificationPrefs?.systemAlerts ?? true,
    feedbackAlerts: notificationPrefs?.feedbackAlerts ?? true,
    dailyKpi: notificationPrefs?.dailyKpi ?? false,
    staffAlerts: notificationPrefs?.staffAlerts ?? true,
    channel: notificationPrefs?.channel ?? 'push'
  });
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="animate-slide-up pb-20">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold dark:text-white">Notifications</h1>
      </header>

      <div className="space-y-6">
        
        {/* Channels */}
        <div className="card p-5">
           <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">Delivery Channel</h2>
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
        <div className="card p-5 divide-y divide-slate-100 dark:divide-slate-800 border-t-4 border-t-primary">
          <ToggleSwitch label="Critical System Alerts" description="Get notified if IoT bins go offline or server downtime occurs." checked={prefs.systemAlerts} onChange={() => handleToggle('systemAlerts')} />
          <ToggleSwitch label="Negative Feedback Alerts" description="Instant alerts whenever a user submits a 1-2 star review." checked={prefs.feedbackAlerts} onChange={() => handleToggle('feedbackAlerts')} />
          <ToggleSwitch label="Daily KPI Summary" description="Receive an automated performance & revenue summary at 6:00 PM." checked={prefs.dailyKpi} onChange={() => handleToggle('dailyKpi')} />
          <ToggleSwitch label="Staff Provisioning Alerts" description="Get notified instantly if a new Admin or Agent registers." checked={prefs.staffAlerts} onChange={() => handleToggle('staffAlerts')} />
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Apply Preferences
        </button>

      </div>
    </div>
  );
}
