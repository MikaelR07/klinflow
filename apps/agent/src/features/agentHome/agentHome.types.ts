/**
 * AgentHome Types
 * Extracted from AgentHome.tsx
 */

export interface AgentEarningsData {
  today: string | number;
  completedToday: number;
}

export interface AgentJobHistoryItem {
  id?: string;
  status: string;
  wasteType: string;
  location?: string;
  date: string;
}

export interface AgentPickupOrder {
  id: string;
  status: string;
  pickup_address: string;
  created_at: string;
  rfq?: {
    category: string;
  };
}
