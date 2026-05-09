import { motion } from 'framer-motion';
import { 
  Building2, LineChart, Users, BarChart3, 
  ShieldCheck, Wallet, ArrowRight, CheckCircle2,
  TrendingUp, Activity, PieChart, Layers, Zap, MapPin
} from 'lucide-react';
import { useThemeStore } from '@cleanflow/core';
import Layout from '../layouts/Layout';

export default function ProductFleet() {
  const { isDarkMode } = useThemeStore();

  return (
    <Layout>
      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`} />
          <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full`} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-24 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 text-indigo-500 font-bold uppercase tracking-widest text-xs mb-6">
                <Building2 className="w-4 h-4" /> Platform Three: Fleet & Enterprise Admin
              </div>
              <h1 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Industrial-Grade <br className="hidden sm:block" />
                <span className="text-indigo-500 italic">Fleet Economics.</span>
              </h1>
              <p className={`text-base md:text-xl font-medium leading-relaxed mb-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                CleanFlow gives company owners and logistics managers the macro-financial tools to track driver performance, inventory value, and revenue splits in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                  Request Enterprise Demo
                </button>
                <button className={`px-8 py-4 border rounded-2xl font-bold transition-all ${isDarkMode ? 'border-white/10 text-white hover:bg-white/5' : 'border-slate-200 text-slate-900 hover:bg-slate-50'}`}>
                  Revenue Share Model
                </button>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative bg-slate-900">
                <img src="/grid/agent-home.png" alt="Enterprise Terminal: Fleet Admin" loading="lazy" className="w-full h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
              </div>
              {/* Floating Stat Card */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-10 -right-10 p-8 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-white/5 min-w-[280px] hidden sm:block"
              >
                <div className="flex items-center justify-between mb-6">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Fleet Yield</p>
                   <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                   <p className="text-3xl font-bold text-slate-900 dark:text-white">KSh 1.2M</p>
                   <p className="text-xs font-bold text-emerald-500">+12.5%</p>
                </div>
                <div className="space-y-3">
                   <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                      <span>Active Drivers</span>
                      <span>24 / 30</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full w-[80%] bg-indigo-500" />
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ENTERPRISE FEATURES ─────────────────────────────────────────── */}
      <section className={`py-16 md:py-32 px-6 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: 'Automated Revenue Splits',
                desc: 'CleanFlow automatically handles the financial split between the agent, the fleet owner, and the platform — settled instantly via M-Pesa.',
                icon: Wallet,
                color: 'indigo'
              },
              {
                title: 'Fleet-Wide Analytics',
                desc: 'Deep-dive into driver collection patterns, material hotspots, and inventory aging to optimize your operational ROI.',
                icon: BarChart3,
                color: 'blue'
              },
              {
                title: 'Inventory Valuation',
                desc: 'Track the real-time market value of all materials currently held in transit by your fleet, powered by the HygeneX Oracle.',
                icon: PieChart,
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

      {/* ── MACRO FINANCIAL CONTROL ─────────────────────────────────────────── */}
      <section className={`py-16 md:py-32 px-6 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                   { label: 'Fleet Efficiency', val: '94%', icon: Activity },
                   { label: 'Active Territory', val: '12 Districts', icon: MapPin },
                   { label: 'Market Liquidity', val: 'High', icon: Zap },
                   { label: 'Data Sync', val: 'Real-Time', icon: Layers },
                ].map((item, i) => (
                   <div key={i} className={`p-8 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/5 hover:border-indigo-500/20' : 'bg-white border-slate-100 hover:border-indigo-500/20 shadow-lg'}`}>
                      <item.icon className="w-6 h-6 text-indigo-500 mb-6" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.val}</p>
                   </div>
                ))}
             </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-indigo-500 mb-6">Strategic Oversight</h2>
            <h3 className={`text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Total Governance <br className="hidden sm:block" />of Circular Assets.</h3>
            <p className={`text-lg font-medium leading-relaxed mb-12 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Managing a waste logistics business requires surgical precision. CleanFlow provides the visibility needed to scale your operations from a single truck to a regional fleet with centralized control.
            </p>
            <ul className="space-y-6">
              {[
                "Centralized Driver Performance HUD",
                "Automated Payout & Commission Engine",
                "Dynamic Inventory Risk Management",
                "Industrial Buyer Integration API"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-sm font-bold text-slate-500">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── ENTERPRISE CTA ────────────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-6">
        <div className={`max-w-7xl mx-auto p-8 md:p-20 rounded-2xl relative overflow-hidden text-center bg-indigo-600`}>
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
           <div className="max-w-3xl mx-auto relative z-10 text-white">
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tighter mb-8">Ready to Professionalize <br className="hidden sm:block" />Your Logistics Business?</h2>
              <p className="text-lg font-medium mb-10 opacity-80 leading-relaxed">
                Connect your existing fleet to the CleanFlow network or build a new recycling empire from the ground up with our enterprise tools.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="w-full sm:w-auto px-10 py-5 bg-white text-indigo-600 font-bold rounded-2xl shadow-2xl active:scale-95 transition-all">
                  Request Company Onboarding
                </button>
                <button className="w-full sm:w-auto px-10 py-5 border border-white/20 bg-indigo-700/30 text-white rounded-2xl font-bold transition-all hover:bg-indigo-700/50">
                  Speak to an Architect
                </button>
              </div>
           </div>
        </div>
      </section>
    </Layout>
  );
}

