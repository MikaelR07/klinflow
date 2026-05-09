import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Home, CalendarPlus, Package, Brain, Gauge, MoreHorizontal, Plus, ShieldCheck, Handshake } from 'lucide-react';

import { 
  useAuthStore, useThemeStore, useNotificationStore, useSystemStore, 
  useBookingStore, usePWA, useMarketplaceStore, supabase, NOTIFICATION_TYPES, ROLES 
} from '@cleanflow/core';
import { 
  Navbar, BottomNav, ProtectedRoute, VoiceBookingModal, 
  NEMAReportModal, LoadingScreen, PWAInstallModal, RatingModal 
} from '@cleanflow/ui';
import { Toaster, toast } from 'sonner';

// Components
import WeightVerificationModal from './components/user/WeightVerificationModal.jsx';

// ── LAZY LOADED PAGES (SPEED OPTIMIZATION) ─────────────────────────
const UserHome = lazy(() => import('./pages/user/UserHome.jsx'));
const DiscoveryHub = lazy(() => import('./pages/user/Discovery.jsx'));
const Leaderboard = lazy(() => import('./pages/user/Leaderboard.jsx'));
const BookPickup = lazy(() => import('./pages/user/BookPickup.jsx'));
const MyBookings = lazy(() => import('./pages/user/MyBookings.jsx'));
const MyIotPage = lazy(() => import('./pages/user/MyIotPage.jsx'));
const ImpactHub = lazy(() => import('./pages/user/ImpactHub.jsx'));
const WithdrawalPage = lazy(() => import('./pages/user/WithdrawalPage.jsx'));
const HygeneXPage = lazy(() => import('./pages/shared/HygeneXPage.jsx'));
const CompanyProfile = lazy(() => import('./pages/user/CompanyProfile.jsx'));
const ImpactAnalytics = lazy(() => import('./pages/user/ImpactAnalytics.jsx'));

// Seller Pages
const PostTrade = lazy(() => import('./pages/user/PostTrade.jsx'));
const MyTrades = lazy(() => import('./pages/user/MyTrades.jsx'));
const TrustScoreDetails = lazy(() => import('./pages/user/TrustScoreDetails.jsx'));
const MyOffers = lazy(() => import('./pages/user/MyOffers.jsx'));
const MarketplaceInventory = lazy(() => import('./pages/user/MarketplaceInventory.jsx'));

// Settings Pages
const SettingsMenu = lazy(() => import('./pages/settings/SettingsMenu.jsx'));
const ProfilePage = lazy(() => import('./pages/settings/ProfilePage.jsx'));
const NotificationsPage = lazy(() => import('./pages/settings/NotificationsPage.jsx'));
const PrivacySecurityPage = lazy(() => import('./pages/settings/PrivacySecurityPage.jsx'));
const SupportPage = lazy(() => import('./pages/settings/SupportPage.jsx'));
const FeedbackPage = lazy(() => import('./pages/settings/FeedbackPage.jsx'));
const SubscriptionPage = lazy(() => import('./pages/settings/SubscriptionPage.jsx'));
const SubscriptionDetail = lazy(() => import('./pages/settings/SubscriptionDetail.jsx'));

// Auth Pages (Instant Load)
import Welcome from './pages/auth/Welcome.jsx';
import RoleSelection from './pages/auth/RoleSelection.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

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
    <div className="flex flex-col h-[100dvh] max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto overscroll-none py-5 pb-4">
        <Suspense fallback={<LoadingScreen message="Loading..." />}>
          <Outlet />
        </Suspense>
      </div>
      <BottomNav items={isSeller ? sellerNav : residentNav} />
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
  const checkAppRole = useAuthStore(s => s.checkAppRole);
  const userId = useAuthStore(s => s.userId);
  const isInitializing = useAuthStore(s => s.isInitializing);
  const initializeAuth = useAuthStore(s => s.initializeAuth);

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

  // Global Rating System
  const { bookings, submitAgentRating } = useBookingStore();
  const [ratingBooking, setRatingBooking] = useState(null);
  const [dismissedRatingIds, setDismissedRatingIds] = useState([]);

  useEffect(() => {
    // Only scan for unrated bookings if we aren't currently in a release/rate flow
    const activeRelease = useBookingStore.getState().activeReleaseBooking;
    
    if (isAuthenticated && bookings.length > 0 && !activeRelease) {
      const now = new Date();
      const unrated = bookings.find(b => {
        // Must be completed, have an agent, and NO rating yet
        if (b.status !== 'completed' || (b.agent_rating || b.agentRating) || !(b.agent_id || b.agentId)) return false;
        if (dismissedRatingIds.includes(b.id)) return false; 
        
        const completeTime = new Date(b.updated_at || b.date);
        const diffHours = (now - completeTime) / 3600000;
        return diffHours < 168; // 7 Day Window for reminders
      });
      
      if (unrated) setRatingBooking(unrated);
    }
  }, [bookings, dismissedRatingIds, isAuthenticated]);

  useEffect(() => {
    // Proactive Prompt: Show modal automatically after 10 seconds
    const hasPrompted = sessionStorage.getItem('pwa_prompted');
    
    if (isInstallable && !hasPrompted) {
      setShowInstallModal(true);
      sessionStorage.setItem('pwa_prompted', 'true');
    }
  }, [isInstallable]);

  useEffect(() => {
    initializeAuth();
    fetchConfig();
    return () => {
      cleanupBookings();
    };
  }, []);

  useEffect(() => {
    let offerSub = null;

    if (isAuthenticated && userId) {
      checkAppRole('client');
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
  }, [isAuthenticated, userId, role]);

  if (isInitializing) {
    return <LoadingScreen message="Securing Session..." />;
  }

  return (
    <div className="min-h-dvh bg-[#F8F8FF] dark:bg-slate-900 transition-colors duration-200">


      <Routes>
        <Route path="/welcome" element={isAuthenticated ? <Navigate to="/" replace /> : <Welcome />} />
        <Route path="/role-selection" element={isAuthenticated ? <Navigate to="/" replace /> : <RoleSelection />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/hygenex" element={<HygeneXPage />} />
          <Route element={<MobileLayout />}>
            <Route path="/" element={<UserHome />} />
            <Route path="/withdraw" element={<WithdrawalPage />} />
            <Route path="/discovery" element={<DiscoveryHub />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/book-pickup" element={<BookPickup />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/impact-hub" element={<ImpactHub />} />
            <Route path="/my-iot" element={<MyIotPage />} />
            <Route path="/company/:agentId" element={<CompanyProfile />} />
            <Route path="/analytics" element={<ImpactAnalytics />} />
            <Route path="/post-trade" element={<PostTrade />} />
            <Route path="/my-trades" element={<MyTrades />} />
            <Route path="/my-offers" element={<MyOffers />} />
            <Route path="/inventory" element={<MarketplaceInventory />} />
            <Route path="/trust-score" element={<TrustScoreDetails />} />
            
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
          <RatingModal
            isOpen={!!ratingBooking}
            onClose={() => setRatingBooking(null)}
            agentName={ratingBooking?.agentName || 'your agent'}
            onSubmit={async (val, comment) => {
              try {
                await submitAgentRating(ratingBooking.id, val, comment);
                toast.success('Thank you! 💖', { description: 'Your rating has been submitted.' });
                setRatingBooking(null);
              } catch (e) {
                toast.error('Could not save rating');
              }
            }}
            onSkip={() => {
              setDismissedRatingIds(prev => [...prev, ratingBooking.id]);
              setRatingBooking(null);
            }} 
          />
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
