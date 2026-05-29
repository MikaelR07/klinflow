import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export interface Swarm {
  id: string;
  creator_id: string;
  estate: string;
  material: string;
  target_weight: number;
  current_weight: number;
  description?: string;
  images?: string[];
  closes_at: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  participants_count?: number;
}

export interface SwarmParticipant {
  id: string;
  swarm_id: string;
  user_id: string;
  pledged_weight: number;
  actual_weight: number;
  material?: string;
  description?: string;
  images?: string[];
  status: 'pledged' | 'fulfilled' | 'withdrawn';
  created_at: string;
  profiles?: { name?: string; avatar_url?: string };
}

export interface CollectiveGoal {
  id: string;
  creator_id: string;
  estate: string;
  title: string;
  description: string;
  target_weight: number;
  current_weight: number;
  reward: string;
  closes_at: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  participants_count?: number;
}

export interface GoalParticipant {
  id: string;
  goal_id: string;
  user_id: string;
  pledged_weight: number;
  status: 'pledged' | 'fulfilled' | 'withdrawn';
  created_at: string;
  profiles?: { name?: string; avatar_url?: string };
}

interface CollectiveState {
  swarms: Swarm[];
  goals: CollectiveGoal[];
  estateStats: { totalRecovery: number; activeSellers: number } | null;
  loadingSwarms: boolean;
  loadingGoals: boolean;
  fetchSwarms: (estate: string) => Promise<void>;
  fetchGoals: (estate: string) => Promise<void>;
  fetchEstateStats: (estate: string) => Promise<void>;
  fetchSwarmById: (id: string) => Promise<{ swarm: Swarm | null; participants: SwarmParticipant[] }>;
  fetchGoalById: (id: string) => Promise<{ goal: CollectiveGoal | null; participants: GoalParticipant[] }>;
  createSwarm: (data: Partial<Swarm>) => Promise<{ success: boolean; data?: Swarm; error?: any }>;
  updateSwarm: (id: string, data: Partial<Swarm>) => Promise<{ success: boolean; error?: any }>;
  deleteSwarm: (id: string) => Promise<{ success: boolean; error?: any }>;
  joinSwarm: (data: Partial<SwarmParticipant>) => Promise<{ success: boolean; error?: any }>;
  createGoal: (data: Partial<CollectiveGoal>) => Promise<{ success: boolean; error?: any }>;
  joinGoal: (goalId: string, userId: string, weight: number) => Promise<{ success: boolean; error?: any }>;
  setupSubscriptions: (estate: string) => void;
  cleanupSubscriptions: () => void;
}

let swarmSub: any = null;
let goalSub: any = null;

export const useCollectiveStore = create<CollectiveState>((set, get) => ({
  swarms: [],
  goals: [],
  estateStats: null,
  loadingSwarms: false,
  loadingGoals: false,

  fetchSwarms: async (estate) => {
    set({ loadingSwarms: true });
    try {
      const { data, error } = await supabase
        .from('swarms')
        .select(`*, swarm_participants(count)`)
        .eq('estate', estate)
        .eq('status', 'active');
      
      if (error) throw error;
      
      const swarms = data.map((s: any) => ({
        ...s,
        participants_count: s.swarm_participants?.[0]?.count || 0
      }));
      set({ swarms });
    } catch (error) {
      console.error('Error fetching swarms:', error);
    } finally {
      set({ loadingSwarms: false });
    }
  },

  fetchGoals: async (estate) => {
    set({ loadingGoals: true });
    try {
      const { data, error } = await supabase
        .from('collective_goals')
        .select(`*, goal_participants(count)`)
        .eq('estate', estate)
        .eq('status', 'active');
      
      if (error) throw error;
      
      const goals = data.map((g: any) => ({
        ...g,
        participants_count: g.goal_participants?.[0]?.count || 0
      }));
      set({ goals });
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      set({ loadingGoals: false });
    }
  },

  fetchEstateStats: async (estate) => {
    try {
      // Get all active/completed swarms to calculate total recovery weight
      const { data: swarmsData } = await supabase
        .from('swarms')
        .select('current_weight')
        .eq('estate', estate);
        
      const { data: goalsData } = await supabase
        .from('collective_goals')
        .select('current_weight')
        .eq('estate', estate);

      let totalRecovery = 0;
      if (swarmsData) totalRecovery += swarmsData.reduce((acc, curr) => acc + (curr.current_weight || 0), 0);
      if (goalsData) totalRecovery += goalsData.reduce((acc, curr) => acc + (curr.current_weight || 0), 0);
      
      // Get count of active sellers in the estate
      // Depending on schema we match role and estate. If location is JSONB, we might need a specific query, 
      // but for simplicity we try to fetch profiles where role is seller
      const { count: activeSellers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seller');

      set({ estateStats: { totalRecovery: totalRecovery, activeSellers: activeSellers || 0 } });
    } catch (error) {
      console.error('Error fetching estate stats:', error);
    }
  },

  fetchSwarmById: async (id: string) => {
    try {
      const { data: swarmData, error: swarmError } = await supabase
        .from('swarms')
        .select(`*, swarm_participants(count)`)
        .eq('id', id)
        .single();
      if (swarmError) throw swarmError;

      const { data: participants, error: partError } = await supabase
        .from('swarm_participants')
        .select(`*, profiles:user_id(name, avatar_url)`)
        .eq('swarm_id', id)
        .neq('status', 'withdrawn');
      if (partError) throw partError;

      return {
        swarm: { ...swarmData, participants_count: swarmData?.swarm_participants?.[0]?.count || 0 } as Swarm,
        participants: (participants || []) as SwarmParticipant[]
      };
    } catch (error) {
      console.error('Error fetching swarm by ID:', error);
      return { swarm: null, participants: [] };
    }
  },

  fetchGoalById: async (id: string) => {
    try {
      const { data: goalData, error: goalError } = await supabase
        .from('collective_goals')
        .select(`*, goal_participants(count)`)
        .eq('id', id)
        .single();
      if (goalError) throw goalError;

      const { data: participants, error: partError } = await supabase
        .from('goal_participants')
        .select(`*, profiles:user_id(name, avatar_url)`)
        .eq('goal_id', id)
        .neq('status', 'withdrawn');
      if (partError) throw partError;

      return {
        goal: { ...goalData, participants_count: goalData?.goal_participants?.[0]?.count || 0 } as CollectiveGoal,
        participants: (participants || []) as GoalParticipant[]
      };
    } catch (error) {
      console.error('Error fetching goal by ID:', error);
      return { goal: null, participants: [] };
    }
  },

  createSwarm: async (data) => {
    try {
      const { data: resData, error } = await supabase
        .from('swarms')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: resData };
    } catch (error) {
      console.error('Error creating swarm:', error);
      return { success: false, error };
    }
  },

  updateSwarm: async (id: string, data: Partial<Swarm>) => {
    try {
      const { error } = await supabase
        .from('swarms')
        .update(data)
        .eq('id', id);
      if (!error) {
        set((state) => ({
          swarms: state.swarms.map(s => s.id === id ? { ...s, ...data } : s)
        }));
      }
      return { success: !error, error };
    } catch (error) {
      console.error('Error updating swarm:', error);
      return { success: false, error };
    }
  },

  deleteSwarm: async (id: string) => {
    try {
      const { error } = await supabase.from('swarms').delete().eq('id', id);
      if (!error) {
        set((state) => ({ swarms: state.swarms.filter(s => s.id !== id) }));
      }
      return { success: !error, error };
    } catch (error) {
      console.error('Error deleting swarm:', error);
      return { success: false, error };
    }
  },

  joinSwarm: async (data: Partial<SwarmParticipant>) => {
    try {
      const { error } = await supabase
        .from('swarm_participants')
        .insert(data);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error joining swarm:', error);
      return { success: false, error };
    }
  },

  createGoal: async (data) => {
    try {
      const { error } = await supabase
        .from('collective_goals')
        .insert(data);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error creating goal:', error);
      return { success: false, error };
    }
  },

  joinGoal: async (goalId, userId, weight) => {
    try {
      const { error } = await supabase
        .from('goal_participants')
        .upsert({
          goal_id: goalId,
          user_id: userId,
          pledged_weight: weight,
          status: 'pledged'
        });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error joining goal:', error);
      return { success: false, error };
    }
  },

  setupSubscriptions: (estate: string) => {
    if (swarmSub) supabase.removeChannel(swarmSub);
    if (goalSub) supabase.removeChannel(goalSub);

    swarmSub = supabase.channel('swarms_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'swarms', filter: `estate=eq.${estate}` }, () => {
        get().fetchSwarms(estate);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'swarm_participants' }, () => {
        get().fetchSwarms(estate);
      })
      .subscribe();

    goalSub = supabase.channel('goals_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collective_goals', filter: `estate=eq.${estate}` }, () => {
        get().fetchGoals(estate);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goal_participants' }, () => {
        get().fetchGoals(estate);
      })
      .subscribe();
  },

  cleanupSubscriptions: () => {
    if (swarmSub) {
      supabase.removeChannel(swarmSub);
      swarmSub = null;
    }
    if (goalSub) {
      supabase.removeChannel(goalSub);
      goalSub = null;
    }
  }
}));
