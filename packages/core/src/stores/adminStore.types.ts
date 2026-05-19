export interface AdminStats {
  totalUsers: number;
  activeAgents: number;
  registeredAgents: number;
  totalBusinesses: number;
  totalRevenue: number;
  totalWeight: number;
  pendingJobs: number;
  rewardsLiabilities: number;
  premiumMembers: number;
  standardMembers: number;
  freeTierMembers: number;
  subscriptionRevenue: number;
  commissionRevenue: number;
  completedJobs?: number;
  totalSellers?: number;
}

export interface AdminStore {
  nemaModalOpen: boolean;
  isGeneratingReport: boolean;
  reportReady: boolean;
  reportData: any | null;
  isLoading: boolean;
  stats: AdminStats;
  revenueTrends: any[];
  materialDistribution: any[];
  highAlerts: any[];
  systemEvents: any[];
  agents: any[];
  unverifiedBusinesses: any[];
  b2bLogistics: any[];
  marketplaceFeed: any[];
  b2bMarketStats: any[];
  realtimeChannel: any | null;
  openNemaModal: () => void;
  closeNemaModal: () => void;
  refreshDashboardStats: () => Promise<void>;
  initAdminLiveFeed: () => void;
  addSystemEvent: (msg: string, type?: string) => void;
  initAgentTracking: () => Promise<() => void>;
  generateReport: () => void;
  fetchB2BData: () => Promise<void>;
  verifyBusiness: (profileId: string) => Promise<void>;
}
