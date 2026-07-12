import React, { useState } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Truck,
  BarChart3,
  Wallet,
  Package,
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

export default function HubLanding() {
  const { login } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side validation
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      setLoading(false);
      return;
    }
    if (!pin.trim()) {
      setError('Please enter your security PIN.');
      setLoading(false);
      return;
    }
    if (pin.length < 4) {
      setError('PIN must be at least 4 characters.');
      setLoading(false);
      return;
    }

    try {
      await login(phone, pin);
      // After login, check if user has a Hub company
      const state = useAuthStore.getState() as any;
      if (!state.currentCompanyId) {
        await state.logout();
        setError('Access denied. Your account is not linked to any Hub organization. Contact your company administrator.');
        return;
      }
      toast.success('Welcome back!', { description: 'Signed in successfully.' });
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Truck, label: 'Fleet Management' },
    { icon: Package, label: 'Inventory Control' },
    { icon: BarChart3, label: 'Real-time Analytics' },
    { icon: Wallet, label: 'Automated Payouts' },
  ];

  return (
    <div className="min-h-screen font-sans selection:bg-emerald-500/20 relative overflow-hidden bg-white dark:bg-slate-900">
      <Toaster position="top-center" richColors closeButton duration={4000} />

      {/* ── SLANTED GREEN BACKGROUND ── */}
      <div 
        className="hidden lg:block absolute inset-y-0 left-0 w-[60%] bg-gradient-to-br from-emerald-600 to-emerald-800  z-0 shadow-2xl"
        style={{ clipPath: 'polygon(0 0, 100% 0, 74% 100%, 0% 100%)' }}
      />

      {/* ── MOBILE GREEN BG (no slant) ── */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-[420px] bg-gradient-to-br from-emerald-600 to-emerald-800  z-0" />

      {/* ── Grid overlay on right side (desktop) ── */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-[50%] z-0 opacity-[0.5] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />

      {/* ── CONTENT WRAPPER ── */}
      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">

        {/* ── LEFT SIDE — Brand & Info ── */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between px-8 md:px-16 lg:px-20 xl:px-24 py-12 lg:py-16">
          
          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Top badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-emerald-400 border border-emerald-400 rounded-full mb-8 self-start backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-100" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Enterprise Operations Platform</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold text-white tracking-tight leading-[1.05] mb-6">
              Klinflow Hub
              <span className="block text-emerald-300 mt-1">Material Operating System</span>
            </h1>
            
            {/* Description */}
            <p className="text-base lg:text-lg text-emerald-50 font-medium leading-relaxed max-w-lg mb-10">
              The unified command center for all your recycling operations. Manage your fleet, Material Intake, control inventory, automate financial payouts, and monitor real-time performance — all from a single platform.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {features.map((f, i) => (
                <div key={i} className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/[0.3] border border-white/[0.08] rounded-lg backdrop-blur-sm">
                  <f.icon className="w-3.5 h-3.5 text-emerald-50" />
                  <span className="text-xs font-semibold text-emerald-50">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Logo + footer at bottom */}
          <div className="flex items-end justify-between mt-10  border-t border-white/[0.08]">
            <img
              src="/app-logo.webp"
              alt="Klinflow"
              className="w-24 md:w-32 lg:w-36 opacity-90 select-none"
              draggable={false}
            />
            <div className="text-right">
              <span className="block text-[10px] font-semibold text-emerald-200/40 uppercase tracking-widest">
                © 2026 Klinflow Systems
              </span>
              <span className="block text-[10px] font-semibold text-emerald-200/30 uppercase tracking-widest mt-1">
                v1.0.0 · Enterprise Access
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDE — Login Form ── */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 lg:px-16 xl:px-20 py-12 lg:py-0 relative">

        <div className="w-full max-w-md relative z-10">
          
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Sign In</h2>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Authorized personnel only</p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-start gap-3 px-4 py-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl animate-[fadeIn_0.2s_ease-out]">
              <AlertCircle className="w-4.5 h-4.5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300 leading-relaxed">{error}</p>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError(''); }}
                placeholder="+254 712 345 678"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
                required
                disabled={loading}
              />
            </div>
            
            {/* PIN */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">
                Security PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={e => { setPin(e.target.value); setError(''); }}
                  placeholder="Enter your PIN"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 pr-12 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed "
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          
          {/* Bottom help */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-center text-sm text-slate-400 dark:text-slate-500 font-medium">
              Can't access your account?{' '}
              <span className="text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline font-semibold">
                Contact Support
              </span>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
