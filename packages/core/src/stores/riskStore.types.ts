export interface RiskScore {
  id: string;
  profile_id: string;
  score_value: number;
  confidence_level: "LOW" | "MEDIUM" | "HIGH";
  risk_tier: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE" | "RED_FLAG";
  last_recalculated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    company_name: string | null;
  };
}

export interface RiskEvent {
  id: string;
  profile_id: string;
  event_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score_impact: number;
  metadata: any;
  is_resolved: boolean;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export interface RiskState {
  isLoading: boolean;
  error: string | null;
  scores: RiskScore[];
  events: RiskEvent[];
  fetchScores: () => Promise<void>;
  fetchEvents: () => Promise<void>;
}
