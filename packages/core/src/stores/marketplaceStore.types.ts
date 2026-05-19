import { Database } from '@klinflow/supabase';
import { 
  MarketplaceListing, 
  MarketplaceOrder, 
  MarketplaceOffer 
} from '../validation';

export type Listing = Database['public']['Tables']['marketplace_listings']['Row'];
export type Order = Database['public']['Tables']['marketplace_orders']['Row'];
export type Offer = Database['public']['Tables']['marketplace_offers']['Row'];

export interface MarketplaceStore {
  listings: MarketplaceListing[];
  myListings: MarketplaceListing[];
  myOrders: MarketplaceOrder[];
  receivedOrders: MarketplaceOrder[];
  receivedOffers: MarketplaceOffer[];
  sentOffers: MarketplaceOffer[];
  categories: any[];
  isLoading: boolean;
  fetchListings: () => Promise<void>;
  fetchMyActivity: () => Promise<void>;
  fetchReceivedOrders: () => Promise<void>;
  createListing: (listingData: Partial<MarketplaceListing>) => Promise<MarketplaceListing | null>;
  deleteListing: (id: string) => Promise<void>;
  clearClosedListings: () => Promise<void>;
  updateListingStatus: (id: string, status: string) => Promise<void>;
  placeOrder: (listing: MarketplaceListing, quantity: number, message?: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  disputeOrder: (orderId: string, reason: string) => Promise<void>;
  getFinancialSummary: () => Promise<any>;
  requestTransport: (order: MarketplaceOrder) => Promise<void>;
  releaseEscrow: (order: MarketplaceOrder) => Promise<void>;
  verifyAndRelease: (orderId: string, digitalIds: string[]) => Promise<void>;
  getCalculatedScore: (receivedOrders: MarketplaceOrder[], profile: any) => number;
  fetchIncomingOffers: () => Promise<void>;
  makeOffer: (listing: MarketplaceListing, price: number, quantity: number) => Promise<void>;
  acceptOffer: (offer: MarketplaceOffer) => Promise<void>;
  declineOffer: (offerId: string) => Promise<void>;
  fetchReceivedOffers: () => Promise<void>;
  fetchSentOffers: () => Promise<void>;
  subscribeToReceivedOffers: (userId: string) => any;
}
