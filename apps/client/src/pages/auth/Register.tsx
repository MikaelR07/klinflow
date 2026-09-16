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
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);

  const navigate = useNavigate();
  const { register, checkAvailability, sendOtp, verifyOtp } = useAuthStore();

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

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const initiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── VALIDATION GATE ──
    const nameParts = formData.name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      return toast.error('Incomplete Name', { description: 'Please provide at least a First and Last name.' });
    }
    if (formData.phone.length !== 10) return toast.error('Format Error', { description: 'Phone must be exactly 10 digits.' });
    if (phoneAvailable === false) return toast.error('Blocked', { description: 'This number is already registered.' });
    if (formData.pin.length < 8) return toast.error('Security Risk', { description: 'Passcode must be at least 8 characters.' });
    if (formData.pin !== formData.confirmPin) return toast.error('Match Error', { description: 'Passcodes do not match.' });
    if (!formData.location?.estate) return toast.error('Field Missing', { description: 'Please select your estate location.' });
    if (!formData.gender) return toast.error('Field Missing', { description: 'Please select your gender.' });

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
    <div className="flex flex-col bg-[#f8fafc] sm:bg-slate-100 min-h-[100dvh] relative overflow-hidden font-sans">
      <div className="flex-1 flex flex-col bg-white w-full max-w-lg mx-auto relative shadow-2xl overflow-y-auto overflow-x-hidden">
        
        {/* Top Image Section (Curved) */}
        <div className="w-full h-[35vh] min-h-[250px] relative shrink-0 z-10 pointer-events-none">
          <img 
            src="/welcome/registrationPage.webp" 
            alt="Create your account" 
            className="absolute inset-0 w-full h-full object-cover object-top" 
            draggable={false}
          />
        </div>

        {/* Bottom Form Section */}
        <div className="flex-1 px-6 pt-4 pb-8 flex flex-col relative z-0 bg-white -mt-16">
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[28px] font-bold text-[#0c392c] mb-1.5 tracking-tight">Create your account</h1>
            <p className="text-[#64748b] text-[15px] leading-relaxed max-w-[300px]">
              Join the Klinflow community and turn recyclables into value.
            </p>
          </div>

          <form onSubmit={initiateRegistration} className="space-y-3.5 flex-1">
            
            {/* Full Name Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#0f766e] transition-colors" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full name"
                className="w-full pl-12 pr-4 py-[16px] bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-all outline-none text-[15px]"
                required
              />
            </div>

            {/* Email Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#0f766e] transition-colors" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email address"
                className="w-full pl-12 pr-4 py-[16px] bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-all outline-none text-[15px]"
                required
              />
            </div>

            {/* Phone Input (Kept placeholder logic as requested) */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#0f766e] transition-colors" />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone number (07... / 01...)"
                className={`w-full pl-12 pr-12 py-[16px] bg-white border rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-all outline-none text-[15px] ${phoneAvailable === false ? 'border-rose-300 ring-rose-100' : 'border-slate-200'}`}
                required
              />
              {phoneAvailable === true && (
                <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600 animate-in fade-in zoom-in" />
              )}
            </div>

            {/* Gender Select */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#0f766e] transition-colors" />
              </div>
              <div className="absolute top-2 left-12 pointer-events-none">
                <span className="text-[15px] font-bold text-slate-400">Gender</span>
              </div>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full pl-12 pr-10 pt-[26px] pb-[10px] bg-white border border-slate-200 rounded-2xl text-slate-600 font-medium focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-all outline-none text-[12px] appearance-none cursor-pointer"
                required
              >
                <option value="" disabled hidden className="text-slate-400">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Passwords */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#0f766e] transition-colors" />
              </div>
              <input
                type="password"
                name="pin"
                value={formData.pin}
                onChange={handleInputChange}
                placeholder="Password"
                className="w-full pl-12 pr-12 py-[16px] bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-all outline-none text-[15px]"
                required
              />
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#0f766e] transition-colors" />
              </div>
              <input
                type="password"
                name="confirmPin"
                value={formData.confirmPin}
                onChange={handleInputChange}
                placeholder="Confirm password"
                className="w-full pl-12 pr-12 py-[16px] bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-all outline-none text-[15px]"
                required
              />
            </div>

            {/* Location Selector */}
            <div className="pt-2 pb-2">
              <LocationSelector
                value={formData.location}
                onChange={(newLoc) => setFormData(prev => ({ ...prev, location: newLoc }))}
              />
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-[18px] mt-2 bg-[#064e3b] hover:bg-[#022c22] text-white rounded-2xl font-bold text-[15px] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Register <ArrowRight className="w-[18px] h-[18px]" /></>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-[13px] font-medium text-slate-500 mt-8 mb-4">
            Already have an account? <Link to="/login" className="text-[#064e3b] font-bold hover:underline">Sign in</Link>
          </p>

        </div>
      </div>

      {/* ── VERIFICATION OVERLAY ────────────────────────────────────── */}
      {isVerifying && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in slide-in-from-bottom-8 duration-500 ease-out">
            <button
              onClick={() => setIsVerifying(false)}
              className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-[#064e3b]/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-2 text-[#064e3b]">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Verify Phone</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">
                  Enter the 6-digit code sent to <br />
                  <span className="text-[#064e3b] font-bold">{formData.phone}</span>
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
                  className="w-full text-center text-4xl font-semibold tracking-[0.5em] py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:border-[#064e3b] outline-none transition-all placeholder:text-slate-200"
                />
                <div className="flex flex-col items-center mt-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold text-slate-400 capitalize tracking-[0.2em]">Expires in:</p>
                    <span className={`text-sm font-bold tracking-widest ${timeLeft < 60 ? 'text-rose-500' : 'text-[#064e3b]'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={timeLeft > 0}
                    onClick={handleResendOTP}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold capitalize tracking-widest transition-all ${timeLeft > 0
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
                      : 'bg-[#064e3b]/10 text-[#064e3b] hover:bg-[#064e3b]/20 cursor-pointer'
                      }`}
                  >
                    Resend Code
                  </button>
                </div>
              </div>

              <button
                onClick={handleFinalSubmit}
                disabled={isLoading || formData.otp.length < 6}
                className="w-full py-4 bg-[#064e3b] text-white rounded-2xl font-bold text-[13px] capitalize tracking-[0.2em] shadow-xl shadow-[#064e3b]/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
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
