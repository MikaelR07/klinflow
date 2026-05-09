/**
 * Seller Home — Revenue dashboard, quick actions, trust score, leaderboard
 */
import { useEffect, useState } from 'react';
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
  Scale
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore, useAuthStore, useIotStore, useNotificationStore, useMarketplaceStore, supabase } from '@cleanflow/core';
import { SkeletonCard } from '@cleanflow/ui';
import { PushNotificationModal } from '@cleanflow/ui';
import { toast } from 'sonner';

// ── SMART NAMING GUARD (REGEX + DICTIONARY) ───────────────────────
const formatMaterial = (text) => {
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
  return materialMap[text.toLowerCase()] || text.charAt(0).toUpperCase() + text.slice(1);
};

export default function SellerHome() {
  const { 
    profile, 
    withdrawRewards, 
    role, 
    subscribeToProfileChanges
  } = useAuthStore();
  
  const { 
    bookings, 
    fetchBookings, 
    subscribeToBookings,
    cleanupBookings,
    setActiveVerificationBooking
  } = useBookingStore();

  const { 
    receivedOrders, 
    fetchReceivedOrders, 
    getCalculatedScore,
    receivedOffers,
    fetchIncomingOffers,
    myListings,
    fetchMyActivity
  } = useMarketplaceStore();
  
  const { subscribeToRealtime, cleanup: cleanupNotifications, getUnreadCount, fetchNotifications, subscribeToPush } = useNotificationStore();
  const { initDevices } = useIotStore();
  const navigate = useNavigate();

  const unreadCount = getUnreadCount();

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchReceivedOrders();
    fetchIncomingOffers();
    fetchMyActivity();
    initDevices();
    
    if (profile?.id) {
      fetchNotifications(profile.id, role);
      subscribeToProfileChanges(profile.id);
      subscribeToBookings(profile.id);
      subscribeToRealtime(profile.id, role);
    }

    return () => {
      cleanupBookings();
      cleanupNotifications();
    };
  }, [profile?.id, role]);

  const score = getCalculatedScore(receivedOrders, profile);

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
      toast.success("Native Alerts Enabled! 🔔", {
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
      toast.success("History cleared! 🧹");
    } catch (err) {
      toast.error("Failed to clear history");
    }
  };

  // ── MERCHANT METRICS (Marketplace Centric) ──
  const marketplaceBookings = bookings.filter(b => b.is_market_trade || b.isMarketTrade);
  
  const totalDeals = marketplaceBookings.filter(b => b.status === 'completed').length;
  
  const totalSoldKg = marketplaceBookings
    .filter(b => b.status === 'completed')
    .reduce((acc, b) => acc + (parseFloat(b.actual_weight_kg) || 0), 0);

  // Escrow includes accepted offers AND active bookings
  const acceptedOffersValue = receivedOrders
    .filter(o => o.status === 'accepted')
    .reduce((acc, o) => acc + (parseFloat(o.totalPrice || o.total_price) || 0), 0);

  const activeBookingsValue = marketplaceBookings
    .filter(b => b.status !== 'completed' && b.status !== 'cancelled')
    .reduce((acc, b) => acc + (parseFloat(b.total_price || b.totalPrice) || 0), 0);

  const inEscrowAmount = activeBookingsValue || acceptedOffersValue;

  const recentBookings = [...bookings]
    .filter(b => {
      if (b.status === 'completed' && profile?.completedClearedAt) {
        return new Date(b.created_at || b.createdAt) > new Date(profile.completedClearedAt);
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* ── PUSH ENROLLMENT MODAL ── */}
      <PushNotificationModal 
        isOpen={showPushPrompt}
        onClose={handleDismissPush}
      />
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings/profile')} className="shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xl shadow-md border-2 border-white dark:border-slate-800 active:scale-90 transition-all overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" />
              ) : (
                profile?.avatar || '👤'
              )}
            </div>
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white leading-none">Hello, {profile?.name?.split(' ')[0]}! 👋</h1>
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-primary font-semibold uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10 w-fit">
              <MapPin className="w-3 h-3" /> {profile?.location?.estate || 'Nairobi'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => navigate('/settings/notifications')}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center relative active:scale-90 transition-all shadow-sm group shrink-0"
          >
            <Bell className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </div>


      {/* ── REVENUE HERO CARD ── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl opacity-50 dark:opacity-50 opacity-20 group-hover:opacity-70 transition duration-500" />
        <div className="relative bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl p-6 shadow-none dark:shadow-2xl border border-slate-100 dark:border-white/5">
          <div className="relative z-10 space-y-5">
            <div className="flex items-center justify-between gap-2">
              {/* Left Side: Balance and Actions */}
              <div className="space-y-4 w-[45%] shrink-0">
                <div className="flex items-center gap-1.5 w-fit">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-widest underline underline-offset-4 decoration-emerald-500/40 dark:decoration-emerald-400/40">Wallet</span>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                    KSh {(profile?.balance || profile?.walletBalance || 0).toLocaleString()}
                  </h2>
                  <button 
                    onClick={() => navigate('/withdraw')}
                    className="w-fit px-5 py-2 sm:px-6 sm:py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-100" /> Withdraw
                  </button>
                </div>
              </div>

              {/* Vertical Line */}
              <div className="w-[1px] h-32 bg-slate-100 dark:bg-white/10 shrink-0 mx-2 sm:mx-4" />

              {/* Right Side: Credit Meter */}
              <div 
                onClick={() => navigate('/trust-score')}
                className="flex-1 w-full max-w-[240px] sm:max-w-[320px] lg:max-w-[360px] flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group"
              >
                 <div className="relative w-full aspect-[2/1.1]">
                   <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 55">
                     {/* 5 Segments */}
                     <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="0" />
                     <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#f97316" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="-21.5" />
                     <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#eab308" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="-43" />
                     <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="-64.5" />
                     <path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100" fill="transparent" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 100" strokeDashoffset="-86" />
                     
                     {/* Inner dashed line */}
                     <path d="M 18 50 A 32 32 0 0 1 82 50" stroke="currentColor" className="text-slate-900 dark:text-white" strokeOpacity="0.1" strokeWidth="0.5" fill="none" strokeDasharray="2 4" />
                     
                     {/* Needle */}
                     <g transform={`rotate(${((Math.min(Math.max((score), 300), 850) - 300) / 550) * 180 - 90}, 50, 50)`} className="transition-transform duration-1000 ease-out">
                       <line x1="50" y1="50" x2="50" y2="25" stroke="currentColor" className="text-slate-900 dark:text-white drop-shadow-md" strokeWidth="2.5" strokeLinecap="round" />
                     </g>
                     <circle cx="50" cy="50" r="3.5" fill="currentColor" className="text-slate-900 dark:text-white" />
                   </svg>
                 </div>
                 
                 {/* Labels */}
                 <div className="flex items-center justify-between w-full px-1 mt-1.5">
                   <span className="text-[10px] font-semibold text-slate-400 dark:text-white/50">300</span>
                   <span className="text-[10px] font-semibold text-slate-400 dark:text-white/50">850</span>
                 </div>
                 <p className="text-[9px] font-semibold text-slate-400 dark:text-white/40 uppercase tracking-widest mt-1">Credit Rate</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Handshake className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white leading-none">{totalDeals}</p>
                <p className="text-[8px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest mt-1">Deals</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Scale className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white leading-none">{totalSoldKg}kg</p>
                <p className="text-[8px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest mt-1">Sold KG</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white leading-none">KSh {inEscrowAmount.toLocaleString()}</p>
                <p className="text-[8px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest mt-1">In Escrow</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HUSTLE ACTION CENTER (TRIO CONTROLS) ── */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => navigate('/post-trade')}
          className="bg-emerald-600 rounded-2xl p-3 flex flex-col items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all group relative"
        >
          <div className="absolute top-0 right-0 w-10 h-10 bg-white/10 rounded-bl-2xl rounded-tr-2xl" />
          <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-[9px] font-semibold text-white uppercase tracking-widest leading-none">Sell Now</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/inventory')}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-[0.98] transition-all group"
        >
          <div className="relative">
            {myListings.filter(l => l.status === 'active').length > 0 && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center animate-bounce z-10 shadow-sm">
                <span className="text-[8px] font-semibold text-white">{myListings.filter(l => l.status === 'active').length}</span>
              </div>
            )}
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-emerald-500 rounded-xl flex items-center justify-center shadow-inner transition-colors">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-semibold text-slate-900 dark:text-white uppercase tracking-widest leading-none">My Listings</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/my-offers')}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-[0.98] transition-all group"
        >
          <div className="relative">
            {receivedOffers.filter(o => o.status === 'pending').length > 0 && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center animate-bounce z-10 shadow-sm">
                <span className="text-[8px] font-semibold text-white">{receivedOffers.filter(o => o.status === 'pending').length}</span>
              </div>
            )}
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-emerald-500 rounded-xl flex items-center justify-center shadow-inner transition-colors">
              <Handshake className="w-5 h-5" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-semibold text-slate-900 dark:text-white uppercase tracking-widest leading-none">Offers</p>
          </div>
        </button>
      </div>

      {/* ── FINANCIAL TRUST SCORE ── */}
      <div 
        onClick={() => navigate('/trust-score')}
        className="bg-gradient-to-r from-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-3 group transition-all active:scale-[0.98] cursor-pointer relative"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[4rem] rounded-tr-2xl" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-widest leading-none">Trust Score</p>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Top 5% Standing</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Check Rate</span>
            <ChevronRight className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
          </div>
        </div>

        <div className="relative z-10 pt-2.5 border-t border-emerald-500/10 mt-1">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
            Tracks market reliability. High scores unlock instant payouts and loans.
          </p>
        </div>
      </div>

      {/* ── REFER & EARN (GROWTH ENGINE) ── */}
      <div className="bg-gradient-to-br from-indigo-600 to-primary rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
        <div className="relative z-10 flex items-center gap-5">
           <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
              <Users className="w-9 h-9 text-white" />
           </div>
           <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-1">Refer a Merchant</h3>
              <p className="text-xs font-medium text-indigo-100 leading-tight mb-3">Earn 5% from your friend's first 3 trades. Grow the hustle together!</p>
              <button className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-[9px] font-semibold uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                Share Referral Link
              </button>
           </div>
        </div>
      </div>

      {/* ── SELLER LEADERBOARD LINK ── */}
      <button 
        onClick={() => navigate('/leaderboard')}
        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center shrink-0 text-amber-500 group-hover:scale-110 transition-transform">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">Seller Leaderboard</h3>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">See how you rank this week</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
      </button>



      {/* ── RECENT ACTIVITY (BASE RECORD) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-xs uppercase tracking-widest text-slate-400 px-1">Recent Activity</h3>
          <div className="flex items-center gap-3">
            {recentBookings.length > 0 && (
              <button 
                onClick={handleClearHistory}
                className="text-[10px] font-semibold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
              >
                Clear
              </button>
            )}
            <History className="w-4 h-4 text-slate-300" />
          </div>
        </div>
        
        <div className="space-y-6">
          {recentBookings.map((item, i) => (
            <div key={i} className="flex items-center justify-between group px-1">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center text-lg">
                  {item.wasteType === 'general' ? '🗑️' : item.wasteType === 'recyclable' ? '♻️' : '🥬'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">{formatMaterial(item.wasteType || item.waste_type)} Trade</p>
                  <p className="text-[10px] font-semibold text-slate-400">
                    {item.created_at ? new Date(item.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-[10px] font-semibold uppercase tracking-widest ${
                  item.status === 'completed' ? 'text-emerald-600' : 
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
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">No Activity Yet</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
