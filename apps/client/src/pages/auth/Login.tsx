import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Recycle, Lock, Phone, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, ROLES } from '@klinflow/core';
import { toast } from 'sonner';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error('Invalid Phone', { description: 'Please enter a valid 10-digit number.' });
      return;
    }
    if (pin.length < 8) {
      toast.error('Insecure Passcode', { description: 'Passcodes must be at least 8 characters.' });
      return;
    }

    setIsLoading(true);
    try {
      // Allow any role to log in from the client app (Residents and Sellers)
      await login(phone, pin, undefined);
      toast.success('Welcome back');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error('Access Denied', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPin = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info('Reset link sent to verified phone.');
  };

  return (
    <div className="flex flex-col justify-center min-h-dvh max-w-lg mx-auto px-6 py-10 relative overflow-hidden">
      {/* Background Decor (Matched to Welcome Page) */}
      <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[20%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

      <div className="max-w-md w-full mx-auto relative z-10 animate-slide-up">
        
        {/* Branding */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tighter">
            Klin<span className="text-primary italic">Flow</span>
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mt-2 font-semibold">
            The Ecosystem of Tomorrow
          </p>
        </div>

        {/* Login Form */}
        <div className="glass p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white pb-1 tracking-tight">System Access</h2>
              <div className="w-8 h-1 bg-primary mx-auto rounded-full" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">Phone Identity</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                    <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="tel"
                    placeholder="07XX XXX XXX / 01XX..."
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-semibold tracking-widest focus:ring-4 text-base focus:ring-primary/10 focus:border-primary transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Security Passcode</label>
                  <button type="button" onClick={handleForgotPin} className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors uppercase tracking-widest">
                    Recovery?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    placeholder="8+ characters"
                    value={pin}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPin(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-medium focus:ring-4 text-base focus:ring-primary/10 focus:border-primary transition-all outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-primary transition-colors"
                  >
                    {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-semibold text-[13px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Authenticate <div className="w-2 h-2 rounded-full bg-white animate-pulse group-hover:bg-white" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-10">
          New to the ecosystem?{' '}
          <Link to="/register" className="text-primary hover:underline">Register Now</Link>
        </p>
      </div>
    </div>
  );
}
