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
        <div className="glass p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none min-h-[340px] flex flex-col justify-center">
          <form onSubmit={handleLogin} className="space-y-5 animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white pb-1">Agent Sign In</h2>
              <p className="text-xs text-slate-500">Access your jobs and routes</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-secondary">
                  <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-secondary transition-colors" />
                </div>
                <input
                  type="tel"
                  placeholder="07XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 text-base focus:ring-secondary/50 focus:border-secondary transition-colors placeholder:font-normal"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Agent PIN</label>
                <button type="button" onClick={() => setRecoveryStep('phone')} className="text-xs font-semibold text-secondary hover:text-blue-700 transition-colors">
                  Forgot PIN?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-secondary">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-secondary transition-colors" />
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
              {isLoading && recoveryStep === 'none' ? (
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
          <Link to="/role-selection" className="text-secondary font-semibold hover:underline">
            Register Here
          </Link>
        </p>

      </div>

      {/* ── RECOVERY OVERLAY: PHONE STEP ── */}
      {recoveryStep === 'phone' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in slide-in-from-bottom-8 duration-500 ease-out">
            <button onClick={() => setRecoveryStep('none')} className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-[1.5rem] flex items-center justify-center mx-auto text-secondary">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Agent Recovery</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">Enter your registered agent phone number to receive a secure recovery code.</p>
              </div>

              <div className="relative group text-left">
                <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 capitalize tracking-widest">Registered Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    autoFocus
                    value={recoveryPhone}
                    onChange={(e) => setRecoveryPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="07XX XXX XXX"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-semibold tracking-widest focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleSendRecoveryOtp}
                disabled={isLoading || recoveryPhone.length !== 10}
                className="w-full py-4 bg-secondary text-white rounded-2xl font-semibold text-[13px] capitalize tracking-[0.2em] flex justify-center items-center gap-2 disabled:opacity-50"
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
          <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in slide-in-from-bottom-8 duration-500 ease-out">
            <button onClick={() => setRecoveryStep('none')} className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-6">
              <button
                onClick={() => setRecoveryStep('phone')}
                className="absolute left-6 top-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-secondary/10 rounded-[1.5rem] flex items-center justify-center mx-auto text-secondary mt-2">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Secure Reset</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Code sent to <span className="text-secondary font-bold">{recoveryPhone}</span>
                </p>
              </div>

              <div className="space-y-4 text-left">
                <div className="relative">
                  <input
                    autoFocus
                    autoComplete="one-time-code"
                    type="text"
                    inputMode="numeric"
                    value={recoveryOtp}
                    onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full text-center text-3xl font-semibold tracking-[0.5em] py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-secondary outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="flex items-center justify-between px-2">
                  <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest">Expires in:</p>
                  <span className={`text-xs font-bold tracking-widest ${timeLeft < 60 ? 'text-rose-500' : 'text-secondary'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>

                <div className="pt-2 space-y-3">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-secondary transition-colors" />
                    <input
                      type="password"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="New Passcode"
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-secondary transition-colors" />
                    <input
                      type="password"
                      value={confirmNewPin}
                      onChange={(e) => setConfirmNewPin(e.target.value)}
                      placeholder="Confirm Passcode"
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleResetPin}
                  disabled={isLoading || recoveryOtp.length < 6 || newPin.length < 8}
                  className="w-full py-4 bg-secondary text-white rounded-2xl font-semibold text-[13px] capitalize tracking-[0.2em] shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset & Login'}
                </button>

                <button
                  type="button"
                  disabled={timeLeft > 0 || isLoading}
                  onClick={handleSendRecoveryOtp}
                  className={`py-2 rounded-full text-[11px] font-semibold capitalize tracking-widest transition-all ${timeLeft > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-secondary hover:bg-secondary/10'
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
