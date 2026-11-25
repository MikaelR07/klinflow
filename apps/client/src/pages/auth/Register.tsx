import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Recycle, User, Phone, Lock, ChevronRight, MapPin,
  Loader2, ArrowLeft,ArrowRight, ShieldCheck, Mail, Sparkles, Star,
  Fingerprint, Shield, X, ShoppingBag, Home as HomeIcon,
  Venus, Mars, UserCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import LocationSelector from '@klinflow/ui/components/LocationSelector';

export default function Register() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    otp: '',
    pin: '',
    confirmPin: '',
    role: query.get('type') === 'seller' ? 'seller' : ROLES.USER,
    location: null as any,
    gender: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const navigate = useNavigate();
  const { register, checkAvailability, sendOtp, verifyOtp } = useAuthStore();

  const roleTabs = [
    { id: ROLES.USER, label: 'Resident / Business', icon: HomeIcon },
    { id: 'seller', label: 'Pro-Seller', icon: ShoppingBag },
  ];

  // ── WEB OTP API LISTENER ──────────────────────────────────────────
  useEffect(() => {
    if (!isVerifying) return;

    if ('OTPCredential' in window) {
      const ac = new AbortController();
      (navigator.credentials as any).get({
        otp: { transport: ['sms'] },
        signal: ac.signal
      }).then((otp: any) => {
        setFormData(prev => ({ ...prev, otp: otp.code }));
        toast.success('OTP Received', { description: 'Code auto-filled from SMS.' });
      }).catch((err: any) => {
        console.log('Web OTP listener closed:', err);
      });
      return () => ac.abort();
    }
  }, [isVerifying]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // 1. Full Name Validation (Alpha-only + space)
    if (name === 'name') {
      const clean = value.replace(/[^a-zA-Z\s]/g, ''); // Numbers/symbols blocked
      setFormData(prev => ({ ...prev, [name]: clean }));
      return;
    }

    // 2. Phone mask: digits only, max 10
    if (name === 'phone') {
      const clean = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: clean }));

      if (clean.length === 10) {
        const available = await checkAvailability(clean);
        setPhoneAvailable(available);
      } else {
        setPhoneAvailable(null);
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    const nameParts = formData.name.trim().split(/\s+/);
    if (nameParts.length < 2) return toast.error('Incomplete Name', { description: 'Please provide at least a First and Last name.' });
    if (formData.phone.length !== 10) return toast.error('Format Error', { description: 'Phone must be exactly 10 digits.' });
    if (phoneAvailable === false) return toast.error('Blocked', { description: 'This number is already registered.' });
    if (!formData.email) return toast.error('Field Missing', { description: 'Please provide an email address.' });
    if (!formData.gender) return toast.error('Field Missing', { description: 'Please select your gender.' });
    setCurrentStep(2);
  };

  const initiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── VALIDATION GATE ──
    if (formData.pin.length < 8) return toast.error('Security Risk', { description: 'Passcode must be at least 8 characters.' });
    if (formData.pin !== formData.confirmPin) return toast.error('Match Error', { description: 'Passcodes do not match.' });
    if (!formData.location?.estate) return toast.error('Field Missing', { description: 'Please select your estate location.' });

    // Send real OTP via Africa's Talking
    setIsLoading(true);
    try {
      await sendOtp(formData.phone);
      setIsVerifying(true);
      toast.success('Code Sent!', { description: `A 6-digit OTP has been sent to ${formData.phone}` });
    } catch (err) {
      toast.error('SMS Failed', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    try {
      // 1. Verify the OTP with the database
      await verifyOtp(formData.phone, formData.otp);
      // 2. OTP passed — create the account
      await register(formData);
      toast.success('Welcome to Klinflow!', { description: 'Your account has been verified and activated.' });
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Registration Final Error:', err);
      toast.error('Registration Blocked', {
        description: `Error: ${err.message || 'Unknown Failure'}. Please check your Supabase dashboard or contact support if this persists.`,
        duration: 10000
      });
      if (err.message && (err.message.includes('Incorrect') || err.message.includes('expired'))) {
        setFormData(prev => ({ ...prev, otp: '' }));
      } else {
        setIsVerifying(false);
      }
    } finally {
      setIsLoading(false);
    }
  };



  // ── OTP TIMER LOGIC ──────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    if (isVerifying && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [isVerifying, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleResendOTP = async () => {
    if (timeLeft > 0) return;
    try {
      await sendOtp(formData.phone);
      setTimeLeft(600); // Reset timer to 10 mins
      toast.success('Code Resent', { description: 'A new OTP has been sent to your phone.' });
    } catch (err) {
      toast.error('Resend Failed', { description: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  return (
    <div className="fixed inset-0 max-w-lg mx-auto flex flex-col font-sans overflow-hidden bg-slate-950">

      {/* ── Fixed Background Image (never moves) ── */}
      <div className={`absolute inset-0 z-0 pointer-events-none ${!imageLoaded ? 'bg-emerald-950/30 animate-pulse' : ''}`}>
        <img
          src="/welcome/registrationPage.webp"
          alt="Create your account"
          className={`w-full h-full object-cover object-top transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          draggable={false}
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      {/* ── Top Navigation / Back Button ── */}
      <div className="relative z-20 px-5 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] shrink-0">
        <button
          type="button"
          onClick={() => currentStep === 2 ? setCurrentStep(1) : navigate(-1)}
          className="w-10 h-10 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/45 text-white transition-all active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* ── Fixed Bottom Sheet Card (internal scroll only) ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-end min-h-0">
        <div className="w-full max-h-[74dvh] bg-white/95 dark:bg-slate-800 backdrop-blur-xl rounded-t-[26px] border-t border-white/60 dark:border-slate-700/70 px-6 pt-3 pb-6 flex flex-col overflow-hidden">
          <div className="w-10 h-1 rounded-full bg-slate-300/80 dark:bg-slate-600 mx-auto mb-4 shrink-0" />

          <div className="w-full max-w-md mx-auto flex-1 overflow-y-auto no-scrollbar pr-0.5">
            {/* Header */}
            <div className="mb-4 text-center">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                Create your account
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-[12.5px] font-medium mt-1">
                {currentStep === 1 ? 'Step 1 of 2 · Personal details' : 'Step 2 of 2 · Security & location'}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                <span className={`h-1 rounded-full transition-all ${currentStep === 1 ? 'w-6 bg-emerald-600' : 'w-3 bg-emerald-600/40'}`} />
                <span className={`h-1 rounded-full transition-all ${currentStep === 2 ? 'w-6 bg-emerald-600' : 'w-3 bg-slate-300 dark:bg-slate-600'}`} />
              </div>
            </div>

            {currentStep === 1 && (
              <div className="flex bg-slate-100 dark:bg-slate-900/70 rounded-2xl p-1 border border-slate-200/80 dark:border-slate-700/60 mb-4 gap-1">
                {roleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: tab.id }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[12px] font-bold transition-all ${
                      formData.role === tab.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={initiateRegistration} className="space-y-3">
              {currentStep === 1 ? (
                <>
                  {/* Full Name Input */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                      Full Name
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Jane Wanjiku"
                        className="w-full pl-11 pr-4 py-3 bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 placeholder:font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all outline-none text-[14px]"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="you@example.com"
                        className="w-full pl-11 pr-4 py-3 bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 placeholder:font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all outline-none text-[14px]"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone & Gender */}
                  <div className="grid grid-cols-5 gap-2.5">
                    <div className="col-span-3 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                        Phone Number
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="07XX XXX XXX"
                          className={`w-full pl-10 pr-9 py-3 bg-slate-100/90 dark:bg-slate-900/70 border rounded-2xl text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 placeholder:font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all outline-none text-[14px] ${phoneAvailable === false ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : 'border-slate-200/80 dark:border-slate-700/80'}`}
                          required
                        />
                        {phoneAvailable === true && (
                          <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in" />
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                        Gender
                      </label>
                      <div className="relative group">
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full pl-3.5 pr-8 py-3 bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white font-semibold focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all outline-none text-[14px] appearance-none cursor-pointer"
                          required
                        >
                          <option value="" disabled hidden>Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full py-3.5 mt-2 bg-emerald-950 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-2xl font-bold text-[14px] transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  {/* Passwords */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors" />
                      </div>
                      <input
                        type="password"
                        name="pin"
                        value={formData.pin}
                        onChange={handleInputChange}
                        placeholder="Min 8 characters"
                        className="w-full pl-11 pr-4 py-3 bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 placeholder:font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all outline-none text-[14px]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors" />
                      </div>
                      <input
                        type="password"
                        name="confirmPin"
                        value={formData.confirmPin}
                        onChange={handleInputChange}
                        placeholder="Re-enter password"
                        className="w-full pl-11 pr-4 py-3 bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 placeholder:font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all outline-none text-[14px]"
                        required
                      />
                    </div>
                  </div>

                  {/* Location Selector */}
                  <div className="pt-1">
                    <LocationSelector
                      value={formData.location}
                      onChange={(newLoc) => setFormData(prev => ({ ...prev, location: newLoc }))}
                    />
                  </div>

                  {/* Register Buttons */}
                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="w-12 shrink-0 bg-slate-100 dark:bg-slate-900/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl flex items-center justify-center transition-colors py-3.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3.5 bg-emerald-950 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-2xl font-bold text-[14px] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Registration'}
                    </button>
                  </div>
                </>
              )}
            </form>

            {/* Footer Link */}
            <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-slate-700/70 text-center">
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── VERIFICATION OVERLAY ────────────────────────────────────── */}
      {isVerifying && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-3xl p-7 shadow-2xl border border-slate-200/80 dark:border-slate-700/70 relative animate-in zoom-in slide-in-from-bottom-8 duration-500 ease-out">
            <button
              onClick={() => setIsVerifying(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verify Phone</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 leading-relaxed">
                  Enter the 6-digit code sent to <br />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{formData.phone}</span>
                </p>
              </div>

              <div className="relative group">
                <input
                  autoFocus
                  autoComplete="one-time-code"
                  type="text"
                  inputMode="numeric"
                  value={formData.otp}
                  onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  placeholder="000000"
                  className="w-full text-center text-3xl font-semibold tracking-[0.5em] py-4 bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
                <div className="flex flex-col items-center mt-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold text-slate-400 capitalize tracking-[0.15em]">Expires in:</p>
                    <span className={`text-sm font-bold tracking-widest ${timeLeft < 60 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={timeLeft > 0}
                    onClick={handleResendOTP}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold capitalize tracking-widest transition-all ${timeLeft > 0
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 cursor-pointer'
                      }`}
                  >
                    Resend Code
                  </button>
                </div>
              </div>

              <button
                onClick={handleFinalSubmit}
                disabled={isLoading || formData.otp.length < 6}
                className="w-full py-3.5 bg-emerald-950 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-2xl font-bold text-[14px] active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Register'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
