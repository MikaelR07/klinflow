import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, BellRing, Smartphone, Check, Moon, ShieldAlert, Mail } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const { notificationPrefs, updateNotificationPrefs } = useAuthStore();
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState({
    pushEnabled: notificationPrefs?.pushEnabled ?? true,
    emailEnabled: notificationPrefs?.emailEnabled ?? false,
    quietHoursEnabled: notificationPrefs?.quietHoursEnabled ?? false,
    quietHoursStart: notificationPrefs?.quietHoursStart?.substring(0, 5) ?? '22:00',
    quietHoursEnd: notificationPrefs?.quietHoursEnd?.substring(0, 5) ?? '07:00',
    disabledCategories: notificationPrefs?.disabledCategories ?? []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

  useEffect(() => {
    if ('Notification' in window) {
      setPushStatus(Notification.permission as any);
    }
  }, []);

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategory = (category: string) => {
    setPrefs(prev => {
      const isDisabled = prev.disabledCategories.includes(category);
      if (isDisabled) {
        return { ...prev, disabledCategories: prev.disabledCategories.filter((c: string) => c !== category) };
      } else {
        return { ...prev, disabledCategories: [...prev.disabledCategories, category] };
      }
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateNotificationPrefs({
        ...prefs,
        quietHoursStart: prefs.quietHoursStart.length === 5 ? `${prefs.quietHoursStart}:00` : prefs.quietHoursStart,
        quietHoursEnd: prefs.quietHoursEnd.length === 5 ? `${prefs.quietHoursEnd}:00` : prefs.quietHoursEnd
      });
      toast.success('Preferences Saved', { description: 'Your notification rules are updated.' });
      navigate('/settings');
    } catch (err) {
      toast.error('Failed to update', { description: 'Please try again later' });
    } finally {
      setIsLoading(false);
    }
  };

  const ToggleSwitch = ({ label, description, checked, onChange, icon: Icon, colorClass = "emerald" }: any) => {
    let iconColors = "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    let toggleBg = "bg-emerald-500";
    let toggleRing = "focus:ring-emerald-500/30";
    
    if (colorClass === "blue") {
      iconColors = "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400";
      toggleBg = "bg-blue-500";
      toggleRing = "focus:ring-blue-500/30";
    } else if (colorClass === "indigo") {
      iconColors = "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
      toggleBg = "bg-indigo-500";
      toggleRing = "focus:ring-indigo-500/30";
    } else if (colorClass === "amber") {
      iconColors = "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400";
      toggleBg = "bg-amber-500";
      toggleRing = "focus:ring-amber-500/30";
    } else if (colorClass === "slate") {
      iconColors = "bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300";
      toggleBg = "bg-slate-500";
      toggleRing = "focus:ring-slate-500/30";
    }

    return (
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm transition-all hover:border-slate-200 dark:hover:border-slate-700 group">
        <div className="flex items-center gap-4 flex-1 pr-4">
          {Icon && (
            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${checked ? iconColors : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-wide">{label}</h4>
            {description && <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>}
          </div>
        </div>
        <button 
          onClick={onChange}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 ${toggleRing} ${checked ? toggleBg : 'bg-slate-200 dark:bg-slate-800'}`}
        >
          <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 border-b border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => navigate('/settings')} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-500 transition-colors" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">Notifications</h1>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Rule Engine V3</p>
          </div>
          <div className="w-10 h-10 shrink-0" />
        </div>
      </div>

      <div className="pt-[calc(env(safe-area-inset-top,1rem)+5rem)] px-3 space-y-6 max-w-lg mx-auto pb-6">
        
        {/* Native Push Authorization */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-emerald-800 to-emerald-600 rounded-2xl p-6 border border-emerald-500/20 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-500/30 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
              <BellRing className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-[15px] font-bold text-white tracking-tight mb-2">Native Push Alerts</h2>
            <p className="text-[12px] text-slate-400 mb-6 font-medium leading-relaxed px-2">
              Get timely updates when your agent arrives or when payments are received.
            </p>
            <button 
              onClick={async () => {
                if (pushStatus === 'granted') return;
                const ok = await useNotificationStore.getState().subscribeToPush();
                if (ok) {
                  setPushStatus('granted');
                  toast.success('Push Alerts Ready! 🔔', { description: 'Native alerts are now active.' });
                } else {
                  setPushStatus('denied');
                  toast.error('Auth Failed', { description: 'Please enable notifications in device settings.' });
                }
              }}
              disabled={pushStatus === 'granted'}
              className={`w-full py-3.5 rounded-xl text-[13px] font-bold tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2
                ${pushStatus === 'granted' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default' 
                  : 'bg-emerald-500 text-white active:scale-95 shadow-emerald-500/25 hover:bg-emerald-400'
                }`}
            >
              {pushStatus === 'granted' ? <Check className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              {pushStatus === 'granted' ? 'Native Push Active' : 'Enable Native Push'}
            </button>
          </div>
        </div>

        {/* Global Delivery Rules */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Delivery Channels</h3>
          <div className="space-y-2">
            <ToggleSwitch 
              label="Push Notifications" 
              description="Primary alerts delivered directly to your device." 
              checked={prefs.pushEnabled} 
              onChange={() => handleToggle('pushEnabled')} 
              icon={Smartphone}
              colorClass="emerald"
            />
            <ToggleSwitch 
              label="Email Summaries" 
              description="Weekly breakdowns and critical security alerts." 
              checked={prefs.emailEnabled} 
              onChange={() => handleToggle('emailEnabled')} 
              icon={Mail}
              colorClass="blue"
            />
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Do Not Disturb</h3>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-slate-200 dark:hover:border-slate-700">
            <ToggleSwitch 
              label="Quiet Hours" 
              description="Pause non-critical alerts during rest periods." 
              checked={prefs.quietHoursEnabled} 
              onChange={() => handleToggle('quietHoursEnabled')} 
              icon={Moon}
              colorClass="indigo"
            />
            
            {prefs.quietHoursEnabled && (
              <div className="px-4 pb-5 pt-1 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">From</label>
                  <input 
                    type="time" 
                    value={prefs.quietHoursStart}
                    onChange={(e) => setPrefs(p => ({ ...p, quietHoursStart: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-[13px] font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">To</label>
                  <input 
                    type="time" 
                    value={prefs.quietHoursEnd}
                    onChange={(e) => setPrefs(p => ({ ...p, quietHoursEnd: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-[13px] font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>
            )}
          </div>
          <p className="text-[10px] font-medium text-slate-400 px-3 flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            Critical alerts bypass quiet hours.
          </p>
        </div>

        {/* Category Subscriptions */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mt-2">Category Subscriptions</h3>
          <div className="space-y-2">
            <ToggleSwitch 
              label="Pickups & Routing" 
              description="Alerts when an agent accepts or arrives at your location." 
              checked={!prefs.disabledCategories.includes('pickups')} 
              onChange={() => toggleCategory('pickups')} 
              colorClass="emerald"
            />
            <ToggleSwitch 
              label="Earnings & Rewards" 
              description="Updates on wallet balances and redeemed points." 
              checked={!prefs.disabledCategories.includes('earnings')} 
              onChange={() => toggleCategory('earnings')} 
              colorClass="amber"
            />
            <ToggleSwitch 
              label="Marketplace Updates" 
              description="Offers and updates related to your trade listings." 
              checked={!prefs.disabledCategories.includes('marketplace')} 
              onChange={() => toggleCategory('marketplace')} 
              colorClass="blue"
            />
            <ToggleSwitch 
              label="System & Security" 
              description="Important profile verifications and system maintenance." 
              checked={!prefs.disabledCategories.includes('system')} 
              onChange={() => toggleCategory('system')} 
              colorClass="slate"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 pb-[calc(env(safe-area-inset-bottom,1rem)+6rem)] px-4 max-w-lg mx-auto">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[13px] font-bold capitalize tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 shadow-lg shadow-emerald-600/25"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
          Save Configuration
        </button>
      </div>
    </div>
  );
}
