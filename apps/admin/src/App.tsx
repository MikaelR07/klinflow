import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Brain, MapPin, Settings, Users } from 'lucide-react';

// Shared Packages
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { useSystemStore } from '@klinflow/core/stores/systemStore';
import { ROLES } from '@klinflow/constants';
import Navbar from '@klinflow/ui/components/Navbar';
import AdminSidebar from '@klinflow/ui/components/AdminSidebar';
import ProtectedRoute from '@klinflow/ui/components/ProtectedRoute';
import BottomNav from '@klinflow/ui/components/BottomNav';

import { Toaster } from 'sonner';

// Pages
import Welcome from './pages/auth/Welcome';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReports from './pages/admin/AdminReports';

import AdminFeedbackInbox from './pages/admin/AdminFeedbackInbox';
import MarketHub from './pages/admin/MarketHub';
import HygeneXPage from './pages/shared/HygeneXPage';
import UserManager from './pages/admin/UserManager';
import PointTransfers from './pages/admin/PointTransfers';
import IndAgentMetrics from './pages/admin/IndAgentMetrics';
import FinancialReport from './pages/admin/FinancialReport';
import SovereignImpact from './pages/admin/SovereignImpact';
import NetworkOracle from './pages/admin/NetworkOracle';
import PointRedemptions from './pages/admin/PointRedemptions';
import AdminB2B from './pages/admin/AdminB2B';
import CompanyMetrics from './pages/admin/CompanyMetrics';
import EnvironmentalReport from './pages/admin/EnvironmentalReport';

// Settings Pages
import SettingsMenu from './pages/settings/SettingsMenu';
import ProfilePage from './pages/settings/ProfilePage';
import NotificationsPage from './pages/settings/NotificationsPage';
import PrivacySecurityPage from './pages/settings/PrivacySecurityPage';
import SupportPage from './pages/settings/SupportPage';
import FeedbackPage from './pages/settings/FeedbackPage';
import SystemConfigPage from './pages/settings/SystemConfigPage';

const BOTTOM_NAV = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/users', icon: Users, label: 'Users' },
  { path: '/hygenex', icon: Brain, label: 'HygeneX' },
  { path: '/map', icon: MapPin, label: 'Live Map' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

function AdminLayout() {
  return (
    <div className="flex min-h-[calc(100dvh-56px)] pb-16 lg:pb-0">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full">
        <Outlet />
      </main>
      <BottomNav items={BOTTOM_NAV} />
    </div>
  );
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Navbar />
      <Outlet />
    </ProtectedRoute>
  );
}

export default function App() {
  const { role, isAuthenticated, checkAppRole, userId, initializeAuth } = useAuthStore();
  const { subscribeToRealtime } = useNotificationStore();
  const { fetchConfig } = useSystemStore();

  useEffect(() => {
    initializeAuth();
    fetchConfig();
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId) {
      checkAppRole('admin');
      subscribeToRealtime(userId, role);
    }
  }, [isAuthenticated, userId, role]);

  return (
    <div className="min-h-dvh bg-slate-100 dark:bg-slate-900 transition-colors duration-200">
      <Routes>
        <Route path="/welcome" element={isAuthenticated && role === ROLES.ADMIN ? <Navigate to="/" replace /> : <Welcome />} />
        <Route path="/login" element={isAuthenticated && role === ROLES.ADMIN ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated && role === ROLES.ADMIN ? <Navigate to="/" replace /> : <Register />} />

        <Route element={<ProtectedLayout />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/users" element={<UserManager />} />
            <Route path="/reports" element={<AdminReports />} />
            <Route path="/reviews" element={<AdminFeedbackInbox />} />
            <Route path="/b2b" element={<AdminB2B />} />
            <Route path="/hub" element={<MarketHub />} />
            <Route path="/agent-metrics" element={<IndAgentMetrics />} />
            <Route path="/company-metrics" element={<CompanyMetrics />} />
            <Route path="/environmental-report" element={<EnvironmentalReport />} />
            <Route path="/financial-report" element={<FinancialReport />} />
            <Route path="/sovereign-impact" element={<SovereignImpact />} />
            <Route path="/oracle" element={<NetworkOracle />} />
            <Route path="/transfers" element={<PointTransfers />} />
            <Route path="/redemptions" element={<PointRedemptions />} />
            <Route path="/hygenex" element={<HygeneXPage />} />
            <Route path="/settings">
              <Route index element={<SettingsMenu />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="privacy" element={<PrivacySecurityPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="system" element={<SystemConfigPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
      <Toaster position="top-center" richColors />
    </div>
  );
}
