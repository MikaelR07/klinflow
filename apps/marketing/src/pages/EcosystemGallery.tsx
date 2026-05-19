import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Search, Zap, 
  Layout as LayoutIcon, Smartphone,
  Monitor, Brain, ShieldCheck,
  TrendingUp, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@klinflow/core';
import Layout from '../layouts/Layout';

const allScreenshots = [
  { 
    src: '/grid/route-optimizer.png', 
    title: 'Tactical Navigation',
    category: 'Logistics',
    desc: 'Agent HUD with AI-optimized multi-stop routing and real-time pickup telemetry.' 
  },
  { 
    src: '/grid/visualproof.png', 
    title: 'HygeneX Vision Scan',
    category: 'Intelligence',
    desc: 'AI-powered material grading and purity verification for instant asset valuation.' 
  },
  { 
    src: '/grid/book-pickup.png', 
    title: 'Mission Request',
    category: 'Consumer',
    desc: 'Streamlined waste categorization and collection scheduling for residents.' 
  },
  { 
    src: '/grid/arrival-detail.png', 
    title: 'Agent Verification',
    category: 'Logistics',
    desc: 'On-site terminal for weight verification and material grade confirmation.' 
  },
  { 
    src: '/grid/post-info.png', 
    title: 'B2B Trade Listing',
    category: 'Marketplace',
    desc: 'Advanced data entry for bulk material sales including grade and moisture parameters.' 
  },
  { 
    src: '/grid/offer-review.png', 
    title: 'Escrow Negotiation',
    category: 'Financial',
    desc: 'Transparent bidding and fund release system for large-scale material trades.' 
  },
  { 
    src: '/grid/post-summary.png', 
    title: 'Mission Settlement',
    category: 'Financial',
    desc: 'Digital receipts and automated wallet payouts upon successful collection.' 
  },
  { 
    src: '/grid/impact-analysis.png', 
    title: 'Sustainomics Analytics',
    category: 'Intelligence',
    desc: 'Deep-dive environmental impact metrics and historical trade performance.' 
  },
  { 
    src: '/grid/collection-method.png', 
    title: 'Logistics Strategy',
    category: 'Logistics',
    desc: 'Dynamic selection between agent pickup and self-service hub drop-offs.' 
  },
];

export default function EcosystemGallery() {
  const { isDarkMode } = useThemeStore();
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <Layout>
      <div className={`min-h-screen pt-24 md:pt-32 pb-20 md:pb-40 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          
          <Link to="/" className="inline-flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-xs mb-8 hover:translate-x-[-4px] transition-transform">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="max-w-3xl mb-24">
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              The Product <br className="hidden sm:block" />
              <span className="text-emerald-500 italic">Suite.</span>
            </h1>
            <p className={`text-base md:text-xl font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Explore the technical infrastructure defining the next generation of circular recovery. From household intake to industrial settlement.
            </p>
          </div>

          <div className="columns-2 sm:columns-2 lg:columns-3 gap-4 md:gap-8 space-y-4 md:space-y-8">
            {allScreenshots.map((shot, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="break-inside-avoid"
              >
                <div 
                  onClick={() => setSelectedImage(shot)}
                  className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-500 ${
                    isDarkMode ? 'border-white/5 bg-slate-900' : 'border-slate-200 bg-white shadow-xl hover:shadow-2xl'
                  }`}
                >
                  <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-white border border-white/20">
                      {shot.category}
                    </span>
                  </div>

                  <img 
                    src={shot.src} 
                    alt={shot.title} 
                    loading="lazy"
                    className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105" 
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-8 flex flex-col justify-end">
                    <h4 className="text-xl font-bold text-white mb-2">{shot.title}</h4>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed mb-6">{shot.desc}</p>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                          <Search className="w-5 h-5" />
                       </div>
                       <span className="text-xs font-bold text-white uppercase tracking-widest">Enlarge Preview</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/98 backdrop-blur-2xl p-6"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-3xl w-full max-h-[70vh] flex flex-col items-center"
          >
            <img 
              src={selectedImage.src} 
              alt={selectedImage.title} 
              className="max-w-full max-h-[50vh] object-contain rounded-2xl shadow-2xl border-4 border-white/10" 
            />
            
            <div className="mt-6 text-center max-w-xl px-4">
               <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] mb-2 block">{selectedImage.category}</span>
               <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tighter">{selectedImage.title}</h3>
               <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">{selectedImage.desc}</p>
            </div>

            <button 
              className="absolute top-0 -right-12 text-white/50 hover:text-white transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <Zap className="w-8 h-8 rotate-12" />
            </button>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
