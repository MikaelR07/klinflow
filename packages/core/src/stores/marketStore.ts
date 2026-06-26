import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export interface MaterialPrice {
  id: string;
  material_name: string;
  price_per_kg: number;
  demand?: string;
  supply?: string;
  change_ksh?: number;
  change_pct?: number;
  top_buyer?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketStore {
  materialPrices: MaterialPrice[];
  isLoading: boolean;
  error: string | null;
  fetchMaterialPrices: () => Promise<void>;
  updateMaterialPrice: (id: string, price: number) => Promise<void>;
  addMaterialPrice: (name: string, price: number) => Promise<void>;
  deleteMaterialPrice: (id: string) => Promise<void>;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  materialPrices: [],
  isLoading: false,
  error: null,

  fetchMaterialPrices: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('waste_categories')
        .select('id, material_name:label, price_per_kg, demand, supply, change_ksh, change_pct, top_buyer, created_at, updated_at')
        .order('label', { ascending: true });

      if (error) throw error;
      set({ materialPrices: (data as unknown) as MaterialPrice[] || [] });
    } catch (err: any) {
      console.error('Error fetching material prices:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateMaterialPrice: async (id: string, price: number) => {
    try {
      const { error } = await supabase
        .from('waste_categories')
        .update({ price_per_kg: price, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await get().fetchMaterialPrices();
    } catch (err: any) {
      console.error('Error updating material price:', err);
      throw err;
    }
  },

  addMaterialPrice: async (name: string, price: number) => {
    try {
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      const { error } = await supabase
        .from('waste_categories')
        .insert([{ 
          label: name, 
          slug: slug,
          price_per_kg: price,
          price_per_unit: price,
          is_active: true,
          demand: ['High', 'Critical', 'Stable', 'Low'][Math.floor(Math.random() * 4)],
          supply: ['High', 'Stable', 'Low'][Math.floor(Math.random() * 3)],
          change_ksh: Number((Math.random() * 10 - 5).toFixed(2)),
          change_pct: Number((Math.random() * 10 - 5).toFixed(2)),
          top_buyer: ['EcoPlastics Inc', 'GreenMetal Co.', 'PaperMills Ltd', 'GlassWorks', 'E-Waste Solutions', 'SustainaCo'][Math.floor(Math.random() * 6)]
        }]);

      if (error) throw error;
      await get().fetchMaterialPrices();
    } catch (err: any) {
      console.error('Error adding material price:', err);
      throw err;
    }
  },

  deleteMaterialPrice: async (id: string) => {
    try {
      const { error } = await supabase
        .from('waste_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchMaterialPrices();
    } catch (err: any) {
      console.error('Error deleting material price:', err);
      throw err;
    }
  }
}));
