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
const EarningsPage = lazy(() => import('./pages/agent/EarningsPage'));
const MyRoutes = lazy(() => import('./pages/agent/MyRoutes'));
const ReviewsPage = lazy(() => import('./pages/agent/ReviewsPage'));
const NavigateJobPage = lazy(() => import('./pages/agent/NavigateJobPage'));
const AgentWarehouse = lazy(() => import('./pages/agent/AgentWarehouse'));
const AgentSellStock = lazy(() => import('./pages/agent/AgentSellStock'));
const Sourcing = lazy(() => import('./pages/agent/Sourcing'));
const MyTrades = lazy(() => import('./pages/agent/MyTrades'));
const HygeneXPage = lazy(() => import('./pages/shared/HygeneXPage'));
const CreateRFQPage = lazy(() => import('./pages/agent/CreateRFQPage'));
const MyRFQs = lazy(() => import('./pages/agent/MyRFQs'));
const RFQDetailsPage = lazy(() => import('./pages/agent/RFQDetailsPage'));
const ActivePickupsPage = lazy(() => import('./pages/agent/ActivePickupsPage'));
const ActivePickupDetailsPage = lazy(() => import('./pages/agent/ActivePickupDetailsPage'));
const NavigatePickupPage = lazy(() => import('./pages/agent/NavigatePickupPage'));
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
const CompanyStaffRequests = lazy(() => import('./pages/settings/CompanyStaffRequests'));
import Welcome from './pages/auth/Welcome';
import RoleSelection from './pages/auth/RoleSelection';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
const CompanyAdminDashboard = lazy(() => import('./pages/admin/CompanyAdminDashboard'));
const FleetManagement = lazy(() => import('./pages/admin/FleetManagement'));
const FleetFinance = lazy(() => import('./pages/admin/FleetFinance'));
const FleetRFQs = lazy(() => import('./pages/admin/FleetRFQs'));
const DispatchDashboard = lazy(() => import('./pages/admin/DispatchDashboard'));
const CompanyServicesConfigPage = lazy(() => import('./pages/admin/CompanyServicesConfigPage'));


function MobileLayout() {
  const { availableJobs } = useAgentStore();
  const { listings, fetchListings } = useMarketplaceStore();
  const { profile } = useAuthStore();

  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';

  useEffect(() => { fetchListings(); }, []);

  const AGENT_NAV = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/jobs', icon: Briefcase, label: 'Jobs', badge: availableJobs.length, badgeColor: 'bg-blue-500 shadow-sm shadow-blue-500/30' },
    { path: '/warehouse', icon: Package, label: 'Warehouse' },
    { path: '/sourcing', icon: Store, label: 'MarketPlace', badge: listings.length, badgeColor: 'bg-emerald-500 shadow-sm shadow-emerald-500/30' },
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
    return <CompanyAdminDashboard />;
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
          <Route element={<DynamicRoleLayout />}>
            <Route path="/" element={<RoleBasedIndex />} />
            <Route path="/jobs" element={<AvailableJobs />} />
            <Route path="/jobs/navigate/:id" element={<NavigateJobPage />} />
            <Route path="/routes" element={<MyRoutes />} />
            <Route path="/warehouse" element={<AgentWarehouse />} />
            <Route path="/warehouse/sell" element={<AgentSellStock />} />
            <Route path="/sourcing" element={<Sourcing />} />
            <Route path="/market-pulse" element={<MarketPulse />} />
            <Route path="/rfq/create" element={<CreateRFQPage />} />
            <Route path="/rfqs" element={<MyRFQs />} />
            <Route path="/rfqs/:rfqId" element={<RFQDetailsPage />} />
            <Route path="/pickups" element={<ActivePickupsPage />} />
            <Route path="/pickups/navigate/:id" element={<NavigatePickupPage />} />
            <Route path="/pickups/:id" element={<ActivePickupDetailsPage />} />
            <Route path="/trades" element={<MyTrades />} />
            <Route path="/earnings" element={<EarningsPage />} />
            <Route path="/deposit" element={<DepositPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/notifications" element={<NotificationsFeed />} />

            <Route path="/admin/agents" element={<FleetManagement />} />
            <Route path="/admin/earnings" element={<EarningsPage />} />
            <Route path="/admin/finance" element={<FleetFinance />} />
            <Route path="/admin/rfqs" element={<FleetRFQs />} />
            <Route path="/admin/dispatch" element={<DispatchDashboard />} />
            <Route path="/admin/services" element={<CompanyServicesConfigPage />} />
            <Route path="/admin/driver-requests" element={<CompanyStaffRequests />} />
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
