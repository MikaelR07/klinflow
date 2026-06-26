import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export interface Dispute {
  id: string;
  fulfillment_id?: string;
  booking_id?: string;
  raised_by: string;
  dispute_type: string;
  evidence_photos: string[];
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
  raiser_name?: string;
  raiser_phone?: string;
  target_id?: string;
}

export interface DisputeStore {
  disputes: Dispute[];
  isLoading: boolean;
  error: string | null;
  fetchDisputes: (role?: string, userId?: string) => Promise<void>;
  createDispute: (data: Partial<Dispute>) => Promise<void>;
  updateDisputeStatus: (id: string, status: Dispute['status'], notes?: string) => Promise<void>;
}

export const useDisputeStore = create<DisputeStore>((set, get) => ({
  disputes: [],
  isLoading: false,
  error: null,

  fetchDisputes: async (role?: string, userId?: string) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase.from('disputes').select('*, profiles!raised_by(name, phone)');

      if (role && role !== 'admin' && userId) {
        query = query.eq('raised_by', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      const formatted = (data || []).map((d: any) => ({
        ...d,
        raiser_name: d.profiles?.name,
        raiser_phone: d.profiles?.phone,
      }));
      
      set({ disputes: formatted });
    } catch (err: any) {
      console.error('Error fetching disputes:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createDispute: async (data: Partial<Dispute>) => {
    try {
      const { error } = await supabase.from('disputes').insert([data]);
      if (error) throw error;
      
      // We could optionally re-fetch here if needed
      await get().fetchDisputes();
    } catch (err: any) {
      console.error('Error creating dispute:', err);
      throw err;
    }
  },

  updateDisputeStatus: async (id: string, status: Dispute['status'], notes?: string) => {
    try {
      const updateData: any = { status };
      if (notes) updateData.resolution_notes = notes;
      if (status === 'resolved') updateData.resolved_at = new Date().toISOString();

      const { error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      await get().fetchDisputes();
    } catch (err: any) {
      console.error('Error updating dispute:', err);
      throw err;
    }
  }
}));
