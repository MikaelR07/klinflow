/**
 * Agent Home — Command Center for Klinflow Founder Agents
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpLeft,
  Power,
  TrendingUp,
  Target,
  Star,
  ChevronRight,
  Sparkles,
  Bell,
  MapPin,
  Loader2,
  Zap,
  Wallet,
  Truck,
  ArrowRight,
  ShieldCheck,
  History,
  Navigation,
  Briefcase,
  Warehouse,
  X,
  Package,
  PackageCheck,
  Brain,
  Handshake,
  Receipt,
  FileText,
  PlusSquare,
  Store,
  BarChart2,
  Clock,
  ShoppingBag,
  Wifi
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { useAssetStore } from '@klinflow/core/stores/assetStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import PushNotificationModal from '@klinflow/ui/components/PushNotificationModal';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';



export default function AgentHome() {
  const profile = useAuthStore(s => s.profile);
  const toggleOnline = useAuthStore(s => s.toggleOnline);
  const subscribeToProfileChanges = useAuthStore(s => s.subscribeToProfileChanges);
  const fetchProfile = useAuthStore(s => s.fetchProfile);

  const earnings = useAgentStore(s => s.earnings);
  const coachInsights = useAgentStore(s => s.coachInsights);
  const currentInsightIndex = useAgentStore(s => s.currentInsightIndex);
  const nextInsight = useAgentStore(s => s.nextInsight);
  const availableJobs = useAgentStore(s => s.availableJobs);
  const fetchAvailableJobs = useAgentStore(s => s.fetchAvailableJobs);
  const fetchEarnings = useAgentStore(s => s.fetchEarnings);
  const fetchDynamicInsights = useAgentStore(s => s.fetchDynamicInsights);
  const broadcastLocation = useAgentStore(s => s.broadcastLocation);
  const jobHistory = useAgentStore(s => s.jobHistory);
  const subscribeToJobs = useAgentStore(s => s.subscribeToJobs);
  const cleanupJobs = useAgentStore(s => s.cleanupJobs);
  const clearJobHistory = useAgentStore(s => s.clearJobHistory);

  const fetchAssets = useAssetStore(s => s.fetchAssets);
  const getUnreadCount = useNotificationStore(s => s.getUnreadCount);
  const subscribeToPush = useNotificationStore(s => s.subscribeToPush);
  const [isToggling, setIsToggling] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [acceptedTradesCount, setAcceptedTradesCount] = useState(0);
  const navigate = useNavigate();

  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';


  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [performanceChange, setPerformanceChange] = useState<number>(0);
  const [activePickup, setActivePickup] = useState<any>(null);

  useEffect(() => {
    const fetchDynamicData = async () => {
      fetchProfile();
      fetchEarnings();

      if (!profile?.id) return;

      // Fetch Performance Change (Yesterday vs Today)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);

      const { data: perfData } = await supabase
        .from('fulfillment_orders')
        .select('created_at')
        .eq('status', 'completed')
        .or(`assigned_agent_id.eq.${profile.id},buyer_id.eq.${profile.id}`);

      if (perfData) {
        const todayCount = perfData.filter(d => new Date(d.created_at) >= startOfToday).length;
        const yesterdayCount = perfData.filter(d => {
          const dTime = new Date(d.created_at);
          return dTime >= startOfYesterday && dTime < startOfToday;
        }).length;

        if (yesterdayCount === 0) setPerformanceChange(todayCount > 0 ? 100 : 0);
        else setPerformanceChange(((todayCount - yesterdayCount) / yesterdayCount) * 100);
      }

      // Fetch Active Pickup Quote
      const { data: pickupData } = await supabase
        .from('fulfillment_orders')
        .select(`
          id, status, pickup_address, created_at,
          rfq:rfqs(category)
        `)
        .eq('assigned_agent_id', profile.id)
        .not('status', 'in', '(completed,cancelled)')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pickupData) setActivePickup(pickupData);
      else setActivePickup(null);

      setLastSynced(new Date());
    };

    fetchDynamicData();
  }, [profile?.id, profile?.agentAccountType, profile?.companyId]);




  const unreadCount = getUnreadCount();
  const currentInsight = coachInsights[currentInsightIndex];

  const [showPushPrompt, setShowPushPrompt] = useState(false);

  useEffect(() => {
    // Show prompt if user hasn't allowed/denied notifications yet
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      setShowPushPrompt(true);
    }
  }, []);

  const handleEnablePush = async () => {
    const success = await subscribeToPush();
    if (success) {
      setShowPushPrompt(false);
      toast.success("Mission Alerts Enabled! 🔔", {
        description: "You will now receive instant missions on your phone."
      });
    }
  };

  useEffect(() => {
    // ── STAGGERED FETCHING (SPEED OPTIMIZATION) ──
    fetchEarnings();
    fetchProfile();

    const jobsTimer = setTimeout(() => fetchAvailableJobs(), 100);
    const assetsTimer = setTimeout(() => fetchAssets(), 300);
    const aiTimer = setTimeout(() => fetchDynamicInsights(), 600);

    // Fetch active marketplace trades count
    if (profile?.id) {
      supabase
        .from('bookings')
        .select('id')
        .eq('agent_id', profile.id)
        .or('is_market_trade.eq.true,booking_type.eq.marketplace_pickup')
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .then(({ data }) => setAcceptedTradesCount(data?.length || 0));
    }

    if (profile?.id) {
      subscribeToProfileChanges(profile.id);
    }

    return () => {
      clearTimeout(jobsTimer);
      clearTimeout(assetsTimer);
      clearTimeout(aiTimer);
    };
  }, []);

  useEffect(() => {
    const isMobileAgent = profile?.agentAccountType === 'fleet_driver' ||
      profile?.agentAccountType === 'independent' ||
      profile?.agentAccountType === 'company_admin' ||
      profile?.agentAccountType === 'owner';

    if (!profile.isOnline || !isMobileAgent) return;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(pos => {
        if (pos.coords.accuracy > 100) return;
        broadcastLocation(pos.coords.latitude, pos.coords.longitude, 'active');
      }, (err) => {
        if (err.code === 3) {
          console.warn('[GPS] Signal weak (timeout). Holding last known position...');
        } else {
          console.error('GPS Watch Error:', err);
        }
      }, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000
      });
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [profile.isOnline, broadcastLocation]);

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);

    try {
      const isGoingOnline = !profile.isOnline;
      let coords = null;

      if (isGoingOnline) {
        const getCoords = () => new Promise((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });

        try {
          coords = await toast.promise(getCoords(), {
            loading: '📡 Acquiring GPS signal...',
            success: 'Location synced! You are now live.',
            error: 'GPS error. Using last known location.',
          });
        } catch (err) {
          coords = null;
        }
      }

      await toggleOnline(coords);

      if (isGoingOnline) {
        fetchAvailableJobs();
        toast.success('You are now Online! 👋', { description: 'Ready to receive missions.' });
      } else {
        toast.info('You are now Offline');
      }
    } catch (err) {
      toast.error('Toggle failed', { description: err.message });
    } finally {
      setIsToggling(false);
    }
  };



  // Derived metrics matching screenshot requirements
  const pendingPickupsCount = jobHistory?.filter(j => j.status === 'in_progress' || j.status === 'confirmed').length || 3;
  const activeRFQsCount = acceptedTradesCount || 2;
  const estimatedRevenue = earnings?.today || 1240;
  const bidSuccessRate = 92;

  return (
    <div className="space-y-6 px-1 pb-24">

      <PushNotificationModal
        isOpen={showPushPrompt}
        onClose={() => setShowPushPrompt(false)}
      />
      {/* ── TOP NAV & CORE CONTROLS ── */}
      <div className="space-y-3 pt-[calc(env(safe-area-inset-top,1rem)+3.5rem)]">
        {/* Header Section - Edge to Edge - FIXED TOPNAV */}
        <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-900 ">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-4">
              {/* Profile Avatar */}
              <div className="shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-2xl shadow-lg border-2 border-white dark:border-slate-700 transition-all overflow-hidden">
                  {profile?.avatarUrl ? (
                    <OptimizedImage src={getThumbnailUrl(profile.avatarUrl, { width: 300 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                  ) : (
                    profile?.avatar || '👤'
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-lg font-normal  tracking-tight text-slate-900 dark:text-white leading-tight">Hello {profile?.name?.split(' ')[0]}👋</h1>
                <div className="flex items-center gap-1.5  text-[10px] text-primary font-bold capitalize tracking-wider bg-primary/10 px-0.5 py-0.5 rounded-full border border-primary/20 w-fit">
                  <MapPin className="w-3 h-3" /> {profile?.location?.estate || profile?.estate || 'searching...'}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/notifications')}
              className="relative w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 group"
            >
              <Bell className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800 shadow-md animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 rounded-[1rem] p-1 border border-slate-200/60 dark:border-slate-700 space-y-4">
          {/* ── CORE CONTROLS GROUP ── */}
          <div className="space-y-3">
            {/* ── AGENT ONLINE STATUS TOGGLE (Unified Logic) ── */}
            {(!(profile?.agentAccountType === 'company_admin' || profile?.companyName || profile?.fleetInviteCode)) ? (
              <div className="w-full bg-white p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-none">
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-3xl flex items-center justify-center transition-colors ${profile?.isOnline
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'bg-slate-200/50 dark:bg-slate-900 text-slate-400'
                    }`}>
                    {isToggling ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Power className="w-5 h-5" />
                    )}
                  </div>

                  <div className="text-left">
                    <p className="text-[11px] font-semibold capitalize tracking-wide leading-none mb-1.5 text-slate-600">
                      System Status
                    </p>

                    <p
                      className={`text-sm font-bold ${profile?.isOnline
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-white'
                        }`}
                    >
                      {profile?.isOnline ? 'Online' : 'Offline'}
                    </p>

                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Last sync: {formatDistanceToNow(lastSynced, { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggle}
                  disabled={isToggling}
                  className={`relative w-16 h-9 rounded-full transition-all duration-300 ${profile?.isOnline
                    ? 'bg-emerald-500 '
                    : 'bg-slate-300 dark:bg-slate-900'
                    }`}
                >
                  <div
                    className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-all duration-300 shadow-sm ${profile?.isOnline ? 'left-[32px]' : 'left-[4px]'
                      }`}
                  />
                </button>
              </div>
            ) : (
              <div className="w-full p-1 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-150 dark:border-slate-800/30 flex items-center justify-between shadow-none text-slate-900 dark:text-white">
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${profile?.isOnline ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-200/50 dark:bg-slate-800 text-slate-400'
                    }`}>
                    {isToggling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black capitalize tracking-[0.2em] leading-none mb-1.5 text-primary">Company Control</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{profile?.isOnline ? 'Radar Active' : 'System Offline'}</p>
                  </div>
                </div>
                <button
                  onClick={handleToggle}
                  disabled={isToggling}
                  className={`relative w-16 h-9 rounded-full transition-all duration-300 ${profile?.isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                >
                  <div className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-all duration-300 shadow-sm ${profile?.isOnline ? 'left-[32px]' : 'left-[4px]'
                    }`} />
                </button>
              </div>
            )}
          </div>

          {/* ── QUICK ACTIONS ── */}
          <div className="px-2 pb-2">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mb-2 px-1 mt-2">
              Quick Actions
            </p>

            <div className="grid grid-cols-4 gap-1.5">

              <button
                onClick={() => navigate('/jobs')}
                className="min-w-0 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1 active:scale-[0.98] transition-all shadow-none group"
              >
                <div className="w-10 h-10 shrink-0 bg-blue-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>

                <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1 text-center break-words">
                  View Jobs
                </p>
              </button>

              <button
                onClick={() => navigate('/trades')}
                className="min-w-0 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1 active:scale-[0.98] transition-all shadow-none group"
              >
                <div className="w-10 h-10 shrink-0 bg-emerald-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Handshake className="w-5 h-5" />
                </div>

                <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1 text-center break-words">
                  Accepted Bids
                </p>
              </button>

              <button
                onClick={() => navigate('/rfqs')}
                className="min-w-0 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1 active:scale-[0.98] transition-all shadow-none group"
              >
                <div className="w-10 h-10 shrink-0 bg-indigo-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>

                <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1 text-center break-words">
                  Incoming Quotes
                </p>
              </button>

              <button
                onClick={() => navigate('/rfq/create')}
                className="min-w-0 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1 active:scale-[0.98] transition-all shadow-none group"
              >
                <div className="w-10 h-10 shrink-0 bg-amber-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlusSquare className="w-5 h-5" />
                </div>

                <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1 text-center break-words">
                  Create RFQ
                </p>
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* ── PERFORMANCE CARD ── */}
      <div className="relative !mt-2.5">
        <div className="relative bg-gradient-to-br from-primary to-[#064e3b] dark:from-emerald-900 dark:to-primary rounded-2xl p-3 shadow-none">

          {/* TOP SECTION */}
          <div className="flex items-start justify-between gap-3 mb-4">

            {/* LEFT */}
            <div className="flex-1 min-w-0 pl-1">
              <p className="text-[10px] font-bold text-emerald-50 mb-1 tracking-wider uppercase">
                Assets Value
              </p>

              <div className="flex items-baseline gap-1 mb-2 min-w-0">
                <span className="text-lg sm:text-xl font-bold text-emerald-400 shrink-0">
                  KSh
                </span>

                <h2 className="text-lg sm:text-xl font-black text-white truncate">
                  {earnings?.today}
                </h2>
              </div>

              <div className="bg-emerald-500/20 text-emerald-100 text-[9px] font-black px-2 py-1 rounded-md inline-flex max-w-full">
                {performanceChange >= 0 ? `↑ ${performanceChange.toFixed(0)}% from yesterday` : `↓ ${Math.abs(performanceChange).toFixed(0)}% from yesterday`}
              </div>
            </div>

            {/* DIVIDER */}
            <div className="w-px self-stretch bg-white/20" />

            {/* RIGHT */}
            <div className="flex-1 min-w-0 flex flex-col items-end text-right pr-1">
              <p className="text-[10px] font-bold text-emerald-50 mb-1 tracking-wider uppercase">
                Wallet Balance
              </p>

              <div className="flex items-baseline justify-end gap-1 mb-2 min-w-0 w-full">
                <span className="text-lg sm:text-xl font-bold text-emerald-400 shrink-0">
                  KSh
                </span>

                <h2 className="text-lg sm:text-xl font-black text-white truncate">
                  {(profile?.walletBalance || 0).toLocaleString()}
                </h2>
              </div>

              <div className="w-full flex justify-end">
                <button
                  onClick={() => navigate('/deposit')}
                  className="bg-white text-emerald-700 dark:text-slate-900 px-6 py-2 min-h-[44px] rounded-xl font-bold text-xs tracking-wider flex items-center justify-center active:scale-95 transition-all hover:bg-slate-50 whitespace-nowrap"
                >
                  Deposit
                </button>
              </div>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-4 gap-2">

            <div className="bg-emerald-950/40 rounded-xl p-2.5 flex flex-col justify-between min-h-[84px]">
              <Handshake className="w-4 h-4 text-emerald-400 shrink-0" />

              <div>
                <h4 className="text-sm font-black text-white leading-none mb-1 truncate">
                  {acceptedTradesCount || 0}
                </h4>

                <p className="text-[9px] font-bold text-emerald-100/60 leading-tight">
                  Accepted Bids

                </p>
              </div>
            </div>

            <div className="bg-emerald-950/40 rounded-xl p-2.5 flex flex-col justify-between min-h-[84px]">
              <Truck className="w-4 h-4 text-emerald-400 shrink-0" />

              <div>
                <h4 className="text-sm font-black text-white leading-none mb-1 truncate">
                  {earnings?.completedToday || 0}
                </h4>

                <p className="text-[9px] font-bold text-emerald-100/60 leading-tight">
                  Pickups

                </p>
              </div>
            </div>

            <div className="bg-emerald-950/40 rounded-xl p-2.5 flex flex-col justify-between min-h-[84px]">
              <Star className="w-4 h-4 text-amber-400 shrink-0" />

              <div>
                <h4 className="text-sm font-black text-white leading-none mb-1 truncate">
                  {profile?.rating
                    ? Number(profile.rating).toFixed(1)
                    : "4.0"}
                </h4>

                <p className="text-[9px] font-bold text-emerald-100/60 leading-tight">
                  Rating

                </p>
              </div>
            </div>

            <div className="bg-emerald-950/40 rounded-xl p-2.5 flex flex-col justify-between min-h-[84px]">
              <Zap className="w-4 h-4 text-blue-400 shrink-0" />

              <div>
                <h4 className="text-sm font-black text-white leading-none mb-1 truncate">
                  {profile?.rewardPoints || 0}
                </h4>

                <p className="text-[9px] font-bold text-emerald-100/60 leading-tight">
                  Points
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── ACTIVE TASKS ── */}
      <div className="bg-white dark:bg-slate-900/50 !mt-2 rounded-[1rem] p-2 border border-slate-200/60 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3 mt-1 px-1">
          <p className="text-[11px] font-semibold text-emerald-500 dark:text-slate-400 tracking-wide">
            Active Quotes Pickups
          </p>

          <button
            onClick={() => navigate('/pickups')}
            className="flex items-center gap-1 text-amber-500 dark:text-emerald-400 group"
          >
            <span className="text-[10px] font-bold tracking-wide">
              View all
            </span>

            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>
        {activePickup ? (
          <button onClick={() => navigate(`/pickups`)} className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between group active:scale-[0.98] transition-all mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Pickup #{activePickup.id.slice(0, 8).toUpperCase()}</h4>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 capitalize">{activePickup.rfq?.category || 'Collect materials'}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 truncate max-w-[100px]">
                    <MapPin className="w-3 h-3 shrink-0" /> {activePickup.pickup_address || 'TBD'}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 shrink-0">
                    <Clock className="w-3 h-3 shrink-0" /> {new Date(activePickup.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[9px] font-bold capitalize">
                {activePickup.status.replace(/_/g, ' ')}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-500 group-hover:text-emerald-500" />
            </div>
          </button>
        ) : (
          <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-5 flex items-center justify-center mb-1">
            <p className="text-xs text-slate-400 font-medium">No active pickups assigned yet</p>
          </div>
        )}


        <button
          onClick={() => navigate('/routes')}
          className="w-full bg-emerald-700 !mt-3 dark:bg-gradient-to-br from-primary to-[#064e3b] border border-slate-100 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/50 rounded-xl flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5 text-blue-600 dark:text-white" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-white dark:text-blue-100 tracking-wide leading-none mb-1">
                Route Optimizer
              </p>              <p className="text-[10px] font-bold text-amber-300 dark:text-slate-100/80">Logistics Terminal</p>
              <p className="text-[10px] text-slate-50 dark:text-slate-300 font-medium mt-0.5">Live Multi-Stop Tracking</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-500 group-hover:text-blue-500" />
        </button>

        {/* ── MARKET INTELLIGENCE (NEW OS LAYER) ── */}
        <div
          onClick={() => navigate('/market-pulse')}
          className="bg-gradient-to-br from-indigo-600 to-blue-700 mt-2 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden"
        >

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 bg-indigo-600   rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 dark:text-white capitalize tracking-tight leading-none mb-1">Market Intelligence</h3>
              <p className="text-[9px] font-bold text-slate-300 capitalize tracking-widest flex items-center gap-1.5">
                View Material Prices in the Market
              </p>
            </div>
          </div>
          <div className="p-1.5  rounded-lg shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all relative z-10">
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>




      {/* ── MISSION HISTORY ── */}
      <div className="bg-white dark:bg-slate-900/40 rounded-2xl p-6 !mt-3 border border-slate-200/50 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="font-semibold text-xs capitalize tracking-widest text-slate-400">Mission History</h3>
          {jobHistory.length > 0 && (
            <button
              onClick={clearJobHistory}
              className="text-xs font-semibold text-rose-500 capitalize tracking-widest px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors active:scale-95"
            >
              Clear
            </button>
          )}
        </div>

        <div className="space-y-6">
          {jobHistory.slice(0, 4).map((item, i) => {
            const isCompleted = item.status === 'completed';
            const isCancelled = item.status === 'cancelled';
            const pillColor = isCompleted
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              : isCancelled
                ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
            const statusLabel = {
              completed: 'Completed',
              cancelled: 'Cancelled',
              confirmed: 'Confirmed',
              in_progress: 'In Progress',
              picked_up: 'Picked Up',
            }[item.status] || item.status;

            return (
              <div key={item.id || i} className="flex items-center justify-between group px-1">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center text-lg">
                    {item.wasteType === 'general' ? '🗑️' : '♻️'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">{item.location || 'Local'} Pickup</p>
                    <p className="text-[10px] font-semibold text-slate-400">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-semibold capitalize tracking-widest px-2.5 py-1 rounded-full ${pillColor}`}>
                    {statusLabel}
                  </span>
                </div>
              </div>
            );
          })}

          {jobHistory.length === 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-slate-400 font-semibold capitalize tracking-widest">No recent activity yet</p>
            </div>
          )}
        </div>
      </div>





      {/* Floating AI Voice Assistant */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/hygenex')}
        className="fixed bottom-20 right-2 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center  z-50 border-4 border-white dark:border-slate-800"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500  opacity-20" />
        <Brain className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
}
