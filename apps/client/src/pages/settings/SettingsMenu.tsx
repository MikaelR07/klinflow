/**
 * SettingsMenu.tsx — Unified high-end settings dashboard for Client App.
 * Implements the premium 'Command Center' aesthetic for both Residents and Sellers.
 */
import { useState, useEffect, useMemo } from 'react';
import {
  User, Bell, ShieldCheck, HelpCircle, LogOut, ChevronRight, Phone, MessageCircle,
  Brain, Zap, ArrowUpRight, ArrowDownLeft, Package,
  TrendingUp, Globe, BarChart3, Briefcase, Award, History, Building2,
  Users, Star, CreditCard, ChevronDown, CheckCircle2, X, Plus, Info, Trophy,
  IdCard,
  ChartBar,
  BarChart2
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useNavigate } from 'react-router-dom';
import ThemeToggleRow from '@klinflow/ui/components/ThemeToggleRow';
import { toast } from 'sonner';

export default function SettingsMenu() {
  const { profile, logout, fetchProfile, rewardPoints } = useAuthStore();
  const { bookings, fetchBookings } = useBookingStore();
  const { receivedOrders, fetchReceivedOrders, getCalculatedScore } = useMarketplaceStore();
  const navigate = useNavigate();

  const [saveChatHistory, setSaveChatHistory] = useState(() => localStorage.getItem('saveAiChatHistory') === 'true');
  const [imgError, setImgError] = useState(false);

  const isSeller = profile?.role === 'seller';
  const roleLabel = isSeller ? 'Pro-seller' : 'Resident';

  useEffect(() => {
    fetchProfile();
    fetchBookings();
    if (isSeller) fetchReceivedOrders();
  }, [isSeller]);

  const metrics = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'completed');
    if (isSeller) {
      const totalVolume = receivedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      const ordersCount = receivedOrders.length;
      const score = Math.round(((getCalculatedScore(receivedOrders, profile) - 300) / 550) * 100);
      return { totalVolume, ordersCount, score };
    } else {
      const kgRecovered = completed.reduce((sum, b: any) => sum + (Number(b.actualWeightKg) || Number(b.weightKg) || 0), 0);
      const totalPickups = completed.length;
      return { kgRecovered, totalPickups, gfp: rewardPoints };
    }
  }, [bookings, receivedOrders, isSeller, profile, rewardPoints]);

  const secondaryMenu = [
    {
      icon: User, label: 'Profile Settings', subtitle: 'Edit Profile & Location',
      path: '/settings/profile', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10'
    },
    {
      icon: Bell, label: 'Notifications', subtitle: 'Manage alerts & SMS',
      path: '/settings/notifications', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10'
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
    <div className="flex flex-col min-h-screen bg-[#F8F8FF] dark:bg-slate-800 transition-colors pb-24">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600  transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-slate-900 dark:text-white capitalize tracking-tighter leading-none">Account</h1>
            <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mt-0.5">Profile & Settings</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 shadow-sm shadow-primary/10">
              <p className="text-[10px] font-black text-primary capitalize tracking-[0.2em]">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+3.25rem)] pb-6 max-w-lg mx-auto w-full space-y-6 px-1.5">

        {/* ── PROFILE BENTO CARD ── */}
        <div className="bg-gradient-to-t from-slate-600 to-slate-800    rounded-2xl p-4  dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden">

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 border-1 border-white dark:border-slate-900  overflow-hidden flex items-center justify-center text-3xl">
              {profile?.avatarUrl && !imgError ? (
                <img
                  src={getThumbnailUrl(profile.avatarUrl, { width: 300 })}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                profile?.avatar || '👤'
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-lg  font-bold text-slate-200  dark:text-white leading-tight">{profile?.name}</h2>
              <p className="text-[11px] font-bold text-emerald-500 capitalize tracking-widest">{profile?.phone}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[9px] font-bold text-slate-100 dark:text-emerald-400 capitalize tracking-widest">Verified Identity</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className={`grid ${isSeller ? 'grid-cols-3' : 'grid-cols-2'} gap-3 mt-4 pt-6 border-t border-slate-100 dark:border-slate-800`}>
            {isSeller && (
              <button
                onClick={() => navigate('/circular-resume')}
                className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-600 dark:bg-slate-00 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all border border-transparent  active:scale-95 group"
              >
                <IdCard className="w-5 h-5 text-white mb-1.5 group-hover:scale-110 transition-transform" />
                <p className="text-[9px] font-bold text-indigo-200 capitalize tracking-widest mb-1 leading-none">Identity</p>
                <p className="text-xs font-bold text-white capitalize leading-none">Klin Resumé</p>
              </button>
            )}
            <button
              onClick={() => navigate(isSeller ? '/trust-score' : '/Analytics')}
              className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-600 dark:bg-slate-600 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all border border-transparent  active:scale-95 group"
            >
              <BarChart2 className="w-5 h-5 text-white mb-1.5 group-hover:scale-110 transition-transform" />
              <p className="text-[9px] font-bold text-emerald-200 capitalize tracking-widest mb-1 leading-none">Dashboard</p>
              <p className="text-xs font-bold text-white capitalize leading-none">{isSeller ? 'Trust score' : 'Analytics'}</p>
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-600 dark:bg-slate-600 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-all border border-transparent  active:scale-95 group"
            >
              <Trophy className="w-5 h-5 text-white mb-1.5 group-hover:scale-110 transition-transform" />
              <p className="text-[9px] font-bold text-blue-200 capitalize tracking-widest mb-1 leading-none">Ranking</p>
              <p className="text-xs font-bold text-white capitalize leading-none">Leaderboard</p>
            </button>
          </div>
        </div>

        {/* ── QUICK ACCESS SECTION ── */}
        <div className="space-y-3 bg-slate-600  !mt-2 rounded-2xl p-3 border border-slate-200/50 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-200 capitalize tracking-[0.2em] px-2">Managed Services</p>
          <div className="grid grid-cols-2 gap-3">
            {isSeller ? (
              <>
                <button onClick={() => navigate('/inventory')} className="bg-slate-600 dark:bg-slate-800 p-3 rounded-2xl  dark:border-slate-800 shadow-sm flex items-center gap-3 text-left active:scale-[0.98] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 dark:text-white truncate leading-tight">Inventory</p>
                    <p className="text-[9px] text-slate-300 font-bold capitalize tracking-wider truncate mt-0.5">Ledger</p>
                  </div>
                </button>
                <button onClick={() => navigate('/my-offers')} className="bg-slate-600 dark:bg-slate-800 p-3 rounded-2xl  dark:border-slate-800 shadow-sm flex items-center gap-3 text-left active:scale-[0.98] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 dark:text-white truncate leading-tight">Trades</p>
                    <p className="text-[9px] text-slate-300 font-bold capitalize tracking-wider truncate mt-0.5">Orders</p>
                  </div>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/my-bookings')} className="bg-slate-600 dark:bg-slate-600 p-3 rounded-2xl shadow-sm flex items-center gap-3 text-left active:scale-[0.98] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">Bookings</p>
                    <p className="text-[9px] text-slate-400 font-bold capitalize tracking-wider truncate mt-0.5">Pickup Log</p>
                  </div>
                </button>
                <button onClick={() => navigate('/impact-hub')} className=" dark:bg-slate-600 p-3 rounded-2xl  shadow-sm flex items-center gap-3 text-left active:scale-[0.98] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">Green Hub</p>
                    <p className="text-[9px] text-slate-400 font-bold capitalize tracking-wider truncate mt-0.5">Impact Tracker</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── INTELLIGENCE & APPEARANCE ── */}
        <div className="space-y-3 ">
          <p className="text-[10px] font-black text-slate-400 capitalize tracking-[0.2em] px-2">Intelligence & Design</p>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4 ">
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
                className={`w-11 h-6 rounded-full p-1 transition-all ${saveChatHistory ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-200 dark:bg-slate-900'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${saveChatHistory ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <ThemeToggleRow />
          </div>
        </div>

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

        {/* ── LOGOUT ── */}
        <button
          onClick={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
          className=" mx-auto p-8 py-5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-2xl font-black text-[11px] capitalize tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all border border-rose-100 dark:border-rose-900/20"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>

        <div className="text-center space-y-1 py-4">
          <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 capitalize tracking-[0.5em]">Klinflow Operating System</p>
          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-600 capitalize tracking-widest">V1.0.4 • Kenya Eco-System</p>
        </div>
      </main>

    </div>
  );
}
