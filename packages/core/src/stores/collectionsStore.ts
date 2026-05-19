import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";
import type { CollectionsState, CollectionsCase } from "./collectionsStore.types";

export const useCollectionsStore = create<CollectionsState>((set) => ({
  isLoading: false,
  error: null,
  cases: [],

  fetchCases: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("collections_cases")
        .select(`
          *,
          profiles:profile_id (
            first_name,
            last_name,
            company_name
          ),
          lending_loans:loan_id (
            outstanding_balance_ksh,
            due_date
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ cases: data as unknown as CollectionsCase[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  }
}));
