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
  const [contamination, setContamination] = useState('5');
  const [code, setCode] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  useEffect(() => {
    if (!agentConfig) fetchAgentConfig();
    if (categories.length === 0) fetchCategories();
    if (materialPrices.length === 0) fetchMaterialPrices();
  }, []);

  // Build categories from DB, filtered by agent config accepted_materials
  const activeCategories = useMemo(() => {
    const rawMaterials = agentConfig?.accepted_materials;
    if (!rawMaterials || !Array.isArray(rawMaterials)) return categories;

    const acceptedSlugs = rawMaterials.map((item: any) => {
      if (!item) return '';
      if (typeof item === 'string') return item.toLowerCase();
      if (typeof item === 'object') return ((item as any).slug || (item as any).id || (item as any).name || '').toLowerCase();
      return '';
    }).filter(Boolean);

    if (acceptedSlugs.length === 0) return categories;
    return categories.filter(cat => acceptedSlugs.includes((cat as any).slug) || acceptedSlugs.includes(cat.id));
  }, [agentConfig, categories]);

  // Get subcategories for the selected category from materialPrices
  const activeSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = activeCategories.find(c => c.id === selectedCategory);
    if (!cat) return [];
    return materialPrices.filter(m =>
      m.category === cat.id || m.category === (cat as any).slug || m.category === cat.label
    );
  }, [selectedCategory, activeCategories, materialPrices]);

  // Derive agent rate from config custom_rates based on selected category + subcategory
  const agentRate = useMemo(() => {
    if (!selectedCategory || !selectedSubcategory) return 0;
    const cat = activeCategories.find(c => c.id === selectedCategory);
    if (!cat) return 0;
    const customRates = (agentConfig?.custom_rates || {}) as Record<string, any>;
    // Try slug-based lookup: catSlug_subSlug, then just catSlug
    const sub = activeSubcategories.find(s => s.material_name === selectedSubcategory);
    if (sub) {
      const slug = `${(cat as any).slug || cat.id}_${sub.id}`;
      return parseFloat(customRates[slug]) || parseFloat(customRates[(cat as any).slug || cat.id]) || 0;
    }
    return parseFloat(customRates[(cat as any).slug || cat.id]) || 0;
  }, [selectedCategory, selectedSubcategory, activeCategories, activeSubcategories, agentConfig]);

  useEffect(() => {
    if (isOpen && proposal) {
      setWeight(proposal.offered_weight?.toString() || '');
      setSelectedCategory('');
      setSelectedSubcategory('');
    } else if (!isOpen) {
      setStep(1);
      setCode('');
      setPhotos([]);
      setSelectedCategory('');
      setSelectedSubcategory('');
    }
  }, [isOpen, proposal]);

  const isCategoryMismatch = useMemo(() => {
    if (!selectedCategory || !rfq?.category) return false;
    const cat = activeCategories.find(c => c.id === selectedCategory);
    if (!cat) return false;
    return selectedCategory !== rfq.category && 
           (cat as any).slug !== rfq.category && 
           cat.label !== rfq.category;
  }, [selectedCategory, rfq, activeCategories]);

  const isMaterialMismatch = useMemo(() => {
    if (!selectedSubcategory || !rfq?.material_grade) return false;
    const sub = activeSubcategories.find(m => m.material_name === selectedSubcategory);
    if (!sub) return false;
    return selectedSubcategory !== rfq.material_grade && 
           sub.id !== rfq.material_grade && 
           (sub as any).slug !== rfq.material_grade;
  }, [selectedSubcategory, rfq, activeSubcategories]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1 && (!selectedCategory || !selectedSubcategory || !weight)) {
      toast.error('Please complete all material details.');
      return;
    }
    setStep(prev => Math.min(prev + 1, 4));
  };
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

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
        parseFloat(weight),
        grade,
        parseInt(contamination),
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
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-1.5 pb-24 sm:p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-[1rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Verify Material</h2>
              <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-1">
                Step {step} of 4
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
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="bg-emerald-600 dark:bg-emerald-500/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Scale className="w-5 h-5 text-white dark:text-emerald-400" />
                    <h3 className="font-bold text-white dark:text-emerald-300">Measure & Weigh</h3>
                  </div>
                  <p className="text-sm text-white dark:text-emerald-400/80 leading-relaxed">
                    Verify the material type and weight. The original proposed weight was <strong className="text-white dark:text-emerald-300">{proposal?.offered_weight || 0}kg</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedSubcategory('');
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    >
                      <option value="">Select</option>
                      {activeCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                      ))}
                    </select>
                    {isCategoryMismatch && (
                      <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Category doesn't match RFQ
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Material</label>
                    <select
                      value={selectedSubcategory}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      disabled={!selectedCategory}
                    >
                      <option value="">Select</option>
                      {activeSubcategories.map(m => (
                        <option key={m.id} value={m.material_name}>{m.material_name}</option>
                      ))}
                    </select>
                    {isMaterialMismatch && (
                      <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Material doesn't match RFQ
                      </p>
                    )}
                  </div>
                </div>

                {agentRate > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Your Config Rate</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">KSh {agentRate} / kg</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Verified Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Quality Grade</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    >
                      <option>Premium</option>
                      <option>Standard</option>
                      <option>Low Grade</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Contamination %</label>
                    <input
                      type="number"
                      value={contamination}
                      onChange={(e) => setContamination(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-blue-900 dark:text-blue-300">Photographic Evidence</h3>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-400/80 leading-relaxed">
                    Take 1-3 clear photos of the material before loading. This protects you in case of disputes.
                  </p>
                </div>

                <div className="flex gap-3">
                  <label className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer active:scale-95">
                    <Camera className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-center">Take<br />Picture</span>
                    <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotoUpload} />
                  </label>
                  <label className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer active:scale-95">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-center">From<br />Gallery</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>

                {photos.length > 0 && (
                  <div className="flex gap-3 mt-4">
                    {photos.map((p, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={URL.createObjectURL(p)} alt="preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-md"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="bg-indigo-600 dark:bg-indigo-500/10 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Banknote className="w-5 h-5 text-white dark:text-indigo-400" />
                    <h3 className="font-bold text-white dark:text-indigo-300">Payout Summary</h3>
                  </div>
                  <p className="text-sm text-white dark:text-indigo-400/80 leading-relaxed">
                    Review the final calculation with the seller before asking for their PIN. The payout is adjusted based on the verified weight.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Material</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{selectedSubcategory || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your Config Rate</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">KSh {agentRate} / kg</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agreed Rate (Seller)</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">KSh {proposal?.offered_price || 0} / kg</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified Weight</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{weight || 0} kg</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-emerald-500" />
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Seller Payout</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        KSh {((parseFloat(weight) || 0) * (parseFloat(proposal?.offered_price) || 0)).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1">
                        (KSh {proposal?.offered_price || 0} × {weight || 0} kg)
                      </span>
                    </div>
                  </div>
                  {agentRate > 0 && agentRate !== parseFloat(proposal?.offered_price) && (
                    <div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Your Margin</span>
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-black ${(agentRate - parseFloat(proposal?.offered_price || 0)) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          KSh {(((agentRate - parseFloat(proposal?.offered_price || 0)) * (parseFloat(weight) || 0))).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                          (KSh {agentRate} − KSh {proposal?.offered_price || 0}) × {weight || 0} kg
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4 border border-amber-100 dark:border-amber-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-bold text-amber-900 dark:text-amber-300">Seller Authorization</h3>
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-400/80 leading-relaxed">
                    Hand the device to the seller. Ask them to enter their 6-digit code to authorize the handover and receive <strong>KSh {((parseFloat(weight) || 0) * (parseFloat(proposal?.offered_price) || 0)).toLocaleString()}</strong>.
                  </p>
                </div>

                <div className="flex justify-center py-4">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full max-w-[240px] text-center bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-2xl font-black tracking-[0.5em] text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:tracking-normal placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-4 rounded-xl font-bold text-white dark:text-slate-300 bg-blue-700 dark:bg-slate-800 active:scale-95 transition-all"
              >
                Back
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex-1 py-4 rounded-2xl font-bold text-white bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || code.length !== 6}
                className="flex-1 py-4 rounded-xl font-bold text-white bg-green-600 dark:bg-white dark:text-slate-900 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Confirm & Release Funds
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
