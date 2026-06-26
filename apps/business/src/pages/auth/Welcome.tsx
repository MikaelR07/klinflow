import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Globe, Zap, Sparkles } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col p-6 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center relative z-10">

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 mb-6 w-fit animate-bounce-slow">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Africa's #1 B2B Waste Exchange</span>
        </div>

        <h1 className="text-5xl font-semibold text-slate-900 dark:text-white leading-[0.95] mb-6 tracking-tighter">
          The Marketplace for <br />
          <span className="text-primary italic">Verified</span> Recyclables.
        </h1>

        <p className="text-lg text-slate-800 dark:text-slate-400 font-medium max-w-sm mb-8 leading-relaxed">
          Klinflow connects verified collectors with industrial recyclers through secure, escrow-backed trades.
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 gap-4 mb-10">
          {[
            { icon: ShieldCheck, title: 'Escrow Protection', desc: 'Secure payments released only on delivery.' },
            { icon: Globe, title: 'Digital Assets', desc: 'Every ton is photographed and graded.' },
            { icon: Zap, title: 'Instant Payouts', desc: 'Direct to M-Pesa once delivery is confirmed.' }
          ].map((feat, idx) => (
            <div key={idx} className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <feat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{feat.title}</p>
                <p className="text-xs text-slate-800 dark:text-slate-400">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="relative z-10 pb-8 space-y-4">
        <button
          onClick={() => navigate('/roles')}
          className="w-full py-5 bg-primary text-white rounded-3xl font-semibold text-base shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          Get Started <ArrowRight className="w-5 h-5" />
        </button>
        
        <p className="text-center text-sm text-slate-700 font-medium">
          Already have a business account? <span onClick={() => navigate('/login')} className="text-primary font-semibold cursor-pointer">Log In</span>
        </p>
      </div>
    </div>
  );
}
