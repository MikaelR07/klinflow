/**
 * MarketplaceInventory.jsx — Manage Live B2B Listings
 */
import { useState, useEffect, useMemo } from 'react';
import { 
  Package, Search, Plus, ArrowLeft,
  Trash2, MapPin, Scale, ChevronRight,
  Tag, AlertCircle, Clock, X, TrendingUp, CheckCircle2, Ban
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import EmptyState from '@klinflow/ui/components/EmptyState';
import { LoadingScreen } from '@klinflow/ui/components/Loading';
import { toast } from 'sonner';
import { Virtuoso } from 'react-virtuoso';
import { motion } from 'framer-motion';

export default function MarketplaceInventory() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const myListings = useMarketplaceStore(s => s.myListings);
  const fetchMyActivity = useMarketplaceStore(s => s.fetchMyActivity);
  const deleteListing = useMarketplaceStore(s => s.deleteListing);
  const clearClosedListings = useMarketplaceStore(s => s.clearClosedListings);
  const isLoading = useMarketplaceStore(s => s.isLoading);
  
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchMyActivity();
  }, []);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteListing(selectedId!);
      setShowDeleteModal(false);
      setSelectedId(null);
      toast.success('Listing Cancelled', { description: 'The item has been moved to your closed archives.' });
    } catch (err) {
      setShowDeleteModal(false);
      toast.error('Failed to remove', { description: err instanceof Error ? err.message : 'An unknown error occurred' });
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearClosedListings();
      toast.success('History Cleared', { description: 'All closed listings have been removed.' });
    } catch (err) {
      toast.error('Failed to clear', { description: err instanceof Error ? err.message : 'An unknown error occurred' });
    }
  };

  const selectedListing = myListings.find(l => l.id === selectedId) || null;
  const displayQuantity = selectedListing ? (selectedListing.quantity > 0 ? selectedListing.quantity : ((selectedListing as any).moq || (selectedListing as any).initialQuantity || 500)) : 0;
  const estValue = selectedListing ? selectedListing.pricePerKg * displayQuantity : 0;

  const filteredListings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = myListings.filter(l => {
      const matchesSearch = !q || 
        (l.material && l.material.toLowerCase().includes(q)) ||
        String(l.quantity).includes(q) ||
        String(l.pricePerKg).includes(q);
      const matchesTab = activeTab === 'active' ? l.status === 'active' : l.status !== 'active';
      return matchesSearch && matchesTab;
    });
    return activeTab === 'active' ? list : list.slice(0, 10);
  }, [myListings, searchQuery, activeTab]);

  if (isLoading && myListings.length === 0) return <LoadingScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F8FF] dark:bg-slate-900 transition-colors">
      {/* ── TOP NAV (Edge to Edge PWA Style) ── */}
      {!selectedId && (
        <div className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 pt-[calc(env(safe-area-inset-top,1rem)+0.5rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-800  z-50 transition-colors">
          <div className="max-w-lg mx-auto space-y-2.5">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate(-1)} className="w-8 h-8 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </button>
              
              <div className="text-center">
                <h1 className="text-base font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none">Inventory</h1>
                <p className="text-[9px] font-bold text-slate-500 capitalize tracking-[0.2em] mt-0.5">What You have listed for sale</p>
              </div>
              
              <div className="w-8" /> {/* Spacer */}
            </div>

            {/* Integrated Tab Nav */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl">
              {['active', 'closed'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-[10px] font-bold capitalize tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === tab
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400 font-black'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 space-y-0 pb-24 ${!selectedId ? 'pt-[calc(env(safe-area-inset-top,1rem)+4.25rem)]' : 'pt-0'} relative max-w-lg mx-auto w-full`}>

      <main className="mt-0">
        {selectedId && selectedListing ? (
          /* ── FOCUSED DETAIL VIEW (Immersive Kilimall Style) ── */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#F2F3F4] dark:bg-slate-900 overflow-y-auto no-scrollbar pb-24"
          >
            
            {/* Edge-to-Edge Hero Image */}
            <div className="w-full aspect-[4/5] sm:aspect-square bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
              
              {/* Overlaid Back Button - Now with Notch Support */}
              <button 
                onClick={() => setSelectedId(null)}
                style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
                className="absolute left-6 z-20 p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-all shadow-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>


              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full w-full">
                {((selectedListing?.photoUrls && selectedListing.photoUrls.length > 0) ? selectedListing.photoUrls : [selectedListing?.photoUrl]).map((imgUrl, idx) => (
                  <div key={idx} className="flex-none w-full h-full snap-start">
                    {imgUrl ? (
                      <img src={getThumbnailUrl(imgUrl, { width: 800 })} loading="lazy" className="w-full h-full object-cover" alt={`${selectedListing.material} - View ${idx + 1}`} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                         <Package className="w-20 h-20 text-slate-200" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {(selectedListing?.photoUrls && selectedListing.photoUrls.length > 1) && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {selectedListing?.photoUrls?.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white shadow-lg opacity-60 first:opacity-100" />
                  ))}
                </div>
              )}


            </div>

            {/* Content Sheet (Overlaps Image) */}
            <div className="bg-[#F2F3F4] dark:bg-slate-900 px-2 pt-4 pb-2 space-y-4 rounded-t-xl -mt-16 relative z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
              
                {/* Unified Listing Detail Card */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-1">Material Type</p>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white capitalize tracking-tight leading-none">{selectedListing.material}</h2>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 py-1.5 px-3 rounded-xl border border-slate-100 dark:border-slate-700 w-fit">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white capitalize tracking-widest italic">{selectedListing.location || 'Nairobi Hub'}</span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-700" />

                  <div className="flex items-center gap-2 px-1">
                     <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest">
                       Posted {new Date(selectedListing.createdAt || selectedListing.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                     </p>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-700" />

                  {/* Stats Row - Unified Internal */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-slate-400 capitalize tracking-widest mb-1">Asking Rate</p>
                      <p className="text-sm font-black text-emerald-600 italic leading-none">KSh {selectedListing.pricePerKg}</p>
                      <p className="text-[8px] font-bold text-slate-300 capitalize tracking-widest mt-1">/ KG</p>
                    </div>
                    <div className="text-center border-x border-slate-100 dark:border-slate-700 px-1">
                      <p className="text-[8px] font-bold text-slate-400 capitalize tracking-widest mb-1">{selectedListing.status === 'active' ? 'Inventory' : 'Total Load'}</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white italic leading-none">{displayQuantity}</p>
                      <p className="text-[8px] font-bold text-slate-300 capitalize tracking-widest mt-1">KG LOAD</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-slate-400 capitalize tracking-widest mb-1">{selectedListing.status === 'sold' ? 'Settled Value' : 'Est. Value'}</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white italic leading-none">KSh {estValue.toLocaleString()}</p>
                      <p className="text-[8px] font-bold text-slate-300 capitalize tracking-widest mt-1">Net Total</p>
                    </div>
                  </div>
                </div>

              {/* Description */}
              <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 capitalize tracking-[0.2em]">Description</h4>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  {(selectedListing as any).description || "No description provided"}
                </p>
              </div>
              {/* Management Controls */}
              <div className="space-y-2">
                {selectedListing.status === 'active' ? (
                  <button 
                    onClick={handleDelete}
                    className="w-full py-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-2 border-rose-100 dark:border-rose-900/30 rounded-2xl font-black text-xs capitalize tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Listing
                  </button>
                ) : (
                  <div className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-3 text-xs font-black capitalize tracking-[0.2em] ${
                    selectedListing.status === 'sold' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                      : selectedListing.status === 'cancelled'
                      ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30'
                      : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30'
                  }`}>
                    {selectedListing.status === 'sold' && <CheckCircle2 className="w-4 h-4" />}
                    {selectedListing.status === 'cancelled' && <Ban className="w-4 h-4" />}
                    {selectedListing.status === 'expired' && <Clock className="w-4 h-4" />}
                    <span>Status: {selectedListing.status}</span>
                  </div>
                )}
                <button 
                  onClick={() => setSelectedId(null)}
                  className="w-full py-3.5 bg-white dark:bg-slate-800 text-slate-400 rounded-2xl font-black text-[10px] capitalize tracking-[0.2em] active:scale-95 transition-all"
                >
                  Return to Inventory
                </button>
              </div>
            </div>
            </motion.div>
        ) : (
          /* ── MAIN LIST VIEW ── */
          <div className="space-y-0 pb-32">
            {filteredListings.length === 0 ? (
              <div className="py-20 px-4 text-center">
                <EmptyState 
                  icon={Package}
                  title={activeTab === 'active' ? "No Live Listings" : "No Past Listings"}
                  subtitle={activeTab === 'active' ? "Your marketplace posts will appear here." : "Your history is currently empty."}
                />
              </div>
            ) : (
              <Virtuoso
                useWindowScroll
                data={filteredListings}
                itemContent={(index, listing) => {
                  const itemQuantity = listing.quantity > 0 ? listing.quantity : ((listing as any).moq || (listing as any).initialQuantity || 500);
                  return (
                  <div 
                    onClick={() => setSelectedId(listing.id)}
                    className="bg-white dark:bg-slate-900 py-4 px-4 shadow-sm border-b border-slate-100 dark:border-slate-800 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                        {listing.photoUrl ? (
                          <img src={getThumbnailUrl(listing.photoUrl, { width: 150 })} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-slate-200" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${listing.status === 'active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-slate-300 dark:bg-slate-600'}`} />
                            <span className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest">{listing.status === 'active' ? 'Live' : listing.status}</span>
                          </div>
                          <span className="text-sm font-bold text-emerald-600">KSh {listing.pricePerKg}/kg</span>
                        </div>
                        
                        <h3 className="text-[13px] font-bold text-slate-900 dark:text-white capitalize truncate tracking-tight">{listing.material}</h3>
                        
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                            <Scale className="w-4 h-4 text-slate-400" />
                            <span>{itemQuantity} KG</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>{new Date(listing.createdAt || listing.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-slate-200 dark:text-slate-700 shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )}}
                components={{
                  Footer: () => activeTab === 'closed' ? (
                    <div className="pt-4 pb-12 px-4 flex justify-center">
                      <button
                        onClick={handleClearHistory}
                        className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 dark:border-rose-900/30 rounded-xl font-bold text-[10px] capitalize tracking-widest active:scale-95 transition-all flex items-center gap-1.5 shadow-sm hover:bg-rose-100 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear History
                      </button>
                    </div>
                  ) : null
                }}
              />
            )}
          </div>
        )}
      </main>



      {/* ── DELETE CONFIRMATION MODAL ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-[300px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up border border-slate-100 dark:border-slate-800">
            <div className="h-24 bg-rose-500 flex items-center justify-center relative">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-rose-500" />
              </div>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-6 text-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight capitalize italic leading-none mb-1">Cancel Listing?</h2>
              <p className="text-[10px] font-bold text-slate-500 capitalize tracking-widest mb-6">Item will move to Closed tab</p>
              
              <div className="space-y-2">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-xs capitalize tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                >
                  Yes, Cancel
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-xs capitalize tracking-widest active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
