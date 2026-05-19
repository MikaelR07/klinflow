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
}

const DEFAULT_CATEGORIES: ServiceCategory[] = [
  { id: 'general', label: 'General Waste', icon: '🗑️', description: 'Regular household trash', is_active: true },
  { id: 'recyclable', label: 'Recyclable', icon: '♻️', description: 'Plastics, Paper, Cardboard', is_active: true },
  { id: 'organic', label: 'Organic / Food', icon: '🍎', description: 'Food scraps and greens', is_active: true },
  { id: 'metal', label: 'Metal', icon: '⛓️', description: 'Scrap metal, cans, tins', is_active: true },
  { id: 'ewaste', label: 'E-Waste', icon: '💻', description: 'Electronics, batteries', is_active: true },
  { id: 'bulky', label: 'Bulky Item', icon: '🛋️', description: 'Furniture, mattresses', is_active: true },
  { id: 'appliances', label: 'Large Appliances', icon: '🧊', description: 'Fridges, Washers, Cookers', is_active: true },
  { id: 'plastic', label: 'Plastic', icon: '🥤', description: 'PET bottles, containers, bags', is_active: true },
  { id: 'paper', label: 'Paper & Cardboard', icon: '📦', description: 'Newspapers, boxes, flyers', is_active: true },
];

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
        .order('label');

      if (!error && data && data.length > 0) {
        set({ categories: data as ServiceCategory[] });
      } else {
        set({ categories: DEFAULT_CATEGORIES });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({ categories: DEFAULT_CATEGORIES });
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
        .from('material_prices')
        .select('*');

      if (!error && data) {
        set({ materialPrices: data });
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
  }
}));
