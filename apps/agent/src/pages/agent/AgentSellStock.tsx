import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Scale, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle2,
  ChevronDown,
  Warehouse,
  ChevronRight,
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { WASTE_CATEGORIES } from '@klinflow/core/data/wasteDefinitions';
import { supabase } from '@klinflow/supabase';
import { compressImage } from '@klinflow/core/utils/imageUtils';
import { toast } from 'sonner';

export default function AgentSellStock() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { agentConfig, fetchAgentConfig } = useAgentStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouseAssets, setWarehouseAssets] = useState([]);
  
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    price: '',
    weight: '',
    minOrder: '',
    description: '',
    image: null,
    imageUrl: ''
  });

  // 1. Fetch Agent Inventory & Config
  useEffect(() => {
    fetchAgentConfig();
    const fetchWarehouse = async () => {
      if (!profile?.id) return;
      
      let query = supabase.from('assets').select('*').eq('status', 'verified');
      
      if (profile.agentAccountType === 'company_admin') {
        const { data: drivers } = await supabase.from('profiles').select('id').eq('company_id', profile.id);
        const driverIds = drivers?.map(d => d.id) || [];
        query = query.in('verifier_id', [profile.id, ...driverIds]);
      } else {
        query = query.eq('verifier_id', profile.id);
      }

      const { data } = await query;
      setWarehouseAssets(data || []);
    };
    fetchWarehouse();
  }, [profile?.id]);

  // 2. Map Dynamic Categories (Accepted + Custom)
  const availableCategories = useMemo(() => {
    const accepted = agentConfig?.accepted_materials || [];
    const base = WASTE_CATEGORIES.filter(c => accepted.includes(c.id));
    const custom = profile?.serviceProfile?.custom_services || [];
    
    return [
      ...base.map(c => ({ id: c.id, label: c.label, icon: c.icon, type: 'base', subcategories: c.subcategories })),
      ...custom.map((c, i) => ({ id: `custom_${i}`, label: c.category, icon: c.icon || '♻️', type: 'custom', subcategories: c.subcategories || [] }))
    ];
  }, [agentConfig, profile]);

  // 3. Yard Balance for selected material (Robust fuzzy match)
  const yardBalance = useMemo(() => {
    if (!formData.category) return 0;
    const cat = availableCategories.find(c => c.id === formData.category);
    const searchLabel = (cat?.label || '').toLowerCase();
    
    return warehouseAssets
      .filter(a => {
        const assetType = (a.material_type || '').toLowerCase();
        // Check if DB type matches label (e.g. "Plastic" vs "Plastics") or vice versa
        return assetType.includes(searchLabel) || searchLabel.includes(assetType);
      })
      .reduce((acc, a) => acc + (parseFloat(a.weight_kg) || 0), 0);
  }, [formData.category, warehouseAssets, availableCategories]);

  // 4. Auto-fill logic when subcategory changes
  const handleSubcategoryChange = (subLabel) => {
    let price = '';
    const cat = availableCategories.find(c => c.id === formData.category);
    
    if (cat?.type === 'base') {
      const sub = cat.subcategories.find(s => s.label === subLabel);
      const slug = `${cat.id}_${sub?.id}`;
      price = agentConfig?.custom_rates?.[slug] || agentConfig?.custom_rates?.[cat.id] || '';
    } else if (cat?.type === 'custom') {
      const sub = cat.subcategories.find(s => s.name === subLabel);
      price = sub?.rate_per_kg || '';
    }

    setFormData(prev => ({ 
      ...prev, 
      subcategory: subLabel, 
      price: price.toString(),
      minOrder: (profile?.serviceProfile?.min_weight || 10).toString()
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file, imageUrl: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let finalImageUrl = '';
      if (formData.image) {
        const compressed = await compressImage(formData.image, { maxWidth: 1024, quality: 0.7 });
        const fileExt = compressed.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `listings/${profile.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('marketplace').upload(filePath, compressed);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('marketplace').getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      }

      const { error } = await supabase.from('marketplace_listings').insert({
        seller_id: profile.id,
        material: formData.subcategory,
        category: formData.category,
        price_per_kg: parseFloat(formData.price),
        quantity: parseFloat(formData.weight),
        min_order: parseFloat(formData.minOrder || 0),
        description: formData.description,
        photo: finalImageUrl,
        status: 'active',
        source_type: 'agent'
      });

      if (error) throw error;
      toast.success("Listing Live! 🚀");
      navigate('/warehouse');
    } catch (err) {
      toast.error("Post failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [stepError, setStepError] = useState('');

  const validateStep1 = () => {
    if (!formData.imageUrl) {
      setStepError('Visual proof of stock is required to list on the marketplace.');
      return false;
    }
    if (!formData.subcategory) {
      setStepError('Please select a material grade to continue.');
      return false;
    }
    setStepError('');
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2) setStep(3);
  };

  return (
    <div className="space-y-6 pb-32">
      {/* ── HEADER ── */}
      <div className="flex flex-col items-center text-center px-4 relative">
        <button onClick={() => {
          if (step > 1) {
            setStep(step - 1);
            setStepError('');
          } else {
            navigate(-1);
          }
        }} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight italic">Sell Stock Terminal</h1>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-1.5 h-1.5 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-200'}`} />
          <div className={`w-1.5 h-1.5 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-200'}`} />
          <div className={`w-1.5 h-1.5 rounded-full ${step >= 3 ? 'bg-indigo-500' : 'bg-slate-200'}`} />
        </div>
      </div>

      {/* ── STEP 1: CAPTURE ── */}
      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 px-4">
          <div className="relative group">
            <label className={`block w-full aspect-video rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed ${!formData.imageUrl && stepError ? 'border-rose-500 bg-rose-500/5' : 'border-slate-200 dark:border-slate-700'} overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-all shadow-sm`}>
              {formData.imageUrl ? (
                <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${!formData.imageUrl && stepError ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'}`}>
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Capture Stock</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Proof of inventory required</p>
                  </div>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Material Identification</h2>
            </div>
            
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Accepted Categories</label>
              <div className="grid grid-cols-2 gap-2">
                {availableCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setFormData({ ...formData, category: cat.id, subcategory: '' });
                      setStepError('');
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.category === cat.id 
                        ? 'border-indigo-500 bg-indigo-500/5' 
                        : 'border-slate-50 dark:border-slate-900 bg-slate-50 dark:bg-slate-900'
                    }`}
                  >
                    <span className="text-xl mb-2 block">{cat.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {formData.category && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Grade</label>
                <div className="relative">
                  <select 
                    value={formData.subcategory}
                    onChange={(e) => {
                      handleSubcategoryChange(e.target.value);
                      setStepError('');
                    }}
                    className={`w-full h-14 bg-slate-50 dark:bg-slate-900 border ${!formData.subcategory && stepError ? 'border-rose-500' : 'border-slate-100 dark:border-slate-800'} rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white appearance-none`}
                  >
                    <option value="">Select Specific Grade</option>
                    {availableCategories.find(c => c.id === formData.category)?.subcategories.map(s => (
                      <option key={s.id || s.name} value={s.label || s.name}>{s.label || s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {stepError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-white" />
              </div>
              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-tight">
                {stepError}
              </p>
            </div>
          )}

          <button 
            onClick={nextStep}
            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Specify Quantity <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 2: QUANTIFY ── */}
      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 px-4">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-600/20">
            <div className="flex items-center gap-3 mb-4">
              <Warehouse className="w-5 h-5 opacity-60" />
              <p className="text-xs font-bold uppercase tracking-widest">Verified Yard Balance</p>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black">{yardBalance.toFixed(1)}</h3>
              <span className="text-lg font-bold opacity-60">KG Available</span>
            </div>
            <p className="text-[10px] font-medium mt-2 opacity-80 uppercase tracking-widest italic">
              * Only verified assets from your warehouse can be listed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-2 mb-4">
                 <Scale className="w-4 h-4 text-blue-500" />
                 <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weight</h2>
               </div>
               <input 
                 type="number"
                 placeholder="0.0"
                 max={yardBalance}
                 value={formData.weight}
                 onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                 className="w-full bg-transparent text-3xl font-bold text-slate-900 dark:text-white focus:outline-none"
               />
               <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">KG to List</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-2 mb-4">
                 <DollarSign className="w-4 h-4 text-emerald-500" />
                 <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Price</h2>
               </div>
               <input 
                 type="number"
                 placeholder="0.00"
                 value={formData.price}
                 onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                 className="w-full bg-transparent text-3xl font-bold text-slate-900 dark:text-white focus:outline-none"
               />
               <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">KSh / KG</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trade Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Minimum Order Quantity (KG)</label>
                <input 
                  type="number"
                  value={formData.minOrder}
                  onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                  className="w-full h-14 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Batch Description (Optional)</label>
                <textarea 
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the quality, baling status, or moisture levels..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-sm font-bold text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>
          </div>

          <button 
            disabled={!formData.weight || !formData.price || parseFloat(formData.weight) > yardBalance}
            onClick={() => setStep(3)}
            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
          >
            Preview Listing <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 3: CONFIRM ── */}
      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 px-4">
          <div className="px-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Merchant Card Preview</h2>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl">
              <div className="aspect-video relative">
                <img src={formData.imageUrl} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                  Live Preview
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-black text-white uppercase tracking-tighter">
                    {formData.subcategory} Lot
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{formData.subcategory}</h3>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" /> {formData.weight} KG Available
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-emerald-600">KSh {formData.price}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">per KG</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-50 dark:border-slate-800/50 mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">KSh {(parseFloat(formData.weight) * parseFloat(formData.price)).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Min Order</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{formData.minOrder} KG</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-xl">
                  <Info className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 leading-tight">
                    By posting, you agree to fulfill orders of at least {formData.minOrder}kg from your verified yard stock.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                DEPLOY LISTING TO MARKET
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
