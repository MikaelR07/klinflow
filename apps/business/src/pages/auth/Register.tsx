import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Store, User, Phone, Lock, Loader2, ArrowLeft,
  ShieldCheck, Shield, Sparkles, Building2, X, Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import LocationSelector from '@klinflow/ui/components/LocationSelector';

const BUSINESS_TYPES = [
  { id: 'weaver', label: '🧺 Informal Weaver' },
  { id: 'recycler', label: '♻️ Recycling Firm' },
  { id: 'manufacturer', label: '🏭 Manufacturer' },
  { id: 'retailer', label: '🛒 Retailer / Importer' },
  { id: 'ngo', label: '🌿 NGO / CBO' },
  { id: 'other', label: '🏢 Other' },
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('role') || '';

  const [formData, setFormData] = useState({
    name: '',           // Contact person name
    businessName: '',   // Company name
    businessType: initialType,   // Type of business
    phone: '',
    otp: '',
    pin: '',
    confirmPin: '',
    role: ROLES.BUSINESS,
    location: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState(null);

  const navigate = useNavigate();
  const { register, checkAvailability, sendOtp, verifyOtp } = useAuthStore();

  // ── WEB OTP AUTO-LISTENER ─────────────────────────────────────────
  useEffect(() => {
    if (!isVerifying) return;
    if ('OTPCredential' in window) {
      const ac = new AbortController();
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: ac.signal
      }).then(otp => {
        setFormData(prev => ({ ...prev, otp: otp.code }));
        toast.success('OTP Received', { description: 'Code auto-filled from SMS.' });
      }).catch(() => {});
      return () => ac.abort();
    }
  }, [isVerifying]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/[^a-zA-Z\s]/g, '') }));
      return;
    }
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

  const initiateRegistration = (e) => {
    e.preventDefault();

    const nameParts = formData.name.trim().split(/\s+/);
    if (nameParts.length < 2) return toast.error('Incomplete Name', { description: 'Please provide a first and last name.' });
    if (!formData.businessName.trim()) return toast.error('Missing Business Name', { description: 'Please enter your company or trading name.' });
    if (!formData.businessType) return toast.error('Missing Business Type', { description: 'Please select your business category.' });
    if (formData.phone.length !== 10) return toast.error('Format Error', { description: 'Phone must be exactly 10 digits.' });
    if (phoneAvailable === false) return toast.error('Blocked', { description: 'This number is already registered.' });
    if (formData.pin.length < 8) return toast.error('Security Risk', { description: 'Passcode must be at least 8 characters.' });
    if (formData.pin !== formData.confirmPin) return toast.error('Match Error', { description: 'Passcodes do not match.' });
    if (!formData.location?.estate) return toast.error('Field Missing', { description: 'Please select your business operation area.' });

    // Send real OTP via Africa's Talking
    setIsLoading(true);
    sendOtp(formData.phone)
      .then(() => {
        setIsVerifying(true);
        toast.success('Code Sent!', { description: `A 6-digit OTP has been sent to ${formData.phone}` });
      })
      .catch((err) => {
        toast.error('SMS Failed', { description: err.message });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    try {
      await verifyOtp(formData.phone, formData.otp);
      // Pass businessName & type inside the name field (or extend as needed)
      await register({
        ...formData,
        role: ROLES.BUSINESS,
        name: formData.name, // Contact person
        businessType: formData.businessType, // Weaver vs Industrial
        specializations: formData.specializations || []
      });
      toast.success('Business Activated', { description: 'Your marketplace account is live.' });
      navigate('/', { replace: true });
    } catch (err) {
      toast.error('Verification Failed', { description: err.message });
      if (err.message.includes('Incorrect') || err.message.includes('expired')) {
        setFormData(prev => ({ ...prev, otp: '' }));
      } else {
        setIsVerifying(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12 relative overflow-x-hidden transition-colors duration-500">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full mx-auto relative z-10 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-full flex items-center justify-between mb-6">
            <Link to="/login" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-700 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>

        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tighter">Join the Marketplace</h1>
          <p className="text-xs text-slate-800 font-semibold uppercase tracking-widest mt-2">Business Registration • Kenya's B2B Recycling Network</p>
        </div>

        <form onSubmit={initiateRegistration} className="space-y-6">

          {/* ── SECTION 1: Business Identity ───────────────────────── */}
          <div className="glass p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Business Identity</h3>
            </div>

            {/* Business Name */}
            <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Company / Trading Name"
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-4 text-base focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white"
                required
              />
            </div>

            {/* Contact Person Name */}
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Contact Person (Full Name)"
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-4 text-base focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white"
                required
              />
            </div>

            {/* Business Type Selector */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-700 mb-2">Business Category</p>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_TYPES.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, businessType: type.id, specializations: [] }))}
                    className={`px-3 py-2.5 rounded-xl text-[11px] font-semibold text-left transition-all border ${
                      formData.businessType === type.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-400 hover:border-indigo-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weaver Specializations (Conditional) */}
            {formData.businessType === 'weaver' && (
              <div className="animate-in slide-in-from-top-4 duration-300 space-y-3 pt-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Weaver Specializations</p>
                <div className="flex flex-wrap gap-2">
                  {['PET', 'HDPE', 'Metal', 'Paper', 'Glass', 'E-Waste'].map(spec => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => {
                        const current = formData.specializations || [];
                        const next = current.includes(spec) 
                          ? current.filter(s => s !== spec) 
                          : [...current, spec];
                        setFormData(prev => ({ ...prev, specializations: next }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        formData.specializations?.includes(spec)
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 2: Contact Details ─────────────────────────── */}
          <div className="glass p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              </div>
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Contact & Security</h3>
            </div>

            {/* Phone */}
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone Number (07... / 01...)"
                className={`w-full pl-11 pr-12 py-3.5 bg-white dark:bg-slate-900 border rounded-2xl text-sm font-semibold tracking-widest focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white ${
                  phoneAvailable === false ? 'border-rose-300 ring-rose-100' : 'border-slate-200 dark:border-slate-800'
                }`}
                required
              />
              {phoneAvailable === true && (
                <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 animate-in fade-in zoom-in" />
              )}
            </div>

            {/* Passcode */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="password"
                  name="pin"
                  value={formData.pin}
                  onChange={handleInputChange}
                  placeholder="Passcode"
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-4 text-base focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  required
                />
              </div>
              <div className="relative group">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="password"
                  name="confirmPin"
                  value={formData.confirmPin}
                  onChange={handleInputChange}
                  placeholder="Confirm"
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-4 text-base focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* ── SECTION 3: Operation Area ──────────────────────────── */}
          <div className="glass p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              </div>
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Operation Area</h3>
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
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[1.5rem] font-semibold text-[13px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all flex justify-center items-center gap-3 mt-4 group"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Activate Business Account <Sparkles className="w-5 h-5 group-hover:animate-spin" /></>}
          </button>
        </form>

        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-700 mt-10">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline underline-offset-4">Sign In Instead</Link>
        </p>
      </div>

      {/* ── OTP VERIFICATION OVERLAY ─────────────────────────────────── */}
      {isVerifying && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in slide-in-from-bottom-8 duration-500 ease-out">
            <button
              onClick={() => setIsVerifying(false)}
              className="absolute right-6 top-6 p-2 rounded-full hover:bg-white shadow-sm dark:hover:bg-slate-800 text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-6">
              <div className="w-56 h-auto bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-indigo-600">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Verify Phone</h3>
                <p className="text-sm text-slate-800 font-medium mt-2">
                  Enter the 6-digit code sent to <br />
                  <span className="text-indigo-600 font-semibold tracking-widest">{formData.phone}</span>
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
                  className="w-full text-center text-4xl font-semibold tracking-[0.5em] py-5 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500"
                />
                <div className="flex flex-col items-center mt-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-[0.2em]">Code sent via SMS to your phone</p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await sendOtp(formData.phone);
                        toast.success('Code Resent', { description: 'A new OTP has been sent to your phone.' });
                      } catch (err) {
                        toast.error('Resend Failed', { description: err.message });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 rounded-full text-xs font-semibold uppercase tracking-widest transition-all"
                  >
                    Resend Code
                  </button>
                </div>
              </div>

              <button
                onClick={handleFinalSubmit}
                disabled={isLoading || formData.otp.length < 6}
                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[1.5rem] font-semibold text-[13px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activate Account'}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
