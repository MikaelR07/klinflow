/**
 * Seller Home — Revenue dashboard, quick actions, trust score, leaderboard
 */
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  MapPin,
  Zap,
  Wallet,
  Clock,
  Trash2,
  Plus,
  Sparkles,
  History,
  Leaf,
  TrendingUp,
  Truck,
  Recycle,
  ArrowRight,
  Mic,
  Star,
  ChevronRight,
  Trophy,
  Target,
  ShieldCheck,
  Scan,
  CalendarDays,
  Package,
  X,
  Users,
  Camera,
  Handshake,
  Scale,
  Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { SkeletonCard } from '@klinflow/ui/components/Skeletons';
import PushNotificationModal from '@klinflow/ui/components/PushNotificationModal';
import { LoadingScreen } from '@klinflow/ui/components/Loading';
import { toast } from 'sonner';

// ── SMART NAMING GUARD (REGEX + DICTIONARY) ───────────────────────
const formatMaterial = (text: string | null) => {
  if (!text) return 'Recyclable Load';
  const materialMap = {
    'ewaste': 'Electronic Waste',
    'iron': 'Scrap Metal',
    'plastic': 'PET Plastic',
    'paper': 'Paper/Cardboard',
    'glass': 'Glass Cullet',
    'organic': 'Organic Waste',
    'metal': 'Scrap Metal'
  };
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
  if (isUUID) return 'Recyclable Load';
  const slug = text.toLowerCase();
  return (materialMap as any)[slug] || text.charAt(0).toUpperCase() + text.slice(1);
};

export default function SellerHome() {
  const profile = useAuthStore(s => (s as any).profile);
  const walletBalance = useAuthStore(s => (s as any).walletBalance);
  const rewardPoints = useAuthStore(s => (s as any).rewardPoints);
  const role = useAuthStore(s => (s as any).role);
  const withdrawRewards = useAuthStore(s => (s as any).withdrawRewards);
  const subscribeToProfileChanges = useAuthStore(s => (s as any).subscribeToProfileChanges);
  const isInitializing = useAuthStore(s => (s as any).isInitializing);

  const bookings = useBookingStore(s => s.bookings);
  const fetchBookings = useBookingStore(s => s.fetchBookings);
  const setActiveVerificationBooking = useBookingStore(s => s.setActiveVerificationBooking);

  const receivedOrders = useMarketplaceStore(s => s.receivedOrders);
  const fetchReceivedOrders = useMarketplaceStore(s => s.fetchReceivedOrders);
  const receivedOffers = useMarketplaceStore(s => s.receivedOffers);
  const fetchIncomingOffers = useMarketplaceStore(s => s.fetchIncomingOffers);
  const myListings = useMarketplaceStore(s => s.myListings);
  const fetchMyActivity = useMarketplaceStore(s => s.fetchMyActivity);

  // NOTE: Realtime subscription is managed globally in App.tsx — do NOT subscribe/cleanup here
  const getUnreadCount = useNotificationStore(s => s.getUnreadCount);
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const subscribeToPush = useNotificationStore(s => s.subscribeToPush);


  const navigate = useNavigate();

  const unreadCount = getUnreadCount();

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchReceivedOrders();
    fetchIncomingOffers();
    fetchMyActivity();

    if (profile?.id) {
      fetchNotifications(profile.id, role);
      subscribeToProfileChanges(profile.id);
      // Realtime subscription handled globally by App.tsx
    }

    return () => { };
  }, [profile?.id, role]);

  useEffect(() => {
    // Show prompt if user hasn't allowed/denied notifications yet
    const dismissed = localStorage.getItem('push_prompt_dismissed');
    if (!dismissed && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      setShowPushPrompt(true);
    }
  }, []);

  const handleDismissPush = () => {
    setShowPushPrompt(false);
    localStorage.setItem('push_prompt_dismissed', 'true');
  };

  const handleEnablePush = async () => {
    const success = await subscribeToPush();
    if (success) {
      setShowPushPrompt(false);
      toast.success("Native Alerts Enabled!", {
        description: "You will now receive instant updates on your phone."
      });
    }
  };

  const handleClearHistory = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ completed_cleared_at: new Date().toISOString() })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      toast.success("History cleared!");
    } catch (err) {
      toast.error("Failed to clear history");
    }
  };

  // ── MERCHANT METRICS (Marketplace Centric) ──
  const marketplaceBookings = bookings.filter((b: any) => b.booking_type === 'marketplace' || b.booking_type === 'marketplace_pickup');

  const totalDeals = marketplaceBookings.filter(b => b.status === 'completed').length;

  const totalSoldKg = marketplaceBookings
    .filter(b => b.status === 'completed')
    .reduce((acc, b: any) => acc + (parseFloat(String(b.actualWeightKg || b.weightKg || 0)) || 0), 0);

  // Escrow includes accepted offers AND active bookings
  const acceptedOffersValue = receivedOrders
    .filter((o: any) => o.status === 'accepted')
    .reduce((acc, o: any) => acc + (parseFloat(String(o.totalPrice || o.totalPrice || 0)) || 0), 0);

  const activeBookingsValue = marketplaceBookings
    .filter(b => b.status !== 'completed' && b.status !== 'cancelled')
    .reduce((acc, b: any) => acc + (parseFloat(String(b.totalPrice || b.totalPrice || 0)) || 0), 0);

  const inEscrowAmount = activeBookingsValue || acceptedOffersValue;

  const recentBookings = [...bookings]
    .filter((b: any) => {
      if (b.status === 'completed' && (profile as any)?.completed_cleared_at) {
        return new Date(b.createdAt || Date.now()) > new Date((profile as any).completed_cleared_at);
      }
      return true;
    })
    .sort((a: any, b: any) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime())
    .slice(0, 3);

  if (isInitializing && !profile) {
    return <LoadingScreen message="Loading Merchant Profile..." />;
  }

  if (!profile) {
    return <LoadingScreen message="Session Expired. Re-authenticating..." />;
  }

  return (
    <div className="space-y-6 px-1.5 pb-2">

      {/* ── PUSH ENROLLMENT MODAL ── */}
      <PushNotificationModal
        isOpen={showPushPrompt}
        onClose={handleDismissPush}
      />

      {/* ── TOP NAV & HERO ── */}
      <div className="space-y-3 pt-[calc(env(safe-area-inset-top,1rem)+3.5rem)]">
        <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-900/50 pt-[calc(env(safe-area-inset-top,1rem)+0.6rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-900 ">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-4">
              {/* Profile Avatar */}
              <div className="shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-2xl shadow-lg border-2 border-white dark:border-slate-700 transition-all overflow-hidden">
                  {profile?.avatarUrl ? (
                    <img src={getThumbnailUrl(profile.avatarUrl, { width: 300 })} className="w-full h-full object-cover" />
                  ) : (
                    (profile as any)?.avatar || '👤'
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-xl font-normal italic tracking-tight text-slate-900 dark:text-white leading-tight">
                  Hello {(profile?.fullName || profile?.name || 'Merchant').split(' ')[0]}👋
                </h1>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-primary font-bold capitalize tracking-wider bg-primary/10 px-0.5 py-0.5 rounded-full border border-primary/20 w-fit">
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


        {/* ── REVENUE HERO CARD ── */}
        <div className="relative group">
          <div className="bg-gradient-to-br from-primary to-emerald-600 to-emerald-800 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900 rounded-2xl   p-5  shadow-lg gpu-layer relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[radial-gradient(circle,_rgba(16,185,129,0.05)_0%,_transparent_70%)] pointer-events-none" />
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-emerald-100/80 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Wallet className="w-3 h-3" /> Seller Wallet
                  </p>
                  <h2 className="text-2xl sm:text-5xl font-semibold text-white tracking-tighter leading-none">
                    KSh {walletBalance.toLocaleString()}
                  </h2>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      disabled
                      className="flex items-center gap-1.5 bg-emerald-500/50 text-emerald-800  dark:bg-emerald-700 dark:hover:bg-emerald-400 dark:text-white px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                    >
                      {rewardPoints} GFP
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/withdraw')}
                  className="bg-white hover:bg-slate-50 text-emerald-800 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500 px-5 py-3 rounded-xl text-xs font-semibold uppercase tracking-widest active:scale-95 transition-all mb-1"
                >
                  Withdraw
                </button>
              </div>

              {/* Stats row */}
              <div className="pt-5 border-t border-white/20">
                <div className="flex items-center justify-between sm:justify-start sm:gap-16 px-1">

                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm sm:text-base font-semibold text-white leading-none truncate">{totalDeals}</p>
                    <div className="flex items-center gap-1.5">
                      <Handshake className="w-3.5 h-3.5 text-white/60" />
                      <p className="text-[10px] font-semibold text-white/60 capitalize tracking-widest">Deals</p>
                    </div>
                  </div>

                  {/* Independent Divider */}
                  <div className="w-px h-8 bg-white/20" />

                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm sm:text-base font-semibold text-white leading-none truncate">{totalSoldKg}kg</p>
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-white/60" />
                      <p className="text-[10px] font-semibold text-white/60 capitalize tracking-widest">Sold KG</p>
                    </div>
                  </div>

                  {/* Independent Divider */}
                  <div className="w-px h-8 bg-white/20" />

                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm sm:text-base font-semibold text-white leading-none truncate">KSh {inEscrowAmount.toLocaleString()}</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/60" />
                      <p className="text-[10px] font-semibold text-white/60 capitalize tracking-widest">Pending</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTIONS & INSIGHTS WRAPPER ── */}
        <div className="bg-white dark:bg-slate-900/50 !mt-2 rounded-[1rem] p-2  border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
          {/* ── HUSTLE ACTION CENTER (QUARTET CONTROLS) ── */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => navigate('/post-trade')}
              className="bg-emerald-600 rounded-2xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.98] transition-all group relative"
            >
              <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-bl-2xl rounded-tr-2xl" />
              <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-center mt-auto">
                <p className="text-[9px] font-semibold text-white capitalize tracking-widest leading-none">Sell</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/inventory')}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.98] transition-all group"
            >
              <div className="relative">
                {myListings.filter((l: any) => l.status === 'active').length > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full border border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
                    <span className="text-[8px] font-semibold text-white">{myListings.filter((l: any) => l.status === 'active').length}</span>
                  </div>
                )}
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-500 group-hover:text-blue-600 rounded-xl flex items-center justify-center shadow-inner transition-colors">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="text-center mt-auto">
                <p className="text-[9px] font-semibold text-slate-900 dark:text-white capitalize tracking-widest leading-none">Listings</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/my-offers')}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.98] transition-all group"
            >
              <div className="relative">
                {receivedOffers.filter((o: any) => o.status === 'pending').length > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full border border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
                    <span className="text-[8px] font-semibold text-white">{receivedOffers.filter((o: any) => o.status === 'pending').length}</span>
                  </div>
                )}
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 group-hover:text-indigo-600 rounded-xl flex items-center justify-center shadow-inner transition-colors">
                  <Handshake className="w-5 h-5" />
                </div>
              </div>
              <div className="text-center mt-auto">
                <p className="text-[9px] font-semibold text-slate-900 dark:text-white capitalize tracking-widest leading-none">Offers</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/my-rfq-offers')}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center gap-2 active:scale-[0.98] transition-all group"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 text-amber-500 group-hover:text-amber-600 rounded-xl flex items-center justify-center shadow-inner transition-colors">
                  <Receipt className="w-5 h-5" />
                </div>
                {/* Accepted Quotes Badge */}
                <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-[1.5px] border-white dark:border-slate-900 z-10 shadow-sm">
                  1
                </div>
              </div>
              <div className="text-center mt-auto">
                <p className="text-[9px] font-semibold text-slate-900 dark:text-white capitalize tracking-widest leading-none">Quotes</p>
              </div>
            </button>
          </div>

          {/* ── MARKET INTELLIGENCE (NEW OS LAYER) ── */}
          <div
            onClick={() => navigate('/market-pulse')}
            className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden"
          >

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize tracking-tight leading-none mb-1">Market Intelligence</h3>
                <p className="text-[9px] font-bold text-slate-500 capitalize tracking-widest flex items-center gap-1.5">
                  View Material Prices in the Market
                </p>
              </div>
            </div>
            <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all relative z-10">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* ── MY RFQ QUOTES (NEW OS LAYER) ── */}
          <div
            onClick={() => navigate('/my-rfq-offers')}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between group active:scale-[0.98] transition-all shadow-sm relative overflow-hidden"
          >

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize tracking-tight leading-none mb-1.5">Submitted RFQ Proposals</h3>
                <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest flex items-center gap-2">
                  Track Requests to Buyers
                </p>
              </div>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all relative z-10">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* ── COMMUNITY COLLECTIVE (NEW OS LAYER) ── */}
          <div
            onClick={() => navigate('/community-collective')}
            className="bg-indigo-600 dark:bg-slate-800 border border-indigo-700 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white capitalize tracking-tight leading-none mb-1.5">Collective Hub</h3>
                <p className="text-[10px] font-bold text-indigo-100/60 capitalize tracking-widest flex items-center gap-2 italic">
                  Join Swarms & Group Missions
                </p>
              </div>
            </div>
            <div className="p-2 bg-white/10 rounded-xl text-white group-hover:bg-white group-hover:text-indigo-600 transition-all relative z-10">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          {/* End space-y-3 */}
        </div>




        {/* ── TRUST SCORE & LEADERBOARD GROUP ── */}
        {/* <div className="space-y-2">
            <div
              onClick={() => navigate('/trust-score')}
              className="bg-gradient-to-r from-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-3 group transition-all active:scale-[0.98] cursor-pointer relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[4rem] rounded-tr-2xl" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-500/30">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize tracking-widest leading-none">Trust Score</p>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 capitalize tracking-widest">Know Your Eligibility</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize tracking-widest">Check Rate</span>
                  <ChevronRight className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>

              <div className="relative z-10 pt-2.5 border-t border-emerald-500/10 mt-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tracks market reliability and performance history. High scores unlock platform rewards and loans.
                </p>
              </div>
            </div>
          </div> */}

      </div>
      {/* ── RECENT ACTIVITY (BASE RECORD) ── */}
      <div className="bg-slate-200 dark:bg-slate-900/50 !mt-2 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-sm capitalize tracking-widest text-slate-600 px-1">Recent Activity</h3>
          <div className="flex items-center gap-3">
            {recentBookings.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-[11px] font-semibold text-slate-400 hover:text-red-500 capitalize tracking-widest transition-colors"
              >
                Clear
              </button>
            )}
            <History className="w-4 h-4 text-slate-300" />
          </div>
        </div>

        <div className="space-y-6">
          {recentBookings.map((item: any, i) => (
            <div key={i} className="flex items-center justify-between group px-1">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center text-lg">
                  {item.wasteType === 'general' ? '🗑️' : item.wasteType === 'recyclable' ? '♻️' : '🥬'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">{formatMaterial(item.wasteType)} Trade</p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-[11px] font-semibold capitalize tracking-widest ${item.status === 'completed' ? 'text-emerald-600' :
                  item.status === 'pending_clearance' ? 'text-rose-500' : 'text-amber-600'
                  }`}>
                  {item.status === 'pending_clearance' ? 'Held for Clearance' : item.status}
                </p>
                {item.status === 'completed' && (
                  <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Verified</p>
                )}
                {item.status === 'pending_clearance' && (
                  <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Awaiting Hub Weight Check</p>
                )}
              </div>
            </div>
          ))}

          {recentBookings.length === 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-slate-600 font-semibold capitalize tracking-widest">No Activity Yet</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
