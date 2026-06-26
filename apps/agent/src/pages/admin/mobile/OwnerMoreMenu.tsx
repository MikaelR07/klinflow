import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { 
  Settings, User, FileText, Bell, 
  HelpCircle, LogOut, ChevronRight, ShieldCheck, ArrowLeft 
} from 'lucide-react';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

export default function OwnerMoreMenu() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err: any) {
      toast.error('Error logging out', { description: err.message });
    }
  };

  const menuGroups = [
    {
      title: 'Preferences',
      items: [
        { icon: Settings, label: 'Settings', path: '/settings', color: 'text-slate-600 dark:text-slate-400' },
        { icon: User, label: 'Profile', path: '/settings/profile', color: 'text-slate-600 dark:text-slate-400' },
        { icon: Bell, label: 'Notifications', path: '/settings/notifications', color: 'text-slate-600 dark:text-slate-400' },
      ]
    },
    {
      title: 'Company',
      items: [
        { icon: ShieldCheck, label: 'Verification', path: '/settings/verification', color: 'text-emerald-600 dark:text-emerald-400' },
        { icon: FileText, label: 'Documents', path: '/settings/documents', color: 'text-blue-600 dark:text-blue-400' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', path: '/settings/help', color: 'text-amber-600 dark:text-amber-400' },
      ]
    }
  ];

  return (
    <div className="min-h-screen animate-in fade-in duration-300">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-lg mx-auto bg-white dark:bg-slate-950 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900 shadow-sm">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 -ml-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black text-slate-600 dark:text-white tracking-tight">More</h1>
          </div>
        </div>
      </div>

      {/* Content with top padding for fixed nav */}
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+5rem)] pb-6 space-y-6 px-2">
      
      {/* ── PROFILE CARD ── */}
      <div className="px-0 pt-2">
        <div className="bg-[#F8F8FF] dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-emerald-500/20 shrink-0">
            {profile?.avatarUrl ? (
              <OptimizedImage src={getThumbnailUrl(profile.avatarUrl, { width: 150 })} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-400">
                {profile?.name?.charAt(0) || '👤'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-slate-900 dark:text-white truncate">{profile?.name}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{profile?.companyName}</p>
            <p className="text-[10px] font-medium text-emerald-500 mt-0.5 truncate">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* ── MENU GROUPS ── */}
      <div className="space-y-5 px-0">
        {menuGroups.map((group, i) => (
          <div key={i} className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{group.title}</h3>
            <div className="bg-[#F8F8FF] dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] overflow-hidden shadow-sm">
              {group.items.map((item, j) => (
                <button
                  key={j}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors ${j !== group.items.length - 1 ? 'border-b border-slate-50 dark:border-slate-800/50' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center shrink-0`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="flex-1 text-left text-sm font-bold text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── LOGOUT ── */}
      <div className="px-0 pt-2">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl font-black text-sm tracking-widest uppercase active:scale-[0.98] transition-all"
        >
          <LogOut className="w-5 h-5" /> Log Out
        </button>
      </div>

      </div>
    </div>
  );
}
