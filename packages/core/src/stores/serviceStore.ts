import { create } from 'zustand';
import { supabase, Database } from '../lib/supabaseClient';

export interface ServiceCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  is_active: boolean;
  slug?: string;
  price_per_unit?: number;
  image_url?: string;
}

interface ServiceStore {
  categories: ServiceCategory[];
  allCategories: ServiceCategory[];
  materialPrices: any[];
  isLoading: boolean;
  fetchCategories: () => Promise<void>;
  fetchAllCategories: () => Promise<void>;
  fetchMaterialPrices: () => Promise<void>;
  updateCategory: (id: string, updates: Partial<ServiceCategory>) => Promise<{ success: boolean; error?: any }>;
  toggleCategory: (id: string, isActive: boolean) => Promise<{ success: boolean; error?: any }>;
  addCategory: (category: Partial<ServiceCategory>) => Promise<{ success: boolean; data?: ServiceCategory; error?: any }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: any }>;
  addMaterialPrice: (materialName: string, category: string, pricePerKg: number) => Promise<{ success: boolean; error?: any }>;
  updateMaterialPrice: (id: string, updates: { material_name?: string; price_per_kg?: number }) => Promise<{ success: boolean; error?: any }>;
  deleteMaterialPrice: (id: string) => Promise<{ success: boolean; error?: any }>;
}

export const useServiceStore = create<ServiceStore>((set, get) => ({
  categories: [],
  allCategories: [],
  materialPrices: [],
  isLoading: false,

  fetchCategories: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('waste_categories')
        .select('*')
        .eq('is_active', true)
        .is('parent_category', null)
        .order('label');

      if (!error && data) {
        set({ categories: data as ServiceCategory[] });
      } else {
        set({ categories: [] });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({ categories: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAllCategories: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('waste_categories')
        .select('*')
        .is('parent_category', null)
        .order('label');

      if (!error && data) {
        set({ allCategories: data as ServiceCategory[] });
      }
    } catch (error) {
      console.error('Error fetching all categories:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMaterialPrices: async () => {
    try {
      const { data, error } = await supabase
        .from('waste_categories')
        .select('*')
        .not('parent_category', 'is', null);

      if (!error && data) {
        const mapped = data.map(d => ({
          id: d.id,
          material_name: d.label,
          category: d.parent_category,
          price_per_kg: d.price_per_kg
        }));
        set({ materialPrices: mapped });
      }
    } catch (error) {
      console.error('Error fetching material prices:', error);
    }
  },

  updateCategory: async (id, updates) => {
    try {
      // Filter out UI-only fields that are not in the database schema
      const { icon, description, price_per_unit, ...dbUpdates } = updates;
      
      const { error } = await supabase
        .from('waste_categories')
        .update({ 
          ...dbUpdates, 
          // Map price_per_unit to both price_per_unit and price_per_kg if present for absolute schema resilience
          ...(price_per_unit !== undefined ? { 
            price_per_unit: price_per_unit,
            price_per_kg: price_per_unit 
          } : {}),
          updated_at: new Date().toISOString() 
        } as any) // Cast as any because of potential material_prices mismatch elsewhere, but logic is sound
        .eq('id', id);

      if (error) throw error;
      
      const updater = (c: ServiceCategory) => c.id === id ? { ...c, ...updates } : c;
      set(state => ({
        categories: state.categories.map(updater),
        allCategories: state.allCategories.map(updater)
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Error updating category:', error);
      return { success: false, error };
    }
  },

  toggleCategory: async (id, isActive) => {
    return get().updateCategory(id, { is_active: isActive });
  },

  addCategory: async (category) => {
    try {
      const slug = (category.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      // Filter out UI-only fields
      const { icon, description, price_per_unit, ...dbFields } = category;

      const { data, error } = await supabase
        .from('waste_categories')
        .insert({ 
          ...dbFields, 
          slug, 
          is_active: true, 
          price_per_unit: price_per_unit || 0,
          price_per_kg: price_per_unit || 0 
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      const newCategory = {
        ...data,
        icon: icon || '🗑️',
        description: description || '',
        price_per_unit: data.price_per_kg
      } as ServiceCategory;

      set(state => ({
        categories: [...state.categories, newCategory],
        allCategories: [...state.allCategories, newCategory]
      }));
      
      return { success: true, data: newCategory };
    } catch (error) {
      console.error('Error adding category:', error);
      return { success: false, error };
    }
  },

  deleteCategory: async (id) => {
    try {
      const { error } = await supabase
        .from('waste_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      set(state => ({
        categories: state.categories.filter(c => c.id !== id),
        allCategories: state.allCategories.filter(c => c.id !== id)
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { success: false, error };
    }
  },

  addMaterialPrice: async (materialName, category, pricePerKg) => {
    try {
      const slug = materialName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const { data, error } = await supabase
        .from('waste_categories')
        .insert({ 
          label: materialName, 
          slug, 
          parent_category: category, 
          price_per_kg: pricePerKg,
          price_per_unit: pricePerKg,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      const mapped = {
        id: data.id,
        material_name: data.label,
        category: data.category,
        price_per_kg: data.price_per_kg
      };
      set(state => ({ materialPrices: [...state.materialPrices, mapped] }));
      return { success: true };
    } catch (error) {
      console.error('Error adding material price:', error);
      return { success: false, error };
    }
  },

  updateMaterialPrice: async (id, updates) => {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.material_name) {
        dbUpdates.label = updates.material_name;
        dbUpdates.slug = updates.material_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      if (updates.price_per_kg !== undefined) {
        dbUpdates.price_per_kg = updates.price_per_kg;
        dbUpdates.price_per_unit = updates.price_per_kg;
      }

      const { data, error } = await supabase
        .from('waste_categories')
        .update(dbUpdates)
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Update blocked by database policy");

      set(state => ({
        materialPrices: state.materialPrices.map(m => m.id === id ? { ...m, ...updates } : m)
      }));
      return { success: true };
    } catch (error) {
      console.error('Error updating material price:', error);
      return { success: false, error };
    }
  },

  deleteMaterialPrice: async (id) => {
    try {
      const { error } = await supabase
        .from('waste_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        materialPrices: state.materialPrices.filter(m => m.id !== id)
      }));
      return { success: true };
    } catch (error) {
      console.error('Error deleting material price:', error);
      return { success: false, error };
    }
  }
}));
