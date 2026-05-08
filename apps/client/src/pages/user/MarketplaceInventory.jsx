/**
 * MarketplaceInventory.jsx — Manage Live B2B Listings
 */
import { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, ArrowLeft,
  Trash2, MapPin, Scale, ChevronRight,
  Tag, AlertCircle
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
    const matchesSearch = l.material.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'active' ? l.status === 'active' : l.status !== 'active';
    return matchesSearch && matchesTab;
  });

  if (isLoading && myListings.length === 0) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#F4F4F4] dark:bg-slate-950 pb-24">
      
      {/* ── HEADER (Hidden when focused) ── */}
      {!selectedId && (
        <header className="px-4 pt-4 pb-4">
          <div className="flex items-center justify-between mb-5">
            <button 
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 active:scale-95 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight uppercase">My Inventory</h1>
            <button 
              onClick={() => navigate('/post-trade')}
              className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
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

      <main className="mt-2">
        {selectedId && selectedListing ? (
          /* ── FOCUSED DETAIL VIEW (AGENT SOURCING STYLE) ── */
          <div className="animate-fade-in -mx-2 -mt-7">
            
            {/* Edge-to-Edge Hero Image */}
            <div className="w-full aspect-[4/3] bg-slate-200 dark:bg-slate-800 overflow-hidden relative shadow-lg">
              
              {/* Overlaid Back Button */}
              <button 
                onClick={() => setSelectedId(null)}
                className="absolute top-8 left-6 z-20 flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-all shadow-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[9px] font-semibold uppercase tracking-widest">Back</span>
              </button>

              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full w-full">
                {(selectedListing.photos?.length > 0 ? selectedListing.photos : [selectedListing.photo]).map((imgUrl, idx) => (
                  <div key={idx} className="flex-none w-full h-full snap-start">
                    {imgUrl ? (
                      <img src={imgUrl} className="w-full h-full object-cover" alt={`${selectedListing.material} - View ${idx + 1}`} />
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

              <div className="absolute top-8 right-6 px-3 py-1.5 bg-black/40 backdrop-blur-xl text-white rounded-full text-[9px] font-semibold uppercase tracking-[0.2em] shadow-lg">
                Grade {selectedListing.grade || 'A'}
              </div>
            </div>

            {/* Content Sheet (Overlaps Image) */}
            <div className="relative -mt-8 bg-[#F4F4F4] dark:bg-slate-950 rounded-t-3xl px-6 pt-8 pb-12 space-y-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none min-h-[60vh]">
              
              {/* Title & Stats */}
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight italic">{selectedListing.material}</h2>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${selectedListing.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Listing {selectedListing.status}</p>
                </div>
              </div>

              {/* Stats Row - Three Column Industrial */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 text-center shadow-sm">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Asking Rate</p>
                  <p className="text-base font-black text-emerald-600 italic">KSh {selectedListing.pricePerKg}</p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">/ KG</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 text-center shadow-sm">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inventory</p>
                  <p className="text-base font-black text-slate-900 dark:text-white italic">{selectedListing.quantity}</p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">KG LOAD</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 text-center shadow-sm">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Est. Value</p>
                  <p className="text-base font-black text-slate-900 dark:text-white italic">KSh {(selectedListing.pricePerKg * selectedListing.quantity).toLocaleString()}</p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Net Total</p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Listing Intelligence</h4>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  {selectedListing.description || "No detailed description provided for this listing. High-quality descriptions improve buyer confidence by 30%."}
                </p>
              </div>

              {/* Location */}
              <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner">
                    <MapPin className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Warehouse Location</p>
                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase italic">{selectedListing.location || 'Nairobi Hub'}</p>
                  </div>
                </div>
              </div>

              {/* Management Controls */}
              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => handleDelete(selectedListing.id)}
                  className="w-full py-5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-2 border-rose-100 dark:border-rose-900/30 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-500/5"
                >
                  <Trash2 className="w-4 h-4" /> Withdraw Listing
                </button>
                <button 
                  onClick={() => setSelectedId(null)}
                  className="w-full py-5 bg-white dark:bg-slate-800 text-slate-400 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all"
                >
                  Return to Inventory
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── MAIN LIST VIEW ── */
          <div className="space-y-1">
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
                  className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/50 p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                      {listing.photo ? (
                        <img src={getThumbnailUrl(listing.photo, { width: 200 })} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Live</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600">KSh {listing.pricePerKg}/kg</span>
                      </div>
                      
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase truncate tracking-tight">{listing.material}</h3>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                          <Scale className="w-3.5 h-3.5" />
                          <span>{listing.quantity} KG</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[100px]">{listing.location || 'Nairobi'}</span>
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
          <div className="bg-slate-800 dark:bg-slate-900/50 rounded-3xl p-4 text-white shadow-lg relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-[9px] font-semibold uppercase tracking-widest text-emerald-400 leading-none mb-1">Market Strategy</h4>
                <p className="text-[10px] text-slate-300 leading-tight font-medium">
                  Adding clear photos increases your chance of an agent bid by <span className="text-white font-semibold">40%</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
