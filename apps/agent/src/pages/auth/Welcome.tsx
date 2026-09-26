import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Truck } from 'lucide-react';

const slides = [
  {
    image: '/welcome/welcome1.webp',
    title: <>Your Direct <br/> <span className="text-emerald-500">Marketplace.</span></>,
    subtitle: 'Connect directly to a thriving marketplace to access, request, and trade recyclable materials effortlessly.',
  },
  {
    image: '/welcome/welcome2.webp',
    title: <>All The Materials <br/> <span className="text-emerald-500">You Need.</span></>,
    subtitle: 'From plastics, metals, Papers and more, gain instant access to a diverse range of graded materials.',
  },
  {
    image: '/welcome/welcome3.webp',
    title: <>Built for <br/> <span className="text-emerald-500">Every Agent.</span></>,
    subtitle: 'Whether you\'re an independent agent, a fleet driver, or a company owner needing full operational overview, Klinflow adapts to you.',
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < 2) {
      setCurrentSlide(prev => prev + 1);
    } else {
      navigate('/role-selection');
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 h-[100dvh] fixed inset-0 w-full max-w-lg mx-auto relative overflow-hidden font-sans">
      
      {/* ── HEADER (Logo & Pagination) ── */}
      <div className="absolute top-0 left-0 right-0 z-50 px-6 pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)] pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            {currentSlide > 0 && (
              <button 
                onClick={() => setCurrentSlide(prev => prev - 1)}
                className="w-10 h-10 shrink-0 rounded-full bg-slate-900/10 dark:bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-slate-900/20 transition-all active:scale-95 animate-in fade-in zoom-in duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
              </button>
            )}
            <div className="flex items-center gap-2">
             
              {currentSlide === 0 && (
                <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-xl font-bold text-slate-900 dark:text-white leading-none tracking-tight">Klinflow Agent</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Logistics & Dispatch</span>
                </div>
              )}
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <button 
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === i 
                    ? 'w-5 bg-emerald-500' 
                    : 'w-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── SLIDES TRACK ── */}
      <motion.div
        className="absolute inset-0 flex w-[300%]"
        animate={{ x: `${-currentSlide * (100 / 3)}%` }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.4 }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="relative w-1/3 h-full flex flex-col bg-white dark:bg-slate-900"
          >
            {/* Top Image Section */}
            <div className="flex-1 w-full relative z-0">
              <img
                src={slide.image}
                alt={`Slide ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover object-top"
                draggable={false}
              />
            </div>

            {/* Bottom Text Section */}
            <div className="w-full bg-white dark:bg-slate-900 px-6 pt-4 pb-[130px] relative z-20 rounded-t-xl -mt-[30px] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
              <h1 className="text-[28px] font-black text-slate-900 dark:text-white leading-[1.15] mb-2 tracking-tight">
                {slide.title}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-[400px] leading-relaxed">
                {slide.subtitle}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── SHARED BOTTOM FOOTER ── */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pb-8 px-6 pointer-events-none">
        {/* Action Button & Login */}
        <div className="space-y-3 pointer-events-auto">
          <button
            onClick={nextSlide}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            {currentSlide === 2 ? 'Get Started' : 'Next'} <ArrowRight className="w-5 h-5" />
          </button>

          {/* Login Link */}
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Already an Agent?</span>
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
            >
              Log In
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
