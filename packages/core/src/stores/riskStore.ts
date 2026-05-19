import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";
import type { RiskState, RiskScore, RiskEvent } from "./riskStore.types";

export const useRiskStore = create<RiskState>((set) => ({
  isLoading: false,
  error: null,
  scores: [],
  events: [],

  fetchScores: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("risk_scores")
        .select(`
          *,
          profiles:profile_id (
            first_name,
            last_name,
            company_name
          )
        `);

      if (error) throw error;
      set({ scores: data as unknown as RiskScore[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("risk_events")
        .select(`
          *,
          profiles:profile_id (
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ events: data as unknown as RiskEvent[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  }
}));
