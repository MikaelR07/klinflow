import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';
import { 
  MarketIntelligencePayload, 
  CommodityTrend, 
  Hotspot, 
  MarketSignal,
  PriceAlert
} from './marketIntelligenceStore.types';

interface MarketIntelligenceStore {
  commodityTrends: CommodityTrend[];
  hotspots: Hotspot[];
  marketSignals: MarketSignal[];
  priceAlerts: PriceAlert[];
  isLoading: boolean;
  isLoadingAlerts: boolean;
  
  fetchIntelligence: () => Promise<void>;
  fetchPriceAlerts: () => Promise<void>;
  createPriceAlert: (material_grade: string, alert_type: 'above' | 'below', threshold_price: number) => Promise<{success: boolean; error?: any}>;
  togglePriceAlert: (id: string, is_active: boolean) => Promise<{success: boolean; error?: any}>;
  deletePriceAlert: (id: string) => Promise<{success: boolean; error?: any}>;
}

export const useMarketIntelligenceStore = create<MarketIntelligenceStore>((set, get) => ({
  commodityTrends: [],
  hotspots: [],
  marketSignals: [],
  priceAlerts: [],
  isLoading: false,
  isLoadingAlerts: false,

  fetchIntelligence: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.rpc('get_market_intelligence');
      if (error) throw error;
      if (data) {
        const payload = data as MarketIntelligencePayload;
        set({
          commodityTrends: payload.commodity_trends || [],
          hotspots: payload.hotspots || [],
          marketSignals: payload.market_signals || [],
        });
      }
    } catch (error) {
      console.error('Error fetching market intelligence:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPriceAlerts: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    set({ isLoadingAlerts: true });
    try {
      const { data, error } = await supabase
        .from('user_price_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        set({ priceAlerts: data as PriceAlert[] });
      }
    } catch (error) {
      console.error('Error fetching price alerts:', error);
    } finally {
      set({ isLoadingAlerts: false });
    }
  },

  createPriceAlert: async (material_grade, alert_type, threshold_price) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('user_price_alerts')
        .insert({
          user_id: userId,
          material_grade,
          alert_type,
          threshold_price,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      set(state => ({ priceAlerts: [data as PriceAlert, ...state.priceAlerts] }));
      return { success: true };
    } catch (error) {
      console.error('Error creating price alert:', error);
      return { success: false, error };
    }
  },

  togglePriceAlert: async (id, is_active) => {
    try {
      const { error } = await supabase
        .from('user_price_alerts')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        priceAlerts: state.priceAlerts.map(a => a.id === id ? { ...a, is_active } : a)
      }));
      return { success: true };
    } catch (error) {
      console.error('Error toggling price alert:', error);
      return { success: false, error };
    }
  },

  deletePriceAlert: async (id) => {
    try {
      const { error } = await supabase
        .from('user_price_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        priceAlerts: state.priceAlerts.filter(a => a.id !== id)
      }));
      return { success: true };
    } catch (error) {
      console.error('Error deleting price alert:', error);
      return { success: false, error };
    }
  }
}));
