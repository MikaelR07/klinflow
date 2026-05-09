import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Scale, Wallet, 
  CheckCircle2, Navigation, Phone, Clock,
  PackageCheck, Info, ShieldCheck, TrendingUp, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore, useAuthStore, supabase } from '@cleanflow/core';
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
    <div className="min-h-screen bg-[#F8F8FF] dark:bg-slate-900 pb-32 relative">
      <div className="w-full">
        {/* ── SUMMARY SECTION (NOW FULL WIDTH) ── */}
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

        {/* ── TRADES LIST ── */}
        <div className="px-4 space-y-3">
          <AnimatePresence mode='popLayout'>
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
              activeTrades.map((trade, i) => {
                const isExpanded = expandedId === trade.id;
                return (
                  <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
                  >
                    {/* ── COMPACT ROW (Always Visible) ── */}
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                      className="w-full p-4 flex items-center gap-3 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                    >
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl shrink-0 border border-slate-100 dark:border-slate-700">
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
                      <div className="text-right shrink-0 mr-1">
                        <p className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Deal Value</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white tracking-tighter leading-none font-mono">
                          KSh {(trade.total_price || 0).toLocaleString()}
                        </p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* ── EXPANDED DETAILS (Dropdown) ── */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-2 gap-2 pt-3">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Quantity</p>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Scale className="w-3 h-3" /> {trade.bags} KG
                            </p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-tighter">
                              <Clock className="w-3 h-3" /> {trade.status.replace('_', ' ')}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStartMission(trade); }}
                            className="w-full py-3.5 bg-primary text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all group"
                          >
                            <Navigation className="w-4 h-4 group-hover:animate-pulse" />
                            <span className="text-xs font-semibold uppercase tracking-widest">
                              Route to Seller
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
