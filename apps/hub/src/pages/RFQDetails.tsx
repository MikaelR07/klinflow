import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, MapPin, Scale, Clock, DollarSign, 
  CheckCircle2, XCircle, MessageSquare, Truck, ShieldCheck,
  Star, FileText, Download, Building2, Image as ImageIcon,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';

const getSubcategoryLabel = (catId: string, subId: string, materialPrices: any[]) => {
  if (subId && (subId.includes(' ') || /[A-Z]/.test(subId))) {
    return subId;
  }
  const sub = materialPrices.find((m: any) => `${catId}_${m.id}` === subId || m.id === subId);
  return sub ? sub.material_name : subId;
};

export default function RFQDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [rfq, setRfq] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [actionModal, setActionModal] = useState<{isOpen: boolean, type: 'cancel_rfq' | 'reject_bid' | 'extend_rfq', targetId: string}>({ isOpen: false, type: 'cancel_rfq', targetId: '' });
  const [newDeadlinePreset, setNewDeadlinePreset] = useState<number>(48);
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [newDeadlineTime, setNewDeadlineTime] = useState('');
  const [imageCarousel, setImageCarousel] = useState<{isOpen: boolean, images: string[], currentIndex: number}>({ isOpen: false, images: [], currentIndex: 0 });

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !profile) return;
      setIsLoading(true);
      try {
        // Fetch RFQ
        const { data: rfqData, error: rfqError } = await supabase.from('rfqs').select('*').eq('id', id).single();
        if (rfqError) throw rfqError;
        
        let storeMaterials = useServiceStore.getState().materialPrices;
        if (!storeMaterials || storeMaterials.length === 0) {
          if (useServiceStore.getState().fetchMaterialPrices) {
            await useServiceStore.getState().fetchMaterialPrices();
            storeMaterials = useServiceStore.getState().materialPrices;
          }
        }

        const mappedRfq = {
          id: rfqData.id,
          trackingId: rfqData.id.split('-')[0].toUpperCase(),
          material: getSubcategoryLabel(rfqData.category, rfqData.material_grade, storeMaterials) || rfqData.material_grade,
          category: rfqData.category,
          quantity: `${rfqData.requested_weight} ${rfqData.weight_unit || 'kg'}`,
          targetPrice: rfqData.target_price || 0,
          location: rfqData.pickup_area,
          status: rfqData.status === 'open' ? 'pending' : rfqData.status,
          createdAt: new Date(rfqData.created_at).toLocaleString(),
          deadline: rfqData.deadline ? new Date(rfqData.deadline).toLocaleString() : 'No deadline',
          deliveryMethod: rfqData.delivery_method === 'agent_pickup' ? 'We Pick Up' : rfqData.delivery_method === 'self_drop' ? 'Seller Drop-off' : 'Flexible',
          deliveryMethodOriginal: rfqData.delivery_method,
          notes: rfqData.notes || '',
          images: rfqData.images || []
        };
        setRfq(mappedRfq);

        // Fetch Bids
        const { data: bidsData, error: bidsError } = await supabase.from('rfq_offers').select(`*, profiles!rfq_offers_seller_id_fkey(business_name, name, rating, avatar, role)`).eq('rfq_id', id).order('created_at', { ascending: false });
        if (bidsError) throw bidsError;

        const mappedBids = bidsData.map((b: any) => ({
          id: b.id,
          sellerId: b.seller_id,
          sellerName: b.profiles?.business_name || b.profiles?.name || 'Individual Seller',
          sellerType: b.profiles?.role === 'hub' ? 'Company' : 'Individual',
          rating: b.profiles?.rating || 4.5,
          completedDeals: 15,
          bidPrice: b.offered_price?.toString() || '0',
          quantity: `${b.offered_weight} kg`,
          deliveryMethod: 'Flexible',
          notes: b.notes || '',
          status: b.status,
          timestamp: new Date(b.created_at).toLocaleString(),
          images: b.images || []
        }));
        setBids(mappedBids);

      } catch (err) {
        console.error('Error fetching RFQ details:', err);
        toast.error('Failed to load RFQ details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, profile]);

  const handleExecuteAction = async () => {
    if (actionModal.type === 'cancel_rfq') {
      const { error } = await supabase.from('rfqs').update({ status: 'cancelled' }).eq('id', id);
      if (error) { toast.error('Failed to cancel RFQ'); return; }
      toast.success('RFQ Cancelled');
      setRfq((prev: any) => ({ ...prev, status: 'cancelled' }));
    } else if (actionModal.type === 'reject_bid') {
      const { error } = await supabase.from('rfq_offers').update({ status: 'rejected' }).eq('id', actionModal.targetId);
      if (error) { toast.error('Failed to reject bid'); return; }
      toast.success('Bid Rejected');
      setBids(prev => prev.map(b => b.id === actionModal.targetId ? { ...b, status: 'rejected' } : b));
    } else if (actionModal.type === 'extend_rfq') {
      let deadlineTimestamp;
      if (newDeadlineDate && newDeadlineTime) {
        deadlineTimestamp = new Date(`${newDeadlineDate}T${newDeadlineTime}`).toISOString();
      } else {
        const d = new Date();
        d.setHours(d.getHours() + newDeadlinePreset);
        deadlineTimestamp = d.toISOString();
      }
      const { error } = await supabase.from('rfqs').update({ deadline: deadlineTimestamp }).eq('id', id);
      if (error) { toast.error('Failed to update deadline'); return; }
      toast.success('Deadline Extended successfully');
      setRfq((prev: any) => ({ ...prev, deadline: new Date(deadlineTimestamp).toLocaleString() }));
    }
    setActionModal({ isOpen: false, type: 'cancel_rfq', targetId: '' });
  };

  const handleAcceptBid = async (bidId: string) => {
    const acceptedBid = bids.find(b => b.id === bidId);
    if (!acceptedBid || !profile) return;

    const { error } = await supabase.from('rfq_offers').update({ status: 'accepted' }).eq('id', bidId);
    if (error) { toast.error('Failed to accept bid'); return; }
    
    // Check if we need to close RFQ if volume met
    const { error: rfqError } = await supabase.from('rfqs').update({ status: 'accepted' }).eq('id', id);
    if (!rfqError) {
      setRfq((prev: any) => ({ ...prev, status: 'accepted' }));
    }

    // Generate fulfillment_order
    const companyId = useAuthStore.getState().currentCompanyId || profile.id;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const { error: fulfillmentError } = await supabase.from('fulfillment_orders').insert({
      rfq_id: id,
      proposal_id: bidId,
      buyer_id: profile.id,
      seller_id: acceptedBid.sellerId,
      organization_id: companyId,
      delivery_method: rfq.deliveryMethodOriginal || 'agent_pickup',
      pickup_address: rfq.location || 'Flexible Location',
      verification_code: verificationCode,
      status: 'pending_coordination'
    });

    if (fulfillmentError) {
      console.error('Error creating fulfillment:', fulfillmentError);
      toast.error('Bid accepted but failed to generate dispatch order');
    } else {
      toast.success('Bid Accepted and sent to Dispatch Management!');
    }

    setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'accepted' } : b));
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-transparent">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Package className="w-12 h-12 mb-4 opacity-50" />
        <p>RFQ not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-[#131722]">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-y-auto">
      <div className="flex-1 p-4 md:p-6 lg:p-6 animate-fade-in pb-20 space-y-6 max-w-7xl mx-auto">
        
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/marketplace/rfqs')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 text-slate-500 hover:text-[#131722] dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white leading-none">
                  {rfq.trackingId}
                </h1>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${rfq.status === 'pending' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}>
                  {rfq.status}
                </span>
              </div>
              <p className="font-medium text-xs text-slate-500 dark:text-slate-400 tracking-tight mt-1">
                Broadcasted {rfq.createdAt}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          
          {/* ── LEFT COLUMN: RFQ DETAILS ── */}
          <div className="lg:col-span-1 space-y-2">
            <div className="bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#131722] dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" />
                Request Specifications
              </h2>
              
              <div className="space-y-4">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Material</p>
                  <p className="text-base font-bold text-[#131722] dark:text-white">{rfq.material}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {rfq.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Scale className="w-3 h-3" /> Volume Needed
                    </p>
                    <p className="text-sm font-bold text-[#131722] dark:text-white">{rfq.quantity}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Target Price
                    </p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      KSh {rfq.targetPrice} <span className="text-[10px] text-slate-400 font-medium">/ kg</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location / Region
                    </p>
                    <p className="text-sm font-medium text-[#131722] dark:text-white">{rfq.location}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Delivery Method
                    </p>
                    <p className="text-sm font-medium text-[#131722] dark:text-white">{rfq.deliveryMethod}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Deadline
                    </p>
                    <p className="text-sm font-medium text-[#131722] dark:text-white">{rfq.deadline}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Additional Notes
                  </p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {rfq.notes || 'No additional notes provided.'}
                  </p>
                </div>
              </div>
              
              {rfq.status === 'pending' && (
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <button onClick={() => setActionModal({ isOpen: true, type: 'extend_rfq', targetId: id || '' })} className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-colors">
                    Extend Deadline
                  </button>
                  <button onClick={() => setActionModal({ isOpen: true, type: 'cancel_rfq', targetId: id || '' })} className="flex-1 py-2.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-bold transition-colors">
                    Cancel RFQ
                  </button>
                </div>
              )}
            </div>

            {/* Reference Images */}
            {rfq.images && rfq.images.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-[#131722] dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  Reference Quality
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                  {rfq.images.map((img: string, idx: number) => (
                    <div key={idx} className="w-56 h-56 shrink-0 rounded-2xl overflow-hidden border border-[#e0e3eb] dark:border-slate-700 cursor-pointer" onClick={() => setImageCarousel({ isOpen: true, images: rfq.images, currentIndex: idx })}>
                      <img src={img} alt="Quality ref" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: BIDS RECEIVED ── */}
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#131722] dark:text-white leading-none">Responses & Bids</h2>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">Review offers from local sellers.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span className="text-xs font-bold text-[#131722] dark:text-white">{bids.length}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Offers</span>
              </div>
            </div>

            {/* Bids List */}
            <div className="space-y-2 overflow-y-auto max-h-[700px] pr-2">
              {bids.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-2xl p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#131722] dark:text-white">No Bids Yet</p>
                  <p className="text-xs text-slate-500">Wait for sellers to review your RFQ and send offers.</p>
                </div>
              ) : bids.map(bid => (
                <div 
                  key={bid.id} 
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 transition-all shadow-sm
                    ${bid.status === 'rejected' ? 'border-slate-200 dark:border-slate-800 opacity-60' : 'border-[#e0e3eb] dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50'}
                  `}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    
                    {/* Seller Info */}
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        {bid.sellerType === 'Company' ? (
                          <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {bid.sellerName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-[#131722] dark:text-white">{bid.sellerName}</h3>
                          {bid.sellerType === 'Company' && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 mb-3">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {bid.rating}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span>{bid.completedDeals} deals</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span>{bid.timestamp}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <span className="w-20 text-slate-400">Volume:</span> 
                            <span className="font-bold text-[#131722] dark:text-white">{bid.quantity}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <span className="w-20 text-slate-400">Logistics:</span> 
                            {bid.deliveryMethod}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="flex flex-col items-end gap-4 min-w-[140px]">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Proposed Price</p>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                          KSh {bid.bidPrice} <span className="text-[10px] font-medium text-slate-400">/kg</span>
                        </p>
                        {parseFloat(bid.bidPrice) > parseFloat(rfq.targetPrice) && (
                          <p className="text-[10px] font-bold text-rose-500 mt-1">Above target (+KSh {parseFloat(bid.bidPrice) - parseFloat(rfq.targetPrice)})</p>
                        )}
                      </div>

                      {bid.status === 'pending' && rfq.status === 'pending' ? (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <button onClick={() => setActionModal({ isOpen: true, type: 'reject_bid', targetId: bid.id })} className="flex-1 md:flex-none px-4 py-2.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-500/10 hover:text-rose-600 text-[#131722] dark:text-white rounded-xl text-xs font-bold transition-colors">
                            Reject
                          </button>
                          <button 
                            onClick={() => handleAcceptBid(bid.id)}
                            className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20"
                          >
                            Accept
                          </button>
                        </div>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {bid.status}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Bid Notes & Images */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {bid.notes && (
                      <div className="flex items-start gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 italic">"{bid.notes}"</p>
                      </div>
                    )}
                    {bid.images && bid.images.length > 0 && (
                      <button onClick={() => setImageCarousel({ isOpen: true, images: bid.images, currentIndex: 0 })} className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:underline">
                        <ImageIcon className="w-4 h-4" /> View {bid.images.length} Sample Images
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ── ACTION MODAL ── */}
      <AnimatePresence>
        {actionModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActionModal({ isOpen: false, type: 'cancel_rfq', targetId: '' })} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-150 dark:border-slate-700/60 p-6">
              <h3 className="text-lg font-bold text-[#131722] dark:text-white mb-2">
                {actionModal.type === 'cancel_rfq' ? 'Cancel RFQ' : actionModal.type === 'extend_rfq' ? 'Extend Deadline' : 'Reject Bid'}
              </h3>
              
              {actionModal.type === 'extend_rfq' ? (
                <div className="space-y-4 mb-6">
                  <p className="text-sm text-slate-500">Select how much time to add, or set a specific date and time.</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setNewDeadlinePreset(24); setNewDeadlineDate(''); setNewDeadlineTime(''); }} className={`py-2 rounded-lg text-xs font-bold border transition-all ${newDeadlinePreset === 24 && !newDeadlineDate ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'}`}>+24 Hours</button>
                    <button onClick={() => { setNewDeadlinePreset(48); setNewDeadlineDate(''); setNewDeadlineTime(''); }} className={`py-2 rounded-lg text-xs font-bold border transition-all ${newDeadlinePreset === 48 && !newDeadlineDate ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'}`}>+48 Hours</button>
                  </div>
                  
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                    <span className="flex-shrink-0 mx-4 text-xs text-slate-400 font-bold uppercase tracking-widest">Or Custom</span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={newDeadlineDate} onChange={e => { setNewDeadlineDate(e.target.value); setNewDeadlinePreset(0); }} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-[#131722] dark:text-white outline-none focus:border-blue-500" />
                    <input type="time" value={newDeadlineTime} onChange={e => { setNewDeadlineTime(e.target.value); setNewDeadlinePreset(0); }} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-[#131722] dark:text-white outline-none focus:border-blue-500" />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 mb-6">
                  {actionModal.type === 'cancel_rfq' 
                    ? 'Are you sure you want to cancel this RFQ? This action cannot be undone.' 
                    : 'Are you sure you want to reject this bid? The seller will be notified.'}
                </p>
              )}
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setActionModal({ isOpen: false, type: 'cancel_rfq', targetId: '' })} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Keep It</button>
                <button type="button" onClick={handleExecuteAction} className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors ${actionModal.type === 'extend_rfq' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-rose-500 hover:bg-rose-600'}`}>
                  {actionModal.type === 'cancel_rfq' ? 'Cancel RFQ' : actionModal.type === 'extend_rfq' ? 'Extend Deadline' : 'Reject Bid'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── IMAGE CAROUSEL MODAL ── */}
      <AnimatePresence>
        {imageCarousel.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setImageCarousel(prev => ({ ...prev, isOpen: false }))} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-4xl bg-transparent">
              <button onClick={() => setImageCarousel(prev => ({ ...prev, isOpen: false }))} className="absolute -top-12 right-0 text-white hover:text-rose-500 transition-colors bg-slate-900/50 p-2 rounded-full">
                <X className="w-6 h-6" />
              </button>
              
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center">
                <img src={imageCarousel.images[imageCarousel.currentIndex]} alt="Carousel" className="max-w-full max-h-full object-contain" />
                
                {imageCarousel.images.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setImageCarousel(prev => ({ ...prev, currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1 })); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-emerald-500 transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setImageCarousel(prev => ({ ...prev, currentIndex: prev.currentIndex === imageCarousel.images.length - 1 ? 0 : prev.currentIndex + 1 })); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-emerald-500 transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                {imageCarousel.images.map((_, idx) => (
                  <div key={idx} className={`w-2 h-2 rounded-full ${idx === imageCarousel.currentIndex ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
