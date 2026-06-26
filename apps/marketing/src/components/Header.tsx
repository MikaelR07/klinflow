import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Leaf, ChevronDown, ChevronRight,
  User, Truck, Building2, Warehouse,
  Sun, Moon, Globe
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useThemeStore();
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
    { name: 'Fleet Manager', desc: 'Admin dashboard for company owners', path: '/products/fleet', icon: Building2, color: 'text-indigo-500' },
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isDarkMode ? 'bg-surface-950 border-white/5' : 'bg-surface-50 border-slate-200'} border-b ${scrolled || mobileMenuOpen ? 'py-4 shadow-sm' : 'py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center group-hover:scale-110 transition-transform">
            <img src="/landing-page/app-logo.webp" alt="Klinflow Logo" className="h-14 w-auto object-contain -my-2" />
          </div>
          <span className={`text-2xl font-bold tracking-tighter ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Klinflow</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <div className="relative group">
            <button 
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
              className={`flex items-center gap-1 text-sm font-semibold transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Products <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${productsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {productsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onMouseEnter={() => setProductsOpen(true)}
                  onMouseLeave={() => setProductsOpen(false)}
                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[480px] p-4 rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-surface-950 border-white/5' : 'bg-white border-slate-100'}`}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {productLinks.map((link) => (
                      <Link 
                        key={link.path} 
                        to={link.path}
                        className={`p-4 rounded-2xl transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <link.icon className={`w-5 h-5 ${link.color}`} />
                          <span className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{link.name}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{link.desc}</p>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/ecosystem" className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Klin API</Link>
          <Link to="/marketplace" className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Marketplace</Link>
          <Link to="/contact" className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Contact</Link>
          
          <div className="flex items-center gap-4 ml-4">
            <button onClick={toggleTheme} className={`p-2.5 rounded-full transition-colors ${isDarkMode ? 'bg-surface-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Buttons */}
        <div className="flex md:hidden items-center gap-4">
          <button onClick={toggleTheme} className={`p-2 rounded-full ${isDarkMode ? 'text-yellow-400' : 'text-slate-700'}`}>
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={isDarkMode ? 'text-white' : 'text-slate-900'}>
            {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden overflow-hidden border-b ${isDarkMode ? 'bg-surface-950 border-white/5' : 'bg-white border-slate-200'}`}
          >
            <div className="p-6 space-y-8">
              <div className="grid gap-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Our Products</p>
                {productLinks.map((link) => (
                  <Link key={link.path} to={link.path} className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <link.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${link.color}`} />
                    </div>
                    <div>
                      <p className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{link.name}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight">{link.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className={`grid grid-cols-2 gap-2 pt-6 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <Link to="/ecosystem" className={`px-3 py-3 rounded-xl border text-[11px] sm:text-sm font-bold flex items-center justify-between transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100'}`}>
                  <span>Klin API</span> <ChevronRight className="w-4 h-4 text-primary" />
                </Link>
                <Link to="/marketplace" className={`px-3 py-3 rounded-xl border text-[11px] sm:text-sm font-bold flex items-center justify-between transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100'}`}>
                  <span>Marketplace</span> <ChevronRight className="w-4 h-4 text-primary" />
                </Link>
                <Link to="/contact" className={`col-span-2 px-3 py-3 rounded-xl border text-[11px] sm:text-sm font-bold flex items-center justify-between transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100'}`}>
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
