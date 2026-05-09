import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Lock, Phone, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore, ROLES } from '@cleanflow/core';
import { toast } from 'sonner';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error('Invalid Phone', { description: 'Please enter a valid 10-digit business number.' });
      return;
    }
    if (pin.length < 8) {
      toast.error('Insecure Passcode', { description: 'Passcodes must be at least 8 characters.' });
      return;
    }

    setIsLoading(true);
    try {
      await login(phone, pin, ROLES.BUSINESS);
      toast.success('Access Granted', { description: 'Welcome back to the Business Marketplace.' });
      navigate('/', { replace: true });
    } catch (err) {
      toast.error('Access Denied', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8 relative overflow-hidden transition-colors duration-500">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

      <div className="max-w-md w-full mx-auto relative z-10 animate-slide-up">

        {/* Branding */}
        <div className="text-center mb-10">
          <img src="/logo.png" className="w-56 h-auto mx-auto mb-8 shadow-2xl rounded-3xl" alt="Business Logo" />
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tighter">
            Clean<span className="text-indigo-600 italic">Business</span>
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mt-2 font-semibold">
            Kenya's B2B Recycling Marketplace
          </p>
        </div>

        {/* Login Card */}
        <div className="glass p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white pb-1 tracking-tight">Business Portal</h2>
              <div className="w-8 h-1 bg-indigo-600 mx-auto rounded-full mt-1" />
            </div>

            <div className="space-y-4">
              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">Business Phone</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    id="business-phone"
                    type="tel"
                    placeholder="07XX XXX XXX / 01XX..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-semibold tracking-widest focus:ring-4 text-base focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* Passcode */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Security Passcode</label>
                  <button
                    type="button"
                    onClick={() => toast.info('Recovery initiated', { description: 'Reset link sent to your registered phone.' })}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
                  >
                    Recovery?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    id="business-pin"
                    type="password"
                    placeholder="8+ characters"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-medium focus:ring-4 text-base focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-semibold text-[13px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Enter Marketplace <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-10">
          New to the marketplace?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline underline-offset-4">Register Now</Link>
        </p>
      </div>
    </div>
  );
}
