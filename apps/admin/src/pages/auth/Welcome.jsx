import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, BarChart3, Globe, Sparkles } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-6 overflow-hidden relative text-white">
      {/* Background Decor */}
      <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[20%] right-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center relative z-10 max-w-md mx-auto w-full">

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 mb-6 w-fit backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-widest">Admin Command Center</span>
        </div>

        <h1 className="text-5xl font-semibold text-white leading-[0.95] mb-6 tracking-tighter">
          CleanFlow <br />
          <span className="text-primary italic">Lead Admin.</span>
        </h1>

        <p className="text-lg text-slate-400 font-medium mb-10 leading-relaxed">
          Monitor the circular economy, manage the agent fleet, and optimize city-wide waste logistics in real-time.
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 gap-6 mb-10">
          {[
            { icon: BarChart3, title: 'Network Analytics', desc: 'Real-time revenue and waste tracking.' },
            { icon: ShieldCheck, title: 'Fleet Control', desc: 'Verify agents and monitor live missions.' },
            { icon: Globe, title: 'Impact Map', desc: 'Geospatial visualization of city health.' }
          ].map((feat, idx) => (
            <div key={idx} className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-2xl shadow-primary/20">
                <feat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{feat.title}</p>
                <p className="text-xs text-slate-500 font-medium">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="relative z-10 pb-8 space-y-4 max-w-md mx-auto w-full">
        <button
          onClick={() => navigate('/login')}
          className="w-full py-5 bg-white text-slate-900 rounded-3xl font-semibold text-base shadow-2xl shadow-white/10 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          Enter Command Center <ArrowRight className="w-5 h-5" />
        </button>
        
        <p className="text-center text-xs text-slate-600 font-semibold uppercase tracking-[0.2em] pt-4">
          Restricted Access • Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
