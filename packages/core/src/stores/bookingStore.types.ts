import { Booking } from '../validation';

export interface NearbyAgent {
  id: string;
  name: string;
  companyName?: string;
  location: any;
  role: string;
  isOnline: boolean;
  businessType?: string;
  isStaff?: boolean;
  agentAccountType?: string;
  companyId?: string;
  isHubActive?: boolean;
  hubAddress?: string;
  hubLocation?: { lat: number; lng: number } | null;
  fleetInviteCode?: string;
  rating?: number;
  phone?: string;
  klinflowId?: string;
  config?: any;
  distance_km?: number;
}

export interface AISuggestion {
  time: string;
  discount: number;
  label: string;
  type: string;
}

export interface BookingStore {
  bookings: Booking[];
  liveAgents: NearbyAgent[];
  aiSuggestions: AISuggestion[];
  isLoadingAI: boolean;
  selectedTime: any | null;
  activeVerificationBooking: Booking | null;
  bookingSubscription: any | null;
  agentSubscription: any | null;
  voiceModalOpen: boolean;
  voiceStep: 'idle' | 'listening' | 'processing' | 'done';
  voiceResult: any | null;
  openVoiceModal: () => void;
  closeVoiceModal: () => void;
  startVoiceRecognition: () => Promise<void>;
  setActiveVerificationBooking: (booking: Booking | null) => void;
  clearActiveVerification: () => void;
  subscribeToBookings: (userId: string) => Promise<void>;
  cleanupBookings: () => void;
  fetchNearbyAgents: (lat: number, lng: number) => Promise<void>;
  subscribeToAgents: (lat: number, lng: number) => void;
  cleanupAgents: () => void;
  fetchBookings: () => Promise<void>;
  clearBookingHistory: (type: string) => Promise<void>;
  createBooking: (booking: Partial<Booking> & Record<string, any>) => Promise<Booking | null>;
  generateTimeSuggestions: () => Promise<void>;
  selectTime: (time: any | null) => void;
  submitAgentRating: (bookingId: string, rating: number, comment?: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  rescheduleBooking: (bookingId: string, newDate: string, newTime: string, fullData?: any) => Promise<{ success: boolean; error?: string }>;
}
