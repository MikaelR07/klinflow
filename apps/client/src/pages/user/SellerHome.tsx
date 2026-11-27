/**
 * Seller Home — Revenue dashboard, quick actions, trust score, leaderboard
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Bell,
  MapPin,
  Zap,
  Wallet,
  Clock,
  Trash2,
  Plus,
  Sparkles,
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
  Receipt,
  Circle,
  TruckIcon,
  Brain,
  BrainCog,
  BrainCircuit,
  TrainFront,
  CircleFadingPlus,
  BrainCircuitIcon,
  PackageMinus,
  Wallet2Icon,
  ChevronDown,
  BarChart3Icon,
  Headset,
  ChevronDownCircle,
  ScrollText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { supabase } from '@klinflow/supabase';
import { useLocationStore } from '@klinflow/core/stores/locationStore';
import { walletService } from '@klinflow/core';
import type { SellerWalletStats } from '@klinflow/core/services/walletService';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { SkeletonCard } from '@klinflow/ui/components/Skeletons';
import PushNotificationModal from '@klinflow/ui/components/PushNotificationModal';
import { LoadingScreen } from '@klinflow/ui/components/Loading';
import { toast } from 'sonner';
import WithdrawModal from '../../components/user/WithdrawModal';

const catalogItems = [
  { id: 'plastic', name: 'Plastics', desc: 'PET Bottles, HDPE', price: '25/KG', icon: '🥤', color: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  { id: 'paper', name: 'Paper & Carton', desc: 'Cardboard, Books', price: '10/KG', icon: '📦', color: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
  { id: 'metal', name: 'Metals', desc: 'Aluminum, Steel', price: '60/KG', icon: '🥫', color: 'from-slate-500/10 to-slate-500/5', border: 'border-slate-500/20', text: 'text-slate-600 dark:text-slate-400' },
  { id: 'ewaste', name: 'E-Waste', desc: 'Phones, Cables', price: 'VARIES', icon: '📱', color: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
  { id: 'glass', name: 'Glass', desc: 'Bottles, Jars', price: '3/KG', icon: '🍾', color: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
];

const COLOR_PALETTES = [
  { color: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  { color: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
  { color: 'from-slate-500/10 to-slate-500/5', border: 'border-slate-500/20', text: 'text-slate-600 dark:text-slate-400' },
  { color: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
  { color: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
];

export default function SellerHome() {
  const profile = useAuthStore(s => (s as any).profile);
  const walletBalance = useAuthStore(s => (s as any).walletBalance);
  const rewardPoints = useAuthStore(s => (s as any).rewardPoints);
  const role = useAuthStore(s => (s as any).role);
  const withdrawRewards = useAuthStore(s => (s as any).withdrawRewards);
  const subscribeToProfileChanges = useAuthStore(s => (s as any).subscribeToProfileChanges);
  const isInitializing = useAuthStore(s => (s as any).isInitializing);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const bookings = useBookingStore(s => s.bookings);
  const fetchBookings = useBookingStore(s => s.fetchBookings);
  const setActiveVerificationBooking = useBookingStore(s => s.setActiveVerificationBooking);

  const categories = useServiceStore(s => s.categories);
  const fetchCategories = useServiceStore(s => s.fetchCategories);

  const receivedOrders = useMarketplaceStore(s => s.receivedOrders);
  const fetchReceivedOrders = useMarketplaceStore(s => s.fetchReceivedOrders);
  const receivedOffers = useMarketplaceStore(s => s.receivedOffers);
  const fetchIncomingOffers = useMarketplaceStore(s => s.fetchIncomingOffers);
  const myListings = useMarketplaceStore(s => s.myListings);
  const fetchMyActivity = useMarketplaceStore(s => s.fetchMyActivity);
  const sentOffers = useMarketplaceStore(s => s.sentOffers);
  const fetchSentOffers = useMarketplaceStore(s => s.fetchSentOffers);

  // NOTE: Realtime subscription is managed globally in App.tsx — do NOT subscribe/cleanup here
  const getUnreadCount = useNotificationStore(s => s.getUnreadCount);
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const subscribeToPush = useNotificationStore(s => s.subscribeToPush);


  const navigate = useNavigate();

  const unreadCount = getUnreadCount();

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [cashBalance, setCashBalance] = useState(() => Number(walletBalance || 0));
  const [gfpBalance, setGfpBalance] = useState(() => Number(rewardPoints || 0));

  useEffect(() => {
    if (walletBalance !== undefined && walletBalance !== null) {
      setCashBalance(Number(walletBalance));
    }
  }, [walletBalance]);

  useEffect(() => {
    if (rewardPoints !== undefined && rewardPoints !== null) {
      setGfpBalance(Number(rewardPoints));
    }
  }, [rewardPoints]);
  const [stats, setStats] = useState<SellerWalletStats | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeContractsCount, setActiveContractsCount] = useState(0);
  const { status, liveAddress, startTracking } = useLocationStore();

  useEffect(() => {
    startTracking();
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [startTracking]);

  useEffect(() => {
    fetchBookings();
    fetchCategories();
    fetchReceivedOrders();
    fetchIncomingOffers();
    fetchMyActivity();
    fetchSentOffers();

    if (profile?.id) {
      fetchNotifications(profile.id, 'client');
      subscribeToProfileChanges(profile.id);
      // Fetch real wallet balance from user_wallets (includes RFQ payouts)
      walletService.getWalletDetails(profile.id).then(data => {
        if (data) {
          setCashBalance(Number(data.cash_balance || 0));
          setGfpBalance(Number(data.available_points || 0));
        }
      });
      walletService.getSellerDashboard(profile.id).then(data => {
        if (data) {
          setStats(data);
        }
      });
      // Fetch active contracts count
      supabase.rpc('get_visible_rfqs', { p_seller_id: profile.id }).then(({ data }) => {
        if (data) {
          const count = data.filter((r: any) => r.status === 'open' && (!r.deadline || new Date(r.deadline).getTime() > new Date().getTime())).length;
          setActiveContractsCount(count);
        }
      });
      // Realtime subscription handled globally by App.tsx
    }

    return () => { };
  }, [profile?.id, profile?.estate, role]);

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


  // ── MERCHANT METRICS (Marketplace Centric) ──
  const marketplaceBookings = bookings.filter((b: any) => b.booking_type === 'marketplace' || b.booking_type === 'marketplace_pickup');

  const totalDeals = stats?.total_deals || marketplaceBookings.filter(b => b.status === 'completed').length;

  const totalSoldKg = stats?.total_sold_kg || marketplaceBookings
    .filter(b => b.status === 'completed')
    .reduce((acc, b: any) => acc + (parseFloat(String(b.actualWeightKg || b.weightKg || 0)) || 0), 0);

  // Escrow includes accepted offers AND active bookings
  const acceptedOffersValue = receivedOrders
    .filter((o: any) => o.status === 'accepted')
    .reduce((acc, o: any) => acc + (parseFloat(String(o.totalPrice || o.totalPrice || 0)) || 0), 0);

  const activeBookingsValue = marketplaceBookings
    .filter(b => b.status !== 'completed' && b.status !== 'cancelled')
    .reduce((acc, b: any) => acc + (parseFloat(String(b.totalPrice || b.totalPrice || 0)) || 0), 0);

  const inEscrowAmount = stats?.pending_settlement || 0;


  if (isInitializing && !profile) {
    return <LoadingScreen message="Loading Merchant Profile..." />;
  }

  if (!profile) {
    return <LoadingScreen message="Session Expired. Re-authenticating..." />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-white dark:bg-slate-800 relative overflow-x-hidden font-sans pb-4">
      {/* ── PUSH ENROLLMENT MODAL ── */}
      <PushNotificationModal isOpen={showPushPrompt} onClose={handleDismissPush} />

      {/* ── TOP NAV (FIXED) ── */}
      <div className={`fixed top-0 left-0 right-0 z-50 pt-[calc(env(safe-area-inset-top,1.5rem)+1rem)] pb-2.5 transition-all duration-300 ${isScrolled ? 'bg-white dark:bg-slate-800/90 backdrop-blur-md shadow-md border-b border-slate-200 dark:border-slate-700' : 'bg-[#f8fafc] dark:bg-slate-800'}`}>
        <div className="max-w-xl mx-auto px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md p-[2px] shadow-sm border border-white/20">
              <div className="w-full h-full rounded-full bg-emerald-700 flex items-center justify-center overflow-hidden">
                {profile?.avatarUrl ? (
                  <OptimizedImage src={getThumbnailUrl(profile.avatarUrl, { width: 100 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                ) : (
                  <span className="text-xl">{(profile as any)?.avatar || '👤'}</span>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-slate-700 dark:text-white tracking-wide leading-none">
                Hello, {(profile?.fullName || profile?.name || 'Merchant').split(' ')[0]}!👋
              </h1>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-600 dark:text-slate-300 font-semibold capitalize tracking-wider bg-slate-100 dark:bg-slate-700/50 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-600 w-fit">
                <MapPin className={`w-3 h-3 ${status === 'tracking' ? 'animate-pulse text-emerald-400' : ''}`} />
                {status === 'tracking' ? (liveAddress || "Live GPS") : (status === 'stale' && liveAddress ? ("⏳ " + liveAddress) : (profile?.location?.estate || profile?.estate || "Location not set"))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-11 h-11 shrink-0 rounded-2xl bg-slate-100 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95 group"
            >
              <Bell className="w-5 h-5 text-slate-900 dark:text-slate-300 group-hover:animate-swing" />
              {Number(unreadCount) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800 shadow-md animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/settings/support')}
              className="relative w-11 h-11 shrink-0 rounded-2xl bg-slate-100 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95 group"
            >
              <Headset className="w-5 h-5 text-slate-900 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-xl mx-auto px-2.5 pt-[calc(env(safe-area-inset-top,1.5rem)+5.5rem)] pb-5 space-y-6">

        {/* ── ECO-REWARDS HERO CARD (MERCHANT REVENUE) ── */}
        <div className="relative group overflow-hidden rounded-[24px] bg-gradient-to-br from-lime-400 to-lime-500 border border-lime-400/80 p-4 ">
          <div className="relative z-10 flex flex-col gap-1">
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="text-[10px] font-bold text-emerald-950/80 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Wallet className="w-4 h-4 text-emerald-950" /> Wallet Balance
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-emerald-950/80">Ksh</span>
                  <h2 className="text-2xl font-bold text-emerald-950 tracking-tighter leading-none">
                    {Number(cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="bg-emerald-950 text-white hover:bg-emerald-900 mt-1 px-5 py-3 rounded-2xl text-sm font-bold capitalize tracking-widest transition-all active:scale-95"
              >
                Withdraw
              </button>
            </div>

            <div className="flex items-center gap-1 pt-2 border-t border-emerald-950/15">
              <div className="flex-1 bg-black/10 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-black/5">
                <span className="text-base font-bold text-emerald-950">{totalDeals}</span>
                <span className="text-[9px] font-bold text-emerald-950/80 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Handshake className="w-3 h-3 text-emerald-950" /> Active Trades</span>
              </div>
              <div className="flex-1 bg-black/10 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-black/5">
                <span className="text-base font-bold text-emerald-950">{totalSoldKg}</span>
                <span className="text-[9px] font-bold text-emerald-950/80 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Scale className="w-3 h-3 text-emerald-950" /> KG Sold</span>
              </div>
              <div className="flex-1 bg-black/10 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-black/5">
                <span className="text-base font-bold text-emerald-950">{gfpBalance.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-emerald-950/80 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Sparkles className="w-3 h-3 shrink-0 text-emerald-950" /> Green Points</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <motion.div variants={itemVariants} className='!mt-4'>
          <div className="space-y-2">
            <h3 className="text-[12px] font-semibold text-slate-600 dark:text-white capitalize tracking-widest px-1">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'Sell', icon: <CircleFadingPlus className="w-5.5 h-5.5 text-emerald-950 dark:text-white" />, route: '/post-trade', color: 'bg-emerald-50 dark:bg-slate-800' },
                { label: 'Listings', icon: <Package className="w-5.5 h-5.5 text-emerald-950 dark:text-white" />, route: '/inventory', color: 'bg-blue-50 dark:bg-slate-800' },
                { label: 'Orders', icon: <Handshake className="w-5.5 h-5.5 text-emerald-950 dark:text-white" />, route: '/my-trades', color: 'bg-purple-50 dark:bg-slate-800', badge: receivedOffers.filter((o: any) => o.status === 'pending').length },
                { label: 'Wallet', icon: <Wallet className="w-5.5 h-5.5 text-emerald-950 dark:text-white" />, route: '/seller-wallet', color: 'bg-amber-50 dark:bg-slate-800' },
              ].map((service) => (
                <button
                  key={service.label}
                  onClick={() => navigate(service.route)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-50 dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm group"
                >
                  <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center ${service.color} group-hover:scale-110 transition-transform`}>
                    {service.badge && service.badge > 0 ? (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm z-10">
                        <span className="text-[10px] font-semibold text-white">{service.badge}</span>
                      </div>
                    ) : null}
                    {service.icon}
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 capitalize tracking-wider">{service.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── KLINFLOW BANNERS ── */}
        <motion.div variants={itemVariants} className="!mt-2">
          <div className="flex gap-2.5 overflow-x-auto pb-3 custom-scrollbar snap-x snap-mandatory pr-6">
            {/* Banner 1 */}
            <div className="shrink-0 w-[98%] sm:w-[96%] snap-center relative bg-gradient-to-r from-[#e7f5ed] to-[#c6eed5] dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-[16px] overflow-hidden shadow-sm border border-blue-900/50 dark:border-blue-900/50 aspect-[3/1]">
              <img src="/vectors/ecoBanner2.webp" alt="Promo" className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* Banner 2 */}
            <div className="shrink-0 w-[98%] sm:w-[96%] snap-center relative rounded-[16px] overflow-hidden shadow-sm border border-slate-200/50 dark:border-slate-700/50 aspect-[3/1] bg-slate-900">
              <img src="/vectors/ecoBanner.webp" alt="Promo 2" className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* ── SELLER LEADERBOARD CARD ── */}
        <motion.div variants={itemVariants} className="!mt-3">
          <div
            onClick={() => navigate('/leaderboard')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#085078] to-[#003973] border border-[#003973]  p-4 flex items-center justify-between cursor-pointer hover:brightness-105 transition-all shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold text-white leading-tight">
                    Merchant Leaderboard
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white tracking-wider uppercase">
                    Rankings
                  </span>
                </div>
                <p className="text-[11px] text-amber-50 font-medium mt-0.5">
                  View top sellers & weekly performance standings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 text-white/80 group-hover:text-white transition-colors shrink-0">
              <span className="text-[11px] font-semibold hidden sm:inline">View</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </motion.div>

        {/* ── BUSINESS TOOLS ── */}
        <div className="!mt-4">
          <div className="flex items-center justify-between px-1.5 mb-2">
            <h3 className="text-[12px] font-semibold text-slate-600 dark:text-white capitalize tracking-widest">Business Tools</h3>
          </div>

          <div className="grid grid-cols-2 gap-2 px-1.5">
            {/* ── CONTRACTS ── */}
            <button
              onClick={() => navigate("/group-rfqs")}
              className="bg-white dark:bg-slate-800 rounded-xl h-28 shadow-sm hover:shadow-md active:scale-[0.98] transition-all border border-slate-200 dark:border-slate-700 relative overflow-hidden group"
            >
              <img src="/vectors/contracts.webp" alt="Contracts" className="absolute inset-0 w-full h-full object-cover object-left scale-110" />
              <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                {activeContractsCount} active
              </div>
            </button>

            {/* ── MARKET PRICES ── */}
            <button
              onClick={() => navigate("/market-pulse")}
              className="bg-white dark:bg-slate-800 rounded-xl h-28 shadow-sm hover:shadow-md active:scale-[0.98] transition-all border border-slate-200 dark:border-slate-700 relative overflow-hidden group"
            >
              <img src="/vectors/prices.webp" alt="Market Prices" className="absolute inset-0 w-full h-full object-cover object-left scale-110" />
              <div className="absolute bottom-2 right-2 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                Live
              </div>
            </button>
          </div>
        </div>

        


        {/* ── CATALOG: E-COMMERCE SCROLL ── */}
        <motion.div variants={itemVariants} className="space-y-2 !mt-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[12px] font-semibold text-slate-600 dark:text-white capitalize tracking-widest">What Collectors Buy!</h3>

          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar pr-8 scroll-smooth">
            {/* Left spacer */}
            <div className="w-0.5 shrink-0" />
            {(() => {
              const items = categories.length > 0 ? categories : catalogItems as any[];
              const getSortIndex = (i: any) => {
                const id = (i.slug || i.id || '').toLowerCase();
                const name = (i.label || i.name || '').toLowerCase();
                if (id.includes('metal') || name.includes('metal')) return 0;
                if (id.includes('plastic') || name.includes('plastic')) return 1;
                if (id.includes('paper') || name.includes('paper') || id.includes('cardboard') || name.includes('cardboard')) return 2;
                if (id.includes('glass') || name.includes('glass')) return 3;
                if (id.includes('ewaste') || name.includes('ewaste') || id.includes('e-waste') || name.includes('electronic')) return 4;
                if (id.includes('organic') || name.includes('organic') || id.includes('food')) return 5;
                if (id.includes('textile') || name.includes('textile') || id.includes('clothes')) return 6;
                if (id.includes('mix') || name.includes('mix') || id.includes('recyclable')) return 7;
                return 99;
              };

              return [...items].sort((a, b) => getSortIndex(a) - getSortIndex(b));
            })().map((item: any) => {
              const isDB = categories.length > 0;
              const priceVal = isDB ? (item.price_per_unit || item.price_per_kg || 0) : null;
              const displayPrice = isDB
                ? (priceVal ? `Upto ${priceVal}/kg` : 'VARIES')
                : (item.price.includes('VARIES') ? 'VARIES' : `Upto ${item.price}`);

              const identifier = (item.slug || item.id || '').toLowerCase();
              const itemLabel = (item.label || item.name || '').toLowerCase();
              let bgImage = item.image_url;
              if (!bgImage) {
                if (identifier.includes('textile') || identifier.includes('clothes') || itemLabel.includes('textile') || itemLabel.includes('clothes')) bgImage = '/material-categories/textile.webp';
                else if (identifier.includes('paper') || identifier.includes('cardboard') || identifier.includes('box')) bgImage = '/material-categories/boxes.webp';
                else if (identifier.includes('plastic')) bgImage = '/material-categories/plastic.webp';
                else if (identifier.includes('ewaste') || identifier.includes('e-waste') || identifier.includes('electronic')) bgImage = '/material-categories/E-waste.webp';
                else if (identifier.includes('metal')) bgImage = '/material-categories/metal.webp';
                else if (identifier.includes('organic') || identifier.includes('food')) bgImage = '/material-categories/organic-waste.webp';
                else if (identifier.includes('general') || identifier.includes('trash')) bgImage = '/material-categories/general-waste.webp';
                else if (identifier.includes('glass')) bgImage = '/material-categories/glasses.webp';
                else if (identifier.includes('appliance')) bgImage = '/material-categories/bulky-item.webp';
                else if (identifier.includes('bulky') || identifier.includes('sofa') || identifier.includes('furniture')) bgImage = '/material-categories/bulky-sofas.webp';
                else if (identifier.includes('recycl')) bgImage = '/material-categories/recyclables.webp';
              }
              const imgPath = bgImage || '/material-categories/recyclables.webp';
              const label = item.label || item.name;

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/materials/${identifier}`)}
                  className="snap-start shrink-0 w-28 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 overflow-hidden cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="h-16 w-full bg-slate-200/60 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={imgPath}
                      alt={label}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate leading-tight">
                      {label}
                    </p>
                    <p className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
                      {displayPrice}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>

      {/* Floating AI Voice Assistant */}
      {/* <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/hygenex")}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center z-50 border-1 border-white dark:border-slate-800"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-20" />
        <BrainCircuit className="w-6 h-6 text-white" />
      </motion.button> */}

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        initialBalance={Number(cashBalance || 0)}
      />
    </div>
  );
}
