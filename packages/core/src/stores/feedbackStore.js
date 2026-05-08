/**
 * feedbackStore.js — CleanFlow KE App Reviews (Supabase)
 * Writes user reviews to `app_reviews` table.
 * Admin reads all reviews. Users only write.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient.js';

export const useFeedbackStore = create((set, get) => ({
  feedbackList: [],
  isLoading: false,

  // Admin: fetch all reviews from Supabase
  fetchFeedback: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('app_reviews')
      .select('*, profiles:user_id(role, business_type)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Map to camelCase for UI
      const mapped = data.map(r => ({
        id: r.id,
        userId: r.user_id,
        name: r.name,
        phone: r.phone,
        rating: r.rating,
        category: r.category,
        text: r.feedback,
        date: r.created_at,
        role: r.profiles?.role || 'public',
        businessType: r.profiles?.business_type || null,
        sourceApp: r.source_app || 'client'
      }));
      set({ feedbackList: mapped });
    }
    set({ isLoading: false });
  },

  // Client: submit new feedback
  submitFeedback: async (payload) => {
    console.log("SUBMITTING FEEDBACK:", payload);
    const { data, error } = await supabase.from('app_reviews').insert({
      user_id: payload.userId || null,
      name: payload.name || 'Anonymous',
      phone: payload.phone || null,
      rating: payload.rating,
      category: payload.category,
      feedback: payload.text,
      source_app: payload.sourceApp || 'client',
    }).select();

    if (error) {
      console.error("SUBMISSION ERROR:", error);
      throw new Error(error.message);
    }
    
    console.log("SUBMISSION SUCCESS. VERIFIED RECORD:", data);

    // Optimistically add to local list
    set((state) => ({
      feedbackList: [
        {
          id: data?.[0]?.id || `FDBK-${Date.now()}`,
          ...payload,
          date: new Date().toISOString(),
        },
        ...state.feedbackList,
      ],
    }));
  },

  // Admin: delete a single review
  deleteFeedback: async (id) => {
    const { error } = await supabase.from('app_reviews').delete().eq('id', id);
    if (error) throw new Error(error.message);
    set((state) => ({
      feedbackList: state.feedbackList.filter(f => f.id !== id),
    }));
  },

  // Admin: clear all reviews
  clearAllFeedback: async () => {
    const { error } = await supabase.from('app_reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
    if (error) throw new Error(error.message);
    set({ feedbackList: [] });
  },
}));
