import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Scale, Wallet, 
  CheckCircle2, Navigation, Phone, Clock,
  PackageCheck, Info, ShieldCheck, TrendingUp, ChevronDown, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore, useAuthStore, supabase, getThumbnailUrl } from '@cleanflow/core';
import { toast } from 'sonner';

export default function MyTrades() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [activeTrades, setActiveTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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
        .eq('is_market_trade', true)
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MyTrades] Fetch Error:', error);
        throw error;
      }

      console.log('[MyTrades] Found Trades:', data?.length || 0, data);
      setActiveTrades(data || []);
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

  const handleStartMission = async (trade) => {
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
      toast.error('Failed to start mission', { description: err.message });
      setIsLoading(false); // only set false on error, if success we navigate away
    }
  };

  return (
    <div className="animate-fade-in bg-[#F2F3F4] dark:bg-slate-900 pb-10 relative px-2 min-h-screen">
      <div className="w-full">
        {/* ── SUMMARY SECTION ── */}
        <div className="bg-slate-900 dark:bg-slate-950 p-4 pt-6 pb-4 text-white mb-6 mt-4 relative overflow-hidden shadow-xl shadow-slate-900/10 rounded-[2.5rem]">
           <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
           <div className="relative z-10 flex items-center justify-between">
              <div className="pl-2">
                 <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-0.5">Total Pledged</p>
                 <h2 className="text-xl font-semibold tracking-tighter text-emerald-400">
                   KSh {activeTrades.reduce((acc, t) => acc + (parseFloat(t.total_price || t.totalPrice) || 0), 0).toLocaleString()}
                 </h2>
              </div>
              <div className="w-px h-8 bg-white/10 mx-4" />
              <div className="flex-1 text-right pr-2">
                 <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-0.5">Live Bids</p>
                 <h2 className="text-xl font-semibold tracking-tighter text-white">{activeTrades.length}</h2>
              </div>
           </div>
        </div>

        {/* ── CONTENT AREA ── */}
        <div className="px-4">
          <AnimatePresence mode="wait">
            {expandedId ? (
              <motion.div 
                key="trade-focus"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-[#F2F3F4] dark:bg-slate-900 overflow-y-auto no-scrollbar pb-24"
              >
                {(() => {
                  const trade = activeTrades.find(t => t.id === expandedId);
                  if (!trade) return null;
                  const photoUrl = trade.photo_url || trade.listing?.photo;
                  
                  return (
                    <>
                      {/* Edge-to-Edge Hero Image */}
                      <div className="w-full aspect-[4/5] sm:aspect-square bg-slate-900 relative overflow-hidden">
                        {photoUrl ? (
                          <img src={getThumbnailUrl(photoUrl, { width: 800 })} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                            <div className="text-6xl mb-4">{trade.listing?.emoji || '♻️'}</div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Asset Visual Unavailable</p>
                          </div>
                        )}

                        <button 
                          onClick={() => setExpandedId(null)}
                          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
                          className="absolute left-6 z-20 p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-all shadow-xl"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Content Sheet */}
                      <div className="bg-[#F2F3F4] dark:bg-slate-900 px-3 pt-10 pb-10 space-y-6 rounded-t-xl -mt-6 relative z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-2">
                              {trade.listing?.material || trade.waste_type || 'Recyclables'}
                            </h2>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-emerald-500" />
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trade.estate || 'Nairobi'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                             <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter">
                                {trade.status?.replace('_', ' ')}
                             </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Volume</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">{trade.bags || 0} KG</p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contract Value</p>
                            <p className="text-lg font-black text-emerald-600">KSh {(trade.total_price || 0).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Logistics Route</h4>
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                                 <Navigation className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">{trade.location || 'Point to Point'}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optimized Transit</p>
                              </div>
                           </div>
                        </div>

                        <div className="pt-4">
                           <button 
                              onClick={() => handleStartMission(trade)}
                              className="w-full py-4 bg-primary text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all group mb-3"
                           >
                              <Navigation className="w-5 h-5 group-hover:animate-pulse" />
                              <span className="font-black text-xs uppercase tracking-[0.2em]">Route to Seller</span>
                           </button>
                           <button 
                              onClick={() => setExpandedId(null)}
                              className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"
                           >
                              Return to Radar
                           </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div
                key="list-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {isLoading ? (
                  [1, 2].map(i => (
                    <div key={i} className="h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
                  ))
                ) : activeTrades.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <TrendingUp className="w-10 h-10" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">No accepted trades</h3>
                    <p className="text-[11px] text-slate-400 mt-2">Check the Radar to find new materials.</p>
                  </div>
                ) : (
                  activeTrades.map((trade, i) => (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
                    >
                      <button 
                        onClick={() => setExpandedId(trade.id)}
                        className="w-full p-4 flex items-center gap-3 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                      >
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl shrink-0 border border-slate-100 dark:border-slate-700">
                          {trade.listing?.emoji || '♻️'}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-white leading-none uppercase tracking-tight truncate">
                            {trade.listing?.material || trade.waste_type || 'Recyclables'}
                          </h4>
                          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" /> {trade.estate || 'Nairobi'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tighter leading-none font-mono">
                            KSh {(trade.total_price || 0).toLocaleString()}
                          </p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {trade.bags || 0}kg Contracted
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 ml-1" />
                      </button>
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
