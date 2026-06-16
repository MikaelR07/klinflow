import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Home, CalendarPlus, Package, Brain, Gauge, MoreHorizontal, Plus, ShieldCheck, Handshake, CircleFadingPlus } from 'lucide-react';

import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useNotificationStore, NOTIFICATION_TYPES } from '@klinflow/core/stores/notificationStore';
import { useSystemStore } from '@klinflow/core/stores/systemStore';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { usePWA } from '@klinflow/core/hooks/usePWA';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { supabase } from '@klinflow/supabase';
import { ROLES } from '@klinflow/constants';
import Navbar from '@klinflow/ui/components/Navbar';
import BottomNav from '@klinflow/ui/components/BottomNav';
import ProtectedRoute from '@klinflow/ui/components/ProtectedRoute';
import VoiceBookingModal from '@klinflow/ui/components/VoiceBookingModal';
import NEMAReportModal from '@klinflow/ui/components/NEMAReportModal';
import { LoadingScreen } from '@klinflow/ui/components/Loading';
import PWAInstallModal from '@klinflow/ui/components/PWAInstallModal';
import { Toaster, toast } from 'sonner';
import { OfflineBanner } from '@klinflow/ui';

// Components
import WeightVerificationModal from './components/user/WeightVerificationModal';

import { getResidentRoutes } from './features/resident/routes/ResidentRoutes';
import { getSellerRoutes } from './features/seller/routes/SellerRoutes';
import { getCommunityRoutes } from './features/community/routes/CommunityRoutes';
import { getSettingsRoutes } from './features/settings/routes/SettingsRoutes';

// Pages rendered outside MobileLayout (no bottom nav)
const HygeneXPage = lazy(() => import('./pages/shared/HygeneXPage'));
const RFQDetailsPage = lazy(() => import('./pages/user/RFQDetailsPage'));
const FulfillmentTrackingPage = lazy(() => import('./pages/user/FulfillmentTrackingPage'));
const SubmittedQuoteDetailsPage = lazy(() => import('./pages/user/SubmittedQuoteDetailsPage'));

// Auth Pages (Instant Load)
import Welcome from './pages/auth/Welcome';
import RoleSelection from './pages/auth/RoleSelection';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

function MobileLayout() {
  const profile = useAuthStore(s => s.profile);
  const receivedOffers = useMarketplaceStore(s => s.receivedOffers);
  const isSeller = profile?.role === 'seller';

  const pendingOffers = useMemo(() => 
    receivedOffers.filter(o => o.status === 'pending').length, 
  [receivedOffers]);

  const residentNav = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/book-pickup', icon: CalendarPlus, label: 'Book' },
    { path: '/my-bookings', icon: Package, label: 'Bookings' },
    { path: '/settings', icon: MoreHorizontal, label: 'More' },
  ];

  const sellerNav = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/post-trade', icon: CircleFadingPlus, label: 'Sell' },
    { path: '/my-trades', icon: Handshake, label: 'Trades' },
    { path: '/settings', icon: MoreHorizontal, label: 'More' },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-lg mx-auto bg-[#F8F8FF] dark:bg-slate-800">
      <div className="flex-1 pt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+6rem)] px-1">
        <Suspense fallback={<LoadingScreen message="Loading..." />}>
          <Outlet />
        </Suspense>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-[100] max-w-lg mx-auto pb-[env(safe-area-inset-bottom,0px)] bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800">
        <BottomNav items={isSeller ? sellerNav : residentNav} />
      </div>
    </div>
  );
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}

export default function App() {
  const role = useAuthStore(s => s.role);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const userId = useAuthStore(s => s.userId);
  const isInitializing = useAuthStore(s => s.isInitializing);
  const initializeAuth = useAuthStore(s => s.initializeAuth);
  const checkAppRole = useAuthStore(s => s.checkAppRole);

  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const subscribeToRealtime = useNotificationStore(s => s.subscribeToRealtime);
  
  const fetchConfig = useSystemStore(s => s.fetchConfig);
  
  const subscribeToBookings = useBookingStore(s => s.subscribeToBookings);
  const cleanupBookings = useBookingStore(s => s.cleanupBookings);
  
  const fetchReceivedOffers = useMarketplaceStore(s => s.fetchReceivedOffers);
  const subscribeToReceivedOffers = useMarketplaceStore(s => s.subscribeToReceivedOffers);
  
  // PWA Installation
  const { isInstallable, triggerInstall } = usePWA();
  const [showInstallModal, setShowInstallModal] = useState(false);


  useEffect(() => {
    // Proactive Prompt: Show modal automatically after 10 seconds
    const hasPrompted = sessionStorage.getItem('pwa_prompted');
    
    if (isInstallable && !hasPrompted) {
      setShowInstallModal(true);
      sessionStorage.setItem('pwa_prompted', 'true');
    }
  }, [isInstallable]);

  useEffect(() => {
    checkAppRole('client');
    initializeAuth();
    fetchConfig();
    return () => {
      cleanupBookings();
    };
  }, []);

  useEffect(() => {
    let offerSub = null;

    if (isAuthenticated && userId) {
      const targetRole = role || ROLES.USER;
      
      // Initialize Realtime Listeners
      fetchNotifications(userId, targetRole);
      subscribeToRealtime(userId, targetRole);
      subscribeToBookings(userId); 
      
      // Seller Specific Listeners
      if (targetRole === 'seller') {
        fetchReceivedOffers();
        offerSub = subscribeToReceivedOffers(userId);
      }
      
      useBookingStore.getState().fetchBookings(); 
    }

    return () => {
      if (offerSub) {
        supabase.removeChannel(offerSub);
      }
    };
  }, [isAuthenticated, userId, role, checkAppRole]);

  return (
    <div className="min-h-dvh bg-[#F8F8FF] dark:bg-slate-800 transition-colors duration-200">
      {isInitializing && <LoadingScreen message="Securing Session..." />}
      <OfflineBanner />


      <Routes>
        <Route path="/welcome" element={isAuthenticated ? <Navigate to="/" replace /> : <Welcome />} />
        <Route path="/role-selection" element={isAuthenticated ? <Navigate to="/" replace /> : <RoleSelection />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/hygenex" element={<HygeneXPage />} />
          <Route path="/rfq/:rfqId" element={<RFQDetailsPage />} />
          <Route path="/fulfillment/:id" element={<FulfillmentTrackingPage />} />
          <Route path="/my-rfq-offers/:quoteId" element={<SubmittedQuoteDetailsPage />} />
          <Route element={<MobileLayout />}>
            {getResidentRoutes()}
            {getSellerRoutes()}
            {getCommunityRoutes()}
            {getSettingsRoutes()}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>

      {isAuthenticated && (
        <>
          <VoiceBookingModal />
          <NEMAReportModal />
          <WeightVerificationModal />

        </>
      )}

      <PWAInstallModal 
        isOpen={showInstallModal} 
        onClose={() => setShowInstallModal(false)}
        onInstall={() => {
          setShowInstallModal(false);
          triggerInstall();
        }}
      />

      <Toaster position="top-center" richColors closeButton duration={2500} />
    </div>
  );
}
