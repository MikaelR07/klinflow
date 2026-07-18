import { motion } from 'framer-motion';
import { 
  Terminal, Cpu, Network, Share2, Server, ArrowRight,
  Database, Zap, Webhook, CheckCircle2, Lock, Truck, ShieldAlert
} from 'lucide-react';
import Layout from '../layouts/Layout';

// Upcoming API Features Overview
const apiFeatures = [
  {
    title: "Secure Access (Zero-Trust)",
    subtitle: "Enterprise-grade security.",
    description: "Strict JWT-based authentication with Role-Based Access Control (RBAC). Granular policies for users and machines to secure every endpoint.",
    icon: Lock,
    bg: "bg-slate-500/10",
    color: "text-slate-400",
    borderColor: "border-slate-500/20",
  },
  {
    title: "Material Lot Management",
    subtitle: "Programmable material intake.",
    description: "Access highly verifiable material lot data with geo-fencing, mass validation from IoT scales, and digital signatures. Synchronized instantly.",
    icon: Database,
    bg: "bg-blue-500/10",
    color: "text-blue-400",
    borderColor: "border-blue-500/20",
  },
  {
    title: "Fleet Routing & Dispatch",
    subtitle: "Automate collection logistics.",
    description: "Interact with our routing engine to dispatch fleets, track GPS telemetry in real-time, and calculate optimal routes based on capacity and traffic.",
    icon: Truck,
    bg: "bg-amber-500/10",
    color: "text-amber-400",
    borderColor: "border-amber-500/20",
  },
  {
    title: "Financial Escrow Integration",
    subtitle: "Automated payout security.",
    description: "Hold buyer funds in digital escrow until materials are verified at the processing hub, enabling seamless, trustless B2B transactions.",
    icon: Zap,
    bg: "bg-emerald-500/10",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/20",
  },
  {
    title: "Idempotent Operations",
    subtitle: "Robust, predictable handling.",
    description: "Safely retry requests without double-charging or duplicating data, supported by strict idempotency keys and clear HTTP error responses.",
    icon: ShieldAlert,
    bg: "bg-rose-500/10",
    color: "text-rose-400",
    borderColor: "border-rose-500/20",
  },
  {
    title: "Real-Time Webhooks",
    subtitle: "Hydrate your systems.",
    description: "Subscribe to ecosystem events. Instantly hydrate your ERP or management tools when a fleet is dispatched or a lot changes custody.",
    icon: Webhook,
    bg: "bg-indigo-500/10",
    color: "text-indigo-400",
    borderColor: "border-indigo-500/20",
  }
];

export default function Ecosystem() {
  // We force Dark Mode explicitly across the page content
  return (
    <Layout>
      {/* Global Background Layer for Ecosystem - Forces Dark Mode + Grid */}
      <div className="fixed inset-0 z-[-1] bg-surface-950" />
      <div 
        className="fixed inset-0 z-[-1] opacity-[0.02]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      
      {/* ── PACKED HERO SECTION ──────────────────────────────── */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden border-b border-white/5">
       

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            {/* LEFT: Copy & CTAs */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-[0.2em] mb-8 bg-white/5 border border-white/10 text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                System Status: <span className="text-red-500">IN DEVELOPMENT</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-8 leading-[1.1] text-white">
                The complete Suite <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  To build your system.
                </span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl font-medium leading-relaxed max-w-2xl mb-12 text-slate-400">
                A complete suite of APIs, Webhooks, and SDKs to orchestrate material recovery at scale. Integrate IoT scales, automate escrow payouts, and trace custody globally.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
                 <button className="px-8 py-4 bg-emerald-500 text-slate-950 font-black rounded-xl shadow-[0_0_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all active:scale-95 w-full sm:w-auto">
                    Get API Keys <ArrowRight className="w-5 h-5" />
                 </button>
                 <button className="px-8 py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 font-mono text-sm border w-full sm:w-auto bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <Terminal className="w-4 h-4" /> View Documentation
                 </button>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-8 border-t border-white/10">
                 <div>
                    <p className="text-3xl font-black text-white mb-1">99.99%</p>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Uptime SLA</p>
                 </div>
                 <div>
                    <p className="text-3xl font-black text-white mb-1">{"<"}50ms</p>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">API Latency</p>
                 </div>
                 <div>
                    <p className="text-3xl font-black text-white mb-1">SOC 2</p>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Type II Certified</p>
                 </div>
              </div>
            </div>

            {/* RIGHT: Live Terminal / Code Visual */}
            <div className="relative mt-12 lg:mt-0 h-[450px] sm:h-[500px] lg:h-[600px] flex items-center justify-center w-full">
               <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 rounded-[3rem] blur-3xl" />
               
               {/* Terminal Window */}
               <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10 transform lg:rotate-y-[-10deg] lg:rotate-x-[5deg] perspective-1000">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[#111] border-b border-white/5">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                     </div>
                     <p className="text-[10px] font-mono text-slate-500">api.klinflow.com/v1/stream</p>
                  </div>
                  {/* Body */}
                  <div className="p-6 font-mono text-xs leading-relaxed text-slate-300">
                     <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                     >
                        <span className="text-emerald-400">❯</span> Authenticating stream connection... <span className="text-emerald-400">OK</span>
                     </motion.div>
                     <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="mt-2"
                     >
                        <span className="text-emerald-400">❯</span> Listening for events...
                     </motion.div>
                     
                     <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ delay: 1.5 }}
                        className="mt-6"
                     >
                        <p className="text-blue-400 mb-2">event received: <span className="text-white">lot.verified</span></p>
                        <pre className="bg-white/5 p-4 rounded-lg border border-white/5 overflow-x-auto text-slate-400">
{`{
  "id": "evt_99x28c",
  "type": "lot.verified",
  "data": {
    "lot_id": "lot_88b2c1",
    "status": "escrow_released",
    "weight_kg": 45.5,
    "purity": 0.98,
    "location": {
      "facility": "hub_nbi_01",
      "zone": "intake_bay_A"
    }
  },
  "created": 1718912411
}`}
                        </pre>
                     </motion.div>

                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.2 }}
                        className="mt-4 flex items-center gap-2 text-slate-500"
                     >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> waiting for next event
                     </motion.div>
                  </div>
               </div>
               
               {/* Floating Badges */}
               <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-2 md:-right-6 top-1/4 bg-[#111] border border-white/10 p-3 rounded-xl shadow-xl flex items-center gap-3 z-20"
               >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                     <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="hidden sm:block">
                     <p className="text-xs font-bold text-white">Escrow Released</p>
                     <p className="text-[10px] text-slate-400 font-mono">KES 4,500.00</p>
                  </div>
               </motion.div>
               
               <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -left-2 md:-left-8 bottom-1/4 bg-[#111] border border-white/10 p-3 rounded-xl shadow-xl flex items-center gap-3 z-20"
               >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                     <Database className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="hidden sm:block">
                     <p className="text-xs font-bold text-white">Ledger Synced</p>
                     <p className="text-[10px] text-slate-400 font-mono">Block #88192</p>
                  </div>
               </motion.div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ── API MODULES (Alternating Layout) ──────────────────────────────── */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-[90rem] mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
            <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-4 text-emerald-500">Upcoming API Features</h2>
            <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-6">Build the Future of Recycling.</h3>
            <p className="text-lg text-slate-400">Our upcoming API will provide developers with direct access to Klinflow's core logistics, verification, and marketplace systems.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {apiFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-[#0F172A] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all group">
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6 border ${feature.borderColor} group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  
                  <h4 className="text-xl font-bold text-white mb-2">{feature.title}</h4>
                  <h5 className={`text-sm font-semibold mb-4 ${feature.color}`}>{feature.subtitle}</h5>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── MONOREPO ARCHITECTURE VISUALIZATION (CLEAN / PROFESSIONAL) ──────────────────────────────── */}
      <section className="relative py-32 overflow-hidden border-t border-white/5 bg-surface-950">
        <div className="max-w-[1200px] mx-auto px-6 relative z-10 text-center mb-16 md:mb-24">
           <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-4 text-slate-500">System Architecture</h2>
           <h3 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-white">Unified Monorepo.</h3>
           <p className="text-lg font-medium text-slate-400">One shared financial core powering three specialized endpoints.</p>
        </div>

        <div className="max-w-[1000px] mx-auto px-6 relative z-10">
          
          {/* Top Layer: The Apps */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 relative z-20">
            {/* Client App */}
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-3 sm:p-4 md:p-8 flex flex-col items-center text-center">
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-500 mb-2 md:mb-4" />
              <h4 className="font-bold text-[10px] sm:text-sm md:text-lg mb-1 text-white">Client App</h4>
              <p className="text-[9px] md:text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:block">React Native</p>
            </div>
            
            {/* Agent App */}
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-3 sm:p-4 md:p-8 flex flex-col items-center text-center">
              <Network className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-indigo-500 mb-2 md:mb-4" />
              <h4 className="font-bold text-[10px] sm:text-sm md:text-lg mb-1 text-white">Agent App</h4>
              <p className="text-[9px] md:text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:block">React Native</p>
            </div>
            
            {/* Hub App */}
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-3 sm:p-4 md:p-8 flex flex-col items-center text-center">
              <Server className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-rose-500 mb-2 md:mb-4" />
              <h4 className="font-bold text-[10px] sm:text-sm md:text-lg mb-1 text-white">Hub App</h4>
              <p className="text-[9px] md:text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:block">React / Vite</p>
            </div>
          </div>

          {/* Connection Lines (SVG) */}
          <div className="absolute top-[100px] md:top-[140px] left-0 right-0 h-24 md:h-32 z-10 hidden sm:block">
             <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 100">
                <path d="M 166 0 L 166 50 L 500 50 L 500 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 500 0 L 500 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 833 0 L 833 50 L 500 50 L 500 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                
                {/* Data Packets flowing down */}
                <circle r="4" fill="#10b981">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M 166 0 L 166 50 L 500 50 L 500 100" />
                </circle>
                <circle r="4" fill="#10b981">
                  <animateMotion dur="1.5s" repeatCount="indefinite" path="M 500 0 L 500 100" />
                </circle>
                <circle r="4" fill="#10b981">
                  <animateMotion dur="2.5s" repeatCount="indefinite" path="M 833 0 L 833 50 L 500 50 L 500 100" />
                </circle>
             </svg>
          </div>
          <div className="h-12 sm:h-24 md:h-32" /> {/* Spacer for lines */}

          {/* Bottom Layer: Shared Core */}
          <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-6 md:p-10 relative overflow-hidden flex flex-col items-center text-center z-20 max-w-3xl mx-auto">
             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
             <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
             
             <Cpu className="w-8 h-8 text-emerald-500 mb-4" />
             <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-white">Sustainomics Shared Core</h3>
             <p className="text-xs md:text-sm text-slate-400 font-medium max-w-lg mx-auto">
               The centralized financial logic, verification algorithms, and single-source-of-truth database that powers the entire network.
             </p>
          </div>

        </div>
      </section>

      {/* ── TECHNICAL CTA ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t bg-emerald-800 border-white/5 relative z-10">
        <div className="max-w-4xl mx-auto rounded-3xl border p-12 text-center relative overflow-hidden bg-surface-950 border-white/10">
           <div className="absolute inset-0 bg-[size:24px_24px] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 blur-[100px] pointer-events-none" />
           
           <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 text-white">
                Start building with Klinflow.
              </h2>
              <p className="text-base md:text-lg font-medium mb-10 max-w-2xl mx-auto text-slate-400">
                 Create your free developer account today and start interacting with the world's first verified material ledger.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="px-8 py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 w-full sm:w-auto bg-white text-black hover:bg-slate-200 shadow-lg shadow-white/10">
                   Get API Keys <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 font-mono text-sm border w-full sm:w-auto bg-transparent border-white/20 text-white hover:bg-white/5">
                   View API Reference
                </button>
              </div>
           </div>
        </div>
      </section>
    </Layout>
  );
}
