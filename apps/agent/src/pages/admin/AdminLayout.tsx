import { Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { LayoutDashboard, Users, Bell, MoreHorizontal, CheckCircle2, ShieldCheck, Search, Sun, Moon, MapPin, ChevronDown } from 'lucide-react';
import { LoadingScreen } from '@klinflow/ui/components/Loading';
import BottomNav from '@klinflow/ui/components/BottomNav';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';

export default function AdminLayout() {
  const { profile } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  const OWNER_NAV = [
    { path: '/', icon: LayoutDashboard, label: 'Overview' },
    { path: '/approvals', icon: CheckCircle2, label: 'Approvals' },
    { path: '/fleet', icon: Users, label: 'Fleet' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
    { path: '/settings', icon: MoreHorizontal, label: 'More' },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-lg mx-auto bg-white dark:bg-slate-950 transition-colors duration-200">
      
      {/* Fixed Top Bar — Only on homepage */}
      {isHomePage && (
        <div className="fixed top-0 left-0 right-0 z-[100] max-w-lg mx-auto bg-[#F8F8FF] dark:bg-slate-950 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900 shadow-sm transition-all duration-300">
          <div className="pt-[calc(env(safe-area-inset-top,1rem)+1.1rem)] pb-0.5 px-4 flex items-center justify-between">
            
            <div className="flex items-center gap-2">
              {/* Avatar on the Left */}
              <div 
                onClick={() => navigate('/settings')}
                className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-transparent hover:border-emerald-500 transition-colors cursor-pointer shrink-0"
              >
                {(profile?.avatarUrl || profile?.avatar) ? (
                  <img 
                    src={getThumbnailUrl((profile.avatarUrl || profile.avatar)!, { width: 100 })} 
                    className="w-full h-full object-cover" 
                    alt="Avatar"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-400">
                    {profile?.name?.charAt(0).toUpperCase() || '👤'}
                  </div>
                )}
              </div>

              {/* Welcome Text */}
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tight leading-none flex items-center gap-1.5">
                  Welcome, {profile?.name?.split(' ')[0] || 'Owner'} 👋
                </h1>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <p className="text-[10px] font-bold text-slate-500 capitalize tracking-widest truncate max-w-[150px]">
                    {(typeof profile?.location === 'string' ? profile.location : profile?.location?.estate) || 'Nairobi, Kenya'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Search Icon */}
              <button 
                className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              {/* Notification Bell on the Right */}
              <button 
                onClick={() => navigate('/alerts')}
                className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-800"></span>
              </button>
            </div>
          </div>

          {/* Company Name Bottom Center */}
          <div className="flex items-center justify-center pb-2 ">
            <button className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 transition-colors">
              <span className="text-[11px] font-bold tracking-widest capitalize">
                {profile?.companyName || 'Company Portal'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 ${isHomePage ? 'pt-[calc(env(safe-area-inset-top,1.5rem)+6.5rem)]' : 'pt-0'} pb-[calc(env(safe-area-inset-bottom,0px)+6rem)] px-2 sm:px-1`}>
        <Suspense fallback={<LoadingScreen message="Loading Dashboard..." />}>
          <Outlet />
        </Suspense>
      </div>

      {/* Fixed Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] max-w-lg mx-auto pb-[env(safe-area-inset-bottom,0px)] bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 transition-colors duration-200">
        <BottomNav items={OWNER_NAV} />
      </div>
      
    </div>
  );
}
