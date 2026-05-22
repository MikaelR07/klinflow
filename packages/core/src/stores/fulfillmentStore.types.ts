export type FulfillmentStatus = 
  | 'pending_coordination'
  | 'pickup_scheduled'
  | 'agent_assigned'
  | 'agent_on_the_way'
  | 'arrived'
  | 'material_verification'
  | 'pickup_completed'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type DeliveryMethod = 'agent_pickup' | 'self_drop' | 'flexible';

export interface FulfillmentOrder {
  id: string;
  rfq_id: string;
  proposal_id: string;
  buyer_id: string;
  seller_id: string;
  assigned_agent_id?: string;
  organization_id?: string;
  delivery_method: DeliveryMethod;
  pickup_address?: string;
  dropoff_address?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  estimated_arrival?: string;
  status: FulfillmentStatus;
  verification_code: string;
  payment_status: string;
  verification_status: string;
  actual_weight?: number;
  verified_weight?: number;
  quality_grade?: string;
  contamination_level?: number;
  completion_notes?: string;
  cancellation_reason?: string;
  dispute_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface FulfillmentStatusHistory {
  id: string;
  fulfillment_id: string;
  status: FulfillmentStatus;
  actor_id: string;
  notes?: string;
  created_at: string;
}

export interface DeliveryAssignment {
  id: string;
  fulfillment_id: string;
  company_id: string;
  driver_id: string;
  assignment_status: 'pending' | 'accepted' | 'rejected' | 'reassigned';
  dispatch_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialVerification {
  id: string;
  fulfillment_id: string;
  submitted_weight: number;
  verified_weight: number;
  quality_grade: string;
  contamination_level: number;
  photos: string[];
  notes?: string;
  verified_by: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  fulfillment_id: string;
  raised_by: string;
  dispute_type: string;
  evidence_photos: string[];
  description?: string;
  status: 'open' | 'investigating' | 'resolved';
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}
