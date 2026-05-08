import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight, Phone, MessageCircle, Settings2 } from 'lucide-react';
import { useAuthStore } from '@cleanflow/core';
import { useNavigate } from 'react-router-dom';
import { ThemeToggleRow } from '@cleanflow/ui';
import { toast } from 'sonner';

export default function SettingsMenu() {
  const { profile, logout } = useAuthStore();
  const navigate = useNavigate();

  const menuItems = [
    { icon: User, label: 'My Profile', subtitle: 'Edit your information', path: '/settings/profile' },
    {icon: Settings2, label: 'Operating Hours', subtitle: 'Global service schedule', path: '/settings/system' },
    { icon: Bell, label: 'Notifications', subtitle: 'Manage alerts', path: '/settings/notifications' },
    { icon: Shield, label: 'Privacy & Security', subtitle: 'Account settings', path: '/settings/privacy' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-semibold dark:text-white">Settings & Profile</h1>

      {/* Profile Card */}
      <div 
        className="w-full card flex items-center gap-4 p-5 text-left"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-3xl shadow-sm">
          {profile?.avatar || '👤'}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-lg dark:text-white">{profile?.name || 'User'}</p>
          <p className="text-sm text-slate-500 font-medium">{profile?.phone}</p>
          <p className="text-xs text-slate-400 mt-1">📍 {profile?.estate || 'Kenya'}</p>
        </div>
      </div>

      {/* Menu Options */}
      <div className="card p-0 divide-y divide-slate-50 dark:divide-slate-800 overflow-hidden shadow-none">
        {menuItems.map((item, i) => (
          <button 
            key={i} 
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:border-primary/30 transition-colors shadow-sm">
              <item.icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold dark:text-slate-200">{item.label}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{item.subtitle}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-primary" />
          </button>
        ))}
        <ThemeToggleRow />
      </div>

      {/* Logout */}
      <button 
        onClick={async () => {
          await logout();
          toast.success('Logged Out', { description: 'You have been securely signed out.' });
          navigate('/login', { replace: true });
        }}
        className="w-full flex items-center justify-center gap-2 text-rose-500 font-semibold text-[15px] py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all"
      >
        <LogOut className="w-5 h-5" /> Secure Sign Out
      </button>

      <p className="text-center text-xs text-slate-400 font-medium pb-20 pt-4">CleanFlow KE v2.1 · Made in Kenya 🇰🇪</p>
    </div>
  );
}
