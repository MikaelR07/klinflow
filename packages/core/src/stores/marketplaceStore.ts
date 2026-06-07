/**
 * marketplaceStore.ts — B2B Circular Economy Marketplace State
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbStorage } from '../offline';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';
import { 
  MarketplaceStore, 
  Listing, 
  Order, 
} from './marketplaceStore.types';
import { 
  normalizeKeys, 
  MarketplaceListingSchema, 
  MarketplaceOrderSchema, 
  MarketplaceOfferSchema, 
  MarketplaceListing,
  MarketplaceOrder, 
  MarketplaceOffer,
  safeParseArray,
  safeParseOrNull
} from '../validation';

export const useMarketplaceStore = create<MarketplaceStore>()(
  persist(
    (set, get) => ({
  listings: [],
  myListings: [],
  myOrders: [],
  receivedOrders: [],
  receivedOffers: [],
  sentOffers: [],
  categories: [],
  isLoading: false,

  fetchListings: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Fetch seller names
        const sellerIds = [...new Set(data.map((l) => l.seller_id))];
        const { data: sellers } = await supabase
          .from('profiles')
          .select('id, name, is_verified')
          .in('id', sellerIds);
        
        const sellerMap = Object.fromEntries(sellers?.map((s) => [s.id, s]) || []);

        const rawMapped = (data as Listing[]).map((l) => {
          const normalized = normalizeKeys(l);
          normalized.sellerName = sellerMap[l.seller_id]?.name || 'Verified Seller';
          normalized.isVerified = sellerMap[l.seller_id]?.is_verified || false;
          return normalized;
        });
        
        const validListings = safeParseArray(MarketplaceListingSchema, rawMapped, 'Marketplace Listings Fetch');
        set({ listings: validListings });
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyActivity: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    set({ isLoading: true });
    try {
      // 1. Fetch My Listings
      const { data: myListingsData } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (myListingsData) {
        const rawMyListings = (myListingsData as Listing[]).map(l => normalizeKeys(l));
        const validMyListings = safeParseArray(MarketplaceListingSchema, rawMyListings, 'My Listings Fetch');
        set({ myListings: validMyListings });
      }

      // 2. Fetch My Orders (Buying)
      const { data: myOrdersData } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (myOrdersData) {
        const rawMyOrders = (myOrdersData as Order[]).map(o => normalizeKeys(o));
        const validMyOrders = safeParseArray(MarketplaceOrderSchema, rawMyOrders, 'My Orders Fetch');
        set({ myOrders: validMyOrders });
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchReceivedOrders: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const buyerIds = [...new Set(data.map((o) => o.buyer_id))];
        const { data: buyers } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', buyerIds);
        
        const buyerMap = Object.fromEntries(buyers?.map((b) => [b.id, b.name]) || []);

        const rawReceivedOrders = (data as Order[]).map(o => {
          const normalized = normalizeKeys(o);
          normalized.buyerName = buyerMap[o.buyer_id] || 'Business Buyer';
          return normalized;
        });
        const validReceivedOrders = safeParseArray(MarketplaceOrderSchema, rawReceivedOrders, 'Received Orders Fetch');
        set({ receivedOrders: validReceivedOrders });
      }
    } catch (error) {
      console.error('Error fetching received orders:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createListing: async (listingData: Partial<MarketplaceListing>) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .insert({
          seller_id: userId,
          status: 'active',
          material: (listingData as any).material,
          quantity: (listingData as any).quantity,
          price_per_kg: (listingData as any).pricePerKg,
          description: (listingData as any).description,
          location: (listingData as any).location,
          latitude: (listingData as any).latitude,
          longitude: (listingData as any).longitude,
          photo_url: (listingData as any).photoUrl,
          grade: (listingData as any).grade,
          swarm_id: (listingData as any).swarmId || (listingData as any).swarm_id,
          is_bulk_drive: (listingData as any).isBulkDrive || (listingData as any).is_bulk_drive || false,
          group_metadata: (listingData as any).groupMetadata || (listingData as any).group_metadata
        })
        .select()
        .single();

      if (error) throw error;
      
      const normalized = normalizeKeys(data);
      const newListing = safeParseOrNull(MarketplaceListingSchema, normalized, 'Create Listing');
      
      if (!newListing) throw new Error('Invalid listing data returned from server.');

      set(state => ({
        listings: [newListing, ...state.listings],
        myListings: [newListing, ...state.myListings]
      }));

      // NOTE: Notification to agents is dispatched by PostTrade.tsx after createListing succeeds.
      // Do NOT add a duplicate addNotification call here.

      return newListing;
    } catch (error) {
      console.error('Error creating listing:', error);
      return null;
    }
  },

  deleteListing: async (id) => {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        listings: state.listings.filter(l => l.id !== id),
        myListings: state.myListings.map(l => l.id === id ? { ...l, status: 'cancelled' as any } : l)
      }));
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  },

  clearClosedListings: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('seller_id', userId)
        .neq('status', 'active');

      if (error) throw error;

      set(state => ({
        myListings: state.myListings.filter(l => l.status === 'active')
      }));
    } catch (error) {
      console.error('Error clearing closed listings:', error);
      throw error;
    }
  },

  updateListingStatus: async (id, status) => {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        listings: state.listings.map(l => l.id === id ? { ...l, status: status as any } : l),
        myListings: state.myListings.map(l => l.id === id ? { ...l, status: status as any } : l)
      }));
    } catch (error) {
      console.error('Error updating listing status:', error);
    }
  },

  placeOrder: async (listing, quantity, message) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_orders')
        .insert({
          listing_id: listing.id,
          buyer_id: userId,
          seller_id: listing.sellerId,
          material: listing.material,
          quantity,
          unit_price: listing.pricePerKg,
          total_price: listing.pricePerKg * quantity,
          message,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      const normalized = normalizeKeys(data);
      normalized.sellerName = listing.sellerName;
      const newOrder = safeParseOrNull(MarketplaceOrderSchema, normalized, 'Place Order');
      
      if (!newOrder) throw new Error('Invalid order data returned from server.');

      set(state => ({
        myOrders: [newOrder, ...state.myOrders]
      }));

      // Notify Seller
      useNotificationStore.getState().addNotification(
        'New Order Received! 📦',
        `A buyer wants to purchase ${quantity}kg of ${listing.material}.`,
        'info',
        'business',
        listing.sellerId
      );
    } catch (error) {
      console.error('Error placing order:', error);
    }
  },

  cancelOrder: async (orderId) => {
    try {
      const { error } = await supabase
        .from('marketplace_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      set(state => ({
        myOrders: state.myOrders.map(o => o.id === orderId ? { ...o, status: 'cancelled' as any } : o),
        receivedOrders: state.receivedOrders.map(o => o.id === orderId ? { ...o, status: 'cancelled' as any } : o)
      }));
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  },

  disputeOrder: async (orderId, reason) => {
    try {
      const { error } = await supabase
        .from('marketplace_orders')
        .update({ status: 'disputed', message: reason })
        .eq('id', orderId);

      if (error) throw error;

      set(state => ({
        myOrders: state.myOrders.map(o => o.id === orderId ? { ...o, status: 'disputed' as any } : o),
        receivedOrders: state.receivedOrders.map(o => o.id === orderId ? { ...o, status: 'disputed' as any } : o)
      }));
    } catch (error) {
      console.error('Error disputing order:', error);
    }
  },

  getFinancialSummary: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return { totalSales: 0, pendingPayouts: 0, completedDeals: 0 };

    const { data } = await supabase
      .from('marketplace_orders')
      .select('total_price, status')
      .eq('seller_id', userId);

    if (!data) return { totalSales: 0, pendingPayouts: 0, completedDeals: 0 };

    const summary = data.reduce((acc, order) => {
      if (order.status === 'completed') {
        acc.totalSales += order.total_price;
        acc.completedDeals += 1;
      } else if (order.status === 'confirmed' || order.status === 'processing') {
        acc.pendingPayouts += order.total_price;
      }
      return acc;
    }, { totalSales: 0, pendingPayouts: 0, completedDeals: 0 });

    return summary;
  },

  requestTransport: async (order) => {
    // Integration with bookingStore
    try {
      const { userId } = useAuthStore.getState();
      if (!userId) return;

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          waste_type: order.material,
          bags: Math.ceil(order.quantity / 20), // Estimate bags
          status: 'pending',
          is_market_trade: true,
          total_price: 500 // Base logistics fee for B2B
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('marketplace_orders')
        .update({ booking_id: data.id, status: 'processing' })
        .eq('id', order.id);

      set(state => ({
        receivedOrders: state.receivedOrders.map(o => o.id === order.id ? { ...o, status: 'processing' as any, bookingId: data.id } : o)
      }));
    } catch (error) {
      console.error('Error requesting transport:', error);
    }
  },

  releaseEscrow: async (order) => {
    try {
      if (order.swarmId || (order as any).swarm_id) {
        // Use the automated split RPC for Swarms
        const { error } = await supabase.rpc('process_swarm_payout', {
          p_order_id: order.id
        });
        if (error) throw error;
      } else {
        // Standard escrow release
        const { error } = await supabase
          .from('marketplace_orders')
          .update({ status: 'completed' })
          .eq('id', order.id);

        if (error) throw error;
      }

      set(state => ({
        myOrders: state.myOrders.map(o => o.id === order.id ? { ...o, status: 'completed' as any } : o)
      }));

      // Notify Seller
      useNotificationStore.getState().addNotification(
        'Payment Released! 💸',
        `Funds for order ${order.id.slice(0,8)} have been credited to your wallet.`,
        'success',
        'business',
        order.sellerId
      );
    } catch (error) {
      console.error('Error releasing escrow:', error);
    }
  },

  verifyAndRelease: async (orderId, digitalIds) => {
    // Mock verification of IoT tags
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const { error } = await supabase
      .from('marketplace_orders')
      .update({ status: 'completed' })
      .eq('id', orderId);
    
    if (!error) {
      set(state => ({
        myOrders: state.myOrders.map(o => o.id === orderId ? { ...o, status: 'completed' as any } : o)
      }));
    }
    set({ isLoading: false });
  },

  getCalculatedScore: (receivedOrders, profile) => {
    let score = 85; // Base score
    if (profile?.isVerified) score += 10;
    if (receivedOrders.length > 5) score += 5;
    return Math.min(score, 100);
  },

  fetchIncomingOffers: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_offers')
        .select(`
          *,
          marketplace_listings (*)
        `)
        .eq('seller_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      if (data) {
        const buyerIds = [...new Set(data.map((o) => o.buyer_id))];
        const { data: buyers } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', buyerIds);
        
        const buyerMap = Object.fromEntries(buyers?.map((b) => [b.id, b.name]) || []);

        const rawOffers = data.map(raw => {
          const o = raw as any;
          const normalized = normalizeKeys(o);
          normalized.buyerName = buyerMap[o.buyer_id] || 'Interested Buyer';
          normalized.listing = normalized.marketplaceListings;
          normalized.material = o.marketplace_listings?.material || 'Recyclables';
          normalized.photo = o.marketplace_listings?.photo_url;
          return normalized;
        });
        const validOffers = safeParseArray(MarketplaceOfferSchema, rawOffers, 'Incoming Offers Fetch');
        set({ receivedOffers: validOffers });
      }
    } catch (error) {
      console.warn('Offers fetch failed (might be legacy schema):', error);
    }
  },

  makeOffer: async (listing, price, quantity) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_offers')
        .insert({
          listing_id: listing.id,
          buyer_id: userId,
          seller_id: listing.sellerId,
          offered_price: price,
          quantity: quantity,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      const normalized = normalizeKeys(data);
      normalized.material = listing.material;
      normalized.photo = listing.photoUrl;
      const newOffer = safeParseOrNull(MarketplaceOfferSchema, normalized, 'Make Offer');
      
      if (!newOffer) throw new Error('Invalid offer data returned from server.');

      set(state => ({
        sentOffers: [newOffer, ...state.sentOffers]
      }));

      // Notify Seller
      useNotificationStore.getState().addNotification(
        'New Offer Received! 🤝',
        `A buyer offered KSh ${price}/kg for your ${listing.material}.`,
        'info',
        'business',
        listing.sellerId
      );
    } catch (error) {
      console.error('Error making offer:', error);
    }
  },

  acceptOffer: async (offer) => {
    try {
      // 1. Update offer status
      const { error: offerError } = await supabase
        .from('marketplace_offers')
        .update({ status: 'accepted' })
        .eq('id', offer.id);

      if (offerError) throw offerError;

      // 2. Create actual order
      // 2. Create actual order
      const { data: orderData, error: orderError } = await supabase
        .from('marketplace_orders')
        .insert({
          listing_id: offer.listingId,
          buyer_id: offer.buyerId,
          seller_id: offer.sellerId,
          material: offer.material || 'Recyclables',
          quantity: offer.quantity,
          unit_price: offer.offeredPrice,
          total_price: offer.offeredPrice * offer.quantity,
          status: 'pending',
          message: 'Offer accepted',
          swarm_id: offer.listing?.swarmId || offer.listing?.swarm_id
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2.5 Auto-dispatch logistics: Create booking so agent sees it in "Accepted Bids"
      if (orderData) {
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            user_id: offer.sellerId,
            agent_id: offer.buyerId, // The agent who won the bid handles the pickup
            waste_type: offer.material || 'Recyclables',
            status: 'pending',
            is_market_trade: true,
            total_price: offer.offeredPrice * offer.quantity,
            preferred_date: new Date().toISOString().split('T')[0],
            photo_url: offer.photo,
            actual_weight_kg: offer.quantity,
            estate: offer.listing?.location || undefined,
            latitude: offer.listing?.latitude || undefined,
            longitude: offer.listing?.longitude || undefined
          })
          .select()
          .single();

        if (!bookingError && bookingData) {
          await supabase
            .from('marketplace_orders')
            .update({ booking_id: bookingData.id, status: 'processing' })
            .eq('id', orderData.id);
        }
      }

      // 3. Update local state
      set(state => ({
        receivedOffers: state.receivedOffers.filter(o => o.id !== offer.id)
      }));

      get().fetchReceivedOrders();

      // Notify Buyer
      useNotificationStore.getState().addNotification(
        'Offer Accepted! 🎉',
        `Your offer for ${offer.material || 'Recyclables'} has been accepted. Proceed to checkout.`,
        'success',
        'business',
        offer.buyerId
      );
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  },

  declineOffer: async (offerId) => {
    try {
      const { error } = await supabase
        .from('marketplace_offers')
        .update({ status: 'declined' })
        .eq('id', offerId);

      if (error) throw error;

      set(state => ({
        receivedOffers: state.receivedOffers.filter(o => o.id !== offerId)
      }));
    } catch (error) {
      console.error('Error declining offer:', error);
    }
  },

  fetchReceivedOffers: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_offers')
        .select(`
          *,
          marketplace_listings (*)
        `)
        .eq('seller_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      if (data) {
        const buyerIds = [...new Set(data.map((o) => o.buyer_id))];
        const { data: buyers } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', buyerIds);
        
        const buyerMap = Object.fromEntries(buyers?.map((b) => [b.id, b.name]) || []);

        const rawOffers = data.map(raw => {
          const o = raw as any;
          const normalized = normalizeKeys(o);
          normalized.buyerName = buyerMap[o.buyer_id] || 'Business Buyer';
          normalized.listing = normalized.marketplaceListings;
          normalized.material = o.marketplace_listings?.material || 'Recyclables';
          normalized.photo = o.marketplace_listings?.photo_url;
          return normalized;
        });
        const validOffers = safeParseArray(MarketplaceOfferSchema, rawOffers, 'Received Offers Fetch');
        set({ receivedOffers: validOffers });
      }
    } catch (error) {
      console.error('Error fetching received offers:', error);
    }
  },

  fetchSentOffers: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_offers')
        .select(`
          *,
          marketplace_listings (material, photo_url)
        `)
        .eq('buyer_id', userId);

      if (error) throw error;

      if (data) {
        const rawSentOffers = data.map(raw => {
          const o = raw as any;
          const normalized = normalizeKeys(o);
          normalized.material = o.marketplace_listings?.material || 'Recyclables';
          normalized.photo = o.marketplace_listings?.photo_url;
          return normalized;
        });
        const validSentOffers = safeParseArray(MarketplaceOfferSchema, rawSentOffers, 'Sent Offers Fetch');
        set({ sentOffers: validSentOffers });
      }
    } catch (error) {
      console.error('Error fetching sent offers:', error);
    }
  },

  subscribeToReceivedOffers: (userId) => {
    if (!userId) return null;
    
    const uniqueId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`received-offers-${userId}-${uniqueId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'marketplace_offers', 
          filter: `seller_id=eq.${userId}` 
        }, 
        () => {
          get().fetchReceivedOffers();
          useNotificationStore.getState().playNotificationSound('New Offer Received 🤝', 'A buyer has made an offer on your listing.');
        }
      )
      .subscribe();

    return channel;
  }
}),
    {
      name: 'marketplace-store',
      storage: idbStorage,
      partialize: (state) => ({
        listings: state.listings.slice(0, 100),
        myListings: state.myListings.slice(0, 50),
        myOrders: state.myOrders.slice(0, 50),
        receivedOrders: state.receivedOrders.slice(0, 50),
        receivedOffers: state.receivedOffers.slice(0, 50),
        sentOffers: state.sentOffers.slice(0, 50)
      })
    }
  )
);
