/**
 * Seller Home — Revenue dashboard, quick actions, trust score, leaderboard
 */
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
  MapPinned,
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
  const [cashBalance, setCashBalance] = useState(0);
  const [gfpBalance, setGfpBalance] = useState(0);
  const [stats, setStats] = useState<SellerWalletStats | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeContractsCount, setActiveContractsCount] = useState(0);
  const [activeSwarmsCount, setActiveSwarmsCount] = useState(0);
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
      fetchNotifications(profile.id, role);
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
      // Fetch active swarms count
      if (profile.estate) {
        supabase.from('swarms').select('id, status, closes_at').eq('estate', profile.estate).then(({ data }) => {
          if (data) {
            const count = data.filter((s: any) => s.status === 'active' && new Date(s.closes_at).getTime() > new Date().getTime()).length;
            setActiveSwarmsCount(count);
          }
        });
      }
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
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#f8fafc] dark:bg-slate-800 relative overflow-x-hidden font-sans pb-4">
      {/* ── PUSH ENROLLMENT MODAL ── */}
      <PushNotificationModal isOpen={showPushPrompt} onClose={handleDismissPush} />

      {/* ── TOP SECTION ── */}
      <div className="bg-gradient-to-b from-primary from-60% via-primary/80 to-[#f8fafc] dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 relative z-10 pt-[calc(env(safe-area-inset-top,1.5rem)+4rem)] pb-16 overflow-hidden">
      
        {/* Decorative background orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.08] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none z-10" />
        <div className="absolute top-[100px] left-0 w-48 h-48 bg-teal-300/15 rounded-full blur-3xl -translate-x-1/4 pointer-events-none z-10" />

        {/* ── TOP NAV (FIXED) ── */}
        <div className={`fixed top-0 left-0 right-0 z-50 pt-[calc(env(safe-area-inset-top,1.5rem)+1rem)] pb-2.5 transition-all duration-300 ${isScrolled ? 'bg-gradient-to-br from-primary to-emerald-600 backdrop-blur-md shadow-md border-b border-white/10' : 'bg-transparent '}`}>
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
                <h1 className="text-[17px] font-black text-white tracking-wide leading-none drop-shadow-sm">
                  Hello, {(profile?.fullName || profile?.name || 'Merchant').split(' ')[0]}!👋
                </h1>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-white/90 font-semibold capitalize tracking-wider bg-black/10 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/20 w-fit">
                  <MapPin className={`w-3 h-3 ${status === 'tracking' ? 'animate-pulse text-emerald-400' : ''}`} />
                  {status === 'tracking' ? (liveAddress || "Live GPS") : (status === 'stale' && liveAddress ? ("⏳ " + liveAddress) : (profile?.location?.estate || profile?.estate || "Location not set"))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/notifications')}
                className="relative w-11 h-11 shrink-0 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-sm hover:bg-black/20 transition-all active:scale-95 group"
              >
                <Bell className="w-5 h-5 text-white group-hover:animate-swing" />
                {Number(unreadCount) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-emerald-600 shadow-md animate-in zoom-in">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => navigate('/settings/support')}
                className="relative w-11 h-11 shrink-0 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-sm hover:bg-black/20 transition-all active:scale-95 group"
              >
                <Headset className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ── ECO-REWARDS HERO CARD (MERCHANT REVENUE) ── */}
        <div className="relative z-10 px-2 max-w-xl mx-auto mt-6">
          <motion.div variants={itemVariants} initial="hidden" animate="show" className="relative group overflow-hidden rounded-[24px] bg-white/10 border border-emerald-600 p-5">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-700 to-emerald-800 pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-1">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Wallet className="w-4 h-4" /> Wallet Balance
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-white/90">Ksh</span>
                    <h2 className="text-2xl font-black text-white tracking-tighter leading-none drop-shadow-md">
                      {Number(cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/withdraw')}
                  className="bg-white text-emerald-700 mt-1 px-5 py-3 rounded-2xl text-sm font-black capitalize tracking-widest transition-all active:scale-95 shadow-md hover:shadow-lg hover:bg-emerald-50"
                >
                  Withdraw
                </button>
              </div>

              <div className="flex items-center gap-1 pt-3 border-t border-white/20">
                <div className="flex-1 bg-black/15 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/10">
                  <span className="text-base font-black text-white">{totalDeals}</span>
                  <span className="text-[9px] font-bold text-white/80 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Handshake className="w-3 h-3" /> Active Trades</span>
                </div>
                <div className="flex-1 bg-black/15 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/10">
                  <span className="text-base font-black text-white">{totalSoldKg}</span>
                  <span className="text-[9px] font-bold text-white/80 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Scale className="w-3 h-3" /> KG Sold</span>
                </div>
                <div className="flex-1 bg-black/15 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/20">
                  <span className="text-base font-black text-amber-300 drop-shadow-sm">{gfpBalance.toLocaleString()}</span>
                  <span className="text-[9px] font-bold text-amber-200 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Sparkles className="w-3 h-3 shrink-0" /> Green Points</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>


      <div className="max-w-xl mx-auto px-2.5 space-y-6 -mt-10 pb-5 relative z-20">
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[12px] p-1.5  shadow-sm border border-slate-200/50 dark:border-slate-800/60 space-y-3">
          <div className="space-y-2">
            <h3 className="text-[12px] font-black text-slate-600 dark:text-white capitalize tracking-widest px-1">Quick Actions</h3>
            {/* ── HUSTLE ACTION CENTER (QUARTET CONTROLS) ── */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'Sell', icon: <CircleFadingPlus className="w-5 h-5" />, route: '/post-trade', color: 'bg-emerald-50 dark:bg-slate-800 text-slate-900 dark:text-white' },
                { label: 'Listings', icon: <Package className="w-5 h-5" />, route: '/inventory', color: 'bg-blue-50 dark:bg-slate-800 text-slate-900 dark:text-white' },
                { label: 'Trades', icon: <Handshake className="w-5 h-5" />, route: '/my-trades', color: 'bg-indigo-50 dark:bg-slate-800 text-slate-900 dark:text-white', badge: receivedOffers.filter((o: any) => o.status === 'pending').length },
                { label: 'Wallet', icon: <Wallet className="w-5 h-5" />, route: '/seller-wallet', color: 'bg-amber-50 dark:bg-slate-800 text-slate-900 dark:text-white' },
              ].map((service) => (
                <button
                  key={service.label}
                  onClick={() => navigate(service.route)}
                  className="bg-slate-50 dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group"
                >
                  <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center ${service.color} group-hover:scale-110 transition-transform`}>
                    {service.badge && service.badge > 0 ? (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm z-10">
                        <span className="text-[10px] font-semibold text-white">{service.badge}</span>
                      </div>
                    ) : null}
                    {service.icon}
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">{service.label}</span>
                </button>
              ))}
            </div>
            
          </div>
        </motion.div>

        {/* ── CATALOG: E-COMMERCE SCROLL ── */}
        <motion.div variants={itemVariants} className="space-y-2 ">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[12px] font-black text-slate-600 dark:text-white capitalize tracking-widest">What Collectors Buy!</h3>
            
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory pr-6">
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
            })().map((item: any, idx: number) => {
              const palette = COLOR_PALETTES[idx % COLOR_PALETTES.length];
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
              
              return (
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/materials/${identifier}`)}
                  className={`snap-start relative shrink-0 w-[110px] h-[105px] ${!bgImage ? `bg-gradient-to-br ${isDB ? palette.color : item.color}` : 'bg-slate-900'} border ${isDB ? palette.border : item.border} rounded-2xl p-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm flex flex-col overflow-hidden`}
                  style={bgImage ? {
                    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.3)), url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {}}
                >
                  <div className="flex-1" />
                  <h4 className={`text-[12px] font-black mb-1 leading-none relative z-10 ${bgImage ? 'text-white' : (isDB ? palette.text : item.text)}`}>{item.label || item.name}</h4>
                  <div className={`rounded-lg px-1.5 py-1.5 relative z-10 ${bgImage ? 'bg-black/40 backdrop-blur-md border border-white/10' : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm'}`}>
                    <p className={`text-[9px] font-black text-center leading-none ${bgImage ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{displayPrice}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── KLINFLOW BANNERS ── */}
        <motion.div variants={itemVariants} className="!mt-2">
          <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar snap-x snap-mandatory pr-6">
            {/* Left spacer */}
            {/* <div className="w-0.5 shrink-0" /> */}
            {/* Banner 1 */}
            <div className="shrink-0 w-[96%] sm:w-[85%] snap-center relative bg-gradient-to-r from-[#e7f5ed] to-[#c6eed5] dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-[16px] p-4 flex flex-col justify-center overflow-hidden shadow-sm border border-emerald-200/50 dark:border-emerald-700/50 min-h-[130px]">
              <img src="/vectors/ecoBanner.webp" alt="Promo" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-1 w-[65%] sm:w-[65%]">
                <h3 className="text-[16px] font-black text-amber-500 dark:text-white leading-tight mb-1">
                  Endless Possibilities<br />for Everyone <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
                </h3>
                <p className="text-[11px] font-medium text-emerald-100 dark:text-emerald-300/80 leading-tight">
                  Whether you collect, buy, sell or create, we connect you to opportunities.
                </p>
              </div>
            </div>

            {/* Banner 2 */}
            <div className="shrink-0 w-[96%] sm:w-[85%] snap-center relative rounded-[16px] overflow-hidden shadow-sm border border-slate-200/50 dark:border-slate-700/50 min-h-[130px] bg-slate-900">
              <img src="/vectors/ecoBanner2.webp" alt="Promo 2" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* ── BUSINESS TOOLS ── */}
        <motion.div variants={itemVariants} className="!mt-2 space-y-2 px-1.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-black text-slate-600 dark:text-white capitalize tracking-widest">Business Tools</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {/* ── CONTRACTS ── */}
            <button 
              onClick={() => navigate("/group-rfqs")}
              className="w-full bg-indigo-100 dark:bg-slate-900 rounded-xl p-3 flex items-start gap-2.5 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] transition-all border border-slate-100 dark:border-slate-700 relative overflow-hidden group"
            >
              <div className="w-10 h-10 shrink-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform self-start">
                <ScrollText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-left flex-1 min-w-0 flex flex-col w-full h-full justify-between">
                <div className="min-w-0">
                  <h4 className="text-[12px] min-[390px]:text-[14px] font-black text-slate-800 dark:text-white leading-none mb-1">Contracts</h4>
                  <p className="text-[9.5px] min-[390px]:text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight mb-3">Material Requests</p>
                </div>
                
                <div className="flex items-center justify-between gap-1 w-full mt-auto">
                  <div className="bg-indigo-50 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded-[8px] flex items-center gap-1 min-w-0 shrink">
                    <ArrowRight className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate">{activeContractsCount} active</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-600 shrink-0" />
                </div>
              </div>
            </button>

            {/* ── MARKET PRICES ── */}
            <button 
              onClick={() => navigate("/market-pulse")}
              className="w-full bg-amber-50 dark:bg-slate-900 rounded-xl p-3 flex items-start gap-2.5 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] transition-all border border-slate-100 dark:border-slate-700 relative overflow-hidden group"
            >
              <div className="w-10 h-10 shrink-0 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform self-start">
                <BarChart3Icon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-left flex-1 min-w-0 flex flex-col w-full h-full justify-between">
                <div className="min-w-0">
                  <h4 className="text-[12px] min-[390px]:text-[14px] font-black text-slate-800 dark:text-white leading-none mb-1">Market Prices</h4>
                  <p className="text-[9.5px] min-[390px]:text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight mb-3">View material prices</p>
                </div>
                
                <div className="flex items-center justify-between gap-1 w-full mt-auto">
                  <div className="bg-amber-50 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-[8px] flex items-center gap-1 min-w-0 shrink">
                    <TrendingUp className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 truncate">Live</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-600 shrink-0" />
                </div>
              </div>
            </button>
          </div>
        </motion.div>

        {/* ── SWARMS (Horizontal Card) ── */}
        <motion.div variants={itemVariants} className="!mt-2 px-1.5">
          <button 
            onClick={() => navigate("/swarms")}
            className="w-full bg-gradient-to-tl from-primary to-emerald-600 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-[20px] p-4 flex items-center justify-between cursor-pointer hover:shadow-md active:scale-[0.98] transition-all shadow-sm group relative overflow-hidden"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/10 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <MapPinned className="w-6 h-6 text-emerald-100 dark:text-emerald-400" />
              </div>
              <div className="text-left min-w-0">
                <h4 className="text-[14px] font-bold text-slate-50 dark:text-white tracking-tight leading-none mb-1">Swarms</h4>
                <p className="text-[11px] font-semibold text-slate-200 dark:text-slate-400 leading-tight">Join group collection networks nearby</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 relative z-10">
              <div className="bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{activeSwarmsCount} nearby</span>
              </div>
              <div className="w-8 h-8 rounded-full dark:bg-slate-700 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                <ChevronRight className="w-4 h-4 text-white dark:text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </motion.div>



      </div>

      {/* Floating AI Voice Assistant */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/hygenex")}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center z-50 border-1 border-white dark:border-slate-800"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-20" />
        <BrainCircuit className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
}
