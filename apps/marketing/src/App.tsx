import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

import Home from './pages/Home';

// Lazy loading secondary pages to reduce initial JavaScript bundle size
const Contact = lazy(() => import('./pages/Contact'));
const ProductClient = lazy(() => import('./pages/ProductClient'));
const ProductAgent = lazy(() => import('./pages/ProductAgent'));
const ProductB2B = lazy(() => import('./pages/ProductB2B'));
const ProductHub = lazy(() => import('./pages/ProductHub'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const FAQ = lazy(() => import('./pages/FAQ'));

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
            <Route path="/contact" element={<Contact />} />
            <Route path="/products/client" element={<ProductClient />} />
            <Route path="/products/agent" element={<ProductAgent />} />
            <Route path="/products/B2B" element={<ProductB2B />} />
            <Route path="/products/fleet" element={<Navigate to="/products/B2B" replace />} />
            <Route path="/products/hub" element={<ProductHub />} />
            <Route path="/marketplace" element={<ProductB2B />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/faq" element={<FAQ />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
