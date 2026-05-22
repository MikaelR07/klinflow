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
    { name: 'Resident / Seller App', desc: 'Household waste & B2B listings', path: '/products/client', icon: User, color: 'text-primary' },
    { name: 'Agent Terminal', desc: 'Mission control for collectors', path: '/products/agent', icon: Truck, color: 'text-blue-500' },
    { name: 'Fleet Manager', desc: 'Admin dashboard for company owners', path: '/products/fleet', icon: Building2, color: 'text-indigo-500' },
    { name: 'Hub Logistics', desc: 'Intake and processing system', path: '/products/hub', icon: Warehouse, color: 'text-rose-500' },
  ];

  const getPortalLink = (app: 'client' | 'agent' | 'business' | 'admin') => {
    if (import.meta.env.DEV) {
      const ports = { client: '5173', agent: '5174', business: '5175', admin: '5176' };
      return `http://localhost:${ports[app]}`;
    }
    return '#'; // Fallback for production if envs aren't set
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled || mobileMenuOpen ? (isDarkMode ? 'bg-surface-950/95 border-white/5' : 'bg-white/95 border-slate-200') + ' backdrop-blur-xl border-b py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className={`text-xl font-bold tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Klinflow</span>
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

          <Link to="/system" className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>System</Link>
          <Link to="/marketplace" className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Marketplace</Link>
          
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
                  <Link key={link.path} to={link.path} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <link.icon className={`w-5 h-5 ${link.color}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{link.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{link.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className={`flex flex-col gap-3 pt-8 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <Link to="/system" className={`px-5 py-3.5 rounded-xl border text-sm font-bold flex items-center justify-between transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100'}`}>
                  System Architecture <ChevronRight className="w-4 h-4 text-primary" />
                </Link>
                <Link to="/marketplace" className={`px-5 py-3.5 rounded-xl border text-sm font-bold flex items-center justify-between transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100'}`}>
                  B2B Marketplace <ChevronRight className="w-4 h-4 text-primary" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
