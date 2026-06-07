import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Shield, Lock, Trash2, Smartphone } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { toast } from 'sonner';

export default function PrivacySecurityPage() {
  const authStore = useAuthStore() as any;
  const { logout, changePin, deleteAccount } = authStore;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [authStage, setAuthStage] = useState('view'); // 'view', 'pin'
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [pins, setPins] = useState({ current: '', new: '', confirm: '' });

  const handleChangePin = async (e: any) => {
    e.preventDefault();
    if (pins.new !== pins.confirm) {
      toast.error('PIN Mismatch', { description: 'Your new PINs do not match.' });
      return;
    }

    setIsLoading(true);
    try {
      await changePin(pins.current, pins.new);
      toast.success('PIN Updated', { description: 'Your security PIN was successfully changed.' });
      setAuthStage('view');
      setPins({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      toast.error('Update Failed', { description: err?.message || 'Please verify your current PIN.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setIsLoading(true);
    try {
      await deleteAccount();
      toast.error('Account Wiped', { description: 'All records and rewards have been permanently deleted.' });
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error('Error', { description: 'Could not complete deactivation. Please try again.' });
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className=" bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-900 pt-[calc(env(safe-area-inset-top,1rem)+1.25rem)] pb-4 px-4 border-b border-slate-200 dark:border-slate-800 ">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/settings')} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 dark:text-white" />
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none mb-1">Privacy & Security</h1>
            <p className="text-[10px] font-bold text-primary capitalize tracking-[0.2em]">Access & PIN Config</p>
          </div>
        </div>
      </div>

      <div className="w-full pt-[calc(env(safe-area-inset-top,1rem)+5.5rem)] pb-24 px-1.5 space-y-6 max-w-lg mx-auto">

        <form onSubmit={handleChangePin} className="card p-5 space-y-5 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-white">Change Security Password</div>
              <div className="text-xs text-slate-500">Update your alphanumeric access code</div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 capitalize tracking-wider">Current Password</label>
            <input type="password" required minLength={8} value={pins.current} onChange={(e) => setPins({ ...pins, current: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-blue-500/50" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 capitalize tracking-wider">New Password</label>
            <input type="password" required minLength={8} value={pins.new} onChange={(e) => setPins({ ...pins, new: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-blue-500/50" placeholder="Minimum 8 characters" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 capitalize tracking-wider">Confirm New Password</label>
            <input type="password" required minLength={8} value={pins.confirm} onChange={(e) => setPins({ ...pins, confirm: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-blue-500/50" placeholder="Repeat new password" />
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />} Update Security
          </button>
        </form>

        <div className="pt-8">
          <div className="text-center mb-4">
            <h3 className="text-xs font-semibold text-rose-500 capitalize tracking-widest">Danger Zone</h3>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border border-rose-100 dark:border-rose-900/50"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>

        {/* ── DELETE MODAL ────────────────────────────────────────── */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
            <div className="bg-white dark:bg-slate-800 w-full max-w-[320px] rounded-[28px] overflow-hidden shadow-2xl animate-scale-in border border-slate-100 dark:border-slate-800">
              <div className="bg-rose-500 p-6 flex flex-col items-center gap-3 text-white">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Trash2 className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-lg font-semibold capitalize tracking-tighter">Delete Account?</h2>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 leading-relaxed">
                  This will <span className="font-semibold text-rose-500 underline decoration-rose-500/30">wipe all records</span>, scheduled bookings, and reward points permanently.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={handleDeactivate}
                    disabled={isLoading}
                    className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all text-white rounded-xl font-semibold text-xs capitalize tracking-widest flex items-center justify-center gap-2"
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
    </div>
  );
}
