/**
 * Agent Home — Command Center for CleanFlow Founder Agents
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
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
  Brain,
  Handshake
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAgentStore, useNotificationStore, useAssetStore, supabase, getThumbnailUrl } from '@cleanflow/core';
import { AIInsightCard, PushNotificationModal } from '@cleanflow/ui';
import { toast } from 'sonner';

export default function AgentHome() {
  const profile = useAuthStore(s => s.profile);
  const toggleOnline = useAuthStore(s => s.toggleOnline);
  const withdrawRewards = useAuthStore(s => s.withdrawRewards);
  const subscribeToProfileChanges = useAuthStore(s => s.subscribeToProfileChanges);
  const fetchProfile = useAuthStore(s => s.fetchProfile);

  const earnings = useAgentStore(s => s.earnings);
  const coachInsights = useAgentStore(s => s.coachInsights);
  const currentInsightIndex = useAgentStore(s => s.currentInsightIndex);
  const nextInsight = useAgentStore(s => s.nextInsight);
  const availableJobs = useAgentStore(s => s.availableJobs);
  const fetchAvailableJobs = useAgentStore(s => s.fetchAvailableJobs);
  const fetchEarnings = useAgentStore(s => s.fetchEarnings);
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
    // Load essential finance data immediately
    fetchEarnings();
    fetchProfile(); // Ensure fresh rating, wallet, points from DB

    // Defer heavy data slightly to keep UI responsive
    const jobsTimer = setTimeout(() => fetchAvailableJobs(), 100);
    const assetsTimer = setTimeout(() => fetchAssets(), 300);

    // Fetch accepted marketplace trades count
    if (profile?.id) {
      const today = new Date().toISOString().split('T')[0];
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', profile.id)
        .eq('is_market_trade', true)
        .gte('created_at', today)
        .then(({ count }) => setAcceptedTradesCount(count || 0));
    }

    // Subscribe to live profile updates (rating, wallet, points)
    if (profile?.id) {
      subscribeToProfileChanges(profile.id);
    }

    return () => {
      clearTimeout(jobsTimer);
      clearTimeout(assetsTimer);
    };
  }, []);

  // ── REAL-TIME JOB LISTENER ──
  useEffect(() => {
    if (profile.isOnline) {
      subscribeToJobs();
    } else {
      cleanupJobs();
    }
    return () => cleanupJobs();
  }, [profile.isOnline, subscribeToJobs, cleanupJobs]);

  // ── REAL-TIME HEARTBEAT: Pulse location while online ──────────────
  useEffect(() => {
    // Only pulse location for mobile agents (drivers/independents)
    // We now allow company_admins to also pulse if they are acting as their own driver
    const isMobileAgent = profile?.agent_account_type === 'fleet_driver' || 
                          profile?.agent_account_type === 'independent' || 
                          profile?.agent_account_type === 'company_admin' ||
                          profile?.agent_account_type === 'owner';
    
    if (!profile.isOnline || !isMobileAgent) return;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(pos => {
        // ── SMART FILTERING: Prevent 'Nairobi Snapping' ──
        // 1. If accuracy is very poor (> 100m), it's likely a fallback cell-tower ping
        if (pos.coords.accuracy > 100) return;

        // 2. Only broadcast if it's a significant move or if we are online
        // This prevents overwriting manual settings with generic city-center defaults
        broadcastLocation(pos.coords.latitude, pos.coords.longitude, 'active');
      }, (err) => {
        if (err.code === 3) {
          console.warn('[GPS] Signal weak (timeout). Holding last known position...');
        } else {
          console.error('GPS Watch Error:', err);
        }
      }, { 
        enableHighAccuracy: true, 
        maximumAge: 0,      // Force fresh GPS lock, don't use old cached Nairobi data
        timeout: 15000     // Give it 15s to get a real satellite lock
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

  const handleWithdraw = async () => {
    const balance = earnings.total || earnings.today || 0;
    if (balance < 100) {
      toast.warning("Minimum Withdrawal: KSh 100", {
        description: `You need KSh ${100 - balance} more to withdraw to M-Pesa.`,
      });
      return;
    }

    setIsWithdrawing(true);
    try {
      await withdrawRewards(balance);
      toast.success("M-Pesa Withdrawal Success! 💸", { 
        description: `KSh ${balance.toLocaleString()} has been sent to your registered phone.` 
      });
    } catch (err) {
      toast.error("Withdrawal Failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* ── PUSH ENROLLMENT MODAL ── */}
      <PushNotificationModal 
        isOpen={showPushPrompt}
        onClose={() => setShowPushPrompt(false)}
      />
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          {/* Profile Avatar */}
          <button onClick={() => navigate('/settings/profile')} className="shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xl shadow-md border-2 border-white dark:border-slate-800 active:scale-90 transition-all overflow-hidden">
              {profile?.avatar_url ? (
                <img src={getThumbnailUrl(profile.avatar_url, { width: 200 })} className="w-full h-full object-cover" />
              ) : (
                profile?.avatar || '👤'
              )}
            </div>
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white leading-none">Hello, {profile.name.split(' ')[0]}! 👋</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1.5 text-xs text-primary font-semibold uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                <MapPin className="w-3 h-3" /> {profile.location?.estate || profile.estate || 'Nairobi Sector'}
              </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/settings/notifications')}
          className="relative w-9 h-9 rounded-xl bg-[#F8F8FF] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 group"
        >
          <Bell className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-600 text-white text-xs font-semibold rounded-full flex items-center justify-center ring-2 ring-[#F8F8FF] dark:ring-slate-950 shadow-md animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ── AGENT ONLINE STATUS TOGGLE (Unified Logic) ── */}
      {(!(profile?.agent_account_type === 'company_admin' || profile?.company_name || profile?.fleet_invite_code)) ? (
        <div className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-inner transition-colors ${
              profile.isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200/50 dark:bg-slate-700 text-slate-400'
            }`}>
              {isToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-widest leading-none mb-1 opacity-80 text-primary">System Status</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {profile.isOnline ? 'Active Radar' : 'Offline'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleToggle}
            disabled={isToggling}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
              profile.isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${
              profile.isOnline ? 'left-[22px]' : 'left-[2px]'
            }`} />
          </button>
        </div>
      ) : (
        <div className="w-full p-4 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-colors ${
              profile.isOnline ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
            }`}>
              {isToggling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-widest leading-none mb-1 text-emerald-400">Company Control</p>
              <p className="text-base font-bold tracking-tight">{profile.isOnline ? 'Online' : 'Offline'}</p>
            </div>
          </div>
          <button 
            onClick={handleToggle}
            disabled={isToggling}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
              profile.isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-800 border border-white/10'
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${
              profile.isOnline ? 'left-[28px]' : 'left-[4px]'
            }`} />
          </button>
        </div>
      )}

      {/* ── QUICK ACTION MATRIX ── */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => navigate('/jobs')}
          className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 hover:shadow-lg transition-all active:scale-95 group"
        >
          <div className="relative">
            {availableJobs.length > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-blue-500 rounded-full flex items-center justify-center px-1 shadow-lg shadow-blue-500/30 z-10">
                <span className="text-[7px] font-black text-white">{availableJobs.length}</span>
              </div>
            )}
            <div className="w-8 h-8 bg-blue-100/50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">Missions</p>
            <p className="text-xs font-black text-slate-900 dark:text-white leading-tight uppercase italic">Open Jobs</p>
          </div>
        </button>
        
        <button
          onClick={() => navigate('/trades')}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 hover:shadow-lg transition-all active:scale-95 group"
        >
          <div className="relative">
            {acceptedTradesCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-emerald-500 rounded-full flex items-center justify-center px-1 shadow-lg shadow-emerald-500/30 z-10">
                <span className="text-[7px] font-black text-white">{acceptedTradesCount}</span>
              </div>
            )}
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <Handshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">Market</p>
            <p className="text-xs font-black text-slate-900 dark:text-white leading-tight uppercase italic">Accepted Bids</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/earnings')}
          className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 hover:shadow-lg transition-all active:scale-95 group"
        >
          <div className="w-8 h-8 bg-amber-100/50 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-center">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">Analytics</p>
            <p className="text-xs font-black text-slate-900 dark:text-white leading-tight uppercase italic">Stats</p>
          </div>
        </button>
      </div>

      {/* ── AGENT HERO CARD: COMMAND CENTER ── */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl blur opacity-0 dark:opacity-40 dark:group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-white dark:bg-gradient-to-br dark:from-indigo-700 dark:via-indigo-600 dark:to-blue-600 border border-slate-200 dark:border-white/10 rounded-2xl p-5 dark:shadow-xl dark:shadow-indigo-500/20 overflow-hidden transition-all duration-500">
          
          {/* Subtle Background Elements (Visible mostly in dark mode) */}
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-10 pointer-events-none">
            <Package className="w-24 h-24 text-indigo-900 dark:text-indigo-200" />
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 dark:bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/5 dark:bg-indigo-400/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            {/* Masonry-Style Performance Grid */}
            <div className="grid grid-cols-4 gap-2.5">
              
              {/* 1. Main Stock Value (Large Card) */}
              <div className="col-span-2 row-span-2 bg-slate-50 dark:bg-white/10 rounded-3xl p-5 border border-slate-100 dark:border-white/10 flex flex-col justify-between hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-white/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-200" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-indigo-200 uppercase tracking-widest mb-1">
                    {profile?.agent_account_type === 'company_admin' ? 'Fleet Value' : 'Stock Value'}
                  </p>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter leading-none flex items-baseline gap-0.5">
                    <span className="text-sm font-light text-slate-400 dark:text-indigo-200 opacity-60">KSh</span>
                    {earnings.inventoryValue?.toLocaleString() || 0}
                  </h2>
                </div>
              </div>

              {/* 2. Rating (Compact Card) */}
              <div className="bg-slate-50 dark:bg-white/10 rounded-2xl p-3 border border-slate-100 dark:border-white/10 flex flex-col items-center justify-center hover:bg-white/20 transition-colors">
                <Star className="w-4 h-4 text-amber-500 dark:text-amber-300 fill-amber-500/10 dark:fill-amber-300/20 mb-1" />
                <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                  {profile.rating ? Number(profile.rating).toFixed(1) : '5.0'}
                </span>
                <span className="text-[7px] font-semibold text-slate-500 dark:text-indigo-200 uppercase tracking-widest mt-1">Rating</span>
              </div>

              {/* 3. Points (Compact Card) */}
              <div className="bg-slate-50 dark:bg-white/10 rounded-2xl p-3 border border-slate-100 dark:border-white/10 flex flex-col items-center justify-center hover:bg-white/20 transition-colors">
                <Zap className="w-4 h-4 text-indigo-600 dark:text-amber-300 mb-1" />
                <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">{profile.rewardPoints || 0}</span>
                <span className="text-[7px] font-semibold text-slate-500 dark:text-indigo-200 uppercase tracking-widest mt-1">Points</span>
              </div>

              {/* 4. Pickups Today (Horizontal Card) */}
              <div className="col-span-2 bg-slate-50 dark:bg-white/10 rounded-2xl p-3 border border-slate-100 dark:border-white/10 flex items-center gap-3 hover:bg-white/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-400/20 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-200" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white leading-none">{earnings.completedToday || 0}</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-indigo-200 uppercase tracking-widest mt-0.5">Pickups Today</p>
                </div>
              </div>

              {/* 5. Accepted Bids (Bottom Bar) */}
              <div className="col-span-4 bg-slate-100/50 dark:bg-white/5 rounded-2xl p-3 border border-slate-200 dark:border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <Handshake className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-indigo-200 uppercase tracking-widest leading-none mb-1">
                      Marketplace Performance
                    </p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{acceptedTradesCount || 0} Accepted Bids</p>
                  </div>
                </div>
                <div className="text-right px-3 border-l border-slate-200 dark:border-white/10">
                  <p className="text-xs font-semibold text-slate-400 dark:text-indigo-200 uppercase tracking-widest leading-none mb-1">
                    Lifetime
                  </p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{earnings.totalJobs || 0} Total</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── ROUTE OPTIMIZER CTA ── */}
      <button
        onClick={() => navigate('/routes')}
        className="w-full bg-slate-100/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98] group"
      >
        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
          <Navigation className="w-5 h-5 text-white" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5 italic">Route Optimizer</p>
          <p className="text-[13px] font-black text-slate-900 dark:text-white leading-tight uppercase italic">Smart Logistics Terminal</p>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Live Multi-Stop Tracking</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </button>

      {/* ── HYGENEX AGENT COACH ── */}
      {currentInsight && (
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-xl shadow-blue-500/10">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-20 h-20" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs font-semibold uppercase tracking-widest">Agent Insights</span>
              <p className="text-xs font-semibold text-white/80 uppercase tracking-widest">Earning Optimizer</p>
            </div>
            <h3 className="text-xl font-semibold mb-1">{currentInsight.title}</h3>
            <p className="text-xs font-medium text-white/80 leading-relaxed mb-6">
              {currentInsight.message || "High demand detected in your sector. Stay online for bonus multipliers."}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/jobs')}
                className="flex-1 py-4 bg-white text-indigo-700 rounded-2xl font-semibold text-xs uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all"
              >
                Go to Hotspot
              </button>
              <button 
                onClick={nextInsight}
                className="px-6 py-4 bg-white/10 text-white rounded-2xl font-semibold text-xs uppercase tracking-widest border border-white/20 active:scale-[0.98] transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MISSION HISTORY ── */}
      <div className="bg-slate-100/30 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="font-semibold text-xs uppercase tracking-widest text-slate-400">Mission History</h3>
          {jobHistory.length > 0 && (
            <button
              onClick={clearJobHistory}
              className="text-xs font-semibold text-rose-500 uppercase tracking-widest px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors active:scale-95"
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
                    <p className="text-xs font-semibold text-slate-400">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full ${pillColor}`}>
                    {statusLabel}
                  </span>
                </div>
              </div>
            );
          })}
          
          {jobHistory.length === 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">No Past Missions Yet</p>
            </div>
          )}
        </div>
      </div>
      {/* Floating AI Voice Assistant */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/hygenex', { state: { autoStartMic: true } })}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50 z-50 border-4 border-white dark:border-slate-800"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />
        <Brain className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
}
