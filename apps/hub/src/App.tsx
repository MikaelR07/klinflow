import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ScanLine, 
  Warehouse, 
  RefreshCcw, 
  Truck, 
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  ShieldAlert
} from 'lucide-react';

import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { Toaster } from 'sonner';
import HubDashboard from './pages/HubDashboard';
import Inventory from './pages/Inventory';
import CheckIn from './pages/CheckIn';
import IncomingDrops from './pages/IncomingDrops';
import ManualAudits from './pages/ManualAudits';
import HubLanding from './pages/HubLanding';
import HubSettings from './pages/HubSettings';
import Notifications from './pages/Notifications';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { profile, isAuthenticated, isInitializing, initializeAuth, checkAppRole } = useAuthStore();
  const { 
    notifications, 
    subscribeToRealtime, 
    fetchNotifications, 
    cleanup: cleanupNotifs 
  } = useNotificationStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Redirect to Landing if not an admin/hub manager
  const isAuthorized = isAuthenticated && (profile?.role === 'admin' || profile?.agentAccountType === 'company_admin');

  // Boot sequence
  React.useEffect(() => {
    checkAppRole('admin');
    initializeAuth();
  }, []);

  // Sync real-time notifications
  React.useEffect(() => {
    if (isAuthenticated && profile?.id) {
      fetchNotifications(profile.id, 'hub');
      subscribeToRealtime(profile.id, 'hub');
    }
    return () => cleanupNotifs();
  }, [isAuthenticated, profile?.id]);

  // Sync theme class with document
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (isInitializing) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading OS...</div>;
  }

  if (!isAuthorized) {
    return <HubLanding />;
  }

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'incoming', label: 'Live Radar', icon: Truck },
    { id: 'checkin', label: 'Gate Check-In', icon: ScanLine },
    { id: 'audits', label: 'Manual Audits', icon: ShieldAlert },
    { id: 'inventory', label: 'Inventory', icon: Warehouse },
    { id: 'processing', label: 'Processing', icon: RefreshCcw },
    { id: 'settings', label: 'Hub Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <HubDashboard onNavigate={setActiveTab} />;
      case 'incoming': return <IncomingDrops />;
      case 'inventory': return <Inventory />;
      case 'checkin': return <CheckIn />;
      case 'audits': return <ManualAudits />;
      case 'settings': return <HubSettings />;
      case 'notifications': return <Notifications />;
      default: return <HubDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/20">
      
      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 glass border-r border-slate-200 dark:border-white/5 
        transition-transform duration-300 lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-6">
          
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Warehouse className="w-5 h-5 text-white" />
               </div>
               <span className="text-xl font-semibold tracking-tighter">Klinflow <span className="text-primary">Hub</span></span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold uppercase tracking-widest transition-all
                  ${activeTab === item.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}
                `}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto p-5 bg-primary/5 rounded-3xl border border-primary/10">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-semibold text-slate-500 overflow-hidden">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile?.name ? profile.name.charAt(0) : 'U'
                  )}
                </div>
                <div>
                   <p className="text-xs font-semibold text-slate-900 dark:text-white">{profile?.name || 'Unknown User'}</p>
                   <p className="text-xs font-semibold text-slate-400 uppercase">
                     {profile?.agentAccountType === 'company_admin' ? 'Company Admin' : 'Hub Manager'}
                   </p>
                </div>
             </div>
          </div>

        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 lg:ml-72 min-h-screen">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 h-20 glass border-b border-slate-200 dark:border-white/5 px-6 flex items-center justify-between">
           <button 
             onClick={() => setIsSidebarOpen(true)}
             className="p-2 lg:hidden"
           >
             <Menu className="w-6 h-6 text-slate-900 dark:text-white" />
           </button>

           <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/5">
              <Search className="w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Global Hub Search..." className="bg-transparent border-none text-xs focus:ring-0 w-64" />
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 text-slate-400 hover:text-primary transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`relative p-2 transition-colors ${activeTab === 'notifications' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
              >
                 <Bell className="w-6 h-6" />
                 {unreadCount > 0 && (
                   <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 text-xs font-semibold text-white flex items-center justify-center animate-bounce-in">
                     {unreadCount}
                   </span>
                 )}
              </button>
              <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden font-semibold text-slate-500">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile?.name ? profile.name.charAt(0) : 'U'
                )}
              </div>
           </div>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
           {renderContent()}
        </div>
      </main>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <Toaster position="top-right" richColors />
    </div>
  );
}
