import { Database } from '@klinflow/supabase';

export type AgentConfiguration = Database['public']['Tables']['agent_configurations']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];

export interface FleetAnalytics {
  weeklyPerformanceData: { day: string; pickups: number; weight: number }[];
  financialData: { day: string; deposits: number; payouts: number }[];
  complainsData: { day: string; complains: number }[];
}

export interface FleetVehicle {
  id: string;
  company_id: string;
  number_plate: string;
  vehicle_type: string | null;
  capacity_kg?: number;
  health_status?: string;
  assigned_agent_id: string | null;
  unregistered_agent_name?: string;
  status: string;
  last_service_date: string | null;
  next_service_date: string | null;
  assigned_agent?: { name: string };
}

export interface HubUnifiedPickup {
  id: string;
  source: 'Resident' | 'Seller';
  agent_id: string;
  client_name: string | null;
  location: string | null;
  materials: string[];
  est_weight: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AgentJob {
  id: string;
  material: string | null;
  bags?: number;
  actual_weight_kg: number;
  weight_kg?: number;
  location: string | null;
  time: string | null;
  status: string;
  agent_id: string | null;
  user_id: string;
  userId?: string;
  customerName?: string;
  customer?: string;
  bookingType?: string;
  booking_type?: string | null;
  notes?: string | null;
  pay: number;
  fee?: number;
  photo_url: string | null;
  photoUrl: string | null;
  photos: string[];
  phone: string;
  is_market_trade: boolean;
  is_group_pickup?: boolean;
  swarm_id?: string | null;
  listing_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  total_price?: number;
  completed_at?: string | null;
  date?: string;
}

export interface CoachInsight {
  id: string;
  type: string;
  title: string;
  message: string;
  action: string;
  target: string;
  icon: string;
}

export interface Earnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  lastWeek: number;
  completedToday: number;
  todayPayout: number;
  totalJobs: number;
  total: number;
  rating: number;
  totalInvestment?: number;
  inventoryValue?: number;
  totalKg?: number;
  todayKg?: number;
  yesterdayKg?: number;
  yesterdayPayout?: number;
  yesterdayJobs?: number;
  thisWeekKg?: number;
  residentPickups?: number;
  marketTrades?: number;
  weeklyData: { day: string; weight: number; payout: number; revenue: number }[];
}

export interface AgentReview {
  id: string;
  rating: number;
  feedback: string | null;
  date: string;
  wasteType: string | null;
  customerName: string;
  customerAvatar?: string | null;
}

export interface AgentComplaint {
  id: string;
  agent_id: string;
  company_id: string;
  type: string;
  description: string;
  priority: string;
  status: string;
  is_anonymous: boolean;
  resolution_note?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentStore {
  availableJobs: AgentJob[];
  activeJobs: AgentJob[];
  rejectedJobs: AgentJob[];
  jobHistory: AgentJob[];
  rejectedJobIds: string[];
  arrivedJobIds: string[];
  setJobArrived: (jobId: string) => void;
  earnings: Earnings;
  recentReviews: AgentReview[];
  isLoadingReviews: boolean;
  coachInsights: CoachInsight[];
  isLoadingJobs: boolean;
  currentInsightIndex: number;
  jobSubscription: { unsubscribe: () => void } | null;
  reviewSubscription: { unsubscribe: () => void } | null;
  fleetDrivers: (Partial<ProfileRow> & { 
    collections_today_kg?: number; 
    lifetime_kg?: number; 
    trips_completed?: number; 
    total_assigned_jobs?: number;
    lifetime_payouts?: number;
    vehicle_plate?: string;
    vehicle_type?: string;
  })[];
  isLoadingFleet: boolean;
  lastFleetFetch: number;
  fetchFleetDrivers: () => Promise<void>;
  fleetAnalytics: FleetAnalytics | null;
  isLoadingAnalytics: boolean;
  fetchFleetAnalytics: (companyId: string) => Promise<void>;
  fleetVehicles: FleetVehicle[];
  isLoadingVehicles: boolean;
  fetchFleetVehicles: (companyId: string) => Promise<void>;
  addFleetVehicle: (vehicleData: Partial<FleetVehicle>) => Promise<{ success: boolean; error?: string }>;
  updateFleetVehicle: (id: string, updates: Partial<FleetVehicle>) => Promise<{ success: boolean; error?: string }>;
  deleteFleetVehicle: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  hubPickups: HubUnifiedPickup[];
  isLoadingHubPickups: boolean;
  fetchHubPickups: (companyId: string) => Promise<void>;

  agentConfig: AgentConfiguration | null;
  isLoadingConfig: boolean;

  agentComplaints: AgentComplaint[];
  isLoadingComplaints: boolean;
  fetchAgentComplaints: (agentId: string) => Promise<void>;
  fetchHubAgentComplaints: (companyId: string, alternateId?: string) => Promise<void>;
  submitAgentComplaint: (agentId: string, companyId: string, payload: Partial<AgentComplaint>) => Promise<{ success: boolean; error?: string }>;
  updateAgentComplaintStatus: (complaintId: string, status: string, resolutionNote?: string) => Promise<{ success: boolean; error?: string }>;

  fetchAgentConfig: () => Promise<void>;
  getEffectivePrice: (categorySlug: string, subcategorySlug?: string) => number;
  updateAgentConfig: (updates: Partial<AgentConfiguration>) => Promise<{ success: boolean; error?: string }>;
  subscribeToJobs: () => void;
  cleanupJobs: () => void;
  subscribeToReviews: () => void;
  cleanupReviews: () => void;
  fetchAvailableJobs: () => Promise<void>;
  computeLocalHotspots: () => void;
  fetchDynamicInsights: () => Promise<void>;
  fetchActiveJobs: () => Promise<void>;
  subscribeToMissionUpdates: (callback: () => void) => { unsubscribe: () => void };
  fetchEarnings: () => Promise<void>;
  fetchReviews: () => Promise<void>;
  acceptJob: (jobId: string) => Promise<boolean>;
  rejectJob: (jobId: string) => Promise<void>;
  restoreJob: (jobId: string) => Promise<void>;
  completeJob: (jobId: string, weightKg: number) => Promise<void>;
  clearJobHistory: () => Promise<void>;
  nextInsight: () => void;
  broadcastLocation: (lat: number, lng: number, status?: string) => Promise<void>;
}
