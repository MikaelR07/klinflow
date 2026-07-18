import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Home, Briefcase, Brain, Wallet, MoreHorizontal, Package, Store } from 'lucide-react';

// Shared Packages
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { usePWA } from '@klinflow/core/hooks/usePWA';
import { ROLES } from '@klinflow/constants';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import Navbar from '@klinflow/ui/components/Navbar';
import BottomNav from '@klinflow/ui/components/BottomNav';
import PWAInstallModal from '@klinflow/ui/components/PWAInstallModal';
import ProtectedRoute from '@klinflow/ui/components/ProtectedRoute';
import { LoadingScreen } from '@klinflow/ui/components/Loading';
import { Toaster } from 'sonner';
import { OfflineBanner } from '@klinflow/ui';

// LAZY LOADED PAGES
const AgentHome = lazy(() => import('./pages/agent/AgentHome'));
const AvailableJobs = lazy(() => import('./pages/agent/AvailableJobs'));
const AgentWallet = lazy(() => import('./pages/agent/AgentWallet'));
const PayoutHistory = lazy(() => import('./pages/agent/PayoutHistory'));
const MyRoutes = lazy(() => import('./pages/agent/MyRoutes'));
const ReviewsPage = lazy(() => import('./pages/agent/ReviewsPage'));
const NavigateJobPage = lazy(() => import('./pages/agent/NavigateJobPage'));
const AgentWarehouse = lazy(() => import('./pages/agent/AgentWarehouse'));
const AgentTradeHub = lazy(() => import('./pages/agent/AgentTradeHub'));
const AgentSellStock = lazy(() => import('./pages/agent/AgentSellStock'));
const Sourcing = lazy(() => import('./pages/agent/Sourcing'));
const MyTrades = lazy(() => import('./pages/agent/MyTrades'));
const HygeneXPage = lazy(() => import('./pages/shared/HygeneXPage'));
const CreateRFQPage = lazy(() => import('./pages/agent/CreateRFQPage'));
const MyRFQs = lazy(() => import('./pages/agent/MyRFQs'));
const RFQDetailsPage = lazy(() => import('./pages/agent/RFQDetailsPage'));
const RFQOfferDetailsPage = lazy(() => import('./pages/agent/RFQOfferDetailsPage'));
const ActivePickupsPage = lazy(() => import('./pages/agent/ActivePickupsPage'));
const ActivePickupDetailsPage = lazy(() => import('./pages/agent/ActivePickupDetailsPage'));
const NavigatePickupPage = lazy(() => import('./pages/agent/NavigatePickupPage'));
const NavigateGroupPickupPage = lazy(() => import('./pages/agent/NavigateGroupPickupPage'));
const ExpectedArrivalsPage = lazy(() => import('./pages/agent/ExpectedArrivalsPage'));
const MarketPulse = lazy(() => import('./pages/agent/MarketPulse'));
const DepositPage = lazy(() => import('./pages/agent/DepositPage'));

// Settings Pages
const SettingsMenu = lazy(() => import('./pages/settings/SettingsMenu'));
const AgentConfigurationPage = lazy(() => import('./pages/settings/AgentConfigurationPage'));
const ProfilePage = lazy(() => import('./pages/settings/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/settings/NotificationsPage'));
const NotificationsFeed = lazy(() => import('./pages/agent/NotificationsFeed'));
const PrivacySecurityPage = lazy(() => import('./pages/settings/PrivacySecurityPage'));
const SupportPage = lazy(() => import('./pages/settings/SupportPage'));
const FeedbackPage = lazy(() => import('./pages/settings/FeedbackPage'));
import Welcome from './pages/auth/Welcome';
import RoleSelection from './pages/auth/RoleSelection';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
const CompanyServicesConfigPage = lazy(() => import('./pages/admin/CompanyServicesConfigPage'));

// Owner Mobile App Pages
const OwnerOverview = lazy(() => import('./pages/admin/mobile/OwnerOverview'));
const OwnerApprovals = lazy(() => import('./pages/admin/mobile/OwnerApprovals'));
const ApprovalCategoryPage = lazy(() => import('./pages/admin/mobile/ApprovalCategoryPage'));
const DepositRequestDetail = lazy(() => import('./pages/admin/mobile/DepositRequestDetail'));
const OnboardingRequestDetail = lazy(() => import('./pages/admin/mobile/OnboardingRequestDetail'));
const OverrideRequestDetail = lazy(() => import('./pages/admin/mobile/OverrideRequestDetail'));
const OwnerFleet = lazy(() => import('./pages/admin/mobile/OwnerFleet'));
const OwnerAgentDetail = lazy(() => import('./pages/admin/mobile/OwnerAgentDetail'));
const OwnerAlerts = lazy(() => import('./pages/admin/mobile/OwnerAlerts'));
const OwnerDisputes = lazy(() => import('./pages/admin/mobile/OwnerDisputes'));
const OwnerDisputeDetail = lazy(() => import('./pages/admin/mobile/OwnerDisputeDetail'));



function MobileLayout() {
  const { availableJobs } = useAgentStore();
  const { listings, fetchListings } = useMarketplaceStore();
  const { profile } = useAuthStore();

  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';

  useEffect(() => { fetchListings(); }, []);

  const AGENT_NAV = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/jobs', icon: Briefcase, label: 'Jobs' },
    { path: '/warehouse', icon: Package, label: 'Warehouse' },
    { path: '/sourcing', icon: Store, label: 'MarketPlace' },
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
        <BottomNav items={AGENT_NAV} />
      </div>
    </div>
  );
}

import PendingApproval from './pages/agent/PendingApproval';

function DynamicRoleLayout() {
  const { profile } = useAuthStore();

  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';
  const hasCompany = !!profile?.companyId;

  if (isFleetDriver && !hasCompany) {
    return <PendingApproval />;
  }

  if (profile?.agentAccountType === 'company_admin') {
    return <AdminLayout />;
  }
  return <MobileLayout />;
}

function RoleBasedIndex() {
  const { profile } = useAuthStore();
  if (profile?.agentAccountType === 'company_admin') {
    return <OwnerOverview />;
  }
  return <AgentHome />;
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}

export default function App() {
  const { role, isAuthenticated, checkAppRole, userId, isInitializing, initializeAuth, profile } = useAuthStore();
  const { fetchNotifications, subscribeToRealtime } = useNotificationStore();
  const { subscribeToJobs, cleanupJobs, fetchAgentConfig } = useAgentStore();
  const { isInstallable, triggerInstall } = usePWA();
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    const hasPrompted = sessionStorage.getItem('pwa_prompted');
    if (isInstallable && !hasPrompted) {
      setShowInstallModal(true);
      sessionStorage.setItem('pwa_prompted', 'true');
    }
  }, [isInstallable]);

  useEffect(() => {
    checkAppRole('agent');
    initializeAuth();
  }, []);

  // 1. Stable, global Notification real-time subscription (Decoupled from online/offline job toggles)
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchNotifications(userId, role);
      subscribeToRealtime(userId, role, profile?.agentAccountType || undefined);
      fetchAgentConfig(); // Ensure agent config is loaded globally on login
    }
  }, [isAuthenticated, checkAppRole, userId, role, profile?.agentAccountType, fetchNotifications, subscribeToRealtime, fetchAgentConfig]);

  // 2. Offline/Online-status based Jobs (Dispatch/Booking) subscription
  useEffect(() => {
    if (isAuthenticated && userId) {
      if (profile?.isOnline) {
        subscribeToJobs();
      } else {
        cleanupJobs();
      }
    }

    return () => {
      cleanupJobs();
    };
  }, [isAuthenticated, userId, profile?.isOnline, subscribeToJobs, cleanupJobs]);

  // 3. Live GPS Tracking & Heartbeat (Uber-like presence)
  useEffect(() => {
    let pulseInterval: NodeJS.Timeout;
    
    if (isAuthenticated && userId && profile?.isOnline) {
      const { sendPulse } = useAuthStore.getState();
      // Send immediately on mount/online-toggle
      sendPulse(); 
      // Then send every 60 seconds
      pulseInterval = setInterval(() => {
        sendPulse();
      }, 60000);
    }

    return () => {
      if (pulseInterval) clearInterval(pulseInterval);
    };
  }, [isAuthenticated, userId, profile?.isOnline]);

  return (
    <div className="min-h-dvh bg-[#F8F8FF] dark:bg-slate-800 transition-colors duration-200">
      {isInitializing && <LoadingScreen message="Syncing Dispatch..." />}
      <OfflineBanner />
      <Routes>
        <Route path="/welcome" element={isAuthenticated ? <Navigate to="/" replace /> : <Welcome />} />
        <Route path="/role-selection" element={isAuthenticated ? <Navigate to="/" replace /> : <RoleSelection />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/hygenex" element={<HygeneXPage />} />
          {/* Full-screen pages without layout paddings */}
          <Route path="/pickups/navigate/:id" element={<NavigatePickupPage />} />
          <Route path="/pickups/group-navigate/:rfqId" element={<NavigateGroupPickupPage />} />
          <Route path="/jobs/navigate/:id" element={<NavigateJobPage />} />
          <Route element={<DynamicRoleLayout />}>
            <Route path="/" element={<RoleBasedIndex />} />
            <Route path="/jobs" element={<AvailableJobs />} />
            <Route path="/routes" element={<MyRoutes />} />
            <Route path="/warehouse" element={<AgentWarehouse />} />
            <Route path="/warehouse/trade" element={<AgentTradeHub />} />
            <Route path="/warehouse/sell" element={<AgentSellStock />} />
            <Route path="/sourcing" element={<Sourcing />} />
            <Route path="/market-pulse" element={<MarketPulse />} />
            <Route path="/rfq/create" element={<CreateRFQPage />} />
            <Route path="/rfqs" element={<MyRFQs />} />
            <Route path="/rfqs/:rfqId" element={<RFQDetailsPage />} />
            <Route path="/rfqs/:rfqId/offers/:offerId" element={<RFQOfferDetailsPage />} />
            <Route path="/pickups" element={<ActivePickupsPage />} />
            <Route path="/pickups/:id" element={<ActivePickupDetailsPage />} />
            <Route path="/expected-arrivals" element={<ExpectedArrivalsPage />} />
            <Route path="/trades" element={<MyTrades />} />
            <Route path="/wallet" element={<AgentWallet />} />
            <Route path="/payout-history" element={<PayoutHistory />} />
            <Route path="/deposit" element={<DepositPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/notifications" element={<NotificationsFeed />} />

            <Route path="/admin/services" element={<CompanyServicesConfigPage />} />

            {/* Owner Mobile App Routes */}
            <Route path="/approvals" element={<OwnerApprovals />} />
            <Route path="/approvals/category/:category" element={<ApprovalCategoryPage />} />
            <Route path="/approvals/deposit/:id" element={<DepositRequestDetail />} />
            <Route path="/approvals/onboarding/:id" element={<OnboardingRequestDetail />} />
            <Route path="/approvals/override/:id" element={<OverrideRequestDetail />} />
            <Route path="/fleet" element={<OwnerFleet />} />
            <Route path="/fleet/:id" element={<OwnerAgentDetail />} />
            <Route path="/alerts" element={<OwnerAlerts />} />
            <Route path="/disputes" element={<OwnerDisputes />} />
            <Route path="/disputes/:id" element={<OwnerDisputeDetail />} />
            <Route path="/market-prices" element={<MarketPulse />} />

            <Route path="/settings">
              <Route index element={<SettingsMenu />} />
              <Route path="configuration" element={<AgentConfigurationPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="privacy" element={<PrivacySecurityPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="feedback" element={<FeedbackPage />} />

            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
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
