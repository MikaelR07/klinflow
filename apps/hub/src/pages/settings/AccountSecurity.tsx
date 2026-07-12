import React, { useState } from 'react';
import { Shield, Key, Fingerprint, Trash2, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountSecurity() {
  const [pins, setPins] = useState({ current: '', new: '', confirm: '' });
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pins.new !== pins.confirm) {
      toast.error('PIN Mismatch', { description: 'New PIN and confirm PIN must match.' });
      return;
    }
    if (pins.new.length < 4) {
      toast.error('Invalid PIN', { description: 'PIN must be at least 4 digits.' });
      return;
    }
    setIsChangingPin(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('PIN Updated Successfully');
    setPins({ current: '', new: '', confirm: '' });
    setIsChangingPin(false);
  };

  return (
    <>
      <div className="flex h-full w-full relative bg-transparent overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-20">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            
            <div className="flex flex-col gap-1 pb-4">
              <h1 className="text-3xl font-bold tracking-tight text-[#131722] dark:text-white">Account Security</h1>
              <p className="text-[16px] text-slate-500 dark:text-slate-400">Manage your access credentials and two-factor authentication.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <Shield className="w-4 h-4 text-slate-400" />
                <h3 className="text-lg font-bold text-[#131722] dark:text-white">Security Settings</h3>
              </div>
              <div className="p-6 space-y-6">
                
                <form onSubmit={handleChangePin} className="px-4 py-4 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <Key className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-bold text-[#131722] dark:text-white">Change Access PIN</p>
                      <p className="text-[14px] text-slate-500 mt-0.5">Update your login code</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <input type="password" required maxLength={8} value={pins.current} onChange={(e) => setPins({ ...pins, current: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-base font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none" placeholder="Current PIN" />
                    </div>
                    <div>
                      <input type="password" required maxLength={8} value={pins.new} onChange={(e) => setPins({ ...pins, new: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-base font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none" placeholder="New PIN" />
                    </div>
                    <div>
                      <input type="password" required maxLength={8} value={pins.confirm} onChange={(e) => setPins({ ...pins, confirm: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-base font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none" placeholder="Confirm New PIN" />
                    </div>
                  </div>
                  <button type="submit" disabled={isChangingPin} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2">
                    {isChangingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Update PIN
                  </button>
                </form>
                
                <div className="w-full flex items-center justify-between px-4 py-3 border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <Fingerprint className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-bold text-emerald-800 dark:text-emerald-400">Two-Factor Auth</p>
                      <p className="text-[14px] text-emerald-600/70 mt-0.5">Currently enabled</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-[#e0e3eb] dark:border-slate-700/50 ">
                  <div className="text-center mb-3">
                    <h3 className="text-base font-bold text-rose-500 capitalize tracking-widest">Danger Zone</h3>
                  </div>
                  <button
                    disabled
                    className="w-full py-3 text-rose-500/50 dark:text-rose-500/50 disabled:cursor-not-allowed rounded-xl font-bold text-base flex items-center justify-center gap-2 border border-rose-100/50 dark:border-rose-900/20"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Account
                  </button>
                  <p className="text-[14px] text-center text-slate-500 mt-3">
                    To delete your account, please use the Klinflow mobile app.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
