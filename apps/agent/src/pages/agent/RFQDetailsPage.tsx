import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, Scale, Coins, CheckCircle2, XCircle,
  MapPin, Package, MessageSquare, ShieldCheck, Timer, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@klinflow/supabase';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { getSubcategoryLabel } from '@klinflow/core/data/wasteDefinitions';

export default function RFQDetailsPage() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const { materialPrices, fetchMaterialPrices, categories, fetchCategories } = useServiceStore();
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchMaterialPrices();
    fetchCategories();
  }, [fetchMaterialPrices, fetchCategories]);

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
    materialId: '',
    categoryId: '',
    quantity: '',
    requestedWeight: 0,
    targetPrice: '0',
    location: '',
    status: 'pending',
    createdAt: '',
    deadline: '',
    description: '',
    isGroupCollection: false,
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
        .select('*, seller:profiles!rfq_offers_seller_id_fkey(name, rating, company_name, avatar_url)')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: false });

      const bids = (offersData || []).map((o: any) => ({
        id: o.id,
        sellerName: o.seller?.company_name || o.seller?.name || 'Unknown Seller',
        sellerRating: o.seller?.rating || 0,
        sellerAvatar: o.seller?.avatar_url || null,
        price: o.offered_price?.toString() || '0',
        weight: o.offered_weight || 0,
        quantity: `${o.offered_weight} kg`,
        message: o.notes || '',
        status: o.status || 'pending'
      }));

      setRfq({
        id: rfqData.id,
        materialId: rfqData.material_grade,
        categoryId: rfqData.category,
        quantity: `${rfqData.requested_weight} ${rfqData.weight_unit || 'kg'}`,
        requestedWeight: rfqData.requested_weight || 0,
        targetPrice: rfqData.target_price?.toString() || '0',
        location: rfqData.pickup_area,
        status: rfqData.status === 'open' ? 'pending' : rfqData.status,
        createdAt: new Date(rfqData.created_at).toLocaleString(),
        deadline: rfqData.deadline ? new Date(rfqData.deadline).toLocaleString() : 'N/A',
        description: rfqData.notes || '',
        isGroupCollection: rfqData.is_group_collection || false,
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

  const handleFinalizeGroupRFQ = async () => {
    try {
      const { data: count, error } = await supabase.rpc('finalize_group_rfq', {
        p_rfq_id: rfqId
      });

      if (error) {
        console.error('Finalize error:', error);
        toast.error(error.message || 'Failed to finalize group collection');
        return;
      }

      setRfq((prev: any) => ({
        ...prev,
        status: 'fulfilled'
      }));
      toast.success(`Successfully finalized! Generated ${count} contracts for pickups.`);
      setTimeout(() => navigate('/pickups'), 1500);
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const statusConfigs: Record<string, { icon: typeof Clock; color: string; bg: string; border: string; label: string }> = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', label: 'Bidding Open' },
    accepted: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Accepted' },
    fulfilled: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Accepted' },
    closed: { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-500/10', border: 'border-slate-200 dark:border-slate-500/20', label: 'Closed' },
    cancelled: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', label: 'Cancelled' },
  };

  const statusConfig = statusConfigs[rfq.status] || statusConfigs.pending;
  const StatusIcon = statusConfig.icon;

  const totalPledged = rfq.bids.reduce((sum: number, b: any) => sum + (b.weight || 0), 0);
  const percentage = rfq.requestedWeight ? Math.min(100, Math.round((totalPledged / rfq.requestedWeight) * 100)) : 0;

  return (
    <div className="flex flex-col w-full pb-16">
      {/* ── HEADER ── */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
          <ArrowLeft className="w-6 h-6 text-slate-500 group-hover:text-amber-500 transition-colors" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">RFQ Details</h1>
          <p className="text-xs font-bold text-amber-500 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Sourcing Request Command
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
        {/* ── IMAGE CAROUSEL ── */}
        {rfq.images && rfq.images.length > 0 && (
          <div className="relative h-[270px] w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800  bg-slate-900">
            <div
              onScroll={handleScroll}
              className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
            >
              {rfq.images.map((url: string, index: number) => (
                <div key={index} className="w-full h-full shrink-0 snap-center">
                  <img
                    src={url}
                    alt={`${materialPrices?.find(m => m.id === rfq.materialId)?.material_name || getSubcategoryLabel(rfq.categoryId, rfq.materialId) || rfq.materialId} sample ${index + 1}`}
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
                    className={`h-1.5 rounded-full transition-all duration-300 ${index === activeImageIndex ? 'w-4 bg-emerald-500' : 'w-1.5 bg-white/40'
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RFQ SPECIFICATIONS CARD ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800/40 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material Requested</p>
              <h2 className="text-xl font-bold text-indigo-700 dark:text-white capitalize leading-tight">
                {materialPrices?.find(m => m.id === rfq.materialId || `${rfq.categoryId}_${m.id}` === rfq.materialId)?.material_name || getSubcategoryLabel(rfq.categoryId, rfq.materialId) || rfq.materialId}
              </h2>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">{statusConfig.label}</span>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Details Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-5">
            <div className="flex items-start gap-3">
              <Coins className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Target Budget</p>
                <p className="text-sm font-black text-emerald-600 leading-none">KSh {rfq.targetPrice}/kg</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Volume Wanted</p>
                <p className="text-sm font-black text-slate-900 dark:text-white capitalize">{rfq.quantity}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pickup Location</p>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{rfq.location}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Created On</p>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{rfq.createdAt}</span>
              </div>
            </div>

            {rfq.deadline && rfq.deadline !== 'N/A' && (
              <div className="flex items-start gap-3">
                <Timer className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Deadline</p>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{rfq.deadline}</span>
                </div>
              </div>
            )}
          </div>

          {rfq.description && (
            <>
              <hr className="border-slate-100 dark:border-slate-800/60" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Specifications</p>
                <p className="text-sm text-slate-600 dark:text-slate-350 italic">"{rfq.description}"</p>
              </div>
            </>
          )}

          {rfq.status === 'pending' && (
            <button
              onClick={handleCancelRFQ}
              className="w-full mt-2 py-3.5 bg-rose-600  text-white hover:bg-rose-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
            >
              Close / Cancel RFQ
            </button>
          )}

        </div>
        </div>

        <div className="lg:col-span-5">
        {/* ── GROUP COLLECTION PROGRESS ── */}
        {rfq.isGroupCollection ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white relative overflow-hidden shadow-lg shadow-blue-500/20">
              <div className="relative z-10 space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Fulfillment Progress</p>
                    <h2 className="text-2xl font-black text-white tracking-tight">{percentage}%</h2>
                  </div>
                  <div className="relative w-[72px] h-[72px] flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="36" cy="36" r="30" className="stroke-white/20" strokeWidth="5" fill="none" />
                      <circle cx="36" cy="36" r="30" className="stroke-blue-300" strokeWidth="5" fill="none" strokeDasharray="188" strokeDashoffset={188 - (188 * percentage) / 100} strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-sm font-black text-white">{rfq.bids.length}</span>
                    <span className="absolute text-[8px] font-bold text-blue-200 mt-8">sellers</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{totalPledged.toLocaleString()} KG pooled</span>
                    <span>{rfq.requestedWeight.toLocaleString()} KG needed</span>
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-300 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/40 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  Contributors Pool ({rfq.bids.length})
                </h3>
                <span className="text-[10px] font-bold text-emerald-600">Auto-Accepted</span>
              </div>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {rfq.bids.map((bid: any) => (
                  <div 
                    key={bid.id} 
                    onClick={() => navigate(`/rfqs/${rfqId}/offers/${bid.id}`)}
                    className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 overflow-hidden flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
                        {bid.sellerAvatar ? (
                          <img src={bid.sellerAvatar} className="w-full h-full object-cover" alt={bid.sellerName} />
                        ) : (
                          <span className="text-blue-700 font-bold text-xs">{bid.sellerName[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">{bid.sellerName}</p>
                          <span className="text-[9px] font-bold text-amber-500">★ {bid.sellerRating}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 capitalize">{bid.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-sm font-bold text-emerald-600">{bid.weight} KG</p>
                        <p className="text-[9px] font-semibold text-slate-400">KSh {bid.price}/kg</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {rfq.status === 'pending' && (
              <button
                onClick={handleFinalizeGroupRFQ}
                className="w-full mt-4 py-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                Finalize Collection & Dispatch
              </button>
            )}
          </div>
        ) : (
          /* ── REGULAR RFQ SELLER BIDS ── */
          rfq.status === 'pending' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Seller Responses ({rfq.bids.length})
                </h3>
                {rfq.status === 'pending' && (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 " />
                    Live Bidding
                  </span>
                )}
              </div>

              <AnimatePresence>
                {rfq.bids.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/50 rounded-xl p-8 text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 animate-pulse">
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
                  rfq.bids.map((bid: any) => {
                    const isAccepted = bid.status === 'accepted';
                    const isDeclined = bid.status === 'declined';

                    return (
                      <motion.div
                        key={bid.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate(`/rfqs/${rfqId}/offers/${bid.id}`)}
                        className={`group bg-white dark:bg-slate-900 border rounded-xl p-5 space-y-4 transition-all duration-300 cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 active:scale-[0.98] ${isAccepted
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
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Offered Price</p>
                            <p className="text-base font-black text-emerald-600 leading-none">
                              KSh {bid.price}<span className="text-[9px] text-emerald-600/70">/kg</span>
                            </p>
                          </div>
                        </div>

                        {bid.message && (
                          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-650 dark:text-slate-350 italic">"{bid.message}"</p>
                          </div>
                        )}

                        {/* Actions */}
                        {rfq.status === 'pending' && bid.status === 'pending' && (
                          <div className="flex justify-end pt-1">
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1 group-hover:text-amber-600 transition-colors">
                              View Offer Details <ArrowLeft className="w-3 h-3 rotate-180" />
                            </span>
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
          )
        )}
        </div>
      </div>
    </div>
  );
}
