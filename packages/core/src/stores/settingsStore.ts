import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

interface SettingsStore {
  settings: Record<string, any>;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSetting: (id: string, value: any) => Promise<{ success: boolean; error?: any }>;
  getAgentCommission: () => number;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: {},
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase.from('system_settings').select('*');
    if (!error && data) {
      const mapped = Object.fromEntries(data.map((s: any) => [s.id, s.value]));
      set({ settings: mapped, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  updateSetting: async (id, value) => {
    const { error } = await supabase
      .from('system_settings')
      .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      set({ settings: { ...get().settings, [id]: value } });
      return { success: true };
    }
    return { success: false, error };
  },

  getAgentCommission: () => {
    return parseFloat(get().settings.agent_commission_rate || 0.70);
  }
}));
