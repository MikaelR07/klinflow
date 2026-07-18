import Header from '../components/Header';
import Footer from '../components/Footer';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useThemeStore();

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${isDarkMode ? 'bg-surface-950 text-slate-300' : 'bg-surface-50 text-slate-600'} selection:bg-primary/30`}>

      <Header />
      <main className="pt-20 relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
