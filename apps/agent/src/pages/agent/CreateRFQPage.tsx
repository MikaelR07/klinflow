import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Scale,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  Info,
  DollarSign,
  MapPin,
  Calendar,
  Clock,
  Trash2,
  Plus
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useNotificationStore, NOTIFICATION_TYPES } from '@klinflow/core/stores/notificationStore';
import { WASTE_CATEGORIES } from '@klinflow/core/data/wasteDefinitions';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@klinflow/supabase';
import { compressImage } from '@klinflow/core/utils/imageUtils';

export default function CreateRFQPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { agentConfig, fetchAgentConfig } = useAgentStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState('');

  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [formData, setFormData] = useState({
    category: '',
    materialName: '',
    weight: '',
    pickupArea: profile?.location?.estate || profile?.estate || '',
    price: '',
    deliveryMethod: 'flexible',
    deadlineDate: '',
    deadlineTime: '',
    notes: ''
  });

  useEffect(() => {
    fetchAgentConfig();
  }, [fetchAgentConfig]);

  const activeCategories = useMemo(() => {
    const rawMaterials = agentConfig?.accepted_materials;
    if (!rawMaterials || !Array.isArray(rawMaterials)) {
      return WASTE_CATEGORIES;
    }

    const acceptedSlugs = rawMaterials.map(item => {
      if (!item) return '';
      if (typeof item === 'string') return item.toLowerCase();
      if (typeof item === 'object') {
        const obj = item as any;
        return (obj.id || obj.name || '').toLowerCase();
      }
      return '';
    }).filter(Boolean);

    if (acceptedSlugs.length === 0) {
      return WASTE_CATEGORIES;
    }

    return WASTE_CATEGORIES.filter(cat => acceptedSlugs.includes(cat.id));
  }, [agentConfig]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    if (images.length + files.length > 3) {
      toast.error('You can upload at most 3 sample images.');
      return;
    }

    const newImages = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
    setStepError('');
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const validateStep1 = () => {
    if (!formData.category) {
      setStepError('Please select a material category.');
      return false;
    }
    if (!formData.materialName) {
      setStepError('Please enter or select a material name.');
      return false;
    }
    setStepError('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      setStepError('Please enter a valid requested weight.');
      return false;
    }
    if (!formData.pickupArea.trim()) {
      setStepError('Please enter a pickup area.');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setStepError('Please enter your target price.');
      return false;
    }
    if (!formData.deadlineDate || !formData.deadlineTime) {
      setStepError('Please set both deadline date and time.');
      return false;
    }
    setStepError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (const img of images) {
        const compressed = await compressImage(img.file, { maxWidth: 1024, quality: 0.7 });
        const fileExt = compressed.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${profile?.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('rfq-images').upload(filePath, compressed);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('rfq-images').getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }

      const cat = WASTE_CATEGORIES.find(c => c.id === formData.category);
      const sub = cat?.subcategories.find(s => s.label === formData.materialName);
      const materialId = sub ? sub.id : formData.materialName;

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

      const deadlineDateObj = new Date(`${formData.deadlineDate}T${parseTime(formData.deadlineTime)}`);

      const { error: insertError } = await supabase.from('rfqs').insert({
        buyer_id: profile?.id,
        buyer_type: 'agent',
        category: formData.category,
        material_grade: materialId,
        requested_weight: parseFloat(formData.weight),
        weight_unit: 'kg',
        target_price: parseFloat(formData.price),
        pickup_area: formData.pickupArea,
        delivery_method: formData.deliveryMethod,
        images: uploadedUrls,
        notes: formData.notes,
        deadline: isNaN(deadlineDateObj.getTime()) ? null : deadlineDateObj.toISOString(),
        status: 'open'
      });

      if (insertError) throw insertError;

      // Broadcast Notification to all sellers (client role)
      await useNotificationStore.getState().addNotification(
        'New Market Request 🔔',
        `An agent is requesting ${formData.weight}kg of ${formData.materialName} in ${formData.pickupArea}.`,
        NOTIFICATION_TYPES.INFO,
        'seller',
        null
      );

      toast.success("RFQ Broadcasted Successfully! 🚀", {
        description: "Sellers in your area will be notified of your request."
      });
      navigate('/');
    } catch (err) {
      toast.error("Failed to broadcast RFQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const subcategories = useMemo(() => {
    const cat = WASTE_CATEGORIES.find(c => c.id === formData.category);
    return cat ? cat.subcategories.map(sub => sub.label) : [];
  }, [formData.category]);

  const stepTitles = [
    "Material Details",
    "Logistics & Target Price",
    "Review & Broadcast"
  ];

  return (
    <div className="space-y-4 pb-5 max-w-md mx-auto">

      {/* ── FIXED TOPNAV FOR BROADCAST ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/80 transition-colors">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (step > 1) {
                setStep(step - 1);
                setStepError('');
              } else {
                navigate(-1);
              }
            }}
            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95 transition-all text-slate-500 dark:text-slate-400 hover:text-amber-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center flex-1">
            <h1 className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight uppercase">Broadcast RFQ</h1>
            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-0.5">
              {stepTitles[step - 1]}
            </p>
          </div>

          <div className="w-10 h-10 flex items-center justify-center text-[10px] font-black text-slate-400 tracking-wider">
            {step}/3
          </div>
        </div>

        {/* Inline stepper — sits flush at the bottom of the nav, adds no extra height */}
        <div className="flex h-[3px] mx-4 mb-0 gap-1.5 rounded-full overflow-hidden">
          <div className={`flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`flex-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`flex-1 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
        </div>
      </div>

      {/* Spacer to clear the fixed topnav */}
      <div className="h-8" />

      <AnimatePresence mode="wait">
        {/* ── STEP 1: MATERIAL & IMAGES ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 px-1.5"
          >
            {/* Category selection */}
            <div className="bg-slate-50/80 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-150 dark:border-slate-700/50 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-750 pb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Select Category</h2>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {activeCategories.map((cat) => {
                  const isSelected = formData.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, category: cat.id, materialName: '' });
                        setStepError('');
                      }}
                      className={`px-2 py-3.5 rounded-xl border text-center transition-all relative overflow-hidden ${isSelected
                        ? 'border-amber-500 bg-amber-500/5 shadow-sm shadow-amber-500/5'
                        : 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                    >
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 leading-tight">{cat.label}</span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center">
                          <CheckCircle2 className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {formData.category && (
                <div className="space-y-3 pt-3 border-t border-slate-50 dark:border-slate-750 animate-in fade-in duration-300">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Select Material Type</label>

                  <div className="relative">
                    <select
                      value={subcategories.includes(formData.materialName) ? formData.materialName : ''}
                      onChange={(e) => {
                        setFormData({ ...formData, materialName: e.target.value });
                        setStepError('');
                      }}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-750 rounded-xl px-4 pr-10 text-xs font-bold text-slate-800 dark:text-white appearance-none focus:border-amber-500 outline-none transition-colors cursor-pointer"
                    >
                      <option value="">— Select a type —</option>
                      {subcategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
                  </div>

                  <div className="flex items-center gap-3 py-0.5">
                    <div className="h-px bg-slate-100 dark:bg-slate-750 flex-1" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Or Custom Type</span>
                    <div className="h-px bg-slate-100 dark:bg-slate-750 flex-1" />
                  </div>

                  <input
                    type="text"
                    placeholder="Enter custom material type..."
                    value={subcategories.includes(formData.materialName) ? '' : formData.materialName}
                    onChange={(e) => {
                      setFormData({ ...formData, materialName: e.target.value });
                      setStepError('');
                    }}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-750 rounded-xl px-4 text-xs font-bold text-slate-800 dark:text-white focus:border-amber-500 outline-none transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Image Upload Area */}
            <div className="bg-slate-50/80 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-150 dark:border-slate-700/50 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-750 pb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Sample Images <span className="text-[10px] text-slate-400 font-medium font-mono">(Max 3)</span></h2>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {images.map((img, idx) => (
                  <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 group">
                    <img src={img.url} className="w-full h-full object-cover" alt="sample" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-rose-500/90 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <label className="aspect-square rounded-xl border border-dashed border-slate-250 dark:border-slate-700 hover:border-amber-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-all flex flex-col items-center justify-center cursor-pointer bg-slate-50/20 dark:bg-slate-900 group">
                    <Plus className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Add Photo</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {stepError && (
              <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
                <Info className="w-4 h-4 text-rose-500 shrink-0" />
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                  {stepError}
                </p>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleNext}
                className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm tracking-widest shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
              >
                Specify Logistics & Price <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: LOGISTICS & PRICING ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 px-1.5"
          >
            {/* Weight and Price Row */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-50/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-150 dark:border-slate-700/50 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 text-slate-400">
                  <Scale className="w-3.5 h-3.5 text-amber-500" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest">Weight</h2>
                </div>
                <div className="relative flex items-baseline">
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.weight}
                    onChange={(e) => {
                      setFormData({ ...formData, weight: e.target.value });
                      setStepError('');
                    }}
                    className="w-full bg-transparent text-xl font-black text-slate-950 dark:text-white focus:outline-none border-b border-transparent focus:border-amber-500/25 pb-0.5"
                  />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">kg</span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Requested Volume</p>
              </div>

              <div className="bg-slate-50/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-150 dark:border-slate-700/50 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 text-slate-400">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest">Buying Price</h2>
                </div>
                <div className="relative flex items-baseline">
                  <span className="text-[10px] font-bold text-slate-400 mr-0.5">KSh</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value });
                      setStepError('');
                    }}
                    className="w-full bg-transparent text-xl font-black text-slate-950 dark:text-white focus:outline-none border-b border-transparent focus:border-amber-500/25 pb-0.5"
                  />
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider ml-1">/kg</span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Max payout / kg</p>
              </div>
            </div>

            {/* Logistics details */}
            <div className="bg-slate-50/80 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-150 dark:border-slate-700/50 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-750 pb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Pickup Logistics</h2>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Default Location</label>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultLoc = profile?.location?.estate || profile?.estate || 'My Profile Location';
                      setFormData({ ...formData, pickupArea: defaultLoc });
                      setStepError('');
                    }}
                    className="w-full flex items-center gap-2 h-12 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors text-left"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Use Profile Location ({profile?.location?.estate || profile?.estate || 'N/A'})</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px bg-slate-100 dark:bg-slate-750 flex-1" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Or Custom Area</span>
                  <div className="h-px bg-slate-100 dark:bg-slate-750 flex-1" />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Custom Pickup Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Kasarani, Nairobi"
                    value={formData.pickupArea}
                    onChange={(e) => {
                      setFormData({ ...formData, pickupArea: e.target.value });
                      setStepError('');
                    }}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-750 rounded-xl px-4 text-xs font-bold text-slate-800 dark:text-white focus:border-amber-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Delivery Method Selector */}
              <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-750">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Delivery Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryMethod: 'agent_pickup' })}
                    className={`h-10 text-xs font-bold rounded-xl border transition-all ${
                      formData.deliveryMethod === 'agent_pickup'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                    }`}
                  >
                    We Pick Up
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryMethod: 'self_drop' })}
                    className={`h-10 text-xs font-bold rounded-xl border transition-all ${
                      formData.deliveryMethod === 'self_drop'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                    }`}
                  >
                    You Drop Off
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryMethod: 'flexible' })}
                    className={`h-10 text-xs font-bold rounded-xl border transition-all ${
                      formData.deliveryMethod === 'flexible'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                    }`}
                  >
                    Flexible
                  </button>
                </div>
              </div>
            </div>

            {/* RFQ Deadline */}
            <div className="bg-slate-50/80 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-150 dark:border-slate-700/50 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-750 pb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">RFQ Deadline</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Deadline Date</label>
                  <input
                    type="date"
                    value={formData.deadlineDate}
                    onChange={(e) => {
                      setFormData({ ...formData, deadlineDate: e.target.value });
                      setStepError('');
                    }}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-750 rounded-xl px-4 text-xs font-bold text-slate-800 dark:text-white focus:border-amber-500 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Deadline Time</label>
                  <input
                    type="time"
                    value={formData.deadlineTime}
                    onChange={(e) => {
                      setFormData({ ...formData, deadlineTime: e.target.value });
                      setStepError('');
                    }}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-750 rounded-xl px-4 text-xs font-bold text-slate-800 dark:text-white focus:border-amber-500 outline-none transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Additional specifications */}
            <div className="bg-slate-50/80 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-150 dark:border-slate-700/50 shadow-sm space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Additional Specifications / Notes</label>
              <textarea
                rows={2}
                placeholder="Detail package requirements, sorting preferences, or payment terms..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-750 rounded-xl p-3.5 text-xs font-bold text-slate-800 dark:text-white resize-none focus:border-amber-500 outline-none transition-colors"
              />
            </div>

            {stepError && (
              <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
                <Info className="w-4 h-4 text-rose-500 shrink-0" />
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                  {stepError}
                </p>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleNext}
                className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm tracking-widest shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
              >
                Review Sourcing Request <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: PREVIEW & BROADCAST ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 px-1.5"
          >
            <div className="space-y-4">


              <div className="space-y-5">
                {images.length > 0 ? (
                  <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2" style={{ scrollbarWidth: 'none' }}>
                    {images.map((img, idx) => (
                      <div key={idx} className="aspect-[4/3] w-full shrink-0 relative bg-slate-950 rounded-2xl overflow-hidden shadow-sm snap-start">
                        <img src={img.url} className="w-full h-full object-cover opacity-90" alt={`Preview ${idx + 1}`} />
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[9px] font-black text-white capitalize tracking-widest border border-white/10">
                          Sample Image {idx + 1} of {images.length}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl flex flex-col items-center justify-center text-slate-400 border border-slate-150 dark:border-slate-750 shadow-sm">
                    <ImageIcon className="w-8 h-8 mb-1.5 opacity-30" />
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-50">No sample photo provided</span>
                  </div>
                )}

                <div className="bg-slate-50/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-150 dark:border-slate-700/50 shadow-sm space-y-4">
                  {/* Title & Price Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/10 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                        RFQ Sourcing
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white mt-2 leading-none capitalize">{formData.materialName}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold capitalize tracking-wider mt-1.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {formData.pickupArea}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-600">KSh {formData.price}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Buying price / kg</p>
                    </div>
                  </div>

                  {/* Volume Grid Subcard */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-700/50 p-4 rounded-xl grid grid-cols-2 gap-3 text-xs shadow-sm">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Volume Wanted</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{formData.weight} KG</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estimated Budget</p>
                      <p className="text-sm font-black text-emerald-600 leading-none">
                        KSh {(parseFloat(formData.weight) * parseFloat(formData.price)).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Deadline Subcard */}
                  <div className="flex justify-between items-center text-xs bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-700/50 p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Deadline Date & Time</p>
                        <p className="text-[11px] font-black text-slate-800 dark:text-white mt-1 leading-none">{formData.deadlineDate} @ {formData.deadlineTime}</p>
                      </div>
                    </div>
                  </div>

                  {formData.notes && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-700/50 p-4 rounded-xl shadow-sm space-y-1.5">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Specifications & Notes</p>
                      <p className="text-xs text-slate-600 dark:text-slate-350 italic font-medium">
                        "{formData.notes}"
                      </p>
                    </div>
                  )}

                  {/* Bottom Notice Subcard */}
                  <div className="flex items-start gap-2.5 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl mt-2">
                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 leading-tight">
                      This request will be instantly visible to sellers matching the logistics criteria. Sellers can accept target pricing directly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm tracking-widest shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2.5"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Broadcast RFQ Request
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
