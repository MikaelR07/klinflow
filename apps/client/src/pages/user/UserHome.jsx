/**
 * User Home — Aggregator/Marketplace Discovery Mode
 * Connects residents to verified agents & companies near them
 */
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, MapPin, Zap, Wallet, Truck, Recycle, TrendingUp,
  ArrowRight, Star, ChevronRight, Trophy, Building2,
  Users, ShieldCheck, X, Sparkles, Search, Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore, useAuthStore, useNotificationStore, supabase, getThumbnailUrl } from '@cleanflow/core';

import { toast } from 'sonner';
import { PushNotificationModal } from '@cleanflow/ui';
import SellerHome from './SellerHome';

export default function UserHome() {
  const profile = useAuthStore(s => s.profile);
  const role = useAuthStore(s => s.role);
  const withdrawRewards = useAuthStore(s => s.withdrawRewards);
  const subscribeToProfileChanges = useAuthStore(s => s.subscribeToProfileChanges);
  const fetchProfile = useAuthStore(s => s.fetchProfile);

  const bookings = useBookingStore(s => s.bookings);
  const fetchBookings = useBookingStore(s => s.fetchBookings);
  const subscribeToBookings = useBookingStore(s => s.subscribeToBookings);
  const cleanupBookings = useBookingStore(s => s.cleanupBookings);
  const setActiveVerificationBooking = useBookingStore(s => s.setActiveVerificationBooking);

  const subscribeToRealtime = useNotificationStore(s => s.subscribeToRealtime);
  const cleanupNotifications = useNotificationStore(s => s.cleanup);
  const getUnreadCount = useNotificationStore(s => s.getUnreadCount);
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const subscribeToPush = useNotificationStore(s => s.subscribeToPush);
  const navigate = useNavigate();

  const unreadCount = getUnreadCount();
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [isActivityCleared, setIsActivityCleared] = useState(() => {
    return localStorage.getItem(`activity_cleared_${profile?.id}`) === 'true';
  });

  useEffect(() => {
    fetchBookings();
    if (profile?.id) {
      fetchProfile(); // Force refresh balance/points on mount
      fetchNotifications(profile.id, role);
      subscribeToProfileChanges(profile.id);
      subscribeToBookings(profile.id);
      subscribeToRealtime(profile.id, role);
    }
    
    // Check if prompt was dismissed
    const dismissed = localStorage.getItem('push_prompt_dismissed');
    if (!dismissed && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      setShowPushPrompt(true);
    }

    return () => { cleanupBookings(); cleanupNotifications(); };
  }, [profile?.id, role]);

  // Fetch dynamic global rank
  useEffect(() => {
    const fetchRank = async () => {
      if (!profile?.id) return;
      const userPoints = profile?.reward_points || profile?.rewardPoints || 0;
      if (userPoints === 0) { setUserRank(null); return; }
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user')
        .gt('reward_points', userPoints);
      if (!error) setUserRank((count || 0) + 1);
    };
    fetchRank();
  }, [profile?.id, profile?.reward_points, profile?.rewardPoints]);

  // Auto-reset clear flag if a new mission arrives
  useEffect(() => {
    if (bookings.length > 0) {
      const latestId = bookings[0].id;
      const lastSeenId = localStorage.getItem(`last_seen_booking_${profile?.id}`);
      if (latestId !== lastSeenId) {
        setIsActivityCleared(false);
        localStorage.setItem(`activity_cleared_${profile?.id}`, 'false');
        localStorage.setItem(`last_seen_booking_${profile?.id}`, latestId);
      }
    }
  }, [bookings, profile?.id]);

  const handleOpenVerification = (booking) => {
    setActiveVerificationBooking({
      id: booking.id,
      waste_type: booking.wasteType || booking.waste_type,
      actual_weight_kg: booking.actualWeightKg || booking.actual_weight_kg || 0,
      total_price: booking.totalPrice || booking.total_price || 0
    });
  };

  const handleDismissPush = () => {
    setShowPushPrompt(false);
    localStorage.setItem('push_prompt_dismissed', 'true');
  };


  const handleEnablePush = async () => {
    const success = await subscribeToPush();
    if (success) {
      setShowPushPrompt(false);
      toast.success('Alerts Enabled! 🔔');
    }
  };

  const handleWithdraw = () => {
    const balance = profile?.balance || profile?.walletBalance || 0;
    if (balance < 100) { 
      toast.warning(`You need KSh ${100 - balance} more to withdraw.`, {
        description: 'CleanFlow requires a minimum of KSh 100 for settlement processing.'
      }); 
      return; 
    }
    navigate('/withdraw');
  };

  const metrics = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'completed');
    const totalPickups = completed.length;
    const kgRecovered = completed.reduce((sum, b) => sum + (Number(b.actual_weight_kg) || 0), 0);
    const treesSaved = (kgRecovered * 0.1).toFixed(2);
    const co2OffsetTonnes = ((kgRecovered * 1.2) / 1000).toFixed(3);
    return { totalPickups, kgRecovered, treesSaved, co2OffsetTonnes };
  }, [bookings]);

  const { totalPickups, kgRecovered, treesSaved, co2OffsetTonnes } = metrics;  // 1kg = 1.2kg CO2, divide by 1000 for tonnes
  
  const getImpactLevel = (count) => {
    if (count >= 50) return { label: 'Climate Guardian', icon: '🏆', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
    if (count >= 20) return { label: 'Eco Warrior', icon: '🛡️', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    if (count >= 5) return { label: 'Green Scout', icon: '🌱', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    return { label: 'Seedling', icon: '🥚', color: 'text-slate-600 bg-slate-50 border-slate-100' };
  };
  const impact = getImpactLevel(totalPickups);



  if (profile?.role === 'seller') {
    return <SellerHome />;
  }

  return (
    <div className="px-4 space-y-4 animate-fade-in pb-10">

      {/* ── PUSH ENROLLMENT MODAL ── */}
      <PushNotificationModal 
        isOpen={showPushPrompt}
        onClose={() => setShowPushPrompt(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={() => navigate('/settings/profile')} className="shrink-0">
            <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xl shadow-sm overflow-hidden relative border border-slate-100 dark:border-slate-700">
              {profile?.avatar_url ? (
                <img src={getThumbnailUrl(profile.avatar_url, { width: 100 })} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="text-lg opacity-50">{profile?.avatar || '👤'}</span>
              )}
            </div>
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white leading-none truncate">Hello, {profile?.name?.split(' ')[0]}! 👋</h1>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-primary font-semibold uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10 w-fit">
              <MapPin className="w-3 h-3" /> {profile?.location?.estate || 'Nairobi'}
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/settings/notifications')}
          className="w-9 h-9 shrink-0 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center relative shadow-sm">
          <Bell className="w-4 h-4 text-slate-500" />
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse" />}
        </button>
      </div>

      {/* Wallet Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 rounded-2xl p-6 shadow-lg gpu-layer">
        <div className="flex flex-col gap-6 relative z-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-200/80 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Wallet className="w-3 h-3" /> Wallet Balance
              </p>
              <h2 className="text-4xl sm:text-5xl font-semibold text-white tracking-tighter leading-none">
                KSh {(profile?.balance || profile?.walletBalance || 0).toLocaleString()}
              </h2>
              <div className="flex items-center gap-2 mt-3">
                <button 
                  onClick={() => navigate('/impact-hub')}
                  className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg border border-white/10 text-[11px] font-semibold text-amber-300 uppercase tracking-widest active:scale-95 transition-all shadow-inner"
                >
                  ⚡ {profile?.rewardPoints || 0} GFP
                </button>
              </div>
            </div>
            
            <button 
              onClick={handleWithdraw}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/20 px-5 py-3 rounded-xl text-xs font-semibold uppercase tracking-widest shadow-xl active:scale-95 transition-all mb-1"
            >
              Withdraw
            </button>
          </div>
          
          <div className="flex items-center pt-5 border-t border-white/10 px-1">
            <div className="flex items-center gap-6 sm:gap-10">
              <div>
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-widest mb-1">Pickups</p>
                <p className="text-sm sm:text-base font-semibold text-white leading-none">{totalPickups}</p>
              </div>
              <div className="px-4 sm:px-6 border-x border-white/10">
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-widest mb-1">Recovered</p>
                <p className="text-sm sm:text-base font-semibold text-white leading-none">{kgRecovered}kg</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-widest mb-1">CO2 Offset</p>
                <p className="text-sm sm:text-base font-semibold text-white leading-none">{co2OffsetTonnes}t</p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Subscription Tier Card Hidden for Launch */}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => navigate('/book-pickup')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-3 active:scale-[0.98] transition-all shadow-sm gpu-layer">
          <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Truck className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-[9px] font-semibold text-primary uppercase tracking-widest leading-none">Book Now</p>
          </div>
        </button>

        <button onClick={() => navigate('/my-bookings')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-3 active:scale-[0.98] transition-all shadow-sm gpu-layer">
          <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Recycle className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-[9px] font-semibold text-indigo-600 uppercase tracking-widest leading-none">My Bookings</p>
          </div>
        </button>

        <button onClick={() => navigate('/analytics')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-3 active:scale-[0.98] transition-all shadow-sm gpu-layer">
          <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-widest leading-none">Dashboard</p>
          </div>
        </button>

      </div>

      {/* Discovery Entry Point */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10">
          <h3 className="text-base font-semibold dark:text-white mb-1">Ready to recycle?</h3>
          <p className="text-xs font-semibold text-slate-400 mb-4">Find a verified collection partner near you</p>
          <button 
            onClick={() => navigate('/discovery')}
            className="w-full py-3 bg-primary text-white rounded-2xl font-semibold text-xs uppercase tracking-widest shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            Find a Partner
          </button>
        </div>
      </div>

      {/* Estate Ranking */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex items-center justify-between group active:scale-[0.98] transition-all gpu-layer" onClick={() => navigate('/leaderboard')}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center relative">
            <Trophy className="w-6 h-6 text-amber-600" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[8px] font-semibold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">!</div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Global Ranking</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase">
              {userRank ? `You are #${userRank} on CleanFlow` : 'Unranked — Start Recycling!'}
            </p>
          </div>
        </div>
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary transition-all">
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-slate-100/30 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="font-semibold text-[11px] uppercase tracking-widest text-slate-400">Activity Hub</h3>
          <button 
            onClick={() => {
              setIsActivityCleared(true);
              localStorage.setItem(`activity_cleared_${profile?.id}`, 'true');
              toast.info("Activity Feed Cleared");
            }} 
            className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
          >
            Clear
          </button>
        </div>
        
        <div className="space-y-6">
          {!isActivityCleared && bookings.length > 0 ? (() => {
            const active = bookings.filter(b => ['pending', 'accepted', 'in_progress'].includes(b.status));
            const displayList = active.length > 0 ? active : bookings;
            return displayList.slice(0, 3).map((booking, i) => (
              <div key={i} className="flex items-center justify-between group px-1">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-lg shadow-sm">
                    {booking.wasteType === 'general' || booking.waste_type === 'general' ? '🗑️' : '♻️'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">{booking.wasteType || booking.waste_type} Pickup</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[8px] font-semibold text-primary font-mono uppercase">#{String(booking.id).slice(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {new Date(booking.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className={`text-[11px] font-semibold uppercase tracking-widest ${
                    booking.status === 'completed' ? 'text-primary' : 
                    booking.status === 'cancelled' ? 'text-rose-500' : 
                    'text-amber-500'
                  }`}>
                    {booking.status.replace('_', ' ')}
                  </p>
                  
                  {/* Action Button for Finalizing */}
                  {booking.status === 'picked_up' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenVerification(booking); }}
                      className="px-2 py-1 bg-primary text-[8px] font-semibold text-white uppercase tracking-widest rounded-lg shadow-lg shadow-primary/20 active:scale-90 transition-all flex items-center gap-1"
                    >
                      Verify Weight <Star className="w-2.5 h-2.5 fill-white" />
                    </button>
                  )}
                </div>
              </div>
            ));
          })() : (
            <div className="text-center py-6">
              <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">{isActivityCleared ? 'Activity Cleared' : 'No recent pickups'}</p>
              {!isActivityCleared && <button onClick={() => navigate('/discovery')} className="text-[9px] font-semibold text-primary uppercase tracking-widest mt-2 underline">Start Recycling →</button>}
            </div>
          )}
        </div>
      </div>

      {/* Floating AI Voice Assistant */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/hygenex', { state: { autoStartMic: true } })}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center z-50 border-4 border-white dark:border-slate-800"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-20" />
        <Brain className="w-6 h-6 text-white" />
      </motion.button>

    </div>
  );
}
