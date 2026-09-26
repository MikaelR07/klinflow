import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, ShieldCheck, Camera, CheckCircle2, ChevronRight, Loader2, AlertCircle, Banknote, Calculator, Image as ImageIcon } from 'lucide-react';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { FulfillmentOrder } from '@klinflow/core/stores/fulfillmentStore.types';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: FulfillmentOrder;
}

export default function VerificationWorkflowModal({ isOpen, onClose, order }: Props) {
  const { verifyMaterial } = useFulfillmentStore();
  const { agentConfig, fetchAgentConfig } = useAgentStore();
  const { profile } = useAuthStore();
  const { categories, materialPrices, fetchCategories, fetchMaterialPrices } = useServiceStore();

  const proposal = Array.isArray((order as any).proposal) ? (order as any).proposal[0] : (order as any).proposal;
  const rfq = Array.isArray((order as any).rfq) ? (order as any).rfq[0] : (order as any).rfq;

  const [step, setStep] = useState(1);
  const [weight, setWeight] = useState<string>('');
  const [grade, setGrade] = useState('Standard');
  const [code, setCode] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingMaterial, setIsEditingMaterial] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  useEffect(() => {
    if (!agentConfig) fetchAgentConfig();
    if (categories.length === 0) fetchCategories();
    if (materialPrices.length === 0) fetchMaterialPrices();
  }, []);

  const { getEffectivePrice } = useAgentStore();

  // Build categories from DB, filtered by agent config accepted_materials & custom_services
  const activeCategories = useMemo(() => {
    const serviceProfile = (profile as any)?.service_profile;
    const customServices = serviceProfile?.custom_services || [];
    
    let acceptedSlugs: string[] = [];
    if (serviceProfile?.categories && Array.isArray(serviceProfile.categories)) {
      acceptedSlugs = serviceProfile.categories.filter((c: any) => c.enabled).map((c: any) => c.name.toLowerCase());
    } else if (agentConfig?.accepted_materials && Array.isArray(agentConfig.accepted_materials)) {
      acceptedSlugs = agentConfig.accepted_materials.map((m: string) => m.toLowerCase());
    }

    const customSlugs = customServices.map((c: any) => c.category.toLowerCase().replace(/\s+/g, '_'));
    const allSlugs = [...new Set([...acceptedSlugs, ...customSlugs])];

    // If still loading, or if the agent has explicitly zero configured categories, return an empty list.
    // NEVER fall back to showing all default categories.
    if (!agentConfig && !serviceProfile) return []; 
    if (allSlugs.length === 0) return [];

    const filteredDB = categories.filter(cat => allSlugs.includes((cat as any).slug) || allSlugs.includes(cat.id));
    
    const customCats = customServices.map((c: any) => ({
      id: c.category.toLowerCase().replace(/\s+/g, '_'),
      label: c.category,
      icon: c.icon || '📦',
      slug: c.category.toLowerCase().replace(/\s+/g, '_')
    }));
    
    const newCustom = customCats.filter((cc: any) => !filteredDB.some(db => db.id === cc.id || db.label.toLowerCase() === cc.label.toLowerCase()));
    
    return [...filteredDB, ...newCustom];
  }, [agentConfig, categories, profile]);

  // Get subcategories for the selected category from materialPrices or custom_services
  const activeSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    
    const cat = activeCategories.find(c => c.id === selectedCategory);
    if (!cat) return [];

    const customServices = (profile as any)?.service_profile?.custom_services || [];
    const customMatch = customServices.find((c: any) => 
      c.category.toLowerCase().replace(/\s+/g, '_') === selectedCategory || 
      c.category.toLowerCase() === cat.label.toLowerCase()
    );

    if (customMatch && customMatch.subcategories?.length > 0) {
      return customMatch.subcategories.map((s: any) => ({
        id: s.name.toLowerCase().replace(/\s+/g, '_'),
        material_name: s.name,
        category: cat.id,
        price_per_kg: s.rate_per_kg
      }));
    }

    return materialPrices.filter(m =>
      m.category === cat.id || m.category === (cat as any).slug || m.category === cat.label
    );
  }, [selectedCategory, activeCategories, materialPrices, profile]);

  // Derive agent rate from getEffectivePrice
  const agentRate = useMemo(() => {
    if (!selectedCategory || !selectedSubcategory) return 0;
    const cat = activeCategories.find(c => c.id === selectedCategory);
    if (!cat) return 0;

    const sub = activeSubcategories.find(s => s.material_name === selectedSubcategory);
    return getEffectivePrice((cat as any).slug || cat.id, sub?.id || selectedSubcategory);
  }, [selectedCategory, selectedSubcategory, activeCategories, activeSubcategories, getEffectivePrice]);

  useEffect(() => {
    if (isOpen && proposal) {
      setWeight(proposal.offered_weight?.toString() || '');
      setSelectedCategory(rfq?.category || '');
      setSelectedSubcategory(rfq?.material_grade || '');
      setIsEditingMaterial(false);
    } else if (!isOpen) {
      setStep(1);
      setCode('');
      setPhotos([]);
      setSelectedCategory('');
      setSelectedSubcategory('');
      setIsEditingMaterial(false);
    }
  }, [isOpen, proposal, rfq]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1 && !weight) {
      toast.error('Please enter the verified weight.');
      return;
    }
    setStep(2);
  };
  const handleBack = () => setStep(1);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...newFiles].slice(0, 3));
    }
  };

  const handleSubmit = async () => {
    if (code.length !== 6) {
      toast.error('Please enter the 6-digit code from the seller');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyMaterial(
        order.id,
        selectedSubcategory,
        parseFloat(weight),
        grade,
        0,
        [], // Photos would be handled via storage upload here
        code
      );
      toast.success('Verification successful! Payment released.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Verification failed. Incorrect code?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4 pb-16 sm:pb-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[75vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Verify Material</h2>
              <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-1">
                Step {step} of 2
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500/20 dark:to-teal-500/10 rounded-2xl p-5 shadow-lg shadow-emerald-500/20 border border-emerald-400/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Scale className="w-6 h-6 text-white dark:text-emerald-400" />
                    <h3 className="text-lg font-black text-white dark:text-emerald-300">Measure & Verify</h3>
                  </div>
                  <p className="text-sm text-emerald-50 dark:text-emerald-400/80 leading-relaxed font-medium">
                    Verify the actual weight collected. The original proposed weight was <strong className="text-white dark:text-emerald-300 font-black px-1.5 py-0.5 bg-black/20 rounded-md">{proposal?.offered_weight || 0}kg</strong>.
                  </p>
                </div>

                {!isEditingMaterial ? (
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex gap-6">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Category</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{selectedCategory || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Material</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{selectedSubcategory || '—'}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditingMaterial(true)}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Category</label>
                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setSelectedSubcategory('');
                          }}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all cursor-pointer"
                        >
                          <option value="">Select</option>
                          {activeCategories.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Material</label>
                      <div className="relative">
                        <select
                          value={selectedSubcategory}
                          onChange={(e) => setSelectedSubcategory(e.target.value)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all cursor-pointer"
                          disabled={!selectedCategory}
                        >
                          <option value="">Select</option>
                          {activeSubcategories.map((m: any) => (
                            <option key={m.id} value={m.material_name}>{m.material_name}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {agentRate > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Your Config Rate</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">KSh {agentRate} / kg</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Verified Weight</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-lg font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all text-center"
                      placeholder="0.0"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">kg</div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Quality Grade</label>
                  <div className="relative">
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all cursor-pointer"
                    >
                      <option>Premium</option>
                      <option>Standard</option>
                      <option>Low Grade</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                {/* Inline Photos (Optional) */}
                <div className="pt-2">
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Evidence Photos (Optional)</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <label className="shrink-0 w-20 h-20 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer active:scale-95">
                      <Camera className="w-5 h-5" />
                      <span className="text-[9px] font-bold uppercase">Add</span>
                      <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotoUpload} />
                    </label>
                    {photos.map((p, idx) => (
                      <div key={idx} className="shrink-0 relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src={URL.createObjectURL(p)} alt="preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md hover:bg-black/80 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-500/20 dark:to-indigo-500/10 rounded-2xl p-5 shadow-lg shadow-blue-500/20 border border-blue-400/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Banknote className="w-6 h-6 text-white dark:text-blue-400" />
                    <h3 className="text-lg font-black text-white dark:text-blue-300">Payout & Authorization</h3>
                  </div>
                  <p className="text-sm text-blue-50 dark:text-blue-400/80 leading-relaxed font-medium">
                    Ask the seller to enter their 6-digit PIN to authorize the handover and receive <strong className="text-white dark:text-blue-300 font-black px-1.5 py-0.5 bg-black/20 rounded-md">KSh {((parseFloat(weight) || 0) * (parseFloat(proposal?.offered_price) || 0)).toLocaleString()}</strong>.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Material</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white capitalize">{selectedSubcategory || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verified Weight</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{weight || 0} kg</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Seller Payout</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        KSh {((parseFloat(weight) || 0) * (parseFloat(proposal?.offered_price) || 0)).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                        (KSh {proposal?.offered_price || 0} × {weight || 0} kg)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-4">
                  <label className="block text-[10px] font-black text-slate-500 mb-4 uppercase tracking-widest">Seller PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full max-w-[280px] text-center bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-3xl font-black tracking-[0.5em] text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all placeholder:tracking-normal placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-white dark:bg-slate-800 relative z-10">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-4 rounded-2xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 transition-all"
              >
                Back
              </button>
            )}

            {step === 1 ? (
              <button
                onClick={handleNext}
                className="flex-1 py-4 rounded-2xl font-black text-white bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_8px_16px_rgba(16,185,129,0.2)]"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || code.length !== 6}
                className="flex-1 py-4 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_8px_16px_rgba(37,99,235,0.2)]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" /> Confirm & Pay
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
