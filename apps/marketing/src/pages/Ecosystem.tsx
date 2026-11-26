import { motion } from 'framer-motion';
import { 
  Terminal, Cpu, Network, Share2, Server, ArrowRight,
  Database, Zap, Webhook, CheckCircle2, Lock, Truck, ShieldAlert,
  Code, Blocks, Link as LinkIcon
} from 'lucide-react';
import Layout from '../layouts/Layout';
import { Link } from 'react-router-dom';

// Upcoming API Features Overview
const apiFeatures = [
  {
    title: "Secure Access (Zero-Trust)",
    subtitle: "Enterprise-grade security.",
    description: "Strict JWT-based authentication with Role-Based Access Control (RBAC). Granular policies for users and machines to secure every endpoint.",
    icon: Lock,
    color: "emerald"
  },
  {
    title: "Material Lot Management",
    subtitle: "Programmable material intake.",
    description: "Access highly verifiable material lot data with geo-fencing, mass validation from IoT scales, and digital signatures. Synchronized instantly.",
    icon: Database,
    color: "blue"
  },
  {
    title: "Fleet Routing & Dispatch",
    subtitle: "Automate collection logistics.",
    description: "Interact with our routing engine to dispatch fleets, track GPS telemetry in real-time, and calculate optimal routes based on capacity and traffic.",
    icon: Truck,
    color: "amber"
  },
  {
    title: "Financial Escrow Integration",
    subtitle: "Automated payout security.",
    description: "Hold buyer funds in digital escrow until materials are verified at the processing hub, enabling seamless, trustless B2B transactions.",
    icon: Zap,
    color: "rose"
  },
  {
    title: "Idempotent Operations",
    subtitle: "Robust, predictable handling.",
    description: "Safely retry requests without double-charging or duplicating data, supported by strict idempotency keys and clear HTTP error responses.",
    icon: ShieldAlert,
    color: "indigo"
  },
  {
    title: "Real-Time Webhooks",
    subtitle: "Hydrate your systems.",
    description: "Subscribe to ecosystem events. Instantly hydrate your ERP or management tools when a fleet is dispatched or a lot changes custody.",
    icon: Webhook,
    color: "cyan"
  }
];

const integrations = [
  { name: "SAP ERP", category: "Enterprise", icon: Server },
  { name: "Microsoft Dynamics", category: "Enterprise", icon: Database },
  { name: "Stripe", category: "Payments", icon: Zap },
  { name: "Mobile Money", category: "Payments", icon: Share2 },
  { name: "Geotab", category: "Telematics", icon: Truck },
  { name: "Custom IoT", category: "Hardware", icon: Cpu },
];

const faqs = [
  { 
    q: "What authentication protocol do you use?", 
    a: "We use standard JWT-based Bearer authentication via OAuth 2.0. You can generate API keys directly from your developer dashboard with granular RBAC scopes." 
  },
  { 
    q: "Do you offer a sandbox environment?", 
    a: "Yes. Every developer account comes with a fully-featured sandbox environment. It perfectly mirrors production so you can test escrow and fleet routing safely." 
  },
  { 
    q: "How are webhooks delivered?", 
    a: "Webhooks are delivered via HTTP POST requests to your configured endpoints. We enforce strict retries with exponential backoff and provide signature headers for verification." 
  },
  { 
    q: "Are there rate limits?", 
    a: "The standard tier allows 100 requests per second. Enterprise partners can request limit increases based on their real-time integration and IoT scaling needs." 
  },
];

export default function Ecosystem() {
  const isDarkMode = false;

  const getFeatureColor = (color: string) => {
    const map: Record<string, { bg: string, text: string, border: string }> = {
      emerald: { bg: isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50', text: isDarkMode ? 'text-emerald-400' : 'text-emerald-600', border: isDarkMode ? 'border-emerald-500/20' : 'border-emerald-200' },
      blue: { bg: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50', text: isDarkMode ? 'text-blue-400' : 'text-blue-600', border: isDarkMode ? 'border-blue-500/20' : 'border-blue-200' },
      amber: { bg: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50', text: isDarkMode ? 'text-amber-400' : 'text-amber-600', border: isDarkMode ? 'border-amber-500/20' : 'border-amber-200' },
      rose: { bg: isDarkMode ? 'bg-rose-500/10' : 'bg-rose-50', text: isDarkMode ? 'text-rose-400' : 'text-rose-600', border: isDarkMode ? 'border-rose-500/20' : 'border-rose-200' },
      indigo: { bg: isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50', text: isDarkMode ? 'text-indigo-400' : 'text-indigo-600', border: isDarkMode ? 'border-indigo-500/20' : 'border-indigo-200' },
      cyan: { bg: isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-50', text: isDarkMode ? 'text-cyan-400' : 'text-cyan-600', border: isDarkMode ? 'border-cyan-500/20' : 'border-cyan-200' },
    };
    return map[color] || map.emerald;
  };

  return (
    <Layout>
      {/* Global Background Layer */}
      <div className={`fixed inset-0 z-[-1] ${isDarkMode ? 'bg-surface-950' : 'bg-slate-50'}`} />
      <div 
        className="fixed inset-0 z-[-1] opacity-[0.02] md:opacity-[0.05]"
        style={{ backgroundImage: `linear-gradient(${isDarkMode ? '#ffffff' : '#94a3b8'} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? '#ffffff' : '#94a3b8'} 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
      />
      
      {/* ── WELCOMING HERO SECTION ──────────────────────────────── */}
      <section className="relative pt-32 pb-32 md:pt-40 md:pb-48 overflow-hidden border-b border-emerald-900/30 bg-gradient-to-br from-emerald-600 via-emerald-800 to-primary">
        
        {/* Optional subtle grid overlay for texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            {/* LEFT: Copy & CTAs */}
            <div>
              
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-8 leading-[1.1] text-white">
                What Awesome things could you <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">
                  build with Klinflow?
                </span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl font-medium leading-relaxed max-w-2xl mb-12 text-slate-300">
                The world's first API for verifiable material recovery. Seamlessly connect your ERPs, fleet management software, and IoT hardware to our unified recycling ledger.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
                 <button className="px-8 py-4 bg-emerald-400 text-slate-950 font-black rounded-xl shadow-[0_0_40px_rgba(52,211,153,0.4)] flex items-center justify-center gap-2 hover:bg-emerald-300 transition-all active:scale-95 w-full sm:w-auto">
                    Get API Keys <ArrowRight className="w-5 h-5" />
                 </button>
                 <button className="px-8 py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 font-mono text-sm border w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-sm backdrop-blur-md">
                    <Code className="w-4 h-4" /> Read the Docs
                 </button>
              </div>
            </div>

            {/* RIGHT: Lego Blocks Animation */}
            <div className="relative mt-12 lg:mt-0 h-[400px] sm:h-[500px] flex items-center justify-center w-full">
               <div className="absolute inset-0 bg-gradient-to-tr rounded-[3rem] blur-3xl from-emerald-400/20 to-cyan-400/20" />
               
               <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] z-10">
                 
                 {/* Top Left Block (ERP) */}
                 <motion.div
                   initial={{ x: -100, y: -100, opacity: 0, rotate: -15 }}
                   animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                   transition={{ type: "spring", bounce: 0.4, delay: 0.2 }}
                   className={`absolute top-0 left-0 w-[130px] h-[130px] sm:w-[150px] sm:h-[150px] rounded-2xl flex flex-col items-center justify-center gap-2 border-b-4 border-r-4 shadow-xl ${isDarkMode ? 'bg-blue-600 border-blue-800 text-white' : 'bg-blue-500 border-blue-700 text-white'}`}
                 >
                   <Server className="w-8 h-8 opacity-90" />
                   <span className="font-bold text-sm tracking-wide">ERP</span>
                 </motion.div>

                 {/* Top Right Block (IoT) */}
                 <motion.div
                   initial={{ x: 100, y: -100, opacity: 0, rotate: 15 }}
                   animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                   transition={{ type: "spring", bounce: 0.4, delay: 0.4 }}
                   className={`absolute top-0 right-0 w-[130px] h-[130px] sm:w-[150px] sm:h-[150px] rounded-2xl flex flex-col items-center justify-center gap-2 border-b-4 border-r-4 shadow-xl ${isDarkMode ? 'bg-emerald-600 border-emerald-800 text-white' : 'bg-emerald-500 border-emerald-700 text-white'}`}
                 >
                   <Cpu className="w-8 h-8 opacity-90" />
                   <span className="font-bold text-sm tracking-wide">IoT Scale</span>
                 </motion.div>

                 {/* Bottom Left Block (Payments) */}
                 <motion.div
                   initial={{ x: -100, y: 100, opacity: 0, rotate: -15 }}
                   animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                   transition={{ type: "spring", bounce: 0.4, delay: 0.6 }}
                   className={`absolute bottom-0 left-0 w-[130px] h-[130px] sm:w-[150px] sm:h-[150px] rounded-2xl flex flex-col items-center justify-center gap-2 border-b-4 border-r-4 shadow-xl ${isDarkMode ? 'bg-amber-500 border-amber-700 text-white' : 'bg-amber-400 border-amber-600 text-white'}`}
                 >
                   <Zap className="w-8 h-8 opacity-90" />
                   <span className="font-bold text-sm tracking-wide">Payments</span>
                 </motion.div>

                 {/* Bottom Right Block (Klinflow Core) */}
                 <motion.div
                   initial={{ x: 100, y: 100, opacity: 0, rotate: 15 }}
                   animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                   transition={{ type: "spring", bounce: 0.4, delay: 0.8 }}
                   className={`absolute bottom-0 right-0 w-[130px] h-[130px] sm:w-[150px] sm:h-[150px] rounded-2xl flex flex-col items-center justify-center gap-2 border-b-4 border-r-4 shadow-xl ${isDarkMode ? 'bg-slate-800 border-slate-950 text-emerald-400' : 'bg-slate-800 border-slate-900 text-emerald-400'}`}
                 >
                   <Blocks className="w-8 h-8" />
                   <span className="font-bold text-sm tracking-wide text-white">Klinflow</span>
                 </motion.div>

                 {/* Central Connection Pulse */}
                 <motion.div
                   initial={{ opacity: 0, scale: 0 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: 1.2, type: "spring" }}
                   className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.8)] z-20 flex items-center justify-center"
                 >
                   <LinkIcon className="w-6 h-6 text-slate-900" />
                 </motion.div>

                 {/* Animated Orbiting Lines */}
                 <svg className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] z-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                   {/* Static Track */}
                   <rect x="2" y="2" width="96" height="96" rx="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                   
                   {/* Orbiting Line 1 (Emerald) */}
                   <motion.rect
                     x="2" y="2" width="96" height="96" rx="10"
                     fill="none"
                     stroke="#10b981"
                     strokeWidth="1"
                     pathLength="100"
                     strokeDasharray="15 85"
                     animate={{ strokeDashoffset: [100, 0] }}
                     transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                     style={{ filter: 'drop-shadow(0 0 6px #10b981)' }}
                   />
                   
                   {/* Orbiting Line 2 (Blue) */}
                   <motion.rect
                     x="2" y="2" width="96" height="96" rx="10"
                     fill="none"
                     stroke="#3b82f6"
                     strokeWidth="1"
                     pathLength="100"
                     strokeDasharray="15 85"
                     animate={{ strokeDashoffset: [0, 100] }}
                     transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                     style={{ filter: 'drop-shadow(0 0 6px #3b82f6)' }}
                   />

                   {/* Orbiting Line 3 (Amber) */}
                   <motion.rect
                     x="2" y="2" width="96" height="96" rx="10"
                     fill="none"
                     stroke="#f59e0b"
                     strokeWidth="0.5"
                     pathLength="100"
                     strokeDasharray="10 90"
                     animate={{ strokeDashoffset: [100, 0] }}
                     transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                     style={{ filter: 'drop-shadow(0 0 4px #f59e0b)' }}
                   />
                 </svg>
               </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS SECTION ──────────────────────────────── */}
      <section className={`py-16 md:py-24 border-b ${isDarkMode ? 'bg-surface-900 border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className={`text-2xl md:text-3xl font-black mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Connect to Your Existing Systems</h2>
            <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Klinflow acts as the middleware. Push verifiable ESG data straight into the tools your enterprise already uses.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {integrations.map((integration, idx) => {
              const Icon = integration.icon;
              return (
                <div 
                  key={idx}
                  className={`p-6 rounded-2xl border flex flex-col items-center text-center justify-center gap-3 transition-transform hover:-translate-y-1 ${isDarkMode ? 'bg-surface-950 border-white/10 shadow-lg' : 'bg-slate-50 border-slate-200 shadow-sm'}`}
                >
                  <Icon className={`w-8 h-8 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <div>
                    <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{integration.name}</h3>
                    <p className={`text-[10px] uppercase font-mono tracking-wider mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{integration.category}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── UPCOMING API FEATURES ──────────────────────────────── */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
            <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-4 text-emerald-500">Upcoming Capabilities</h2>
            <h3 className={`text-3xl md:text-5xl font-black tracking-tighter mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Build the Future of Recycling.</h3>
            <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Our upcoming API provides direct access to core logistics, hardware verification, and automated marketplace escrow.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {apiFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const themeStyles = getFeatureColor(feature.color);
              
              return (
                <div 
                  key={index} 
                  className={`relative p-8 rounded-[2rem] border overflow-hidden group transition-all duration-300 hover:shadow-2xl ${isDarkMode ? 'bg-surface-900 border-white/10 hover:border-white/20' : 'bg-white border-slate-200 shadow-md hover:border-emerald-200'}`}
                >
                  {/* Subtle Gradient overlay */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${isDarkMode ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100' : 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 group-hover:opacity-100'} transition-opacity duration-500`} />
                  
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-transform duration-300 group-hover:scale-110 ${themeStyles.bg} ${themeStyles.border}`}>
                    <Icon className={`w-6 h-6 ${themeStyles.text}`} />
                  </div>
                  
                  <h4 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{feature.title}</h4>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── DEVELOPER FAQ ──────────────────────────────── */}
      <section className={`relative py-24 md:py-32 border-t ${isDarkMode ? 'border-white/5 bg-surface-950' : 'border-slate-200 bg-slate-50'}`}>
        <div className="max-w-[1000px] mx-auto px-6 relative z-10">
           <div className="text-center mb-16">
             <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-4 text-slate-500">Developer FAQ</h2>
             <h3 className={`text-3xl md:text-5xl font-black tracking-tighter mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Questions? We got answers.</h3>
           </div>

           <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
             {faqs.map((faq, idx) => (
               <div key={idx} className={`p-8 rounded-2xl border ${isDarkMode ? 'bg-[#0F172A] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                 <h4 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{faq.q}</h4>
                 <p className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{faq.a}</p>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* ── TECHNICAL CTA ────────────────────────────────────────────────── */}
      <section className={`py-24 px-6 border-t relative z-10 ${isDarkMode ? 'bg-emerald-800 border-white/5' : 'bg-emerald-600 border-emerald-500'}`}>
        <div className={`max-w-4xl mx-auto rounded-3xl border p-12 text-center relative overflow-hidden ${isDarkMode ? 'bg-surface-950 border-white/10' : 'bg-white border-slate-200 shadow-2xl'}`}>
           <div className={`absolute inset-0 bg-[size:24px_24px] ${isDarkMode ? 'bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]' : 'bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)]'}`} />
           <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full blur-[100px] pointer-events-none ${isDarkMode ? 'bg-primary/10' : 'bg-emerald-500/5'}`} />
           
           <div className="relative z-10">
              <h2 className={`text-3xl md:text-5xl font-black tracking-tighter mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Start building with Klinflow.
              </h2>
              <p className={`text-base md:text-lg font-medium mb-10 max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                 Create your free developer account today and start interacting with the world's first verified material ledger.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className={`px-8 py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 w-full sm:w-auto shadow-lg ${isDarkMode ? 'bg-white text-black hover:bg-slate-200 shadow-white/10' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'}`}>
                   Get API Keys <ArrowRight className="w-5 h-5" />
                </button>
                <button className={`px-8 py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 font-mono text-sm border w-full sm:w-auto ${isDarkMode ? 'bg-transparent border-white/20 text-white hover:bg-white/5' : 'bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                   View API Reference
                </button>
              </div>
           </div>
        </div>
      </section>
    </Layout>
  );
}
