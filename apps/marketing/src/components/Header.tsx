import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, ChevronRight,
  User, Truck, Building2, Warehouse,
} from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const productLinks = [
    { name: 'Resident / Seller App', desc: 'Post and sell your waste materials', path: '/products/client', icon: User, color: 'text-primary' },
    { name: 'Agent/Fleet App', desc: 'Locate and buy Materials', path: '/products/agent', icon: Truck, color: 'text-blue-500' },
    { name: 'Business App', desc: 'B2B marketplace for recyclers', path: '/products/B2B', icon: Building2, color: 'text-indigo-500' },
    { name: 'MOS Software', desc: 'Intake and processing system', path: '/products/hub', icon: Warehouse, color: 'text-rose-500' },
  ];

  const getPortalLink = (app: 'client' | 'agent' | 'business' | 'admin') => {
    if (import.meta.env.DEV) {
      const ports = { client: '5173', agent: '5174', business: '5175', admin: '5176' };
      return `http://localhost:${ports[app]}`;
    }
    return '#'; // Fallback for production if envs aren't set
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 pointer-events-none px-4 pt-4 flex flex-col items-center">
      {/* Top bar */}
      <div
        className={`pointer-events-auto transition-all duration-500 w-full lg:w-auto px-5 md:px-6 py-3 flex items-center justify-between gap-4 lg:gap-6 rounded-2xl ${
          scrolled || mobileMenuOpen
            ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-black/5 border border-slate-200/60'
            : 'bg-[#0a5d8f] backdrop-blur-md border border-white/10'
        }`}
      >
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <img src="/landing-page/app-logo.webp" alt="Klinflow Logo" fetchPriority="high" className="h-10 md:h-12 w-auto object-contain" />
          <span className="text-xl md:text-2xl font-bold tracking-wide text-lime-500">Klinflow</span>
        </Link>
        
        {/* Center: Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-5 xl:gap-6">
          <Link to="/products/client" className={`text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>Client App</Link>
          <Link to="/products/agent" className={`text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>Agent App</Link>
          <Link to="/products/B2B" className={`text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>B2B marketplace</Link>
          <Link to="/products/hub" className={`text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>MOS Hub</Link>
          <div className={`w-px h-4 ${scrolled ? 'bg-slate-200' : 'bg-white/20'}`} />
          <Link to="/about" className={`text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>About Us</Link>
          <Link to="/faq" className={`text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>FAQ</Link>
          <Link to="/contact" className={`text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>Contact Us</Link>
        </div>

        {/* Right: Actions */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all border shadow-sm cursor-pointer ${
              scrolled
                ? 'border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300'
                : 'border-white/25 text-white hover:bg-white/10 hover:border-white/40'
            }`}
          >
            Log In
          </button>
          <a className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all shadow-sm hover:-translate-y-0.5 ${
            scrolled
              ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/20 hover:shadow-primary/40'
              : 'bg-white text-[#085078] hover:bg-white/90 shadow-black/10'
          }`}>
            Register
          </a>
        </div>
          
        {/* Mobile Buttons */}
        <div className="flex lg:hidden items-center">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`transition-colors ${scrolled || mobileMenuOpen ? 'text-slate-900' : 'text-white'}`}>
            {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden pointer-events-auto w-full mt-2 rounded-2xl overflow-hidden border bg-white/95 backdrop-blur-xl border-slate-200/60 shadow-xl shadow-black/10"
          >
            <div className="p-6 space-y-8">
              <div className="flex gap-3">
                <button type="button" className="flex-1 text-center px-4 py-3 rounded-xl border text-sm font-bold transition-colors block bg-white border-slate-200 text-slate-900 hover:bg-slate-50 cursor-pointer">
                  Log In
                </button>
                <a  className="flex-1 text-center px-4 py-3 rounded-xl text-sm font-bold bg-primary text-white shadow-sm">
                  Register
                </a>
              </div>

              <div className="grid gap-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Our Products</p>
                {productLinks.map((link) => (
                  <Link key={link.path} to={link.path} className="flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center shrink-0 bg-slate-100">
                      <link.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${link.color}`} />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-slate-900">{link.name}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight">{link.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-6 border-t border-slate-100">
                <Link to="/about" className="px-3 py-3 rounded-md border text-[11px] sm:text-sm font-bold flex items-center justify-between transition-all bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100">
                  <span>About Us</span> <ChevronRight className="w-4 h-4 text-primary" />
                </Link>
                <Link to="/faq" className="px-3 py-3 rounded-md border text-[11px] sm:text-sm font-bold flex items-center justify-between transition-all bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100">
                  <span>FAQ</span> <ChevronRight className="w-4 h-4 text-primary" />
                </Link>
                <Link to="/contact" className="col-span-2 px-3 py-3 rounded-md border text-[11px] sm:text-sm font-bold flex items-center justify-between transition-all bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100">
                  <span>Contact Us</span> <ChevronRight className="w-4 h-4 text-primary" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
