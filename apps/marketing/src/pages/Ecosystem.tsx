import { motion } from 'framer-motion';
import { 
  Layers, Cpu, Database, Network, 
  Repeat, ArrowRight, CheckCircle2,
  Share2, ShieldCheck, Zap, Server
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import Layout from '../layouts/Layout';

export default function Ecosystem() {
  const { isDarkMode } = useThemeStore();

  const nodes = [
    { title: 'Shared Core', desc: 'Sustainomics Engine & Financial Logic', icon: Cpu, color: 'emerald' },
    { title: 'Client App', desc: 'Asset Initialization & Resident Portal', icon: Share2, color: 'blue' },
    { title: 'Agent App', desc: 'Verification & Tactical HUD', icon: Network, color: 'indigo' },
    { title: 'Hub App', desc: 'Intake, Batching & Settlement', icon: Server, color: 'rose' },
  ];

  return (
    <Layout>
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full`} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl mb-12 md:mb-32">
            <h1 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              The Architecture <br className="hidden sm:block" />
              of <span className="text-emerald-500 italic">Interconnectivity.</span>
            </h1>
            <p className={`text-base md:text-xl font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Klinflow is built as a highly modular monorepo. Every endpoint—from the resident's phone to the industrial hub—shares the same core financial intelligence and material verification protocols.
            </p>
          </div>

          {/* Ecosystem Map Visualization */}
          <div className="relative p-6 md:p-24 rounded-2xl bg-slate-900 border border-white/5 overflow-hidden mb-20 md:mb-40">
             <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
             
             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                {nodes.map((node, i) => (
                   <div key={i} className="flex flex-col items-center text-center group">
                      <div className={`w-20 h-20 rounded-2xl bg-${node.color}-500/10 border border-${node.color}-500/20 text-${node.color}-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                         <node.icon className="w-10 h-10" />
                      </div>
                      <h4 className="text-white font-bold text-lg mb-2">{node.title}</h4>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{node.desc}</p>
                   </div>
                ))}
             </div>

             {/* Connection Lines (Visual Decor) */}
             <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent -translate-y-1/2 hidden lg:block" />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 md:gap-24 items-center">
             <div className="order-2 lg:order-1">
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-500 mb-6">Monorepo Scalability</h2>
                <h3 className={`text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>One Core. <br className="hidden sm:block" />Infinite Endpoints.</h3>
                <p className={`text-base md:text-lg font-medium leading-relaxed mb-10 md:mb-12 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                   Our architecture ensures that data flows seamlessly between personas. When a resident posts a pickup in the Client App, it instantly hydrates the Agent job board and pre-notifies the Hub manager.
                </p>
                <div className="grid gap-6">
                   {[
                      { title: 'Unified Data Schema', desc: 'No data silos. Every material lot has a single source of truth from source to sale.' },
                      { title: 'Shared Asset Logic', desc: 'Valuation algorithms are centralized, ensuring consistent pricing across all apps.' },
                      { title: 'Real-Time Sync', desc: 'State synchronization via optimized WebSocket and Supabase real-time layers.' },
                   ].map((item, i) => (
                      <div key={i} className="flex gap-5">
                         <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
                         <div>
                            <h4 className={`font-bold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{item.title}</h4>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="relative order-1 lg:order-2 mb-12 lg:mb-0">
                 <div className={`aspect-square rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                   <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-32 h-32 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.3)]">
                         <Repeat className="w-16 h-16 text-white" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── ECOSYSTEM CTA ────────────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-6">
        <div className={`max-w-7xl mx-auto p-8 md:p-20 rounded-2xl relative overflow-hidden text-center ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
           <div className="max-w-2xl mx-auto relative z-10">
              <h2 className={`text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Plug Into the <br className="hidden sm:block" />Future of Recovery.</h2>
              <p className="text-base md:text-lg text-slate-500 font-medium mb-10 leading-relaxed">
                 Whether you are a developer, a fleet owner, or a municipal partner, Klinflow offers the most robust infrastructure for circular economics.
              </p>
              <button className="px-10 py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-3 mx-auto hover:bg-emerald-400 transition-all">
                 Request Technical Audit <ArrowRight className="w-5 h-5" />
              </button>
           </div>
        </div>
      </section>
    </Layout>
  );
}
