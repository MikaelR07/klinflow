import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen transition-colors duration-500 relative overflow-hidden bg-surface-50 text-slate-600 selection:bg-primary/30">

      <Header />
      <main className="relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
