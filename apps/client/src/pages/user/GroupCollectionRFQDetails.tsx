/**
 * GroupCollectionRFQDetails.tsx — Detail page for a Group Collection RFQ.
 * Shows RFQ specs (like RFQDetailsPage), fulfillment progress, contributors list,
 * and a streamlined "Pledge Supply" form for sellers to commit their stock.
 */
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Scale, MapPin, Users, Clock, Coins, Truck,
  ChevronRight, X, CheckCircle2, AlertTriangle, User,
  FileText, Camera, Trash2, Handshake, ShieldCheck, Recycle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { supabase } from '@klinflow/supabase';
import { compressImage } from '@klinflow/core/utils/imageUtils';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Contributor {
  id: string;
  seller_id: string;
  offered_weight: number;
  offered_price: number;
  status: string;
  created_at: string;
  seller?: {
    name?: string;
    company_name?: string;
    avatar_url?: string;
  };
}

export default function GroupCollectionRFQDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const profile = useAuthStore(s => s.profile);

  const [rfq, setRfq] = useState<any>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Pledge form
  const [pledgeWeight, setPledgeWeight] = useState('');
  const [sellerNotes, setSellerNotes] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [existingPledge, setExistingPledge] = useState<string | null>(null);

  const loadData = async () => {
    if (!id || !profile?.id) return;
    setLoading(true);

    try {
      let storeMaterials = useServiceStore.getState().materialPrices;
      if (!storeMaterials || storeMaterials.length === 0) {
        await useServiceStore.getState().fetchMaterialPrices();
        storeMaterials = useServiceStore.getState().materialPrices;
      }
      let storeCategories = useServiceStore.getState().categories;
      if (!storeCategories || storeCategories.length === 0) {
        await useServiceStore.getState().fetchCategories();
        storeCategories = useServiceStore.getState().categories;
      }

      const { data, error } = await supabase
        .from('rfqs')
        .select(`
          *,
          buyer:profiles!rfqs_buyer_id_fkey(company_name, name, avatar_url),
          rfq_offers(count)
        `)
        .eq('id', id)
        .single();

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

        const materialRecord = storeMaterials.find(m => m.id === data.material_grade);
        const materialName = materialRecord ? materialRecord.material_name : data.material_grade;

        const categoryRecord = storeCategories.find(c => c.id === data.category);
        const categoryName = categoryRecord ? categoryRecord.label : data.category;

        setRfq({
          id: data.id,
          buyer_id: data.buyer_id,
          company: data.buyer?.company_name || data.buyer?.name || 'Unknown Buyer',
          buyerAvatar: data.buyer?.avatar_url || null,
          material: materialName,
          quantity: `${data.requested_weight}kg`,
          requestedWeight: data.requested_weight || 0,
          price: data.target_price || 0,
          deadline: deadlineText,
          verified: true,
          region: data.pickup_area,
          category: categoryName,
          delivery: deliveryText,
          offersSubmitted: data.rfq_offers?.[0]?.count || 0,
          notes: data.notes || null,
          status: data.status || 'open',
          imageUrls: data.images && data.images.length > 0
            ? data.images
            : ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80'],
        });

        // Set default pledge price to target price
        // Don't overwrite if user already typed
        if (!pledgeWeight) {
          // leave empty for user to fill
        }
      }

      // Fetch contributors (offers for this RFQ)
      const { data: offersData } = await supabase
        .from('rfq_offers')
        .select(`
          id, seller_id, offered_weight, offered_price, status, created_at,
          seller:profiles!rfq_offers_seller_id_fkey(name, company_name, avatar_url)
        `)
        .eq('rfq_id', id)
        .order('created_at', { ascending: false });

      if (offersData) {
        setContributors(offersData as Contributor[]);
        // Check if current user already pledged
        const myPledge = offersData.find((o: any) => o.seller_id === profile.id);
        if (myPledge) setExistingPledge(myPledge.id);
      }

    } catch (err: any) {
      console.error('Failed to fetch group RFQ:', err);
      toast.error('Failed to load contract details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id, profile?.id]);

  const totalPledged = contributors.reduce((sum, c) => sum + (c.offered_weight || 0), 0);
  const percentage = rfq ? Math.min(100, Math.round((totalPledged / rfq.requestedWeight) * 100)) : 0;
  const remaining = rfq ? Math.max(0, rfq.requestedWeight - totalPledged) : 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const spaceLeft = 4 - proofFiles.length;
      if (spaceLeft <= 0) { toast.error('Maximum 4 images'); return; }
      const filesToUpload = filesArray.slice(0, spaceLeft);
      const newImages = filesToUpload.map(file => URL.createObjectURL(file));
      setProofFiles(prev => [...prev, ...filesToUpload]);
      setProofImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
    setProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitPledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) { toast.error('You must be logged in'); return; }
    if (!pledgeWeight || Number(pledgeWeight) <= 0) { toast.error('Enter a valid weight'); return; }
    if (Number(pledgeWeight) > remaining) { toast.error(`Only ${remaining}kg remaining to fulfill`); return; }

    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < proofFiles.length; i++) {
        const file = proofFiles[i]!;
        const compressed = await compressImage(file, { maxWidth: 1024, quality: 0.7 });
        const fileName = `${profile.id}/${Date.now()}-${i}-${compressed.name?.replace(/\s/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from('rfq-images').upload(fileName, compressed);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('rfq-images').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      const { error: insertError } = await supabase.from('rfq_offers').insert({
        rfq_id: rfq.id,
        seller_id: profile.id,
        buyer_id: rfq.buyer_id,
        offered_weight: parseFloat(pledgeWeight),
        offered_price: rfq.price,
        images: uploadedUrls,
        notes: sellerNotes || null,
        status: 'accepted', // Auto-accept group pledges into the pool
      });

      if (insertError) throw insertError;

      toast.success('Pledge submitted!', {
        description: `You committed ${pledgeWeight}kg at KSh ${rfq.price}/kg.`,
      });
      setExistingPledge('submitted');
      setPledgeWeight('');
      setSellerNotes('');
      setProofFiles([]);
      setProofImages([]);
      loadData();
    } catch (err: any) {
      console.error('Failed to submit pledge:', err);
      toast.error(err.message || 'Failed to submit pledge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeImageIndex) setActiveImageIndex(newIndex);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FF] dark:bg-slate-800">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FF] dark:bg-slate-800 px-6 text-center">
        <AlertTriangle className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-sm font-bold text-slate-500">Contract not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-xs font-bold text-blue-600 uppercase tracking-widest">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-lg mx-auto bg-slate-50 dark:bg-slate-800 pb-8 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-900">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-600 dark:text-white capitalize tracking-tighter leading-tight">
              Contract Details
            </h1>
            <p className="text-[10px] font-bold text-blue-600 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Group Collection Contract
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4rem)]">
        {/* ── IMAGE CAROUSEL ── */}
        <div className="relative h-[270px] w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-900">
          <div
            onScroll={handleScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
            {rfq.imageUrls.map((url: string, index: number) => (
              <div key={index} className="w-full h-full shrink-0 snap-center">
                <img src={url} alt={`${rfq.material} view ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />

         

          {rfq.imageUrls.length > 1 && (
            <>
              <div className="absolute top-4 right-4 z-10 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-widest">
                {activeImageIndex + 1} / {rfq.imageUrls.length}
              </div>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                {rfq.imageUrls.map((_: any, index: number) => (
                  <div key={index} className={`h-1.5 rounded-full transition-all duration-300 ${index === activeImageIndex ? 'w-4 bg-blue-500' : 'w-1.5 bg-white/40'}`} />
                ))}
              </div>
            </>
          )}
        </div>

        

        {/* ── SPECIFICATIONS CARD ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material</p>
              <h2 className="text-[16px] font-bold text-indigo-700 dark:text-white capitalize leading-tight">{rfq.material}</h2>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-200 dark:border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">Verified</span>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Buyer</p>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{rfq.company}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Needed</p>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{rfq.quantity}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Coins className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Target Price</p>
                <p className="text-xs font-black text-emerald-600 leading-none">KSh {rfq.price}/kg</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Truck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Delivery</p>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{rfq.delivery}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Deadline</p>
                <span className="text-xs font-black text-rose-500 uppercase">{rfq.deadline === 'Open' ? 'No Deadline' : `${rfq.deadline} Left`}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Location</p>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{rfq.region}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── NOTES ── */}
        {rfq.notes && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-3">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Description / Specifications</p>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{rfq.notes}</p>
          </div>
        )}
        {/* ── FULFILLMENT PROGRESS HERO ── */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 text-white relative overflow-hidden">

          <div className="relative z-10 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mb-1">Fulfillment Progress</p>
                <h2 className="text-2xl font-black text-white tracking-tight">{percentage}%</h2>
              </div>
              <div className="relative w-[96px] h-[96px] flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" className="stroke-white/20" strokeWidth="5" fill="none" />
                  <circle cx="48" cy="48" r="40" className="stroke-blue-300" strokeWidth="5" fill="none" strokeDasharray="251" strokeDashoffset={251 - (251 * percentage) / 100} strokeLinecap="round" />
                </svg>
                <span className="absolute text-lg font-black text-white">{contributors.length}</span>
                <span className="absolute text-[9px] font-bold text-blue-200 mt-10">sellers</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span>{totalPledged.toLocaleString()} KG pledged</span>
                <span>{rfq.requestedWeight.toLocaleString()} KG needed</span>
              </div>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-blue-300 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
              </div>
              {remaining > 0 && (
                <p className="text-[10px] font-semibold text-blue-200/80">{remaining.toLocaleString()} KG still needed to complete this contract</p>
              )}
            </div>
          </div>
        </div>

        {/* ── CONTRIBUTORS LIST ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/40 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
              Contributors ({contributors.length})
            </h3>
            <span className="text-[10px] font-bold text-blue-600">{totalPledged}kg total</span>
          </div>
          {contributors.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">No sellers have pledged yet. Be the first!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {contributors.map((c) => {
                const sellerName = c.seller?.company_name || c.seller?.name || 'Anonymous Seller';
                const isMe = c.seller_id === profile?.id;
                return (
                  <div key={c.id} className="px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 overflow-hidden flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
                        {c.seller?.avatar_url ? (
                          <img src={getThumbnailUrl(c.seller.avatar_url, { width: 100 })} className="w-full h-full object-cover" alt={sellerName} />
                        ) : (
                          <span className="text-blue-700 font-bold text-xs">{sellerName[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{sellerName}</p>
                          {isMe && (
                            <span className="text-[8px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 capitalize">{c.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">{c.offered_weight} KG</p>
                      <p className="text-[9px] font-semibold text-slate-400">KSh {c.offered_price}/kg</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── PLEDGE FORM OR ALREADY PLEDGED ── */}
        {existingPledge && rfq.status === 'completed' ? (
          <div className="bg-emerald-600 dark:bg-emerald-800 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/40 shadow-sm text-center space-y-3">
            <div className="w-10 h-10 bg-emerald-500 dark:bg-emerald-700/50 text-white rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contract Completed & Paid</h4>
            <p className="text-xs text-emerald-100 font-semibold mb-4 leading-relaxed">
              This contract has been fully fulfilled and payouts have been settled. Check your Wallet for payment details.
            </p>
            <button
              onClick={() => navigate('/my-trades')}
              className="mt-2 w-full py-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-[0.98] transition-all"
            >
              View Trade History
            </button>
          </div>
        ) : existingPledge ? (
          <div className="bg-blue-700 dark:bg-blue-900 rounded-xl p-4 border border-blue-100 dark:border-blue-800/40 shadow-sm text-center space-y-3">
            <div className="w-10 h-10 bg-blue-500 dark:bg-blue-800/50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-sm font-bold text-white dark:text-blue-400 uppercase tracking-wider">You've Pledged to This Contract</h4>
            <p className="text-xs text-blue-200 dark:text-slate-200 font-semibold mb-4 leading-relaxed">
              Your contribution is recorded. The buyer will come once the contract is fulfilled.Check your Submitted Quotes page in the Accepted section for more details.
            </p>
            <button
              onClick={() => navigate('/my-rfq-offers')}
              className="mt-2 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-[0.98] transition-all"
            >
              View My Pledges
            </button>
          </div>
        ) : remaining <= 0 ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 border border-emerald-100 dark:border-emerald-800/40 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Contract Fully Fulfilled</h4>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-300/60 font-medium">This group contract has been completely filled by sellers.</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmitPledge}
            className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-5"
          >
            <div>
              <h4 className="text-sm font-black text-slate-600 dark:text-white uppercase tracking-wider">Pledge Your Supply</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                Commit stock to help fulfill this group contract. {remaining.toLocaleString()}kg still needed.
              </p>
            </div>

            {/* Target price info */}
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 flex items-center gap-3 border border-blue-100 dark:border-blue-800/30">
              <Coins className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-800 dark:text-blue-300">Payout Rate: KSh {rfq.price}/kg</p>
                <p className="text-[10px] text-blue-600/70 dark:text-blue-300/60 font-medium">Fixed rate set by the buyer for this contract</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Supply (KG)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={pledgeWeight}
                    onChange={(e) => setPledgeWeight(e.target.value)}
                    placeholder={`e.g. ${Math.min(100, remaining)}`}
                    max={remaining}
                    min={1}
                    className="w-full pl-4 pr-16 py-3 text-sm font-black rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">kg</span>
                </div>
                {pledgeWeight && Number(pledgeWeight) > 0 && (
                  <p className="text-[10px] font-bold text-emerald-600 ml-1">
                    You'll earn: KSh {(Number(pledgeWeight) * rfq.price).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note to the buyer(Optional)</label>
                <textarea
                  value={sellerNotes}
                  onChange={(e) => setSellerNotes(e.target.value)}
                  placeholder="Material condition, sorting details, or any info for the buyer..."
                  className="w-full px-4 py-3 text-sm font-medium rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[80px] resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proof Images</label>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{proofImages.length} / 4</span>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {proofImages.length < 4 && (
                    <label className="aspect-square rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors">
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
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Commit Supply Pledge'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
