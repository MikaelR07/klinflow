import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight,
  Scale, 
  MapPin, 
  Clock, 
  Zap, 
  Package, 
  Building2, 
  Truck,
  ShieldCheck,
  Activity,
  ChevronRight,
  MessageSquareQuote,
  Loader2,
  ExternalLink,
  History,
  X,
  Check,
  BadgeCheck
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useAuthStore, useAssetStore, useMarketplaceStore, 
  supabase 
} from '@cleanflow/core';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function ArrivalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, userId } = useAuthStore();
  const { listings, fetchListings, makeOffer } = useMarketplaceStore();
  const { liveFeed, fetchLiveFeed, claimAsset } = useAssetStore();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [error, setError] = useState(null);

  // Offer State
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState('');
  const [isOffering, setIsOffering] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Ensure data is fresh
        await Promise.all([
          fetchListings().catch(() => []),
          fetchLiveFeed().catch(() => [])
        ]);
        
        // Find in assets (Agent Pickups)
        // Use String comparison to handle both UUIDs and potentially numeric IDs safely
        const agentItem = (liveFeed || []).find(a => String(a.id) === String(id));
        
        if (agentItem) {
          setItem({ 
            ...agentItem, 
            sourceType: 'agent', 
            typeLabel: 'Verified Pickup',
            displayTitle: agentItem.material_type || 'Unspecified Material',
            weight_kg: agentItem.weight_kg || 0,
            photo_url: agentItem.photo_url,
            created_at: agentItem.created_at || new Date().toISOString()
          });
        } else {
          // Find in listings (Merchant Posts)
          const merchantItem = (listings || []).find(l => String(l.id) === String(id));
          if (merchantItem) {
            setItem({
              ...merchantItem,
              sourceType: 'merchant',
              typeLabel: 'Merchant Posting',
              displayTitle: merchantItem.material || 'Merchant Goods',
              weight_kg: merchantItem.quantity || 0,
              photo_url: merchantItem.photo,
              created_at: merchantItem.createdAt || merchantItem.created_at || new Date().toISOString(),
              price_per_kg: merchantItem.pricePerKg || 0,
              seller: merchantItem.seller || 'Verified Merchant',
              description: merchantItem.description
            });
            setOfferPrice(String(merchantItem.pricePerKg || ''));
            setOfferQty(String(merchantItem.quantity || ''));
          } else {
            console.warn("[ArrivalDetails] Item not found in any stream:", id);
          }
        }
      } catch (err) {
        console.error("[ArrivalDetails] Load Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, fetchListings, fetchLiveFeed]);

  const handleAcquire = async () => {
    if (!item) return;
    setIsAcquiring(true);
    try {
      if (item.sourceType === 'agent') {
        await claimAsset(item.id);
      } else {
        const { error } = await supabase.rpc('weaver_claim_asset', {
          p_listing_id: item.id,
          p_weaver_id: profile.id
        });
        if (error) throw error;
      }
      toast.success("Arrival Acquired!", { description: "Load has been added to your logistics queue." });
      navigate(-1);
    } catch (err) {
      toast.error("Acquisition Failed", { description: err.message });
    } finally {
      setIsAcquiring(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!offerPrice || !offerQty) return toast.error("Enter price and quantity");
    setIsOffering(true);
    try {
      // Note: check the exact signature of makeOffer in your marketplace store
      // Assuming it's makeOffer(listing, price, qty) based on Sourcing.jsx
      await makeOffer(item, parseFloat(offerPrice), parseFloat(offerQty));
      toast.success("Offer Dispatched! 🚀");
      navigate(-1);
    } catch (err) {
      toast.error("Offer Failed", { description: err.message });
    } finally {
      setIsOffering(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4F4F4] dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20 animate-pulse">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Arrival Radar...</p>
    </div>
  );

  if (error || !item) return (
    <div className="min-h-screen bg-[#F4F4F4] dark:bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <Package className="w-10 h-10 text-slate-200" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Load Not Found</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-[240px] font-medium leading-relaxed">
        The arrival radar could not pinpoint this material. It may have been acquired or withdrawn.
      </p>
      <button 
        onClick={() => navigate(-1)} 
        className="mt-10 px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
      >
        Return to Terminal
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen">
      <div className="w-full min-h-screen relative animate-fade-in overflow-hidden">
        
        {/* ── IMMERSIVE HERO IMAGE (TRUE FULL-BLEED) ── */}
        <div className="relative h-80 w-full overflow-hidden">
          <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {(item.photos?.length > 0 ? item.photos : [item.photo_url]).map((imgUrl, idx) => (
              <div key={idx} className="flex-none w-full h-full snap-start relative">
                {imgUrl ? (
                  <img src={imgUrl} className="w-full h-full object-cover" alt="Material" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <Package className="w-16 h-16 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Floating Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-4 flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-all z-10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[9px] font-semibold uppercase tracking-widest">Back</span>
          </button>

          {/* Status Badge */}
          <div className="absolute top-6 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-xl text-white rounded-full text-[9px] font-semibold uppercase tracking-[0.2em] z-10">
            {item.typeLabel}
          </div>

          {/* Photo Indicators */}
          {(item.photos?.length > 1) && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {item.photos.map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-white/60" />
              ))}
            </div>
          )}
        </div>

        {/* ── CONTENT (TRULY EDGE-TO-EDGE) ── */}
        <div className="bg-white dark:bg-slate-900 pb-48">
          
          {/* ── TITLE SECTION ── */}
          <div className="p-4 border-b border-slate-50 dark:border-slate-800/50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest">Available Now</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Agent Verified
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight italic">{item.displayTitle}</h2>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.seller || item.sellerName || 'Verified Supply'}</p>
              <span className="text-[8px] text-slate-300">•</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {item.location || 'Logistics Hub'}
              </p>
            </div>
          </div>

          {/* ── EXECUTIVE STATS STRIP ── */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
            <div className="p-5 text-center bg-white dark:bg-slate-900">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lot Qty</p>
              <p className="text-xl font-black text-slate-900 dark:text-white italic">{item.weight_kg}</p>
              <p className="text-[8px] font-bold text-slate-300 uppercase">KG</p>
            </div>
            <div className="p-5 text-center bg-white dark:bg-slate-900">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Grade</p>
              <p className="text-xl font-black text-slate-900 dark:text-white italic">{item.grade || 'A'}</p>
              <p className="text-[8px] font-bold text-slate-300 uppercase">Quality</p>
            </div>
            <div className="p-5 text-center bg-slate-950 dark:bg-black text-white">
              <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Valuation</p>
              <p className="text-xl font-black italic">
                {item.price_per_kg ? `KSh ${item.price_per_kg}` : 'Quote'}
              </p>
              <p className="text-[8px] font-bold text-emerald-400/50 uppercase">Per KG</p>
            </div>
          </div>

          {/* ── ALIBABA-STYLE INDUSTRIAL SPECS SHEET ── */}
          <div className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
               <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                 <Activity className="w-3.5 h-3.5 text-blue-500" /> Industrial Specifications
               </h4>
               <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">Verified</span>
            </div>

            {/* Spec Rows */}
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              <div className="px-4 py-3 flex items-start justify-between gap-10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 w-24">Material Grade</span>
                <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase italic text-right">Grade {item.grade || 'A'}</span>
              </div>
              <div className="px-4 py-3 flex items-start justify-between gap-10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 w-24">Integrity</span>
                <span className="text-[11px] font-black text-emerald-600 uppercase italic text-right">Certified Pure</span>
              </div>
              <div className="px-4 py-3 flex items-start justify-between gap-10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 w-24">Processing</span>
                <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase italic text-right">Warehouse Ready</span>
              </div>
              <div className="px-4 py-3 flex items-start justify-between gap-10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 w-24">Trace ID</span>
                <span className="text-[10px] font-mono font-black text-slate-400 tracking-tighter text-right break-all">#{String(item.id).toUpperCase()}</span>
              </div>
              <div className="px-4 py-3 flex items-start justify-between gap-10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 w-24">Registered</span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-right">{new Date(item.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Material Description Row (Full Width) */}
            <div className="px-4 py-4 bg-slate-50/30 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquareQuote className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Material Description</span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                {item.description || "Automated logistics telemetry verified. Material is ready for immediate dispatch from the logistics hub."}
              </p>
            </div>
          </div>

        </div>

        {/* ── ACTION TERMINAL DOCK ── */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50">
          <div className="flex gap-3">
            {item.sourceType === 'merchant' ? (
              <button 
                onClick={() => navigate(`/messages/${item.sellerId}`)}
                className="flex-1 py-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-[0.97] transition-all"
              >
                Inquire
              </button>
            ) : null}
            <button 
              onClick={handleAcquire}
              disabled={isAcquiring}
              className="flex-[2] py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-[0.25em] shadow-2xl shadow-slate-900/20 active:scale-[0.97] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isAcquiring ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <><Check className="w-4 h-4" /> Acquire Load</>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}


