import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, Scale, Coins, CheckCircle2, XCircle,
  MessageSquare, ShieldCheck, Image as ImageIcon, Package, MapPin, Truck
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@klinflow/supabase';
import { getSubcategoryLabel } from '@klinflow/core/data/wasteDefinitions';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { OptimizedImage } from "@klinflow/ui";

export default function RFQOfferDetailsPage() {
  const { rfqId, offerId } = useParams();
  const navigate = useNavigate();
  const { materialPrices, fetchMaterialPrices, categories, fetchCategories } = useServiceStore();
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [rfq, setRfq] = useState<any>(null);
  const [offer, setOffer] = useState<any>(null);

  useEffect(() => {
    fetchMaterialPrices();
    fetchCategories();
  }, [fetchMaterialPrices, fetchCategories]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!rfqId || !offerId) return;

      // Fetch RFQ
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfqId)
        .single();

      if (rfqError || !rfqData) {
        toast.error('RFQ not found');
        navigate(-1);
        return;
      }

      setRfq({
        id: rfqData.id,
        materialId: rfqData.material_grade,
        categoryId: rfqData.category,
        quantity: rfqData.requested_weight,
        unit: rfqData.weight_unit || 'kg',
        targetPrice: rfqData.target_price || 0,
        location: rfqData.pickup_area,
        status: rfqData.status,
        description: rfqData.notes || '',
      });

      // Fetch Offer
      const { data: offerData, error: offerError } = await supabase
        .from('rfq_offers')
        .select('*, seller:profiles!rfq_offers_seller_id_fkey(name, rating, company_name)')
        .eq('id', offerId)
        .single();

      if (offerError || !offerData) {
        toast.error('Offer not found');
        navigate(-1);
        return;
      }

      setOffer({
        id: offerData.id,
        sellerName: offerData.seller?.company_name || offerData.seller?.name || 'Unknown Seller',
        sellerRating: offerData.seller?.rating || 0,
        price: offerData.offered_price || 0,
        quantity: offerData.offered_weight,
        images: offerData.images || [],
        message: offerData.notes || '',
        status: offerData.status || 'pending',
        createdAt: new Date(offerData.created_at).toLocaleString(),
        earliestShipping: offerData.earliest_shipping_date
          ? new Date(offerData.earliest_shipping_date).toLocaleDateString()
          : null
      });
      setLoading(false);
    };

    fetchDetails();

    // Real-time listener: updates to THIS specific offer
    if (offerId) {
      const channel = supabase.channel(`rfq_offer_${offerId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'rfq_offers',
          filter: `id=eq.${offerId}`
        }, () => {
          fetchDetails(); // re-fetch offer details on any change
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [rfqId, offerId, navigate]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeImageIndex) {
      setActiveImageIndex(newIndex);
    }
  };

  const handleAcceptBid = async () => {
    try {
      const { data: fulfillmentId, error } = await supabase
        .rpc('accept_rfq_offer_v2', {
          p_offer_id: offer.id,
          p_delivery_method: 'agent_pickup',
          p_pickup_address: rfq.location || null,
          p_dropoff_address: null
        });

      if (error) {
        console.error('RPC error:', error);
        toast.error(error.message || 'Failed to accept offer');
        return;
      }

      toast.success(`Accepted quote from ${offer.sellerName}! Fulfillment order created 🤝`);
      setTimeout(() => navigate('/pickups'), 1500);
    } catch (err: any) {
      console.error('Accept bid error:', err);
      toast.error('Something went wrong accepting this offer');
    }
  };

  const handleDeclineBid = async () => {
    const { error } = await supabase
      .from('rfq_offers')
      .update({ status: 'rejected' })
      .eq('id', offer.id);

    if (error) {
      toast.error('Failed to decline offer');
      return;
    }

    toast.error(`Declined quote from ${offer.sellerName}`);
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isAccepted = offer.status === 'accepted';
  const isDeclined = offer.status === 'rejected' || offer.status === 'declined';
  const isPending = offer.status === 'pending';

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', label: 'Pending Review' },
    accepted: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Offer Accepted' },
    declined: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', label: 'Offer Declined' },
    rejected: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', label: 'Offer Declined' },
  }[offer.status as 'pending' | 'accepted' | 'declined' | 'rejected'] || { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Pending' };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-slate-50 dark:bg-slate-800 pb-12 transition-colors -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] -mx-1 relative">

      {/* ── IMAGE PREVIEW AT THE TOP (EDGE-TO-EDGE & TOP-COVERED) ── */}
      <div className="relative h-[350px] w-full overflow-hidden border-b border-slate-200 dark:border-slate-800 shadow-sm bg-slate-900">
        {offer.images && offer.images.length > 0 ? (
          <div
            onScroll={handleScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
            {offer.images.map((img: string, idx: number) => (
              <div key={idx} className="w-full h-full shrink-0 snap-center relative">
                <OptimizedImage
                  src={img}
                  alt={`Proof ${idx + 1}`}
                  className="w-full h-full object-cover"
                  wrapperClassName="w-full h-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Package className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-xs font-bold tracking-wider uppercase">No Images Provided</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-[calc(env(safe-area-inset-top,1.5rem)+1rem)] left-4 w-10 h-10 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md active:scale-95 transition-all z-10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {offer.images && offer.images.length > 1 && (
          <div className="absolute top-[calc(env(safe-area-inset-top,1.5rem)+1rem)] right-4 z-10 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
            <span>{activeImageIndex + 1} / {offer.images.length}</span>
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
          </div>
        )}

        {offer.images && offer.images.length > 1 && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5 z-10">
            {offer.images.map((_: any, index: number) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === activeImageIndex ? 'w-4 bg-emerald-500' : 'w-1.5 bg-white/40'
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 px-1.5 mt-1">
        {/* ── DETAIL CARD BELOW ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">

          {/* Material & Status */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Submitted Offer</p>
              <h2 className="text-[17px] font-black text-slate-900 dark:text-white capitalize leading-tight">
                {materialPrices?.find(m => m.id === rfq.materialId)?.material_name || getSubcategoryLabel(rfq.categoryId, rfq.materialId) || rfq.materialId}
              </h2>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
              <StatusIcon className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">{statusConfig.label}</span>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Seller Info */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Seller Name</p>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white capitalize leading-none">{offer.sellerName}</h3>
                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5 mt-px">★ {offer.sellerRating}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mt-2">
                <MapPin className="w-3.5 h-3.5" /> Pickup at {rfq.location}
              </div>
            </div>
            {offer.earliestShipping && (
              <div className="text-right shrink-0 ">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Earliest Delivery</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <Truck className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{offer.earliestShipping}</span>
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Coins className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Offered Price</p>
                <p className={`text-xs font-black ${offer.price <= rfq.targetPrice ? 'text-emerald-600' : 'text-rose-500'} leading-none`}>KSh {offer.price}/{rfq.unit}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Target Budget</p>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">KSh {rfq.targetPrice}/{rfq.unit}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Offered Weight</p>
                <p className={`text-xs font-black ${offer.quantity >= rfq.quantity ? 'text-emerald-600' : 'text-amber-600'} leading-none`}>{offer.quantity} {rfq.unit}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Requested Qty</p>
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{rfq.quantity} {rfq.unit}</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {offer.message && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Attached Message</p>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-px" />
                <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">{offer.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">
          <div className="mb-2">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Actions</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Review and manage this offer</p>
          </div>

          {isAccepted && (
            <button
              onClick={() => navigate('/pickups')}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" /> View Active Pickups
            </button>
          )}

          {isDeclined && (
            <button onClick={() => navigate(-1)} className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-sm active:scale-[0.98] transition-all">
              Go Back
            </button>
          )}

          {isPending && (
            <div className="flex flex-row gap-3">
              <button
                onClick={handleDeclineBid}
                className="flex-[0.6] py-4 bg-red-600  text-white  rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" /> Decline
              </button>
              <button
                onClick={handleAcceptBid}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Accept
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
