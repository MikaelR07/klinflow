import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export interface OperatingHour {
  active: boolean;
  start: string;
  end: string;
}

export interface OperatingHours {
  [key: string]: OperatingHour;
}

interface SystemStore {
  config: Record<string, any>;
  isLoading: boolean;
  operatingHours: OperatingHours;
  supportPhone: string;
  whatsappNumber: string;
  isLoaded: boolean;
  fetchConfig: () => Promise<void>;
  updateConfig: (key: string, newValue: any) => Promise<{ success: boolean; error?: any }>;
  updateOperatingHours: (hours: OperatingHours) => Promise<{ success: boolean }>;
  getConfigValue: (key: string, defaultValue?: any) => any;
}

export const useSystemStore = create<SystemStore>((set, get) => ({
  config: {},
  isLoading: false,
  isLoaded: false,

  get supportPhone() {
    return (this as any).config['support_number']?.value || '+254 700 000 000';
  },
  get whatsappNumber() {
    return (this as any).config['whatsapp_number']?.value || '254700000000';
  },

  operatingHours: {
    monday: { active: true, start: '08:00', end: '18:00' },
    tuesday: { active: true, start: '08:00', end: '18:00' },
    wednesday: { active: true, start: '08:00', end: '18:00' },
    thursday: { active: true, start: '08:00', end: '18:00' },
    friday: { active: true, start: '08:00', end: '18:00' },
    saturday: { active: true, start: '09:00', end: '16:00' },
    sunday: { active: false, start: '09:00', end: '13:00' }
  },

  fetchConfig: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('system_config').select('*');
      if (error) throw error;
      
      const configMap = data.reduce((acc: any, item: any) => {
        acc[item.key] = item;
        return acc;
      }, {});

      set({ config: configMap, isLoaded: true });
    } catch (err) {
      console.error('Error fetching system config:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateConfig: async (key, newValue) => {
    try {
      const { error } = await supabase
        .from('system_config')
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
      
      const { config } = get();
      set({ config: { ...config, [key]: { ...config[key], value: newValue } } });
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  updateOperatingHours: async (hours) => {
    set({ operatingHours: hours });
    return { success: true };
  },

  getConfigValue: (key, defaultValue = 0) => {
    const { config } = get();
    return config[key] ? config[key].value : defaultValue;
  }
}));
