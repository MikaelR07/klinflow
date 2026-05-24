import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Home, CalendarPlus, Package, Brain, Gauge, MoreHorizontal, Plus, ShieldCheck, Handshake } from 'lucide-react';

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

// Components
import WeightVerificationModal from './components/user/WeightVerificationModal';

// ── LAZY LOADED PAGES (SPEED OPTIMIZATION) ─────────────────────────
const UserHome = lazy(() => import('./pages/user/UserHome'));
const DiscoveryHub = lazy(() => import('./pages/user/Discovery'));
const Leaderboard = lazy(() => import('./pages/user/Leaderboard'));
const BookPickup = lazy(() => import('./pages/user/BookPickup'));
const MyBookings = lazy(() => import('./pages/user/MyBookings'));

const ImpactHub = lazy(() => import('./pages/user/ImpactHub'));
const WithdrawalPage = lazy(() => import('./pages/user/WithdrawalPage'));
const HygeneXPage = lazy(() => import('./pages/shared/HygeneXPage'));
const CompanyProfile = lazy(() => import('./pages/user/CompanyProfile'));
const ImpactAnalytics = lazy(() => import('./pages/user/ImpactAnalytics'));

// Seller Pages
const PostTrade = lazy(() => import('./pages/user/PostTrade'));
const MyTrades = lazy(() => import('./pages/user/MyTrades'));
const TrustScoreDetails = lazy(() => import('./pages/user/TrustScoreDetails'));
const MyOffers = lazy(() => import('./pages/user/MyOffers'));
const MyRFQOffers = lazy(() => import('./pages/user/MyRFQOffers'));
const SubmittedQuoteDetailsPage = lazy(() => import('./pages/user/SubmittedQuoteDetailsPage'));
const MarketplaceInventory = lazy(() => import('./pages/user/MarketplaceInventory'));
const MarketIntelligenceHub = lazy(() => import('./pages/user/MarketIntelligenceHub'));
const RFQDetailsPage = lazy(() => import('./pages/user/RFQDetailsPage'));
const CircularResume = lazy(() => import('./pages/user/CircularResume'));
const CommunityCollective = lazy(() => import('./pages/user/CommunityCollective'));
const FinancingHub = lazy(() => import('./pages/user/FinancingHub'));
const FulfillmentTrackingPage = lazy(() => import('./pages/user/FulfillmentTrackingPage'));

// Settings Pages
const SettingsMenu = lazy(() => import('./pages/settings/SettingsMenu'));
const ProfilePage = lazy(() => import('./pages/settings/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/settings/NotificationsPage'));
const NotificationsFeed = lazy(() => import('./pages/user/NotificationsFeed'));
const PrivacySecurityPage = lazy(() => import('./pages/settings/PrivacySecurityPage'));
const SupportPage = lazy(() => import('./pages/settings/SupportPage'));
const FeedbackPage = lazy(() => import('./pages/settings/FeedbackPage'));
const SubscriptionPage = lazy(() => import('./pages/settings/SubscriptionPage'));
const SubscriptionDetail = lazy(() => import('./pages/settings/SubscriptionDetail'));

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
    { path: '/hygenex', icon: Brain, label: 'HygeneX' },
    { path: '/settings', icon: MoreHorizontal, label: 'More' },
  ];

  const sellerNav = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/post-trade', icon: Plus, label: 'Sell' },
    { path: '/my-trades', icon: Package, label: 'Trades' },
    { path: '/my-offers', icon: Handshake, label: 'Offers', badge: pendingOffers > 0 ? pendingOffers : null },
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

  if (isInitializing) {
    return <LoadingScreen message="Securing Session..." />;
  }

  return (
    <div className="min-h-dvh bg-[#F8F8FF] dark:bg-slate-800 transition-colors duration-200">


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
            <Route path="/" element={<UserHome />} />
            <Route path="/withdraw" element={<WithdrawalPage />} />
            <Route path="/discovery" element={<DiscoveryHub />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/book-pickup" element={<BookPickup />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/impact-hub" element={<ImpactHub />} />

            <Route path="/company/:agentId" element={<CompanyProfile />} />
            <Route path="/analytics" element={<ImpactAnalytics />} />
            <Route path="/post-trade" element={<PostTrade />} />
            <Route path="/my-trades" element={<MyTrades />} />
            <Route path="/my-offers" element={<MyOffers />} />
            <Route path="/my-rfq-offers" element={<MyRFQOffers />} />
            <Route path="/inventory" element={<MarketplaceInventory />} />
            <Route path="/trust-score" element={<TrustScoreDetails />} />
            <Route path="/market-pulse" element={<MarketIntelligenceHub />} />
            <Route path="/circular-resume" element={<CircularResume />} />
            <Route path="/community-collective" element={<ProtectedRoute><CommunityCollective /></ProtectedRoute>} />
            <Route path="/financing" element={<ProtectedRoute><FinancingHub /></ProtectedRoute>} />
            <Route path="/notifications" element={<NotificationsFeed />} />
            
            <Route path="/settings">
              <Route index element={<SettingsMenu />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="subscriptions" element={<SubscriptionPage />} />
              <Route path="subscriptions/:tierId" element={<SubscriptionDetail />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="privacy" element={<PrivacySecurityPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
            </Route>

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
