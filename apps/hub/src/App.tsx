import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';

import HubLanding from './pages/HubLanding';
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
import DisputeControl from './pages/DisputeControl';
import InventoryCommand from './pages/InventoryCommand';
import BatchTracking from './pages/BatchTracking';
import TransferOrders from './pages/TransferOrders';
import MaterialsReceived from './pages/MaterialsReceived';
import AutomatedPayouts from './pages/AutomatedPayouts';
import ESGImpact from './pages/ESGImpact';
import NationalIntelligence from './pages/NationalIntelligence';
import AIOperations from './pages/AIOperations';
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
import FleetOverview from './pages/FleetOverview';
import FleetMaintenance from './pages/FleetMaintenance';
import RouteOptimizer from './pages/RouteOptimizer';
import FleetOnboarding from './pages/FleetOnboarding';
import FleetAgents from './pages/FleetAgents';
import FleetVehicles from './pages/FleetVehicles';
import DispatchManagement from './pages/DispatchManagement';
import DispatchQueue from './pages/DispatchQueue';
import AgentPickups from './pages/AgentPickups';
import SalesDelivery from './pages/SalesDelivery';
import KlinMarket from './pages/KlinMarket';
import AgentComplaints from './pages/AgentComplaints';
import RFQs from './pages/RFQs';
import RFQDetails from './pages/RFQDetails';
import Auctions from './pages/Auctions';
import SalesPipeline from './pages/SalesPipeline';
import BuyerNetwork from './pages/BuyerNetwork';
import SellerNetwork from './pages/SellerNetwork';
import SalesOrders from './pages/SalesOrders';
import InventoryListings from './pages/InventoryListings';
import SalesContracts from './pages/SalesContracts';
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
      <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center">
        <img src="/app-logo.webp" alt="Klinflow" className="w-20 h-20 mb-6 opacity-80 animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">Securing Session</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return <HubLanding />;
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
           <Route path="/operations/received" element={<MaterialsReceived />} />
           <Route path="/operations/intake/fleet" element={<IntakeReceiving />} />
           <Route path="/operations/intake/verify" element={<IntakeVerification />} />
           <Route path="/operations/intake/individual" element={<IndividualAgentIntake />} />
           <Route path="/operations/intake/walkin" element={<WalkInIntake />} />
           <Route path="/operations/dispatch" element={<DispatchQueue />} />
           <Route path="/operations/disputes" element={<DisputeControl />} />
           <Route path="/operations/inventory" element={<InventoryCommand />} />
           <Route path="/operations/batch" element={<BatchTracking />} />
           <Route path="/operations/transfers" element={<TransferOrders />} />
           <Route path="/operations/reports" element={<PlaceholderPage title="Operations Reports" />} />
           
           {/* Fleet Management */}
           <Route path="/fleet/overview" element={<FleetOverview />} />
           <Route path="/fleet/onboarding" element={<FleetOnboarding />} />
           <Route path="/fleet/vehicles" element={<FleetVehicles />} />
           <Route path="/fleet/dispatch" element={<DispatchManagement />} />
           <Route path="/fleet/pickups" element={<AgentPickups />} />
           <Route path="/fleet/deliveries" element={<SalesDelivery />} />
           <Route path="/fleet/agents" element={<FleetAgents />} />
           <Route path="/fleet/routing" element={<RouteOptimizer />} />
           <Route path="/fleet/maintenance" element={<FleetMaintenance />} />
           <Route path="/fleet/complaints" element={<AgentComplaints />} />
           <Route path="/fleet/reports" element={<PlaceholderPage title="Fleet Reports" />} />
           
           {/* Marketplace */}
           <Route path="/marketplace/market" element={<KlinMarket />} />
           <Route path="/marketplace/listings" element={<InventoryListings />} />
           <Route path="/marketplace/orders" element={<SalesOrders />} />
           <Route path="/marketplace/contracts" element={<SalesContracts />} />
           <Route path="/marketplace/rfqs" element={<RFQs />} />
           <Route path="/marketplace/rfqs/:id" element={<RFQDetails />} />
           <Route path="/marketplace/auctions" element={<Auctions />} />
           <Route path="/marketplace/buyers" element={<BuyerNetwork />} />
           <Route path="/marketplace/sellers" element={<SellerNetwork />} />
           <Route path="/marketplace/pipeline" element={<SalesPipeline />} />
           <Route path="/marketplace/reports" element={<PlaceholderPage title="Marketplace Reports" />} />
           
           {/* Market Intelligence */}
           <Route path="/intelligence/pricing" element={<PriceDashboard />} />
           

           
           {/* Finance */}
           <Route path="/finance/operations" element={<PlaceholderPage title="Financial Operations" />} />
           <Route path="/finance/revenue" element={<PlaceholderPage title="Revenue Analytics" />} />
           <Route path="/finance/disbursements" element={<AgentDisbursements />} />
           <Route path="/finance/seller-payouts" element={<PlaceholderPage title="Seller Payouts" />} />
           <Route path="/finance/payouts" element={<AutomatedPayouts />} />
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
           <Route path="/esg/carbon" element={<ESGImpact />} />
           <Route path="/esg/impact" element={<PlaceholderPage title="Environmental Impact" />} />
           <Route path="/esg/reporting" element={<PlaceholderPage title="ESG Reporting" />} />
           <Route path="/esg/certifications" element={<PlaceholderPage title="Certifications" />} />
           <Route path="/esg/compliance" element={<PlaceholderPage title="Regulatory Compliance" />} />
           
           {/* Administration */}
           <Route path="/admin/users" element={<TeamManagement />} />

           {/* Settings */}
           <Route path="/settings/profile" element={<ProfileSettings />} />
           <Route path="/settings/security" element={<AccountSecurity />} />
           <Route path="/settings/feedback" element={<Feedback />} />
           <Route path="/settings/support" element={<Support />} />
           <Route path="/settings/notification-preferences" element={<NotificationPreferences />} />
           <Route path="/settings/regions" element={<TimezoneRegions />} />
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
