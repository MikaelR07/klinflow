import { OptimizedImage } from "@klinflow/ui";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Scale, Coins, Truck, Camera, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { compressImage } from '@klinflow/core/utils/imageUtils';

const parseTime = (timeStr: string) => {
  if (!timeStr) return "00:00";
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) return timeStr;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return "00:00";
  let hours = parseInt(match[1], 10);
  if (match[3] && match[3].toUpperCase() === "PM" && hours < 12) hours += 12;
  if (match[3] && match[3].toUpperCase() === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${match[2]}`;
};

export default function RFQDetailsPage() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const profile = useAuthStore(s => (s as any).profile);

  const [rfq, setRfq] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Bid & Negotiation State
  const [bidPrice, setBidPrice] = useState('');
  const [availableQty, setAvailableQty] = useState('');
  const [shippingDate, setShippingDate] = useState('');
  const [shippingTime, setShippingTime] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [existingOfferId, setExistingOfferId] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchRFQ = async () => {
      if (!profile?.id) return;
      try {
        const response = await supabase
          .from('rfqs')
          .select(`
            *,
            buyer:profiles!rfqs_buyer_id_fkey(company_name, name),
            rfq_offers(count)
          `)
          .eq('id', rfqId || '')
          .single();

        const data: any = response.data;
        const error = response.error;

        if (error) throw error;

        if (data) {
          let deadlineText = 'Open';
          if (data.deadline) {
            const daysLeft = Math.ceil((new Date(data.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            if (daysLeft < 0) deadlineText = 'Expired';
            else if (daysLeft === 0) deadlineText = 'Today';
            else if (daysLeft === 1) deadlineText = 'Tomorrow';
            else deadlineText = `${daysLeft} days`;
          }

          let deliveryText = 'Flexible';
          if (data.delivery_method === 'agent_pickup') deliveryText = 'Agent Pickup';
          else if (data.delivery_method === 'self_drop') deliveryText = 'Self Drop-off';

          setRfq({
            id: data.id,
            buyer_id: data.buyer_id, // Needed for inserting offer
            company: data.buyer?.company_name || data.buyer?.name || 'Unknown Buyer',
            material: data.material_grade,
            quantity: `${data.requested_weight}kg`,
            price: data.target_price || 0,
            deadline: deadlineText,
            verified: true,
            region: data.pickup_area,
            category: data.category,
            delivery: deliveryText,
            offersSubmitted: data.rfq_offers?.[0]?.count || 0,
            notes: data.notes || null,
            imageUrls: data.images && data.images.length > 0 ? data.images : [
              'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80'
            ]
          });
          setBidPrice((data.target_price || 0).toString());
          setAvailableQty(data.requested_weight.toString());

          // Check if seller already submitted an offer
          const { data: offerData } = await supabase
            .from('rfq_offers')
            .select('id')
            .eq('rfq_id', rfqId)
            .eq('seller_id', profile.id)
            .maybeSingle();

          if (offerData) {
            setExistingOfferId(offerData.id);
          }

          // If RFQ is fulfilled, check if this seller won the bid
          if (data.status === 'fulfilled') {
            const { data: fulfillmentData } = await supabase
              .from('fulfillment_orders')
              .select('id')
              .eq('rfq_id', rfqId)
              .eq('seller_id', profile.id)
              .maybeSingle();

            if (fulfillmentData) {
              navigate(`/fulfillment/${fulfillmentData.id}`, { replace: true });
              return; // Stop loading the rest of the page
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch RFQ:', err);
        toast.error('Failed to load RFQ details');
      } finally {
        setLoading(false);
      }
    };

    if (rfqId) fetchRFQ();
  }, [rfqId, profile?.id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const spaceLeft = 4 - proofFiles.length;

      if (spaceLeft <= 0) {
        toast.error('Maximum limit of 4 proof images reached');
        return;
      }

      const filesToUpload = filesArray.slice(0, spaceLeft);
      const newImages = filesToUpload.map(file => URL.createObjectURL(file));

      setProofFiles(prev => [...prev, ...filesToUpload]);
      setProofImages(prev => [...prev, ...newImages]);

      if (filesArray.length > spaceLeft) {
        toast.warning(`Only ${spaceLeft} image(s) added. Max limit is 4.`);
      } else {
        toast.success('Proof image added');
      }
    }
  };

  const removeImage = (index: number) => {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
    setProofImages(prev => prev.filter((_, i) => i !== index));
    toast.info('Proof image removed');
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error('You must be logged in to submit an offer');
      return;
    }
    if (!bidPrice || Number(bidPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (!availableQty || Number(availableQty) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (!shippingDate || !shippingTime) {
      toast.error('Please specify the earliest shipping date and time');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Compress and Upload Images
      const uploadedUrls: string[] = [];
      for (let i = 0; i < proofFiles.length; i++) {
        const file = proofFiles[i]!;
        const compressed = await compressImage(file, { maxWidth: 1024, quality: 0.7 });

        const fileName = `${profile.id}/${Date.now()}-${i}-${compressed.name?.replace(/\s/g, '_')}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('rfq-images')
          .upload(fileName, compressed);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('rfq-images').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      // 2. Parse Earliest Shipping Date
      const earliestShippingDateObj = new Date(`${shippingDate}T${parseTime(shippingTime)}`);

      // 3. Insert Offer
      const insertPayload: any = {
        rfq_id: rfq.id,
        seller_id: profile.id,
        buyer_id: rfq.buyer_id,
        offered_weight: parseFloat(availableQty),
        offered_price: parseFloat(bidPrice),
        images: uploadedUrls,
        earliest_shipping_date: isNaN(earliestShippingDateObj.getTime()) ? null : earliestShippingDateObj.toISOString(),
        status: 'pending'
      };

      const { error: insertError } = await supabase.from('rfq_offers').insert(insertPayload);

      if (insertError) throw insertError;

      toast.success('Your offer has been sent to the buyer!', {
        description: `Bidded KSh ${bidPrice}/kg for ${availableQty}kg.`
      });
      setExistingOfferId('submitted'); // Optimistic update
    } catch (err: any) {
      console.error('Failed to submit offer:', err);
      toast.error(err.message || 'Failed to submit offer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeImageIndex) {
      setActiveImageIndex(newIndex);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-800">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-800 p-4 text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">RFQ Not Found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-slate-50 dark:bg-slate-800 pb-12 transition-colors">
      <div
        className="relative h-[350px] w-full overflow-hidden border-b border-slate-200 dark:border-slate-800 shadow-sm bg-slate-900"
      >
        <div
          onScroll={handleScroll}
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
        >
          {rfq.imageUrls.map((url: string, index: number) => (
            <div key={index} className="w-full h-full shrink-0 snap-center">
              <img
                src={url}
                alt={`${rfq.material} view ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-[calc(env(safe-area-inset-top,1rem)+0.6rem)] left-4 w-10 h-10 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md active:scale-95 transition-all group z-10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {rfq.imageUrls.length > 1 && (
          <div className="absolute top-[calc(env(safe-area-inset-top,1rem)+0.6rem)] right-4 z-10 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
            <span>{activeImageIndex + 1} / {rfq.imageUrls.length}</span>
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
          </div>
        )}

        {rfq.imageUrls.length > 1 && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5 z-10">
            {rfq.imageUrls.map((_: any, index: number) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === activeImageIndex ? 'w-4 bg-emerald-500' : 'w-1.5 bg-white/40'
                  }`}
              />
            ))}
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none">
          <div>
            <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">Active RFQ Attachment</p>
            <h2 className="text-base font-black text-white capitalize leading-tight">{rfq.material}</h2>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            {rfq.category}
          </span>
        </div>
      </div>

      <div className="space-y-4 px-1.5 mt-2">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Client Name</p>
            <h3 className="text-sm font-black text-slate-900 dark:text-white capitalize leading-none">{rfq.company}</h3>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Required Weight</p>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{rfq.quantity}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Coins className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Offered Price</p>
                <p className="text-xs font-black text-emerald-600 leading-none">KSh {rfq.price}/kg</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Delivery Time</p>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{rfq.delivery}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Deadline</p>
                <span className="text-xs font-black text-rose-500 uppercase">{rfq.deadline === 'Open' ? 'No Deadline' : `${rfq.deadline} Left`}</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Offers Submitted</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800/40 text-slate-850 dark:text-slate-200 font-black text-[10px]">
              {rfq.offersSubmitted} proposal{rfq.offersSubmitted !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {rfq.notes && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-3">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Description / Specifications</p>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{rfq.notes}</p>
          </div>
        )}

        {existingOfferId ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800/40 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-wider">Offer Has Been Submitted</h4>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-500/80 font-semibold mb-4 leading-relaxed">
              Your quote has been successfully sent to the buyer. You can track its status in your Submitted Quotes dashboard.
            </p>
            <button
              onClick={() => navigate('/quotes')}
              className="mt-2 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
            >
              View My Quotes
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitProposal} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-5">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Submit Bid Proposal</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Set your rates and upload your inventory batch details.</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Offer Rate (KSh/kg)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                    placeholder="e.g. 28"
                    className="w-full pl-4 pr-16 py-3 text-sm font-black rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">KSh/kg</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Supply (kg)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={availableQty}
                    onChange={(e) => setAvailableQty(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full pl-4 pr-12 py-3 text-sm font-black rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">kg</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earliest Ship Date</label>
                  <input
                    type="date"
                    value={shippingDate}
                    onChange={(e) => setShippingDate(e.target.value)}
                    className="w-full px-4 py-3 text-[13px] font-black rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earliest Time</label>
                  <input
                    type="time"
                    value={shippingTime}
                    onChange={(e) => setShippingTime(e.target.value)}
                    className="w-full px-4 py-3 text-[13px] font-black rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attach Material Proof Images</label>
                  <span className="text-[9px] font-bold text-slate-450 dark:text-slate-400 uppercase">{proofImages.length} / 4 uploaded</span>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {proofImages.length < 4 && (
                    <label className="aspect-square rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-colors">
                      <Camera className="w-5 h-5 text-slate-400" />
                      <span className="text-[8px] font-black text-slate-400 uppercase mt-1">Upload</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" multiple />
                    </label>
                  )}
                  {proofImages.map((src, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 dark:border-slate-800">
                      <OptimizedImage src={src} alt={`Proof ${index}`} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <Trash2 className="w-4.5 h-4.5 text-rose-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-primary hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em]  active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting proposal...' : 'Submit Proposal & Negotiate'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
