export type HubRole = 
  | 'operations_manager'
  | 'fleet_manager'
  | 'sales_manager'
  | 'finance_manager'
  | 'executive_viewer';

export type MembershipRole = 'owner' | 'member';

export interface HubContext {
  companyId: string;
  companyName: string;
  membershipRole: MembershipRole;  // 'owner' or 'member'
  hubRoles: HubRole[];         // department responsibilities
  hubPermissions: HubPermission[];
}

export type HubPermission = 
  | 'agent.view' | 'agent.create' | 'agent.update' | 'agent.approve' | 'agent.suspend' | 'agent.export'
  | 'vehicle.view' | 'vehicle.create' | 'vehicle.update' | 'vehicle.delete' | 'vehicle.assign'
  | 'dispatch.view' | 'dispatch.create' | 'dispatch.update' | 'dispatch.delete' | 'dispatch.reassign'
  | 'fuel.view' | 'fuel.manage'
  | 'maintenance.view' | 'maintenance.create' | 'maintenance.update' | 'maintenance.delete'
  | 'tracking.view'
  | 'fleet.settings'
  | 'fund_request.view' | 'fund_request.create' | 'fund_request.approve' | 'fund_request.reject' | 'fund_request.export'
  | 'payout.view' | 'payout.create' | 'payout.execute' | 'payout.export'
  | 'wallet.view' | 'wallet.transfer' | 'wallet.topup' | 'wallet.withdraw'
  | 'invoice.view' | 'invoice.create' | 'invoice.update' | 'invoice.delete'
  | 'procurement.view' | 'report.export' | 'treasury.view' | 'treasury.manage'
  | 'supplier.view' | 'supplier.create' | 'supplier.update' | 'supplier.onboard' | 'supplier.suspend' | 'supplier.risk' | 'supplier.compliance' | 'supplier.export'
  | 'rfq.view' | 'rfq.create' | 'rfq.update' | 'rfq.delete' | 'rfq.approve' | 'rfq.export'
  | 'contract.view' | 'contract.create' | 'contract.update' | 'contract.delete' | 'contract.approve' | 'contract.export'
  | 'marketplace.view' | 'marketplace.sell' | 'marketplace.buy' | 'marketplace.manage'
  | 'pricing.view' | 'pricing.set' | 'pricing.export'
  | 'buyer.view' | 'buyer.create' | 'buyer.update' | 'buyer.export'
  | 'intake.view' | 'intake.manage'
  | 'queue.view' | 'queue.manage'
  | 'inventory.view' | 'inventory.manage' | 'inventory.export'
  | 'dispute.view' | 'dispute.resolve' | 'dispute.escalate' | 'dispute.export'
  | 'processing.view'
  | 'user.view' | 'user.create' | 'user.update' | 'user.delete' | 'user.impersonate'
  | 'role.assign' | 'role.view' | 'role.update' | 'role.delete'
  | 'integration.view' | 'integration.manage'
  | 'settings.view' | 'settings.manage'
  | 'analytics.view' | 'analytics.export';

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
