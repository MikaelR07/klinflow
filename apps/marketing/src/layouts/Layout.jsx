import Header from '../components/Header';
import Footer from '../components/Footer';
import { useThemeStore } from '@cleanflow/core';

export default function Layout({ children }) {
  const { isDarkMode } = useThemeStore();

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${isDarkMode ? 'bg-slate-950 text-slate-100 selection:bg-emerald-500/30' : 'bg-white text-slate-900 selection:bg-emerald-500/20'}`}>
      {/* Global Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className={`absolute inset-0 opacity-[0.03] ${isDarkMode ? 'text-emerald-500' : 'text-emerald-900'}`} 
          style={{ 
            backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(to right, currentColor 1px, transparent 1px)`, 
            backgroundSize: '60px 60px' 
          }} 
        />
        <div className={`absolute inset-0 bg-gradient-to-b ${isDarkMode ? 'from-emerald-500/5 via-transparent to-slate-950' : 'from-emerald-500/5 via-transparent to-white'}`} />
      </div>

      <Header />
      <main className="pt-20 relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
