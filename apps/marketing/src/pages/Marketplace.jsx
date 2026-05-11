import { motion } from 'framer-motion';
import { 
  ShoppingBag, Building2, Package, Layers, 
  Wallet, Brain, ArrowRight, CheckCircle2,
  TrendingUp, Activity, Globe, ShieldCheck
} from 'lucide-react';
import { useThemeStore } from '@cleanflow/core';
import Layout from '../layouts/Layout';

export default function Marketplace() {
  const { isDarkMode } = useThemeStore();

  return (
    <Layout>
      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`} />
          <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 blur-[120px] rounded-full`} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-24 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 text-teal-500 font-bold uppercase tracking-widest text-xs mb-6">
                <ShoppingBag className="w-4 h-4" /> The B2B Settlement Layer
              </div>
              <h1 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                The Real-Time Marketplace for <br className="hidden sm:block" />
                <span className="text-teal-500 italic">Verified Circular Assets.</span>
              </h1>
              <p className={`text-base md:text-xl font-medium leading-relaxed mb-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                CleanFlow's B2B marketplace connects verified supply with industrial demand. We eliminate friction in circular trading through automated escrow, AI grading, and real-time logistics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-10 py-5 bg-teal-600 text-white font-bold rounded-2xl shadow-xl shadow-teal-600/20 active:scale-95 transition-all">
                  Access Trading Terminal
                </button>
                <button className={`px-10 py-5 border rounded-2xl font-bold transition-all ${isDarkMode ? 'border-white/10 text-white hover:bg-white/5' : 'border-slate-200 text-slate-900 hover:bg-slate-50'}`}>
                  Market Price Oracle
                </button>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative bg-slate-900">
                <img src="/grid/business-home.png" alt="Marketplace Terminal: Industrial Exchange" loading="lazy" className="w-full h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRADING ROLES ─────────────────────────────────────────── */}
      <section className={`py-16 md:py-32 px-6 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {[
              {
                title: 'For Independent Collectors',
                desc: 'Informal collectors browse and claim verified material lots from the CleanFlow network. Smart matching recommends assets based on location and material specialization.',
                icon: Package,
                color: 'teal'
              },
              {
                title: 'For Industrial Buyers',
                desc: 'Large recycling plants and manufacturers place bulk purchase orders. The platform aggregates micro-collector supply to meet industrial-scale demand.',
                icon: Building2,
                color: 'blue'
              }
            ].map((role) => (
              <div 
                key={role.title}
                className={`p-8 md:p-12 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900 border-white/5 hover:border-teal-500/20' : 'bg-slate-50 border-slate-100 hover:border-teal-500/20 shadow-lg'}`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-${role.color}-500/10 text-${role.color}-500 flex items-center justify-center mb-8`}>
                  <role.icon className="w-8 h-8" />
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{role.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-10">{role.desc}</p>
                <button className={`text-sm font-bold uppercase tracking-widest text-${role.color}-500 flex items-center gap-2 group`}>
                   Learn More <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── B2B MECHANICS ─────────────────────────────────────────── */}
      <section className={`py-16 md:py-32 px-6 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-24">
              <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-teal-500 mb-6">Built-In Liquidity</h2>
              <h3 className={`text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>The Settlement Layer.</h3>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
              {[
                 {
                    title: 'Escrow Protection',
                    desc: 'All trades are secured via automated B2B escrow. Funds are only released when the buyer confirms receipt of verified material grades.',
                    icon: ShieldCheck
                 },
                 {
                    title: 'Digital Warehouse',
                    desc: 'Manage your full inventory — both CleanFlow-sourced and independently collected — in a unified dashboard with AI valuation.',
                    icon: Layers
                 },
                 {
                    title: 'Market Intelligence',
                    desc: 'Real-time price feeds and demand forecasting from industrial buyers help both collectors and buyers maximize their margins.',
                    icon: Brain
                 }
              ].map((m, i) => (
                 <div key={i} className="text-center">
                    <div className={`w-20 h-20 mx-auto rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center mb-8`}>
                       <m.icon className="w-10 h-10" />
                    </div>
                    <h4 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{m.title}</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{m.desc}</p>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* ── MARKET DATA VISUALIZATION ─────────────────────────────────────────── */}
      <section className={`py-16 md:py-32 px-6 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
           <div className="order-2 lg:order-1">
              <div className="p-10 rounded-2xl bg-slate-900 border border-white/5 relative overflow-hidden">
                 <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                       <Activity className="w-5 h-5 text-teal-500" />
                       <p className="text-xs font-bold text-white uppercase tracking-widest">Market Liquidity Index</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-bold text-teal-500 uppercase tracking-widest">
                       High
                    </div>
                 </div>
                 <div className="space-y-6">
                    {[
                       { label: 'PET Grade A', price: 'KSh 45.2', change: '+2.4%' },
                       { label: 'HDPE Clear', price: 'KSh 52.8', change: '-0.8%' },
                       { label: 'PP Industrial', price: 'KSh 38.5', change: '+1.2%' },
                    ].map((item, i) => (
                       <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-sm font-bold text-white">{item.label}</p>
                          <div className="flex items-center gap-4">
                             <p className="text-sm font-mono text-slate-300">{item.price}</p>
                             <p className={`text-xs font-bold ${item.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{item.change}</p>
                          </div>
                       </div>
                    ))}
                 </div>
                 <div className="mt-10 h-32 w-full flex items-end gap-1">
                    {[30, 45, 60, 40, 75, 90, 65, 80, 55, 70, 85, 95].map((h, i) => (
                       <div key={i} className="flex-1 bg-teal-500/20 rounded-t-sm" style={{ height: `${h}%` }} />
                    ))}
                 </div>
              </div>
           </div>

           <div className="order-1 lg:order-2">
              <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-teal-500 mb-6">Real-Time Trading</h2>
              <h3 className={`text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>The Exchange for <br className="hidden sm:block" />Circular Materials.</h3>
              <p className={`text-lg font-medium leading-relaxed mb-12 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                 We have digitized the entire supply chain, allowing industrial buyers to procure thousands of kilograms of verified materials with a single click. No more brokers, no more friction.
              </p>
              <ul className="space-y-6">
                 {[
                    "Verified Material Proof-of-Grade",
                    "Automated B2B Escrow Settlement",
                    "Real-Time Inventory Price Oracle",
                    "Integrated Logistics Fulfillment"
                 ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-sm font-bold text-slate-500">
                       <CheckCircle2 className="w-5 h-5 text-teal-500" /> {item}
                    </li>
                 ))}
              </ul>
           </div>
        </div>
      </section>

      {/* ── TRADING CTA ────────────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-6">
        <div className={`max-w-7xl mx-auto p-8 md:p-20 rounded-2xl relative overflow-hidden text-center bg-teal-600`}>
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
           <div className="max-w-3xl mx-auto relative z-10 text-white">
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tighter mb-8">Professionalize Your <br className="hidden sm:block" />Material Trading.</h2>
              <p className="text-lg font-medium mb-10 opacity-80 leading-relaxed">
                 Whether you are an industrial plant or a bulk collector, the Weaver Marketplace is your gateway to high-liquidity circular trading.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="w-full sm:w-auto px-10 py-5 bg-white text-teal-600 font-bold rounded-2xl shadow-2xl active:scale-95 transition-all">
                  Apply for Trading Access
                </button>
                <button className="w-full sm:w-auto px-10 py-5 border border-white/20 bg-teal-700/30 text-white rounded-2xl font-bold transition-all hover:bg-teal-700/50">
                   API Documentation
                </button>
              </div>
           </div>
        </div>
      </section>
    </Layout>
  );
}
