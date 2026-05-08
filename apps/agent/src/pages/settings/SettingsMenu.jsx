import { User, Bell, Shield, LogOut, ChevronRight, Phone, MessageCircle, Truck, BadgeCheck, Clock, DollarSign } from 'lucide-react';
import { useAuthStore } from '@cleanflow/core';
import { useNavigate } from 'react-router-dom';
import { ThemeToggleRow } from '@cleanflow/ui';
import { toast } from 'sonner';

export default function SettingsMenu() {
  const { profile, logout } = useAuthStore();
  const navigate = useNavigate();

  // Derive status directly — no stale state
  const isStaff = profile?.isStaff === true || profile?.is_staff === true;
  const hasFleetId = !!(profile?.fleetId || profile?.fleet_id);
  const isVerified = isStaff || hasFleetId;
  const isPending = !isVerified && (profile?.notes || '').includes('staff_application_pending');

  const menuItems = [
    { icon: User, label: 'My Profile', subtitle: 'Edit your information', path: '/settings/profile' },
    { icon: DollarSign, label: 'Pricing & Services', subtitle: 'Manage your fees and rates', path: '/settings/configuration' },
    { icon: Bell, label: 'Notifications', subtitle: 'Manage alerts', path: '/settings/notifications' },
    { icon: Shield, label: 'Privacy & Security', subtitle: 'Account settings', path: '/settings/privacy' },
    { icon: Phone, label: 'Contact Support', subtitle: 'Call or WhatsApp', path: '/settings/support' },
    { icon: MessageCircle, label: 'Give Feedback', subtitle: 'Help us improve', path: '/settings/feedback' },
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-20">
      <h1 className="text-xl font-semibold dark:text-white tracking-tight">Settings & Profile</h1>

      {/* Profile Card (Non-clickable) */}
      <div 
        className="w-full card flex items-center gap-4 p-5 text-left bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-3xl shadow-sm overflow-hidden border-2 border-white dark:border-slate-800">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-full h-full object-cover" />
          ) : (
            profile?.avatar || '👤'
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-lg dark:text-white flex items-center gap-2">
            {profile?.name || 'Agent'}
            {isVerified && <BadgeCheck className="w-5 h-5 text-primary fill-primary/10" />}
          </p>
          <p className="text-sm text-slate-500 font-semibold font-mono">{profile?.phone}</p>
        </div>
      </div>

      {/* Staff Application / Status Card - Only for Independent Agents */}
      {profile?.agent_account_type !== 'fleet_driver' && (
        <button 
          onClick={() => navigate('/settings/staff-application')}
          className={`w-full p-6 rounded-[2.5rem] flex items-center gap-4 text-left transition-all active:scale-95 shadow-xl 
            ${isVerified ? 'bg-slate-900 text-white' : 
              isPending ? 'bg-orange-500 text-white shadow-orange-500/20' : 
              'bg-primary text-white shadow-primary/20'}`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center 
            ${isVerified || isPending ? 'bg-white/10' : 'bg-white/20'}`}>
            {isPending ? <Clock className="w-6 h-6 text-white" /> : <Truck className="w-6 h-6 text-white" />}
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/70 leading-none mb-1">
              {isVerified ? 'CleanFlow Staff' : isPending ? 'Application Sent' : 'Join CleanFlow Team'}
            </h4>
            <p className="text-lg font-semibold tracking-tight leading-tight">
              {isVerified ? profile?.fleetId || profile?.fleet_id || 'Verified Member' : isPending ? 'Tap to Check Status' : 'Apply to Work With Us'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Menu Options */}
      <div className="card p-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] divide-y divide-slate-50 dark:divide-slate-800 overflow-hidden shadow-sm">
        {menuItems.map((item, i) => (
          <button 
            key={i} 
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-center group-hover:border-primary/30 transition-colors shadow-sm">
              <item.icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold dark:text-slate-200">{item.label}</p>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.subtitle}</p>
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
        className="w-full flex items-center justify-center gap-2 text-rose-500 font-semibold text-sm py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[2rem] transition-all"
      >
        <LogOut className="w-5 h-5" /> SECURE SIGN OUT
      </button>

      <p className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest pt-4">CleanFlow KE v2.1 · Nairobi 🇰🇪</p>
    </div>
  );
}
