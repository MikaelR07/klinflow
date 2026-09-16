import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Recycle, Lock, Phone, Loader2, Eye, EyeOff, X, ShieldCheck, ArrowLeft, Shield, ArrowRight, User } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import { toast } from 'sonner';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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
      toast.error('Invalid Phone', { description: 'Please enter a valid 10-digit number.' });
      return;
    }
    if (pin.length < 8) {
      toast.error('Insecure Passcode', { description: 'Passcodes must be at least 8 characters.' });
      return;
    }

    setIsLoading(true);
    try {
      await login(phone, pin, [ROLES.USER, 'resident', 'seller']);
      toast.success('Welcome back');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error('Login Failed', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRecoveryOtp = async () => {
    if (recoveryPhone.length !== 10) return toast.error('Invalid Phone', { description: 'Enter a valid 10-digit number.' });

    setIsLoading(true);
    try {
      // First check if user actually exists (inverse of checkAvailability which returns true if available)
      const available = await checkAvailability(recoveryPhone);
      if (available) {
        throw new Error('This phone number is not registered in our system.');
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
    if (newPin.length < 8) return toast.error('Insecure Passcode', { description: 'New passcode must be at least 8 characters.' });
    if (newPin !== confirmNewPin) return toast.error('Match Error', { description: 'Passcodes do not match.' });

    setIsLoading(true);
    try {
      await resetPin(recoveryPhone, recoveryOtp, newPin);
      toast.success('Account Recovered!', { description: 'Your PIN has been reset successfully. You can now login.' });

      // Auto-fill login fields for convenience
      setPhone(recoveryPhone);
      setPin(newPin);

      // Close recovery modal
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
    <div className="flex flex-col bg-[#f8fafc] sm:bg-slate-100 min-h-[100dvh] relative overflow-hidden font-sans">
      <div className="flex-1 flex flex-col bg-white w-full max-w-lg mx-auto relative shadow-2xl overflow-y-auto overflow-x-hidden">
        
        {/* Top Image Section (Curved) */}
        <div className={`w-full h-[45vh] min-h-[350px] relative shrink-0 z-10 pointer-events-none ${!imageLoaded ? 'bg-emerald-900/10 animate-pulse' : ''}`}>
          <img 
            src="/welcome/loginTwo.webp" 
            alt="Welcome back" 
            className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
            draggable={false}
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Bottom Form Section */}
        <div className="flex-1 px-8 pt-8 pb-8 flex flex-col relative z-20 bg-white rounded-t-[32px] -mt-10">
          
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-[#0c392c] mb-2 tracking-tight">Welcome back</h1>
            <p className="text-[#64748b] text-[15px] leading-relaxed max-w-[280px]">
              Ready to make an impact today?
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 flex-1">
            {/* Phone Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#0f766e] transition-colors" />
              </div>
              <input
                type="tel"
                placeholder="07XX XXX XXX / 01XX..."
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full pl-12 pr-4 py-[18px] bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-all outline-none text-[15px]"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#0f766e] transition-colors" />
              </div>
              <input
                type={showPin ? 'text' : 'password'}
                placeholder="Password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-12 pr-12 py-[18px] bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-all outline-none text-[15px]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-1">
              <button 
                type="button" 
                onClick={() => setRecoveryStep('phone')} 
                className="text-[13px] font-bold text-[#0f766e] hover:text-[#064e3b] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-[18px] mt-2 bg-[#064e3b] hover:bg-[#022c22] text-white rounded-2xl font-bold text-[15px] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading && recoveryStep === 'none' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="w-[18px] h-[18px]" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Create Account Button */}
          <button
            type="button"
            onClick={() => navigate('/role-selection')}
            className="w-full py-[18px] bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#064e3b] rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2"
          >
            <User className="w-[18px] h-[18px]" /> Create an account
          </button>

          {/* Security Footer */}
          <div className="mt-2 flex items-center justify-center gap-1.5 pb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-400">Secure access · Your data is protected</span>
          </div>

        </div>

      </div>

      {/* ── RECOVERY OVERLAY: PHONE STEP ── */}
      {recoveryStep === 'phone' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in slide-in-from-bottom-8 duration-500 ease-out">
            <button onClick={() => setRecoveryStep('none')} className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-[#064e3b]/10 rounded-[1.5rem] flex items-center justify-center mx-auto text-[#064e3b]">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Account Recovery</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">Enter your registered phone number to receive a secure recovery code.</p>
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
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-semibold tracking-widest focus:ring-4 focus:ring-[#064e3b]/10 focus:border-[#064e3b] outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleSendRecoveryOtp}
                disabled={isLoading || recoveryPhone.length !== 10}
                className="w-full py-4 bg-[#064e3b] text-white rounded-2xl font-bold text-[13px] capitalize tracking-[0.2em] flex justify-center items-center gap-2 disabled:opacity-50"
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

              <div className="w-16 h-16 bg-[#064e3b]/10 rounded-[1.5rem] flex items-center justify-center mx-auto text-[#064e3b] mt-2">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Secure Reset</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Code sent to <span className="text-[#064e3b] font-bold">{recoveryPhone}</span>
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
                    className="w-full text-center text-3xl font-semibold tracking-[0.5em] py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-[#064e3b] outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="flex items-center justify-between px-2">
                  <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest">Expires in:</p>
                  <span className={`text-xs font-bold tracking-widest ${timeLeft < 60 ? 'text-rose-500' : 'text-[#064e3b]'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>

                <div className="pt-2 space-y-3">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#064e3b] transition-colors" />
                    <input
                      type="password"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="New Passcode"
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] outline-none transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#064e3b] transition-colors" />
                    <input
                      type="password"
                      value={confirmNewPin}
                      onChange={(e) => setConfirmNewPin(e.target.value)}
                      placeholder="Confirm Passcode"
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleResetPin}
                  disabled={isLoading || recoveryOtp.length < 6 || newPin.length < 8}
                  className="w-full py-4 bg-[#064e3b] text-white rounded-2xl font-bold text-[13px] capitalize tracking-[0.2em] shadow-xl shadow-[#064e3b]/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset & Login'}
                </button>

                <button
                  type="button"
                  disabled={timeLeft > 0 || isLoading}
                  onClick={handleSendRecoveryOtp}
                  className={`py-2 rounded-full text-[11px] font-semibold capitalize tracking-widest transition-all ${timeLeft > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-[#064e3b] hover:bg-[#064e3b]/10'
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
