import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf } from 'lucide-react';

const slides = [
  {
    image: '/welcome/pageOne.webp',
    title: <>Turn your Recyclables <br/> into <span className="text-emerald-300">Money.</span></>,
    subtitle: 'Every material you trade has a destination, a value and an impact. We turn your materials into opportunities to earn!',
  },
  {
    image: '/welcome/pageTwo.webp',
    title: <>One platform. <br/> <span className="text-emerald-400">An entire ecosystem.</span></>,
    subtitle: 'Klinflow connects sellers,agents, businesses, hubs and recyclers through one intelligent digital platform.',
  },
  {
    image: '/welcome/pageThree.webp',
    title: <>Turn activity <br/> <span className="text-emerald-400">into value.</span></>,
    subtitle: 'Track your impact, earn rewards and power a whole network of sustainable collectors, Your impact matters',
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const dragStartX = useRef(0);

  const nextSlide = () => {
    if (currentSlide < 2) {
      setCurrentSlide(prev => prev + 1);
    } else {
      navigate('/role-selection');
    }
  };

  const handleDragStart = (_: any, info: any) => {
    dragStartX.current = info.point.x;
  };

  const handleDragEnd = (_: any, info: any) => {
    const delta = info.point.x - dragStartX.current;
    const threshold = 50;
    if (delta < -threshold && currentSlide < 2) {
      setCurrentSlide(prev => prev + 1);
    } else if (delta > threshold && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="flex flex-col bg-[#06241c] h-[100dvh] fixed inset-0 w-full max-w-lg mx-auto relative overflow-hidden font-sans">
      
      {/* ── HEADER (Klinflow Logo) ── */}
      <div className="absolute top-0 left-0 right-0 z-50 px-6 pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)] pb-4">
        <div className="flex items-center gap-2">
          <Leaf className="w-8 h-8 text-emerald-500 fill-emerald-500" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white leading-none tracking-tight">Klinflow</span>
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mt-1">Circular Economy. Real Value.</span>
          </div>
        </div>
      </div>

      {/* ── SLIDES TRACK (all 3 slides rendered side-by-side, translated together) ── */}
      <motion.div
        className="absolute inset-0 flex w-[300%]"
        animate={{ x: `${-currentSlide * (100 / 3)}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="relative w-1/3 h-full flex-shrink-0 bg-emerald-700"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={slide.image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-contain object-top"
                draggable={false}
              />
            </div>

            {/* Bottom Text Area */}
            <div className="absolute bottom-[15%] left-0 right-0 px-6 z-10">
              <h1 className="text-3xl font-black text-white leading-[1.15] mb-2 tracking-tight">
                {slide.title}
              </h1>
              <p className="text-sm text-white font-medium max-w-[300px] leading-relaxed">
                {slide.subtitle}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── SHARED BOTTOM FOOTER ── */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pt-20 pb-8 px-6 bg-gradient-to-t from-emerald-800 to-transparent pointer-events-none">
        
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-5 pointer-events-auto">
          {[0, 1, 2].map((i) => (
            <button 
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentSlide === i 
                  ? 'w-6 bg-emerald-500' 
                  : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Action Button & Login */}
        <div className="space-y-3 pointer-events-auto">
          <button
            onClick={nextSlide}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            {currentSlide === 2 ? 'Get Started' : 'Next'} <ArrowRight className="w-5 h-5" />
          </button>

          {/* Login Link */}
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm font-medium text-slate-300">Already have an account?</span>
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Log In
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
