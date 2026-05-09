/**
 * Sourcing Page — Agent's marketplace portal for buying recyclable materials
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Scale, TrendingUp, 
  ChevronRight, MessageSquareQuote, Check,
  ArrowLeft, Clock, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketplaceStore, useAuthStore, supabase, getThumbnailUrl } from '@cleanflow/core';
import { toast } from 'sonner';

export default function Sourcing() {
  const navigate = useNavigate();
  const { 
    listings, fetchListings, makeOffer, 
    sentOffers, fetchSentOffers,
    isLoading 
  } = useMarketplaceStore();
  const { profile } = useAuthStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState(1);

  useEffect(() => {
    fetchListings();
    fetchSentOffers();

    const channelName = `sourcing-radar-${Date.now()}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'marketplace_listings' }, 
        () => fetchListings()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'marketplace_offers' },
        () => fetchSentOffers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchListings, fetchSentOffers]);

  const selectedListing = listings.find(l => l.id === selectedId);

  // Initialize offer fields when a listing is selected
  useEffect(() => {
    if (selectedListing) {
      setOfferPrice(selectedListing.pricePerKg?.toString() || '');
      setOfferQty(selectedListing.quantity || 1);
    }
  }, [selectedId, selectedListing]);

  const handleMakeOffer = async () => {
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (offerQty <= 0 || offerQty > selectedListing.quantity) {
      toast.error('Invalid quantity');
      return;
    }

    try {
      await makeOffer(selectedListing, parseFloat(offerPrice), offerQty);
      setSelectedId(null);
      setOfferPrice('');
      toast.success('Offer Sent! 🚀', { description: 'The seller will be notified of your bid.' });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getHasOffer = (listingId) => {
    return sentOffers.some(o => o.listing_id === listingId);
  };

  const filteredListings = listings.filter(l => 
    l.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F8FF] dark:bg-slate-900 pb-32 relative">
      <div className="w-full">
        
        {/* ── STICKY RADAR HEADER (UNIFIED & FULL-BLEED) ── */}
        {!selectedId && (
          <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 animate-fade-in">
            {/* SOURCING SUMMARY TICKER */}
            <div className="px-4 py-3.5 bg-white dark:bg-slate-900 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
               <div className="flex items-center gap-6">
                 <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Active Bids</p>
                    <h2 className="text-base font-black tracking-tighter text-emerald-600 leading-none">{sentOffers.length}</h2>
                 </div>
                 <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 shrink-0" />
                 <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Potential Vol.</p>
                    <h2 className="text-base font-black tracking-tighter text-slate-900 dark:text-white leading-none italic">
                       {sentOffers.reduce((acc, o) => acc + (parseFloat(o.quantity) || 0), 0).toLocaleString()} <span className="text-xs text-slate-400 not-italic font-bold opacity-50">KG</span>
                    </h2>
                 </div>
               </div>
               <div className="flex flex-col items-end">
                 <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Live Radar</span>
                 </div>
               </div>
            </div>

            {/* COMPACT SEARCH BAR */}
            <div className="p-3">
               <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search materials or locations..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 py-2.5 pl-10 pr-4 rounded-xl text-[11px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300"
                  />
               </div>
            </div>
          </div>
        )}

        {/* ── CONTENT AREA ── */}
        <main>
          {selectedId && selectedListing ? (
            /* ── FOCUSED SOURCING VIEW (Kilimall Style) ── */
            <div className="animate-fade-in -mx-2 -mt-5">
               {/* Edge-to-Edge Hero Image */}
               <div className="w-full aspect-[4/3] bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                 <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full w-full">
                   {(selectedListing.photos?.length > 0 ? selectedListing.photos : [selectedListing.photo]).map((imgUrl, idx) => (
                     <div key={idx} className="flex-none w-full h-full snap-start">
                       {imgUrl ? (
                         <img src={getThumbnailUrl(imgUrl, { width: 800 })} className="w-full h-full object-cover" alt={`${selectedListing.material} - View ${idx + 1}`} />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                            <Package className="w-20 h-20 text-slate-200 dark:text-slate-700" />
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
                 
                 {/* Floating Back Button */}
                 <button 
                   onClick={() => setSelectedId(null)}
                   className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-all z-10"
                 >
                   <ArrowLeft className="w-4 h-4" />
                   <span className="text-xs font-semibold uppercase tracking-widest">Back</span>
                 </button>

                 {/* Grade Badge */}
                 <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-xl text-white rounded-full text-xs font-semibold uppercase tracking-[0.2em] z-10">
                   Grade {selectedListing.grade || 'A'}
                 </div>

                 {/* Photo Indicators */}
                 {(selectedListing.photos?.length > 1) && (
                   <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                     {selectedListing.photos.map((_, i) => (
                       <div key={i} className="w-1.5 h-1.5 rounded-full bg-white shadow-lg opacity-50 first:opacity-100" />
                     ))}
                   </div>
                 )}

               </div>

               {/* Content Sheet (Overlaps Image) */}
               <div className="relative -mt-6 bg-[#F4F4F4] dark:bg-slate-950 rounded-t-2xl px-5 pt-6 pb-6 space-y-5">
                 
                 {/* Title & Seller */}
                 <div>
                   <h2 className="text-2xl font-semibold text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{selectedListing.material}</h2>
                   <div className="flex items-center gap-2 mt-1.5">
                     <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                       <Check className="w-3 h-3 text-emerald-600" />
                     </div>
                     <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{selectedListing.sellerName || 'Verified Merchant'}</p>
                     <span className="text-xs text-slate-300">•</span>
                     <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                       <MapPin className="w-3 h-3" /> {selectedListing.location}
                     </p>
                   </div>
                 </div>

                 {/* Stats Row */}
                 <div className="grid grid-cols-3 gap-3">
                   <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                     <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Ask Price</p>
                     <p className="text-base font-semibold text-emerald-600">KSh {selectedListing.pricePerKg}</p>
                     <p className="text-xs font-semibold text-slate-300 uppercase">Per KG</p>
                   </div>
                   <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                     <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Load</p>
                     <p className="text-base font-semibold text-slate-700 dark:text-white">{selectedListing.quantity}</p>
                     <p className="text-xs font-semibold text-slate-300 uppercase">KG Available</p>
                   </div>
                   <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                     <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                     <p className="text-base font-semibold text-slate-700 dark:text-white">KSh {(selectedListing.pricePerKg * selectedListing.quantity).toLocaleString()}</p>
                     <p className="text-xs font-semibold text-slate-300 uppercase">Est.</p>
                   </div>
                 </div>

                 {/* Merchant Notes */}
                 <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                   <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Merchant's Notes</h4>
                   <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                     {selectedListing.description || "The seller has not provided additional notes for this material."}
                   </p>
                 </div>

                 {/* Bid Section */}
                 <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border-2 border-emerald-500/10 shadow-lg space-y-5">
                   <div className="flex items-center gap-3">
                     <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
                       <MessageSquareQuote className="w-4 h-4" />
                     </div>
                     <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-widest">Place Your Bid</h3>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Offer Price</label>
                       <div className="relative">
                          <input 
                            type="number" 
                            value={offerPrice}
                            onChange={(e) => setOfferPrice(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 h-12 rounded-2xl px-4 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">/KG</span>
                       </div>
                     </div>
                     <div>
                       <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Quantity</label>
                       <div className="relative">
                          <input 
                            type="number" 
                            max={selectedListing.quantity}
                            value={offerQty}
                            onChange={(e) => setOfferQty(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 h-12 rounded-2xl px-4 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">KG</span>
                       </div>
                     </div>
                   </div>

                   <div className="flex items-center justify-between px-1">
                     <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Estimated Total</span>
                     <span className="text-sm font-semibold text-emerald-600">KSh {(parseFloat(offerPrice || 0) * parseFloat(offerQty || 0)).toLocaleString()}</span>
                   </div>
                   
                   <button 
                     onClick={handleMakeOffer}
                     disabled={isLoading}
                     className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                     {isLoading ? 'Sending...' : (
                       <>
                         <Check className="w-5 h-5" /> Confirm & Send Bid
                       </>
                     )}
                   </button>
                 </div>
               </div>
            </div>
          ) : (
            /* ── MAIN RADAR VIEW ── */
            <div className="space-y-1">
              {filteredListings.length === 0 ? (
                <div className="py-20 text-center px-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">No materials found nearby</p>
                </div>
              ) : (
                filteredListings.map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedId(listing.id)}
                    className="bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800/50 p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-3xl border border-slate-100 dark:border-slate-800">
                        {listing.photo ? (
                          <img src={getThumbnailUrl(listing.photo, { width: 200 })} loading="lazy" alt={listing.material} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-slate-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex gap-1">
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 text-[7px] font-semibold uppercase tracking-widest rounded">
                              {listing.grade || 'A'}
                            </span>
                            {getHasOffer(listing.id) && (
                              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 text-[7px] font-semibold uppercase tracking-widest rounded flex items-center gap-1">
                                BID SENT
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">KSh {listing.pricePerKg}/kg</span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-tight truncate">{listing.material}</h3>
                        <div className="flex items-center gap-4">
                          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 uppercase truncate max-w-[100px]">
                            <MapPin className="w-3 h-3" /> {listing.location}
                          </p>
                          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 uppercase">
                            <Scale className="w-3 h-3" /> {listing.quantity} KG
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center text-slate-200">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
