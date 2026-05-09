/**
 * MarketplaceInventory.jsx — Manage Live B2B Listings
 */
import { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, ArrowLeft,
  Trash2, MapPin, Scale, ChevronRight,
  Tag, AlertCircle, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketplaceStore, useAuthStore, getThumbnailUrl } from '@cleanflow/core';
import { EmptyState, LoadingScreen } from '@cleanflow/ui';
import { toast } from 'sonner';

export default function MarketplaceInventory() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { 
    myListings, 
    fetchMyActivity, 
    deleteListing, 
    isLoading 
  } = useMarketplaceStore();
  
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetchMyActivity();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    try {
      await deleteListing(id);
      setSelectedId(null);
      toast.success('Listing Removed', { description: 'The item has been withdrawn from the market.' });
    } catch (err) {
      toast.error('Failed to remove', { description: err.message });
    }
  };

  const selectedListing = myListings.find(l => l.id === selectedId);

  const filteredListings = myListings.filter(l => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      l.material.toLowerCase().includes(q) ||
      String(l.quantity).includes(q) ||
      String(l.pricePerKg).includes(q);
    const matchesTab = activeTab === 'active' ? l.status === 'active' : l.status !== 'active';
    return matchesSearch && matchesTab;
  });

  if (isLoading && myListings.length === 0) return <LoadingScreen />;

  return (
    <div className="bg-[#F2F3F4] dark:bg-slate-900 overscroll-none px-2 -mt-5 pt-5">
      
      {/* ── HEADER (Hidden when focused) ── */}
      {!selectedId && (
        <header className="px-4 pt-1 pb-4">
          <div className="flex items-center justify-center relative mb-3">
            <button 
              onClick={() => navigate(-1)}
              className="absolute left-0 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="bg-white dark:bg-slate-800/50 py-1.5 px-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-widest uppercase">Manage your listings</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search listings..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex gap-5 mt-5 px-1">
            {['active', 'closed'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all ${
                  activeTab === tab ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </header>
      )}

      <main className="mt-0">
        {selectedId && selectedListing ? (
          /* ── FOCUSED DETAIL VIEW (AGENT SOURCING STYLE) ── */
          <div className="animate-fade-in -mx-4 -mt-7">
            
            {/* Edge-to-Edge Hero Image */}
            <div className="w-full aspect-[3/2] bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
              
              {/* Overlaid Back Button */}
              <button 
                onClick={() => setSelectedId(null)}
                className="absolute top-8 left-6 z-20 p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-all shadow-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full w-full">
                {(selectedListing.photos?.length > 0 ? selectedListing.photos : [selectedListing.photo]).map((imgUrl, idx) => (
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
              
              {(selectedListing.photos?.length > 1) && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {selectedListing.photos.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white shadow-lg opacity-60 first:opacity-100" />
                  ))}
                </div>
              )}


            </div>

            {/* Content Sheet (Overlaps Image) */}
            <div className="bg-[#F2F3F4] dark:bg-slate-900 px-4 pt-5 pb-2 space-y-4">
              
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="bg-white dark:bg-slate-800/50 py-1.5 px-3 rounded-xl border border-slate-100 dark:border-slate-800 w-fit">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{selectedListing.material}</h2>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 py-1.5 px-3 rounded-xl border border-slate-100 dark:border-slate-800 w-fit flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest italic">{selectedListing.location || 'Nairobi Hub'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                     <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                       Posted {new Date(selectedListing.created_at || selectedListing.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                     </p>
                  </div>
                </div>

              {/* Stats Row - Three Column Industrial */}
              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-white dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Asking Rate</p>
                  <p className="text-sm font-black text-emerald-600 italic">KSh {selectedListing.pricePerKg}</p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">/ KG</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inventory</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white italic">{selectedListing.quantity}</p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">KG LOAD</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Est. Value</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white italic">KSh {(selectedListing.pricePerKg * selectedListing.quantity).toLocaleString()}</p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Net Total</p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</h4>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  {selectedListing.description || "No description provided"}
                </p>
              </div>
              {/* Management Controls */}
              <div className="space-y-2">
                <button 
                  onClick={() => handleDelete(selectedListing.id)}
                  className="w-full py-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-2 border-rose-100 dark:border-rose-900/30 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Trash2 className="w-4 h-4" /> Withdraw Listing
                </button>
                <button 
                  onClick={() => setSelectedId(null)}
                  className="w-full py-3.5 bg-white dark:bg-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all"
                >
                  Return to Inventory
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── MAIN LIST VIEW ── */
          <div className="space-y-1.5">
            {filteredListings.length === 0 ? (
              <div className="py-20 px-4 text-center">
                <EmptyState 
                  icon={Package}
                  title={activeTab === 'active' ? "No Live Listings" : "No Past Listings"}
                  subtitle={activeTab === 'active' ? "Your marketplace posts will appear here." : "Your history is currently empty."}
                />
              </div>
            ) : (
              filteredListings.map(listing => (
                <div 
                  key={listing.id}
                  onClick={() => setSelectedId(listing.id)}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                      {listing.photo ? (
                        <img src={getThumbnailUrl(listing.photo, { width: 200 })} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${listing.status === 'active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{listing.status === 'active' ? 'Live' : 'Closed'}</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600">KSh {listing.pricePerKg}/kg</span>
                      </div>
                      
                      <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase truncate tracking-tight">{listing.material}</h3>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Scale className="w-3.5 h-3.5" />
                          <span>{listing.quantity} KG</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(listing.createdAt || listing.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-slate-200 dark:text-slate-700">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Helper Card (Only in list view) */}
      {!selectedId && filteredListings.length > 0 && (activeTab === 'active') && (
        <div className="px-4 mt-6">
          <div className="bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl p-4 relative overflow-hidden border border-emerald-100 dark:border-emerald-500/20">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 leading-none mb-1.5">Market Strategy</h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-100/60 leading-snug font-medium">
                  Adding clear photos increases your chance of an agent bid by <span className="text-emerald-900 dark:text-white font-bold italic">40%</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
