import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Phone, Loader2 } from 'lucide-react';
import { useAuthStore, ROLES } from '@cleanflow/core';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (phone.length < 9 || pin.length < 4) {
      toast.error('Invalid Credentials', { description: 'Please securely enter admin credentials.' });
      return;
    }

    setIsLoading(true);
    try {
      await login(phone, pin, ROLES.ADMIN);
      toast.success('Admin Authenticated', { description: 'Secured session established.' });
      navigate('/admin', { replace: true });
    } catch (err) {
      toast.error('Security Failure', { description: 'Unauthorized access attempt logged.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-slate-900 border-t-4 border-rose-500 px-4 py-8 relative">
      <div className="max-w-md w-full mx-auto animate-slide-up">
        
        {/* Admin Branding */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            CleanFlow <span className="text-rose-500">Security</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            Administrative Access Portal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleAdminLogin} className="bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Authorized Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="tel"
                  placeholder="HQ Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 text-base focus:ring-rose-500/50 focus:border-rose-500 transition-colors placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Security PIN</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  placeholder="••••"
                  maxLength={6}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 text-base focus:ring-rose-500/50 focus:border-rose-500 transition-colors tracking-widest placeholder:tracking-normal placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-[15px] shadow-lg shadow-rose-900/30 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Secure Login'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
