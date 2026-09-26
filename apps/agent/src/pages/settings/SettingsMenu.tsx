import {
  User, Bell, Shield, LogOut, ChevronRight, Phone, MessageCircle,
  Truck, BadgeCheck, Clock, DollarSign, Brain, Settings,
  Wallet, ArrowUpRight, ArrowDownLeft, ArrowLeft, History, Package,
  Search, Briefcase, Star, ShieldCheck, HelpCircle, X, Loader2, Zap, BarChart3, Copy, ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
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
  const { profile, logout, fetchProfile, updateProfile } = useAuthStore();
  const { earnings, fetchEarnings } = useAgentStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [imgError, setImgError] = useState(false);
  const [saveChatHistory, setSaveChatHistory] = useState(() => localStorage.getItem('saveAiChatHistory') === 'true');

  useEffect(() => {
    fetchProfile();
    fetchEarnings();
  }, []);

  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';
  const isCompanyOwner = profile?.agentAccountType === 'company_admin';
  const isFleet = isFleetDriver || isCompanyOwner;
  const agentTypeLabel = isFleet ? 'Fleet Agent' : 'Solo Agent';

  const quickActions = [
    { label: 'Wallet', icon: DollarSign, path: isFleet ? '/deposit' : '/wallet', color: 'bg-indigo-500' },
    { label: 'Pricing', icon: Settings, path: isCompanyOwner ? '/admin/services' : '/settings/configuration', color: 'bg-blue-500' },
    { label: 'Reviews', icon: Star, path: '/reviews', color: 'bg-amber-500' },
    { label: 'Notifications', icon: Bell, path: '/settings/notifications', color: 'bg-rose-500' },
  ];

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-800 transition-colors pb-5">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600 transition-all duration-300">
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

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+3.25rem)] pb-6 max-w-lg mx-auto w-full space-y-6 px-1.5">

        {/* ── PROFILE BENTO CARD ── */}
        <div className="bg-gradient-to-t from-slate-600 to-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 relative overflow-hidden">

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 border-1 border-white dark:border-slate-900 overflow-hidden flex items-center justify-center text-3xl">
              {(profile?.avatarUrl || profile?.avatar) && !imgError ? (
                <img
                  src={getThumbnailUrl((profile.avatarUrl || profile.avatar)!, { width: 300 })}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                '👤'
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-slate-200 dark:text-white leading-tight">{profile?.name || 'Klinflow Agent'}</h2>
                
              </div>
              <div className="flex flex-col gap-1 items-start">
                <p className="text-[11px] font-bold text-emerald-500 capitalize tracking-widest">{profile?.phone}</p>
                {profile?.klinflowId && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(profile.klinflowId!);
                      toast.success('Klinflow ID copied');
                    }}
                    className="flex items-center gap-1.5 bg-slate-800/60 hover:bg-slate-700/60 transition-colors px-2 py-1 rounded-md border border-slate-600/50 active:scale-95"
                  >
                    <span className="text-[10px] font-mono font-bold text-slate-200 tracking-wider">KLIN_ID: {profile.klinflowId}</span>
                    <Copy className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-3 mt-4 pt-6 border-t border-slate-500/30">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-600 text-white transition-all border border-transparent active:scale-95 group"
              >
                <action.icon className="w-5 h-5 text-white mb-1.5 group-hover:scale-110 transition-transform" />
                <p className="text-[9px] font-bold text-slate-200 capitalize tracking-wide leading-none">{action.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── AGENT STATUS (Fleet Only) ── */}
        {isFleetDriver && (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 capitalize tracking-[0.2em] px-2">Agent Status</p>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Maintenance Mode</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px]">Mark your vehicle as out-of-service for repairs</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const isMaintenance = (profile?.location as any)?.status === 'maintenance';
                    const newLocation = { ...(profile?.location as any), status: isMaintenance ? 'idle' : 'maintenance' };
                    try {
                      await updateProfile({ location: newLocation as any });
                      toast.success(`Maintenance Mode ${isMaintenance ? 'Disabled' : 'Enabled'}`);
                      fetchProfile();
                    } catch (err) {
                      toast.error('Failed to update status');
                    }
                  }}
                  className={`w-11 h-6 rounded-full p-1 transition-all ${(profile?.location as any)?.status === 'maintenance' ? 'bg-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${(profile?.location as any)?.status === 'maintenance' ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── INTELLIGENCE & APPEARANCE ── */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 capitalize tracking-[0.2em] px-2">Intelligence & Design</p>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
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

        {/* ── HUB COMPLAINTS (Fleet Only) + SETTINGS LINK ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-50 dark:divide-slate-800">

            {/* Hub Complaints — Fleet agents only */}
            {isFleetDriver && (
              <button
                onClick={() => navigate('/settings/complaints')}
                className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-600 bg-rose-50 dark:bg-rose-500/10">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Hub Complaints</p>
                  <p className="text-[10px] text-slate-400 capitalize tracking-widest mt-0.5">Report Issues To Hub</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Settings — leads to Profile, Privacy, Support, Feedback */}
            <button
              onClick={() => navigate('/settings/general')}
              className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-500/10">
                <Settings className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Settings</p>
                <p className="text-[10px] text-slate-400 capitalize tracking-widest mt-0.5">Manage Your Account</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </button>

          </div>
        </div>

        {/* ── LOGOUT ── */}
        <button
          onClick={async () => {
            await logout();
            toast.success('Logged Out');
            navigate('/login', { replace: true });
          }}
          className="mx-auto p-8 py-5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-2xl font-black text-[11px] capitalize tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all border border-rose-100 dark:border-rose-900/20"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>

        <div className="text-center space-y-1 opacity-40 mt-8">
          <p className="text-[10px] font-bold capitalize tracking-[0.3em]">Klinflow Agent</p>
          <p className="text-[9px] font-medium italic">Empowering the Circular Economy • V1.0.0</p>
        </div>
      </main>

    </div>
  );
}
