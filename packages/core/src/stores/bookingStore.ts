/**
 * bookingStore.ts — Logistics & Pickup Management
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbStorage } from '../offline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';
import { 
  BookingStore, 
  NearbyAgent 
} from './bookingStore.types';
import { 
  normalizeKeys, 
  BookingSchema, 
  Booking, 
  ProfileSchema,
  safeParseArray,
  safeParseOrNull
} from '../validation';

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
  bookings: [],
  liveAgents: [],
  aiSuggestions: [],
  isLoadingAI: false,
  selectedTime: null,
  activeVerificationBooking: null,
  bookingSubscription: null,
  agentSubscription: null,
  voiceModalOpen: false,
  voiceStep: 'idle',
  voiceResult: null,

  openVoiceModal: () => set({ voiceModalOpen: true, voiceStep: 'listening' }),
  closeVoiceModal: () => set({ voiceModalOpen: false, voiceStep: 'idle', voiceResult: null }),
  
  startVoiceRecognition: async () => {
    set({ voiceStep: 'listening' });
    await new Promise(r => setTimeout(r, 2000));
    set({ voiceStep: 'processing' });
    await new Promise(r => setTimeout(r, 1500));
    set({ 
      voiceStep: 'done', 
      voiceResult: { material: 'Plastic Bottles', weight: '5kg', location: 'My House' } 
    });
  },

  setActiveVerificationBooking: (booking) => set({ activeVerificationBooking: booking }),
  clearActiveVerification: () => set({ activeVerificationBooking: null }),

  fetchBookings: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('hidden_for_client', false)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const rawBookings = (data as any[]).map(b => normalizeKeys(b));
      const validBookings = safeParseArray(BookingSchema, rawBookings, 'Bookings Fetch');
      set({ bookings: validBookings });
    }
  },

  subscribeToBookings: async (userId: string) => {
    if (!userId) return;
    
    const existing = get().bookingSubscription;
    if (existing) supabase.removeChannel(existing);

    const channelName = `bookings-${userId}-${Date.now()}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings', 
        filter: `user_id=eq.${userId}` 
      }, (payload) => {
        const { eventType, new: newData, old: oldData } = payload;
        
        if (eventType === 'INSERT') {
          const normalized = normalizeKeys(newData);
          const validBooking = safeParseOrNull(BookingSchema, normalized, 'Realtime Booking Insert');
          if (validBooking) {
            set(state => {
              if (state.bookings.some(b => b.id === validBooking.id)) {
                return state; // Already exists
              }
              return { bookings: [validBooking, ...state.bookings] };
            });
          }
        } else if (eventType === 'UPDATE') {
          const normalized = normalizeKeys(newData);
          const oldNormalized = normalizeKeys(oldData);
          const validBooking = safeParseOrNull(BookingSchema, normalized, 'Realtime Booking Update');
          
          if (validBooking) {
            // Find existing booking in local state to check its previous status
            const existingBooking = get().bookings.find(b => b.id === validBooking.id);
            const justCompleted = validBooking.status === 'completed' && (!existingBooking || existingBooking.status !== 'completed');
            
            // Trigger Rating Modal if status just changed to completed
            if (justCompleted && !validBooking.agentRating) {
              set({ activeVerificationBooking: validBooking });
            }

            set(state => ({ 
              bookings: state.bookings.map(b => b.id === validBooking.id ? validBooking : b) 
            }));
          }
        } else if (eventType === 'DELETE') {
          set(state => ({ bookings: state.bookings.filter(b => b.id !== (oldData as any).id) }));
        }
      })
      .subscribe();

    set({ bookingSubscription: channel });
  },

  cleanupBookings: () => {
    const sub = get().bookingSubscription;
    if (sub) supabase.removeChannel(sub);
    set({ bookingSubscription: null });
  },

  fetchNearbyAgents: async (lat: number, lng: number, weight: number = 0) => {
    const { data, error } = await supabase.rpc('get_nearby_agents_dynamic', {
      p_lat: lat,
      p_lng: lng,
      p_weight: weight,
      p_max_results: 50,
      p_max_radius_km: 50
    });

    if (!error && data) {
      const rawAgents = (data as any[]).map(a => normalizeKeys(a));
      const validAgents = safeParseArray(ProfileSchema, rawAgents, 'Nearby Agents Fetch');
      set({ liveAgents: validAgents.map((p, index) => {
        const raw = rawAgents[index] || {};
        return {
          id: p.id,
          name: p.name || 'Agent',
          location: p.location,
          role: p.role,
          isOnline: p.isOnline,
          agentAccountType: p.agentAccountType,
          companyName: p.companyName,
          companyId: p.companyId,
          isHubActive: p.isHubActive,
          hubAddress: p.hubAddress,
          hubLocation: p.hubLocation,
          fleetInviteCode: p.fleetInviteCode,
          rating: p.rating || 4.9,
          phone: p.phone,
          klinflowId: p.klinflow_id,
          config: p.config,
          distance_km: raw.distanceKm || raw.pickupDistanceKm || raw.hubDistanceKm,
          pickupDistanceKm: raw.pickupDistanceKm,
          hubDistanceKm: raw.hubDistanceKm
        } as NearbyAgent;
      })});
    }
  },

  subscribeToAgents: (lat: number, lng: number, weight: number = 0) => {
    const existing = get().agentSubscription;
    if (existing) supabase.removeChannel(existing);

    const channel = supabase.channel('online-agents')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles', 
        filter: 'role=eq.agent' 
      }, () => {
        get().fetchNearbyAgents(lat, lng, weight);
      })
      .subscribe();

    set({ agentSubscription: channel });
  },

  cleanupAgents: () => {
    const sub = get().agentSubscription;
    if (sub) supabase.removeChannel(sub);
    set({ agentSubscription: null });
  },

  createBooking: async (bookingData) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return null;

    try {
      const timeVal = bookingData.time || bookingData.timeSlot || 'ASAP';
      const dateVal = timeVal.includes('@') ? timeVal.split('@')[0].trim() : new Date().toISOString().split('T')[0];
      const { generateTrackingId } = await import('../utils/tracking');

      const dbPayload: any = {
        tracking_id: generateTrackingId('BKG'),
        user_id: userId,
        waste_type: bookingData.wasteType,
        weight_kg: Number(bookingData.weight || bookingData.weightKg || bookingData.bags || 0),
        status: 'pending',
        total_price: Number(bookingData.totalPrice || 0),
        estate: bookingData.estate,
        latitude: bookingData.latitude,
        longitude: bookingData.longitude,
        time_slot: timeVal,
        preferred_date: dateVal,
        agent_id: bookingData.agentId || null,
        notes: bookingData.notes || '',
        photo_url: bookingData.photoUrl || null,
        booking_type: bookingData.bookingType || 'any',
        is_market_trade: bookingData.isMarketTrade || false,
        swarm_id: bookingData.swarmId || null,
        is_group_pickup: bookingData.isGroupPickup || false
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(dbPayload)
        .select()
        .single();

      if (error) throw error;

      const normalized = normalizeKeys(data);
      const newBooking = safeParseOrNull(BookingSchema, normalized, 'Create Booking');
      
      if (!newBooking) throw new Error('Invalid booking data returned from server.');
      
      set(state => {
        if (state.bookings.some(b => b.id === newBooking.id)) {
          return state; // Already exists
        }
        return { bookings: [newBooking, ...state.bookings] };
      });
      return newBooking;
    } catch (error) {
      console.error('Create booking failed:', error);
      return null;
    }
  },

  generateTimeSuggestions: async () => {
    set({ isLoadingAI: true });
    await new Promise(r => setTimeout(r, 1000));
    set({ 
      aiSuggestions: [
        { time: '10:00 AM', discount: 15, label: 'Eco-Saver (15% Off)', type: 'saver' },
        { time: '02:00 PM', discount: 10, label: 'Standard Slot', type: 'standard' },
        { time: '05:30 PM', discount: 20, label: 'Off-Peak (20% Off)', type: 'eco' }
      ],
      isLoadingAI: false 
    });
  },

  selectTime: (time) => set({ selectedTime: time }),



  submitAgentRating: async (bookingId, rating, comment) => {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        agent_rating: rating, 
        agent_rating_comment: comment || null 
      } as any)
      .eq('id', bookingId);

    if (!error) {
      set(state => ({
        bookings: state.bookings.map(b => b.id === bookingId ? { ...b, agent_rating: rating } : b)
      }));
    }
  },

  cancelBooking: async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      set(state => ({
        bookings: state.bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b)
      }));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  rescheduleBooking: async (bookingId, newDate, newTime, fullData) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          time_slot: `${newDate} ${newTime}`,
          status: 'pending'
        })
        .eq('id', bookingId);

      if (error) throw error;

      set(state => ({
        bookings: state.bookings.map(b => b.id === bookingId ? { ...b, status: 'pending', timeSlot: `${newDate} ${newTime}` } : b)
      }));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  clearBookingHistory: async (type) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      // 1. Mark in DB as hidden for this client
      const { error } = await supabase
        .from('bookings')
        .update({ hidden_for_client: true } as any)
        .eq('user_id', userId)
        .eq('status', type);

      if (error) throw error;

      // 2. Update local state
      set(state => ({
        bookings: state.bookings.filter(b => !(b.userId === userId && b.status === type))
      }));

      // 3. Still update the profile timestamp as a secondary fallback
      const column = type === 'completed' ? 'completed_cleared_at' : 'cancelled_cleared_at';
      const now = new Date().toISOString();
      await supabase
        .from('profiles')
        .update({ [column]: now } as any)
        .eq('id', userId);
      
      useAuthStore.getState().refreshProfile();
    } catch (err) {
      console.error('Clear history failed:', err);
      throw err;
    }
  }
}),
    {
      name: 'booking-store',
      storage: idbStorage,
      partialize: (state) => ({
        bookings: state.bookings.slice(0, 100), // Keep 100 recent
      })
    }
  )
);
