import {
  User, Bell, Shield, LogOut, ChevronRight, Phone, MessageCircle,
  Truck, BadgeCheck, Clock, DollarSign, Brain, Settings,
  Wallet, ArrowUpRight, ArrowDownLeft, History, Package,
  Search, Briefcase, Star, ShieldCheck, HelpCircle, X, Loader2, Zap, BarChart3
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { supabase } from '@klinflow/supabase';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useNavigate } from 'react-router-dom';
import ThemeToggleRow from '@klinflow/ui/components/ThemeToggleRow';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsMenu() {
  const { profile, logout, fetchProfile, depositToWallet } = useAuthStore();
  const { earnings, fetchEarnings } = useAgentStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [companyBalance, setCompanyBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const [imgError, setImgError] = useState(false);
  const [saveChatHistory, setSaveChatHistory] = useState(() => localStorage.getItem('saveAiChatHistory') === 'true');

  useEffect(() => {
    fetchProfile();
    fetchEarnings();
  }, []);


  const isStaff = profile?.isStaff === true;
  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';
  const isCompanyOwner = profile?.agentAccountType === 'company_admin';
  const isFleet = isFleetDriver || isCompanyOwner;
  const agentTypeLabel = isFleet ? 'Fleet Agent' : 'Solo Agent';
  const displayBalance = profile?.walletBalance || 0;
  const balanceLabel = 'Wallet Balance';

  const stats = [
    { label: 'Rating', value: earnings.rating?.toFixed(1) || '5.0', icon: Star, color: 'text-amber-500' },
    { label: 'Jobs', value: earnings.totalJobs || 0, icon: Briefcase, color: 'text-indigo-500' },
    { label: 'Weight', value: `${(earnings.totalKg || 0).toLocaleString()}kg`, icon: Package, color: 'text-emerald-500' },
  ];

  const quickActions = [
    { label: 'Dashboard', icon: BarChart3, path: '/earnings', color: 'bg-emerald-500' },
    { label: 'Warehouse', icon: Package, path: '/warehouse', color: 'bg-indigo-500' },
    { label: 'Pricing', icon: Settings, path: '/settings/configuration', color: 'bg-blue-500' },
    { label: 'Reviews', icon: Star, path: '/reviews', color: 'bg-amber-500' },
  ];

  const secondaryMenu = [
    { icon: User, label: 'Profile Settings', subtitle: 'Personal info & location', path: '/settings/profile', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' },
    { icon: Bell, label: 'Notifications', subtitle: 'Manage alerts & SMS', path: '/settings/notifications', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
    { icon: ShieldCheck, label: 'Privacy & Security', subtitle: 'Passcode & Encryption', path: '/settings/privacy', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
    { icon: Briefcase, label: 'Staff Application', subtitle: 'Join the Klinflow Team', path: '/settings/staff-application', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' },
    { icon: HelpCircle, label: 'Support Center', subtitle: 'Help & WhatsApp', path: '/settings/support', color: 'text-slate-600 bg-slate-50 dark:bg-slate-500/10' },
    { icon: MessageCircle, label: 'Give Feedback', subtitle: 'Help us improve', path: '/settings/feedback', color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F8FF] dark:bg-slate-800 transition-colors pb-24">
      {/* FIXED TOP NAV */}
      {!isCompanyOwner && (
        <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
          <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-lg font-black text-slate-900 dark:text-white capitalize tracking-tighter leading-none">Account</h1>
              <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mt-0.5">Profile & Settings</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 shadow-sm shadow-primary/10">
                <p className="text-[10px] font-black text-primary capitalize tracking-[0.2em]">{agentTypeLabel}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className={`flex-1 ${isCompanyOwner ? 'pt-8' : 'pt-[calc(env(safe-area-inset-top,1rem)+3.25rem)]'} pb-6 max-w-lg mx-auto w-full space-y-6 px-1.5`}>
        {/* ── HERO BENTO CARD ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-emerald-600 to-teal-700 p-4 text-white mb-6 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />

          <div className="relative z-10 space-y-2.5">
            {/* Profile Section */}
            <div className="flex items-center gap-4 group/profile cursor-pointer" onClick={() => navigate('/settings/profile')}>
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-white shadow-md flex items-center justify-center overflow-hidden transition-transform group-hover/profile:scale-105">
                  {(profile?.avatarUrl || profile?.avatar) && !imgError ? (
                    <img
                      src={getThumbnailUrl((profile.avatarUrl || profile.avatar)!, { width: 150 })}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="text-xl">👤</div>
                  )}
                </div>
                {isStaff && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-white text-primary p-0.5 rounded-full shadow-md">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black text-white leading-tight truncate">
                  {profile?.name || 'Klinflow Agent'}
                </h2>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/settings/profile'); }}
                  className="flex items-center gap-1 mt-1 text-emerald-250 font-bold text-[9px] capitalize tracking-[0.2em] hover:text-white transition-colors"
                >
                  Edit Profile <ChevronRight className="w-2 h-2" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/15" />

            {/* Wallet Section */}
            <div className="text-center">
              <div className="flex flex-col items-center gap-1.5 mb-3">
                <div className="flex items-center gap-2 opacity-95">
                  <Wallet className="w-4 h-4 text-white" />
                  <span className="text-xs font-black capitalize tracking-widest text-emerald-100">{balanceLabel}</span>
                </div>
                {isFleetDriver && (
                  <div className="bg-white/20 dark:bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold capitalize tracking-tighter border border-white/20 backdrop-blur-md text-white">
                    Fleet Account
                  </div>
                )}
              </div>

              <div className="space-y-0.5">
                <p className="text-3xl font-black tracking-tighter text-white">
                  <span className="text-lg font-medium opacity-80 mr-1.5">KSh</span>
                  {isLoadingBalance ? '...' : displayBalance.toLocaleString()}
                </p>
              </div>

              <div className="flex gap-3 mt-5">
                {!isFleetDriver ? (
                  <>
                    <button
                      onClick={() => navigate('/deposit')}
                      className="flex-1 bg-white text-emerald-700 dark:text-slate-900 h-12 rounded-xl font-bold text-xs capitalize tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md hover:bg-slate-50"
                    >
                      <ArrowDownLeft className="w-4 h-4" /> DEPOSIT
                    </button>
                    <button className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 transition-all text-white active:scale-95">
                      <History className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/deposit')}
                      className="flex-1 bg-white text-emerald-700 dark:text-slate-900 h-12 rounded-xl font-bold text-xs capitalize tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md hover:bg-slate-50"
                    >
                      <Zap className="w-4 h-4" /> REQUEST DEPOSIT
                    </button>
                    <button className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 transition-all text-white active:scale-95">
                      <History className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* ── QUICK ACTIONS ── */}
        <div className="space-y-4 mb-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-slate-900 dark:text-white capitalize tracking-widest text-[11px]">Quick Access</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-3 active:scale-90 transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl ${action.color} text-white flex items-center justify-center shadow-lg shadow-black/5`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 capitalize tracking-tighter">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── INTELLIGENCE & APPEARANCE ── */}
        <div className="space-y-3 mb-10">
          <p className="text-[10px] font-black text-slate-400 capitalize tracking-[0.2em] px-2">Intelligence & Design</p>
          <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">HygeneX History</p>
                  <p className="text-[10px] text-slate-400 capitalize tracking-widest mt-0.5">Save AI Conversations</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newVal = !saveChatHistory;
                  setSaveChatHistory(newVal);
                  localStorage.setItem('saveAiChatHistory', newVal.toString());
                  toast.success(`Chat History ${newVal ? 'Enabled' : 'Disabled'}`);
                }}
                className={`w-11 h-6 rounded-full p-1 transition-all ${saveChatHistory ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${saveChatHistory ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <ThemeToggleRow />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm mb-6">
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {secondaryMenu.map((item, i) => (
              <button
                key={i}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-[10px] text-slate-400 capitalize tracking-widest mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* ── LOGOUT ── */}
        <div className="flex justify-center mb-8">
          <button
            onClick={async () => {
              await logout();
              toast.success('Logged Out');
              navigate('/login', { replace: true });
            }}
            className="px-8 py-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 font-bold text-sm tracking-[0.2em] capitalize border border-rose-100 dark:border-rose-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> SIGN OUT
          </button>
        </div>

        <div className="text-center space-y-1 opacity-40">
          <p className="text-[10px] font-bold capitalize tracking-[0.3em]">Klinflow Operating System</p>
          <p className="text-[9px] font-medium italic">Empowering the Circular Economy • V1.4.2</p>
        </div>
      </main>


    </div>
  );
}

