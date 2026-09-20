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
  Headset
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBookingStore } from "@klinflow/core/stores/bookingStore";
import { useAuthStore } from "@klinflow/core/stores/authStore";
import { useNotificationStore } from "@klinflow/core/stores/notificationStore";
import { useServiceStore } from "@klinflow/core/stores/serviceStore";
import { supabase } from "@klinflow/supabase";
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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchCategories();
    if (profile?.id) {
      fetchProfile();
      fetchNotifications(profile.id, role);
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
        .select("id", { count: "exact", head: true })
        .eq("role", "user")
        .gt("reward_points", userPoints);
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
      <PushNotificationModal isOpen={showPushPrompt} onClose={() => setShowPushPrompt(false)} />

      {/* ── TOP SECTION: PREMIUM GRADIENT ── */}
      <div className="bg-gradient-to-br from-primary via-primary/80 to-emerald-500 pt-[calc(env(safe-area-inset-top,1.5rem)+4rem)] pb-4 rounded-b-[2.5rem] shadow-lg shadow-emerald-900/20 relative z-20 overflow-hidden">
        
        {/* Decorative background orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.08] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        {/* ── TOP NAV (FIXED) ── */}
        <div className={`fixed top-0 left-0 right-0 z-50 pt-[calc(env(safe-area-inset-top,1.5rem)+1rem)] pb-2.5 transition-all duration-300 ${isScrolled ? 'bg-gradient-to-br from-primary to-emerald-600 backdrop-blur-md shadow-md border-b border-white/10' : 'bg-transparent '}`}>
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
                <h1 className="text-[17px] font-black text-white tracking-wide leading-none drop-shadow-sm">
                  Hello, {(profile?.fullName || profile?.name || "Resident").split(" ")[0]}!👋
                </h1>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-white/90 font-semibold capitalize tracking-wider bg-black/10 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/20 w-fit">
                  <MapPin className="w-3 h-3" />
                  {profile?.location?.estate || profile?.estate || "Location not set"}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
             

              {/* Notifications */}
              <button
                onClick={() => navigate("/notifications")}
                className="relative w-11 h-11 shrink-0 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-sm hover:bg-black/20 transition-all active:scale-95 group"
              >
                <Bell className="w-5 h-5 text-white group-hover:animate-swing" />
                {Number(unreadCount) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-emerald-600 shadow-md animate-in zoom-in">
                    {unreadCount}
                  </span>
                )}
              </button>

               {/* Support Icon */}
              <button
                onClick={() => navigate("/settings/support")}
                className="relative w-11 h-11 shrink-0 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-sm hover:bg-black/20 transition-all active:scale-95 group"
              >
                <Headset className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* ── ECO-REWARDS HERO CARD ── */}
        <div className="relative z-10 px-4 max-w-xl mx-auto mt-6">
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="relative group overflow-hidden rounded-[24px] bg-white/10  border border-emerald-600  p-5">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-600 to-emerald-600 pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Wallet className="w-4 h-4" /> Wallet Balance
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-white/90">Ksh</span>
                    <h2 className="text-2xl font-black text-white tracking-tighter leading-none drop-shadow-md">
                      {Number(walletBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                  </div>
                </div>
                <button onClick={handleWithdraw} className="bg-white text-emerald-700 mt-1 px-5 py-3 rounded-2xl text-sm font-black capitalize tracking-widest transition-all active:scale-95 shadow-md hover:shadow-lg hover:bg-emerald-50">
                  Withdraw
                </button>
              </div>

              <div className="flex items-center gap-1 pt-3 border-t border-white/20">
                <div className="flex-1 bg-black/15 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/10">
                  <span className="text-base font-black text-white">{metrics.totalPickups}</span>
                  <span className="text-[9px] font-bold text-white/80 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Truck className="w-3 h-3" /> Pickups</span>
                </div>
                <div className="flex-1 bg-black/15 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/10">
                  <span className="text-base font-black text-white">{metrics.kgRecovered}</span>
                  <span className="text-[9px] font-bold text-white/80 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Recycle className="w-3 h-3" /> KG Recycled</span>
                </div>
                <div className="flex-1 bg-black/15 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/20 transition-colors">
                  <span className="text-base font-black text-amber-300 drop-shadow-sm">{rewardPoints}</span>
                  <span className="text-[9px] font-bold text-amber-200 capitalize tracking-widest mt-0.5 flex items-center gap-1 whitespace-nowrap"><Sparkles className="w-3 h-3 shrink-0" /> Green Points</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-2.5 space-y-5 pt-3 pb-5">

        {/* ── ACTION HUB (QUICK LINKS + CTA) ── */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="bg-slate-200 dark:bg-slate-800/40 rounded-[12px] p-1.5  shadow-sm border border-slate-200/50 dark:border-slate-800/60 space-y-2">
          {/* ── APP SERVICES GRID ── */}
          <div className="space-y-2">
            <h3 className="text-[13px] font-black text-slate-600 dark:text-white capitalize tracking-widest px-1">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-1 !mt-1">
              {[
                { label: 'Wallet', icon: <Wallet className="w-5 h-5" />, route: '/resident-wallet', color: 'bg-amber-50 dark:bg-slate-800 text-slate-900 dark:text-white' },
                { label: 'Bookings', icon: <RecycleIcon className="w-5 h-5" />, route: '/my-bookings', color: 'bg-indigo-50 dark:bg-slate-800 text-slate-900 dark:text-white' },
                { label: 'Dashboard', icon: <BarChart className="w-5 h-5" />, route: '/Analytics', color: 'bg-emerald-50 dark:bg-slate-800 text-slate-900 dark:text-white' },
                { label: 'Discover', icon: <Search className="w-5 h-5" />, route: '/discovery', color: 'bg-blue-50 dark:bg-slate-800 text-slate-900 dark:text-white' },
              ].map((service) => (
                <button 
                  key={service.label} 
                  onClick={() => navigate(service.route)}
                  className="bg-white dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${service.color} group-hover:scale-110 transition-transform`}>
                    {service.icon}
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">{service.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── PRIMARY CTAS ── */}
          <div className="grid grid-cols-1 gap-1">
            <button 
              onClick={() => navigate("/book-pickup")}
              className="w-full bg-gradient-to-br from-indigo-400 to-purple-400 text-white dark:bg-white dark:text-slate-900 rounded-[20px] shadow-sm shadow-slate-900/5 active:scale-[0.98] transition-all group p-3 flex items-center justify-between border border-white/10 dark:border-slate-900/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 dark:bg-slate-900/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Truck className="w-6 h-6 text-white dark:text-slate-900" />
                </div>
                <div className="text-left min-w-0">
                  <h3 className="text-[14px] font-bold tracking-tight leading-none mb-1">Book Pickup</h3>
                  <p className="text-[11px] font-semibold text-white/80 dark:text-slate-100 leading-tight">Turn Recyclables to cash</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-slate-900/10 flex items-center justify-center group-hover:bg-white/30 dark:group-hover:bg-slate-900/20 transition-colors">
                <ChevronRight className="w-4 h-4 text-white dark:text-slate-900 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </motion.div>
        

        {/* ── CATALOG: E-COMMERCE SCROLL ── */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[13px] font-black text-slate-600 dark:text-white capitalize tracking-wide">What Collectors Buy!</h3>
            {/* <button onClick={() => navigate("/discovery")} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 capitalize tracking-widest hover:underline flex items-center">
              view details <ChevronDownCircle className="w-3 h-3 ml-0.5" />
            </button> */}
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory -mx-1.5 px-1.5 pr-6 sm:mx-0 sm:px-0">
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
                    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.2)), url(${bgImage})`,
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

        {/* ── COMMUNITY TOOLS ── */}
        <motion.div variants={itemVariants} className="bg-slate-200 dark:bg-slate-800/40 rounded-[12px] p-1.5 !mt-1 shadow-sm border border-slate-200/50 dark:border-slate-800/60 space-y-2">
          <div className="space-y-2">
            <h3 className="text-[13px] font-black text-slate-600 dark:text-white capitalize tracking-widest px-1">Community Tools</h3>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {/* ── SWARMS ── */}
            <button 
              onClick={() => navigate("/swarms")}
              className="w-full h-full bg-gradient-to-br from-primary to-emerald-600 border border-emerald-400/30 rounded-[20px] p-3.5 flex flex-col items-start justify-between gap-3 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all shadow-sm group relative overflow-hidden"
            >
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm shrink-0 relative z-10">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-left relative z-10 mt-auto">
                <h4 className="text-[13px] font-black text-white leading-tight mb-0.5">Join a Swarm</h4>
                <p className="text-[10px] font-semibold text-emerald-100/90 leading-tight">Pool pickups & earn together</p>
              </div>
            </button>

            {/* ── MARKET PRICES ── */}
            <button 
              onClick={() => navigate("/market-pulse")}
              className="w-full h-full bg-gradient-to-br from-amber-600 to-amber-700 border border-amber-500/30 rounded-[20px] p-3.5 flex flex-col items-start justify-between gap-3 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all shadow-sm group relative overflow-hidden"
            >
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm shrink-0 relative z-10">
                <BarChart3Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-left relative z-10 mt-auto">
                <h4 className="text-[13px] font-black text-white leading-tight mb-0.5">Market Prices</h4>
                <p className="text-[10px] font-semibold text-amber-100/90 leading-tight">Live recyclable rates & trends</p>
              </div>
            </button>
          </div>
        </motion.div>

      </div>

      {/* ── FLOATING AI ASSISTANT ── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/hygenex")}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center z-50 shadow-lg shadow-emerald-500/30 border-2 border-white dark:border-slate-800 group"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500  opacity-20" />
        <BrainCircuit className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
      </motion.button>
      
    </div>
  );
}
