import React, { useState } from 'react';
import { 
  BarChart3, 
  Truck, 
  ShieldCheck, 
  Globe2, 
  ArrowRight, 
  Zap, 
  Building2, 
  Users,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core';
import { toast } from 'sonner';

export default function HubLanding() {
  const { profile, login } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(phone, pin);
      toast.success("Authentication successful");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans selection:bg-primary/20">
      
      {/* ── LOGIN MODAL ── */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden animate-slide-up relative">
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Globe2 className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2">Hub Access</h2>
              <p className="text-xs font-semibold text-slate-500 mb-8 uppercase tracking-widest">Authorized personnel only</p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +254712345678"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Security PIN</label>
                  <input
                    type="password"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-4 bg-primary text-white rounded-xl font-semibold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP NAV ── */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-slate-200/50 dark:border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
             <Globe2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tighter text-slate-900 dark:text-white">Klinflow <span className="text-primary">Hub</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowLogin(true)}
            className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-semibold uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Terminal Access Login
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-8">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Enterprise OS for Circular Economy</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold text-slate-900 dark:text-white tracking-tighter leading-[0.9] mb-8">
            Manage your Fleet <br/> <span className="text-primary">& Hub Terminal.</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            The professional operating system for waste management companies. Connect with your fleet, manage inventory in real-time, and automate your financial payouts.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setShowLogin(true)}
              className="w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-2xl text-sm font-semibold uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              Access Hub Terminal <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── METRICS PREVIEW ── */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
              <Truck className="w-20 h-20" />
            </div>
            <div className="relative z-10">
               <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                 <Truck className="w-6 h-6 text-blue-600" />
               </div>
               <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 tracking-tight">Fleet Automation</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                 Dispatch missions to your drivers instantly via the Klinflow Agent App. Track every truck in real-time on our Live Radar.
               </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-20 h-20" />
            </div>
            <div className="relative z-10">
               <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                 <TrendingUp className="w-6 h-6 text-emerald-600" />
               </div>
               <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 tracking-tight">Financial Clearing</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                 Instant payouts to M-Pesa. Klinflow handles the escrow, platform fees, and direct-to-admin payouts automatically.
               </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-20 h-20" />
            </div>
            <div className="relative z-10">
               <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
                 <ShieldCheck className="w-6 h-6 text-indigo-600" />
               </div>
               <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 tracking-tight">Verified Logistics</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                 Weight-based verification with photos and GPS logs. Build trust with residents through transparent ratings and NEMA compliance.
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="px-6 pb-32">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
           <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tighter mb-6">Ready to scale your <br/> waste operations?</h2>
              <p className="text-slate-400 font-medium mb-10 max-w-xl mx-auto">
                Authorized company owners and hub managers can log in to access their facility's secure terminal.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => setShowLogin(true)}
                  className="w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-2xl text-sm font-semibold uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  Log In to Hub Terminal <ArrowRight className="w-5 h-5" />
                </button>
              </div>
           </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-10 border-t border-slate-200 dark:border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Klinflow Operating System © 2026</span>
          </div>
          <div className="flex items-center gap-8">
            <button className="text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Privacy</button>
            <button className="text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Terms</button>
            <button className="text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Contact</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
