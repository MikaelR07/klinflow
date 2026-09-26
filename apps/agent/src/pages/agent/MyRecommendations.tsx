import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Clock, Search, PackageCheck, AlertCircle, TrendingUp, Scale, MapPin, ChevronRight, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

export default function MyRecommendations() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const selectedRec = recommendations.find(r => r.id === selectedRecId);

  const handleCancel = async () => {
    if (!selectedRecId) return;
    setIsCancelling(true);
    try {
      const { error } = await supabase.from('agent_recommendations').delete().eq('id', selectedRecId);
      if (error) throw error;
      toast.success('Recommendation cancelled successfully');
      setRecommendations(prev => prev.filter(r => r.id !== selectedRecId));
      setSelectedRecId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel recommendation');
    } finally {
      setIsCancelling(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!profile?.id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('agent_recommendations')
        .select(`
          *,
          listing:marketplace_listings(*)
        `)
        .eq('agent_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (err) {
      console.error('Fetch recommendations failed:', err);
      toast.error('Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchRecommendations();

      const channel = supabase.channel(`agent-recs-${profile.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'agent_recommendations',
          filter: `agent_id=eq.${profile.id}`
        }, () => {
          fetchRecommendations();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.id]);

  const displayedRecommendations = recommendations.filter(r => 
    r.status === activeTab &&
    (searchTerm === '' || r.listing?.material?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-800 transition-colors ">
      {/* TOP NAV */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)] px-4 border-b border-slate-200 dark:border-slate-600 shadow-sm max-w-lg mx-auto">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => navigate(-1)} 
               className="w-8 h-8 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group"
             >
               <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
             </button>
             
             <div className="flex-1">
                <h1 className="text-base font-bold text-slate-600 dark:text-white capitalize tracking-tight leading-none">My Recommendations</h1>
                <p className="text-[10px] font-bold text-slate-500 capitalize tracking-widest mt-0.5">Leads recommended to Hub</p>
             </div>
          </div>

          <div className="mt-3 mb-2 px-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-primary transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="mt-1 flex bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-xl">
             {(['pending', 'approved', 'rejected'] as const).map(tab => {
                const count = recommendations.filter(r => r.status === tab).length;
                return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-1.5 text-[10px] font-bold capitalize tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 relative ${activeTab === tab
                    ? 'bg-indigo-600 shadow-sm text-white font-black'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                  <span className="truncate">{tab}</span>
                  {count > 0 && (
                    <span className={`ml-1 px-1.5 rounded-full text-[8px] ${activeTab === tab ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>{count}</span>
                  )}
                </button>
              )})}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-0 pb-24 pt-[calc(env(safe-area-inset-top,1rem)+8.5em)] max-w-lg mx-auto w-full">
        {isLoading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : displayedRecommendations.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <PackageCheck className="w-10 h-10 text-slate-300 mb-3" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No {activeTab} recommendations</p>
          </div>
        ) : (
          displayedRecommendations.map(rec => {
            const listing = rec.listing || {};
            return (
              <div
                key={rec.id}
                onClick={() => setSelectedRecId(rec.id)}
                className="bg-white dark:bg-slate-900/60 py-3 px-3.5 shadow-sm border-b border-slate-100 dark:border-slate-700 transition-colors cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/50"
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-800">
                    {(listing.photo_url || listing.photo) ? (
                      <OptimizedImage src={getThumbnailUrl(listing.photo_url || listing.photo, { width: 150 })} alt={listing.material} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    {/* Row 1: Material & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white capitalize tracking-tight">
                          {listing.material || 'Unknown Material'}
                        </h3>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider shrink-0 ${
                        rec.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        rec.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}>
                        {rec.status || 'Pending'}
                      </span>
                    </div>

                    {/* Row 2: Location & Price */}
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize truncate max-w-[150px]">
                        <MapPin className="w-2.5 h-2.5 text-green-500" /> {listing.location || 'Unknown Location'}
                      </p>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tighter shrink-0 ml-2">KSh {rec.recommended_price_per_kg}/kg</span>
                    </div>

                    {/* Row 3: Timestamp & Quantity */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/50 mt-1">
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0">
                        <Clock className="w-2.5 h-2.5 text-slate-400" /> {rec.created_at ? new Date(rec.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </p>
                      <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize shrink-0">
                        <span className="text-[9px] text-slate-400 not-italic font-bold mr-1 opacity-70">Weight:</span>
                        <Scale className="w-2.5 h-2.5" /> {rec.recommended_quantity} KG
                      </p>
                    </div>
                  </div>
                </div>
                
                {rec.status === 'approved' && (
                  <div className="mt-3 pt-2 border-t border-emerald-100 dark:border-emerald-500/20">
                    <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved by Hub. Check your <span className="font-bold">Missions</span> page.
                    </p>
                  </div>
                )}
                {rec.status === 'rejected' && (
                  <div className="mt-3 pt-2 border-t border-rose-100 dark:border-rose-500/20">
                    <p className="text-[10px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Recommendation declined by Hub.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SELECTED REC DETAILS OVERLAY */}
      <AnimatePresence>
        {selectedRec && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-800 overflow-y-auto pb-6 flex flex-col"
          >
            {/* Nav */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 shadow-sm max-w-lg mx-auto">
              <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
                <button onClick={() => setSelectedRecId(null)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
                  <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Recommendation Details</h1>
                  <p className="text-[10px] font-bold text-indigo-500 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                    Lead submitted to Hub
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 px-4 pt-[calc(env(safe-area-inset-top,1rem)+5rem)] max-w-lg mx-auto w-full">
              
              {/* Image */}
              <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-900 flex items-center justify-center">
                {(selectedRec.listing?.photo_url || selectedRec.listing?.photo) ? (
                  <OptimizedImage src={getThumbnailUrl(selectedRec.listing?.photo_url || selectedRec.listing?.photo, { width: 800 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" alt="Material" />
                ) : (
                  <Package className="w-16 h-16 text-slate-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 text-white">
                  <h2 className="font-bold text-lg capitalize drop-shadow-md">{selectedRec.listing?.material || 'Unknown'}</h2>
                  <p className="text-xs font-medium text-white/80 drop-shadow-md flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" /> {selectedRec.listing?.location || 'Unknown Location'}
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                selectedRec.status === 'approved' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' :
                selectedRec.status === 'rejected' ? 'bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20' :
                'bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  selectedRec.status === 'approved' ? 'bg-emerald-200 text-emerald-600' :
                  selectedRec.status === 'rejected' ? 'bg-rose-200 text-rose-600' :
                  'bg-amber-200 text-amber-600'
                }`}>
                  {selectedRec.status === 'approved' ? <CheckCircle2 className="w-4 h-4" /> :
                   selectedRec.status === 'rejected' ? <AlertCircle className="w-4 h-4" /> :
                   <Clock className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className={`text-sm font-bold capitalize ${
                    selectedRec.status === 'approved' ? 'text-emerald-700 dark:text-emerald-400' :
                    selectedRec.status === 'rejected' ? 'text-rose-700 dark:text-rose-400' :
                    'text-amber-700 dark:text-amber-400'
                  }`}>{selectedRec.status}</h3>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {selectedRec.status === 'approved' ? 'This recommendation was accepted by the Hub Manager. Check your Missions page for the dispatch instructions.' :
                     selectedRec.status === 'rejected' ? 'This recommendation was declined by the Hub Manager. You can cancel and remove it from your list.' :
                     'Waiting for the Hub Manager to review this lead.'}
                  </p>
                </div>
              </div>

              {/* Rec Details */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Your Recommendation</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <p className="text-[10px] font-semibold text-slate-500 mb-1">Recommended Price</p>
                     <p className="text-base font-black text-slate-800 dark:text-white">KSh {selectedRec.recommended_price_per_kg}<span className="text-[10px] text-slate-400 font-bold">/kg</span></p>
                  </div>
                  <div>
                     <p className="text-[10px] font-semibold text-slate-500 mb-1">Total Weight</p>
                     <p className="text-base font-black text-slate-800 dark:text-white">{selectedRec.recommended_quantity} <span className="text-[10px] text-slate-400 font-bold">KG</span></p>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800/60 my-3" />

                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500">Total Value</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    KSh {(selectedRec.recommended_price_per_kg * selectedRec.recommended_quantity).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Original Listing */}
              <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800/50">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Original Listing Data</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Asking Price:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">KSh {selectedRec.listing?.price_per_kg}/kg</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Available Quantity:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{selectedRec.listing?.quantity} KG</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 pb-6 space-y-3">
                {selectedRec.status !== 'approved' && (
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="w-full py-4 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-xl font-black text-xs capitalize tracking-[0.2em] shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-500/30 disabled:opacity-50"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Recommendation'}
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedRecId(null)}
                  className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 rounded-xl font-black text-xs capitalize tracking-[0.2em] active:scale-95 transition-all shadow-sm"
                >
                  Close
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
