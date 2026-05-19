import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";
import type { LendingState } from "./lendingStore.types";

export const useLendingStore = create<LendingState>((set, get) => ({
  isLoading: false,
  error: null,
  loans: [],

  // Implement strictly namespaced actions here
}));
