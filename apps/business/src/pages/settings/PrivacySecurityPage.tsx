import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Shield, Lock, Trash2, Smartphone } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { toast } from 'sonner';

export default function PrivacySecurityPage() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [authStage, setAuthStage] = useState('view'); // 'view', 'pin'

  const [pins, setPins] = useState({ current: '', new: '', confirm: '' });

  const handleChangePin = async (e) => {
    e.preventDefault();
    if (pins.new !== pins.confirm) {
      toast.error('PIN Mismatch', { description: 'Your new PINs do not match.' });
      return;
    }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('PIN Updated', { description: 'Your security PIN was successfully changed.' });
    setAuthStage('view');
    setPins({ current: '', new: '', confirm: '' });
    setIsLoading(false);
  };

  const handleDeactivate = () => {
    const confirmed = window.confirm("Are you sure you want to continuously delete your Klinflow account? This action cannot be reversed.");
    if (confirmed) {
      toast.error('Account Terminated', { description: 'Your account has been deleted.' });
      logout();
    }
  };

  return (
    <div className="animate-slide-up pb-20">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold dark:text-white">Privacy & Security</h1>
      </header>

        <form onSubmit={handleChangePin} className="card p-5 space-y-5 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-white">Change Security PIN</div>
              <div className="text-xs text-slate-500">Update your 4-digit access code</div>
            </div>
          </div>
          <div>
             <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Current PIN</label>
             <input type="password" required maxLength={6} inputMode="numeric" value={pins.current} onChange={(e) => setPins({...pins, current: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-blue-500/50 tracking-widest text-lg" />
          </div>
          <div>
             <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">New PIN</label>
             <input type="password" required maxLength={6} inputMode="numeric" value={pins.new} onChange={(e) => setPins({...pins, new: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-blue-500/50 tracking-widest text-lg" />
          </div>
          <div>
             <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Confirm New PIN</label>
             <input type="password" required maxLength={6} inputMode="numeric" value={pins.confirm} onChange={(e) => setPins({...pins, confirm: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-blue-500/50 tracking-widest text-lg" />
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />} Update Security
          </button>
        </form>

        <div className="card p-5 mt-6">
           <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">Recent Activity</h2>
           <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-slate-400 mt-0.5 flex-none" />
                <div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Android Application</div>
                  <div className="text-xs text-slate-500">Nairobi, Kenya • Today, 14:30 PM</div>
                  <div className="text-xs font-semibold text-green-500 uppercase mt-1 tracking-wider">Active Session</div>
                </div>
              </div>
           </div>
        </div>

        <div className="pt-8 mt-6">
           <button onClick={handleDeactivate} className="w-full py-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border border-rose-100 dark:border-rose-900/50">
              <Trash2 className="w-4 h-4" /> Deactivate Account
           </button>
        </div>

    </div>
  );
}
