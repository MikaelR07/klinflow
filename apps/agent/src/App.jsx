import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Home, Briefcase, Brain, Wallet, MoreHorizontal, Package, Search } from 'lucide-react';

// Shared Packages
import { useAuthStore, useThemeStore, useNotificationStore, usePWA, ROLES, useAgentStore, useMarketplaceStore } from '@cleanflow/core';
import { Navbar, BottomNav, PWAInstallModal, ProtectedRoute, LoadingScreen } from '@cleanflow/ui';
import { Toaster } from 'sonner';

// LAZY LOADED PAGES
const AgentHome = lazy(() => import('./pages/agent/AgentHome.jsx'));
const AvailableJobs = lazy(() => import('./pages/agent/AvailableJobs.jsx'));
const EarningsPage = lazy(() => import('./pages/agent/EarningsPage.jsx'));
const MyRoutes = lazy(() => import('./pages/agent/MyRoutes.jsx'));
const ReviewsPage = lazy(() => import('./pages/agent/ReviewsPage.jsx'));
const NavigateJobPage = lazy(() => import('./pages/agent/NavigateJobPage.jsx'));
const AgentWarehouse = lazy(() => import('./pages/agent/AgentWarehouse.jsx'));
const AgentSellStock = lazy(() => import('./pages/agent/AgentSellStock.jsx'));
const Sourcing = lazy(() => import('./pages/agent/Sourcing.jsx'));
const MyTrades = lazy(() => import('./pages/agent/MyTrades.jsx'));
const HygeneXPage = lazy(() => import('./pages/shared/HygeneXPage.jsx'));

// Settings Pages
const SettingsMenu = lazy(() => import('./pages/settings/SettingsMenu.jsx'));
const AgentConfigurationPage = lazy(() => import('./pages/settings/AgentConfigurationPage.jsx'));
const ProfilePage = lazy(() => import('./pages/settings/ProfilePage.jsx'));
const NotificationsPage = lazy(() => import('./pages/settings/NotificationsPage.jsx'));
const PrivacySecurityPage = lazy(() => import('./pages/settings/PrivacySecurityPage.jsx'));
const SupportPage = lazy(() => import('./pages/settings/SupportPage.jsx'));
const FeedbackPage = lazy(() => import('./pages/settings/FeedbackPage.jsx'));
const StaffApplication = lazy(() => import('./pages/settings/StaffApplication.jsx'));

import Welcome from './pages/auth/Welcome.jsx';
import RoleSelection from './pages/auth/RoleSelection.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout.jsx';
const CompanyAdminDashboard = lazy(() => import('./pages/admin/CompanyAdminDashboard.jsx'));
const FleetManagement = lazy(() => import('./pages/admin/FleetManagement.jsx'));

function MobileLayout() {
  const { availableJobs } = useAgentStore();
  const { listings, fetchListings } = useMarketplaceStore();
  const { profile } = useAuthStore();
  
  const isFleetDriver = profile?.agent_account_type === 'fleet_driver';

  useEffect(() => { fetchListings(); }, []);

  const AGENT_NAV = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/jobs', icon: Briefcase, label: 'Jobs', badge: availableJobs.length, badgeColor: 'bg-blue-500 shadow-sm shadow-blue-500/30' },
    { path: '/warehouse', icon: Package, label: 'Warehouse' },
    { path: '/sourcing', icon: Search, label: 'MarketPlace', badge: listings.length, badgeColor: 'bg-emerald-500 shadow-sm shadow-emerald-500/30' },
    { path: '/settings', icon: MoreHorizontal, label: 'More' },
  ];

  return (
    <div className="flex flex-col h-[100dvh] max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto overscroll-none py-5 pb-4 px-2">
        <Suspense fallback={<LoadingScreen message="Loading..." />}>
          <Outlet />
        </Suspense>
      </div>
      <BottomNav items={AGENT_NAV} />
    </div>
  );
}

function DynamicRoleLayout() {
  const { profile } = useAuthStore();
  if (profile?.agent_account_type === 'company_admin') {
    return <AdminLayout />;
  }
  return <MobileLayout />;
}

function RoleBasedIndex() {
  const { profile } = useAuthStore();
  if (profile?.agent_account_type === 'company_admin') {
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
  const { role, isAuthenticated, checkAppRole, userId, isInitializing, initializeAuth } = useAuthStore();
  const { fetchNotifications, subscribeToRealtime } = useNotificationStore();
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
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId) {
      checkAppRole('agent');
      fetchNotifications(userId, role);
      subscribeToRealtime(userId, role);
    }
  }, [isAuthenticated, checkAppRole, userId, role]);

  if (isInitializing) {
    return <LoadingScreen message="Syncing Dispatch..." />;
  }

  return (
    <div className="min-h-dvh bg-[#F8F8FF] dark:bg-slate-900 transition-colors duration-200">
      <Routes>
        <Route path="/welcome" element={isAuthenticated ? <Navigate to="/" replace /> : <Welcome />} />
        <Route path="/role-selection" element={isAuthenticated ? <Navigate to="/" replace /> : <RoleSelection />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

        <Route element={<ProtectedLayout />}>
          <Route element={<DynamicRoleLayout />}>
            <Route path="/" element={<RoleBasedIndex />} />
            <Route path="/jobs" element={<AvailableJobs />} />
            <Route path="/jobs/navigate/:id" element={<NavigateJobPage />} />
            <Route path="/routes" element={<MyRoutes />} />
            <Route path="/warehouse" element={<AgentWarehouse />} />
            <Route path="/warehouse/sell" element={<AgentSellStock />} />
            <Route path="/sourcing" element={<Sourcing />} />
            <Route path="/trades" element={<MyTrades />} />
            <Route path="/earnings" element={<EarningsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/hygenex" element={<HygeneXPage />} />
            
            <Route path="/admin/agents" element={<FleetManagement />} />
            <Route path="/admin/earnings" element={<EarningsPage />} />

            <Route path="/settings">
              <Route index element={<SettingsMenu />} />
              <Route path="configuration" element={<AgentConfigurationPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="privacy" element={<PrivacySecurityPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="staff-application" element={<StaffApplication />} />
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
