/**
 * agentStore.js — CleanFlow KE Agent Job Management (Supabase)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient.js';
import { AI_COACH_INSIGHTS } from '../data/mockData.js';
import { useAuthStore } from './authStore.js';
import { useNotificationStore } from './notificationStore.js';
import { usePriceStore } from './priceStore.js';
import { useSettingsStore } from './settingsStore.js';
import { ROLES } from '@cleanflow/constants';

export const useAgentStore = create(
  persist(
    (set, get) => ({
  availableJobs: [],
  activeJobs: [],
  rejectedJobs: [],
  jobHistory: [],
  rejectedJobIds: [],
  arrivedJobIds: [], 
  setJobArrived: (jobId) => set((s) => ({ 
    arrivedJobIds: s.arrivedJobIds.includes(jobId) ? s.arrivedJobIds : [...s.arrivedJobIds, jobId] 
  })),
  earnings: {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    lastWeek: 0,
    completedToday: 0,
    totalJobs: 0,
    rating: 0,
    weeklyData: [
      { day: 'Mon', earnings: 0 },
      { day: 'Tue', earnings: 0 },
      { day: 'Wed', earnings: 0 },
      { day: 'Thu', earnings: 0 },
      { day: 'Fri', earnings: 0 },
      { day: 'Sat', earnings: 0 },
      { day: 'Sun', earnings: 0 },
    ],
  },
  recentReviews: [],
  isLoadingReviews: false,
  coachInsights: AI_COACH_INSIGHTS,
  isLoadingJobs: false,
  currentInsightIndex: 0,
  jobSubscription: null,
  
  // ── Fleet Management ──────────────────────────────
  fleetDrivers: [],
  isLoadingFleet: false,
  fetchFleetDrivers: async () => {
    const { userId, profile } = useAuthStore.getState();
    if (!userId || profile?.agent_account_type !== 'company_admin') return;

    set({ isLoadingFleet: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, phone, is_online, location, reward_points, avatar_url')
        .eq('company_id', userId)
        .order('name');
        
      if (error) throw error;
      set({ fleetDrivers: data || [] });
    } catch (err) {
      console.error('[AgentStore] Fetch Fleet Error:', err);
    } finally {
      set({ isLoadingFleet: false });
    }
  },
  
  // ── Agent Configuration ────────────────────────────
  agentConfig: null,
  isLoadingConfig: false,
  
  fetchAgentConfig: async () => {
    const { userId, profile } = useAuthStore.getState();
    if (!userId) return;
    
    set({ isLoadingConfig: true });
    try {
      const targetAgentId = (profile?.agent_account_type === 'fleet_driver' && profile?.company_id) 
        ? profile.company_id 
        : userId;

      const { data, error } = await supabase
        .from('agent_configurations')
        .select('*')
        .eq('agent_id', targetAgentId)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      set({ agentConfig: data || null });
    } catch (err) {
      console.error('[AgentStore] Error fetching config:', err);
    } finally {
      set({ isLoadingConfig: false });
    }
  },
  
  getEffectivePrice: (categorySlug, subcategorySlug) => {
    const { agentConfig } = get();
    const { profile } = useAuthStore.getState();
    
    // 1. Try Custom Service Catalog from Profile (New robust way)
    const customServices = profile?.service_profile?.custom_services || [];
    if (customServices.length > 0) {
      const cat = customServices.find(c => c.category.toLowerCase() === categorySlug.toLowerCase());
      if (cat) {
        const sub = cat.subcategories?.find(s => 
          s.name.toLowerCase().replace(/\s+/g, '_') === subcategorySlug?.toLowerCase() ||
          s.name.toLowerCase() === subcategorySlug?.toLowerCase()
        );
        if (sub && sub.rate_per_kg > 0) return sub.rate_per_kg;
      }
    }

    // 2. Fallback to Legacy agentConfig (Flat rates)
    if (!agentConfig) return 0; // Return 0 instead of magic number to indicate setup needed
    const { custom_rates } = agentConfig;
    if (!custom_rates) return 0;
    
    if (subcategorySlug) {
      const fullKey = `${categorySlug}_${subcategorySlug}`;
      if (custom_rates[fullKey] !== undefined && custom_rates[fullKey] > 0) {
        return custom_rates[fullKey];
      }
    }
    
    return custom_rates[categorySlug] || 0;
  },
  
  updateAgentConfig: async (updates) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return { success: false, error: 'Not authenticated' };
    
    set({ isLoadingConfig: true });
    try {
      const { data, error } = await supabase
        .from('agent_configurations')
        .upsert({ ...updates, agent_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'agent_id' })
        .select()
        .single();
        
      if (error) throw error;
      set({ agentConfig: data });
      return { success: true };
    } catch (err) {
      console.error('[AgentStore] Error updating config:', err);
      return { success: false, error: err.message };
    } finally {
      set({ isLoadingConfig: false });
    }
  },

  // ── Realtime Job Listener ───────────────────────────
  subscribeToJobs: () => {
    const { userId } = useAuthStore.getState();
    if (get().jobSubscription) return;
    
    const sub = supabase
      .channel('public:agent-bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' }, 
        (payload) => {
          // If the event is an insert of a pending job, play a sound
          if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
            useNotificationStore.getState().playNotificationSound();
          }

          // Always refresh available jobs (for the Radar)
          get().fetchAvailableJobs();

          // If the job is assigned to the current agent, refresh active jobs too
          if (payload.new && (payload.new.agent_id === userId || payload.old?.agent_id === userId)) {
            get().fetchActiveJobs();
          }
        }
      )
      .subscribe();
    set({ jobSubscription: sub });
  },

  cleanupJobs: () => {
    if (get().jobSubscription) {
      get().jobSubscription.unsubscribe();
      set({ jobSubscription: null });
    }
  },

  fetchAvailableJobs: async () => {
    const { userId, profile } = useAuthStore.getState();
    const { rejectedJobIds } = get();
    if (!userId) return;

    set({ isLoadingJobs: true });
    const isStaff = profile?.isStaff === true || profile?.is_staff === true;

    const { data, error } = await supabase.rpc('get_available_bookings', { agent_uuid: userId });
    if (!error && data) {
      const filteredJobs = data.filter(b => !rejectedJobIds.includes(b.id));
      const userIds = [...new Set(filteredJobs.map(b => b.user_id).filter(Boolean))];
      const { data: profilesData } = userIds.length > 0 
        ? await supabase.from('profiles').select('id, name, phone').in('id', userIds)
        : { data: [] };
      const profileMap = Object.fromEntries(profilesData?.map(p => [p.id, p]) || []);

      const mapped = filteredJobs.map(b => ({
          id: b.id,
          material: b.waste_type,
          bags: b.bags,
          actual_weight_kg: b.actual_weight_kg,
          location: b.estate,
          time: b.time_slot,
          status: b.status,
          agent_id: b.agent_id,
          user_id: b.user_id,
          customerName: profileMap[b.user_id]?.name || 'Resident',
          bookingType: b.booking_type || 'any',
          notes: b.notes,
          pay: Number(b.fee) || Number(b.total_price) || 0,
          photo_url: b.photo_url || b.photoUrl || b.photo || b.image || null,
          photoUrl: b.photo_url || b.photoUrl || b.photo || b.image || null,
          photos: b.photos || (b.photo_url || b.photoUrl || b.photo || b.image ? [b.photo_url || b.photoUrl || b.photo || b.image] : []),
          phone: profileMap[b.user_id]?.phone || '',
          is_market_trade: b.is_market_trade || false
        })).filter(job => !job.is_market_trade); // Marketplace trades go directly to Active, Resident missions start in Available
      
      const available = mapped.filter(job => !rejectedJobIds.includes(job.id));
      const rejected = mapped.filter(job => rejectedJobIds.includes(job.id));

      set({ 
        availableJobs: available, 
        rejectedJobs: rejected,
        isLoadingJobs: false 
      });

      // ── TRIGGER DYNAMIC HOTSPOT ANALYSIS ──
      get().computeLocalHotspots();
    } else {
      set({ isLoadingJobs: false });
    }
  },

  computeLocalHotspots: () => {
    const { availableJobs, coachInsights } = get();
    if (availableJobs.length < 3) return;

    // Group by estate
    const clusters = availableJobs.reduce((acc, job) => {
      const key = job.location || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Find the largest cluster
    const [topEstate, count] = Object.entries(clusters).sort((a, b) => b[1] - a[1])[0];

    if (count >= 3) {
      const hotspotInsight = {
        id: `hotspot-${topEstate}`,
        type: 'hotspot',
        title: '🔥 Hotspot Detected!',
        message: `${count} missions available in ${topEstate}. Optimize your route now to maximize efficiency.`,
        action: 'Start Route',
        target: `/routes?estate=${topEstate}`,
        icon: '🔥'
      };

      // Filter out old hotspots and prepend the new one
      const otherInsights = coachInsights.filter(i => i.type !== 'hotspot');
      set({ coachInsights: [hotspotInsight, ...otherInsights], currentInsightIndex: 0 });
    }
  },

  fetchDynamicInsights: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-agent-insights', {
        body: { agent_id: userId }
      });

      if (error) throw error;

      if (data?.insight) {
        const aiInsight = {
          id: `ai-${Date.now()}`,
          type: 'ai-trend',
          title: data.insight.title || '📈 Market Pulse',
          message: data.insight.message,
          action: data.insight.action || 'View Market',
          target: data.insight.target || '/sourcing',
          icon: '🧠'
        };

        const otherInsights = get().coachInsights.filter(i => i.type !== 'ai-trend');
        set({ coachInsights: [aiInsight, ...otherInsights] });
      }
    } catch (err) {
      console.warn('[AgentStore] Dynamic insights skipped:', err.message);
    }
  },

  fetchActiveJobs: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    const { data: bookingsData, error: bookingsError } = await supabase.rpc('get_active_agent_jobs', { agent_uuid: userId });
    if (bookingsError) return;

    const userIds = [...new Set(bookingsData.map(b => b.user_id).filter(Boolean))];
    const { data: profilesData } = userIds.length > 0 
      ? await supabase.from('profiles').select('id, name, phone').in('id', userIds)
      : { data: [] };
    const profileMap = Object.fromEntries(profilesData?.map(p => [p.id, p]) || []);

    const mapped = bookingsData.map(b => ({
      id: b.id,
      material: b.waste_type,
      bags: b.bags,
      actual_weight_kg: b.actual_weight_kg,
      pay: (b.fee || 0) * useSettingsStore.getState().getAgentCommission(),
      location: b.estate,
      time: b.time_slot,
      status: b.status,
      latitude: b.latitude,
      longitude: b.longitude,
      user_id: b.user_id,
      userId: b.user_id, // Redundant fallback for camelCase lookups
      customer: profileMap[b.user_id]?.name || 'Customer',
      phone: profileMap[b.user_id]?.phone || '',
      photo_url: b.photo_url || b.photoUrl || b.photo || b.image || null,
      photoUrl: b.photo_url || b.photoUrl || b.photo || b.image || null,
      photos: b.photos || (b.photo_url || b.photoUrl || b.photo || b.image ? [b.photo_url || b.photoUrl || b.photo || b.image] : []),
      notes: b.notes,
      is_market_trade: b.is_market_trade || false,
      booking_type: b.booking_type || b.bookingType || null,
      total_price: b.total_price || b.fee || 0
    }));
    set({ activeJobs: mapped });
  },

  subscribeToMissionUpdates: (callback) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return { unsubscribe: () => {} };

    const channel = supabase
      .channel(`agent-mission-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings', 
          filter: `agent_id=eq.${userId}` 
        }, 
        () => {
          console.log('[AgentStore] 🔄 Mission update detected, re-fetching...');
          callback();
        }
      )
      .subscribe();

    return channel;
  },

  fetchEarnings: async () => {
    const { userId, profile } = useAuthStore.getState();
    if (!userId) return;

    const isCompany = profile?.agent_account_type === 'company_admin' || profile?.agent_account_type === 'owner';
    
    try {
      let query = supabase
        .from('bookings')
        .select('id, fee, total_price, updated_at, status, agent_id, waste_type, estate, hidden_for_agent');

      if (isCompany) {
        const { data: drivers } = await supabase.from('profiles').select('id').eq('company_id', userId);
        const driverIds = drivers?.map(d => d.id) || [];
        driverIds.push(userId);
        query = query.in('agent_id', driverIds);
      } else {
        query = query.eq('agent_id', userId);
      }

      const { data, error } = await query
        .in('status', ['completed', 'cancelled', 'confirmed', 'in_progress', 'picked_up'])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const now = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyDataMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        
        let totalPayouts = 0;
        let totalServiceRevenue = 0;
        let totalKgRecovered = 0;
        let todayEarnings = 0;
        let monthEarnings = 0;
        let completedToday = 0;
        let totalJobs = 0;
        const todayStr = now.toLocaleDateString('en-CA');

        const processedIds = new Set();
        data.forEach(b => {
          if (b.status !== 'completed' || processedIds.has(b.id)) return;
          processedIds.add(b.id);
          
          const d = new Date(b.updated_at);
          const dStr = d.toLocaleDateString('en-CA');
          
          const commissionRate = useSettingsStore.getState().getAgentCommission();
          const payoutToResident = Number(b.fee) || 0;
          const serviceCommission = (Number(b.total_price) || 0) * commissionRate;
          
          totalPayouts += payoutToResident;
          totalServiceRevenue += serviceCommission;
          totalJobs++;

          if (dStr === todayStr) {
            todayEarnings += serviceCommission;
            completedToday++;
          }
          if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            monthEarnings += serviceCommission;
          }
          const dayName = dayNames[d.getDay()];
          // Removed: weeklyDataMap[dayName] += serviceCommission;
        });

        // ── NEW: Fetch Assets for Material Value & KG Tracking ──
        let assetQuery = supabase.from('assets').select('estimated_value, weight_kg, created_at, verifier_id');
        if (isCompany) {
          const { data: drivers } = await supabase.from('profiles').select('id').eq('company_id', userId);
          const driverIds = drivers?.map(d => d.id) || [userId];
          assetQuery = assetQuery.in('verifier_id', driverIds);
        } else {
          assetQuery = assetQuery.eq('verifier_id', userId);
        }
        
        const { data: assetsData } = await assetQuery;
        
        let totalMaterialValue = 0;
        let todayTradingRevenue = 0;

        assetsData?.forEach(a => {
          totalMaterialValue += (Number(a.estimated_value) || 0);
          const weight = Number(a.weight_kg) || 0;
          totalKgRecovered += weight;
          
          const d = new Date(a.created_at);
          const dStr = d.toLocaleDateString('en-CA');
          
          if (dStr === todayStr) {
            todayTradingRevenue += (Number(a.estimated_value) || 0);
          }

          // Track weekly weight distribution
          const dayName = dayNames[d.getDay()];
          if (weeklyDataMap[dayName] !== undefined) {
            weeklyDataMap[dayName] += weight;
          }
        });

        const grossInvestment = totalPayouts;
        const inventoryValue = totalMaterialValue;

        set({
          earnings: {
            ...get().earnings,
            totalInvestment: grossInvestment,
            inventoryValue: inventoryValue,
            totalKg: totalKgRecovered,
            today: todayEarnings + todayTradingRevenue,
            thisMonth: monthEarnings,
            completedToday,
            totalJobs,
            residentPickups: data.filter(b => b.status === 'completed' && !b.is_market_trade).length,
            marketTrades: data.filter(b => b.status === 'completed' && b.is_market_trade).length,
            weeklyData: Object.entries(weeklyDataMap).map(([day, weight]) => ({ day, weight }))
          },
          jobHistory: data
            .filter(b => b.hidden_for_agent !== true)
            .map(b => ({
              id: b.id,
              wasteType: b.waste_type,
              location: b.estate,
              date: new Date(b.updated_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              status: b.status,
              payout: b.fee || 0,
              commission: (b.total_price || 0) * useSettingsStore.getState().getAgentCommission(),
              photo_url: b.photo_url,
              photos: b.photos || (b.photo_url ? [b.photo_url] : [])
            }))
        });
      }
    } catch (err) {
      console.error('[AgentStore] fetchEarnings failed:', err);
    }
  },

  fetchReviews: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;
    set({ isLoadingReviews: true });
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, agent_rating, agent_feedback, updated_at, waste_type, user_id')
      .eq('agent_id', userId)
      .not('agent_rating', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (bookingsError) {
      set({ isLoadingReviews: false });
      return;
    }
    const userIds = [...new Set(bookingsData.map(b => b.user_id).filter(Boolean))];
    const { data: profilesData } = userIds.length > 0 
      ? await supabase.from('profiles').select('id, name, avatar_url').in('id', userIds)
      : { data: [] };
    const profileMap = Object.fromEntries(profilesData?.map(p => [p.id, p]) || []);

    set({ 
      recentReviews: bookingsData.map(b => ({
        id: b.id,
        rating: b.agent_rating,
        feedback: b.agent_feedback,
        date: new Date(b.updated_at).toLocaleDateString(),
        wasteType: b.waste_type,
        customerName: profileMap[b.user_id]?.name || 'Customer',
        customerAvatar: profileMap[b.user_id]?.avatar_url
      })), 
      isLoadingReviews: false 
    });
  },

  acceptJob: async (jobId) => {
    try {
      const { userId, profile } = useAuthStore.getState();
      if (!userId) return false;
      const { error: updateError } = await supabase.rpc('accept_booking', { target_booking_id: jobId, assigned_agent_id: userId });
      if (updateError) throw updateError;
      await get().fetchAvailableJobs();
      await get().fetchActiveJobs();
      return true;
    } catch (err) {
      console.error('[AgentStore] Job Acceptance Failed:', err);
      return false;
    }
  },

  rejectJob: async (jobId) => {
    const job = get().availableJobs.find(j => j.id === jobId);
    set((s) => ({
      rejectedJobIds: [...s.rejectedJobIds, jobId],
      availableJobs: s.availableJobs.filter(j => j.id !== jobId),
      rejectedJobs: job ? [...s.rejectedJobs, job] : s.rejectedJobs
    }));
  },

  restoreJob: async (jobId) => {
    const job = get().rejectedJobs.find(j => j.id === jobId);
    set((s) => ({
      rejectedJobIds: s.rejectedJobIds.filter(id => id !== jobId),
      rejectedJobs: s.rejectedJobs.filter(j => j.id !== jobId),
      availableJobs: job ? [...s.availableJobs, job] : s.availableJobs
    }));
  },

  completeJob: async (jobId, weightKg) => {
    const { fetchActiveJobs, fetchEarnings } = get();
    const { userId } = useAuthStore.getState();
    try {
      const { error: updateError } = await supabase.rpc('agent_completes_pickup', {
        p_booking_uuid: jobId,
        p_agent_uuid: userId,
        p_weight_kg: weightKg,
        p_total_fee: 200 + (weightKg * 40)
      });
      if (updateError) throw updateError;
      
      // ── NEW: Sync Marketplace Offer Status ──
      // If this was a marketplace trade, mark the offer as completed
      try {
        const { data: offer } = await supabase
          .from('marketplace_offers')
          .select('id')
          .eq('booking_id', jobId)
          .single();

        if (offer) {
          await supabase
            .from('marketplace_offers')
            .update({ status: 'completed' })
            .eq('id', offer.id);
        }
      } catch (e) {
        console.warn('[AgentStore] Marketplace sync skipped or failed:', e);
      }

      fetchActiveJobs();
      fetchEarnings();
    } catch (err) {
      console.error('[AgentStore] Completion error:', err);
      throw err;
    }
  },

  clearJobHistory: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    const { error } = await supabase
      .from('bookings')
      .update({ hidden_for_agent: true })
      .eq('agent_id', userId)
      .in('status', ['completed', 'cancelled']);

    if (error) throw error;
    get().fetchEarnings();
  },

  nextInsight: () => set((s) => ({ currentInsightIndex: (s.currentInsightIndex + 1) % s.coachInsights.length })),

  broadcastLocation: async (lat, lng, status = 'active') => {
    const { userId, profile, updateProfile } = useAuthStore.getState();
    if (!userId) return;
    try {
      const { latLngToCell } = await import('h3-js');
      const h3_index = latLngToCell(lat, lng, 7);
      
      // PRESERVE the estate name and other metadata while updating coordinates
      const newLocation = { 
        ...profile?.location,
        latitude: lat, 
        longitude: lng, 
        h3_index, 
        status, 
        last_pulse: new Date().toISOString() 
      };

      await updateProfile({ location: newLocation });
    } catch (err) {
      console.error('[AgentStore] Location broadcast failed:', err);
    }
  },
    }),
    {
      name: 'cf_agent_state',
      partialize: (state) => ({ 
        rejectedJobIds: state.rejectedJobIds, 
        arrivedJobIds: state.arrivedJobIds 
      })
    }
  )
);
