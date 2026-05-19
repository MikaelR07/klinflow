import { motion } from 'framer-motion';
import { 
  User, Wallet, Search, Truck, 
  ShoppingBag, CheckCircle2, ArrowRight,
  Handshake, Layout as LayoutIcon, BarChart3
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core';
import Layout from '../layouts/Layout';

export default function ProductClient() {
  const { isDarkMode } = useThemeStore();

  return (
    <Layout>
      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`} />
          <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full`} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-24 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-xs mb-6">
                <User className="w-4 h-4" /> Platform One: Resident & Seller Portal
              </div>
              <h1 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Turn Your Waste <br className="hidden sm:block" />
                Into <span className="text-emerald-500 italic">Instant Wealth.</span>
              </h1>
              <p className={`text-base md:text-xl font-medium leading-relaxed mb-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Whether you are a household resident or a professional bulk seller, Klinflow provides the valuation tools and logistics network to monetize your recyclables.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                  Download Mobile App
                </button>
                <button className={`px-8 py-4 border rounded-2xl font-bold transition-all ${isDarkMode ? 'border-white/10 text-white hover:bg-white/5' : 'border-slate-200 text-slate-900 hover:bg-slate-50'}`}>
                  View Seller Pricing
                </button>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative">
                <img src="/grid/seller-home.png" alt="Client Terminal: Seller Home" loading="lazy" className="w-full h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
              </div>
              {/* Floating UI Card */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-white/5 max-w-[240px] hidden sm:block"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Instant Payout</p>
                    <p className="text-lg font-bold text-emerald-500">KSh 4,250</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-medium">Payout triggered for 45kg HDPE Grade A collection.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ─────────────────────────────────────────── */}
      <section className={`py-16 md:py-32 px-6 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: 'AI Smart Valuation',
                desc: 'Residents schedule pickups, receive weight-based valuation, and track payouts in real time via GreenFlow Points.',
                icon: Search,
                color: 'emerald'
              },
              {
                title: 'B2B Marketplace',
                desc: 'List bulk inventory for industrial buyers. Manage offers, bids, and logistics tracking in a unified seller terminal.',
                icon: ShoppingBag,
                color: 'blue'
              },
              {
                title: 'Real-Time Verification',
                desc: 'Agents verify weight and grade at your doorstep. Payouts are triggered instantly upon agent confirmation.',
                icon: CheckCircle2,
                color: 'indigo'
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

      {/* ── DETAILED FLOW SECTION ─────────────────────────────────────────── */}
      <section className={`py-16 md:py-32 px-6 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center p-12">
                <div className="w-full space-y-6">
                  {[
                    { label: 'Collection Request', status: 'Completed', color: 'emerald' },
                    { label: 'Agent Verification', status: 'In Progress', color: 'blue' },
                    { label: 'Financial Settlement', status: 'Pending', color: 'slate' },
                  ].map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full bg-${item.color}-500 ${item.status === 'In Progress' ? 'animate-pulse' : ''}`} />
                        <span className="font-bold text-white text-sm uppercase tracking-widest">{item.label}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-500 mb-6">Transparency First</h2>
            <h3 className={`text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Track Every Gram <br className="hidden sm:block" />to the Payout.</h3>
            <p className={`text-lg font-medium leading-relaxed mb-12 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              The Klinflow Client app provides absolute transparency. From the moment you post a pickup to the final industrial sale, you can track the status, grade, and financial valuation of your circular assets.
            </p>
            <ul className="space-y-6">
              {[
                "Live Asset Lifecycle Tracking",
                "Cryptographic Value Verification",
                "Direct M-Pesa Wallet Integration",
                "Carbon Footprint Impact Metrics"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-sm font-bold text-slate-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── CONVERSION CTA ────────────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-6">
        <div className={`max-w-7xl mx-auto p-8 md:p-20 rounded-2xl relative overflow-hidden text-center ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
           <div className="max-w-2xl mx-auto relative z-10">
              <h2 className={`text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Start Monetizing Your Waste Today.</h2>
              <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
                Join 50,000+ residents and sellers who are turning sustainability into a high-yield reality.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="w-full sm:w-auto px-10 py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                  Get Started for Free
                </button>
                <button className="w-full sm:w-auto px-10 py-5 border rounded-2xl font-bold transition-all border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5">
                  View App Features
                </button>
              </div>
           </div>
        </div>
      </section>
    </Layout>
  );
}
