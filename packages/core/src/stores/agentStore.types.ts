import { Database } from '@klinflow/supabase';

export type AgentConfiguration = Database['public']['Tables']['agent_configurations']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];

export interface AgentJob {
  id: string;
  material: string | null;
  bags: number;
  actual_weight_kg: number;
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
  thisWeekKg?: number;
  residentPickups?: number;
  marketTrades?: number;
  weeklyData: { day: string; weight: number }[];
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
  fleetDrivers: Partial<Profile>[];
  isLoadingFleet: boolean;
  fetchFleetDrivers: () => Promise<void>;
  agentConfig: AgentConfiguration | null;
  isLoadingConfig: boolean;
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
