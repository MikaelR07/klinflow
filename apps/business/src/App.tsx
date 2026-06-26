import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Store, PlusCircle, ShoppingBag, Package, Brain, MoreHorizontal, CircleFadingPlus } from 'lucide-react';

// Shared Packages
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { usePWA } from '@klinflow/core/hooks/usePWA';
import { ROLES } from '@klinflow/constants';
import Navbar from '@klinflow/ui/components/Navbar';
import BottomNav from '@klinflow/ui/components/BottomNav';
import PWAInstallModal from '@klinflow/ui/components/PWAInstallModal';
import ProtectedRoute from '@klinflow/ui/components/ProtectedRoute';
import { LoadingScreen } from '@klinflow/ui/components/Loading';
import { Toaster } from 'sonner';

// ── LAZY LOADED PAGES (SPEED OPTIMIZATION) ─────────────────────────
const MarketplaceHome = lazy(() => import('./pages/marketplace/MarketplaceHome'));
const BuyRecyclables = lazy(() => import('./pages/marketplace/BuyRecyclables'));
const SellRecyclables = lazy(() => import('./pages/marketplace/SellRecyclables'));
const MyListings = lazy(() => import('./pages/marketplace/MyListings'));
const MyOrders = lazy(() => import('./pages/marketplace/MyOrders'));
const WeaverWarehouse = lazy(() => import('./pages/marketplace/WeaverWarehouse'));
const SupplyTerminal = lazy(() => import('./pages/marketplace/SupplyTerminal'));
const ArrivalDetails = lazy(() => import('./pages/marketplace/ArrivalDetails'));
const HygeneXPage = lazy(() => import('./pages/shared/HygeneXPage'));
const ProcurementTerminal = lazy(() => import('./pages/marketplace/ProcurementTerminal'));
const CreateRFQ = lazy(() => import('./pages/marketplace/CreateRFQ'));
const RFQDetails = lazy(() => import('./pages/marketplace/RFQDetails'));
const ListingDetails = lazy(() => import('./pages/marketplace/ListingDetails'));
const AggregatorsPage = lazy(() => import('./pages/marketplace/AggregatorsPage'));
const ChatroomPage = lazy(() => import('./pages/marketplace/ChatroomPage'));

// Settings Pages
const SettingsMenu = lazy(() => import('./pages/settings/SettingsMenu'));
const ProfilePage = lazy(() => import('./pages/settings/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/settings/NotificationsPage'));
const PrivacySecurityPage = lazy(() => import('./pages/settings/PrivacySecurityPage'));
const SupportPage = lazy(() => import('./pages/settings/SupportPage'));
const FeedbackPage = lazy(() => import('./pages/settings/FeedbackPage'));

// Auth Pages (Instant Load)
import Welcome from './pages/auth/Welcome';
import RoleSelection from './pages/auth/RoleSelection';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

const BUSINESS_NAV = [
  { path: '/', icon: Store, label: 'Home' },
  { path: '/sell', icon:CircleFadingPlus , label: 'Sell' },
  { path: '/warehouse', icon: Package, label: 'Yard' },
  { path: '/orders', icon: ShoppingBag, label: 'Orders' },
  { path: '/settings', icon: MoreHorizontal, label: 'More' },
];

function MobileLayout() {
  return (
    <div className="flex flex-col min-h-[100dvh] max-w-lg mx-auto bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 pt-[env(safe-area-inset-top,1.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+6rem)] px-1">
        <Suspense fallback={<LoadingScreen message="Loading Terminal..." />}>
          <Outlet />
        </Suspense>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-[100] max-w-lg mx-auto pb-[env(safe-area-inset-bottom,0px)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800">
        <BottomNav items={BUSINESS_NAV} />
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
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const subscribeToRealtime = useNotificationStore(s => s.subscribeToRealtime);
  const role = useAuthStore(s => s.role);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const userId = useAuthStore(s => s.userId);
  const isInitializing = useAuthStore(s => s.isInitializing);
  const initializeAuth = useAuthStore(s => s.initializeAuth);
  const checkAppRole = useAuthStore(s => s.checkAppRole);

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
    // Initialize Auth Session on Boot
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId) {
      checkAppRole('business');
      
      // Initialize Notification Listeners
      const targetRole = role || ROLES.BUSINESS;
      fetchNotifications(userId, targetRole);
      subscribeToRealtime(userId, targetRole);
    }
  }, [isAuthenticated, userId, role, checkAppRole]);

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {isInitializing && <LoadingScreen message="Syncing Marketplace..." />}


      <Routes>
        <Route path="/welcome" element={isAuthenticated ? <Navigate to="/" replace /> : <Welcome />} />
        <Route path="/roles" element={isAuthenticated ? <Navigate to="/" replace /> : <RoleSelection />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

        <Route element={<ProtectedLayout />}>
          <Route element={<MobileLayout />}>
            <Route path="/" element={<MarketplaceHome />} />
            <Route path="/buy" element={<BuyRecyclables />} />
            <Route path="/sell" element={<SellRecyclables />} />
            <Route path="/listings" element={<MyListings />} />
            <Route path="/listings/:id" element={<ListingDetails />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/warehouse" element={<WeaverWarehouse />} />

            <Route path="/procurement" element={<ProcurementTerminal />} />
            <Route path="/hygenex" element={<HygeneXPage />} />
            <Route path="/aggregators" element={<AggregatorsPage />} />
            <Route path="/chatroom" element={<ChatroomPage />} />
            
            <Route path="/settings">
              <Route index element={<SettingsMenu />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="privacy" element={<PrivacySecurityPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          
          {/* Detail Pages (No Bottom Nav, Full Bleed) */}
          <Route path="/procurement/create" element={<CreateRFQ />} />
          <Route path="/procurement/:id" element={<RFQDetails />} />
          <Route path="/listings/:id" element={<ListingDetails />} />
          <Route path="/arrivals" element={<SupplyTerminal />} />
          <Route path="/arrivals/:id" element={<ArrivalDetails />} />
        </Route>
      </Routes>

      <PWAInstallModal 
        isOpen={showInstallModal} 
        onClose={() => setShowInstallModal(false)}
        onInstall={() => {
          setShowInstallModal(false);
          triggerInstall();
        }}
      />

      <Toaster position="top-center" richColors />
    </div>
  );
}
