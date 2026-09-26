import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/supabase';
import { 
  ArrowLeft, MapPin, Scale, Wallet, 
  CheckCircle2, Navigation, ShieldCheck, TrendingUp
} from 'lucide-react';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { toast } from 'sonner';

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

export default function TradeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTradeDetails();
    }
  }, [id]);

  const fetchTradeDetails = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          listing:marketplace_listings(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setTrade(data);
    } catch (err) {
      console.error('Fetch trade details failed:', err);
      toast.error('Failed to load trade details');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMission = async () => {
    if (!trade) return;
    try {
      setIsLoading(true);
      if (trade.status === 'pending') {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'in-progress' })
          .eq('id', trade.id);
        if (error) throw error;
      }
      navigate(`/jobs/navigate/${trade.id}`);
    } catch (err) {
      console.error('[TradeDetails] Start Mission Error:', err);
      toast.error('Failed to start mission', { description: (err as Error).message });
      setIsLoading(false);
    }
  };

  if (isLoading || !trade) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-800">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const photoUrl = trade.photo_url || trade.listing?.photo_url;
  const photos = photoUrl ? [photoUrl] : [];

  return (
    <div className="bg-slate-50 dark:bg-slate-800 min-h-screen pb-6">
      <div className="max-w-lg mx-auto">
        {/* ── FIXED TOP NAV ── */}
        <div className="fixed top-0 left-0 right-0 z-50 w-full max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
          <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
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
                onClick={handleStartMission}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all group"
             >
                <Navigation className="w-5 h-5 group-hover:animate-pulse" />
                <span className="font-black text-xs capitalize tracking-[0.2em]">Start Collection</span>
             </button>
             <button 
                onClick={() => navigate(-1)}
                className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-2xl font-black text-xs capitalize tracking-[0.2em] active:scale-95 transition-all"
             >
                Return to List
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
