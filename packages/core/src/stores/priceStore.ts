import { create } from 'zustand';
import { supabase, Database } from '../lib/supabaseClient';

export type DBWasteCategory = Database['public']['Tables']['waste_categories']['Row'];

interface PriceStore {
  prices: DBWasteCategory[];
  isLoading: boolean;
  fetchPrices: () => Promise<void>;
  updatePrice: (id: string, newPrice: number) => Promise<{ success: boolean; error?: any }>;
  addPrice: (name: string, category: string, pricePerKg: number) => Promise<{ success: boolean; data?: DBWasteCategory; error?: string }>;
  deletePrice: (id: string) => Promise<{ success: boolean; error?: string }>;
  getPriceForMaterial: (idOrName: string) => number;
  getCategoryPrice: (categoryId: string) => number;
}

export const usePriceStore = create<PriceStore>((set, get) => ({
  prices: [],
  isLoading: false,

  fetchPrices: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('waste_categories')
        .select('*')
        .is('parent_category', null)
        .order('label');

      if (error) throw error;
      set({ prices: data || [] });
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updatePrice: async (id, newPrice) => {
    try {
      const { data, error } = await supabase
        .from('waste_categories')
        .update({ 
          price_per_kg: newPrice, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Update failed: Material record not found in database.');
      }
      
      set(state => ({
        prices: state.prices.map(p => p.id === id ? { ...p, price_per_kg: newPrice } : p)
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Error updating price:', error);
      return { success: false, error };
    }
  },

  addPrice: async (name, category, pricePerKg) => {
    try {
      const { data, error } = await supabase
        .from('waste_categories')
        .insert({
          label: name,
          slug: name.toLowerCase().replace(/ /g, '-'),
          category,
          price_per_kg: pricePerKg,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Insert blocked by database security policies.");
      
      set(state => ({ prices: [...state.prices, data] }));
      return { success: true, data };
    } catch (error) {
      console.error('Error adding price:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  deletePrice: async (id) => {
    try {
      const { data, error } = await supabase
        .from('waste_categories')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Delete blocked by database security policies.");
      
      set(state => ({ prices: state.prices.filter(p => p.id !== id) }));
      return { success: true };
    } catch (error) {
      console.error('Error deleting price:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  getPriceForMaterial: (idOrName) => {
    const { prices } = get();
    if (!idOrName || !prices.length) return 10;

    const search = idOrName.toLowerCase();
    
    const priceObj = prices.find(p => 
      p.id.toLowerCase() === search || 
      p.label.toLowerCase() === search || 
      p.slug === search
    );
    
    return priceObj ? priceObj.price_per_kg : 10;
  },

  getCategoryPrice: (categoryId) => {
    const { prices } = get();
    if (!categoryId || !prices.length) return 10;

    const cleanId = categoryId.replace('cat-', '').toLowerCase();
    
    const category = prices.find(p => 
      p.id.toLowerCase() === cleanId || 
      p.slug === cleanId
    );
    return category ? category.price_per_kg : 10;
  }
}));

