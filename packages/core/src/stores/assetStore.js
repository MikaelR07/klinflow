/**
 * assetStore.js — CleanFlow KE Waste-as-Asset Management
 * Handles verified assets, grading logic, and weaver matching.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient.js';
import { useAuthStore } from './authStore.js';
import { useNotificationStore, NOTIFICATION_TYPES } from './notificationStore.js';
import { usePriceStore } from './priceStore.js';
import { useAgentStore } from './agentStore.js';
import { toast } from 'sonner';

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

export const useAssetStore = create((set, get) => ({
  assets: [],
  liveFeed: [],
  isLoading: false,

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
      
      const materialValue = verificationData.weightKg * agentRate;
      const netPayout = materialValue; 
      const clientEarnedCash = materialValue;
      const clientGFP = Math.floor(verificationData.weightKg * 2);

      const isManual = verificationData.isManual || false;

      // 2. Create Asset Record
      console.log('[AssetStore] Inserting into assets table...');
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
          status: 'verified'
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
        p_client_uuid: verificationData.ownerId,
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

      // 6. Notify Resident
      await useNotificationStore.getState().addNotification(
        'Money Received! 💸',
        `You just earned KSh ${clientEarnedCash.toLocaleString()} and ${clientGFP} GFP from your recyclables!`,
        NOTIFICATION_TYPES.SUCCESS,
        'user',
        verificationData.ownerId
      );

      set(state => ({ assets: [asset, ...state.assets], isLoading: false }));
      return asset;
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
      const material = MATERIAL_TYPES[data.materialType] || { basePrice: 10 };
      const estimatedValue = data.weightKg * material.basePrice;

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
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      set(state => ({ assets: [asset, ...state.assets], isLoading: false }));
      return asset;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  }
}));
