import { UserRole } from '@klinflow/types';
import { Database } from '@klinflow/supabase';
import { Profile, NotificationPrefs } from '../validation';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  role: UserRole | string;
  profile: Profile | null;
  rewardPoints: number;
  walletBalance: number;
  userId: string | null;
  notificationPrefs: NotificationPrefs | any; // Keep any for now until all components are updated
  profileSubscription: any;
  isInitializing: boolean;
  appRole: string | null;
  
  // Session / Hydration
  initializeAuth: () => Promise<void>;
  setSession: (session: any) => Promise<void>;
  logout: () => Promise<void>;
  
  // Profile Actions
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  toggleOnline: (coords?: { latitude: number; longitude: number } | null) => Promise<void>;
  withdrawRewards: (amount: number) => Promise<void>;
  depositToWallet: (amount: number) => Promise<void>;
  
  // Auth Actions
  login: (phone: string, pin: string, forcedRole?: UserRole) => Promise<void>;
  register: (userData: any) => Promise<boolean>;
  checkAvailability: (phone: string) => Promise<boolean>;
  sendOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, token: string) => Promise<any>;
  checkAppRole: (currentApp: string) => void;
  
  // Internal Helpers (exposed for store logic)
  _mapProfile: (data: ProfileRow) => Profile | null;
  subscribeToProfileChanges: (uid: string) => void;
  
  // Public Helpers
  getRole: () => UserRole | null;
  hasRole: (role: UserRole) => boolean;
  getGFPMetrics: () => {
    tier: string;
    icon: string;
    nextTier: string;
    progress: number;
    points: number;
  };
}
