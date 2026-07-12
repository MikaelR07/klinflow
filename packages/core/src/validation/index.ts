import { z } from 'zod';

/**
 * ── CASE NORMALIZATION UTILITIES ───────────────────────────────────────
 * Standardizes snake_case (DB) to camelCase (Domain/UI)
 */
export * from './utils';

export const toCamelCase = (str: string) => 
  str.replace(/([-_][a-z])/gi, ($1) => 
    $1.toUpperCase().replace('-', '').replace('_', '')
  );

export const normalizeKeys = <T extends object>(obj: T): any => {
  if (Array.isArray(obj)) return obj.map(v => normalizeKeys(v));
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = toCamelCase(key);
      const value = (obj as any)[key];
      acc[camelKey] = (value !== null && typeof value === 'object') ? normalizeKeys(value) : value;
      return acc;
    }, {} as any);
  }
  return obj;
};

/**
 * ── SHARED SCHEMAS ─────────────────────────────────────────────────────
 */

export const LocationSchema = z.object({
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  estate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  lastPulse: z.string().optional().nullable(),
});

export const NotificationPrefsSchema = z.object({
  push: z.boolean().default(true),
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  marketing: z.boolean().default(false),
  pickupReminders: z.boolean().default(true),
  aiInsights: z.boolean().default(true),
  rewardAlerts: z.boolean().default(true),
  emergencyAlerts: z.boolean().default(true),
  agentJobAlerts: z.boolean().default(true),
  systemAlerts: z.boolean().default(true),
  communityNews: z.boolean().default(true),
  feedbackAlerts: z.boolean().default(true),
  dailyKpi: z.boolean().default(false),
  staffAlerts: z.boolean().default(true),
  channel: z.string().default('push'),
});

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).nullable().optional(),
  fullName: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  klinflowId: z.string().nullable().optional(),
  role: z.string().default('user'),
  avatarUrl: z.string().nullable().optional(), // Removed .url() to allow emojis/paths
  avatar: z.string().nullable().optional(), // Added for compatibility
  walletBalance: z.number().default(0),
  rewardPoints: z.number().default(0),
  location: LocationSchema.nullable().optional(),
  isVerified: z.boolean().default(false),
  isOnline: z.boolean().default(false),
  estate: z.string().nullable().optional(),
  fleetInviteCode: z.string().nullable().optional(),
  businessType: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  nemaLicense: z.string().nullable().optional(),
  subscriptionTier: z.string().nullable().optional(),
  idNumber: z.string().nullable().optional(),
  fleetId: z.string().nullable().optional(), // Removed .uuid() for flexibility
  companyId: z.string().nullable().optional(), // Removed .uuid() for flexibility
  agentAccountType: z.string().nullable().optional(),
  isHubActive: z.boolean().default(false),
  hubAddress: z.string().nullable().optional(),
  hubLocation: LocationSchema.nullable().optional(),
  isEnRoute: z.boolean().default(false),
  hubTransferPin: z.string().nullable().optional(),
  hubConfig: z.record(z.string(), z.any()).nullable().optional(),
  serviceProfile: z.record(z.string(), z.any()).nullable().optional(),
  config: z.any().nullable().optional(),
  specializations: z.array(z.string()).nullable().optional(),
  gender: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  notificationPrefs: NotificationPrefsSchema.optional(),
  completedClearedAt: z.string().nullable().optional(),
  cancelledClearedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
  rating: z.preprocess((val) => {
    const n = Number(val ?? 0.0);
    return isNaN(n) ? 0.0 : n;
  }, z.number().default(0.0)),
});

export const BookingSchema = z.object({
  id: z.string(), // Removed .uuid() for mock support
  userId: z.string(), // Removed .uuid() for mock support
  agentId: z.string().nullable().optional(), // Removed .uuid() for mock support
  wasteType: z.string(),
  bags: z.number().int().nonnegative().optional(),
  weightKg: z.number().nonnegative().optional(),
  actualWeightKg: z.number().nonnegative().nullable().optional(),
  totalPrice: z.number().nonnegative().default(0),
  status: z.string(), // Relaxed enum to string for flexibility with custom statuses
  estate: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  timeSlot: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(), // Removed .url() for flexibility
  agentRating: z.number().int().min(1).max(5).nullable().optional(),
  agentRatingComment: z.string().nullable().optional(),
  isMarketTrade: z.boolean().default(false),
  bookingType: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  preferredDate: z.string().nullable().optional(),
  counterOfferAmount: z.number().nullable().optional(),
  counterOfferStatus: z.string().nullable().optional(),
  hiddenForClient: z.boolean().default(false),
  hiddenForAgent: z.boolean().default(false),
  createdAt: z.string().optional(), // Made optional
  updatedAt: z.string().nullable().optional(),
});

export const MarketplaceListingSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  material: z.string(),
  materialCategory: z.string().nullable().optional(),
  materialSubcategory: z.string().nullable().optional(),
  quantity: z.number().nonnegative(),
  pricePerKg: z.number().nonnegative(),
  unit: z.string().default('kg'),
  grade: z.string().optional(),
  status: z.enum(['active', 'sold', 'expired', 'cancelled']),
  photoUrl: z.string().nullable().optional(),
  photoUrls: z.array(z.string()).optional(),
  location: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  moq: z.number().nonnegative().optional(),
  aiMatchScore: z.number().optional(),
  sellerName: z.string().optional(),
  description: z.string().nullable().optional(),
  swarmId: z.string().uuid().nullable().optional(),
  isBulkDrive: z.boolean().default(false),
  groupMetadata: z.any().nullable().optional(),
  targetAgentId: z.string().uuid().nullable().optional(),
  pickupMode: z.string().default('pickup'),
  createdAt: z.string(),
});

export const MarketplaceOrderSchema = z.object({
  id: z.string().uuid(),
  listingId: z.string().uuid(),
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  material: z.string(),
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  status: z.enum(['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'disputed']),
  bookingId: z.string().uuid().nullable().optional(),
  pickupMode: z.string().default('pickup'),
  createdAt: z.string(),
});

export const MarketplaceOfferSchema = z.object({
  id: z.string().uuid(),
  listingId: z.string().uuid(),
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  offeredPrice: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().nonnegative(),
  status: z.enum(['pending', 'accepted', 'declined', 'cancelled', 'completed', 'paid', 'rejected']),
  material: z.string().optional(),
  photo: z.string().nullable().optional(),
  buyerName: z.string().optional(),
  createdAt: z.string().optional(),
  listing: z.any().optional(),
  emoji: z.string().optional(),
  price: z.number().optional(),
});

export const WalletTransactionSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  amount: z.number(), // Positive for credit, negative for debit
  type: z.enum(['topup', 'withdrawal', 'payout', 'escrow_lock', 'escrow_release', 'reward']),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.string(),
});

export const WithdrawalRequestSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['mpesa', 'bank', 'wallet']),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  accountDetails: z.string(),
  createdAt: z.string(),
});

export const IoTDeviceSchema = z.object({
  id: z.string(),
  type: z.enum(['bin', 'air', 'water']),
  name: z.string(),
  status: z.enum(['online', 'offline', 'maintenance']),
  batteryLevel: z.number().min(0).max(100).optional(),
  lastHeartbeat: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const TelemetryPayloadSchema = z.object({
  deviceId: z.string(),
  timestamp: z.string(),
  metrics: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
});

export const AppNotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  type: z.enum(['success', 'warning', 'reward', 'info', 'cargo', 'security', 'facility', 'system']).default('info'),
  targetRole: z.string().nullable().optional(),
  targetUser: z.string().uuid().nullable().optional(),
  isRead: z.boolean().default(false),
  read: z.boolean().default(false), // Logic alias
  createdAt: z.string(),
});

export const AssetSchema = z.object({
  id: z.string().uuid(),
  materialType: z.string(),
  grade: z.string().optional(),
  weightKg: z.number().nonnegative(),
  hubManagerId: z.string().uuid(),
  verifierId: z.string().uuid().optional(),
  status: z.enum(['collected', 'in_transit', 'transferred_to_hub', 'processed', 'sold', 'verified', 'available']),
  isManual: z.boolean().default(false),
  createdAt: z.string(),
});

/**
 * ── TYPE INFERENCE ─────────────────────────────────────────────────────
 */

export type Profile = z.infer<typeof ProfileSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type MarketplaceListing = z.infer<typeof MarketplaceListingSchema>;
export type MarketplaceOrder = z.infer<typeof MarketplaceOrderSchema>;
export type MarketplaceOffer = z.infer<typeof MarketplaceOfferSchema>;
export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;
export type WithdrawalRequest = z.infer<typeof WithdrawalRequestSchema>;
export type IoTDevice = z.infer<typeof IoTDeviceSchema>;
export type TelemetryPayload = z.infer<typeof TelemetryPayloadSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type NotificationPrefs = z.infer<typeof NotificationPrefsSchema>;
export type AppNotification = z.infer<typeof AppNotificationSchema>;
