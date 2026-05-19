/**
 * AIScannerModal — Agent tool for asset verification and grading
 */
import React, { useState } from 'react';
import { 
  Camera, 
  RefreshCw, 
  Scale, 
  Sparkles, 
  CheckCircle2, 
  DollarSign, 
  Phone, 
  CreditCard, 
  ChevronDown,
  Loader2,
  Brain,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, usePriceStore, useServiceStore, useAgentStore, useAuthStore, WASTE_CATEGORIES, getCategoryBySlug } from '@klinflow/core';
import AssetBadge from './AssetBadge';
import mpesaLogo from '../assets/logos/mpesa.svg';
import airtelLogo from '../assets/logos/airtel.svg';
import equityLogo from '../assets/logos/equity.svg';

const PAYOUT_PROVIDERS = [
  { id: 'mpesa', label: 'M-Pesa', color: 'bg-emerald-600', logo: mpesaLogo },
  { id: 'airtel', label: 'Airtel Money', color: 'bg-red-600', logo: airtelLogo },
  { id: 'equity', label: 'Equity/Bank', color: 'bg-amber-900', logo: equityLogo },
  { id: 'cash', label: 'Cash Payout', color: 'bg-slate-700', icon: '💵' }
];

interface AIScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (data: any) => void;
  booking: any;
  role?: 'agent' | 'user';
}

export default function AIScannerModal({ isOpen, onClose, onVerify, booking, role = 'agent' }: AIScannerModalProps) {
  const { categories } = useServiceStore();
  const { agentConfig, getEffectivePrice } = useAgentStore();
  const { profile } = useAuthStore();
  const [step, setStep] = useState('result'); 
  const [grade, setGrade] = useState(null);

  // Derive agent's custom catalog if available
  const customCatalog = (profile as any)?.service_profile?.custom_services || [];
  const hasCustomCatalog = customCatalog.length > 0;

  // Map custom catalog to standard format for the UI
  const uiCategories = hasCustomCatalog ? customCatalog.map((cat: any) => ({
    id: cat.category.toLowerCase(),
    label: `${cat.icon} ${cat.category}`,
    subcategories: (cat.subcategories || []).map((sub: any) => ({
      id: sub.name.toLowerCase().replace(/\s+/g, '_'),
      label: sub.name,
      rate: sub.rate_per_kg
    }))
  })) : WASTE_CATEGORIES;
  
  // Material State
  const initialMaterial = (booking?.material || booking?.wasteType || (hasCustomCatalog ? uiCategories[0].id : 'recyclable')).toLowerCase();
  const [material, setMaterial] = useState(initialMaterial);
  
  const currentCategory = uiCategories.find((c: any) => c.id === material) || uiCategories[0];
  const initialSub = currentCategory?.subcategories?.[0]?.id || 'pet';
  const [subcategory, setSubcategory] = useState(initialSub);

  const [weight, setWeight] = useState(booking?.actual_weight_kg || booking?.weightKg || booking?.bags || 10); // weight in KG
  
  const [payoutTarget, setPayoutTarget] = useState(booking?.phone || '');
  const [selectedProvider, setSelectedProvider] = useState(PAYOUT_PROVIDERS[0]);

  // Sync state when booking data loads
  React.useEffect(() => {
    if (booking?.material || booking?.wasteType) {
      const slug = (booking.material || booking.wasteType).toLowerCase();
      // Normalize legacy names
      if (slug === 'plastic') setMaterial('recyclable');
      else if (slug === 'e-waste') setMaterial('ewaste');
      else setMaterial(slug);
    }
    const derivedWeight = booking?.actual_weight_kg || booking?.weightKg || booking?.bags;
    if (derivedWeight) {
      setWeight(derivedWeight);
    }
    if (booking?.phone) {
      setPayoutTarget(booking.phone);
    }
  }, [booking]);
  
  // Pricing logic
  const getRate = () => {
    if (hasCustomCatalog) {
      const cat = uiCategories.find((c: any) => c.id === material);
      const sub = cat?.subcategories?.find((s: any) => s.id === subcategory);
      return sub?.rate || 10;
    }
    return getEffectivePrice(material, subcategory);
  };

  const [customPayoutAmount, setCustomPayoutAmount] = useState<number | null>(null);
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  const isMarketTrade = !!(
    booking?.is_market_trade || 
    booking?.isMarketTrade || 
    booking?.booking_type === 'marketplace_pickup' || 
    booking?.bookingType === 'marketplace_pickup'
  );
  const agentRate = getRate();
  const basePayoutAmount = isMarketTrade 
    ? (booking?.total_price || booking?.amount || 0) 
    : Number(weight) * agentRate;
  
  const payoutAmount = customPayoutAmount !== null ? customPayoutAmount : basePayoutAmount;
  const isCounterOffer = isMarketTrade && customPayoutAmount !== null && customPayoutAmount !== basePayoutAmount;
  const estimatedGFP = isMarketTrade ? 0 : Math.floor(Number(weight) * 2);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isManual, setIsManual] = useState(true); 
  const [aiReason, setAiReason] = useState(null);

  if (!isOpen) return null;

  const startScan = async () => {
    if (!photoFile) {
      alert("Please capture a photo first!");
      return;
    }
    setStep('scanning');
    try {
      // 1. Convert to Base64 for Vision API
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(photoFile);
      });
      const imageBase64 = await base64Promise;

      // 2. Upload to Storage for record keeping
      const fileExt = photoFile?.name?.split('.').pop() || 'jpg';
      const fileName = `${booking.id}-${Math.random()}.${fileExt}`;
      const filePath = `verifications/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('assets-verified').upload(filePath, photoFile);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('assets-verified').getPublicUrl(filePath);
      setPhotoUrl(publicUrl || null);

      // 3. Call HygeneX Vision Engine
      const { data: { session } } = await supabase.auth.getSession();
      const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hygenex-agent`;
      
      console.log('[AI Debug] Hitting URL:', EDGE_URL);
      console.log('[AI Debug] Session Present:', !!session);
      
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          type: 'vision_scan',
          userId: profile?.id,
          payload: { 
            imageBase64,
            materialHint: material
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Debug] Server Error Response:', errorText);
        throw new Error(`AI Scan Failed: ${response.status} ${errorText}`);
      }
      
      const analysis = await response.json();
      console.log('[AI Debug] Analysis Success:', analysis);

      // 4. Update UI with Real Results
      if (analysis.material) setMaterial(analysis.material.toLowerCase());
      if (analysis.grade) {
        // Find matching subcategory if possible
        const catData = getCategoryBySlug(analysis.material || material);
        const bestSub = catData?.subcategories?.find(s => s.id.includes(analysis.grade.toLowerCase())) || catData?.subcategories?.[0];
        if (bestSub) setSubcategory(bestSub.id);
        setGrade(analysis.grade);
      }
      
      // Store AI reason for display
      setAiReason(analysis.reason);
      setStep('result');

    } catch (err) {
      console.error('[Vision Scan] Error:', err);
      toast.error("AI Scan Failed", { description: "Falling back to manual verification." });
      setStep('result');
    }
  };


  const handleFinalConfirm = async () => {
    setIsProcessing(true);
    try {
      await onVerify({
        materialType: material,
        grade: subcategory, // We store subcategory in the grade column for now
        weightKg: Number(weight),
        estimatedValue: payoutAmount,
        isCounterOffer,
        counterOfferAmount: isCounterOffer ? customPayoutAmount : null,
        photo_url: photoUrl,
        payout_method: selectedProvider?.id,
        payout_target: payoutTarget,
        status: 'verified'
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up pb-[env(safe-area-inset-bottom)]">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Sparkles className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none">Smart Verification</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Asset Intake & Payout</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400">
             <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto py-6">
          {step === 'result' && (
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-y border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase">Category</label>
                      <select 
                        value={material}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setMaterial(newCat);
                          const catData = getCategoryBySlug(newCat);
                          if (catData?.subcategories?.length) setSubcategory((catData as any).subcategories[0].id);
                        }}
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {uiCategories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase">Grade / Sub-type</label>
                      <select 
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {currentCategory?.subcategories?.map((sub: any) => (
                          <option key={sub.id} value={sub.id}>{sub.label} {sub.rate ? `(KSh ${sub.rate})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 uppercase">Weight (KG)</label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <input 
                        type="number"
                        value={weight}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWeight(val === '' ? '' : val.replace(/^0+(?=\d)/, ''));
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-black focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital ID & AI Insight Display */}
              <div className="mx-6 space-y-3">
                <div className="p-4 bg-white dark:bg-black rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between group overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl -mr-5 -mt-5" />
                   <div className="flex items-center gap-3 relative z-10">
                      <div className="w-8 h-8 bg-emerald-50 dark:bg-white/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                         <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Digital Batch ID</p>
                         <p className="text-[10px] font-mono font-bold text-slate-900 dark:text-white tracking-widest uppercase">CF-{material.substring(0,3).toUpperCase()}-{Math.random().toString(36).substring(2,6).toUpperCase()}</p>
                      </div>
                   </div>
                   <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[8px] font-black uppercase rounded border border-emerald-200 dark:border-emerald-500/20 relative z-10">
                      TRACKABLE
                   </div>
                </div>

                {aiReason && (
                  <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-start gap-3 animate-slide-up">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">Neural Insight</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 italic leading-snug">"{aiReason}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice Display */}
              <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900 p-6 text-white shadow-xl relative overflow-hidden border-y border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/50 flex items-center gap-2">
                    <CreditCard className="w-3 h-3" /> Mission Invoice
                  </h4>
                  {isMarketTrade && (
                    <button 
                      onClick={() => setIsEditingPrice(!isEditingPrice)}
                      className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all active:scale-95 ${
                        isEditingPrice 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}
                    >
                      {isEditingPrice ? 'Cancel Edit' : '✏️ Edit Price'}
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start text-sm font-bold">
                    <div className="flex flex-col pt-1">
                       <span className="text-emerald-300 uppercase text-xs tracking-widest">{isMarketTrade ? 'Agreed Deal Value' : 'Material Payout'}</span>
                      <span className="text-xs text-white/40 font-black uppercase tracking-tighter mt-1">
                        {isCounterOffer ? 'Counter-Offer Mode' : isMarketTrade ? 'Marketplace Handshake' : `(${weight}kg @ KSh ${agentRate}/kg)`}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5">
                      {isEditingPrice ? (
                        <input 
                          type="number"
                          value={customPayoutAmount === null ? basePayoutAmount : customPayoutAmount}
                          onChange={(e) => setCustomPayoutAmount(Number(e.target.value))}
                          className="w-32 bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-1.5 text-right text-emerald-400 font-mono text-xl outline-none focus:border-emerald-400 shadow-inner"
                          autoFocus
                        />
                      ) : (
                        <span className={`font-mono text-2xl mt-0.5 ${isCounterOffer ? 'text-amber-400' : 'text-emerald-400'}`}>
                          +KSh {(payoutAmount * 0.90).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-start text-sm font-bold pt-2">
                    <div className="flex flex-col">
                       <span className="text-rose-400 uppercase text-xs tracking-widest">Platform Commission</span>
                       <span className="text-xs text-white/40 font-black uppercase tracking-tighter mt-1">(10% System Fee)</span>
                    </div>
                    <span className="font-mono text-lg text-rose-400">
                      -KSh {(payoutAmount * 0.10).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black text-white/40 uppercase tracking-widest">Sustainability Rewards</p>
                      <p className={`text-sm font-black flex items-center gap-2 ${isMarketTrade ? 'text-white/20' : 'text-emerald-300'}`}>
                        <Sparkles className="w-4 h-4" /> {isMarketTrade ? 'NONE' : `${estimatedGFP} GFP`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payout Target (Agent Only) */}
              {role === 'agent' && (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-y border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">{isMarketTrade ? 'Seller Wallet' : 'Recipient Wallet'}</h4>
                    <div className="flex items-center gap-2 text-primary">
                        <Phone className="w-3 h-3" />
                        <span className="text-xs font-black uppercase">Active Channel</span>
                    </div>
                  </div>
                  
                  <input 
                    type="text"
                    value={payoutTarget}
                    onChange={(e) => setPayoutTarget(e.target.value)}
                    placeholder="Enter M-Pesa / Phone Number"
                    className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
                  />

                  <div className="grid grid-cols-4 gap-2">
                    {PAYOUT_PROVIDERS.map((provider) => {
                      const isActive = selectedProvider?.id === provider.id;
                      return (
                        <button
                          key={provider.id}
                          onClick={() => setSelectedProvider(provider)}
                          className={`h-14 rounded-2xl flex items-center justify-center transition-all border-2 ${
                            isActive 
                              ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-105' 
                              : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                          }`}
                        >
                          {provider.logo ? (
                            <img 
                              src={provider.logo} 
                              alt={provider.label} 
                              className={`h-6 w-auto transition-all ${isActive ? 'grayscale-0 brightness-110' : ''}`} 
                            />
                          ) : (
                            <span className="text-xl">{provider.icon}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="px-6 mt-6">
                <button 
                  onClick={handleFinalConfirm}
                  disabled={isProcessing || weight <= 0}
                  className={`w-full py-5 text-white font-black text-sm rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 ${
                    isCounterOffer ? 'bg-amber-500 shadow-amber-500/30' : 'bg-primary shadow-primary/30'
                  }`}
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {isProcessing 
                    ? 'Processing...' 
                    : role === 'user' 
                      ? 'LOCK VALUATION & CONTINUE' 
                      : isCounterOffer 
                        ? 'SUBMIT COUNTER-OFFER' 
                        : 'COMPLETE PICKUP & PAYOUT'}
                </button>
              </div>
            </div>
          )}

          {step === 'scanning' && (
            <div className="py-20 flex flex-col items-center text-center">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-primary rounded-full animate-ping opacity-20" />
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">AI Vision Active...</h4>
              <p className="text-xs font-black uppercase text-slate-400 tracking-widest mt-2">Checking Purity & Material Grade</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
