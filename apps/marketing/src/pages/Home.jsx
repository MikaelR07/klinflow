import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, ArrowRight, ChevronRight, 
  Search, Shield, Recycle, Handshake, 
  Truck, Layout as LayoutIcon, Briefcase, 
  LineChart, User, Building2, Package, Warehouse,
  ExternalLink, Brain
} from 'lucide-react';
import { useThemeStore } from '@cleanflow/core';
import Layout from '../layouts/Layout';
import DownloadSection from '../components/DownloadSection';
import GlassMockup from '../components/GlassMockup';

// ── CORE LOOP DATA ──────────────────────────────────────────────────
const loopSteps = [
  { id: 1, title: 'Post Waste', desc: 'Residents schedule pickups via Client App.', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 2, title: 'Collect & Verify', desc: 'Agents verify weight and grade via Agent App.', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 3, title: 'Instant Payout', desc: 'Sustainomics engine triggers escrow release.', icon: Handshake, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { id: 4, title: 'Hub Intake', desc: 'Materials processed and sold at scale via Hub App.', icon: Warehouse, color: 'text-rose-500', bg: 'bg-rose-500/10' },
];

const appCards = [
  { 
    title: 'Client Dashboard', 
    desc: 'Household waste management & B2B seller listings.', 
    img: '/placeholder-images/grid-images/seller-home.webp',
    path: '/products/client',
    icon: User,
    color: 'emerald'
  },
  { 
    title: 'Agent Terminal', 
    desc: 'Mission control for independent agents and fleet drivers.', 
    img: '/placeholder-images/grid-images/agent-home.webp',
    path: '/products/agent',
    icon: Truck,
    color: 'blue'
  },
  { 
    title: 'Fleet Admin', 
    desc: 'B2B management for recycling centers and fleet companies.', 
    img: '/placeholder-images/grid-images/business-home.webp',
    path: '/products/fleet',
    icon: Building2,
    color: 'indigo'
  },
  { 
    title: 'Hub Command', 
    desc: 'Industrial-grade intake and material processing system.', 
    img: '/placeholder-images/grid-images/Hub-home.webp',
    path: '/products/hub',
    icon: Warehouse,
    color: 'rose'
  }
];

export default function Home() {
  const { isDarkMode } = useThemeStore();
  const [selectedImage, setSelectedImage] = useState(null);

  const screenshots = [
    { src: '/placeholder-images/grid-images/agent-home.webp', alt: 'Agent Terminal - Tactical Mission Control' },
    { src: '/placeholder-images/grid-images/seller-home.webp', alt: 'Merchant Dashboard - Marketplace Trade Hub' },
    { src: '/placeholder-images/grid-images/book-pickup.webp', alt: 'Resident Terminal - Mission Request Interface' },
    { src: '/placeholder-images/grid-images/business-home.webp', alt: 'B2B Business Portal - Bulk Material Sourcing' },
    { src: '/placeholder-images/grid-images/Resident-home.webp', alt: 'Resident Dashboard - Household Waste Management' },
    { src: '/placeholder-images/grid-images/Hub-home.webp', alt: 'Hub Command Center - Industrial Intake' },
    { src: '/placeholder-images/grid-images/admin-dashboard.webp', alt: 'System Administration - Global Network Stats' },
    { src: '/placeholder-images/grid-images/company-owner-home.webp', alt: 'Fleet Admin - Logistics Company Management' },
    { src: '/placeholder-images/grid-images/agent-dashboard.webp', alt: 'Agent Analytics - Performance & Earnings Tracking' },
  ];

  return (
    <Layout>
      {/* HERO SECTION: Data-Dense ─────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden min-h-[70vh] md:min-h-[85vh] flex items-center">
        {/* Local Glowing Blurs Only (Grid is now in Layout) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500 rounded-full blur-[150px]"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8 ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}
          >
            <Zap className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500">The Infrastructure for Circular Assets</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-8 max-w-5xl mx-auto leading-[1.1] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
          >
            Technical infrastructure defining <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500">the next generation of circular recovery.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`max-w-3xl mx-auto text-base md:text-xl font-medium leading-relaxed mb-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
          >
            AI-powered coordination for waste collectors, recyclers, and material recovery networks.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link to="/ecosystem" className="w-full sm:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 active:scale-95 text-sm uppercase tracking-widest">
              Enter the Ecosystem <ChevronRight className="w-5 h-5" />
            </Link>
            <Link to="/system" className={`w-full sm:w-auto px-10 py-5 border rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'}`}>
              System Architecture <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>


        </div>
      </section>

      {/* ── STRATEGIC VISION ────────────────────────────────────── */}
      <section id="vision" className={`py-16 md:py-32 px-6 relative overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-900 border-b border-white/5' : 'bg-white border-b border-slate-200'}`}>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] blur-[150px] rounded-full bg-emerald-500/5 pointer-events-none`} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-6 font-mono">The Thesis</h2>
              <h3 className={`text-2xl sm:text-3xl md:text-5xl font-black mb-8 tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                A Future Where <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 italic">Waste is an Asset.</span>
              </h3>
              <p className={`text-lg font-medium leading-relaxed mb-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                CleanFlow is more than an app—it is the digital foundation for a circular society. By integrating real-time telemetry, automated rewards, and industrial marketplaces, we are transforming waste into a high-value digital asset.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: "Traceability", val: "100%", sub: "Source to Recycler" },
                  { label: "Rewards", val: "Instant", sub: "Digital Payouts" },
                  { label: "AI Operations", val: "24/7", sub: "Predictive Analytics" }
                ].map((stat, i) => (
                  <div key={i} className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-2xl font-black text-emerald-500 mb-1">{stat.val}</div>
                    <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{stat.label}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>

              <div className="hidden lg:block">
                <GlassMockup color="emerald" icon={Recycle} isDarkMode={isDarkMode} />
              </div>
          </div>
        </div>
      </section>

      {/* ── THE CORE SYSTEM LOOP ─────────────────────────────────────────── */}
      <section className={`py-16 md:py-32 px-6 ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20">
            <div className="max-w-2xl text-left">
              <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-500 mb-6">The System Lifecycle</h2>
              <h3 className={`text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                A Trust-Less, <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 italic">Self-Liquidating Ledger.</span>
              </h3>
            </div>
            <p className={`text-base md:text-lg font-medium max-w-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Every transaction in CleanFlow is verified by AI and settled instantly, creating a friction-free circular economy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loopSteps.map((step) => (
              <div 
                key={step.id} 
                className={`p-8 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/50 border-white/5 hover:border-emerald-500/20' : 'bg-slate-50 border-slate-100 hover:border-emerald-500/20 shadow-sm'}`}
              >
                <div className={`w-12 h-12 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center mb-6`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <h4 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{step.title}</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORE PRODUCT SUITE: MASONRY GRID ──────────────────────────────────── */}
      <section className={`py-16 md:py-32 relative z-10 ${isDarkMode ? 'bg-slate-950/50' : 'bg-slate-50/50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-20 text-left">
            <div className={`text-xs font-bold uppercase tracking-[0.3em] mb-4 ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>The Ecosystem</div>
            <h3 className={`text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Native Product Suite</h3>
          </div>

          {/* MASONRY GRID IMPLEMENTATION */}
          <div className="columns-2 md:columns-2 lg:columns-3 gap-3 md:gap-6 space-y-3 md:space-y-6">
            {screenshots.map((shot, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`break-inside-avoid ${idx > 3 ? 'hidden md:block' : ''}`}
              >
                <div 
                  onClick={() => setSelectedImage(shot)}
                  className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-500 ${isDarkMode ? 'border-white/5 bg-slate-900' : 'border-slate-200 bg-white shadow-xl hover:shadow-2xl'}`}
                >
                  <img 
                    src={shot.src} 
                    alt={shot.alt} 
                    loading="lazy"
                    className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.02]" 
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors duration-500 flex items-center justify-center">
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/20">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <Link 
              to="/gallery" 
              className={`group px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 ${
                isDarkMode 
                  ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' 
                  : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 shadow-lg hover:shadow-xl'
              }`}
            >
              View Suite Gallery 
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── HYGENEX AI: Material Valuation ───────────────────────────────── */}
      <section className={`py-40 px-6 relative overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-500 font-bold uppercase tracking-widest text-[10px] mb-6">
              <Brain className="w-5 h-5" /> The Sustainomics Engine
            </div>
            <h3 className={`text-3xl md:text-5xl font-bold mb-8 tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              The Oracle of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 italic">Material Value.</span>
            </h3>
            <p className={`text-xl font-medium leading-relaxed mb-12 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              HygeneX is our proprietary AI engine that powers the entire ecosystem. It identifies 50+ material types, grades quality instantly, and provides a real-time "Oracle" price for every gram you collect.
            </p>

            <div className="grid gap-4">
              {[
                { title: "Residents schedule pickups, receive weight-based valuation, and track payouts in real time via GreenFlow Points", icon: Shield },
                { title: "Agents leverage AI grading and multi-stop route optimization to maximize hourly commission yield.", icon: LineChart },
                { title: "Industrial buyers secure large material lots through transparent B2B escrow and logistics tracking.", icon: Handshake },
              ].map((f, i) => (
                <div key={i} className={`p-6 rounded-3xl border flex gap-6 items-start ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-slate-500 font-semibold leading-relaxed">{f.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Abstract System Map Visualization (Placeholder for actual diagram) */}
          <div className="relative hidden lg:block">
             <div className="aspect-square rounded-[4rem] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 relative flex items-center justify-center overflow-hidden group">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 opacity-[0.03]" 
                  style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
                />
                <div className="w-40 h-40 rounded-[2.5rem] bg-indigo-600 shadow-[0_0_50px_rgba(79,70,229,0.3)] flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                  <Brain className="w-20 h-20 text-white" />
                </div>
                {/* Orbital Nodes */}
                {[0, 90, 180, 270].map((angle, i) => (
                  <motion.div 
                    key={i}
                    animate={{ rotate: [angle, angle + 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div 
                      style={{ transform: `translateY(-160px)` }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl"
                    >
                      <Recycle className="w-5 h-5 text-indigo-400" />
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>
      </section>


      {/* ── CONVERSION CTA ────────────────────────────────────────────────── */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-emerald-600' : 'bg-emerald-500'}`} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 text-white">
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8">Ready to <br /> Scale with Us?</h2>
          <p className="text-xl md:text-2xl font-medium mb-12 opacity-80 leading-relaxed">
            Join the network that is defining the next generation of circular logistics. Deploy your fleet, process your waste, or trade verified assets at scale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="px-12 py-6 bg-white text-emerald-600 font-bold rounded-2xl shadow-2xl hover:scale-105 transition-all active:scale-95 text-lg">
              Contact Enterprise Sales
            </button>
            <button className="px-12 py-6 bg-emerald-700/50 text-white border border-white/20 backdrop-blur-md font-bold rounded-2xl hover:bg-emerald-700/70 transition-all text-lg">
              Download Investor Deck
            </button>
          </div>
        </div>
      </section>
      {/* LIGHTBOX MODAL */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-3xl w-full max-h-[60vh] flex items-center justify-center"
          >
            <img 
              src={selectedImage.src} 
              alt={selectedImage.alt} 
              className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-2xl border-4 border-white/10" 
            />
            <button 
              className="absolute -top-12 right-0 text-white flex items-center gap-2 font-bold uppercase tracking-widest text-xs hover:text-emerald-500 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              Close Preview <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
