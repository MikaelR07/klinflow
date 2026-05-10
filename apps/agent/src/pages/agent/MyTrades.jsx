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
        .or('is_market_trade.eq.true,booking_type.eq.marketplace_pickup')
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
    <div className="animate-fade-in space-y-4 pb-24 pt-4 px-4 relative">
      <div className="w-full">
        {/* ── STANDARDIZED HEADER ── */}
        <div className="relative flex items-center justify-center mb-4">
           <button 
             onClick={() => navigate(-1)} 
             className="absolute left-0 w-10 h-10 shrink-0 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-90 transition-all"
           >
             <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
           </button>
           
           <div className="text-center">
              <h1 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Accepted Bids</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Marketplace Trade Control</p>
           </div>
        </div>

        {/* ── QUICK STATS TICKER ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Deals</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white leading-none">{activeTrades.length}</p>
            </div>
            <div className="w-px h-8 bg-slate-100 dark:bg-white/10" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Est. Weight</p>
              <p className="text-lg font-black text-emerald-600 leading-none">
                {activeTrades.reduce((acc, t) => acc + (parseFloat(t.actual_weight_kg || t.quantity) || 0), 0).toLocaleString()} <span className="text-[10px] opacity-50">KG</span>
              </p>
            </div>
            <div className="w-px h-8 bg-slate-100 dark:bg-white/10" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
              <p className="text-lg font-black text-indigo-600 leading-none">
                <span className="text-[10px] mr-0.5">KSh</span>
                {activeTrades.reduce((acc, t) => acc + (parseFloat(t.total_price || t.totalPrice) || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* ── CONTENT AREA ── */}
        <div className="">
          <AnimatePresence mode="wait">
            {expandedId ? (
              <motion.div 
                key="trade-focus"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-white dark:bg-slate-900 overflow-y-auto no-scrollbar pb-24"
              >
                {(() => {
                  const trade = activeTrades.find(t => t.id === expandedId);
                  if (!trade) return null;
                  const photoUrl = trade.photo_url || trade.listing?.photo;
                  
                  return (
                    <div className="max-w-lg mx-auto">
                      {/* Edge-to-Edge Hero Image */}
                      <div className="w-[calc(100%+2rem)] aspect-[4/5] sm:aspect-square bg-slate-900 relative overflow-hidden -mx-4 shadow-xl">
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

                      {/* Content Sheet (Overlaps Image) */}
                      <div className="relative -mt-40 bg-white dark:bg-slate-900 rounded-t-2xl px-3 pt-6 pb-10 space-y-6 z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Active Marketplace Trade</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 leading-none">Secured & Verified Deal</p>
                          </div>
                          <div className="text-right">
                             <div className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-emerald-500/20">
                                {trade.status?.replace('_', ' ')}
                             </div>
                          </div>
                        </div>

                        {/* Unified Material, Merchant & Location Cards */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                            <PackageCheck className="w-3.5 h-3.5 text-indigo-500 mb-2" />
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Asset</p>
                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate w-full">{trade.waste_type || 'Materials'}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mb-2" />
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Seller</p>
                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate w-full">Verified Partner</p>
                          </div>
                          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 mb-2" />
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Origin</p>
                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate w-full">{trade.estate}</p>
                          </div>
                        </div>

                        {/* Trade Financials Card */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Contract Settlement</p>
                               <p className="text-lg font-bold text-slate-800 dark:text-white">
                                 KSh {(parseFloat(trade.total_price || trade.totalPrice) || 0).toLocaleString()}
                               </p>
                             </div>
                             <div className="text-right">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Unit Price</p>
                               <p className="text-xs font-black text-emerald-600 italic">
                                 KES {Math.round((trade.total_price || 0) / (trade.actual_weight_kg || trade.quantity || 1))} /KG
                               </p>
                             </div>
                           </div>

                           <div className="h-px bg-slate-50 dark:bg-slate-700" />

                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                                    <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Locked Volume</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{trade.actual_weight_kg || trade.quantity || 0} KG</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Logistics Context */}
                        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <Navigation className="w-3.5 h-3.5" /> Logistics Instructions
                           </h4>
                           <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                             "{trade.notes || `Please collect ${trade.waste_type || 'materials'} from ${trade.estate}. Ensure weight verification is completed on-site.`}"
                           </p>
                        </div>

                        <div className="pt-4 space-y-3">
                           <button 
                              onClick={() => handleStartMission(trade)}
                              className="w-full py-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all group"
                           >
                              <Navigation className="w-5 h-5 group-hover:animate-pulse" />
                              <span className="font-black text-xs uppercase tracking-[0.2em]">Start Collection</span>
                           </button>
                           <button 
                              onClick={() => setExpandedId(null)}
                              className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"
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
                className="space-y-2"
              >
                {isLoading ? (
                  [1, 2].map(i => (
                    <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
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
                          <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" /> {trade.estate || 'Nairobi'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tighter leading-none font-mono">
                            KSh {(trade.total_price || 0).toLocaleString()}
                          </p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {trade.actual_weight_kg || trade.quantity || 0}kg Contracted
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
