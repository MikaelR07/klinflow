export enum UserRole {
  USER = 'user',
  AGENT = 'agent',
  ADMIN = 'admin',
  BUSINESS = 'business',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export enum PickupStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface PickupJob {
  id: string;
  client_id: string;
  agent_id?: string;
  status: PickupStatus;
  scheduled_at: string;
  completed_at?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  waste_categories: string[];
  estimated_weight?: number;
  actual_weight?: number;
  price?: number;
}

export interface RecyclerListing {
  id: string;
  business_id: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  status: 'active' | 'sold' | 'expired';
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
}
