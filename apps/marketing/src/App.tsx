import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

// Lazy loading all pages to dramatically reduce initial JavaScript bundle size
const Home = lazy(() => import('./pages/Home'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const ProductClient = lazy(() => import('./pages/ProductClient'));
const ProductAgent = lazy(() => import('./pages/ProductAgent'));
const ProductFleet = lazy(() => import('./pages/ProductFleet'));
const ProductHub = lazy(() => import('./pages/ProductHub'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Ecosystem = lazy(() => import('./pages/Ecosystem'));
const EcosystemGallery = lazy(() => import('./pages/EcosystemGallery'));
const ForResidents = lazy(() => import('./pages/ForResidents'));
const ForAgents = lazy(() => import('./pages/ForAgents'));
const ForBusinesses = lazy(() => import('./pages/ForBusinesses'));

const Loader = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-slate-900 text-white selection:bg-emerald-500/30">
        <Toaster position="top-right" expand={false} richColors />
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/system" element={<HowItWorks />} />
            <Route path="/products/client" element={<ProductClient />} />
            <Route path="/products/agent" element={<ProductAgent />} />
            <Route path="/products/fleet" element={<ProductFleet />} />
            <Route path="/products/hub" element={<ProductHub />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/ecosystem" element={<Ecosystem />} />
            <Route path="/gallery" element={<EcosystemGallery />} />
            <Route path="/for-residents" element={<ForResidents />} />
            <Route path="/for-agents" element={<ForAgents />} />
            <Route path="/for-businesses" element={<ForBusinesses />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
