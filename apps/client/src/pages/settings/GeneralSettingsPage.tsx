import { useNavigate } from 'react-router-dom';
import {
  User, Bell, ShieldCheck, HelpCircle, ChevronRight, MessageCircle, ArrowLeft, Building2
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';

export default function GeneralSettingsPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const isSeller = profile?.role === 'seller';

  const secondaryMenu = [
    {
      icon: User, label: 'Profile Settings', subtitle: 'Edit Profile & Location',
      path: '/settings/profile', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10'
    },

    {
      icon: ShieldCheck, label: 'Privacy and Security', subtitle: 'Passcode & Encryption',
      path: '/settings/privacy', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'
    },
    ...(isSeller ? [
      {
        icon: Building2, label: 'Business Profile', subtitle: 'NEMA & Trade Details',
        path: '/settings/profile', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10'
      }
    ] : []),
    {
      icon: HelpCircle, label: 'Support Center', subtitle: 'Help & WhatsApp',
      path: '/settings/support', color: 'text-slate-600 bg-slate-50 dark:bg-slate-500/10'
    },
    {
      icon: MessageCircle, label: 'Give Feedback', subtitle: 'Help us improve',
      path: '/settings/feedback', color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10'
    },
  ];

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-800 transition-colors pb-5 ">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors active:scale-95">
            <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-slate-900 dark:text-white capitalize tracking-tighter leading-none">General Settings</h1>
            <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mt-0.5">Manage Your Account</p>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+3.25rem)] pb-6 max-w-lg mx-auto w-full space-y-6 px-1.5">
        
        {/* ── SECONDARY SETTINGS MENU ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {secondaryMenu.map((item, i) => (
              <button
                key={i}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-[10px] text-slate-400 capitalize tracking-widest mt-0.5">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ))}
          </div>
        </div>

      </main>

    </div>
  );
}
