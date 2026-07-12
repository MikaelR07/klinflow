import Header from '../components/Header';
import Footer from '../components/Footer';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useThemeStore();

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${isDarkMode ? 'bg-surface-950 text-slate-300 selection:bg-primary/30' : 'bg-surface-50 text-slate-600 selection:bg-primary/20'}`}>
      {/* Global Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute inset-0 ${isDarkMode ? 'opacity-[0.03] text-white' : 'opacity-[0.1] text-slate-900'}`}
          style={{
            backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(to right, currentColor 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />
        <div className={`absolute inset-0 bg-gradient-to-b ${isDarkMode ? 'from-surface-900/50 via-transparent to-surface-950' : 'from-white/50 via-transparent to-surface-50'}`} />
      </div>

      <Header />
      <main className="pt-20 relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
