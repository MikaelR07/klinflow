import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Recycle, User, Phone, Lock, ChevronRight, MapPin, 
  Loader2, ArrowLeft, ShieldCheck, Mail, Sparkles, Star,
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



  return (
    <div className="flex flex-col justify-center min-h-dvh max-w-lg mx-auto px-6 py-10 relative overflow-hidden">
      {/* Background Decor (Matched to Welcome Page) */}
      <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[20%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="max-w-md w-full mx-auto relative z-10 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-full flex items-center justify-between mb-6">
            <Link to="/login" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>

        <div className="mb-10 text-center sm:text-left">
          <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
             <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tighter">
               {formData.role === 'seller' ? 'Seller Enrollment' : 'Join the Ecosystem'}
             </h1>
             {formData.role === 'seller' && (
               <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                 <span className="text-xs font-semibold text-blue-500 uppercase tracking-widest">Pro Mode</span>
               </div>
             )}
          </div>
          <p className={`text-xs ${formData.role === 'seller' ? 'text-blue-500' : 'text-emerald-500'} font-semibold uppercase tracking-widest flex items-center gap-2 justify-center sm:justify-start`}>
             <Sparkles className="w-3 h-3" /> {formData.role === 'seller' ? 'Trade Waste as a High-Value Asset' : 'Convenience & Community Rewards'}
          </p>
        </div>

        {/* Global Registration Form */}
        <form onSubmit={initiateRegistration} className="space-y-6">
          
          {/* Section 1: Identity */}
          <div className="glass p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Personal Identification</h3>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="Full Legal Name" 
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-4 text-base focus:ring-primary/10 focus:border-primary outline-none transition-all" 
                  required 
                />
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  placeholder="Email Address" 
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-4 text-base focus:ring-primary/10 focus:border-primary outline-none transition-all" 
                  required 
                />
              </div>

              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  placeholder="Phone Number (07... / 01...)" 
                  className={`w-full pl-11 pr-12 py-3.5 bg-white dark:bg-slate-900 border rounded-2xl text-sm font-semibold tracking-widest focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all ${
                    phoneAvailable === false ? 'border-rose-300 ring-rose-100' : 'border-slate-200 dark:border-slate-800'
                  }`} 
                  required 
                />
                {phoneAvailable === true && (
                  <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 animate-in fade-in zoom-in" />
                )}
              </div>
            </div>
          </div>



          {/* Section 1.5: Gender Identity */}
          <div className="glass p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-5 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Personal Identification</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'male', label: 'Male', icon: Mars, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { id: 'female', label: 'Female', icon: Venus, color: 'text-rose-500', bg: 'bg-rose-500/10' }
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, gender: g.id }))}
                  className={`flex items-center justify-center gap-3 p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                    formData.gender === g.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl ${g.bg} flex items-center justify-center`}>
                    <g.icon className={`w-4 h-4 ${g.color}`} />
                  </div>
                  <span className={`text-[11px] font-semibold uppercase tracking-widest ${formData.gender === g.id ? 'text-primary' : 'text-slate-400'}`}>
                    {g.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Security */}
          <div className="glass p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Security Vault</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  name="pin" 
                  value={formData.pin} 
                  onChange={handleInputChange} 
                  placeholder="Passcode" 
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-4 text-base focus:ring-primary/10 focus:border-primary outline-none transition-all" 
                  required 
                />
              </div>
              <div className="relative group">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  name="confirmPin" 
                  value={formData.confirmPin} 
                  onChange={handleInputChange} 
                  placeholder="Confirm" 
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-4 text-base focus:ring-primary/10 focus:border-primary outline-none transition-all" 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Location */}
          <div className="glass p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              </div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Location Area</h3>
            </div>

            <div className="min-h-[140px]">
              <LocationSelector 
                value={formData.location} 
                onChange={(newLoc) => setFormData(prev => ({ ...prev, location: newLoc }))} 
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-gradient-to-r from-primary to-green-600 text-white rounded-[1.5rem] font-semibold text-[13px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:shadow-primary/40 active:scale-[0.98] transition-all flex justify-center items-center gap-3 disabled:opacity-50 mt-4 group"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Initiate Protocol <Sparkles className="w-5 h-5 group-hover:animate-spin" /></>}
          </button>
        </form>

        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mt-10">
          Already part of the network? {' '}
          <Link to="/login" className="text-primary hover:underline underline-offset-4">Authenticate Instead</Link>
        </p>
      </div>

      {/* ── VERIFICATION OVERLAY ────────────────────────────────────── */}
      {isVerifying && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in slide-in-from-bottom-8 duration-500 ease-out">
            <button 
              onClick={() => setIsVerifying(false)}
              className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-6">
              <div className="w-56 h-auto bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-2 text-primary">
                <ShieldCheck className="w-10 h-10" />
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Verify Phone</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">
                  Enter the 6-digit code sent to <br />
                  <span className="text-primary font-semibold tracking-widest">{formData.phone}</span>
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
                  className="w-full text-center text-4xl font-semibold tracking-[0.5em] py-5 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:border-primary outline-none transition-all placeholder:text-slate-200" 
                />
                <div className="flex flex-col items-center mt-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">Code sent via SMS to your phone</p>
                  <button 
                    type="button"
                    onClick={async () => {
                      try {
                        await sendOtp(formData.phone);
                        toast.success('Code Resent', { description: 'A new OTP has been sent to your phone.' });
                      } catch (err) {
                        toast.error('Resend Failed', { description: err instanceof Error ? err.message : 'Unknown error' });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary rounded-full text-xs font-semibold uppercase tracking-widest transition-all"
                  >
                    Resend Code
                  </button>
                </div>
              </div>

              <button
                onClick={handleFinalSubmit}
                disabled={isLoading || formData.otp.length < 6}
                className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-semibold text-[13px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply Protocol'}
              </button>
              

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
