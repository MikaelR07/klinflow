import { motion } from 'framer-motion';
import { 
  ShieldCheck, Handshake, Truck, 
  Warehouse, Zap, BarChart3, LockKeyhole,
  CheckCircle2, ArrowRight
} from 'lucide-react';
import { useThemeStore } from '@cleanflow/core';
import Layout from '../layouts/Layout';

const technicalSpecs = [
  {
    title: 'The Verification Ledger',
    desc: 'How CleanFlow ensures material integrity from source to hub.',
    steps: [
      { title: 'Source Attribution', body: 'Every kilogram is tagged to a unique Resident ID at the moment of collection.' },
      { title: 'AI Grading Engine', body: 'HygeneX vision identifies material purity and moisture content instantly.' },
      { title: 'Digital Sealing', body: 'Once verified by an agent, the asset value is cryptographically locked in the ledger.' },
    ],
    icon: ShieldCheck,
    color: 'emerald'
  },
  {
    title: 'Automated Liquidity',
    desc: 'The financial engine that powers instant payouts.',
    steps: [
      { title: 'Escrow Lock', body: 'Industrial buyer funds are held in secure escrow upon order placement.' },
      { title: 'Verification Trigger', body: 'Agent collection confirmation triggers a secondary escrow hold.' },
      { title: 'Instant Clearance', body: 'Hub intake confirmation triggers instant payout release via M-Pesa API.' },
    ],
    icon: Zap,
    color: 'indigo'
  },
  {
    title: 'Logistics Intelligence',
    desc: 'Optimizing the transit of circular assets.',
    steps: [
      { title: 'Dynamic Routing', body: 'AI calculates the lowest-carbon path for multiple agent collections.' },
      { title: 'Hub Load Balancing', body: 'Inventory is routed to hubs based on current processing capacity.' },
      { title: 'Supply Aggregation', body: 'Small lots are combined into industrial-scale bundles for B2B trading.' },
    ],
    icon: Truck,
    color: 'blue'
  }
];

export default function HowItWorks() {
  const { isDarkMode } = useThemeStore();

  return (
    <Layout>
      <section className="relative py-16 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl mb-12 md:mb-32">
            <h1 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              The Mechanics of <br className="hidden sm:block" />
              <span className="text-emerald-500 italic">Circular Scale.</span>
            </h1>
            <p className={`text-base md:text-xl font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              CleanFlow isn't just an app—it's a high-precision protocol for waste valuation, collection, and settlement. Explore the three pillars of our infrastructure.
            </p>
          </div>

          <div className="space-y-24 md:space-y-40">
            {technicalSpecs.map((spec, i) => (
              <div key={spec.title} className={`grid lg:grid-cols-2 gap-12 md:gap-20 items-start ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                <div className={i % 2 !== 0 ? 'lg:order-2' : ''}>
                  <div className={`w-16 h-16 rounded-2xl bg-${spec.color}-500/10 text-${spec.color}-500 flex items-center justify-center mb-8`}>
                    <spec.icon className="w-8 h-8" />
                  </div>
                  <h2 className={`text-2xl sm:text-3xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{spec.title}</h2>
                  <p className="text-base md:text-lg text-slate-500 font-medium mb-12">{spec.desc}</p>
                  
                  <div className="space-y-10">
                    {spec.steps.map((step, si) => (
                      <div key={step.title} className="flex gap-6">
                        <div className={`text-sm font-bold font-mono text-${spec.color}-500 opacity-50`}>0{si + 1}</div>
                        <div>
                          <h4 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{step.title}</h4>
                          <p className="text-slate-500 text-sm font-medium leading-relaxed">{step.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`relative aspect-video sm:aspect-square rounded-2xl bg-slate-900 border border-white/5 overflow-hidden group ${i % 2 !== 0 ? 'lg:order-1' : ''}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br from-${spec.color}-500/20 to-transparent`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Placeholder for complex SVG diagrams */}
                    <div className={`w-32 h-32 rounded-2xl bg-${spec.color}-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-700`}>
                      <spec.icon className="w-16 h-16 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full bg-${spec.color}-500 animate-pulse`} />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Protocol Active</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium leading-tight">Live telemetry processing for {spec.title.toLowerCase()}. Nodes synchronized.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECHNICAL CTA ────────────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-6">
        <div className={`max-w-7xl mx-auto p-8 md:p-20 rounded-2xl relative overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
           <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
              <BarChart3 className="w-64 h-64" />
           </div>
           <div className="max-w-2xl relative z-10">
              <h2 className={`text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Ready for a <br className="hidden sm:block" />Technical Deep Dive?</h2>
              <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
                Download our comprehensive system whitepaper for a full audit of our smart-contract payouts, AI grading logic, and logistics algorithms.
              </p>
              <button className="px-10 py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-3 hover:bg-emerald-400 transition-all active:scale-95">
                Download Whitepaper <ArrowRight className="w-5 h-5" />
              </button>
           </div>
        </div>
      </section>
    </Layout>
  );
}
