import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbStorage } from '../offline';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';
import { FulfillmentOrder, DeliveryAssignment } from './fulfillmentStore.types';

interface FulfillmentStore {
  activeFulfillments: FulfillmentOrder[];
  dispatchQueue: FulfillmentOrder[];
  residentDispatchQueue: any[]; // Using any to avoid importing Booking here if it causes a circular dep, or we can just use any for now
  marketplaceDispatchQueue: any[];
  fleetAssignments: DeliveryAssignment[];
  analyticsFulfillments: FulfillmentOrder[];
  residentRequests: any[];
  isLoading: boolean;
  error: string | null;

  fetchActiveFulfillments: (userId: string, role: 'buyer' | 'seller' | 'agent' | 'company') => Promise<void>;
  fetchDispatchQueue: (companyId: string) => Promise<void>;
  fetchResidentDispatchQueue: (companyId: string, fleetDriverIds?: string[]) => Promise<void>;
  fetchMarketplaceDispatchQueue: (companyId: string, userId?: string) => Promise<void>;
  assignMarketplaceDriver: (orderId: string, driverId: string, companyId: string) => Promise<void>;
  fetchResidentRequests: (companyId: string) => Promise<void>;
  acceptResidentRequest: (bookingId: string, companyId: string) => Promise<void>;
  declineResidentRequest: (bookingId: string, companyId: string) => Promise<void>;
  fetchResidentInboxAnalytics: (companyId: string) => Promise<any>;
  assignResidentDriver: (bookingId: string, driverId: string) => Promise<void>;
  fetchAnalyticsData: (companyId: string) => Promise<void>;
  fetchFleetAssignments: (driverId: string) => Promise<void>;
  updateFulfillmentStatus: (fulfillmentId: string, status: FulfillmentOrder['status'], notes?: string) => Promise<void>;
  assignDriver: (fulfillmentId: string, companyId: string, driverId: string) => Promise<void>;
  verifyMaterial: (fulfillmentId: string, materialName: string, weight: number, grade: string, contamination: number, photos: string[], code: string) => Promise<void>;
  subscribeToFulfillments: (userId: string) => () => void;
}

export const useFulfillmentStore = create<FulfillmentStore>()(
  persist(
    (set, get) => ({
  activeFulfillments: [],
  dispatchQueue: [],
  residentDispatchQueue: [],
  marketplaceDispatchQueue: [],
  residentRequests: [],
  fleetAssignments: [],
  analyticsFulfillments: [],
  isLoading: false,
  error: null,

  fetchActiveFulfillments: async (userId, role) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase.from('fulfillment_orders').select('*, seller:profiles!seller_id(name, avatar_url), rfq:rfqs!rfq_id(*), proposal:rfq_offers!proposal_id(*)');
      
      switch (role) {
        case 'seller': query = query.eq('seller_id', userId); break;
        case 'buyer': query = query.eq('buyer_id', userId); break;
        case 'agent': query = query.eq('assigned_agent_id', userId); break;
        case 'company': query = query.eq('organization_id', userId); break;
      }

      const { data, error } = await query
        .not('status', 'in', '(completed,cancelled)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ activeFulfillments: data as unknown as FulfillmentOrder[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDispatchQueue: async (companyId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('fulfillment_orders')
        .select('*, rfq:rfqs!rfq_id(*), proposal:rfq_offers!proposal_id(*)')
        .eq('organization_id', companyId)
        .eq('status', 'pending_coordination')
        .eq('delivery_method', 'agent_pickup')
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ dispatchQueue: data as unknown as FulfillmentOrder[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchResidentDispatchQueue: async (companyId, fleetDriverIds = []) => {
    set({ isLoading: true, error: null });
    try {
      const driverIdsStr = [companyId, ...fleetDriverIds].join(',');
      const { data, error } = await supabase
        .from('bookings')
        .select('*, resident:profiles!user_id(name, avatar_url, phone)')
        .or(`agent_id.in.(${driverIdsStr})`)
        .in('status', ['confirmed', 'scheduled', 'in_progress', 'picked_up'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ residentDispatchQueue: data || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMarketplaceDispatchQueue: async (companyId, userId) => {
    try {
      let query = supabase
        .from('marketplace_orders')
        .select(`
          *,
          listing:marketplace_listings!listing_id(
            id, location, photo_url, latitude, longitude, pickup_mode, material_category
          ),
          seller:profiles!seller_id(name, avatar_url, phone, is_verified)
        `);
        
      if (userId) {
        query = query.or(`company_id.eq.${companyId},buyer_id.eq.${userId}`);
      } else {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query
        .in('status', ['processing', 'pending'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Backfill listing data for sold listings (RLS may block)
      let orders = data || [];
      const needsBackfill = orders.filter(o => !o.listing && o.listing_id);
      if (needsBackfill.length > 0) {
        const listingIds = needsBackfill.map(o => o.listing_id);
        const { data: photos } = await supabase.rpc('get_listing_photos', { p_listing_ids: listingIds });
        if (photos && photos.length > 0) {
          const photoMap = new Map(photos.map((p: any) => [p.id, p]));
          orders = orders.map(o => {
            if (!o.listing && o.listing_id && photoMap.has(o.listing_id)) {
              const info = photoMap.get(o.listing_id)!;
              return { ...o, listing: { photo_url: info.photo_url, location: info.location, pickup_mode: info.pickup_mode } };
            }
            return o;
          });
        }
      }

      set({ marketplaceDispatchQueue: orders });
    } catch (err: any) {
      console.error('Failed to fetch marketplace dispatch queue:', err);
    }
  },

  assignMarketplaceDriver: async (orderId, driverId, companyId) => {
    try {
      // Get the order details
      const queue = get().marketplaceDispatchQueue;
      const order = queue.find(o => o.id === orderId);
      if (!order) throw new Error('Order not found');

      if (order.booking_id) {
        // Option A: Update existing auto-generated booking
        // Attempt a direct update first (succeeds if hub is the booking owner)
        const { error: directBookingError } = await supabase
          .from('bookings')
          .update({
            agent_id: driverId,
            status: 'in_progress',
            organization_id: companyId,
            weight_kg: order.quantity
          })
          .eq('id', order.booking_id);

        if (directBookingError) {
          // Fallback: If 403 Forbidden (RLS WITH CHECK violation because hub is only the assigned agent, not the owner),
          // update allowed fields first, then use RPC to securely transfer the agent assignment.
          const { error: partialUpdateError } = await supabase
            .from('bookings')
            .update({
              status: 'in_progress',
              organization_id: companyId,
              weight_kg: order.quantity
            })
            .eq('id', order.booking_id);
            
          if (partialUpdateError) throw partialUpdateError;

          const { profile } = useAuthStore.getState();
          if (!profile?.id) throw new Error("Missing user profile ID");
          
          const { error: assignError } = await supabase.rpc('rpc_assign_resident_driver', {
            p_booking_id: order.booking_id,
            p_company_id: profile.id, // Current owner is the hub admin profile
            p_driver_id: driverId
          });
          
          if (assignError) throw assignError;
        }

        // Update the marketplace order: change status to 'pending' (agent assigned)
        const { error: orderError } = await supabase
          .from('marketplace_orders')
          .update({ status: 'pending', agent_id: driverId })
          .eq('id', orderId);

        if (orderError) throw orderError;
      } else {
        // Fallback for legacy orders without an auto-generated booking
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            user_id: order.seller_id,
            agent_id: driverId,
            waste_type: order.material,
            status: 'in_progress',
            is_market_trade: true,
            total_price: order.total_price,
            preferred_date: new Date().toISOString().split('T')[0],
            photo_url: order.listing?.photo_url,
            weight_kg: order.quantity,
            estate: order.listing?.location,
            latitude: order.listing?.latitude,
            longitude: order.listing?.longitude,
            booking_type: order.listing?.pickup_mode === 'dropoff' ? 'dropoff' : 'marketplace_pickup',
            organization_id: companyId
          })
          .select().single();

        if (bookingError) throw bookingError;

        // Update the marketplace order: link booking + change status
        const { error: orderError } = await supabase
          .from('marketplace_orders')
          .update({ status: 'pending', booking_id: bookingData.id, agent_id: driverId })
          .eq('id', orderId);

        if (orderError) throw orderError;
      }

      // Optimistically remove from queue
      set(state => ({
        marketplaceDispatchQueue: state.marketplaceDispatchQueue.filter(o => o.id !== orderId)
      }));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to assign marketplace driver');
    }
  },

  fetchResidentRequests: async (companyId) => {
    set({ isLoading: true, error: null });
    try {
      console.log("[DEBUG Inbox] Fetching for company ID:", companyId);
      // Step 1: Fetch bookings via RPC (no .select() join — RPC doesn't support resource embedding)
      const { data: bookings, error } = await supabase.rpc('rpc_get_hub_inbox_requests', {
        p_company_id: companyId
      });

      console.log("[DEBUG Inbox] RPC returned bookings:", bookings, "Error:", error);

      if (error) throw error;
      if (!bookings || bookings.length === 0) {
        set({ residentRequests: [] });
        return;
      }

      // Step 2: Batch-fetch resident profiles for the bookings
      const userIds = [...new Set(bookings.map((b: any) => b.user_id).filter(Boolean))];
      let residentMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: residents } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, phone')
          .in('id', userIds);
        if (residents) {
          residents.forEach((r: any) => { residentMap[r.id] = r; });
        }
      }

      // Step 3: Merge resident data into bookings
      const enriched = bookings.map((b: any) => ({
        ...b,
        resident: residentMap[b.user_id] || null
      }));
      
      console.log("[DEBUG Inbox] Enriched resident requests to set in state:", enriched);
      set({ residentRequests: enriched });
    } catch (err: any) {
      console.error("[Hub Inbox] Error fetching resident requests:", err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  acceptResidentRequest: async (bookingId, companyId) => {
    try {
      // Use 1-argument accept_booking to avoid 409 Conflict (PGRST204 overloaded functions). 
      // This assigns it to the individual user profile (auth.uid()), which seamlessly allows 
      // the Hub admin to view it in fetchResidentDispatchQueue (which queries by agent_id = profile.id).
      const { error: claimError } = await supabase.rpc('accept_booking', { 
        target_booking_id: bookingId
      });
      
      if (claimError) throw claimError;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to accept pickup');
    }
  },

  declineResidentRequest: async (bookingId, companyId) => {
    try {
      const { error } = await supabase.rpc('rpc_decline_resident_booking', {
        p_booking_id: bookingId,
        p_company_id: companyId
      });
      if (error) throw error;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to decline request');
    }
  },

  assignResidentDriver: async (bookingId, driverId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('rpc_assign_resident_driver', {
        p_booking_id: bookingId,
        p_company_id: user.id,
        p_driver_id: driverId
      });
      
      if (error) throw error;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to assign driver');
    }
  },

  fetchResidentInboxAnalytics: async (companyId) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, resident:profiles!user_id(name, avatar_url, phone)')
        .eq('agent_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    } catch(err) {
      console.error(err);
      return [];
    }
  },

  fetchAnalyticsData: async (companyId) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch orders from last 7 days for weekly analytics
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('fulfillment_orders')
        .select('*, seller:profiles!seller_id(name, avatar_url), rfq:rfqs!rfq_id(*), proposal:rfq_offers!proposal_id(*)')
        .eq('organization_id', companyId)
        .in('status', ['completed', 'cancelled'])
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ analyticsFulfillments: data as unknown as FulfillmentOrder[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFleetAssignments: async (driverId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select('*, fulfillment:fulfillment_orders(*, seller:profiles!seller_id(name, avatar_url), rfq:rfqs!rfq_id(*), proposal:rfq_offers!proposal_id(*))')
        .eq('driver_id', driverId)
        .neq('assignment_status', 'rejected');

      if (error) throw error;
      set({ fleetAssignments: data as unknown as DeliveryAssignment[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateFulfillmentStatus: async (fulfillmentId, status, notes) => {
    try {
      const { error } = await supabase
        .from('fulfillment_orders')
        .update({ status })
        .eq('id', fulfillmentId);
        
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('fulfillment_status_history').insert({
          fulfillment_id: fulfillmentId,
          status,
          actor_id: user.id,
          notes
        });
      }
      
      // Update local state optimistic
      set(state => ({
        activeFulfillments: state.activeFulfillments.map(f => 
          f.id === fulfillmentId ? { ...f, status } : f
        ),
        dispatchQueue: state.dispatchQueue.filter(f => f.id !== fulfillmentId)
      }));

    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  assignDriver: async (fulfillmentId, companyId, driverId) => {
    try {
      const { error } = await supabase.from('delivery_assignments').insert({
        fulfillment_id: fulfillmentId,
        company_id: companyId,
        driver_id: driverId,
        assignment_status: 'pending'
      });
      if (error) throw error;

      // Set assigned_agent_id so the driver's Active Pickups page can find this order
      const { error: updateErr } = await supabase
        .from('fulfillment_orders')
        .update({ assigned_agent_id: driverId })
        .eq('id', fulfillmentId);
      if (updateErr) throw updateErr;

      await get().updateFulfillmentStatus(fulfillmentId, 'agent_assigned', `Assigned to driver ${driverId}`);
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  verifyMaterial: async (fulfillmentId, materialName, weight, grade, contamination, photos, code) => {
    try {
      // 1. Verify code
      const { data: order, error: orderErr } = await supabase
        .from('fulfillment_orders')
        .select('verification_code, proposal_id')
        .eq('id', fulfillmentId)
        .single();
        
      if (orderErr) throw orderErr;
      if (order.verification_code !== code) {
        throw new Error('Invalid verification code.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 2. Log Verification
      const { error: verifyErr } = await supabase.from('material_verifications').insert({
        fulfillment_id: fulfillmentId,
        submitted_weight: weight,
        verified_weight: weight,
        quality_grade: grade,
        contamination_level: contamination,
        photos,
        verified_by: user.id
      });
      if (verifyErr) throw verifyErr;

      // 3. Update Order and Wallet using RPC
      const { data: payoutData, error: updateErr } = await supabase.rpc('process_rfq_payout', {
        p_fulfillment_id: fulfillmentId,
        p_weight_kg: Number(weight),
        p_grade: grade,
        p_contamination: parseInt(String(contamination), 10)
      });
      
      if (updateErr) throw updateErr;
      
      // Fetch the material category first using the provided materialName
      const { data: catData } = await supabase.from('waste_categories').select('parent_category').eq('label', materialName).single();

      // Ensure the exact plain-english material name is saved to the asset that was just created
      await supabase.from('assets')
        .update({ 
          material_type: materialName,
          material_category: catData?.parent_category || null,
          sourcing_tag: 'RFQ'
        })
        .eq('booking_id', fulfillmentId);
      
      await supabase.from('fulfillment_status_history').insert({
        fulfillment_id: fulfillmentId,
        status: 'completed',
        actor_id: user.id,
        notes: `Material verified. Code: ${code}. Weight: ${weight}kg.`
      });

      // Optimistically update
      set(state => ({
        activeFulfillments: state.activeFulfillments.filter(f => f.id !== fulfillmentId)
      }));

    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  subscribeToFulfillments: (userId) => {
    const channel = supabase
      .channel(`fulfillments:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fulfillment_orders',
        filter: `seller_id=eq.${userId}` // or buyer_id etc, simplified for now
      }, () => {
        // Re-fetch appropriately or just generic fetch
        // In a real app we'd dispatch based on the user role to fetch active/dispatch/fleet appropriately
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}),
    {
      name: 'fulfillment-store',
      storage: idbStorage,
      partialize: (state) => ({
        activeFulfillments: state.activeFulfillments.slice(0, 100),
        dispatchQueue: state.dispatchQueue.slice(0, 100),
        fleetAssignments: state.fleetAssignments.slice(0, 100)
      })
    }
  )
);
