/**
 * MarketHub Types
 * Extracted from MarketHub.tsx
 */

export interface SystemFee {
  key: string;
  label: string;
  value: number;
  unit: string;
}

export interface NetworkStats {
  avgMinWeight: number;
  avgMaxCapacity: number;
}

export interface MarketHubCategory {
  id: string;
  label: string;
  description: string;
  icon?: string;
  image_url?: string;
  is_active: boolean;
}

export interface MarketHubMaterial {
  id: string;
  material_name: string;
  category: string;
  price_per_kg: number;
}
