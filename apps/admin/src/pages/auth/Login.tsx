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
    if (phone.length < 9) {
      toast.error('Access Denied', { description: 'Invalid administrator contact format.' });
      return;
    }
    if (pin.length < 8) {
      toast.error('Access Denied', { description: 'Security Password must be at least 8 characters.' });
      return;
    }

    setIsLoading(true);
    try {
      await login(phone, pin, ROLES.ADMIN);
      toast.success('Authentication Successful', { description: 'Initializing Command Center...' });
      navigate('/', { replace: true });
    } catch (err) {
      toast.error('Authentication Failed', { description: err.message || 'Unauthorized access attempt detected.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPin = (e) => {
    e.preventDefault();
    toast.warning('Security Protocol', { description: 'Contact the Lead Administrator for Password reset.' });
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-slate-900 px-4 py-8 relative">
      <div className="max-w-md w-full mx-auto animate-slide-up">
        
        {/* Branding */}
        <div className="text-center mb-10">

          <h1 className="text-2xl font-semibold text-white tracking-widest uppercase">
            CLEAN<span className="text-slate-400">CORE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-semibold tracking-[0.2em] uppercase">
            Lead Admin Infrastructure
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl min-h-[340px] flex flex-col justify-center">
          <form onSubmit={handleLogin} className="space-y-5 animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-white pb-1">Administrator Sign In</h2>
              <p className="text-xs text-slate-400">Restricted Access Area</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Admin ID / Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="tel"
                  placeholder="07XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white font-medium focus:ring-2 text-base focus:ring-white/20 transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Password</label>
                <button type="button" onClick={handleForgotPin} className="text-xs font-semibold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
                  Help?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  placeholder="••••••••"
                  minLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className={`w-full pl-11 pr-12 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white font-medium focus:ring-2 text-base focus:ring-white/20 transition-all placeholder:text-slate-600 ${!showPin ? 'tracking-[0.5em]' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-white text-slate-900 rounded-xl font-semibold text-sm uppercase tracking-widest shadow-white/10 shadow-lg hover:bg-slate-200 transition-all flex justify-center items-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Authenticate'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-white font-semibold hover:underline">
            Register Here
          </Link>
        </p>

      </div>
    </div>
  );
}
