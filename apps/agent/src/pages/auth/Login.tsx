import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Recycle, Lock, Phone, Loader2, Eye, EyeOff, X, ShieldCheck, ArrowLeft, Shield } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import { toast } from 'sonner';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Recovery Flow State
  const [recoveryStep, setRecoveryStep] = useState<'none' | 'phone' | 'otp'>('none');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const navigate = useNavigate();
  const { login, sendOtp, resetPin, checkAvailability } = useAuthStore();

  // ── OTP TIMER LOGIC ──
  useEffect(() => {
    if (recoveryStep === 'otp' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [recoveryStep, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      toast.error('Login Failed', { description: err.message || 'Unknown error.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRecoveryOtp = async () => {
    if (recoveryPhone.length !== 10) return toast.error('Invalid Phone', { description: 'Enter a valid 10-digit number.' });

    setIsLoading(true);
    try {
      const available = await checkAvailability(recoveryPhone);
      if (available) {
        throw new Error('This phone number is not registered as an agent.');
      }

      await sendOtp(recoveryPhone);
      setTimeLeft(600);
      setRecoveryStep('otp');
      toast.success('Code Sent!', { description: `A recovery OTP was sent to ${recoveryPhone}` });
    } catch (err: any) {
      toast.error('Failed to Send', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPin = async () => {
    if (recoveryOtp.length < 6) return toast.error('Invalid OTP', { description: 'Please enter the full 6-digit code.' });
    if (newPin.length < 8) return toast.error('Insecure PIN', { description: 'New PIN must be at least 8 characters.' });
    if (newPin !== confirmNewPin) return toast.error('Match Error', { description: 'PINs do not match.' });

    setIsLoading(true);
    try {
      await resetPin(recoveryPhone, recoveryOtp, newPin);
      toast.success('Account Recovered!', { description: 'Your PIN has been reset successfully. You can now login.' });

      setPhone(recoveryPhone);
      setPin(newPin);

      setRecoveryStep('none');
      setRecoveryPhone('');
      setRecoveryOtp('');
      setNewPin('');
      setConfirmNewPin('');
    } catch (err: any) {
      toast.error('Recovery Failed', { description: err.message });
      if (err.message && (err.message.includes('Incorrect') || err.message.includes('expired'))) {
        setRecoveryOtp('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-lg mx-auto relative font-sans overflow-hidden">

      {/* ── Background Image ── */}
      <div className="absolute inset-0 z-0">
        <img src="/welcome/login.webp" alt="Klinflow Agent Login" className="w-full h-full object-cover" />
      </div>

      {/* ── Top Navigation / Back Button ── */}
      <div className="relative z-20 px-5 pt-[calc(env(safe-area-inset-top,1rem)+1rem)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/45 text-white transition-all active:scale-95 shadow-sm"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* ── Login Card ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-end">
        <div className="w-full bg-white/95 dark:bg-slate-800 backdrop-blur-xl rounded-t-[88px] border-t border-white/60 dark:border-slate-700/70 px-6 pt-3 pb-8 flex flex-col">
          <div className="w-10 h-1 rounded-full bg-slate-300/80 dark:bg-slate-600 mx-auto mb-5" />
          <div className="w-full max-w-md mx-auto flex-1 flex flex-col">

            <div className="mb-5 text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                Welcome back
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium mt-1">
                Sign in to manage pickups &amp; collections
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                  Phone Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    type="tel"
                    placeholder="07XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 placeholder:font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none transition-all text-[14px]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setRecoveryStep('phone')}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    placeholder="Enter your password"
                    minLength={8}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-11 pr-11 py-3.5 bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 placeholder:font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none transition-all text-[14px]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 bg-emerald-950 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-2xl font-bold text-[14px] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isLoading && recoveryStep === 'none' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer Link */}
            <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-700/70 text-center">
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline transition-colors"
                >
                  Create Account
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ── RECOVERY OVERLAY: PHONE STEP ── */}
      {recoveryStep === 'phone' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-3xl p-7 shadow-2xl border border-slate-200/80 dark:border-slate-700/70 relative animate-in zoom-in slide-in-from-bottom-8 duration-500 ease-out">
            <button onClick={() => setRecoveryStep('none')} className="absolute right-5 top-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-5">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-700 dark:text-emerald-400">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Agent Recovery</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 leading-relaxed">Enter your registered agent phone number to receive a secure recovery code.</p>
              </div>

              <div className="relative group text-left">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider ml-1">Registered Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    autoFocus
                    value={recoveryPhone}
                    onChange={(e) => setRecoveryPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="07XX XXX XXX"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white font-semibold tracking-wider focus:ring-2 focus:ring-emerald-600/15 focus:border-emerald-600 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleSendRecoveryOtp}
                disabled={isLoading || recoveryPhone.length !== 10}
                className="w-full py-3.5 bg-emerald-950 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-2xl font-bold text-[13px] flex justify-center items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Recovery Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RECOVERY OVERLAY: OTP & NEW PIN STEP ── */}
      {recoveryStep === 'otp' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-3xl p-7 shadow-2xl border border-slate-200/80 dark:border-slate-700/70 relative animate-in zoom-in slide-in-from-bottom-8 duration-500 ease-out">
            <button onClick={() => setRecoveryStep('none')} className="absolute right-5 top-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-5">
              <button
                onClick={() => setRecoveryStep('phone')}
                className="absolute left-5 top-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-700 dark:text-emerald-400 mt-1">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Secure Reset</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Code sent to <span className="text-emerald-700 dark:text-emerald-400 font-bold">{recoveryPhone}</span>
                </p>
              </div>

              <div className="space-y-3.5 text-left">
                <div className="relative">
                  <input
                    autoFocus
                    autoComplete="one-time-code"
                    type="text"
                    inputMode="numeric"
                    value={recoveryOtp}
                    onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full text-center text-2xl font-bold tracking-[0.5em] py-3 bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white focus:border-emerald-600 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                </div>

                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expires in</p>
                  <span className={`text-xs font-bold tracking-wider ${timeLeft < 60 ? 'text-rose-500' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>

                <div className="pt-1 space-y-2.5">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                      type="password"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="New Passcode"
                      className="w-full pl-11 pr-4 py-3 bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-600/15 focus:border-emerald-600 outline-none transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                      type="password"
                      value={confirmNewPin}
                      onChange={(e) => setConfirmNewPin(e.target.value)}
                      placeholder="Confirm Passcode"
                      className="w-full pl-11 pr-4 py-3 bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-600/15 focus:border-emerald-600 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleResetPin}
                  disabled={isLoading || recoveryOtp.length < 6 || newPin.length < 8}
                  className="w-full py-3.5 bg-emerald-950 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-2xl font-bold text-[13px] shadow-lg shadow-emerald-950/15 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset & Login'}
                </button>

                <button
                  type="button"
                  disabled={timeLeft > 0 || isLoading}
                  onClick={handleSendRecoveryOtp}
                  className={`py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${timeLeft > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                >
                  Resend Recovery Code
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
