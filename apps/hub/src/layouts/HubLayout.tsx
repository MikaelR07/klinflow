import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Factory, 
  Users, 
  Wallet, 
  Warehouse, 
  ShoppingCart, 
  Truck, 
  Leaf, 
  LineChart, 
  Settings,
  Menu,
  X,
  Bell,
  Search,
  Sun,
  Moon,
  ChevronDown,
  Building2,
  FileBarChart,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Link2,
  Power, Loader2, LogOut, User as UserIcon
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type NavItem = {
  name: string;
  path: string;
};

type NavSection = {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
};

const NAV_CONFIG: NavSection[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { name: 'Analytics', path: '/' },
    ]
  },
  {
    title: 'Operations',
    icon: Factory,
    items: [
      { name: 'Intake Management', path: '/operations/intake' },
      { name: 'Queue Management', path: '/operations/queue' },
      { name: 'Dispatch Management', path: '/operations/dispatch' },
      { name: 'Batch Tracking', path: '/operations/batch' },
      { name: 'Inventory Ledger', path: '/operations/inventory' },
      { name: 'Quality Inspection', path: '/operations/quality' },
      { name: 'Sorting Workspace', path: '/operations/sorting' },
      { name: 'Processing Tracker', path: '/operations/processing' },
      { name: 'Transfer Orders', path: '/operations/transfers' },
      { name: 'Dispute Control', path: '/operations/disputes' },
    ]
  },
  {
    title: 'Fleet Management',
    icon: Truck,
    items: [
      { name: 'Fleet Overview', path: '/fleet/overview' },
      { name: 'Onboarding Management', path: '/fleet/onboarding' },
      { name: 'Dispatch Management', path: '/fleet/dispatch' },
      { name: 'Vehicles', path: '/fleet/vehicles' },
      { name: 'Fleet Agents', path: '/fleet/agents' },
      { name: 'Route Optimizer', path: '/fleet/routing' },
      { name: 'Fuel Analytics', path: '/fleet/fuel' },
      { name: 'Maintenance', path: '/fleet/maintenance' },
      { name: 'Live Tracking', path: '/fleet/tracking' },
    ]
  },
  {
    title: 'Supply Network',
    icon: Link2,
    items: [
      { name: 'Supplier Directory', path: '/suppliers/directory' },
      { name: 'Supplier Performance', path: '/suppliers/performance' },
      { name: 'Supplier Onboarding', path: '/suppliers/onboarding' },
      { name: 'Supplier Risk', path: '/suppliers/risk' },
      { name: 'Supplier Compliance', path: '/suppliers/compliance' },
    ]
  },
  {
    title: 'Marketplace',
    icon: ShoppingCart,
    items: [
      { name: 'Sales Dashboard', path: '/marketplace/sales' },
      { name: 'Klin Market', path: '/marketplace/market' },
      { name: 'RFQs', path: '/marketplace/rfqs' },
      { name: 'Contracts', path: '/marketplace/contracts' },
      { name: 'Orders', path: '/marketplace/orders' },
      { name: 'Auctions', path: '/marketplace/auctions' },
      { name: 'Buyers', path: '/marketplace/buyers' },
      { name: 'Sellers', path: '/marketplace/sellers' },
      { name: 'Shipments', path: '/marketplace/shipments' },
      { name: 'Receivables', path: '/marketplace/receivables' },
      { name: 'Market Analytics', path: '/marketplace/analytics' },
    ]
  },
  {
    title: 'Material Prices',
    icon: LineChart,
    items: [
      { name: 'Price Dashboard', path: '/intelligence/pricing' },
      { name: 'Price Trends', path: '/intelligence/trends' },
      { name: 'Commodity Intelligence', path: '/intelligence/commodity' },
      { name: 'Supply & Demand Analysis', path: '/intelligence/supply' },
      { name: 'Forecasting', path: '/intelligence/forecasting' },
    ]
  },
  {
    title: 'Finance',
    icon: Wallet,
    items: [
      { name: 'Revenue Analytics', path: '/finance/revenue' },
      { name: 'Agent Disbursements', path: '/finance/disbursements' },
      { name: 'Payouts', path: '/finance/payouts' },
      { name: 'Invoices', path: '/finance/invoices' },
      { name: 'Procurement Spend', path: '/finance/procurement' },
      { name: 'Treasury', path: '/finance/treasury' },
      { name: 'Profitability', path: '/finance/profitability' },
      { name: 'Financial Reports', path: '/finance/reports' },
    ]
  },
  {
    title: 'ESG & Compliance',
    icon: Leaf,
    items: [
      { name: 'Sustainability Dashboard', path: '/esg/dashboard' },
      { name: 'Carbon Tracking', path: '/esg/carbon' },
      { name: 'Environmental Impact', path: '/esg/impact' },
      { name: 'ESG Reporting', path: '/esg/reporting' },
      { name: 'Certifications', path: '/esg/certifications' },
      { name: 'Regulatory Compliance', path: '/esg/compliance' },
    ]
  },

  {
    title: 'Administration',
    icon: ShieldCheck,
    items: [
      { name: 'Users', path: '/admin/users' },
      { name: 'Roles', path: '/admin/roles' },
      { name: 'Permissions', path: '/admin/permissions' },
      { name: 'Integrations', path: '/admin/integrations' },
      { name: 'Settings', path: '/settings' },
    ]
  },
];

export default function HubLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Dashboard': true,
    'Operations': true
  });
  
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { profile, toggleOnline, logout } = useAuthStore();
  const [isTogglingMarketplace, setIsTogglingMarketplace] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleToggleMarketplace = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTogglingMarketplace) return;
    setIsTogglingMarketplace(true);
    try {
      if (toggleOnline) {
        await toggleOnline();
        toast.success(profile?.isOnline ? "Marketplace Closed" : "Marketplace Open!", {
          description: profile?.isOnline ? "Your fleet is now hidden." : "Your company is now visible to residents."
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Toggle failed");
    } finally {
      setIsTogglingMarketplace(false);
    }
  };
  const { notifications } = useNotificationStore();
  const location = useLocation();

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans antialiased transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
      
      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-300
        ${isDarkMode ? 'bg-slate-900 border-white/5 shadow-[2px_0_10px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-[2px_0_10px_rgba(0,0,0,0.05)]'}
        ${isSidebarOpen ? 'translate-x-0 w-60' : '-translate-x-full w-60 lg:translate-x-0'}
        ${isDesktopSidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-60'}
      `}>
        {/* Sidebar Header */}
        <div className={`h-16 flex items-center justify-between px-5 border-b shrink-0 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <div className={`flex items-center gap-3 overflow-hidden ${isDesktopSidebarCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
             <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <Warehouse className="w-4 h-4 text-white" />
             </div>
             <span className={`text-lg font-bold tracking-tight whitespace-nowrap transition-opacity duration-300 ${isDesktopSidebarCollapsed ? 'lg:opacity-0 lg:hidden' : 'opacity-100'} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
               KLINFLOW <span className="text-emerald-500 font-light">MOS</span>
             </span>
          </div>
          
          <button 
            onClick={() => {
              if (window.innerWidth >= 1024) {
                setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
              } else {
                setIsSidebarOpen(false);
              }
            }} 
            className={`hidden lg:flex items-center -space-x-4 text-slate-900 dark:text-white hover:text-emerald-500 transition-colors ${isDesktopSidebarCollapsed ? 'mr-0' : ''}`}
          >
            {isDesktopSidebarCollapsed ? (
               <>
                 <ChevronRight className="w-6 h-6" />
                 <ChevronRight className="w-6 h-6 opacity-80" />
                 <ChevronRight className="w-6 h-6 opacity-60" />
               </>
            ) : (
               <>
                 <ChevronLeft className="w-6 h-6 opacity-60" />
                 <ChevronLeft className="w-6 h-6 opacity-80" />
                 <ChevronLeft className="w-6 h-6" />
               </>
            )}
          </button>

          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-4 space-y-1 ${isDesktopSidebarCollapsed ? 'px-2 lg:items-center lg:flex lg:flex-col' : 'px-4'}`}>
          {NAV_CONFIG.map((section) => (
            <div key={section.title} className={`w-full ${isDesktopSidebarCollapsed ? 'lg:flex lg:flex-col lg:items-center lg:mb-4' : 'mb-6'}`}>
              
              {/* Section Header */}
              <button 
                onClick={() => !isDesktopSidebarCollapsed && toggleSection(section.title)}
                title={isDesktopSidebarCollapsed ? section.title : undefined}
                className={`w-full flex items-center justify-between py-2 text-xs font-medium uppercase tracking-wide transition-colors
                  ${isDesktopSidebarCollapsed ? 'px-0 justify-center' : 'px-2'}
                  ${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <div className={`flex items-center gap-3 ${isDesktopSidebarCollapsed ? 'justify-center w-full' : ''}`}>
                  <section.icon className={`shrink-0 transition-all duration-300 ${isDesktopSidebarCollapsed ? 'w-5 h-5 opacity-100 hover:text-emerald-500' : 'w-4 h-4 opacity-100'}`} />
                  {!isDesktopSidebarCollapsed && <span>{section.title}</span>}
                </div>
                {!isDesktopSidebarCollapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${expandedSections[section.title] ? 'rotate-180' : ''}`} />
                )}
              </button>
              
              {/* Section Items */}
              {!isDesktopSidebarCollapsed && (
                <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out ${expandedSections[section.title] ? 'max-h-[800px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`
                          group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                          ${isActive 
                            ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'bg-emerald-50 text-emerald-700 font-normal')
                            : (isDarkMode ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
                          }
                        `}
                      >
                        <span className="truncate">{item.name}</span>
                        {isActive && <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* User Profile */}
        <div className={`border-t shrink-0 ${isDarkMode ? 'border-white/5 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'} ${isDesktopSidebarCollapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
           <div className={`flex items-center gap-3 ${isDesktopSidebarCollapsed ? 'justify-center' : 'px-2 py-2'}`}>
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400 overflow-hidden shrink-0 border border-emerald-200 dark:border-emerald-500/30">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile?.name ? profile.name.charAt(0) : 'E'
                )}
              </div>
              {!isDesktopSidebarCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                     <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{profile?.name || 'Executive Admin'}</p>
                     <p className={`text-[10px] uppercase tracking-wider font-semibold truncate ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                       HQ Operations
                     </p>
                  </div>
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                     <Settings className="w-4 h-4" />
                  </button>
                </>
              )}
           </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className={`flex-1 flex flex-col min-h-screen overflow-hidden transition-all duration-300 ${isDesktopSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60'}`}>
        
        {/* Header / Topnav */}
        <header className={`h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b z-40 sticky top-0 backdrop-blur-md ${isDarkMode ? 'bg-slate-950/80 border-white/5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]' : 'bg-white/80 border-slate-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]'}`}>
           {/* Left side */}
           <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className={`lg:hidden p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
             >
               <Menu className="w-5 h-5" />
             </button>

             {/* Org Switcher */}
             <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer hover:border-emerald-500/50 transition-colors ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Greenloop Global</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
             </div>
           </div>

           {/* Center Search */}
           <div className="flex-1 max-w-xl px-4 hidden lg:block">
             <div className={`relative flex items-center w-full rounded-full border transition-colors ${isDarkMode ? 'bg-slate-900/50 border-white/10 focus-within:border-emerald-500/50 focus-within:bg-slate-900' : 'bg-slate-50 border-slate-200 focus-within:border-emerald-500/50 focus-within:bg-white'}`}>
                <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search materials, agents, suppliers, RFQs..." 
                  className="w-full bg-transparent border-none text-sm font-medium py-2 pl-10 pr-4 focus:ring-0 outline-none placeholder:text-slate-400 text-slate-900 dark:text-white rounded-full" 
                />
                <div className="absolute right-3 flex items-center gap-1">
                   <kbd className={`hidden xl:inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded border ${isDarkMode ? 'bg-slate-800 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-400'}`}>⌘</kbd>
                   <kbd className={`hidden xl:inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded border ${isDarkMode ? 'bg-slate-800 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-400'}`}>K</kbd>
                </div>
             </div>
           </div>

           {/* Right side */}
           <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Marketplace Toggle */}
              {profile?.agentAccountType === 'company_admin' && (
                <div className="hidden lg:flex font-medium bg-white dark:bg-slate-900 text-[#131722] dark:text-white p-1.5 px-3 rounded-full items-center gap-4 border border-[#e0e3eb] dark:border-slate-700/50 transition-colors mr-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${profile?.isOnline ? 'bg-emerald-500 shadow-none text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500'}`}>
                      {isTogglingMarketplace ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
                    </div>
                    <div className="mr-2 hidden xl:block">
                      <p className="font-bold text-[9px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 leading-none mb-0.5">Marketplace</p>
                      <p className="font-bold text-[10px] text-slate-500 tracking-tight leading-none">{profile?.isOnline ? 'Active' : 'Offline'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleMarketplace}
                    disabled={isTogglingMarketplace}
                    className={`relative w-9 h-5 rounded-full transition-all duration-300 flex items-center px-0.5 ${profile?.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-none ${profile?.isOnline ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              )}

              <button className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${isDarkMode ? 'bg-slate-900 border-white/10 hover:border-emerald-500/50 text-slate-300' : 'bg-white border-slate-200 hover:border-emerald-500/50 text-slate-600'}`}>
                 <FileBarChart className="w-3.5 h-3.5 text-emerald-500" />
                 Report
              </button>

              <div className="w-px h-6 mx-1 bg-slate-200 dark:bg-white/10 hidden sm:block" />

              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-yellow-400' : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'}`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button 
                className={`relative p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                 <Bell className="w-5 h-5" />
                 {unreadCount > 0 && (
                   <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950" />
                 )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-8 h-8 rounded-full border border-[#e0e3eb] dark:border-slate-700/50 overflow-hidden ml-1"
                >
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                      {profile?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-[#e0e3eb] dark:border-slate-700">
                        <p className="text-sm font-bold text-[#131722] dark:text-white truncate">{profile?.name || 'User'}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">{profile?.email}</p>
                      </div>
                      <div className="p-1">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left">
                          <Settings className="w-4 h-4 text-slate-400" />
                          Settings
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left">
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          Account
                        </button>
                      </div>
                      <div className="p-1 border-t border-[#e0e3eb] dark:border-slate-700">
                        <button 
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            if(logout) logout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

           </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-auto relative bg-slate-50/50 dark:bg-slate-950">
           <Outlet />
        </div>

      </main>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <Toaster position="top-right" richColors />
    </div>
  );
}
