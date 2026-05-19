export interface Asset {
  id: string;
  booking_id?: string | null;
  verifier_id?: string | null;
  weaver_id?: string | null;
  material_type: string;
  grade: string | null;
  weight_kg: number;
  estimated_value: number | null;
  purity_score: number | null;
  photo_url?: string | null;
  is_manual: boolean;
  status: string;
  digital_batch_id: string | null;
  metadata: any;
  created_at: string;
  booking?: any;
  verifier?: any;
  weaver?: any;
}

export interface AssetStore {
  assets: Asset[];
  liveFeed: Asset[];
  isLoading: boolean;
  CARBON_FACTORS: Record<string, number>;
  calculateCarbonOffset: (materialType: string, weightKg: number) => number;
  generateDigitalBatchId: (materialType: string) => string;
  fetchAssets: () => Promise<void>;
  fetchLiveFeed: () => Promise<void>;
  verifyAsset: (bookingId: string, verificationData: any) => Promise<Asset>;
  claimAsset: (assetId: string) => Promise<boolean>;
  addSideCollection: (data: any) => Promise<Asset>;
}
