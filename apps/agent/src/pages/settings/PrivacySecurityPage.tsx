import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Shield, Lock, Trash2, Smartphone } from 'lucide-react';
import { useAuthStore } from '@klinflow/core';
import { toast } from 'sonner';

export default function PrivacySecurityPage() {
  const { logout, changePin, deleteAccount } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [authStage, setAuthStage] = useState('view'); // 'view', 'pin'
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [pins, setPins] = useState({ current: '', new: '', confirm: '' });

  const handleChangePin = async (e) => {
    e.preventDefault();
    if (pins.new !== pins.confirm) {
      toast.error('PIN Mismatch', { description: 'Your new PINs do not match.' });
      return;
    }
    
    setIsLoading(true);
    try {
      await changePin(pins.current, pins.new);
      toast.success('Security Updated', { description: 'Your access PIN has been successfully changed.' });
      setAuthStage('view');
      setPins({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error('Update Failed', { description: err.message || 'Verification failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setIsLoading(true);
    try {
      await deleteAccount();
      toast.error('Agent Account Wiped', { description: 'Your profile and history have been permanently deleted.' });
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error('Error', { description: 'Could not complete deactivation. Try again.' });
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="animate-slide-up pb-20 pt-4 px-4">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => { authStage === 'pin' ? setAuthStage('view') : navigate('/settings') }} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold dark:text-white">Privacy & Security</h1>
      </header>

      {authStage === 'view' ? (
        <div className="space-y-6">
          <div className="card p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
             <button onClick={() => setAuthStage('pin')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                     <Lock className="w-5 h-5" />
                   </div>
                   <div>
                     <div className="text-sm font-semibold text-slate-800 dark:text-white">Change Access PIN</div>
                     <div className="text-xs text-slate-500">Update your security entrance code</div>
                   </div>
                </div>
             </button>
          </div>

          <div className="pt-8">
             <div className="text-center mb-4">
                <h3 className="text-xs font-semibold text-rose-500 uppercase tracking-widest">Danger Zone</h3>
             </div>
             <button 
               onClick={() => setShowDeleteModal(true)} 
               className="w-full py-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border border-rose-100 dark:border-rose-900/50"
             >
                <Trash2 className="w-4 h-4" /> Delete Agent Account
             </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleChangePin} className="card p-5 space-y-5 animate-slide-up border-t-4 border-t-blue-500">
           <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Current PIN</label>
              <input type="password" required maxLength={8} value={pins.current} onChange={(e) => setPins({...pins, current: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-blue-500/50 tracking-widest" placeholder="••••••••" />
           </div>
           <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">New PIN</label>
              <input type="password" required maxLength={8} value={pins.new} onChange={(e) => setPins({...pins, new: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-blue-500/50 tracking-widest" placeholder="Choose new code" />
           </div>
           <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Confirm New PIN</label>
              <input type="password" required maxLength={8} value={pins.confirm} onChange={(e) => setPins({...pins, confirm: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-blue-500/50 tracking-widest" placeholder="Repeat new code" />
           </div>

           <button type="submit" disabled={isLoading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2">
             {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />} Update Security
           </button>
        </form>
      )}

      {/* ── DELETE MODAL ────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[320px] rounded-[28px] overflow-hidden shadow-2xl animate-scale-in border border-slate-100 dark:border-slate-800">
            <div className="bg-rose-500 p-6 flex flex-col items-center gap-3 text-white">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Trash2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-lg font-semibold uppercase tracking-tighter text-center">Terminate Account?</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 leading-relaxed">
                This will <span className="font-semibold text-rose-500 underline decoration-rose-500/30">wipe your agent credentials</span>, history, and earnings permanently.
              </p>
              
              <div className="space-y-2">
                <button 
                  onClick={handleDeactivate}
                  disabled={isLoading}
                  className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all text-white rounded-xl font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Deletion'}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isLoading}
                  className="w-full py-3 text-slate-500 dark:text-slate-400 rounded-xl font-semibold text-xs transition-all hover:bg-slate-100 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
