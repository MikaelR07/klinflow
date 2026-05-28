/**
 * User Home — Aggregator/Marketplace Discovery Mode
 * Connects residents to verified agents & companies near them
 */
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, MapPin, Zap, Wallet, Truck, Recycle, TrendingUp,
  ArrowRight, Star, ChevronRight, Trophy, Building2,
  Users, ShieldCheck, X, Sparkles, Search, Brain,
  BarChart2,
  BarChart2Icon,
  BarChart3Icon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';

import { toast } from 'sonner';
import PushNotificationModal from '@klinflow/ui/components/PushNotificationModal';
import { LoadingScreen } from '@klinflow/ui/components/Loading';
import SellerHome from './SellerHome';

export default function UserHome() {
  const profile = useAuthStore(s => s.profile);
  const walletBalance = useAuthStore(s => s.walletBalance);
  const rewardPoints = useAuthStore(s => s.rewardPoints);
  const role = useAuthStore(s => s.role);
  const withdrawRewards = useAuthStore(s => s.withdrawRewards);
  const subscribeToProfileChanges = useAuthStore(s => s.subscribeToProfileChanges);
  const fetchProfile = useAuthStore(s => s.fetchProfile);
  const isInitializing = useAuthStore(s => s.isInitializing);

  const bookings = useBookingStore(s => s.bookings);
  const fetchBookings = useBookingStore(s => s.fetchBookings);
  const setActiveVerificationBooking = useBookingStore(s => s.setActiveVerificationBooking);

  // NOTE: Realtime subscription is managed globally in App.tsx — do NOT subscribe/cleanup here
  const getUnreadCount = useNotificationStore(s => s.getUnreadCount);
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const subscribeToPush = useNotificationStore(s => s.subscribeToPush);
  const navigate = useNavigate();

  const unreadCount = getUnreadCount();
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isActivityCleared, setIsActivityCleared] = useState(() => {
    return localStorage.getItem(`activity_cleared_${profile?.id}`) === 'true';
  });

  useEffect(() => {
    fetchBookings();
    if (profile?.id) {
      fetchProfile(); // Force refresh balance/points on mount
      fetchNotifications(profile.id, role);
      subscribeToProfileChanges(profile.id);
      // Realtime subscription handled globally by App.tsx
    }

    // Check if prompt was dismissed
    const dismissed = localStorage.getItem('push_prompt_dismissed');
    if (!dismissed && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      setShowPushPrompt(true);
    }

    // NOTE: Do NOT call cleanupNotifications() or cleanupBookings() here — it destroys the global subscription
    return () => { };
  }, [profile?.id, role]);

  // Fetch dynamic global rank
  useEffect(() => {
    const fetchRank = async () => {
      if (!profile?.id) return;
      const userPoints = profile?.rewardPoints || 0;
      if (userPoints === 0) { setUserRank(null); return; }
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user')
        .gt('reward_points', userPoints);
      if (!error) setUserRank(((count as number) || 0) + 1);
    };
    fetchRank();
  }, [profile?.id, profile?.rewardPoints]);

  // Auto-reset clear flag if a new mission arrives
  useEffect(() => {
    if (bookings.length > 0 && bookings[0]) {
      const latestId = bookings[0].id;
      const lastSeenId = localStorage.getItem(`last_seen_booking_${profile?.id}`);
      if (latestId !== lastSeenId) {
        setIsActivityCleared(false);
        localStorage.setItem(`activity_cleared_${profile?.id}`, 'false');
        localStorage.setItem(`last_seen_booking_${profile?.id}`, latestId);
      }
    }
  }, [bookings, profile?.id]);

  const handleOpenVerification = (booking: any) => {
    setActiveVerificationBooking(booking);
  };

  const handleDismissPush = () => {
    setShowPushPrompt(false);
    localStorage.setItem('push_prompt_dismissed', 'true');
  };


  const handleEnablePush = async () => {
    const success = await subscribeToPush();
    if (success) {
      setShowPushPrompt(false);
      toast.success('Alerts Enabled!');
    }
  };

  const handleWithdraw = () => {
    if (walletBalance < 100) {
      toast.warning(`You need KSh ${100 - walletBalance} more to withdraw.`, {
        description: 'Klinflow requires a minimum of KSh 100 for settlement processing.'
      });
      return;
    }
    navigate('/withdraw');
  };

  const metrics = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'completed');
    const totalPickups = completed.length;
    const kgRecovered = completed.reduce((sum: number, b: any) => sum + (Number(b.actualWeightKg) || Number(b.weightKg) || 0), 0);
    const treesSaved = (kgRecovered * 0.1).toFixed(2);
    const co2OffsetTonnes = ((kgRecovered * 1.2) / 1000).toFixed(3);
    return { totalPickups, kgRecovered, treesSaved, co2OffsetTonnes };
  }, [bookings]);

  const { totalPickups, kgRecovered, treesSaved, co2OffsetTonnes } = metrics;  // 1kg = 1.2kg CO2, divide by 1000 for tonnes

  const getImpactLevel = (count: number) => {
    if (count >= 50) return { label: 'Climate Guardian', icon: '🏆', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
    if (count >= 20) return { label: 'Eco Warrior', icon: '🛡️', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    if (count >= 5) return { label: 'Green Scout', icon: '🌱', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    return { label: 'Seedling', icon: '🥚', color: 'text-slate-600 bg-slate-50 border-slate-100' };
  };
  const impact = getImpactLevel(totalPickups);



  if (isInitializing && !profile) {
    return <LoadingScreen message="Hydrating Profile..." />;
  }

  if (profile?.role === 'seller') {
    return <SellerHome />;
  }

  if (!profile) {
    return <LoadingScreen message="Re-Authenticating..." />;
  }

  return (
    <div className="space-y-6 px-1.5">

      {/* ── PUSH ENROLLMENT MODAL ── */}
      <PushNotificationModal
        isOpen={showPushPrompt}
        onClose={() => setShowPushPrompt(false)}
      />

      {/* ── TOP NAV & HERO ── */}
      <div className="space-y-3 pt-[calc(env(safe-area-inset-top,1rem)+3.5rem)]">
        {/* Header Section - Edge to Edge - DYNAMIC STICKY */}
        <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-900/50 ">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-4">
              {/* Profile Avatar */}
              <div className="shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-2xl shadow-lg border-2 border-white dark:border-slate-700 transition-all overflow-hidden">
                  {profile?.avatarUrl ? (
                    <OptimizedImage src={getThumbnailUrl(profile.avatarUrl, { width: 300 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                  ) : (
                    profile?.avatarUrl || '👤'
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-xl font-normal italic tracking-tight text-slate-900 dark:text-white leading-tight">
                  Hello {(profile?.fullName || profile?.name || 'Resident').split(' ')[0]}👋
                </h1>
                <div className="flex items-center gap-1.5  text-[10px] text-primary font-bold capitalize tracking-wider bg-primary/10 px-0.5 py-0.5 rounded-full border border-primary/20 w-fit">
                  <MapPin className="w-3 h-3" /> {profile?.location?.estate || profile?.estate || 'searching...'}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-11 h-11 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 group"
            >
              <Bell className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
              {Number(unreadCount) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800 shadow-md animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Wallet Hero */}
        <div className="bg-gradient-to-br from-primary to-emerald-600 to-emerald-800  rounded-2xl p-5 gpu-layer">
          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[12px] font-semibold text-emerald-200/90 Capitalise tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Wallet className="w-3 h-3" /> Wallet Balance
                </p>
                <h2 className="text-3xl sm:text-5xl font-semibold  text-white tracking-tighter leading-none">
                  KSh {walletBalance.toLocaleString()}
                </h2>

              </div>

              <button
                onClick={handleWithdraw}
                className="bg-white hover:bg-slate-50 text-emerald-800 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500 px-5 py-3 rounded-xl text-xs font-semibold Capitalise tracking-widest active:scale-95 transition-all "
              >
                Withdraw
              </button>
            </div>

            <div className="pt-4 border-t border-white/30 px-1">
              <div className="flex items-center justify-between w-full">

                <div onClick={() => navigate('/impact-hub')} className="flex flex-col cursor-pointer">
                  <p className="text-[10px] font-semibold text-emerald-300 capitalize tracking-widest mb-1">GFP</p>
                  <p className="text-sm sm:text-base font-semibold text-white leading-none">{rewardPoints}</p>
                </div>

                <div className="w-px h-8 bg-white/30" />

                <div className="flex flex-col">
                  <p className="text-[10px] font-semibold text-emerald-300 capitalize tracking-widest mb-1">Pickups</p>
                  <p className="text-sm sm:text-base font-semibold text-white leading-none">{totalPickups}</p>
                </div>

                <div className="w-px h-8 bg-white/30" />

                <div className="flex flex-col">
                  <p className="text-[10px] font-semibold text-emerald-300 capitalize tracking-widest mb-1">Recovered</p>
                  <p className="text-sm sm:text-base font-semibold text-white leading-none">{kgRecovered}kg</p>
                </div>

                <div className="w-px h-8 bg-white/30" />

                <div className="flex flex-col">
                  <p className="text-[10px] font-semibold text-emerald-300 capitalize tracking-widest mb-1">Offset</p>
                  <p className="text-sm sm:text-base font-semibold text-white leading-none">{co2OffsetTonnes}t</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Tier Card Hidden for Launch */}
        <div className="bg-white dark:bg-slate-900/60 mt-3 rounded-[1rem] p-2 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">

          {/* Quick Actions */}
          <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-400 tracking-wide px-1">
            Quick Actions
          </p>

          <div className="grid grid-cols-4 gap-2">

            <button
              onClick={() => navigate('/book-pickup')}
              className="rounded-2xl border p-2.5 flex border-slate-200 dark:border-slate-700 flex-col items-center gap-2 relative"
            >
              <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>

              <div className="text-center mt-auto">
                <p className="text-[10px] font-semibold capitalize tracking-widest leading-none dark:text-white">
                  Pickup
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate('/my-bookings')}
              className="rounded-2xl border p-2.5 flex border-slate-200 dark:border-slate-700 flex-col items-center gap-2 relative"
            >
              <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center">
                <Recycle className="w-5 h-5" />
              </div>

              <div className="text-center mt-auto">
                <p className="text-[10px] font-semibold capitalize tracking-widest leading-none dark:text-white">
                  Bookings
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate('/Analytics')}
              className="rounded-2xl border p-2.5 flex border-slate-200 dark:border-slate-700 flex-col items-center gap-2 relative"
            >
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                <BarChart2Icon className="w-5 h-5" />
              </div>

              <div className="text-center mt-auto">
                <p className="text-[10px] font-semibold capitalize tracking-widest leading-none dark:text-white">
                  Dashboard
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate('/resident-wallet')}
              className="rounded-2xl border p-2.5 flex border-slate-200 dark:border-slate-700 flex-col items-center gap-2 relative"
            >
              <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>

              <div className="text-center mt-auto">
                <p className="text-[10px] font-semibold capitalize tracking-widest leading-none dark:text-white">
                  Wallet
                </p>
              </div>
            </button>
          </div>


        </div>
      </div>

      {/* Discovery Entry Point */}
      <div className="bg-slate-50 !mt-1 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-800  relative overflow-hidden group">

        <div className="relative z-10">
          <h3 className="text-base font-semibold dark:text-white mb-1">Ready to recycle?</h3>
          <p className="text-xs font-semibold text-slate-400 mb-4">Find a verified collection partner near you</p>
          <button
            onClick={() => navigate('/discovery')}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-xs capitalize tracking-widest  flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            Find a Partner
          </button>
        </div>
      </div>


      <div className="bg-white dark:bg-slate-900/50 !mt-2 rounded-[1rem] p-2 border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-2">
        {/* ── MARKET INTELLIGENCE (NEW OS LAYER) ── */}
        <div
          onClick={() => navigate('/market-pulse')}
          className="bg-gradient-to-br from-primary to-emerald-600 to-emerald-800  border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10  rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
              <BarChart3Icon className="w-5 h-5 text-white " />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white dark:text-white capitalize tracking-tight leading-none mb-1">Market Intelligence</h3>
              <p className="text-[10px] font-bold text-slate-200 capitalize tracking-widest flex items-center gap-1.5">
                View Material Prices in the Market
              </p>
            </div>
          </div>
          <div className="p-1. text-white  rounded-lg shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all relative z-10">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
        {/* ── LEADERBOARD RANKING ── */}
        <div
          onClick={() => navigate('/leaderboard')}
          className="bg-gradient-to-r from-blue-600 to-green-600 !mt-3 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10   rounded-xl flex items-center justify-center text-emerald-600 ">
              <Trophy className="w-8 h-8 text-white " />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white  dark:text-white capitalize tracking-tight leading-none mb-1">Eco Leaderboard</h3>
              <p className="text-[10px] font-bold text-slate-200 capitalize tracking-widest flex items-center gap-1.5">
                View Your Rank in the Ecosystem
              </p>
            </div>
          </div>
          <div className="p-1.5 text-white  rounded-lg shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all relative z-10">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-slate-900/40 !mt-3 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="font-semibold text-[12px] capitalize tracking-widest text-slate-600">Activity Hub</h3>
          <button
            onClick={() => {
              setIsActivityCleared(true);
              localStorage.setItem(`activity_cleared_${profile?.id}`, 'true');
              toast.info("Activity Feed Cleared");
            }}
            className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize tracking-widest rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
          >
            Clear
          </button>
        </div>

        <div className="space-y-6">
          {!isActivityCleared && bookings.length > 0 ? (() => {
            const active = bookings.filter((b: any) => ['pending', 'accepted', 'in_progress'].includes(b.status));
            const displayList = active.length > 0 ? active : bookings;
            return displayList.slice(0, 3).map((booking: any, i: number) => (
              <div key={i} className="flex items-center justify-between group px-1">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-lg shadow-sm">
                    {booking.wasteType === 'general' ? '🗑️' : '♻️'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">{booking.wasteType} Pickup</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[8px] font-semibold text-primary font-mono capitalize">#{String(booking.id).slice(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {new Date(booking.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className={`text-[11px] font-semibold capitalize tracking-widest ${booking.status === 'completed' ? 'text-primary' :
                    booking.status === 'cancelled' ? 'text-rose-500' :
                      'text-amber-500'
                    }`}>
                    {booking.status.replace('_', ' ')}
                  </p>

                  {/* Action Button for Finalizing */}
                  {booking.status === 'picked_up' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenVerification(booking); }}
                      className="px-2 py-1 bg-primary text-[8px] font-semibold text-white capitalize tracking-widest rounded-lg shadow-lg shadow-primary/20 active:scale-90 transition-all flex items-center gap-1"
                    >
                      Verify Weight <Star className="w-2.5 h-2.5 fill-white" />
                    </button>
                  )}
                </div>
              </div>
            ));
          })() : (
            <div className="text-center py-6">
              <p className="text-[10px] font-semibold text-slate-600 capitalize tracking-widest">{isActivityCleared ? 'Activity Cleared' : 'No recent pickups'}</p>
              {!isActivityCleared && <button onClick={() => navigate('/discovery')} className="text-[9px] font-semibold text-primary capitalize tracking-widest mt-2 underline">Start Recycling →</button>}
            </div>
          )}
        </div>
      </div>

      {/* Floating AI Voice Assistant */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/hygenex')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center z-50 border-1 border-white dark:border-slate-800"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-20" />
        <Brain className="w-6 h-6 text-white" />
      </motion.button>

    </div>
  );
}
