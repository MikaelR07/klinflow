import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Store, PlusCircle, ShoppingBag, Package, Brain, MoreHorizontal } from 'lucide-react';

// Shared Packages
import { useAuthStore, useThemeStore, usePWA, ROLES } from '@cleanflow/core';
import { Navbar, BottomNav, PWAInstallModal, ProtectedRoute, LoadingScreen } from '@cleanflow/ui';
import { Toaster } from 'sonner';

// ── LAZY LOADED PAGES (SPEED OPTIMIZATION) ─────────────────────────
const MarketplaceHome = lazy(() => import('./pages/marketplace/MarketplaceHome.jsx'));
const BuyRecyclables = lazy(() => import('./pages/marketplace/BuyRecyclables.jsx'));
const SellRecyclables = lazy(() => import('./pages/marketplace/SellRecyclables.jsx'));
const MyListings = lazy(() => import('./pages/marketplace/MyListings.jsx'));
const MyOrders = lazy(() => import('./pages/marketplace/MyOrders.jsx'));
const WeaverWarehouse = lazy(() => import('./pages/marketplace/WeaverWarehouse.jsx'));
const SupplyTerminal = lazy(() => import('./pages/marketplace/SupplyTerminal.jsx'));
const ArrivalDetails = lazy(() => import('./pages/marketplace/ArrivalDetails.jsx'));
const HygeneXPage = lazy(() => import('./pages/shared/HygeneXPage.jsx'));
const ProcurementTerminal = lazy(() => import('./pages/marketplace/ProcurementTerminal.jsx'));
const CreateRFQ = lazy(() => import('./pages/marketplace/CreateRFQ.jsx'));
const RFQDetails = lazy(() => import('./pages/marketplace/RFQDetails.jsx'));
const ListingDetails = lazy(() => import('./pages/marketplace/ListingDetails.jsx'));
const AggregatorsPage = lazy(() => import('./pages/marketplace/AggregatorsPage.jsx'));
const ChatroomPage = lazy(() => import('./pages/marketplace/ChatroomPage.jsx'));

// Settings Pages
const SettingsMenu = lazy(() => import('./pages/settings/SettingsMenu.jsx'));
const ProfilePage = lazy(() => import('./pages/settings/ProfilePage.jsx'));
const NotificationsPage = lazy(() => import('./pages/settings/NotificationsPage.jsx'));
const PrivacySecurityPage = lazy(() => import('./pages/settings/PrivacySecurityPage.jsx'));
const SupportPage = lazy(() => import('./pages/settings/SupportPage.jsx'));
const FeedbackPage = lazy(() => import('./pages/settings/FeedbackPage.jsx'));

// Auth Pages (Instant Load)
import Welcome from './pages/auth/Welcome.jsx';
import RoleSelection from './pages/auth/RoleSelection.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

const BUSINESS_NAV = [
  { path: '/', icon: Store, label: 'Home' },
  { path: '/sell', icon: PlusCircle, label: 'Sell' },
  { path: '/warehouse', icon: Package, label: 'Yard' },
  { path: '/orders', icon: ShoppingBag, label: 'Orders' },
  { path: '/settings', icon: MoreHorizontal, label: 'More' },
];

function MobileLayout() {
  return (
    <>
      <div className="max-w-lg mx-auto px-2 py-5 pb-24">
        <Suspense fallback={<LoadingScreen message="Loading Terminal..." />}>
          <Outlet />
        </Suspense>
      </div>
      <BottomNav items={BUSINESS_NAV} />
    </>
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
  const { role, isAuthenticated, checkAppRole, isInitializing, initializeAuth } = useAuthStore();
  
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
    if (isAuthenticated) {
      checkAppRole('business');
    }
  }, [isAuthenticated, checkAppRole]);

  if (isInitializing) {
    return <LoadingScreen message="Syncing Marketplace..." />;
  }

  return (
    <div className="min-h-dvh bg-[#F8F8FF] dark:bg-slate-900 transition-colors duration-200">


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
