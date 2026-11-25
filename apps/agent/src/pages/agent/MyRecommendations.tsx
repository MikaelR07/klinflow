import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Search,
  PackageCheck,
  AlertCircle,
  Scale,
  MapPin,
  Package,
  CheckCircle2,
  X
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
    <div className="-mx-1 flex flex-col bg-white dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between relative">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <h1 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                My Recommendations
              </h1>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">
                Leads recommended to Hub
              </p>
            </div>

            <div className="w-10 h-10" />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search recommended materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-9 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-emerald-500/50 rounded-xl text-xs font-medium focus:outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Pill Tabs */}
          <div className="flex items-center gap-1.5">
            {(['pending', 'approved', 'rejected'] as const).map(tab => {
              const count = recommendations.filter(r => r.status === tab).length;
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold capitalize transition-all border flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{tab}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[9px] leading-none tabular-nums ${
                      isActive
                        ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 pb-24 pt-[calc(env(safe-area-inset-top,1rem)+10rem)] max-w-lg mx-auto w-full px-2">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedRecommendations.length === 0 ? (
          <div className="mx-1 mt-1 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/60 py-14 px-6 text-center">
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
              <PackageCheck className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1 capitalize">
              No {activeTab} recommendations
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-[230px] mx-auto leading-relaxed">
              {searchTerm
                ? 'Try clearing or adjusting your search query.'
                : 'Leads you recommend from the marketplace will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedRecommendations.map(rec => {
              const listing = rec.listing || {};
              const estTotal = Number(rec.recommended_price_per_kg || 0) * Number(rec.recommended_quantity || 0);
              const statusStyle =
                rec.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : rec.status === 'rejected'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecId(rec.id)}
                  className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-3 cursor-pointer select-none hover:border-emerald-500/40 active:scale-[0.99] transition-all space-y-2 group"
                >
                  {/* Top Row: Thumbnail, Material + Meta, Price (Matches Sourcing.tsx) */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                        {(listing.photo_url || listing.photo) ? (
                          <OptimizedImage
                            src={getThumbnailUrl(listing.photo_url || listing.photo, { width: 150 })}
                            alt={listing.material}
                            className="w-full h-full object-cover"
                            wrapperClassName="w-full h-full"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-[14px] font-bold text-slate-900 dark:text-white capitalize truncate tracking-tight leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {listing.material || 'Unknown Material'}
                          </h3>
                          <span className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold capitalize whitespace-nowrap ${statusStyle}`}>
                            {rec.status || 'Pending'}
                          </span>
                        </div>

                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{listing.location || 'Unknown Location'}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Scale className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            {rec.recommended_quantity} KG
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            {rec.created_at
                              ? new Date(rec.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : 'Recent'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 mt-1">
                      <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 leading-none tabular-nums">
                        KSh {rec.recommended_price_per_kg}
                        <span className="text-[10px] font-semibold text-slate-400">/kg</span>
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-1.5 tabular-nums">
                        Est. KSh {estTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {rec.status === 'approved' && (
                    <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-500/20">
                      <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Approved by Hub. Check your <span className="font-bold">Pickups</span> page.
                      </p>
                    </div>
                  )}
                  {rec.status === 'rejected' && (
                    <div className="pt-2 border-t border-rose-200/60 dark:border-rose-500/20">
                      <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Recommendation declined by Hub.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SELECTED REC DETAILS OVERLAY ── */}
      <AnimatePresence>
        {selectedRec && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[9999] bg-white dark:bg-slate-900 overflow-y-auto pb-8 flex flex-col"
          >
            {/* Nav */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 max-w-lg mx-auto">
              <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3 px-4 flex items-center justify-between relative">
                <button
                  onClick={() => setSelectedRecId(null)}
                  className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0"
                  aria-label="Close details"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                  <h1 className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Recommendation Details
                  </h1>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">
                    Lead submitted to Hub
                  </p>
                </div>
                <div className="w-10 h-10" />
              </div>
            </div>

            <div className="flex-1 space-y-4 px-3 pt-[calc(env(safe-area-inset-top,1rem)+4.75rem)] max-w-lg mx-auto w-full">

              {/* Hero Image + Overlay Title + Status Pill */}
              <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {(selectedRec.listing?.photo_url || selectedRec.listing?.photo) ? (
                  <OptimizedImage
                    src={getThumbnailUrl(selectedRec.listing?.photo_url || selectedRec.listing?.photo, { width: 800 })}
                    className="w-full h-full object-cover"
                    wrapperClassName="w-full h-full"
                    alt="Material"
                  />
                ) : (
                  <Package className="w-14 h-14 text-slate-400" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />

                {/* Top-right Status Pill */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                    selectedRec.status === 'approved'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400/30'
                      : selectedRec.status === 'rejected'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-400/30'
                      : 'bg-amber-950/80 text-amber-300 border-amber-400/30'
                  }`}>
                    {selectedRec.status === 'approved' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : selectedRec.status === 'rejected' ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {selectedRec.status || 'Pending'}
                  </span>
                </div>

                {/* Bottom Material & Location */}
                <div className="absolute bottom-3.5 left-4 right-4 text-white">
                  <h2 className="font-bold text-lg capitalize leading-tight">
                    {selectedRec.listing?.material || 'Unknown Material'}
                  </h2>
                  <p className="text-xs font-medium text-white/85 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{selectedRec.listing?.location || 'Unknown Location'}</span>
                  </p>
                </div>
              </div>

              {/* Unified Details Card (slate-50) */}
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 divide-y divide-slate-200/70 dark:divide-slate-700/60 overflow-hidden">

                {/* Section 1: Hub Review Status */}
                <div className="p-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedRec.status === 'approved'
                      ? 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      : selectedRec.status === 'rejected'
                      ? 'bg-rose-100/80 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400'
                      : 'bg-amber-100/80 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                  }`}>
                    {selectedRec.status === 'approved' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : selectedRec.status === 'rejected' ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                      {selectedRec.status === 'approved'
                        ? 'Accepted by Hub Manager'
                        : selectedRec.status === 'rejected'
                        ? 'Declined by Hub Manager'
                        : 'Pending Hub Review'}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {selectedRec.status === 'approved'
                        ? 'Check your Pickups page for dispatch instructions.'
                        : selectedRec.status === 'rejected'
                        ? 'You can cancel and remove this recommendation below.'
                        : 'Waiting for the Hub Manager to review this lead.'}
                    </p>
                  </div>
                </div>

                {/* Section 2: Your Recommendation Metrics */}
                <div className="p-4 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Your Recommendation
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Recommended Rate</p>
                      <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                        KSh {selectedRec.recommended_price_per_kg}
                        <span className="text-[11px] text-slate-400 font-semibold">/kg</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Recommended Weight</p>
                      <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                        {selectedRec.recommended_quantity}{' '}
                        <span className="text-[11px] text-slate-400 font-semibold">KG</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Estimated Total Value</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      KSh {(Number(selectedRec.recommended_price_per_kg || 0) * Number(selectedRec.recommended_quantity || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Section 3: Original Seller Listing Reference */}
                <div className="p-4 space-y-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Original Seller Listing
                  </p>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Seller Asking Price</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      KSh {selectedRec.listing?.price_per_kg}/kg
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Available Quantity</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {selectedRec.listing?.quantity} KG
                    </span>
                  </div>
                  {selectedRec.created_at && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Submitted</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(selectedRec.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* Actions */}
              <div className="pt-1 pb-6 space-y-2.5">
                {selectedRec.status !== 'approved' && (
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="w-full py-3.5 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-2xl font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-500/30 disabled:opacity-50"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Recommendation'}
                  </button>
                )}

                <button
                  onClick={() => setSelectedRecId(null)}
                  className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all"
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
