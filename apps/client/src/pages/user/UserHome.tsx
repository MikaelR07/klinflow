/**
 * User Home — Resident Dashboard
 * An e-commerce and on-demand hybrid layout for everyday recycling.
 */
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, MapPin, Wallet, Truck, Recycle, TrendingUp, ChevronRight,
  Sparkles, BrainCircuit, Leaf, Users, BarChart3Icon, Search, Package,
  Info, DollarSign, Calendar, Clock, Star, ShieldCheck, ArrowRight,
  BarChart3,
  BarChart,
  RecycleIcon,
  ChevronDownCircle,
  Headset,
  CalendarPlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBookingStore } from "@klinflow/core/stores/bookingStore";
import { useAuthStore } from "@klinflow/core/stores/authStore";
import { useNotificationStore } from "@klinflow/core/stores/notificationStore";
import { useServiceStore } from "@klinflow/core/stores/serviceStore";
import { supabase } from "@klinflow/supabase";
import { useLocationStore } from "@klinflow/core/stores/locationStore";
import { getThumbnailUrl } from "@klinflow/core/utils/imageUtils";
import { toast } from "sonner";
import PushNotificationModal from "@klinflow/ui/components/PushNotificationModal";
import { LoadingScreen } from "@klinflow/ui/components/Loading";
import SellerHome from "./SellerHome";

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

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

export default function UserHome() {
  const profile = useAuthStore((s) => s.profile);
  const walletBalance = useAuthStore((s) => s.walletBalance);
  const rewardPoints = useAuthStore((s) => s.rewardPoints);
  const role = useAuthStore((s) => s.role);
  const subscribeToProfileChanges = useAuthStore((s) => s.subscribeToProfileChanges);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  const bookings = useBookingStore((s) => s.bookings);
  const fetchBookings = useBookingStore((s) => s.fetchBookings);

  const getUnreadCount = useNotificationStore((s) => s.getUnreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const subscribeToPush = useNotificationStore((s) => s.subscribeToPush);
  
  const categories = useServiceStore((s) => s.categories);
  const fetchCategories = useServiceStore((s) => s.fetchCategories);
  
  const navigate = useNavigate();

  const unreadCount = getUnreadCount();
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
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
    if (profile?.id) {
      fetchProfile();
      fetchNotifications(profile.id, 'client');
      subscribeToProfileChanges(profile.id);
    }

    const dismissed = localStorage.getItem("push_prompt_dismissed");
    if (!dismissed && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      setShowPushPrompt(true);
    }
    return () => {};
  }, [profile?.id, role]);

  useEffect(() => {
    const fetchRank = async () => {
      if (!profile?.id) return;
      const userPoints = profile?.rewardPoints || 0;
      if (userPoints === 0) {
        setUserRank(null);
        return;
      }
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact" })
        .eq("role", "user")
        .gt("reward_points", userPoints)
        .limit(1);
      if (!error) setUserRank(((count as number) || 0) + 1);
    };
    fetchRank();
  }, [profile?.id, profile?.rewardPoints]);

  const handleWithdraw = () => {
    if (walletBalance < 100) {
      toast.warning(`You need KSh ${100 - walletBalance} more to withdraw.`, {
        description: "Klinflow requires a minimum of KSh 100 for settlement processing.",
      });
      return;
    }
    navigate("/withdraw");
  };

  const metrics = useMemo(() => {
    const completed = bookings.filter((b) => b.status === "completed");
    const totalPickups = completed.length;
    const kgRecovered = completed.reduce((sum: number, b: any) => sum + (Number(b.actualWeightKg) || Number(b.weightKg) || 0), 0);
    return { totalPickups, kgRecovered };
  }, [bookings]);

  if (isInitializing && !profile) {
    return <LoadingScreen message="Hydrating Profile..." />;
  }

  if (profile?.role === "seller") {
    return <SellerHome />;
  }

  if (!profile) {
    return <LoadingScreen message="Re-Authenticating..." />;
  }

  return (
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#f8fafc] dark:bg-slate-800 relative overflow-x-hidden  font-sans">
      {/* ── PUSH ENROLLMENT MODAL ── */}
      <PushNotificationModal isOpen={showPushPrompt} onClose={() => setShowPushPrompt(false)} />

      {/* ── TOP NAV (FIXED) ── */}
      <div className={`fixed top-0 left-0 right-0 z-50 pt-[calc(env(safe-area-inset-top,1.5rem)+1rem)] pb-2.5 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-md border-b border-slate-200 dark:border-slate-700' : 'bg-[#f8fafc] dark:bg-slate-800'}`}>
        <div className="max-w-xl mx-auto px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md p-[2px] shadow-sm border border-white/20">
              <div className="w-full h-full rounded-full bg-emerald-700 flex items-center justify-center overflow-hidden">
                {profile?.avatarUrl ? (
                  <img src={getThumbnailUrl(profile.avatarUrl, { width: 100 })} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-slate-700 dark:text-white tracking-wide leading-none">
                Hello, {(profile?.fullName || profile?.name || "Resident").split(" ")[0]}!👋
              </h1>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-600 dark:text-slate-300 font-semibold capitalize tracking-wider bg-slate-100 dark:bg-slate-700/50 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-600 w-fit">
                <MapPin className={`w-3 h-3 ${status === 'tracking' ? 'animate-pulse text-emerald-400' : ''}`} />
                {status === 'tracking' ? (liveAddress || "Live GPS") : (status === 'stale' && liveAddress ? ("⏳ " + liveAddress) : (profile?.location?.estate || profile?.estate || "Location not set"))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
           

            {/* Notifications */}
            <button
              onClick={() => navigate("/notifications")}
              className="relative w-11 h-11 shrink-0 rounded-full bg-white dark:bg-slate-700/50 backdrop-blur-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95 group"
            >
              <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:animate-swing" />
              {Number(unreadCount) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800 shadow-md animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>

             {/* Support Icon */}
            <button
              onClick={() => navigate("/settings/support")}
              className="relative w-11 h-11 shrink-0 rounded-full bg-white dark:bg-slate-700/50 backdrop-blur-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95 group"
            >
              <Headset className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-xl mx-auto px-2.5 pt-[calc(env(safe-area-inset-top,1.5rem)+5.5rem)] pb-5 space-y-6">

        {/* ── ECO-REWARDS HERO CARD ── */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="relative group overflow-hidden rounded-[24px] bg-white/10 border border-emerald-600 p-5">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 to-emerald-800 pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[10px] font-semibold text-white/80 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Wallet className="w-4 h-4" /> Wallet Balance
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-white/90">Ksh</span>
                  <h2 className="text-2xl font-bold text-white tracking-tighter leading-none drop-shadow-md">
                    {Number(walletBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
              </div>
              <button onClick={handleWithdraw} className="bg-lime-400 text-emerald-900 mt-1 px-5 py-3 rounded-2xl text-sm font-bold capitalize tracking-widest transition-all active:scale-95 shadow-md hover:shadow-lg hover:bg-lime-300">
                Withdraw
              </button>
            </div>

            <div className="flex items-center gap-1 pt-2 border-t border-white/20">
              <div className="flex-1 bg-black/15 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/10">
                <span className="text-base font-bold text-white">{metrics.totalPickups}</span>
                <span className="text-[9px] font-bold text-white/80 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Truck className="w-3 h-3" /> Pickups</span>
              </div>
              <div className="flex-1 bg-black/15 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/10">
                <span className="text-base font-bold text-white">{metrics.kgRecovered}</span>
                <span className="text-[9px] font-bold text-white/80 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Recycle className="w-3 h-3" /> KG Recycled</span>
              </div>
              <div className="flex-1 bg-black/15 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/20 transition-colors">
                <span className="text-base font-bold text-amber-300 drop-shadow-sm">{rewardPoints}</span>
                <span className="text-[9px] font-bold text-amber-200 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Sparkles className="w-3 h-3 shrink-0" /> Green Points</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── QUICK ACTIONS ── */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <div className="space-y-2">
            <h3 className="text-[12px] font-semibold text-slate-600 dark:text-white capitalize tracking-widest px-1">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'Book', icon: <CalendarPlus className="w-5 h-5" />, route: '/book-pickup', color: 'bg-emerald-50 dark:bg-slate-800 text-slate-900 dark:text-white' },
                { label: 'Wallet', icon: <Wallet className="w-5 h-5" />, route: '/resident-wallet', color: 'bg-amber-50 dark:bg-slate-800 text-slate-900 dark:text-white' },
                { label: 'Bookings', icon: <Package className="w-5 h-5" />, route: '/my-bookings', color: 'bg-indigo-50 dark:bg-slate-800 text-slate-900 dark:text-white' },
                { label: 'Discover', icon: <Search className="w-5 h-5" />, route: '/discovery', color: 'bg-blue-50 dark:bg-slate-800 text-slate-900 dark:text-white' },
              ].map((service) => (
                <button
                  key={service.label}
                  onClick={() => navigate(service.route)}
                  className="bg-slate-50 dark:bg-slate-900 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group"
                >
                  <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center ${service.color} group-hover:scale-110 transition-transform`}>
                    {service.icon}
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">{service.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── KLINFLOW BANNERS ── */}
        <motion.div variants={itemVariants} className="!mt-4"  >
          <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar snap-x snap-mandatory pr-6">
            {/* Banner 1 */}
            <div className="shrink-0 w-[96%] sm:w-[85%] snap-center relative bg-gradient-to-r from-[#e7f5ed] to-[#c6eed5] dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-[16px] overflow-hidden shadow-sm border border-emerald-200/50 dark:border-emerald-700/50 aspect-[21/9]">
              <img src="/vectors/ecoBanner.webp" alt="Promo" className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* Banner 2 (Resident Only) */}
            <div className="shrink-0 w-[96%] sm:w-[85%] snap-center relative rounded-[16px] overflow-hidden shadow-sm border border-slate-200/50 dark:border-slate-700/50 aspect-[21/9] bg-slate-900">
              <img src="/vectors/ecoBanner3.webp" alt="Promo 3" className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            
          </div>
        </motion.div>
        
         {/* ── COMMUNITY TOOLS ── */}
        <motion.div variants={itemVariants} className="!mt-3">
          <div className="flex items-center justify-between px-1.5 mb-2">
            <h3 className="text-[12px] font-semibold text-slate-600 dark:text-white capitalize tracking-widest">Community Tools</h3>
          </div>

          <div className="grid grid-cols-2 gap-2 px-1.5">
            {/* ── SWARMS ── */}
            <button
              onClick={() => navigate("/swarms")}
              className="bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-600 dark:to-emerald-700 rounded-xl h-28 shadow-sm hover:shadow-md transition-all border border-emerald-500 dark:border-emerald-800 relative overflow-hidden group p-3 flex flex-col justify-end"
            >
              <div className="absolute top-3 right-2 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Join
              </div>
              <div className="flex flex-col items-start gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="text-[13px] font-bold text-white leading-tight">Join a Swarm</h4>
                  <p className="text-[10px] font-medium text-white/80 mt-0.5">Pool pickups & earn together</p>
                </div>
              </div>
            </button>

            {/* ── MARKET PRICES ── */}
            <button
              onClick={() => navigate("/market-pulse")}
              className="bg-gradient-to-br from-amber-600 to-amber-700  dark:from-amber-700 dark:to-amber-800 rounded-xl h-28 shadow-sm hover:shadow-md transition-all border border-amber-600 dark:border-amber-600 relative overflow-hidden group p-3 flex flex-col justify-end"
            >
              <div className="absolute top-3 right-2 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Live
              </div>
              <div className="flex flex-col items-start gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm shrink-0">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="text-[13px] font-bold text-white leading-tight">Market Prices</h4>
                  <p className="text-[10px] font-medium text-white/80 mt-0.5">Live recyclable rates</p>
                </div>
              </div>
              
            </button>
          </div>
        </motion.div>

        {/* ── CATALOG: E-COMMERCE SCROLL ── */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }} className="space-y-2 !mt-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[12px] font-semibold text-slate-600 dark:text-white capitalize tracking-widest">What Collectors Buy!</h3>
            {/* <button onClick={() => navigate("/discovery")} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 capitalize tracking-widest hover:underline flex items-center">
              view details <ChevronDownCircle className="w-3 h-3 ml-0.5" />
            </button> */}
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
                  className={`snap-start relative shrink-0 w-[120px] h-[120px] ${!bgImage ? `bg-gradient-to-br ${isDB ? palette.color : item.color}` : 'bg-slate-900'} border ${isDB ? palette.border : item.border} rounded-2xl p-3 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm flex flex-col overflow-hidden`}
                  style={bgImage ? {
                    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.3)), url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {}}
                >
                  <div className="flex-1" />
                  <h4 className={`text-[13px] font-bold mb-1 leading-none relative z-10 ${bgImage ? 'text-white' : (isDB ? palette.text : item.text)}`}>{item.label || item.name}</h4>
                  <div className={`rounded-lg px-2 py-1.5 relative z-10 ${bgImage ? 'bg-black/40 backdrop-blur-md border border-white/10' : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm'}`}>
                    <p className={`text-[10px] font-semibold text-center leading-none ${bgImage ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{displayPrice}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        

       

      </div>

      {/* ── FLOATING AI ASSISTANT ── */}
      {/* <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/hygenex")}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center z-50 shadow-lg shadow-emerald-500/30 border-2 border-white dark:border-slate-800 group"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500  opacity-20" />
        <BrainCircuit className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
      </motion.button> */}
      
    </div>
  );
}
