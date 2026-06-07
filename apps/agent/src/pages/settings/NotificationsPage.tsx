import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, BellRing, Smartphone, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const { notificationPrefs, updateNotificationPrefs, role } = useAuthStore();
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
    <div className=" bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1.25rem)] pb-4 px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/settings')} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 dark:text-white" />
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none mb-1">Notifications</h1>
            <p className="text-[10px] font-bold text-primary capitalize tracking-[0.2em]">Preferences & Channels</p>
          </div>
        </div>
      </div>

      <div className="w-full pt-[calc(env(safe-area-inset-top,1rem)+5.5rem)] pb-24 px-1.5 space-y-6 max-w-lg mx-auto">
        
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
                 <h3 className="text-[10px] font-bold capitalize tracking-widest text-slate-900 dark:text-white">Native System Alerts</h3>
                 <p className="text-[9px] text-slate-400 font-medium mt-0.5 capitalize">Critical for mission dispatch</p>
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
               className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold capitalize tracking-widest text-slate-600 dark:text-slate-300 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
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

