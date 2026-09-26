import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { User, Phone, Lock, Hash, Loader2, ArrowLeft, ArrowRight, ShieldCheck, Briefcase, Mail, X, UserCheck, Truck, Zap, Clock, TrendingUp, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import LocationSelector from '@klinflow/ui/components/LocationSelector';

export default function Register() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || location.state?.accountType || 'independent';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    otp: '',
    pin: '',
    confirmPin: '',
    role: ROLES.AGENT,
    location: null,
    idNumber: '',
    agent_account_type: initialType,
    fleet_invite_code: '',
    company_name: '',
    gender: '',
    documents: {} as Record<string, File>
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);
  const [companyDocs, setCompanyDocs] = useState<string[]>([]);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(600);
  const [imageLoaded, setImageLoaded] = useState(false);

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

  // ── OTP TIMER LOGIC ──────────────────────────────────────────────
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

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'name') {
      const clean = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: clean }));
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

    if (name === 'fleet_invite_code') {
      const upper = value.toUpperCase();
      setFormData(prev => ({ ...prev, fleet_invite_code: upper }));
      if (upper.length >= 5) {
        verifyInviteCode(upper);
      } else {
        setCompanyDocs([]);
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const verifyInviteCode = async (code: string) => {
    setIsCheckingCode(true);
    try {
      const { supabase } = await import('@klinflow/supabase');
      const { data, error } = await supabase
        .from('profiles')
        .select('required_documents')
        .eq('fleet_invite_code', code)
        .single();

      if (!error && data) {
        setCompanyDocs((data.required_documents as string[]) || []);
      } else {
        setCompanyDocs([]);
      }
    } catch (err) {
      setCompanyDocs([]);
    } finally {
      setIsCheckingCode(false);
    }
  };

  const handleFileUpload = (docName: string, file: File | null) => {
    if (!file) {
      const newDocs = { ...formData.documents };
      delete newDocs[docName];
      setFormData(prev => ({ ...prev, documents: newDocs }));
      return;
    }

    if (file.size > 5242880) {
      toast.error('File too large', { description: 'Please upload a file smaller than 5MB.' });
      return;
    }

    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, [docName]: file }
    }));
  };

  const handleNextStep = () => {
    const nameParts = formData.name.trim().split(/\s+/);
    if (nameParts.length < 2) return toast.error('Incomplete Name', { description: 'Please provide at least a First and Last name.' });
    if (!formData.email) return toast.error('Field Missing', { description: 'Please provide an email address.' });
    if (formData.phone.length !== 10) return toast.error('Format Error', { description: 'Phone must be exactly 10 digits.' });
    if (phoneAvailable === false) return toast.error('Blocked', { description: 'This number is already registered.' });
    if (formData.idNumber.length !== 8) return toast.error('Field Error', { description: 'National ID must be exactly 8 characters.' });
    if (!formData.gender) return toast.error('Field Missing', { description: 'Please select your gender.' });
    setCurrentStep(2);
  };

  const initiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.pin.length < 8) return toast.error('Security Risk', { description: 'Passcode must be at least 8 characters.' });
    if (formData.pin !== formData.confirmPin) return toast.error('Match Error', { description: 'Passcodes do not match.' });
    if (!formData.location?.estate) return toast.error('Field Missing', { description: 'Please select your operating location.' });

    if (formData.agent_account_type === 'fleet_driver' && formData.fleet_invite_code.trim().length < 5) return toast.error('Missing Code', { description: 'Please enter a valid Company Invite Code.' });

    if (formData.agent_account_type === 'fleet_driver' && companyDocs.length > 0) {
      const missingDocs = companyDocs.filter(doc => !formData.documents[doc]);
      if (missingDocs.length > 0) {
        return toast.error('Missing Documents', { description: `Please upload: ${missingDocs.join(', ')}` });
      }
    }

    setIsLoading(true);
    try {
      await sendOtp(formData.phone);
      setIsVerifying(true);
      toast.success('Code Sent!', { description: `A 6-digit OTP has been sent to ${formData.phone}` });
    } catch (err: any) {
      toast.error('SMS Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    try {
      await verifyOtp(formData.phone, formData.otp);
      await register(formData);
      toast.success('Agent Account Activated!', { description: 'Your identity has been verified. Welcome to the network.' });
      navigate('/', { replace: true });
    } catch (err: any) {
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

  const handleResendOTP = async () => {
    if (timeLeft > 0) return;
    try {
      await sendOtp(formData.phone);
      setTimeLeft(600);
      toast.success('Code Resent', { description: 'A new OTP has been sent to your phone.' });
    } catch (err: any) {
      toast.error('Resend Failed', { description: err.message });
    }
  };

  const roleTabs = [
    { id: 'independent', label: 'Individual Agent', icon: UserCheck },
    { id: 'fleet_driver', label: 'Fleet Agent', sublabel: '(Under Company)', icon: Truck },
  ];

  return (
    <div className="flex flex-col bg-white sm:bg-slate-100 min-h-[100dvh] relative overflow-hidden font-sans">
      <div className="flex-1 flex flex-col w-full max-w-lg mx-auto relative shadow-2xl overflow-hidden bg-white">

        {/* Fixed Background Image */}
        <div className={`absolute top-0 left-0 right-0 h-[50vh] pointer-events-none z-0 ${!imageLoaded ? 'bg-emerald-900/10 animate-pulse' : ''}`}>
          <img
            src="/welcome/agentRegister.webp"
            alt="Create your account"
            className={`w-full h-full object-cover object-top transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            draggable={false}
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Back Button (floating over image) */}
        <div className="absolute top-0 left-0 right-0 z-50 px-5 pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)]">
          <button
            onClick={() => currentStep === 2 ? setCurrentStep(1) : navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-slate-600  transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Foreground */}
        <div className="flex-1 w-full relative z-10 overflow-y-auto overflow-x-hidden flex flex-col">
          <div className="flex-1 flex flex-col px-6 pt-8 pb-8 bg-white rounded-t-3xl mt-[35vh] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">

            {/* Role Selection Tabs */}
            <div className="flex bg-slate-200 rounded-2xl p-1.5 mb-6">
              {roleTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, agent_account_type: tab.id }));
                    // Reset fleet-specific fields when switching away
                    if (tab.id !== 'fleet_driver') {
                      setFormData(prev => ({ ...prev, fleet_invite_code: '', documents: {} }));
                      setCompanyDocs([]);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-[13px] font-bold transition-all ${
                    formData.agent_account_type === tab.id
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'text-slate-400 hover:text-slate-500'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <div className="flex flex-col items-start leading-tight">
                    <span>{tab.label}</span>
                    {tab.sublabel && <span className="text-[10px] font-medium opacity-60">{tab.sublabel}</span>}
                  </div>
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={initiateRegistration} className="space-y-2.5 flex-1">
              {currentStep === 1 ? (
                <>
                  {/* Full Name */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Full Legal Name"
                      className="w-full pl-12 pr-4 py-[16px] bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-[15px]"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email Address"
                      className="w-full pl-12 pr-4 py-[16px] bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-[15px]"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Phone Number (07XX XXX XXX)"
                      className={`w-full pl-12 pr-12 py-[16px] bg-white border rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-[15px] ${phoneAvailable === false ? 'border-rose-300 ring-rose-100' : 'border-slate-200'}`}
                      required
                    />
                    {phoneAvailable === true && (
                      <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600 animate-in fade-in zoom-in" />
                    )}
                  </div>

                  {/* National ID */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Hash className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="idNumber"
                      value={formData.idNumber}
                      onChange={handleInputChange}
                      placeholder="National ID Number"
                      minLength={8}
                      maxLength={8}
                      className="w-full pl-12 pr-4 py-[16px] bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-[15px]"
                      required
                    />
                  </div>

                  {/* Gender Select */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-10 py-[16px] bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-[15px] appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled hidden>Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full py-[18px] mt-4 bg-[#064e3b] hover:bg-[#022c22] text-white rounded-2xl font-bold text-[15px] transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                  >
                    Continue <ArrowRight className="w-[18px] h-[18px]" />
                  </button>
                </>
              ) : (
                <>
                  {/* Passcode */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="password"
                      name="pin"
                      value={formData.pin}
                      onChange={handleInputChange}
                      placeholder="Password (Min 8 characters)"
                      className="w-full pl-12 pr-4 py-[16px] bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-[15px]"
                      required
                    />
                  </div>

                  {/* Confirm Passcode */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="password"
                      name="confirmPin"
                      value={formData.confirmPin}
                      onChange={handleInputChange}
                      placeholder="Confirm Password"
                      className="w-full pl-12 pr-4 py-[16px] bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-[15px]"
                      required
                    />
                  </div>

                  {/* Fleet Invite Code (only for fleet_driver) */}
                  {formData.agent_account_type === 'fleet_driver' && (
                    <div className="pt-1 space-y-3">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Briefcase className="h-[18px] w-[18px] text-emerald-600" />
                        </div>
                        <input
                          type="text"
                          name="fleet_invite_code"
                          value={formData.fleet_invite_code}
                          onChange={handleInputChange}
                          placeholder="Company Invite Code (e.g. CF-XXXX)"
                          className="w-full pl-12 pr-12 py-[16px] bg-emerald-50/50 border border-emerald-200 rounded-2xl text-slate-900 font-bold placeholder:text-emerald-700/40 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-[15px] uppercase tracking-widest"
                          required
                        />
                        {isCheckingCode && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-emerald-500" />}
                      </div>

                      {companyDocs.length > 0 && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-4">
                          <h3 className="text-[11px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Required Documents
                          </h3>
                          <div className="space-y-3">
                            {companyDocs.map(doc => (
                              <div key={doc} className="bg-white border border-emerald-100 rounded-xl p-3">
                                <label className="block text-[11px] font-bold text-slate-700 mb-2">{doc}</label>
                                <input
                                  type="file"
                                  accept="image/jpeg, image/png, application/pdf"
                                  onChange={(e) => handleFileUpload(doc, e.target.files?.[0] || null)}
                                  className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
                                  required
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Location Selector */}
                  <div className="pt-2 pb-2">
                    <LocationSelector
                      value={formData.location}
                      onChange={(newLoc) => setFormData(prev => ({ ...prev, location: newLoc }))}
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="w-[60px] shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl flex items-center justify-center transition-colors py-[18px]"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-[18px] bg-[#064e3b] hover:bg-[#022c22] text-white rounded-2xl font-bold text-[15px] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Registration'}
                    </button>
                  </div>
                </>
              )}
            </form>

            {/* Footer Link */}
            <p className="text-center text-[13px] font-medium text-slate-500 mt-6 mb-2">
              Already have an account? <Link to="/login" className="text-[#064e3b] font-bold hover:underline">Sign In</Link>
            </p>


          </div>
        </div>
      </div>

      {/* ── VERIFICATION OVERLAY ────────────────────────────────────── */}
      {isVerifying && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-white rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in slide-in-from-bottom-8 duration-500 ease-out">
            <button
              onClick={() => setIsVerifying(false)}
              className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-2 text-emerald-600">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-900">Verify Phone</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">
                  Enter the 6-digit code sent to <br />
                  <span className="text-emerald-600 font-bold">{formData.phone}</span>
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
                  className="w-full text-center text-4xl font-semibold tracking-[0.5em] py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-600 outline-none transition-all placeholder:text-slate-300"
                />
                <div className="flex flex-col items-center mt-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold text-slate-400 capitalize tracking-[0.2em]">Expires in:</p>
                    <span className={`text-sm font-bold tracking-widest ${timeLeft < 60 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={timeLeft > 0}
                    onClick={handleResendOTP}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold capitalize tracking-widest transition-all ${timeLeft > 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer'
                      }`}
                  >
                    Resend Code
                  </button>
                </div>
              </div>

              <button
                onClick={handleFinalSubmit}
                disabled={isLoading || formData.otp.length < 6}
                className="w-full py-4 bg-[#064e3b] text-white rounded-2xl font-bold text-[13px] capitalize tracking-[0.2em] shadow-xl shadow-[#064e3b]/20 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
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
