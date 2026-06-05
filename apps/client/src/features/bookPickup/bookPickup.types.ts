/**
 * BookPickup Types — Extracted from BookPickup.tsx
 */

export interface BookPickupLocation {
  estate: string;
  latitude: number;
  longitude: number;
}

export interface BookPickupAgent {
  id: string;
  name?: string;
  companyName?: string;
  companyId?: string;
  agentAccountType: 'independent' | 'company_admin' | 'fleet_driver';
  isOnline?: boolean;
  rating?: number;
  fleetInviteCode?: string;
  config?: any;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface BookPickupCategory {
  id: string;
  label: string;
  slug?: string;
  icon?: string;
  image_url?: string;
}

export interface BookPickupSelectedItem {
  id: string;
  label: string;
  price_per_unit: number;
  unit: string;
  slug: string;
}
