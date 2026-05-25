import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { FulfillmentOrder, DeliveryAssignment } from './fulfillmentStore.types';

interface FulfillmentStore {
  activeFulfillments: FulfillmentOrder[];
  dispatchQueue: FulfillmentOrder[];
  fleetAssignments: DeliveryAssignment[];
  isLoading: boolean;
  error: string | null;

  fetchActiveFulfillments: (userId: string, role: 'buyer' | 'seller' | 'agent' | 'company') => Promise<void>;
  fetchDispatchQueue: (companyId: string) => Promise<void>;
  fetchFleetAssignments: (driverId: string) => Promise<void>;
  updateFulfillmentStatus: (fulfillmentId: string, status: FulfillmentOrder['status'], notes?: string) => Promise<void>;
  assignDriver: (fulfillmentId: string, companyId: string, driverId: string) => Promise<void>;
  verifyMaterial: (fulfillmentId: string, weight: number, grade: string, contamination: number, photos: string[], code: string) => Promise<void>;
  subscribeToFulfillments: (userId: string) => () => void;
}

export const useFulfillmentStore = create<FulfillmentStore>((set, get) => ({
  activeFulfillments: [],
  dispatchQueue: [],
  fleetAssignments: [],
  isLoading: false,
  error: null,

  fetchActiveFulfillments: async (userId, role) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase.from('fulfillment_orders').select('*, rfq:rfqs(*), proposal:rfq_offers(*)');
      
      switch (role) {
        case 'seller': query = query.eq('seller_id', userId); break;
        case 'buyer': query = query.eq('buyer_id', userId); break;
        case 'agent': query = query.eq('assigned_agent_id', userId); break;
        case 'company': query = query.eq('organization_id', userId); break;
      }

      const { data, error } = await query
        .not('status', 'in', '("completed","cancelled")')
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
        .select('*, rfq:rfqs(*), proposal:rfq_offers(*)')
        .eq('organization_id', companyId)
        .eq('status', 'pending_coordination')
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ dispatchQueue: data as unknown as FulfillmentOrder[] });
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
        .select('*, fulfillment:fulfillment_orders(*, rfq:rfqs(*), proposal:rfq_offers(*))')
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

  verifyMaterial: async (fulfillmentId, weight, grade, contamination, photos, code) => {
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

      // 3. Update Order and Status to completed (skipping in_transit for simplicity in this flow)
      const { error: updateErr } = await supabase.from('fulfillment_orders').update({
        status: 'completed',
        verification_status: 'verified',
        payment_status: 'released',
        verified_weight: weight,
        quality_grade: grade,
        contamination_level: contamination
      }).eq('id', fulfillmentId);
      
      if (updateErr) throw updateErr;
      
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
}));
