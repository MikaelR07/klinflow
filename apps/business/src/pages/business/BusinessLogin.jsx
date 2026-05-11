import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Recycle, Lock, Phone, Loader2, ArrowLeft } from 'lucide-react';
import { useAuthStore, ROLES } from '@cleanflow/core';
import { toast } from 'sonner';

export default function BusinessLogin() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (phone.length < 9) {
      toast.error('Invalid Phone Number', { description: 'Please enter a valid Kenyan number.' });
      return;
    }
    if (pin.length < 6) {
      toast.error('Invalid PIN', { description: 'PIN must be 6 digits.' });
      return;
    }

    setIsLoading(true);
    try {
      await login(phone, pin, ROLES.BUSINESS);
      toast.success('Login Successful', { description: 'Welcome back to CleanFlow Marketplace.' });
      navigate('/marketplace', { replace: true });
    } catch (err) {
      toast.error('Login Failed', { description: err.message || 'Please check your credentials.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-slate-50 dark:bg-slate-900 px-4 py-8 relative">
      
      <Link 
        to="/login" 
        className="absolute top-6 left-4 p-3 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <div className="max-w-md w-full mx-auto animate-slide-up">
        
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Recycle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Clean<span className="text-primary">Flow</span>
            <span className="text-primary-dark ml-2 text-lg">Business</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Marketplace Access for Partners
          </p>
        </div>

        {/* Login Form */}
        <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
          <form onSubmit={handleLogin} className="space-y-5">
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
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 text-base focus:ring-primary/50 focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">6-Digit PIN</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  placeholder="•••••"
                  minLength={6}
                  maxLength={6}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 text-base focus:ring-primary/50 focus:border-primary transition-colors tracking-widest"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary hover:bg-emerald-600 text-white rounded-xl font-semibold text-[15px] shadow-lg shadow-primary/30 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Access Marketplace'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8 font-medium">
          New business partner?{' '}
          <Link to="/business/register" className="text-primary font-semibold hover:underline">
            Register Business
          </Link>
        </p>

      </div>
    </div>
  );
}
