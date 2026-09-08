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
  ChevronDownCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { supabase } from '@klinflow/supabase';
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
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="pb-4 bg-[#f8fafc] dark:bg-[#0f172a] font-sans">

      {/* ── PUSH ENROLLMENT MODAL ── */}
      <PushNotificationModal
        isOpen={showPushPrompt}
        onClose={handleDismissPush}
      />

      {/* ── TOP NAV (FIXED) ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)] pb-3 px-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-[2px] shadow-sm">
              <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                {profile?.avatarUrl ? (
                  <OptimizedImage src={getThumbnailUrl(profile.avatarUrl, { width: 300 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                ) : (
                  <span className="text-xl">{(profile as any)?.avatar || '👤'}</span>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-wide leading-none">
                Hello, {(profile?.fullName || profile?.name || 'Merchant').split(' ')[0]}!👋
              </h1>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold capitalize tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 w-fit">
                <MapPin className="w-3 h-3" />
                {profile?.location?.estate || profile?.estate || 'searching...'}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-11 h-11 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 group"
          >
            <Bell className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            {Number(unreadCount) > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800 shadow-md animate-in zoom-in">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-1.5 space-y-6 pt-16">
        {/* ── REVENUE HERO CARD ── */}
        <motion.div variants={itemVariants} className="relative group overflow-hidden rounded-[24px] bg-gradient-to-br from-[#064e3b] to-emerald-600 p-6">
        
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Wallet className="w-4 h-4" /> Available Balance
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-emerald-100">Ksh</span>
                  <h2 className="text-2xl font-black text-white tracking-tighter leading-none">
                    {Number(cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => navigate('/withdraw')}
                className="bg-primary mt-1 backdrop-blur-md border border-white/20 text-white px-5 py-3 rounded-2xl text-sm font-bold capitalize tracking-widest transition-all active:scale-95 shadow-sm"
              >
                Withdraw
              </button>
            </div>

            <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
              <div className="flex-1 bg-black/20 rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-white">{totalDeals}</span>
                <span className="text-[10px] font-bold text-emerald-200 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Handshake className="w-3 h-3" /> Deals</span>
              </div>
              <div className="flex-1 bg-black/20 rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-white">{totalSoldKg}</span>
                <span className="text-[10px] font-bold text-emerald-200 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Scale className="w-3 h-3" /> KG Sold</span>
              </div>
              <div onClick={() => navigate("/impact-hub")} className="flex-1 bg-black/20 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-500/30 transition-colors">
                <span className="text-lg font-black text-amber-300">{gfpBalance.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-amber-200 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Sparkles className="w-3 h-3 shrink-0" /> Green Points</span>
              </div>
            </div>
          </div>
        </motion.div>


        <motion.div variants={itemVariants} className="bg-slate-200 dark:bg-slate-800/40 rounded-[12px] p-1.5 !mt-2 shadow-sm border border-slate-200/50 dark:border-slate-800/60 space-y-3">
          <div className="space-y-2">
            <h3 className="text-[13px] font-black text-slate-700 dark:text-white capitalize tracking-widest px-1">Quick Actions</h3>
            {/* ── HUSTLE ACTION CENTER (QUARTET CONTROLS) ── */}
            <div className="grid grid-cols-4 gap-1.5 !mt-1">
              <button
                onClick={() => navigate('/post-trade')}
                className="bg-white dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all group"
              >
                <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CircleFadingPlus className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Sell</span>
              </button>

              <button
                onClick={() => navigate('/inventory')}
                className="bg-white dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all group"
              >
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Listings</span>
              </button>

              <button
                onClick={() => navigate('/my-trades')}
                className="bg-white dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all group"
              >
                <div className="relative">
                  {receivedOffers.filter((o: any) => o.status === 'pending').length > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-[10px] font-semibold text-white">{receivedOffers.filter((o: any) => o.status === 'pending').length}</span>
                    </div>
                  )}
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Handshake className="w-6 h-6" />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Trades</span>
              </button>

              <button
                onClick={() => navigate('/seller-wallet')}
                className="bg-white dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all group"
              >
                <div className="w-9 h-9 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Wallet</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── CATALOG: E-COMMERCE SCROLL ── */}
        <motion.div variants={itemVariants} className="space-y-2 mt-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[13px] font-black text-slate-800 dark:text-white capitalize tracking-widest">What Collectors Buy!</h3>
            <button  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 capitalize tracking-widest hover:underline flex items-center">
              View Details <ChevronDownCircle className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory -mx-1.5 px-1.5 pr-6 sm:mx-0 sm:px-0">
            {(categories.length > 0 ? categories : catalogItems as any[]).map((item: any, idx: number) => {
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
                  className={`snap-start relative shrink-0 w-[140px] ${!bgImage ? `bg-gradient-to-br ${isDB ? palette.color : item.color}` : 'bg-slate-900'} border ${isDB ? palette.border : item.border} rounded-2xl p-3 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm flex flex-col h-full overflow-hidden`}
                  style={bgImage ? {
                    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.8)), url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {}}
                >
                  <div className={`text-2xl mb-2 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border relative z-10 ${bgImage ? 'bg-white/20 backdrop-blur-md border-white/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                    {item.icon || '♻️'}
                  </div>
                  <h4 className={`text-xs font-black mb-2 leading-none relative z-10 ${bgImage ? 'text-white' : (isDB ? palette.text : item.text)}`}>{item.label || item.name}</h4>
                  <div className={`rounded-lg px-2 py-1.5 mt-auto relative z-10 ${bgImage ? 'bg-black/40 backdrop-blur-md border border-white/10' : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm'}`}>
                    <p className={`text-[9px] font-black text-center leading-none ${bgImage ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{displayPrice}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── BUSINESS TOOLS ── */}
        <motion.div variants={itemVariants} className="bg-slate-100 dark:bg-slate-800/40 rounded-[12px] p-1.5 !mt-1 shadow-sm border border-slate-200/50 dark:border-slate-800/60 space-y-3">
          <div className="space-y-2">
            <h3 className="text-[13px] font-black text-slate-700 dark:text-white capitalize tracking-widest px-1">Business Tools</h3>
          </div>
          {/* ── GRID OF COLLECTIVE & MARKET PRICES ── */}
          <div className="grid grid-cols-2 gap-2 !mt-1">
            {/* ── COMMUNITY COLLECTIVE ── */}
            <div
              onClick={() => navigate('/community-collective')}
              className="bg-white dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between group active:scale-[0.98] transition-all relative overflow-hidden min-h-[120px] shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between w-full relative z-10">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div className="w-6 h-6 bg-slate-200/50 dark:bg-slate-600/50 rounded-full flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-white text-slate-400">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              <div className="relative z-10 mt-auto">
                <h3 className="text-sm font-black text-slate-700 dark:text-white capitalize tracking-tight leading-none mb-1">Collective Hub</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                  View Market Contracts
                </p>
              </div>
            </div>

            {/* ── MARKET INTELLIGENCE ── */}
            <div
              onClick={() => navigate('/market-pulse')}
              className="bg-white dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between group active:scale-[0.98] transition-all relative overflow-hidden min-h-[120px] shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between w-full relative z-10">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="w-6 h-6 bg-slate-200/50 dark:bg-slate-600/50 rounded-full flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-white text-slate-400">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              <div className="relative z-10 mt-auto">
                <h3 className="text-sm font-black text-slate-700 dark:text-white capitalize tracking-tight leading-none mb-1">Market Prices</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                  View Market Rates
                </p>
              </div>
            </div>
          </div>
          {/* ── MY RFQ QUOTES ── */}
          <button 
            onClick={() => navigate('/my-rfq-offers')}
            className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-primary text-white dark:bg-white dark:text-slate-900 rounded-[20px] shadow-md shadow-slate-900/5 active:scale-[0.98] transition-transform overflow-hidden group"
          >
            <div className="border border-white/10 dark:border-slate-900/10 rounded-[16px] p-4 flex items-center justify-between bg-repeat opacity-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 dark:bg-slate-900/10 rounded-full flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white dark:text-slate-900 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-black tracking-tight leading-none mb-1">Submitted RFQ Proposals</h3>
                  <p className="text-[11px] font-bold text-slate-200 dark:text-slate-600">Track Requests To Buyers</p>
                </div>
              </div>
              <div className="w-8 h-8 bg-white/20 dark:bg-slate-900/20 rounded-full flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white dark:text-slate-900 group-hover:translate-x-1 transition-transform" />
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
    </motion.div>
  );
}
