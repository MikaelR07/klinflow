/**
 * agentStore.ts — Klinflow KE Agent Job Management (Supabase)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';
import { AI_COACH_INSIGHTS } from '../data/mockData';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';
import { usePriceStore } from './priceStore';
import { useSettingsStore } from './settingsStore';
import { ROLES } from '@klinflow/constants';
import { AgentStore, AgentJob, CoachInsight, Booking, ProfileRow, AgentConfiguration, AgentReview } from './agentStore.types';

export const useAgentStore = create<AgentStore>()(
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
    todayPayout: 0,
    totalJobs: 0,
    total: 0,
    rating: 0,
    weeklyData: [
      { day: 'Mon', weight: 0 },
      { day: 'Tue', weight: 0 },
      { day: 'Wed', weight: 0 },
      { day: 'Thu', weight: 0 },
      { day: 'Fri', weight: 0 },
      { day: 'Sat', weight: 0 },
      { day: 'Sun', weight: 0 },
    ],
  },
  recentReviews: [],
  isLoadingReviews: false,
  coachInsights: AI_COACH_INSIGHTS as unknown as CoachInsight[],
  isLoadingJobs: false,
  currentInsightIndex: 0,
  jobSubscription: null,
  
  // ── Fleet Management ──────────────────────────────
  fleetDrivers: [],
  isLoadingFleet: false,
  fetchFleetDrivers: async () => {
    const { userId, profile } = useAuthStore.getState();
    if (!userId || profile?.agentAccountType !== 'company_admin') return;

    set({ isLoadingFleet: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, phone, is_online, location, reward_points, avatar_url')
        .eq('company_id', userId)
        .order('name');
        
      if (error) throw error;
      set({ fleetDrivers: data as Partial<ProfileRow>[] });
    } catch (err) {
      console.error('Fetch fleet drivers error:', err);
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
      const targetAgentId = (profile?.agentAccountType === 'fleet_driver' && profile?.companyId) 
        ? profile.companyId 
        : userId;

      const { data, error } = await supabase
        .from('agent_configurations')
        .select('*')
        .eq('agent_id', targetAgentId)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      set({ agentConfig: data as AgentConfiguration | null });
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
    const serviceProfile = (profile as any)?.service_profile;
    const customServices = serviceProfile?.custom_services || [];
    if (customServices.length > 0) {
      const cat = customServices.find((c: any) => c.category.toLowerCase() === categorySlug.toLowerCase());
      if (cat) {
        const sub = cat.subcategories?.find((s: any) => 
          s.name.toLowerCase().replace(/\s+/g, '_') === subcategorySlug?.toLowerCase() ||
          s.name.toLowerCase() === subcategorySlug?.toLowerCase()
        );
        if (sub && sub.rate_per_kg > 0) return sub.rate_per_kg;
      }
    }

    // 2. Fallback to Legacy agentConfig (Flat rates)
    if (!agentConfig) return 0;
    const custom_rates = agentConfig.custom_rates as Record<string, number> | null;
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
      set({ agentConfig: data as AgentConfiguration });
      return { success: true };
    } catch (err: any) {
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
      // Listener 1: Handle NEW pending missions (Public or Private)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'bookings', filter: 'status=eq.pending' }, 
        (payload: any) => {
          const newJob = payload.new as any;
          
          // 1. COMPLETELY IGNORE missions for company admins (not in the field)
          const { profile } = useAuthStore.getState();
          const isCompanyAdmin = profile?.role === 'company_admin' || profile?.agentAccountType === 'company_admin';
          if (isCompanyAdmin) return;

          // 2. Only process if job is open (public) OR targeted specifically to this agent
          if (!newJob.agent_id || newJob.agent_id === userId) {
            // 3. MATERIAL FILTERING: Respect accepted materials configuration
            // NOTE: accepted_materials uses WASTE_CATEGORIES IDs (e.g. 'recyclable'),
            // but booking waste_type may use DB slugs (e.g. 'plastic'). Use alias map.
            const accepted = (get().agentConfig?.accepted_materials || []) as any[];
            const wasteType = newJob.waste_type;
            if (accepted.length > 0 && wasteType) {
              const MATERIAL_ALIASES: Record<string, string[]> = {
                'recyclable': ['plastic', 'plastics', 'pet', 'hdpe', 'ldpe', 'pp', 'mixed_plastic'],
                'plastic': ['recyclable'],
                'metal': ['aluminium', 'copper', 'steel', 'brass', 'scrap'],
                'ewaste': ['e-waste', 'electronics', 'batteries', 'cables', 'screens', 'logic_boards'],
                'paper': ['cardboard', 'newsprint', 'office_paper'],
                'glass': ['clear_glass', 'colored_glass'],
                'organic': ['food_scraps', 'green_waste', 'compost'],
                'general': ['household_trash', 'mixed', 'general_waste'],
              };
              const wasteLower = String(wasteType).toLowerCase();
              const isAccepted = accepted.some((mat: any) => {
                if (!mat) return false;
                let matStr = '';
                if (typeof mat === 'string') {
                  matStr = mat;
                } else if (typeof mat === 'object') {
                  matStr = mat.id || mat.name || '';
                }
                const matLower = String(matStr).toLowerCase();
                if (!matLower) return false;
                if (matLower === wasteLower) return true;
                const aliases = MATERIAL_ALIASES[matLower] || [];
                return aliases.includes(wasteLower);
              });
              if (!isAccepted) return; // Material type not accepted by this agent/driver
            }

            useNotificationStore.getState().playNotificationSound('New Mission Available 🚛', 'A new pickup request is on your radar.');
            get().fetchAvailableJobs();
          }
        }
      )
      // Listener 2: Handle UPDATES strictly assigned to this agent (Status changes, etc.)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `agent_id=eq.${userId}` }, 
        (payload: any) => {
          const newStatus = (payload.new as any).status;
          const oldStatus = (payload.old as any).status;
          
          get().fetchActiveJobs();
          
          // If a job was targeted to us and its status changed, refresh available pool too
          if (newStatus === 'pending' || oldStatus === 'pending') {
             get().fetchAvailableJobs();
          }
        }
      )
      .subscribe();
    set({ jobSubscription: sub });
  },

  cleanupJobs: () => {
    const sub = get().jobSubscription;
    if (sub) {
      sub.unsubscribe();
      set({ jobSubscription: null });
    }
  },

  fetchAvailableJobs: async () => {
    const { userId } = useAuthStore.getState();
    const { rejectedJobIds } = get();
    if (!userId) return;

    set({ isLoadingJobs: true });

    const { data, error } = await supabase.rpc('get_available_bookings', { agent_uuid: userId });
    if (!error && data) {
      const filteredJobs = (data as Booking[]).filter(b => !rejectedJobIds.includes(b.id));
      const userIds = [...new Set(filteredJobs.map(b => b.user_id).filter(Boolean))];
      const { data: profilesData } = userIds.length > 0 
        ? await supabase.from('profiles').select('id, name, phone').in('id', userIds)
        : { data: [] };
      const profileMap: Record<string, Partial<ProfileRow>> = Object.fromEntries(profilesData?.map((p: any) => [p.id, p]) || []);

      const mapped: AgentJob[] = filteredJobs.map(b => ({
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
          photo_url: b.photo_url,
          photoUrl: b.photo_url,
          photos: b.photo_url ? [b.photo_url] : [],
          phone: profileMap[b.user_id]?.phone || '',
          is_market_trade: b.is_market_trade || false
        })).filter(job => !job.is_market_trade);
      
      const available = mapped.filter(job => !rejectedJobIds.includes(job.id));
      const rejected = mapped.filter(job => rejectedJobIds.includes(job.id));

      set({ 
        availableJobs: available, 
        rejectedJobs: rejected,
        isLoadingJobs: false 
      });

      get().computeLocalHotspots();
    } else {
      set({ isLoadingJobs: false });
    }
  },

  computeLocalHotspots: () => {
    const { availableJobs, coachInsights } = get();
    if (availableJobs.length < 3) return;

    // Group by estate
    const clusters: Record<string, number> = {};
    availableJobs.forEach((job) => {
      const key = job.location || 'Unknown';
      clusters[key] = (clusters[key] || 0) + 1;
    });

    // Find the largest cluster
    const sortedClusters = (Object.entries(clusters) as [string, number][]).sort((a, b) => b[1] - a[1]);
    const topCluster = sortedClusters[0];

    if (topCluster && topCluster[1] >= 3) {
      const [topEstate, count] = topCluster;
      const hotspotInsight: CoachInsight = {
        id: `hotspot-${topEstate}`,
        type: 'hotspot',
        title: '🔥 Hotspot Detected!',
        message: `${count} missions available in ${topEstate}. Optimize your route now to maximize efficiency.`,
        action: 'Start Route',
        target: `/routes?estate=${topEstate}`,
        icon: '🔥'
      };

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
        const aiInsight: CoachInsight = {
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
    } catch (err: any) {
      console.warn('[AgentStore] Dynamic insights skipped:', err.message);
    }
  },

  fetchActiveJobs: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    const { data: bookingsData, error: bookingsError } = await supabase.rpc('get_active_agent_jobs', { agent_uuid: userId });
    if (bookingsError || !bookingsData) return;

    const typedBookings = bookingsData as Booking[];
    const userIds = [...new Set(typedBookings.map(b => b.user_id).filter(Boolean))];
    const { data: profilesData } = userIds.length > 0 
      ? await supabase.from('profiles').select('id, name, phone').in('id', userIds)
      : { data: [] };
    const profileMap: Record<string, Partial<ProfileRow>> = Object.fromEntries(profilesData?.map((p: any) => [p.id, p]) || []);

    const mapped: AgentJob[] = typedBookings.map(b => ({
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
      userId: b.user_id,
      agent_id: b.agent_id || '',
      customer: profileMap[b.user_id]?.name || 'Customer',
      phone: profileMap[b.user_id]?.phone || '',
      photo_url: b.photo_url,
      photoUrl: b.photo_url,
      photos: b.photo_url ? [b.photo_url] : [],
      notes: b.notes,
      is_market_trade: b.is_market_trade || false,
      booking_type: b.booking_type || null,
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
          callback();
        }
      )
      .subscribe();

    return channel;
  },

  fetchEarnings: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;
    
    try {
      // 1. Fetch Aggregated Stats via Backend RPC
      const { data: stats, error: rpcError } = await supabase.rpc('get_company_stats_v2', { 
        p_company_id: userId 
      });

      if (rpcError) throw rpcError;

      // 2. Fetch Job History (Last 50 for the UI list)
      const { data: historyData, error: historyError } = await supabase
        .from('bookings')
        .select('*')
        .eq('agent_id', userId) // For individual agents. For companies, we might want fleet history.
        .in('status', ['completed', 'cancelled', 'confirmed', 'in_progress', 'picked_up'])
        .order('updated_at', { ascending: false })
        .limit(50);

      if (historyError) throw historyError;

      if (stats) {
        set({
          earnings: {
            ...get().earnings,
            total: stats.total || 0,
            todayPayout: stats.todayPayout || 0,
            totalJobs: stats.totalJobs || 0,
            completedToday: stats.completedToday || 0,
            totalKg: stats.totalKgRecovered || 0,
            todayKg: stats.todayKg || 0,
            inventoryValue: stats.inventoryValue || 0,
            thisWeekKg: stats.thisWeekKg || 0,
            weeklyData: stats.weeklyData || [],
          },
          jobHistory: (historyData || []).map((b: any) => ({
            id: b.id,
            material: b.waste_type,
            location: b.estate,
            date: new Date(b.updated_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            completed_at: b.updated_at,
            status: b.status,
            pay: b.fee || 0,
            photo_url: b.photo_url,
            photoUrl: b.photo_url || null,
            photos: b.photo_url ? [b.photo_url] : [],
            bags: b.bags || 0,
            actual_weight_kg: b.actual_weight_kg || 0,
            time: b.time_slot || '',
            agent_id: b.agent_id || '',
            user_id: b.user_id || '',
            phone: b.profiles?.phone || '',
            customer: b.profiles?.name || 'Customer',
            total_price: b.total_price || 0,
            booking_type: b.booking_type || 'standard',
            fee: b.fee || 0,
            is_market_trade: b.is_market_trade || false,
            listing_id: b.listing_id || null
          }))
        });
      }
    } catch (err) {
      console.error('[AgentStore] fetchEarnings failed:', err);
    }
  },

  reviewSubscription: null,
  subscribeToReviews: () => {
    const { userId } = useAuthStore.getState();
    if (get().reviewSubscription || !userId) return;

    const sub = supabase
      .channel(`agent-reviews-${userId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'bookings', 
          filter: `agent_id=eq.${userId}` 
        }, 
        (payload) => {
          // If rating was added, refresh
          if (payload.new && (payload.new as any).agent_rating) {
            get().fetchReviews();
          }
        }
      )
      .subscribe();
    set({ reviewSubscription: sub });
  },

  cleanupReviews: () => {
    const sub = get().reviewSubscription;
    if (sub) {
      sub.unsubscribe();
      set({ reviewSubscription: null });
    }
  },

  fetchReviews: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;
    set({ isLoadingReviews: true });
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, agent_rating, agent_rating_comment, updated_at, waste_type, user_id')
        .eq('agent_id', userId)
        .not('agent_rating', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (bookingsError || !bookingsData) throw bookingsError;

      const userIds = [...new Set(bookingsData.map((b: any) => b.user_id).filter(Boolean))];
      const { data: profilesData } = userIds.length > 0 
        ? await supabase.from('profiles').select('id, name, avatar_url').in('id', userIds)
        : { data: [] };
      const profileMap: Record<string, Partial<ProfileRow>> = Object.fromEntries(profilesData?.map((p: any) => [p.id, p]) || []);

      set({ 
        recentReviews: bookingsData.map((b: any) => ({
          id: b.id,
          rating: b.agent_rating!,
          feedback: b.agent_rating_comment,
          date: new Date(b.updated_at!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          time: new Date(b.updated_at!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          wasteType: b.waste_type,
          customerName: profileMap[b.user_id]?.name || 'Customer',
          customerAvatar: profileMap[b.user_id]?.avatar_url
        })), 
        isLoadingReviews: false 
      });
    } catch (err) {
      console.error('[AgentStore] Fetch reviews failed:', err);
      set({ isLoadingReviews: false });
    }
  },

  acceptJob: async (jobId) => {
    try {
      const { userId, profile } = useAuthStore.getState();
      if (!userId) return false;
      const { error: updateError } = await supabase.rpc('accept_booking', { target_booking_id: jobId, assigned_agent_id: userId });
      if (updateError) throw updateError;
      await get().fetchAvailableJobs();
      await get().fetchActiveJobs();

      // Notify the Resident
      const job = get().activeJobs.find(j => j.id === jobId);
      if (job) {
        useNotificationStore.getState().addNotification(
          "Mission Accepted! 🚛",
          `Agent ${profile?.fullName || 'an Agent'} has claimed your pickup and is preparing to head your way.`,
          'success',
          'user',
          job.user_id
        );
      }

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
        p_agent_uuid: userId || '',
        p_weight_kg: weightKg,
        p_total_fee: 200 + (weightKg * 40)
      });
      if (updateError) throw updateError;
      
      // ── NEW: Sync Marketplace Offer Status ──
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
      
      const newLocation = { 
        ...(profile?.location as any),
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
