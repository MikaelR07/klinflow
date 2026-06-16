import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, Maximize2, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import Layout from '../layouts/Layout';

const allImages = [
  "admin-dashboard.webp",
  "agent-dashboard.webp",
  "agent-home.webp",
  "arrival-detail.webp",
  "book-pickup.webp",
  "business-home.webp",
  "collection-method.webp",
  "company-owner-homepage.webp",
  "Hub-home.webp",
  "impact-analysis.webp",
  "offer-review.webp",
  "post-info.webp",
  "post-summary.webp",
  "resident-home.webp",
  "route-optimizer.webp",
  "seller-home.webp",
  "visualproof.webp"
];

const formatTitle = (filename: string) => {
  return filename
    .replace('.webp', '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export default function EcosystemGallery() {
  const { isDarkMode } = useThemeStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <Layout>
      <div className={`min-h-screen pt-24 md:pt-16 pb-24 ${isDarkMode ? 'bg-surface-950' : 'bg-surface-50'}`}>
        
        {/* HERO SECTION */}
        <div className="max-w-[1400px] mx-auto px-6 mb-12 relative">
          
          <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs mb-8 hover:-translate-x-1 transition-transform relative z-10">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}
              >
                <Sparkles className="w-3 h-3 text-primary" />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Product Showcase
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              >
                Ecosystem{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Gallery.</span>
              </motion.h1>
            </div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-sm md:text-base font-medium leading-relaxed max-w-lg md:mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
            >
              Explore the interfaces powering the circular economy. From resident pickup booking to global logistics administration.
            </motion.p>
          </div>
        </div>

        {/* MASONRY GALLERY */}
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
            {allImages.map((filename, idx) => {
              const title = formatTitle(filename);
              return (
                <motion.div
                  key={filename}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: (idx % 10) * 0.05 }}
                  viewport={{ once: true }}
                  className="break-inside-avoid relative group cursor-pointer"
                  onClick={() => setSelectedImage(filename)}
                >
                  <div className={`rounded-2xl border overflow-hidden relative transition-all duration-500 shadow-lg ${isDarkMode ? 'border-white/10 bg-white/5 group-hover:shadow-primary/20 group-hover:border-primary/50' : 'border-slate-200 bg-white group-hover:shadow-2xl group-hover:border-primary/30'}`}>
                    
                    <img 
                      src={`/grid/${filename}`} 
                      alt={title}
                      loading="lazy"
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Elegant Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                      <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <h3 className="text-white font-bold text-lg md:text-xl mb-1">{title}</h3>
                        <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-4">View Interface</p>
                        
                        <div className="w-10 h-10 rounded-full bg-primary/90 text-white flex items-center justify-center backdrop-blur-md">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LIGHTBOX OVERLAY */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10 z-50"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-w-4xl w-full flex flex-col items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full flex items-center justify-center overflow-hidden rounded-2xl">
                <img 
                  src={`/grid/${selectedImage}`} 
                  alt={formatTitle(selectedImage)} 
                  className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10" 
                />
              </div>
              
              <div className="mt-6 text-center bg-black/50 px-6 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
                 <h3 className="text-base md:text-lg font-bold text-white tracking-tight">{formatTitle(selectedImage)}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
