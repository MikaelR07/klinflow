import { motion } from 'framer-motion';
import { 
  Warehouse, Package, Activity, ShieldCheck, 
  BarChart3, Recycle, ArrowRight, CheckCircle2,
  Cpu, Box, Layers, Zap
} from 'lucide-react';
import { useThemeStore } from '@cleanflow/core';
import Layout from '../layouts/Layout';

export default function ProductHub() {
  const { isDarkMode } = useThemeStore();

  return (
    <Layout>
      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`} />
          <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/10 blur-[120px] rounded-full`} />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-24 items-center">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 text-rose-500 font-bold uppercase tracking-widest text-[10px] mb-6">
                <Warehouse className="w-4 h-4" /> Platform Four: Hub Logistics Command
              </div>
              <h1 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Industrial Intake <br className="hidden sm:block" />
                <span className="text-rose-500 italic">Command Center.</span>
              </h1>
              <p className={`text-base md:text-lg font-medium leading-relaxed mb-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                The CleanFlow Hub app is the high-density engine for material verification, batching, and B2B order fulfillment. Where logistics becomes circular economics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-xl shadow-rose-600/20 active:scale-95 transition-all text-xs uppercase tracking-widest">
                  Request Hub Demo
                </button>
                <button className={`px-8 py-4 border rounded-2xl font-bold transition-all text-xs uppercase tracking-widest ${isDarkMode ? 'border-white/10 text-white hover:bg-white/5' : 'border-slate-200 text-slate-900 hover:bg-slate-50'}`}>
                   Intake Guide
                </button>
              </div>
            </div>

            <div className="lg:col-span-3 relative order-1 lg:order-2">
              <div className="rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative bg-slate-900">
                <img src="/placeholder-images/grid-images/Hub-home.png" alt="Hub Terminal: Intake Command" className="w-full h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
              </div>
              
              {/* Floating Status Card */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -top-10 -left-10 p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-white/5 max-w-[260px] hidden sm:block"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Throughput</p>
                    <p className="text-xl font-bold text-rose-600">84.2 Tons / Day</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[84%] bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.4)]" />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-left">Facility Capacity: 84%</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HUB FEATURES ─────────────────────────────────────────── */}
      <section className={`py-16 md:py-32 px-6 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: 'Intake Verification',
                desc: 'Confirm agent deliveries with precision. The Hub app triggers the final escrow release to agents and residents upon secondary verification.',
                icon: ShieldCheck,
                color: 'rose'
              },
              {
                title: 'Batch Optimization',
                desc: 'Aggregate small agent collections into industrial-grade material batches optimized for B2B marketplace sales.',
                icon: Layers,
                color: 'indigo'
              },
              {
                title: 'Live Inventory HUD',
                desc: 'Track every gram of verified material currently held in your facility. Real-time valuation based on market shifts.',
                icon: BarChart3,
                color: 'emerald'
              }
            ].map((f) => (
              <div key={f.title} className="group">
                <div className={`w-14 h-14 rounded-2xl bg-${f.color}-500/10 text-${f.color}-500 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{f.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPACITY & INTAKE ─────────────────────────────────────────── */}
      <section className={`py-16 md:py-32 px-6 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1">
             <div className="relative aspect-video rounded-[3rem] bg-slate-900 border border-white/5 overflow-hidden flex items-center justify-center p-12">
                <div className="grid grid-cols-3 gap-4 w-full">
                   {[1, 2, 3, 4, 5, 6].map((i) => (
                      <motion.div 
                         key={i}
                         initial={{ opacity: 0, scale: 0.8 }}
                         whileInView={{ opacity: 1, scale: 1 }}
                         transition={{ delay: i * 0.1 }}
                         className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2"
                      >
                         <Box className="w-6 h-6 text-rose-500/50" />
                         <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Lot #{1020 + i}</span>
                      </motion.div>
                   ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-50" />
             </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-rose-500 mb-6">Mass-Scale Recovery</h2>
            <h3 className={`text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>The Engine of <br className="hidden sm:block" />Material Processing.</h3>
            <p className={`text-lg font-medium leading-relaxed mb-12 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Hubs are the critical physical nodes in our digital network. We provide the software to manage industrial intake, verify quality at scale, and ensure your inventory is always liquid and ready for B2B trade.
            </p>
            <ul className="space-y-6">
              {[
                "Digital Scales & IoT Integration",
                "Automated Intake Ledger Entry",
                "B2B Order Fulfillment Terminal",
                "Hub Performance & Capacity Analytics"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-sm font-bold text-slate-500">
                  <CheckCircle2 className="w-5 h-5 text-rose-500" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── HUB PARTNERSHIP CTA ────────────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-6">
        <div className={`max-w-7xl mx-auto p-8 md:p-20 rounded-2xl relative overflow-hidden text-center bg-rose-600`}>
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
           <div className="max-w-3xl mx-auto relative z-10 text-white">
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tighter mb-8">Deploy a CleanFlow Hub <br className="hidden sm:block" />in Your Region.</h2>
              <p className="text-lg font-medium mb-10 opacity-80 leading-relaxed">
                Whether you are an established recycler or a government entity, we provide the infrastructure to turn your facility into a high-capacity CleanFlow node.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="w-full sm:w-auto px-10 py-5 bg-white text-rose-600 font-bold rounded-2xl shadow-2xl active:scale-95 transition-all">
                  Inquire for Partnership
                </button>
                <button className="w-full sm:w-auto px-10 py-5 border border-white/20 bg-rose-700/30 text-white rounded-2xl font-bold transition-all hover:bg-rose-700/50">
                  Download Hub Specs
                </button>
              </div>
           </div>
        </div>
      </section>
    </Layout>
  );
}
