import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Recycle, User, Phone, Lock, Hash, Loader2, ArrowLeft, ShieldCheck, Briefcase, Mail, Venus, Mars } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore, ROLES } from '@cleanflow/core';
import LocationSelector from '@cleanflow/ui/components/LocationSelector';

export default function Register() {
  const location = useLocation();
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
    agent_account_type: location.state?.accountType || 'independent',
    fleet_invite_code: '',
    company_name: '',
    gender: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState(null);
  const navigate = useNavigate();
  const { register, checkAvailability, sendOtp, verifyOtp } = useAuthStore();

  // ── WEB OTP API LISTENER ──────────────────────────────────────────
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
      }).catch(err => {
        console.log('Web OTP listener closed:', err);
      });
      return () => ac.abort();
    }
  }, [isVerifying]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    // 1. Full Name Validation (Alpha-only + space)
    if (name === 'name') {
      const clean = value.replace(/[^a-zA-Z\s]/g, ''); 
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

  const initiateRegistration = async (e) => {
    e.preventDefault();

    // ── STRICT VALIDATION GATE ──
    const nameParts = formData.name.trim().split(/\s+/);
    if (nameParts.length < 2) return toast.error('Incomplete Name', { description: 'Please provide at least a First and Last name.' });
    if (formData.phone.length !== 10) return toast.error('Format Error', { description: 'Phone must be exactly 10 digits.' });
    if (phoneAvailable === false) return toast.error('Blocked', { description: 'This number is already registered.' });
    if (formData.pin.length < 8) return toast.error('Security Risk', { description: 'Passcode must be at least 8 characters.' });
    if (formData.pin !== formData.confirmPin) return toast.error('Match Error', { description: 'Passcodes do not match.' });
    if (!formData.location?.estate) return toast.error('Field Missing', { description: 'Please select your operating location.' });
    if (formData.idNumber.length !== 8) return toast.error('Field Error', { description: 'National ID must be exactly 8 characters.' });
    if ((formData.agent_account_type === 'independent' || formData.agent_account_type === 'fleet_driver') && !formData.gender) return toast.error('Field Missing', { description: 'Please select your gender.' });
    if (formData.agent_account_type === 'fleet_driver' && formData.fleet_invite_code.trim().length < 5) return toast.error('Missing Code', { description: 'Please enter a valid Company Invite Code.' });
    if (formData.agent_account_type === 'company_admin' && formData.company_name.trim().length < 3) return toast.error('Incomplete Business Info', { description: 'Please provide a valid Company/Business name.' });

    // Send real OTP via Africa's Talking
    setIsLoading(true);
    try {
      await sendOtp(formData.phone);
      setIsVerifying(true);
      toast.success('Code Sent!', { description: `A 6-digit OTP has been sent to ${formData.phone}` });
    } catch (err) {
      toast.error('SMS Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    try {
      // 1. Verify the OTP
      await verifyOtp(formData.phone, formData.otp);
      // 2. OTP passed — create the agent account
      await register(formData);
      toast.success('Agent Account Activated!', { description: 'Your identity has been verified. Welcome to the network.' });
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

  if (isVerifying) {
    return (
      <div className="min-h-dvh flex flex-col justify-center bg-slate-900 px-4 py-8 animate-in fade-in">
        <div className="max-w-md w-full mx-auto relative z-10 glass p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white tracking-widest uppercase">Identity Verification</h2>
            <p className="text-sm text-slate-400 mt-2">Enter the secure PIN sent to <br/><span className="text-white font-semibold">{formData.phone}</span></p>
          </div>

          <div className="space-y-6">
            <input 
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={formData.otp} 
              onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0,6) }))} 
              placeholder="0 0 0 0 0 0" 
              className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-5 text-center text-3xl font-semibold tracking-[0.5em] text-white focus:ring-4 text-base focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" 
              autoFocus
            />
            
            <button
              onClick={handleFinalSubmit}
              disabled={isLoading || formData.otp.length !== 6}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-[15px] hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Verify & Access Portal</>}
            </button>
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
              className="w-full py-3 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Resend OTP
            </button>
            <button onClick={() => setIsVerifying(false)} className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30 px-4 py-8">
      <div className="max-w-md w-full mx-auto animate-slide-up">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-full flex items-center justify-between mb-6">
            <Link to="/login" className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Agent Registration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6 font-medium">Join CleanFlow as a Green Agent and start earning.</p>
        </div>

        {/* Form */}
        <form onSubmit={initiateRegistration} className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-4">
          
          {/* Base Fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Full Legal Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="First Last" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="agent@cleanflow.co.ke" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Phone Number</label>
            <div className="relative text-slate-400 group-focus-within:text-primary transition-colors">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" />
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="07XX XXX XXX" className={`w-full pl-11 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 text-sm transition-all ${phoneAvailable === false ? 'border-rose-300 ring-rose-100' : ''}`} required />
              {phoneAvailable === true && (
                <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 animate-in fade-in" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Create PIN</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="password" name="pin" value={formData.pin} onChange={handleInputChange} placeholder="••••••••" minLength={8} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 tracking-widest text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Confirm PIN</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="password" name="confirmPin" value={formData.confirmPin} onChange={handleInputChange} placeholder="••••••••" minLength={8} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 tracking-widest text-sm" required />
              </div>
            </div>
          </div>

          {/* Conditional Agent Fields */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-slide-up">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">National ID Number</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="text" name="idNumber" value={formData.idNumber} onChange={handleInputChange} placeholder="12345678" minLength={8} maxLength={8} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-secondary/50 text-sm tracking-widest" required />
              </div>
            </div>
 
            {formData.agent_account_type === 'company_admin' && (
              <div className="pt-2 animate-slide-up">
                <label className="block text-xs font-semibold text-primary dark:text-blue-400 mb-1.5 uppercase tracking-wider">Company / Business Name</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleInputChange} placeholder="e.g. Nairobi Green Fleets" className="w-full pl-11 pr-4 py-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/30 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" required />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 ml-1">This will be your brand name in the CleanFlow marketplace.</p>
              </div>
            )}

            {formData.agent_account_type === 'fleet_driver' && (
              <div className="pt-2 animate-slide-up">
                <label className="block text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1.5 uppercase tracking-wider">Company Invite Code</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
                  <input type="text" name="fleet_invite_code" value={formData.fleet_invite_code} onChange={handleInputChange} placeholder="CF-XXXXXX" className="w-full pl-11 pr-4 py-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-500/30 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-orange-500/50 text-sm tracking-widest uppercase" required />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 ml-1">Ask your Company Admin for this 6-character code.</p>
              </div>
            )}

            {(formData.agent_account_type === 'independent' || formData.agent_account_type === 'fleet_driver') && (
              <div className="pt-2 animate-slide-up">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Gender</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'male', label: 'Male', icon: Mars, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { id: 'female', label: 'Female', icon: Venus, color: 'text-rose-500', bg: 'bg-rose-500/10' }
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, gender: g.id }))}
                      className={`flex items-center justify-center gap-3 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                        formData.gender === g.id 
                          ? 'border-secondary bg-secondary/5' 
                          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${g.bg} flex items-center justify-center`}>
                        <g.icon className={`w-4 h-4 ${g.color}`} />
                      </div>
                      <span className={`text-[11px] font-semibold uppercase tracking-widest ${formData.gender === g.id ? 'text-secondary' : 'text-slate-400'}`}>
                        {g.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location Block */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 animate-slide-up">
            <LocationSelector 
              value={formData.location} 
              onChange={(newLoc) => setFormData(prev => ({ ...prev, location: newLoc }))} 
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 mt-4 bg-secondary hover:bg-blue-700 text-white rounded-xl font-semibold text-[15px] shadow-lg shadow-secondary/30 transition-all flex justify-center items-center gap-2"
          >
            Initiate Security Check
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8 font-medium">
          Already an Agent?{' '}
          <Link to="/login" className="text-secondary font-semibold hover:underline">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
}

