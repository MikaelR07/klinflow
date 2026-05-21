import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Scale, Coins, CheckCircle2, XCircle, 
  MapPin, Package, MessageSquare, ShieldCheck 
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@klinflow/supabase';
import { WASTE_CATEGORIES } from '@klinflow/core/data/wasteDefinitions';

const getSubcategoryLabel = (catId: string, subId: string) => {
  const cat = WASTE_CATEGORIES.find(c => c.id === catId);
  const sub = cat?.subcategories.find(s => s.id === subId);
  return sub ? sub.label : subId;
};

export default function RFQDetailsPage() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeImageIndex) {
      setActiveImageIndex(newIndex);
    }
  };

  const [rfq, setRfq] = useState<any>({
    id: '',
    material: '',
    quantity: '',
    targetPrice: '0',
    location: '',
    status: 'pending',
    createdAt: '',
    description: '',
    images: [],
    bids: []
  });

  // Fetch RFQ + its offers from the database
  useEffect(() => {
    const fetchRFQDetails = async () => {
      if (!rfqId) return;

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

      // Fetch offers for this RFQ with seller profile info
      const { data: offersData } = await supabase
        .from('rfq_offers')
        .select('*, seller:profiles!rfq_offers_seller_id_fkey(name, rating, company_name)')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: false });

      const bids = (offersData || []).map((o: any) => ({
        id: o.id,
        sellerName: o.seller?.company_name || o.seller?.name || 'Unknown Seller',
        sellerRating: o.seller?.rating || 0,
        price: o.offered_price?.toString() || '0',
        quantity: `${o.offered_weight} kg`,
        message: o.notes || '',
        status: o.status || 'pending'
      }));

      setRfq({
        id: rfqData.id,
        material: getSubcategoryLabel(rfqData.category, rfqData.material_grade),
        quantity: `${rfqData.requested_weight} ${rfqData.weight_unit || 'kg'}`,
        targetPrice: rfqData.target_price?.toString() || '0',
        location: rfqData.pickup_area,
        status: rfqData.status === 'open' ? 'pending' : rfqData.status,
        createdAt: new Date(rfqData.created_at).toLocaleString(),
        description: rfqData.notes || '',
        images: rfqData.images || [],
        bids
      });
      setLoading(false);
    };

    fetchRFQDetails();

    // Real-time listener: new bids on THIS specific RFQ
    if (rfqId) {
      const channel = supabase.channel(`rfq_offers_${rfqId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'rfq_offers',
          filter: `rfq_id=eq.${rfqId}`
        }, () => {
          fetchRFQDetails(); // re-fetch everything on any change
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [rfqId]);

  const handleAcceptBid = async (bidId: string, sellerName: string) => {
    // Accept the selected offer in DB
    const { error: acceptError } = await supabase
      .from('rfq_offers')
      .update({ status: 'accepted' })
      .eq('id', bidId);

    if (acceptError) {
      toast.error('Failed to accept offer');
      return;
    }

    // Reject all other pending offers for this RFQ
    await supabase
      .from('rfq_offers')
      .update({ status: 'rejected' })
      .eq('rfq_id', rfqId)
      .neq('id', bidId)
      .eq('status', 'pending');

    // Mark the RFQ itself as fulfilled
    await supabase
      .from('rfqs')
      .update({ status: 'fulfilled' })
      .eq('id', rfqId);

    // Optimistic local update
    setRfq((prev: any) => ({
      ...prev,
      status: 'accepted',
      bids: prev.bids.map((b: any) =>
        b.id === bidId ? { ...b, status: 'accepted' } : { ...b, status: 'declined' }
      )
    }));
    toast.success(`Accepted quote from ${sellerName}! 🤝`);
  };

  const handleDeclineBid = async (bidId: string, sellerName: string) => {
    const { error } = await supabase
      .from('rfq_offers')
      .update({ status: 'rejected' })
      .eq('id', bidId);

    if (error) {
      toast.error('Failed to decline offer');
      return;
    }

    setRfq((prev: any) => ({
      ...prev,
      bids: prev.bids.map((b: any) =>
        b.id === bidId ? { ...b, status: 'declined' } : b
      )
    }));
    toast.error(`Declined quote from ${sellerName}`);
  };

  const handleCancelRFQ = async () => {
    const { error } = await supabase
      .from('rfqs')
      .update({ status: 'cancelled' })
      .eq('id', rfqId);

    if (error) {
      toast.error('Failed to cancel RFQ');
      return;
    }

    setRfq((prev: any) => ({
      ...prev,
      status: 'closed'
    }));
    toast.info("RFQ closed successfully.");
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', label: 'Bidding Open' },
    accepted: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Fulfilled' },
    closed: { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-500/10', border: 'border-slate-200 dark:border-slate-500/20', label: 'Closed' },
    cancelled: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', label: 'Cancelled' },
  }[rfq.status as 'pending' | 'accepted' | 'closed' | 'cancelled'];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-slate-50 dark:bg-slate-900 pb-16 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-500 transition-colors" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">RFQ Details</h1>
            <p className="text-[10px] font-bold text-amber-500 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Sourcing Request Command
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)]">
        {/* ── IMAGE CAROUSEL ── */}
        {rfq.images && rfq.images.length > 0 && (
          <div className="relative h-[250px] w-full overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm bg-slate-900">
            <div 
              onScroll={handleScroll}
              className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
            >
              {rfq.images.map((url: string, index: number) => (
                <div key={index} className="w-full h-full shrink-0 snap-center">
                  <img 
                    src={url} 
                    alt={`${rfq.material} sample ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />

            {rfq.images.length > 1 && (
              <div className="absolute top-4 right-4 z-10 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <span>{activeImageIndex + 1} / {rfq.images.length}</span>
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
              </div>
            )}

            {rfq.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                {rfq.images.map((_: any, index: number) => (
                  <div 
                    key={index} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === activeImageIndex ? 'w-4 bg-emerald-500' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RFQ SPECIFICATIONS CARD ── */}
        <div className="bg-white dark:bg-slate-850 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material Requested</p>
              <h2 className="text-[17px] font-black text-slate-900 dark:text-white capitalize leading-tight">{rfq.material}</h2>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">{statusConfig.label}</span>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Coins className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Target Budget</p>
                <p className="text-xs font-black text-emerald-600 leading-none">KSh {rfq.targetPrice}/kg</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Volume Wanted</p>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{rfq.quantity}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pickup Location</p>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{rfq.location}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Created On</p>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{rfq.createdAt}</span>
              </div>
            </div>
          </div>

          {rfq.description && (
            <>
              <hr className="border-slate-100 dark:border-slate-800/60" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Specifications</p>
                <p className="text-xs text-slate-600 dark:text-slate-350 italic">"{rfq.description}"</p>
              </div>
            </>
          )}

          {rfq.status === 'pending' && (
            <button 
              onClick={handleCancelRFQ}
              className="w-full mt-2 py-3.5 bg-rose-50 dark:bg-rose-900/10 text-rose-600 hover:bg-rose-100/50 dark:hover:bg-rose-950/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
            >
              Close / Cancel RFQ
            </button>
          )}
        </div>

        {/* ── SELLER BIDS / RESPONSES SECTION ── */}
        {rfq.status === 'pending' && (
          <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Seller Responses ({rfq.bids.length})
            </h3>
            {rfq.status === 'pending' && (
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Bidding
              </span>
            )}
          </div>

          <AnimatePresence>
            {rfq.bids.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-850 border border-slate-150 dark:border-slate-800/50 rounded-3xl p-8 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Waiting for Seller Bids
                </h4>
                <p className="text-[10px] text-slate-400 leading-normal max-w-[220px] mx-auto font-medium">
                  We have broadcasted this request. Nearby verified sellers will receive notifications to bid.
                </p>
              </motion.div>
            ) : (
              rfq.bids.map((bid) => {
                const isAccepted = bid.status === 'accepted';
                const isDeclined = bid.status === 'declined';
                
                return (
                  <motion.div
                    key={bid.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white dark:bg-slate-850 border rounded-3xl p-5 space-y-4 transition-all duration-300 ${
                      isAccepted 
                        ? 'border-emerald-500 shadow-lg shadow-emerald-500/5' 
                        : isDeclined 
                        ? 'opacity-50 border-slate-200 dark:border-slate-850'
                        : 'border-slate-150 dark:border-slate-800/40 shadow-sm'
                    }`}
                  >
                    {/* Seller details & Quoted price */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white capitalize">
                            {bid.sellerName}
                          </h4>
                          <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5">
                            ★ {bid.sellerRating}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold capitalize tracking-widest mt-0.5">
                          Offering: {bid.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Quoted Price</p>
                        <p className="text-base font-black text-emerald-600 leading-none">
                          KSh {bid.price}<span className="text-[9px] text-emerald-600/70">/kg</span>
                        </p>
                      </div>
                    </div>

                    {bid.message && (
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-650 dark:text-slate-350 italic">"{bid.message}"</p>
                      </div>
                    )}

                    {/* Actions */}
                    {rfq.status === 'pending' && bid.status === 'pending' && (
                      <div className="flex gap-2.5 pt-1">
                        <button
                          onClick={() => handleDeclineBid(bid.id, bid.sellerName)}
                          className="flex-1 py-3 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-950 active:scale-98 transition-all"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAcceptBid(bid.id, bid.sellerName)}
                          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md shadow-emerald-500/10 hover:bg-emerald-700 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Accept Offer
                        </button>
                      </div>
                    )}

                    {isAccepted && (
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-[10px] font-black uppercase tracking-widest justify-center">
                        <ShieldCheck className="w-4 h-4" /> Accepted Offer • Trade Initiated
                      </div>
                    )}

                    {isDeclined && (
                      <div className="text-center p-2.5 bg-rose-50 dark:bg-rose-950/10 text-rose-500 rounded-xl text-[9px] font-bold uppercase tracking-widest">
                        Quote Declined
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
