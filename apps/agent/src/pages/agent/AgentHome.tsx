/**
 * Agent Home — Command Center for Klinflow Founder Agents
 * Refactored: UI components extracted into `components/AgentHome`
 */
import { useEffect, useState, useCallback, useRef } from 'react';
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
import AgentHomeMap from '../../features/agentHome/AgentHomeMap';
import { useAgentLocation } from '../../features/agentHome/useAgentLocation';

export default function AgentHome() {
  const profile = useAuthStore(s => (s as any).profile);
  const toggleOnline = useAuthStore(s => (s as any).toggleOnline);
  const subscribeToProfileChanges = useAuthStore(s => (s as any).subscribeToProfileChanges);
  const fetchProfile = useAuthStore(s => (s as any).fetchProfile);

  const earnings = useAgentStore(s => s.earnings);
  const initializeAgentData = useAgentStore(s => s.initializeAgentData);
  const fetchEarnings = useAgentStore(s => s.fetchEarnings);
  const fetchDynamicInsights = useAgentStore(s => s.fetchDynamicInsights);
  const broadcastLocation = useAgentStore(s => s.broadcastLocation);
  const subscribeToJobs = useAgentStore(s => s.subscribeToJobs);
  const cleanupJobs = useAgentStore(s => s.cleanupJobs);

  const fetchAssets = useAssetStore(s => s.fetchAssets);
  const getUnreadCount = useNotificationStore(s => s.getUnreadCount);
  const subscribeToPush = useNotificationStore(s => s.subscribeToPush);
  
  const [isToggling, setIsToggling] = useState(false);
  const [acceptedTradesCount, setAcceptedTradesCount] = useState(0);
  const navigate = useNavigate();

  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [performanceChange, setPerformanceChange] = useState<number>(0);


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

    const jobsTimer = setTimeout(() => initializeAgentData(), 100);
    const assetsTimer = setTimeout(() => fetchAssets(), 300);
    const aiTimer = setTimeout(() => fetchDynamicInsights(), 600);

    // Fetch active marketplace trades count
    if (profile?.id) {
      supabase
        .from('bookings')
        .select('id, booking_type')
        .eq('agent_id', profile.id)
        .or('is_market_trade.eq.true,booking_type.eq.marketplace_pickup')
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .then(({ data }) => {
          const count = (data || []).filter(d => d.booking_type !== 'dropoff').length;
          setAcceptedTradesCount(count);
        });
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

  // ── SINGLE GPS SOURCE: useAgentLocation ──
  // Backend broadcasting is handled via the onLocationUpdate callback.
  // This replaces the old duplicate watchPosition that was here.
  const broadcastRef = useRef(broadcastLocation);
  broadcastRef.current = broadcastLocation;

  const handleLocationUpdate = useCallback((lat: number, lng: number, accuracy: number) => {
    // Only broadcast to backend when agent is online and is a mobile agent
    const currentProfile = useAuthStore.getState().profile as any;
    const isMobileAgent = currentProfile?.agentAccountType === 'fleet_driver' ||
      currentProfile?.agentAccountType === 'independent' ||
      currentProfile?.agentAccountType === 'company_admin' ||
      currentProfile?.agentAccountType === 'owner';

    if (currentProfile?.isOnline && isMobileAgent) {
      broadcastRef.current(lat, lng, 'active');
    }
  }, []);

  const {
    position: agentPosition,
    accuracy: agentAccuracy,
    hasLocation,
    permissionState,
    error: locationError,
  } = useAgentLocation(handleLocationUpdate);

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);

    try {
      const isGoingOnline = !profile.isOnline;
      let coords = null;

      if (isGoingOnline) {
        // Use the continuous watcher's position if we already have it!
        // This avoids creating a duplicate, competing GPS request.
        if (agentPosition && hasLocation) {
          coords = { latitude: agentPosition.lat, longitude: agentPosition.lng };
        } else {
          try {
            const { useLocationStore } = await import('@klinflow/core/stores/locationStore');
            const locCoords = await toast.promise(useLocationStore.getState().getCurrentLocation(), {
              loading: '📡 Acquiring GPS signal...',
              success: 'Location synced! You are now live.',
              error: 'GPS error. Using last known location.',
            });
            coords = { latitude: locCoords.latitude, longitude: locCoords.longitude };
          } catch (err) {
            coords = null;
          }
        }
      }

      await toggleOnline(coords);

      if (isGoingOnline) {
        initializeAgentData();
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
    <div className="relative h-[100dvh] bg-[#e5e9ea] dark:bg-slate-950 overflow-hidden font-sans -mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] -mb-[calc(env(safe-area-inset-bottom,0px)+6rem)]" style={{ width: 'calc(100% + 0.5rem)' }}>
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

      {/* ── LEAFLET MAP ── */}
      <AgentHomeMap
        isOnline={!!profile?.isOnline}
        agentPosition={agentPosition}
        agentAccuracy={agentAccuracy}
        hasLocation={hasLocation}
        permissionState={permissionState}
        locationError={locationError}
      />

      <AgentHomeStats
        profile={profile}
        earnings={earnings}
        performanceChange={performanceChange}
        acceptedTradesCount={acceptedTradesCount}
        navigate={navigate}
      />

      {/* Floating AI Voice Assistant */}
      {/* <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/hygenex')}
        className="fixed bottom-[calc(env(safe-area-inset-bottom,1rem)+17rem)] right-4 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center z-50 shadow-xl border-2 border-white dark:border-slate-800"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-20" />
        <Brain className="w-6 h-6 text-white" />
      </motion.button> */}
    </div>
  );
}
