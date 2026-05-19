import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export interface Feedback {
  id: string;
  userId: string | null;
  name: string;
  phone: string | null;
  rating: number;
  category: string;
  text: string;
  date: string;
  role: string;
  businessType: string | null;
  sourceApp: string;
}

interface FeedbackStore {
  feedbackList: Feedback[];
  isLoading: boolean;
  fetchFeedback: () => Promise<void>;
  submitFeedback: (payload: Partial<Feedback>) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;
  clearAllFeedback: () => Promise<void>;
}

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
  feedbackList: [],
  isLoading: false,

  fetchFeedback: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('app_reviews')
      .select('*, profiles:user_id(role, business_type)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped = data.map((r: any) => ({
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

  submitFeedback: async (payload) => {
    const { data, error } = await supabase.from('app_reviews').insert({
      user_id: payload.userId || null,
      name: payload.name || 'Anonymous',
      phone: payload.phone || null,
      rating: payload.rating || 0,
      category: payload.category || 'general',
      feedback: payload.text || '',
      source_app: payload.sourceApp || 'client',
    }).select();

    if (error) {
      throw new Error(error.message);
    }
    
    set((state) => ({
      feedbackList: [
        {
          id: data?.[0]?.id || `FDBK-${Date.now()}`,
          userId: payload.userId || null,
          name: payload.name || 'Anonymous',
          phone: payload.phone || null,
          rating: payload.rating || 0,
          category: payload.category || 'General',
          text: payload.text || '',
          sourceApp: payload.sourceApp || 'client',
          role: 'public',
          businessType: null,
          date: new Date().toISOString(),
        },
        ...state.feedbackList,
      ],
    }));
  },

  deleteFeedback: async (id) => {
    const { error } = await supabase.from('app_reviews').delete().eq('id', id);
    if (error) throw new Error(error.message);
    set((state) => ({
      feedbackList: state.feedbackList.filter(f => f.id !== id),
    }));
  },

  clearAllFeedback: async () => {
    const { error } = await supabase.from('app_reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
    if (error) throw new Error(error.message);
    set({ feedbackList: [] });
  },
}));
