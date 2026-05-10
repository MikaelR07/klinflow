/**
 * marketplaceStore.js — CleanFlow KE B2B Marketplace (Supabase)
 * Handles listings, orders, and real-time updates.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient.js';
import { useAuthStore } from './authStore.js';

export const CATEGORIES = [
  { id: 'plastic', name: 'Plastic',  icon: '🥤', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'paper',   name: 'Paper',    icon: '📄', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  { id: 'metal',   name: 'Metal',    icon: '🥫', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  { id: 'glass',   name: 'Glass',    icon: '🍾', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { id: 'organic', name: 'Organic',  icon: '🍎', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  { id: 'ewaste',  name: 'E-Waste',  icon: '💻', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
];

const MATERIAL_EMOJIS = {
  Plastic: '🥤', Paper: '📄', Metal: '🥫',
  Glass: '🍾', Organic: '🍎', 'E-Waste': '💻',
};

export const useMarketplaceStore = create(
  persist(
    (set, get) => ({
      listings:   [],
      myListings: [],
      myOrders:   [],
      receivedOrders: [],
      receivedOffers: [],
      sentOffers: [],
      categories: CATEGORIES,
      isLoading:  false,

      // ── FETCH ALL ACTIVE LISTINGS (with seller name) ─────────────
      fetchListings: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
          .from('marketplace_listings')
          .select(`
            *,
            seller:profiles!seller_id (name, location, is_verified)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Marketplace] Fetch failed:', error);
          set({ isLoading: false });
          return;
        }

        const mapped = data.map(l => ({
          id:           l.id,
          material:     l.material,
          quantity:     l.quantity,
          pricePerKg:   l.price_per_kg,
          location:     l.seller?.location?.estate || l.location || 'Nairobi',
          sellerId:     l.seller_id,
          sellerName:   l.seller?.name || 'Unknown Seller',
          isVerified:   l.seller?.is_verified || false,
          latitude:     l.latitude,
          longitude:    l.longitude,
          status:       l.status,
          photo:        l.photo_url,
          photos:       l.photo_urls || (l.photo_url ? [l.photo_url] : []),
          description:  l.description,
          grade:        l.grade,
          unit:         l.unit || 'KG',
          moq:          l.moq || 1,
          aiMatchScore: l.ai_match_score,
          views:        l.views || 0,
          offers:       l.offers || 0,
          createdAt:    l.created_at,
        }));

        set({ listings: mapped, isLoading: false });
      },

      // ── FETCH MY LISTINGS + MY ORDERS ────────────────────────────
      fetchMyActivity: async () => {
        const { userId } = useAuthStore.getState();
        if (!userId) return;
        set({ isLoading: true });

        const [{ data: listings }, { data: orders }] = await Promise.all([
          supabase
            .from('marketplace_listings')
            .select('*')
            .eq('seller_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('marketplace_orders')
            .select(`
              *,
              listing:marketplace_listings!listing_id (
                material, photo_url,
                seller:profiles!seller_id (name)
              ),
              booking:bookings!booking_id (id, status, agent_id)
            `)
            .eq('buyer_id', userId)
            .order('created_at', { ascending: false }),
        ]);

        const mappedListings = (listings || []).map(l => ({
          id:           l.id,
          material:     l.material,
          quantity:     l.quantity,
          pricePerKg:   l.price_per_kg,
          location:     l.location,
          latitude:     l.latitude,
          longitude:    l.longitude,
          status:       l.status,
          photo:        l.photo_url,
          photos:       l.photo_urls || (l.photo_url ? [l.photo_url] : []),
          grade:        l.grade,
          unit:         l.unit || 'KG',
          moq:          l.moq || 1,
          views:        l.views || 0,
          offers:       l.offers || 0,
          createdAt:    l.created_at,
        }));

        const mappedOrders = (orders || []).map(o => ({
          id:          o.id,
          listingId:   o.listing_id,
          material:    o.material || o.listing?.material || 'Recyclable',
          photo:       o.listing?.photo_url,
          sellerName:  o.listing?.seller?.name || 'Unknown Seller',
          quantity:    o.quantity,
          unitPrice:   o.unit_price,
          totalPrice:  o.total_price,
          status:      o.status,
          message:     o.message,
          bookingId:   o.booking_id,
          logisticsStatus: o.booking?.status || null,
          createdAt:   o.created_at,
          emoji:       MATERIAL_EMOJIS[o.material] || '♻️',
        }));

        set({ myListings: mappedListings, myOrders: mappedOrders, isLoading: false });
      },

      // ── FETCH RECEIVED ORDERS (Orders on my listings) ──────────────
      fetchReceivedOrders: async () => {
        const { userId } = useAuthStore.getState();
        if (!userId) return;
        set({ isLoading: true });

        const { data, error } = await supabase
          .from('marketplace_orders')
          .select(`
            *,
            listing:marketplace_listings!inner (
              material, photo_url, seller_id
            ),
            buyer:profiles!buyer_id (name)
          `)
          .eq('listing.seller_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Marketplace] Fetch received failed:', error);
          set({ isLoading: false });
          return;
        }

        const mapped = data.map(o => ({
          id:          o.id,
          listingId:   o.listing_id,
          material:    o.material || o.listing?.material || 'Recyclable',
          photo:       o.listing?.photo_url,
          buyerName:   o.buyer?.name || 'Unknown Buyer',
          quantity:    o.quantity,
          unitPrice:   o.unit_price,
          totalPrice:  o.total_price,
          status:      o.status,
          message:     o.message,
          bookingId:   o.booking_id,
          createdAt:   o.created_at,
          emoji:       MATERIAL_EMOJIS[o.material] || '♻️',
        }));

        set({ receivedOrders: mapped, isLoading: false });
      },

      // ── CREATE A NEW LISTING (Unified) ───────────────────────────
      createListing: async (listingData) => {
        const { userId, profile } = useAuthStore.getState();
        if (!userId) throw new Error('Not authenticated');
        set({ isLoading: true });

        // 🔍 DEBUG: Verify Supabase session matches store userId
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Marketplace] Auth Debug:', {
          storeUserId: userId,
          sessionUserId: session?.user?.id,
          match: userId === session?.user?.id,
          hasSession: !!session,
        });

        if (!session) {
          set({ isLoading: false });
          throw new Error('No active Supabase session. Please log out and log back in.');
        }

        // Fallback to user's profile location if not provided
        const estate = listingData.location || profile?.location?.estate || 'Nairobi';

        const { data, error } = await supabase
          .from('marketplace_listings')
          .insert({
            seller_id:    userId,
            material:     listingData.material,
            quantity:     listingData.quantity,
            price_per_kg: listingData.pricePerKg,
            location:     estate,
            latitude:     listingData.latitude || 0,
            longitude:    listingData.longitude || 0,
            photo_url:    listingData.photoUrl || listingData.photo || null,
            description:  listingData.description || '',
            grade:        listingData.grade || 'Standard',
            unit:         listingData.unit || 'KG',
            status:       'active',
            moq:          listingData.moq || 1,
            ai_match_score: Math.floor(Math.random() * 15) + 85,
          })
          .select()
          .single();

        if (error) {
          set({ isLoading: false });
          throw new Error(error.message);
        }

        const mapped = {
          id:           data.id,
          material:     data.material,
          quantity:     data.quantity,
          pricePerKg:   data.price_per_kg,
          location:     data.location,
          latitude:     data.latitude,
          longitude:    data.longitude,
          sellerId:     data.seller_id,
          status:       data.status,
          photo:        data.photo_url,
          photos:       data.photo_urls || (data.photo_url ? [data.photo_url] : []),
          description:  data.description,
          grade:        data.grade,
          createdAt:    data.created_at,
        };

        set(state => ({ 
          listings: [mapped, ...state.listings],
          myListings: [mapped, ...state.myListings], 
          isLoading: false 
        }));
        
        return mapped;
      },

      // ── DELETE A LISTING (Withdraw from market) ──────────────────
      deleteListing: async (id) => {
        set({ isLoading: true });
        const { error } = await supabase
          .from('marketplace_listings')
          .delete()
          .eq('id', id);

        if (error) {
          set({ isLoading: false });
          throw new Error(error.message);
        }

        set(state => ({
          listings:   state.listings.filter(l => l.id !== id),
          myListings: state.myListings.filter(l => l.id !== id),
          isLoading:  false
        }));
      },

      // ── UPDATE LISTING STATUS ─────────────────────────────────────
      updateListingStatus: async (id, status) => {
        const { error } = await supabase
          .from('marketplace_listings')
          .update({ status })
          .eq('id', id);

        if (!error) {
          set(state => ({
            listings:   state.listings.map(l   => l.id === id ? { ...l, status } : l),
            myListings: state.myListings.map(l => l.id === id ? { ...l, status } : l),
          }));
          toast.success(`Listing marked as ${status}`);
        }
      },

      // ── PLACE AN ORDER ────────────────────────────────────────────
      placeOrder: async (listing, quantity, message = '') => {
        const { userId } = useAuthStore.getState();
        if (!userId) throw new Error('Not authenticated');
        if (userId === listing.sellerId) throw new Error('You cannot buy your own listing.');
        if (Number(quantity) < (listing.moq || 1)) {
          throw new Error(`Minimum order quantity for this listing is ${listing.moq}${listing.unit}.`);
        }
        set({ isLoading: true });

        const totalPrice = Number(quantity) * listing.pricePerKg;

        const { data, error } = await supabase
          .from('marketplace_orders')
          .insert({
            listing_id:  listing.id,
            buyer_id:    userId,
            material:    listing.material,
            quantity:    Number(quantity),
            unit_price:  listing.pricePerKg,
            total_price: totalPrice,
            status:      'held_in_escrow', // Auto-initiate escrow
            message:     message || null,
          })
          .select()
          .single();

        if (error) {
          set({ isLoading: false });
          throw new Error(error.message);
        }

        const newOrder = {
          id:         data.id,
          listingId:  data.listing_id,
          material:   data.material,
          sellerName: listing.sellerName,
          quantity:   data.quantity,
          unitPrice:  data.unit_price,
          totalPrice: data.total_price,
          status:     data.status,
          createdAt:  data.created_at,
          emoji:      MATERIAL_EMOJIS[data.material] || '♻️',
        };

        set(state => ({
          myOrders:  [newOrder, ...state.myOrders],
          isLoading: false,
        }));

        toast.success('Order Placed! 🚀', {
          description: `${quantity}kg of ${listing.material} — KES ${totalPrice.toLocaleString()} committed.`,
        });
      },

      // ── CANCEL AN ORDER ───────────────────────────────────────────
      cancelOrder: async (orderId) => {
        const { error } = await supabase
          .from('marketplace_orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId);

        if (!error) {
          set(state => ({
            myOrders: state.myOrders.map(o =>
              o.id === orderId ? { ...o, status: 'cancelled' } : o
            ),
          }));
          toast.success('Order Cancelled');
        }
      },

      // ── DISPUTE AN ORDER ──────────────────────────────────────────
      disputeOrder: async (orderId, reason) => {
        set({ isLoading: true });
        try {
          const { error } = await supabase
            .from('marketplace_orders')
            .update({ 
              status: 'disputed',
              message: `DISPUTE: ${reason}` 
            })
            .eq('id', orderId);

          if (error) throw error;

          set(state => ({
            myOrders: state.myOrders.map(o =>
              o.id === orderId ? { ...o, status: 'disputed' } : o
            ),
          }));

          toast.warning('Order Disputed', {
            description: 'Platform admins have been notified to mediate this trade.'
          });
        } catch (err) {
          toast.error('Failed to initiate dispute.');
        } finally {
          set({ isLoading: false });
        }
      },

      // ── GET FINANCIAL SUMMARY ─────────────────────────────────────
      getFinancialSummary: async () => {
        const { userId } = useAuthStore.getState();
        if (!userId) return null;

        const { data, error } = await supabase
          .from('marketplace_orders')
          .select('total_price, status')
          .eq('status', 'funds_released')
          .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

        if (error) return null;

        const totalVolume = data.reduce((sum, o) => sum + o.total_price, 0);
        const totalFees = totalVolume * 0.10;
        
        return {
          totalVolume,
          totalFees,
          netEarnings: totalVolume - totalFees
        };
      },
      
      // ── REQUEST TRANSPORT (Logistics Integration) ───────────────
      requestTransport: async (order) => {
        const { createBooking } = (await import('./bookingStore.js')).useBookingStore.getState();
        set({ isLoading: true });
        
        try {
          // 1. Create the booking
          const newBooking = await createBooking({
            wasteType: order.material,
            estate: 'Nairobi', // Default for now, could be dynamic
            bags: 1,
            amount: 500, // Standard B2B Freight fee placeholder
            notes: `B2B Transport for Order #${order.id.slice(0, 8)}`,
          });
          
          // 2. Link booking to order
          const { error } = await supabase
            .from('marketplace_orders')
            .update({ booking_id: newBooking.id })
            .eq('id', order.id);
            
          if (error) throw error;
          
          // 3. Update local state
          set(state => ({
            myOrders: state.myOrders.map(o => 
              o.id === order.id ? { ...o, bookingId: newBooking.id, logisticsStatus: 'pending' } : o
            )
          }));
          
          toast.success('Transport Requested! 🚛', {
            description: 'Our Green Agent network has been notified.'
          });
        } catch (err) {
          console.error('[Marketplace] Transport Request Failed:', err);
          toast.error('Failed to request transport.');
        } finally {
          set({ isLoading: false });
        }
      },

      // ── ESCROW RELEASE (AUTOMATED COMMISSION SPLIT) ──────────────
      releaseEscrow: async (order) => {
        set({ isLoading: true });
        
        try {
          // Update Order Status — The Database Trigger handles the 90/10 payout
          const { error } = await supabase
            .from('marketplace_orders')
            .update({ status: 'funds_released' })
            .eq('id', order.id);

          if (error) throw error;

          // Update local state
          set(state => ({
            myOrders: state.myOrders.map(o => 
              o.id === order.id ? { ...o, status: 'funds_released' } : o
            )
          }));

          toast.success('Funds Released! 💸', {
            description: `Payment has been successfully transferred to the seller.`
          });
        } catch (err) {
          console.error('[Escrow] Release Failed:', err);
          toast.error('Failed to release escrow funds.');
        } finally {
          set({ isLoading: false });
        }
      },

      // ── CALCULATE DYNAMIC TRUST SCORE ───────────────────────────
      getCalculatedScore: (receivedOrders, profile) => {
        const completed = receivedOrders.filter(o => o.status === 'funds_released');
        const tradesCompleted = completed.length;
        const totalWeight = completed.reduce((sum, o) => sum + o.quantity, 0);
        const lifetimeEarnings = completed.reduce((sum, o) => sum + (o.totalPrice * 0.9), 0);
        
        const cancelled = receivedOrders.filter(o => o.status === 'cancelled' || o.status === 'disputed').length;
        const totalAttempted = tradesCompleted + cancelled;
        const fr = totalAttempted > 0 ? (tradesCompleted / totalAttempted) : 1.0;

        const createdDate = profile?.created_at ? new Date(profile.created_at) : new Date();
        const daysTraded = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;

        let score = 300; 
        score += Math.round(fr * 350);
        score += Math.round(Math.min((lifetimeEarnings / 100000) * 150, 150));
        score += Math.round(Math.min((daysTraded / 180) * 50, 50));

        return Math.min(score, 850);
      },

      // ── FETCH INCOMING OFFERS (Bids on my listings) ───────────────
      fetchIncomingOffers: async () => {
        return get().fetchReceivedOffers();
      },
      // Old fetchIncomingOffers removed for unification
      // ── MAKE AN OFFER ───────────────────────────────────────────
      makeOffer: async (listing, price, quantity) => {
        const { userId } = useAuthStore.getState();
        if (!userId) throw new Error('Not authenticated');
        set({ isLoading: true });

        console.log('[Marketplace] makeOffer called with listing:', listing, 'price:', price, 'qty:', quantity);
        const resolvedSellerId = listing.sellerId || listing.seller_id;
        console.log('[Marketplace] Resolved seller_id for insert:', resolvedSellerId);

        const { data, error } = await supabase
          .from('marketplace_offers')
          .insert({
            listing_id:  listing.id,
            buyer_id:    userId,
            seller_id:   resolvedSellerId,
            offered_price: price,
            quantity:    quantity,
            status:      'pending'
          })
          .select()
          .single();

        if (error) {
          set({ isLoading: false });
          throw new Error(error.message);
        }

        // Optimistically update sentOffers
        set(state => ({
          sentOffers: [data, ...state.sentOffers],
          isLoading: false
        }));

        // Send a notification to the seller so they are instantly alerted
        try {
          await supabase.from('notifications').insert({
            target_user: listing.sellerId || listing.seller_id,
            target_role: 'user', // Sellers are users
            title: 'New Bid Received! 🔔',
            body: `An agent offered KSh ${price}/kg for your ${listing.material}.`,
            type: 'info'
          });
        } catch (notifErr) {
          console.warn('[Marketplace] Could not send notification:', notifErr);
        }

        toast.success('Offer Sent! 📬', {
          description: `You offered KSh ${price}/kg for ${listing.material}.`
        });
      },

      // ── ACCEPT AN OFFER ──────────────────────────────────────────
      acceptOffer: async (offer) => {
        set({ isLoading: true });
        try {
          // 1. Update offer status
          const { error: offerErr } = await supabase
            .from('marketplace_offers')
            .update({ status: 'accepted' })
            .eq('id', offer.id);
          
          if (offerErr) throw offerErr;

          // 3. Create the Logistics Booking (The Job for the Agent)
          // Robust ID extraction from various offer formats (Handle both DB and Store mappings)
          const lId = offer.listing_id || offer.listingId || offer.listing?.id;
          const buyerId = offer.buyer_id || offer.buyerId;
          const sellerId = offer.seller_id || offer.sellerId || offer.listing?.seller_id || offer.listing?.sellerId;
          const materialName = offer.material || offer.listing?.material || 'Recyclables';

          if (!buyerId || !sellerId) {
            console.error('[Marketplace] MISSING IDs:', { buyerId, sellerId, offer });
            throw new Error('Critical trade data missing (Buyer or Seller ID)');
          }

          console.log('[Marketplace] Creating Booking for Agent:', buyerId, 'from Seller:', sellerId);

          const { error: bookingErr } = await supabase
            .from('bookings')
            .insert({ 
              user_id:      sellerId, 
              agent_id:     buyerId,      
              waste_type:   materialName,
              bags:         1, // Legacy placeholder - satisfy integer constraint
              actual_weight_kg: parseFloat(offer.quantity) || 0,
              total_price:  (parseFloat(offer.offered_price || offer.price) || 0) * (parseFloat(offer.quantity) || 0),
              status:       'confirmed', 
              booking_type: 'marketplace_pickup',
              photo_url:    offer.listing?.photo || offer.photo || null,
              estate:       offer.listing?.location || offer.location || 'Merchant Location',
              latitude:     parseFloat(offer.listing?.latitude || offer.latitude) || 0,
              longitude:    parseFloat(offer.listing?.longitude || offer.longitude) || 0,
              preferred_date: new Date().toISOString().split('T')[0],
              time_slot:    'anytime',
              is_market_trade: true,
              notes:        offer.listing?.description || `Marketplace trade: ${materialName}`
            });

          if (bookingErr) {
            console.error('[Marketplace] Booking creation error:', bookingErr);
            toast.error('Logistics Creation Failed!', { description: bookingErr.message });
            throw bookingErr;
          }

          // 4. Send Instant Notification to Alex
          await supabase.from('notifications').insert({
            target_user: buyerId,
            title: 'Offer Accepted! 🤝',
            body: `The merchant has accepted your offer for ${offer.quantity}kg of ${offer.material}. Proceed to collection.`,
            type: 'success'
          });

          // ── LINK BOOKING TO OFFER ──
          const { data: bData } = await supabase
            .from('bookings')
            .select('id')
            .eq('user_id', sellerId)
            .eq('agent_id', buyerId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (bData?.id) {
            await supabase
              .from('marketplace_offers')
              .update({ booking_id: bData.id })
              .eq('id', offer.id);
          }

          // 5. Update Inventory (The Safeguard)
          if (!lId) throw new Error('Missing Listing ID in offer object');

          // Fetch absolute latest quantity from DB to prevent race conditions
          const { data: currentListing } = await supabase
            .from('marketplace_listings')
            .select('quantity')
            .eq('id', lId)
            .single();

          const currentQty = currentListing?.quantity || 0;
          const newQty = Math.max(0, currentQty - offer.quantity);
          const newStatus = newQty <= 0 ? 'sold' : 'active';

          const { error: listingErr } = await supabase
            .from('marketplace_listings')
            .update({ 
              quantity: newQty,
              status: newStatus 
            })
            .eq('id', lId);

          if (listingErr) console.error('Listing update failed:', listingErr);

          // 6. Bulk Reject Competing Offers
          if (newStatus === 'sold') {
            await supabase
              .from('marketplace_offers')
              .update({ status: 'rejected' })
              .eq('listing_id', lId)
              .eq('status', 'pending')
              .neq('id', offer.id);
          }

          // 7. Update local state
          set(state => ({
            receivedOffers: state.receivedOffers.map(o => 
              o.id === offer.id ? { ...o, status: 'accepted' } : o
            )
          }));

          toast.success('Trade Secured! 🤝', {
            description: newStatus === 'sold' 
              ? 'Material is now sold out and radar is cleared.' 
              : `Stock reduced. ${newQty}kg remaining on radar.`
          });
        } catch (err) {
          console.error('[Marketplace] Accept failed:', err);
          toast.error('Failed to accept offer.');
        } finally {
          set({ isLoading: false });
        }
      },

      // ── DECLINE AN OFFER ─────────────────────────────────────────
      declineOffer: async (offerId) => {
        // 1. Optimistic Eviction (Vanish Instantly)
        set(state => ({
          receivedOffers: (state.receivedOffers || []).filter(o => o.id !== offerId)
        }));
        toast.success('Offer Declined');

        try {
          // 2. Fetch offer details for notification
          const { data: offer } = await supabase
            .from('marketplace_offers')
            .select('buyer_id, material')
            .eq('id', offerId)
            .single();

          const { error } = await supabase
            .from('marketplace_offers')
            .update({ status: 'rejected' })
            .eq('id', offerId);

          if (!error && offer) {
            // 3. Notify Buyer
            await supabase.from('notifications').insert({
              target_user: offer.buyer_id,
              title: 'Offer Declined ❌',
              body: `The merchant has declined your bid for ${offer.material}.`,
              type: 'error'
            });
          }
        } catch (err) {
          console.error('[Marketplace] Decline sync failed:', err);
        }
      },

      // ── OFFERS SYSTEM (Real-time) ────────────────────────────────
      fetchReceivedOffers: async () => {
        const { userId } = useAuthStore.getState();
        if (!userId) return;

        console.log('[Marketplace] Fetching received offers for seller:', userId);

        const { data, error } = await supabase
          .from('marketplace_offers')
          .select(`
            *,
            listing:marketplace_listings(*)
          `)
          .eq('seller_id', userId)
          .order('created_at', { ascending: false });

        console.log('[Marketplace] fetchReceivedOffers response data:', data, 'error:', error);

        if (!error) {
          if (!data || data.length === 0) {
            console.log('[Marketplace] No offers found, setting receivedOffers to []');
            set({ receivedOffers: [] });
            return;
          }

          // Fetch buyer names separately to avoid complex join issues in real-time
          const buyerIds = [...new Set(data.map(o => o.buyer_id))];
          const { data: buyers, error: buyersError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', buyerIds);
          
          console.log('[Marketplace] Fetched buyers:', buyers, 'error:', buyersError);

          const mapped = data.map(o => {
            const buyer = buyers?.find(b => b.id === o.buyer_id);
            return {
              ...o,
              id:           o.id,
              listingId:    o.listing_id,
              buyerId:      o.buyer_id,
              material:     o.listing?.material || 'Recyclable',
              photo:        o.listing?.photo_url,
              buyerName:    buyer?.name || 'CleanFlow Agent',
              quantity:     o.quantity,
              offered_price: o.offered_price,
              latitude:     o.listing?.latitude,
              longitude:    o.listing?.longitude,
              status:       o.status,
              createdAt:    o.created_at,
              emoji:        o.emoji || '♻️'
            };
          });
          set({ receivedOffers: mapped });
        }
      },

      fetchSentOffers: async () => {
        const { userId } = useAuthStore.getState();
        if (!userId) return;

        const { data, error } = await supabase
          .from('marketplace_offers')
          .select('*')
          .eq('buyer_id', userId)
          .eq('status', 'pending');

        if (!error) {
          set({ sentOffers: data });
        }
      },

      subscribeToReceivedOffers: (userId) => {
        if (!userId || userId === '00000000-0000-0000-0000-000000000000') return null;

        const channelName = `seller-offers-${userId}-${Date.now()}`;
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'marketplace_offers' 
          }, async (payload) => {
            // Re-fetch to ensure we have the listing data (joins are hard in realtime payloads)
            await get().fetchReceivedOffers();
            
            // Only play sound for NEW offers
            if (payload.eventType === 'INSERT') {
              try {
                const { useNotificationStore } = await import('./notificationStore.js');
                useNotificationStore.getState().playNotificationSound();
              } catch (e) { console.warn('Sound play failed', e); }
              
              toast.success('New Offer Received!', { 
                description: 'A buyer has placed a bid on your material.' 
              });
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('[Marketplace] Live offer radar active');
            }
          });

        return channel;
      },


    }),
    { name: 'cf_marketplace_v3' }
  )
);
