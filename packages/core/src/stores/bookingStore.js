/**
 * bookingStore.js — CleanFlow KE Pickup Logistics (Supabase)
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient.js';
import { useAuthStore } from './authStore.js';
import { useSystemStore } from './systemStore.js';
import { useNotificationStore, NOTIFICATION_TYPES } from './notificationStore.js';

export const useBookingStore = create((set, get) => ({
  bookings: [],
  liveAgents: [],
  aiSuggestions: [],
  isLoadingAI: false,
  selectedTime: null,
  activeVerificationBooking: null, 
  bookingSubscription: null,
  agentSubscription: null,

  // ── Voice Booking State ───────────────────────────────
  voiceModalOpen: false,
  voiceStep: 'idle', // 'idle' | 'listening' | 'processing' | 'done'
  voiceResult: null,

  openVoiceModal: () => set({ voiceModalOpen: true, voiceStep: 'idle', voiceResult: null }),
  closeVoiceModal: () => set({ voiceModalOpen: false, voiceStep: 'idle', voiceResult: null }),
  
  startVoiceRecognition: async () => {
    set({ voiceStep: 'listening' });
    
    // Simulate listening for 2 seconds
    setTimeout(() => {
      set({ voiceStep: 'processing' });
      
      // Simulate AI processing for 1.5 seconds
      setTimeout(() => {
        set({ 
          voiceStep: 'done',
          voiceResult: {
            transcript: "I need a pickup for 10kg of recyclables tomorrow morning",
            wasteType: "recyclable",
            weight: 10,
            estate: useAuthStore.getState().profile?.location?.estate || "South B",
            time: "Tomorrow, 09:00 AM"
          }
        });
      }, 1500);
    }, 2000);
  },
  
  setActiveVerificationBooking: (booking) => set({ activeVerificationBooking: booking }),
  clearActiveVerification: () => set({ activeVerificationBooking: null }),

  // ── Realtime Booking Listener ───────────────────────────
  subscribeToBookings: async (userId) => {
    // ── DEV BYPASS ──
    if (userId === '00000000-0000-0000-0000-000000000000') return;

    const existing = get().bookingSubscription;
    if (existing) {
      supabase.removeChannel(existing);
    }
    
    // Use a unique channel ID to prevent "after subscribe" errors
    const channelName = `user-bookings-${userId}-${Date.now()}`;
    const sub = supabase.channel(channelName)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `user_id=eq.${userId}` }, 
        (payload) => {
          const updated = payload.new;
          console.log('[BookingStore] REAL-TIME UPDATE RECEIVED:', updated.id, updated.status);
          
          if (updated.status === 'picked_up') {
            set({ activeVerificationBooking: updated });
            useNotificationStore.getState().playNotificationSound();
          }
          get().fetchBookings();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[BookingStore] Subscribed to live updates');
        }
      });
      
    set({ bookingSubscription: sub });
  },

  cleanupBookings: () => {
    if (get().bookingSubscription) {
      get().bookingSubscription.unsubscribe();
      set({ bookingSubscription: null });
    }
  },

  fetchNearbyAgents: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, company_name, location, role, is_online, business_type, is_staff, agent_account_type, company_id, is_hub_active, hub_address, hub_location')
      .eq('role', 'agent')
      .or('is_online.eq.true,is_hub_active.eq.true');

    if (!error && data) {
      const mapped = data.map(a => ({ ...a, isStaff: a.is_staff }));
      set({ liveAgents: mapped });
      get().generateTimeSuggestions();
    }
  },

  subscribeToAgents: () => {
    if (get().agentSubscription) return;
    const sub = supabase
      .channel('public:online-agents')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles', filter: "role=eq.agent" }, 
        () => get().fetchNearbyAgents()
      )
      .subscribe();
    set({ agentSubscription: sub });
  },

  cleanupAgents: () => {
    if (get().agentSubscription) {
      get().agentSubscription.unsubscribe();
      set({ agentSubscription: null });
    }
  },

  fetchBookings: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('hidden_for_client', false)
      .order('created_at', { ascending: false });

    if (!error) set({ bookings: data });
  },

  clearBookingHistory: async (type) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    const { error } = await supabase
      .from('bookings')
      .update({ hidden_for_client: true })
      .eq('user_id', userId)
      .eq('status', type);

    if (error) throw error;
    get().fetchBookings();
  },

  createBooking: async (booking) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    // Generate H3 index for the booking location (Resolution 7 is standard for ~5km clusters)
    let h3_index = null;
    try {
      if (booking.latitude && booking.longitude) {
        const h3 = await import('h3-js');
        h3_index = h3.latLngToCell(booking.latitude, booking.longitude, 7);
      }
    } catch (e) { console.warn('H3 indexing failed', e); }

    const { data, error } = await supabase.from('bookings').insert({
      user_id: userId,
      waste_type: booking.wasteType,
      bags: booking.weight || booking.bags, 
      fee: booking.amount || 0, 
      total_price: booking.totalPrice || 0,
      photo_url: booking.photoUrl,
      estate: booking.estate,
      latitude: booking.latitude,
      longitude: booking.longitude,
      h3_index: h3_index,
      status: 'pending',
      agent_id: booking.agentId,
      time_slot: booking.time,
      booking_type: booking.bookingType || 'any',
      preferred_date: new Date().toISOString().split('T')[0],
      notes: booking.notes || ''
    }).select().single();

    if (error) throw error;
    get().fetchBookings();
    return data;
  },

  // ── SMART ASAP ENGINE ──
  generateTimeSuggestions: async () => {
    const { operatingHours, fetchConfig, isLoaded } = useSystemStore.getState();
    if (!isLoaded) await fetchConfig();
    
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const config = operatingHours[currentDay];
    const liveAgents = get().liveAgents;

    const currentHour = now.getHours();
    const isWithinCompanyHours = config?.active && 
                                 currentHour >= Number(config.start.split(':')[0]) && 
                                 currentHour < Number(config.end.split(':')[0]);
    
    const staffOnline = liveAgents.filter(a => a.isStaff);
    const freelancersOnline = liveAgents.filter(a => !a.isStaff);
    const totalOnline = liveAgents.length;

    const slots = [];

    if (totalOnline > 0) {
      let routeType = 'any';
      let subtitle = '';

      if (isWithinCompanyHours && staffOnline.length > 0) {
        routeType = 'staff';
        subtitle = `${staffOnline.length} CleanFlow agent${staffOnline.length > 1 ? 's' : ''} nearby`;
      } else if (freelancersOnline.length > 0) {
        routeType = 'freelance';
        subtitle = `${freelancersOnline.length} independent agent${freelancersOnline.length > 1 ? 's' : ''} available`;
      } else if (staffOnline.length > 0) {
        routeType = 'staff';
        subtitle = `${staffOnline.length} agent${staffOnline.length > 1 ? 's' : ''} available`;
      }

      slots.push({ 
        time: 'ASAP', 
        discount: 0, 
        label: subtitle,
        type: routeType 
      });
    }

    set({ aiSuggestions: slots });
  },

  selectTime: (time) => set({ selectedTime: time }),
  
  // ── WEIGHT VERIFICATION & COMPLETION ──
  verifyWeight: async (bookingId) => {
    console.log('[BookingStore] Verifying weight for:', bookingId);
    const { activeVerificationBooking } = get();
    if (!activeVerificationBooking) return;

    const weight = Number(activeVerificationBooking.actual_weight_kg) || 0;
    const pointsToAward = Math.floor(weight * 2);

    try {
      // Use the RPC for atomic payout and reward distribution
      const { data, error } = await supabase.rpc('client_releases_funds', {
        p_booking_uuid: bookingId,
        p_client_uuid: useAuthStore.getState().userId,
        p_client_gfp: pointsToAward
      });

      if (error) throw error;
      
      set({ activeVerificationBooking: null });
      get().fetchBookings();
      // Also refresh profile to see new balance/points
      useAuthStore.getState().fetchProfile();
    } catch (err) {
      console.error('[BookingStore] Verification Failed:', err);
      throw err;
    }
  },

  submitAgentRating: async (bookingId, rating, comment = '') => {
    // 1. Save the rating to the booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ 
        agent_rating: rating,
        agent_feedback: comment
      })
      .eq('id', bookingId)
      .select('agent_id')
      .single();
      
    if (error) throw error;

    // 2. Recalculate the agent's average rating from all their bookings
    if (booking?.agent_id) {
      const { data: ratings } = await supabase
        .from('bookings')
        .select('agent_rating')
        .eq('agent_id', booking.agent_id)
        .not('agent_rating', 'is', null);

      if (ratings && ratings.length > 0) {
        const avg = ratings.reduce((sum, r) => sum + Number(r.agent_rating), 0) / ratings.length;
        await supabase
          .from('profiles')
          .update({ rating: Math.round(avg * 10) / 10 })
          .eq('id', booking.agent_id);
      }
    }

    set({ activeVerificationBooking: null });
    get().fetchBookings();
  },

  cancelBooking: async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
      await get().fetchBookings();
      return { success: true };
    } catch (err) {
      console.error('[BookingStore] Cancel Error:', err);
      return { success: false, error: err.message };
    }
  },

  rescheduleBooking: async (bookingId, newDate, newTime, fullData = {}) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          preferred_date: newDate,
          time_slot: newTime,
          waste_type: fullData.wasteType,
          bags: fullData.weight,
          estate: fullData.estate,
          latitude: fullData.latitude,
          longitude: fullData.longitude,
          notes: fullData.notes,
          agent_id: fullData.agentId,
          photo_url: fullData.photoUrl,
          status: 'pending' // Reset to pending if it was confirmed to allow agent to re-accept
        })
        .eq('id', bookingId);

      if (error) throw error;
      await get().fetchBookings();
      return { success: true };
    } catch (err) {
      console.error('[BookingStore] Reschedule Error:', err);
      return { success: false, error: err.message };
    }
  },
}));
