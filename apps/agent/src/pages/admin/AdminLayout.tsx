import { Suspense, useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { LayoutDashboard, Users, Settings, LogOut, Menu, X, Truck, DollarSign, Banknote } from 'lucide-react';
import { LoadingScreen } from '@klinflow/ui/components/Loading';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, profile } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending fund requests count + real-time updates
  useEffect(() => {
    if (!profile?.id) return;

    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('fund_requests')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.id)
        .eq('status', 'pending');

      if (!error && count !== null) {
        setPendingCount(count);
      }
    };

    fetchCount();

    // Listen for new requests in real-time
    const channel = supabase
      .channel('admin-fund-badge')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fund_requests',
        filter: `company_id=eq.${profile.id}`
      }, () => {
        fetchCount(); // Re-fetch count on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Agents', path: '/admin/agents', icon: Users },
    { name: 'Earnings', path: '/admin/earnings', icon: DollarSign },
    { name: 'Fund Requests', path: '/admin/finance', icon: Banknote, badge: pendingCount },
    { name: 'Pricing & Services', path: '/settings/configuration', icon: Settings },
    { name: 'System Settings', path: '/settings', icon: Menu },
  ];

  return (
    <div className="flex min-h-dvh">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">FleetHub</span>
          </div>
          <button className="lg:hidden p-2 text-slate-500" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Command Center</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.name}</span>
                {item.badge > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-rose-500/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info / Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg shadow-sm border border-emerald-200">
              {profile?.avatar || '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{profile?.name}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Company Admin</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4 shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors relative"
          >
            <Menu className="w-6 h-6" />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
          <span className="text-lg font-semibold text-slate-900 dark:text-white">FleetHub</span>
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Suspense fallback={<LoadingScreen message="Loading Dashboard..." />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
