import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';

import HubLanding from './pages/HubLanding';
import Register from './pages/Register';
import HubLayout from './layouts/HubLayout';
import { DashboardRedirect } from './components/DashboardRedirect';

// Existing Pages
import ExecutiveDashboard from './pages/dashboards/ExecutiveDashboard';
import OperationsDashboard from './pages/dashboards/OperationsDashboard';
import FleetDashboard from './pages/dashboards/FleetDashboard';
import SalesDashboard from './pages/dashboards/SalesDashboard';
import FinanceDashboard from './pages/dashboards/FinanceDashboard';
import IntakeReceiving from './pages/IntakeReceiving';
import IntakeVerification from './pages/IntakeVerification';
import IndividualAgentIntake from './pages/IndividualAgentIntake';
import WalkInIntake from './pages/WalkInIntake';
import IntakeManagement from './pages/IntakeManagement';
import IntakeHistory from './pages/IntakeHistory';
import InventoryCommand from './pages/InventoryCommand';
import ProcessingTracker from './pages/ProcessingTracker';
import MaterialsReceived from './pages/MaterialsReceived';
import ProfileSettings from './pages/ProfileSettings';
import AccountSecurity from './pages/settings/AccountSecurity';
import Feedback from './pages/settings/Feedback';
import Support from './pages/settings/Support';
import NotificationPreferences from './pages/settings/NotificationPreferences';
import TimezoneRegions from './pages/settings/TimezoneRegions';
import Notifications from './pages/Notifications';
import HubSettings from './pages/HubSettings';
import Settings from './pages/Settings';
import HubAnalyticsDashboard from './pages/dashboards/HubAnalyticsDashboard';
import CustomReports from './pages/analytics/CustomReports';

import FleetOnboarding from './pages/FleetOnboarding';
import FleetAgents from './pages/FleetAgents';
import DispatchManagement from './pages/DispatchManagement';
import SalesDelivery from './pages/SalesDelivery';
import KlinMarket from './pages/KlinMarket';
import AgentComplaints from './pages/AgentComplaints';
import ResidentRequests from './pages/ResidentRequests';
import RFQs from './pages/RFQs';
import RFQResponsesFeed from './pages/RFQResponsesFeed';
import MarketOpenRFQs from './pages/MarketOpenRFQs';
import RFQDetails from './pages/RFQDetails';
import SalesInventory from './pages/SalesInventory';
import LiveAuctions from './pages/LiveAuctions';
import ManageAuctionBids from './pages/ManageAuctionBids';
import SalesOrders from './pages/SalesOrders';
import SalesPipeline from './pages/SalesPipeline';
import BuyerNetwork from './pages/BuyerNetwork';
import SalesContracts from './pages/SalesContracts';
import FleetRecommendations from './pages/FleetRecommendations';
import PriceDashboard from './pages/PriceDashboard';
import AgentDisbursements from './pages/AgentDisbursements';
import TeamManagement from './pages/admin/Users';

// Orphan / Sample Pages removed


// Placeholder Pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
      <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    </div>
    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">{title}</h1>
    <p className="text-slate-500 dark:text-slate-400 max-w-md">This module is currently under construction for the next implementation phase.</p>
  </div>
);

export default function App() {
  const { isDarkMode } = useThemeStore();
  const { profile, isAuthenticated, isInitializing, initializeAuth, currentCompanyId } = useAuthStore();
  const { 
    subscribeToRealtime, 
    fetchNotifications, 
    cleanup: cleanupNotifs 
  } = useNotificationStore();

  // User is authorized if they have a Hub company membership
  const isAuthorized = isAuthenticated && !!currentCompanyId;

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isAuthenticated && profile?.id) {
      fetchNotifications(profile.id, 'hub');
      subscribeToRealtime(profile.id, 'hub');
    }
    return () => cleanupNotifs();
  }, [isAuthenticated, profile?.id, fetchNotifications, subscribeToRealtime, cleanupNotifs]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (isInitializing) {
    return (
      <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-slate-950 text-white' 
          : 'bg-slate-50 text-slate-900'
      }`}>
        {/* Ambient Radial Gradient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Central Glassmorphic Card */}
        <div className={`relative px-10 py-9 rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-col items-center max-w-sm w-full mx-4 transition-all ${
          isDarkMode 
            ? 'bg-slate-900/80 border-white/10 shadow-black/50' 
            : 'bg-white/90 border-slate-200/80 shadow-slate-200/60'
        }`}>
          {/* Logo with Animated Aura Glow */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl animate-pulse" />
            <div className={`relative w-20 h-20 rounded-2xl border p-3.5 flex items-center justify-center transition-all ${
              isDarkMode 
                ? 'bg-slate-900 border-white/10 shadow-inner' 
                : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <img 
                src="/app-logo.webp" 
                alt="Klinflow Logo" 
                className="w-full h-full object-contain animate-pulse" 
              />
            </div>
          </div>

          {/* Title & Brand Badge */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Klinflow MOS Engine
            </div>
            <h3 className={`text-base font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Securing Hub Session
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Verifying workspace credentials...
            </p>
          </div>

          {/* Animated Loading Dots Indicator */}
          <div className="flex items-center gap-2 mt-6">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0ms]" />
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:150ms]" />
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<HubLanding />} />
        </Routes>
      </BrowserRouter>
    );
  }

return (
     <BrowserRouter>
       <Routes>
<Route element={<HubLayout />}>
           {/* Dashboard redirect based on user role */}
           <Route path="/" element={<DashboardRedirect />} />
           
           {/* Executive Dashboard (accessible to owners and executive_viewer) */}
           <Route path="/dashboard/executive" element={<ExecutiveDashboard />} />
           
           {/* Operations Dashboard */}
           <Route path="/dashboard/operations" element={<OperationsDashboard />} />
           
           {/* Fleet Dashboard */}
           <Route path="/dashboard/fleet" element={<FleetDashboard />} />
           
           {/* Sales Dashboard */}
           <Route path="/dashboard/sales" element={<SalesDashboard />} />
           
           {/* Finance Dashboard */}
           <Route path="/dashboard/finance" element={<FinanceDashboard />} />
           
           {/* Operations */}
           <Route path="/operations/intake" element={<IntakeManagement />} />
           <Route path="/operations/intake/history" element={<IntakeHistory />} />
           <Route path="/operations/received" element={<MaterialsReceived />} />
           <Route path="/operations/intake/fleet" element={<IntakeReceiving />} />
           <Route path="/operations/intake/verify" element={<IntakeVerification />} />
           <Route path="/operations/intake/individual" element={<IndividualAgentIntake />} />
           <Route path="/operations/intake/walkin" element={<WalkInIntake />} />
           <Route path="/operations/inventory" element={<InventoryCommand />} />
           <Route path="/operations/batch" element={<ProcessingTracker />} />
           
           {/* Fleet Management */}

           <Route path="/fleet/onboarding" element={<FleetOnboarding />} />
           <Route path="/fleet/dispatch" element={<DispatchManagement />} />
           <Route path="/fleet/deliveries" element={<SalesDelivery />} />
           <Route path="/fleet/agents" element={<FleetAgents />} />
           <Route path="/fleet/complaints" element={<AgentComplaints />} />
           <Route path="/fleet/reports" element={<PlaceholderPage title="Fleet Reports" />} />
           
           {/* Marketplace */}
           <Route path="/marketplace/resident-requests" element={<ResidentRequests />} />
           <Route path="/marketplace/market" element={<KlinMarket />} />
           <Route path="/marketplace/inventory" element={<SalesInventory />} />
           <Route path="/marketplace/auctions" element={<LiveAuctions />} />
           <Route path="/marketplace/auctions/:id/bids" element={<ManageAuctionBids />} />
           <Route path="/marketplace/orders" element={<SalesOrders />} />
           <Route path="/marketplace/contracts" element={<SalesContracts />} />
           <Route path="/marketplace/rfqs" element={<RFQs />} />
           <Route path="/marketplace/rfqs/responses" element={<RFQResponsesFeed />} />
           <Route path="/marketplace/market-open-rfqs" element={<MarketOpenRFQs />} />
           <Route path="/marketplace/rfqs/:id" element={<RFQDetails />} />
           <Route path="/marketplace/buyers" element={<BuyerNetwork />} />
           <Route path="/marketplace/pipeline" element={<SalesPipeline />} />
           <Route path="/marketplace/recommendations" element={<FleetRecommendations />} />
           
           {/* Market Intelligence */}
           <Route path="/intelligence/pricing" element={<PriceDashboard />} />
           

           
           {/* Finance */}
           <Route path="/finance/operations" element={<PlaceholderPage title="Financial Operations" />} />
           <Route path="/finance/revenue" element={<PlaceholderPage title="Revenue Analytics" />} />
           <Route path="/finance/disbursements" element={<AgentDisbursements />} />
           <Route path="/finance/seller-payouts" element={<PlaceholderPage title="Seller Payouts" />} />
           <Route path="/finance/agent-wallets" element={<PlaceholderPage title="Agent Wallets" />} />
           <Route path="/finance/payment-approvals" element={<PlaceholderPage title="Payment Approvals" />} />
           <Route path="/finance/receivables" element={<PlaceholderPage title="Receivables" />} />
           <Route path="/finance/payables" element={<PlaceholderPage title="Payables" />} />
           <Route path="/finance/expense-management" element={<PlaceholderPage title="Expense Management" />} />
           <Route path="/finance/purchase-orders" element={<PlaceholderPage title="Purchase Orders" />} />
           <Route path="/finance/procurement" element={<PlaceholderPage title="Procurement Spend" />} />
           <Route path="/finance/invoices" element={<PlaceholderPage title="Invoices" />} />
           <Route path="/finance/reports" element={<PlaceholderPage title="Reports" />} />
           <Route path="/finance/risk-insights" element={<PlaceholderPage title="Risk & AI Insights" />} />
           
           {/* ESG & Compliance */}
           <Route path="/esg/dashboard" element={<PlaceholderPage title="Sustainability Dashboard" />} />
           <Route path="/esg/impact" element={<PlaceholderPage title="Environmental Impact" />} />
           <Route path="/esg/reporting" element={<PlaceholderPage title="ESG Reporting" />} />
           <Route path="/esg/certifications" element={<PlaceholderPage title="Certifications" />} />
           <Route path="/esg/compliance" element={<PlaceholderPage title="Regulatory Compliance" />} />
           
           {/* Administration */}
           <Route path="/admin/users" element={<TeamManagement />} />

           {/* Settings */}
           <Route path="/settings/profile" element={<ProfileSettings />} />
           {/* <Route path="/settings/security" element={<AccountSecurity />} /> */}
           <Route path="/settings/feedback" element={<Feedback />} />
           {/* <Route path="/settings/support" element={<Support />} /> */}
           {/* <Route path="/settings/notification-preferences" element={<NotificationPreferences />} /> */}
           {/* <Route path="/settings/regions" element={<TimezoneRegions />} /> */}
           <Route path="/settings/notifications" element={<Notifications />} />
           <Route path="/settings/hub" element={<HubSettings />} />
           <Route path="/settings" element={<Settings />} />

           {/* SAMPLE - Orphan Pages for Review - Removed */}
           
           {/* Fallback */}
           <Route path="*" element={<Navigate to="/" replace />} />
         </Route>
      </Routes>
    </BrowserRouter>
  );
}
