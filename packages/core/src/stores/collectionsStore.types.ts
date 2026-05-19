export interface CollectionsCase {
  id: string;
  loan_id: string;
  profile_id: string;
  status: "OPEN" | "CONTACTING" | "RESTRUCTURING" | "ESCALATED" | "CLOSED" | "FAILED";
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    company_name: string | null;
  };
  lending_loans?: {
    outstanding_balance_ksh: number;
    due_date: string;
  };
}

export interface CollectionsState {
  isLoading: boolean;
  error: string | null;
  cases: CollectionsCase[];
  fetchCases: () => Promise<void>;
}
