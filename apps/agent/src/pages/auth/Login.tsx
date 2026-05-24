import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Recycle, Lock, Phone, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import { toast } from 'sonner';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error('Invalid Phone Number', { description: 'Please enter a valid 10-digit agent number.' });
      return;
    }
    if (pin.length < 8) {
      toast.error('Insecure PIN', { description: 'PIN must be at least 8 characters long.' });
      return;
    }

    setIsLoading(true);
    try {
      await login(phone, pin, ROLES.AGENT);
      toast.success('Agent Login Successful', { description: 'Ready for pickups.' });
      navigate('/', { replace: true });
    } catch (err) {
      toast.error('Login Failed', { description: err.message || 'Unknown error.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPin = (e) => {
    e.preventDefault();
    toast.info('Reset Instructions Sent', { description: 'Check your SMS for the recovery link.' });
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-slate-50 dark:bg-slate-900 px-4 py-8 relative overflow-hidden">
      {/* Background Decor (Matched to Welcome Page) */}
      <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[20%] right-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="max-w-md w-full mx-auto animate-slide-up">

        {/* Branding */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Klin<span className="text-secondary">Agent</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Green Agent Operations Portal
          </p>
        </div>

        {/* Login Form */}
        <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none min-h-[340px] flex flex-col justify-center">
          <form onSubmit={handleLogin} className="space-y-5 animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white pb-1">Agent Sign In</h2>
              <p className="text-xs text-slate-500">Access your jobs and routes</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="tel"
                  placeholder="07XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 text-base focus:ring-secondary/50 focus:border-secondary transition-colors placeholder:font-normal"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Agent PIN</label>
                <button type="button" onClick={handleForgotPin} className="text-xs font-semibold text-secondary hover:text-blue-700 transition-colors">
                  Forgot PIN?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  placeholder="••••••••"
                  minLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 text-base focus:ring-secondary/50 focus:border-secondary transition-colors tracking-widest placeholder:font-normal placeholder:tracking-normal"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-secondary transition-colors"
                >
                  {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-secondary hover:bg-blue-700 text-white rounded-xl font-semibold text-[15px] shadow-lg shadow-secondary/30 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating Agent...
                </>
              ) : (
                'Start Shift'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-secondary font-semibold hover:underline">
            Register Here
          </Link>
        </p>

      </div>
    </div>
  );
}
