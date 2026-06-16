import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';
import { useNotificationStore, NOTIFICATION_TYPES } from './notificationStore';
import { useAgentStore } from './agentStore';
import { toast } from 'sonner';
import { AssetStore, Asset } from './assetStore.types';

export const ASSET_GRADES = {
  A: { label: 'Grade A', description: 'Clean, sorted, industrial quality', multiplier: 1.2 },
  B: { label: 'Grade B', description: 'Mixed, minimal contamination', multiplier: 1.0 },
  C: { label: 'Grade C', description: 'Highly contaminated, needs heavy cleaning', multiplier: 0.7 },
};

export const MATERIAL_TYPES = {
  'Plastics': { name: 'Plastics', basePrice: 15 },
  'Metals': { name: 'Metals', basePrice: 30 },
  'Paper & Cardboard': { name: 'Paper & Cardboard', basePrice: 5 },
  'Glass': { name: 'Glass', basePrice: 5 },
  'E-Waste': { name: 'E-Waste', basePrice: 40 },
};

export const ASSET_SOURCES = {
  VERIFIED: 'verified',    // From Agent pickup
  SELF: 'self_declared',   // Side collection
};

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  liveFeed: [],
  isLoading: false,
  
  // ── CARBON COEFFICIENTS (KG CO2 saved per 1 KG recycled) ─────
  CARBON_FACTORS: {
    'plastics': 1.5,
    'pet': 1.5,
    'hdpe': 1.7,
    'metals': 1.5,
    'aluminium': 9.0,
    'paper': 0.9,
    'glass': 0.3,
    'ewaste': 2.0,
    'organic': 0.5,
    'default': 0.8
  },

  // ── HELPERS ────────────────────────────────────────────────
  calculateCarbonOffset: (materialType, weightKg) => {
    const factors = get().CARBON_FACTORS;
    const mat = (materialType || '').toLowerCase();
    const factor = factors[mat as keyof typeof factors] || factors['default'] || 0.8;
    return weightKg * factor;
  },

  generateDigitalBatchId: (materialType) => {
    const prefix = 'CF';
    const mat = (materialType || 'GEN').substring(0, 3).toUpperCase();
    const year = new Date().getFullYear().toString().substring(2);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${mat}-${year}-${random}`;
  },

  // ── FETCH ASSETS ───────────────────────────────────────────
  fetchAssets: async () => {
    const userId = useAuthStore.getState().userId;
    if (!userId) return;

    set({ isLoading: true });
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        booking:bookings (waste_type, estate, user_id),
        verifier:profiles!verifier_id (name),
        weaver:profiles!weaver_id (name)
      `)
      .eq('verifier_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      set({ assets: data, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  // ── LIVE FEED (Realtime ready) ─────────────────────────────
  fetchLiveFeed: async () => {
    console.log('[AssetStore] Fetching Live Feed...');
    const { data, error } = await supabase
      .from('assets')
      .select('*, booking:bookings(estate, waste_type)')
      .eq('status', 'deposited')
      .limit(20)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AssetStore] Live Feed Fetch ERROR:', error);
      return;
    }

    if (data) {
      console.log('[AssetStore] Live Feed Data Received:', data.length, 'items');
      set({ liveFeed: data });
    }
  },

  // ── VERIFY ASSET (CALLED BY AGENT) ──────────────────────────
  verifyAsset: async (bookingId, verificationData) => {
    const { userId, profile } = useAuthStore.getState();
    if (!userId) throw new Error('Not authenticated');

    console.log('[AssetStore] Starting verification for booking:', bookingId);
    console.log('[AssetStore] Verification Payload:', verificationData);

    set({ isLoading: true });

    try {
      // 0. Check for existing asset to prevent duplicates
      const { data: existing } = await supabase
        .from('assets')
        .select('id')
        .eq('booking_id', bookingId)
        .maybeSingle();
      
      if (existing) {
        console.log('[AssetStore] Asset already exists for this booking:', existing.id);
        set({ isLoading: false });
        return existing;
      }

      // 1. Calculate Payout Value (Using new Hierarchical Pricing)
      const agentStore = useAgentStore.getState();
      const materialSlug = verificationData.materialType.toLowerCase();
      const subcategorySlug = verificationData.grade?.toLowerCase();
      
      const agentRate = agentStore.getEffectivePrice(materialSlug, subcategorySlug);
      
      const materialValue = verificationData.estimatedValue ?? (verificationData.weightKg * agentRate);
      const netPayout = materialValue; 
      const clientEarnedCash = materialValue * 0.90; // Resident receives 90% (10% platform fee)
      const clientGFP = Math.floor(verificationData.weightKg * 2);

      const isManual = verificationData.isManual || false;
      
      let finalOwnerId = verificationData.ownerId;
      if (!finalOwnerId) {
         console.warn('[AssetStore] ownerId missing from verificationData. Recovering from bookings table...');
         const { data: bData } = await supabase.from('bookings').select('user_id').eq('id', bookingId).single();
         finalOwnerId = bData?.user_id;
      }
      
      console.log('[AssetStore] Starting verification payload processing.', {
          bookingId,
          ownerId: finalOwnerId,
          clientEarnedCash
      });

      // 2. Create Asset Record
      console.log('[AssetStore] Inserting into assets table...');
      const digitalBatchId = get().generateDigitalBatchId(verificationData.materialType);
      const carbonOffset = get().calculateCarbonOffset(verificationData.materialType, verificationData.weightKg);
      
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .insert({
          booking_id: bookingId,
          verifier_id: userId,
          material_type: verificationData.materialType,
          grade: verificationData.grade,
          weight_kg: verificationData.weightKg,
          estimated_value: materialValue, // Gross value of material
          purity_score: verificationData.purityScore || 85,
          photo_url: verificationData.photoUrl || null,
          is_manual: isManual,
          status: 'verified',
          digital_batch_id: digitalBatchId,
          metadata: {
            carbon_offset_kg: carbonOffset,
            chain_of_custody: [
              { action: 'verified', actor: profile?.fullName || 'Agent', timestamp: new Date().toISOString(), id: userId }
            ]
          }
        })
        .select()
        .single();

      if (assetError) {
        console.error('[AssetStore] Asset INSERT ERROR:', assetError);
        throw assetError;
      }

      // 4. Trigger Payout & Complete Booking
      console.log('[AssetStore] Triggering Payout RPC (Pure Trade)...', { clientEarnedCash, clientGFP, weightKg: verificationData.weightKg });
      const { error: payoutError } = await supabase.rpc('complete_booking_split_payout', {
        p_booking_uuid: bookingId,
        p_agent_uuid: userId,
        p_client_uuid: finalOwnerId,
        p_weight_kg: verificationData.weightKg,
        p_estimated_value: materialValue,
        p_client_gfp: clientGFP,
        p_is_manual: isManual
      });

      if (payoutError) {
        console.error('[AssetStore] Payout RPC Error:', payoutError);
        throw payoutError;
      }

      // (Track points are now natively handled by the complete_booking_split_payout RPC)

      // 5. User Feedback
      toast.success('Earnings Confirmed! 💰', {
        description: `KSh ${clientEarnedCash.toLocaleString()} has been sent to the resident's wallet.`
      });

      set(state => ({ assets: [asset as any, ...state.assets], isLoading: false }));
      return asset as any;
    } catch (err) {
      console.error('[AssetStore] Verification Failure:', err);
      set({ isLoading: false });
      throw err;
    }
  },

  // ── CLAIM ASSET (CALLED BY WEAVER) — Escrow-backed acquisition ──────────────────────────
  claimAsset: async (assetId) => {
    const { userId } = useAuthStore.getState();
    if (!userId) throw new Error('Not authenticated');

    set({ isLoading: true });

    try {
      console.log('[AssetStore] Claiming asset via Secure RPC...', assetId);
      const { error } = await supabase.rpc('weaver_claim_asset', {
        p_asset_id: assetId,
        p_weaver_id: userId
      });

      if (error) throw error;

      // Update local state
      set(state => ({
        liveFeed: state.liveFeed.filter(a => a.id !== assetId),
        isLoading: false
      }));

      console.log('[AssetStore] Asset claimed successfully!');
      return true;
    } catch (err) {
      console.error('[AssetStore] Claim Failed:', err);
      set({ isLoading: false });
      throw err;
    }
  },

  // ── ADD SIDE COLLECTION (WEAVER SELF-DECLARE) ────────────────
  addSideCollection: async (data) => {
    const { userId } = useAuthStore.getState();
    set({ isLoading: true });

    try {
      const material = MATERIAL_TYPES[data.materialType as keyof typeof MATERIAL_TYPES] || { basePrice: 10 };
      const estimatedValue = data.weightKg * material.basePrice;
      const digitalBatchId = get().generateDigitalBatchId(data.materialType);
      const carbonOffset = get().calculateCarbonOffset(data.materialType, data.weightKg);

      const { data: asset, error } = await supabase
        .from('assets')
        .insert({
          weaver_id: userId,
          material_type: data.materialType,
          weight_kg: data.weightKg,
          estimated_value: estimatedValue,
          status: 'matched', // Weavers own their side collection immediately
          source: ASSET_SOURCES.SELF,
          grade: 'B', // Default for self-declared
          digital_batch_id: digitalBatchId,
          metadata: {
            carbon_offset_kg: carbonOffset,
            chain_of_custody: [
              { action: 'self_declared', actor: 'Weaver', timestamp: new Date().toISOString(), id: userId }
            ]
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      set(state => ({ assets: [asset as any, ...state.assets], isLoading: false }));
      return asset as any;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  }
}));
