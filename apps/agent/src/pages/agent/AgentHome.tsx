/**
 * Agent Home — Command Center for Klinflow Founder Agents
 * Refactored: UI components extracted into `components/AgentHome`
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { useAssetStore } from '@klinflow/core/stores/assetStore';
import { supabase } from '@klinflow/supabase';
import PushNotificationModal from '@klinflow/ui/components/PushNotificationModal';
import { toast } from 'sonner';

import AgentHomeHeader from '../../features/agentHome/AgentHomeHeader';
import AgentHomeStats from '../../features/agentHome/AgentHomeStats';
import AgentHomeActivePickup from '../../features/agentHome/AgentHomeActivePickup';
import AgentHomeHistory from '../../features/agentHome/AgentHomeHistory';

export default function AgentHome() {
  const profile = useAuthStore(s => (s as any).profile);
  const toggleOnline = useAuthStore(s => (s as any).toggleOnline);
  const subscribeToProfileChanges = useAuthStore(s => (s as any).subscribeToProfileChanges);
  const fetchProfile = useAuthStore(s => (s as any).fetchProfile);

  const earnings = useAgentStore(s => s.earnings);
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
  const [acceptedTradesCount, setAcceptedTradesCount] = useState(0);
  const navigate = useNavigate();

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
          id, status, pickup_address, created_at, actual_weight,
          rfq:rfqs(category, material_grade, requested_weight)
        `)
        .eq('assigned_agent_id', profile.id)
        .not('status', 'in', '(completed,cancelled,delivered,disputed,pickup_completed)')
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

    if (!profile?.isOnline || !isMobileAgent) return;

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
  }, [profile?.isOnline, broadcastLocation]);

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);

    try {
      const isGoingOnline = !profile.isOnline;
      let coords = null;

      if (isGoingOnline) {
        const getCoords = () => new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
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
    } catch (err: any) {
      toast.error('Toggle failed', { description: err.message });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-6 px-1 pb-16">
      <PushNotificationModal
        isOpen={showPushPrompt}
        onClose={() => setShowPushPrompt(false)}
      />

      <AgentHomeHeader
        profile={profile}
        unreadCount={unreadCount}
        navigate={navigate}
        isToggling={isToggling}
        handleToggle={handleToggle}
        lastSynced={lastSynced}
      />

      <AgentHomeStats
        profile={profile}
        earnings={earnings}
        performanceChange={performanceChange}
        acceptedTradesCount={acceptedTradesCount}
        navigate={navigate}
      />

      <AgentHomeActivePickup
        activePickup={activePickup}
        navigate={navigate}
      />

      <AgentHomeHistory
        jobHistory={jobHistory}
        clearJobHistory={clearJobHistory}
      />

      {/* Floating AI Voice Assistant */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/hygenex')}
        className="fixed bottom-20 right-2 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center z-50 dark:border-slate-800"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-20" />
        <Brain className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
}
