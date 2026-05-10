/**
 * Sourcing Page — Agent's marketplace portal for buying recyclable materials
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Scale, TrendingUp, 
  ChevronRight, MessageSquareQuote, Check,
  ArrowLeft, Clock, Package, CheckCircle2, Info
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
    <div className="animate-fade-in bg-[#F2F3F4] dark:bg-slate-900 relative px-2">
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
            /* ── FOCUSED SOURCING VIEW (Immersive Kilimall Style) ── */
            <div className="fixed inset-0 z-[100] bg-[#F2F3F4] dark:bg-slate-900 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200">
               {/* Edge-to-Edge Hero Image */}
               <div className="w-full aspect-[4/5] sm:aspect-square bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
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
                 
                 {/* Overlaid Back Button - Now with Notch Support */}
                 <button 
                   onClick={() => setSelectedId(null)}
                   style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
                   className="absolute left-6 z-20 p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-all shadow-xl"
                 >
                   <ArrowLeft className="w-5 h-5" />
                 </button>




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
               <div className="relative -mt-6 bg-[#F2F3F4] dark:bg-slate-900 rounded-t-xl px-3 pt-10 pb-10 space-y-6 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                 
                 {/* Unified Material & Seller Card (Matches MyOffers) */}
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material Type</p>
                       <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{selectedListing.material}</h2>
                     </div>
                     <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                       <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                       <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">{selectedListing.location}</span>
                     </div>
                   </div>
                   <div className="h-px bg-slate-100 dark:bg-slate-700" />
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                         <Check className="w-4 h-4 text-emerald-600" />
                       </div>
                       <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Merchant's Name</p>
                         <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{selectedListing.sellerName || 'Verified Merchant'}</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Grade</p>
                       <p className="text-sm font-black text-slate-900 dark:text-white italic">Grade {selectedListing.grade || 'A'}</p>
                     </div>
                   </div>
                 </div>

                 {/* Unified Listing Stats Card */}
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Merchant's Asking Price</p>
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          KSh {selectedListing.pricePerKg} <span className="text-[10px] font-bold text-slate-400 ml-1">/KG</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Value</p>
                        <p className="text-base font-black text-emerald-600">
                          KSh {(selectedListing.pricePerKg * selectedListing.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-700" />

                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                             <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Available Stock</p>
                             <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedListing.quantity} KG</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Merchant Notes Section */}
                 {selectedListing.description && (
                   <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Info className="w-3.5 h-3.5" /> Merchant Notes
                      </h4>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{selectedListing.description}"
                      </p>
                   </div>
                 )}

                 {/* Premium Bid Section */}
                 <div className="bg-emerald-600 dark:bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/20 shadow-xl shadow-emerald-500/10 space-y-6">
                    <div className="flex items-center justify-center gap-3">
                       <div className="w-8 h-8 bg-white/20 dark:bg-emerald-400/20 rounded-full flex items-center justify-center">
                          <MessageSquareQuote className="w-4 h-4 text-white dark:text-emerald-400" />
                       </div>
                       <h3 className="text-[10px] font-bold text-white dark:text-emerald-400 uppercase tracking-[0.2em]">Ready to negotiate?</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-emerald-100 dark:text-emerald-400/60 uppercase tracking-widest ml-1">My Price Offer</label>
                        <div className="relative">
                           <input 
                             type="number" 
                             value={offerPrice}
                             onChange={(e) => setOfferPrice(e.target.value)}
                             className="w-full bg-white/10 dark:bg-slate-900/50 border border-white/20 dark:border-slate-700 h-12 rounded-xl px-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-white/30 transition-all placeholder:text-white/40"
                             placeholder="0.00"
                           />
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/50">/KG</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-emerald-100 dark:text-emerald-400/60 uppercase tracking-widest ml-1">Total Weight</label>
                        <div className="relative">
                           <input 
                             type="number" 
                             max={selectedListing.quantity}
                             value={offerQty}
                             onChange={(e) => setOfferQty(e.target.value)}
                             className="w-full bg-white/10 dark:bg-slate-900/50 border border-white/20 dark:border-slate-700 h-12 rounded-xl px-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-white/30 transition-all placeholder:text-white/40"
                             placeholder="0"
                           />
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/50">KG</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 dark:border-emerald-500/10">
                       <div className="flex items-center justify-between mb-4 px-1">
                          <p className="text-[10px] font-bold text-emerald-100 dark:text-emerald-400/60 uppercase tracking-widest">Total Bid Value</p>
                          <p className="text-base font-black text-white tracking-tighter">KSh {(parseFloat(offerPrice || 0) * parseFloat(offerQty || 0)).toLocaleString()}</p>
                       </div>
                       
                       <button 
                         onClick={handleMakeOffer}
                         disabled={isLoading || !offerPrice || !offerQty}
                         className="w-full py-4 bg-white text-emerald-600 dark:bg-emerald-500 dark:text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-black/10 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                       >
                         {isLoading ? 'Processing...' : (
                           <>
                             <CheckCircle2 className="w-5 h-5" /> Send Offer Now
                           </>
                         )}
                       </button>
                    </div>
                 </div>

                 {/* Dismiss Detail */}
                 <button 
                   onClick={() => setSelectedId(null)}
                   className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"
                 >
                    Return to Radar
                 </button>
               </div>
            </div>
          ) : (
            /* ── MAIN RADAR VIEW ── */
            <div className="space-y-1 pb-32">
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
