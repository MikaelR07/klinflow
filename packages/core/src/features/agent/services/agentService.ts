import { supabase } from '../../../lib/supabaseClient';
import type { ProfileRow, AgentConfiguration, Booking } from '../store/agentStore.types';

export const AgentService = {
  fetchFleetDrivers: async (companyId: string): Promise<Partial<ProfileRow>[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, phone, is_online, location, reward_points, avatar_url, wallet_balance, rating')
      .eq('company_id', companyId)
      .order('name');
      
    if (error) throw error;
    return data as Partial<ProfileRow>[];
  },

  fetchAgentConfig: async (agentId: string): Promise<AgentConfiguration | null> => {
    const { data, error } = await supabase
      .from('agent_configurations')
      .select('*')
      .eq('agent_id', agentId)
      .maybeSingle();
      
    if (error) throw error;
    return data as AgentConfiguration | null;
  },

  updateAgentConfig: async (agentId: string, updates: Partial<AgentConfiguration>): Promise<AgentConfiguration> => {
    const { data, error } = await supabase
      .from('agent_configurations')
      .upsert({ ...updates, agent_id: agentId, updated_at: new Date().toISOString() }, { onConflict: 'agent_id' })
      .select()
      .single();
      
    if (error) throw error;
    return data as AgentConfiguration;
  }
};
