import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Scale, Wallet, 
  CheckCircle2, Navigation, Phone, Clock,
  PackageCheck, Info, ShieldCheck, TrendingUp, ChevronDown, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { toast } from 'sonner';
import type { Database } from '@klinflow/supabase';

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type ListingRow = Database['public']['Tables']['marketplace_listings']['Row'];
type TradeWithListing = BookingRow & { listing: ListingRow | null };

function getMaterialEmoji(material: string | null | undefined): string {
  if (!material) return '♻️';
  const m = material.toLowerCase();
  if (m.includes('plastic') || m.includes('pet') || m.includes('hdpe') || m.includes('ldpe') || m.includes('pp')) return '🥤';
  if (m.includes('paper') || m.includes('cardboard') || m.includes('carton')) return '📦';
  if (m.includes('glass') || m.includes('bottle')) return '🍾';
  if (m.includes('metal') || m.includes('copper') || m.includes('brass') || m.includes('alu') || m.includes('can')) return '🥫';
  if (m.includes('organic') || m.includes('food') || m.includes('compost')) return '🍎';
  if (m.includes('electronic') || m.includes('e-waste') || m.includes('tech') || m.includes('phone') || m.includes('computer')) return '💻';
  return '♻️';
}

export default function MyTrades() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [activeTrades, setActiveTrades] = useState<TradeWithListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchActiveTrades = async () => {
    if (!profile?.id) {
      console.warn('[MyTrades] Fetch attempted without Agent ID');
      return;
    }
    
    setIsLoading(true);
    console.log('[MyTrades] Fetching trades for Agent:', profile.id);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          listing:marketplace_listings(*)
        `)
        .eq('agent_id', profile.id)
        .or('is_market_trade.eq.true,booking_type.eq.marketplace_pickup')
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MyTrades] Fetch Error:', error);
        throw error;
      }

      console.log('[MyTrades] Found Trades:', data?.length || 0, data);
      const filteredData = (data || []).filter(d => d.booking_type !== 'dropoff');
      setActiveTrades(filteredData as unknown as TradeWithListing[]);
    } catch (err) {
      console.error('Fetch trades failed:', err);
      toast.error('Failed to load active trades');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchActiveTrades();

      // Subscribe to trade updates
      const channel = supabase.channel(`agent-trades-${profile.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'bookings',
          filter: `agent_id=eq.${profile.id}`
        }, (payload) => {
          console.log('[MyTrades] Realtime Update:', payload);
          fetchActiveTrades();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.id]);

  const handleStartMission = async (trade: TradeWithListing) => {
    try {
      setIsLoading(true);
      
      // If it's pending, mark it in-progress so it moves to active missions
      if (trade.status === 'pending') {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'in-progress' })
          .eq('id', trade.id);
          
        if (error) throw error;
      }
      
      // Navigate to the mission map
      navigate(`/jobs/navigate/${trade.id}`);
    } catch (err) {
      console.error('[MyTrades] Start Mission Error:', err);
      toast.error('Failed to start mission', { description: (err as Error).message });
      setIsLoading(false); // only set false on error, if success we navigate away
    }
  };

  return (
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV (Fixed PWA Style) ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1rem)]  px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
        <div className="max-w-lg mx-auto">
          {/* Header row */}
          <div className="flex items-center gap-3 ">
             <button 
               onClick={() => navigate(-1)} 
               className="w-8 h-8 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group"
             >
               <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
             </button>
             
             <div className="flex-1 flex items-center justify-between">
               <div>
                  <h1 className="text-base font-bold text-slate-600 dark:text-white capitalize tracking-tight leading-none">Marketplace Bids</h1>
                  <p className="text-[10px] font-bold text-slate-500 capitalize tracking-widest mt-0.5">View Requests accepted by sellers</p>
               </div>
             </div>
          </div>

          {/* Stats row - Inside the fixed header */}
          <div className="flex bg-slate-50 dark:bg-slate-800/60 rounded-lg p-1 border border-slate-100 dark:border-slate-700/50">
            <div className="flex-1 text-center py-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Active</p>
              <p className="text-xs font-black text-slate-800 dark:text-white leading-none">{activeTrades.length}</p>
            </div>
            <div className="w-px bg-slate-200 dark:bg-slate-700/50 mx-1" />
            <div className="flex-1 text-center py-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Weight</p>
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 leading-none">
                {activeTrades.reduce((acc, t) => acc + (t.actual_weight_kg || t.listing?.quantity || 0), 0).toLocaleString()} <span className="text-[8px] opacity-70">KG</span>
              </p>
            </div>
            <div className="w-px bg-slate-200 dark:bg-slate-700/50 mx-1" />
            <div className="flex-1 text-center py-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Value</p>
              <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 leading-none">
                <span className="text-[8px] mr-0.5 opacity-70">KSh</span>
                {activeTrades.reduce((acc, t) => acc + (t.total_price || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-0 pb-24 pt-[calc(env(safe-area-inset-top,1rem)+5em)] relative max-w-lg mx-auto w-full">

        {/* ── CONTENT AREA ── */}
        <div className="">
          <AnimatePresence mode="wait">
            {expandedId ? (
              <motion.div 
                key="trade-focus"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-800 overflow-y-auto overflow-x-hidden no-scrollbar pb-6"
              >
                {(() => {
                  const trade = activeTrades.find(t => t.id === expandedId);
                  if (!trade) return null;
                  const photoUrl = trade.photo_url || trade.listing?.photo_url;
                  
                  // mock photos array if only one
                  const photos = photoUrl ? [photoUrl] : [];

                  return (
                    <div className="max-w-lg mx-auto">
                      {/* ── FIXED TOP NAV ── */}
                      <div className="fixed top-0 left-0 right-0 z-50 w-full max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
                        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
                          <button onClick={() => setExpandedId(null)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
                            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                          </button>
                          <div>
                            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Trade Details</h1>
                            <p className="text-[10px] font-bold text-emerald-600 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Marketplace Trade
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)]">
                        {/* ── IMAGE CAROUSEL ── */}
                        <div className="relative h-[270px] w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-900">
                          <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                            {photos.length > 0 ? photos.map((imgUrl, idx) => (
                              <div key={idx} className="w-full h-full shrink-0 snap-center">
                                <OptimizedImage src={getThumbnailUrl(imgUrl, { width: 800 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" alt={`${trade.waste_type || trade.listing?.material} - View ${idx + 1}`} />
                              </div>
                            )) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800">
                                <div className="text-6xl mb-4">{getMaterialEmoji(trade.waste_type || trade.listing?.material || '')}</div>
                                <p className="text-[10px] font-bold text-slate-500 capitalize tracking-[0.2em]">Asset Visual Unavailable</p>
                              </div>
                            )}
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />

                          {photos.length > 1 && (
                            <>
                              <div className="absolute top-4 right-4 z-10 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                                <span>Photos ({photos.length})</span>
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                              </div>
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {photos.map((_, i) => (
                                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white shadow-lg opacity-50 first:opacity-100" />
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* ── MATERIAL SPECIFICATIONS CARD ── */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material</p>
                              <h2 className="text-[16px] font-bold text-indigo-700 dark:text-white capitalize leading-tight">
                                {trade.waste_type || trade.listing?.material || 'Recyclables'}
                              </h2>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20">
                              <span className="text-[9px] font-black uppercase tracking-wider leading-none mt-px">{trade.status?.replace('_', ' ')}</span>
                            </div>
                          </div>

                          <hr className="border-slate-100 dark:border-slate-800/60" />

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                              <Wallet className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Contract Settlement</p>
                                <p className="text-xs font-black text-slate-900 dark:text-white">KSh {(trade.total_price || 0).toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <Scale className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Locked Volume</p>
                                <span className="text-xs font-black text-slate-900 dark:text-white">{trade.actual_weight_kg || trade.listing?.quantity || 0} KG</span>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Origin</p>
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{trade.estate}</span>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Seller</p>
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Verified Partner</span>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3 col-span-2">
                               <TrendingUp className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                               <div>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Unit Price</p>
                                 <span className="text-xs font-black text-slate-900 dark:text-white">KES {Math.round((trade.total_price || 0) / (trade.actual_weight_kg || trade.listing?.quantity || 1))} /KG</span>
                               </div>
                            </div>
                          </div>

                          <hr className="border-slate-100 dark:border-slate-800/60" />

                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                              <Navigation className="w-3.5 h-3.5" /> Logistics Instructions
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-350 italic">
                              "{trade.notes || `Please collect ${trade.waste_type || 'materials'} from ${trade.estate}. Ensure weight verification is completed on-site.`}"
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 pb-8 space-y-3">
                           <button 
                              onClick={() => handleStartMission(trade)}
                              className="w-full py-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all group"
                           >
                              <Navigation className="w-5 h-5 group-hover:animate-pulse" />
                              <span className="font-black text-xs capitalize tracking-[0.2em]">Start Collection</span>
                           </button>
                           <button 
                              onClick={() => setExpandedId(null)}
                              className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-2xl font-black text-xs capitalize tracking-[0.2em] active:scale-95 transition-all"
                           >
                              Return to List
                           </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div
                key="list-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-0"
              >
                {isLoading ? (
                  [1, 2].map(i => (
                    <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                  ))
                ) : activeTrades.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <TrendingUp className="w-10 h-10" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-400 capitalize tracking-widest">No accepted trades</h3>
                    <p className="text-[11px] text-slate-400 mt-2">Check the Radar to find new materials.</p>
                  </div>
                ) : (
                  activeTrades.map((trade, i) => (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 transition-all overflow-hidden"
                    >
                      <div 
                        onClick={() => setExpandedId(trade.id)}
                        className="bg-white dark:bg-slate-900/60 py-3 px-3.5 shadow-sm border-b border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <div className="flex gap-3">
                          <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-800">
                            {(trade.photo_url || trade.listing?.photo_url) ? (
                              <OptimizedImage src={getThumbnailUrl(trade.photo_url || trade.listing?.photo_url, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" alt={trade.listing?.material || trade.waste_type} />
                            ) : (
                              getMaterialEmoji(trade.waste_type || trade.listing?.material)
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            {/* Row 1: Material & Price */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white capitalize truncate tracking-tight">{trade.listing?.material || trade.waste_type || 'Recyclables'}</h3>
                              </div>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tighter shrink-0 ml-2">KSh {(trade.total_price || 0).toLocaleString()}</span>
                            </div>

                            {/* Row 2: Location */}
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize truncate max-w-[150px]">
                                <MapPin className="w-2.5 h-2.5 text-green-500" /> {trade.estate || 'Nairobi'}
                              </p>
                            </div>

                            {/* Row 3: Seller & Quantity */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/50 mt-1">
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0">
                                <ShieldCheck className="w-2.5 h-2.5 text-slate-400" /> Verified Partner
                              </p>
                              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize shrink-0">
                                <span className="text-[10px] text-slate-400 not-italic font-bold mr-1 opacity-70">Weight:</span>
                                <Scale className="w-2.5 h-2.5" /> {trade.actual_weight_kg || trade.listing?.quantity || 0} KG
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center text-slate-300">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
