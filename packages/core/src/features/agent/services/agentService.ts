import { supabase } from '../../../lib/supabaseClient';
import type { ProfileRow, AgentConfiguration, Booking } from '../store/agentStore.types';

export const AgentService = {
  fetchFleetDrivers: async (companyId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .rpc('get_fleet_agents_with_stats', { target_company_id: companyId });
      
    if (error) throw error;
    return data || [];
  },

  fetchFleetAnalytics: async (companyId: string): Promise<any> => {
    const { data, error } = await supabase
      .rpc('get_fleet_dashboard_analytics', { target_company_id: companyId });
      
    if (error) throw error;
    return data;
  },

  fetchFleetVehicles: async (companyId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('*, profiles!assigned_agent_id(name)')
      .eq('company_id', companyId);
      
    if (error) throw error;
    return data?.map(v => ({...v, assigned_agent: { name: v.profiles?.name } })) || [];
  },

  addFleetVehicle: async (vehicleData: any): Promise<any> => {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .insert([vehicleData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  updateFleetVehicle: async (id: string, updates: any): Promise<any> => {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  deleteFleetVehicle: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('fleet_vehicles')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
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
