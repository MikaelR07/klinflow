import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Scale, 
  Image as ImageIcon, 
  CheckCircle2,
  ChevronDown,
  Warehouse,
  ChevronRight,
  Sparkles,
  Info,
  DollarSign,
  Camera,
  Smartphone,
  Coins
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { supabase } from '@klinflow/supabase';
import { compressImage } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { toast } from 'sonner';

export default function AgentSellStock() {
  const navigate = useNavigate();
  const { profile, currentCompanyId } = useAuthStore() as any;
  const { agentConfig, fetchAgentConfig } = useAgentStore();
  const { categories, fetchCategories, materialPrices = [], fetchMaterialPrices } = useServiceStore();
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

  // 1. Fetch Agent Inventory, Config & DB Categories
  useEffect(() => {
    fetchAgentConfig();
    fetchCategories();
    if (fetchMaterialPrices) fetchMaterialPrices();

    const fetchWarehouse = async () => {
      if (!profile?.id) return;
      
      let query = supabase.from('assets').select('*').in('status', ['verified', 'offline']);
      
      if (profile.agentAccountType === 'company_admin' && currentCompanyId) {
        const { data: drivers } = await supabase.from('profiles').select('id').eq('company_id', currentCompanyId);
        const driverIds = drivers?.map(d => d.id) || [];
        query = query.in('verifier_id', [profile.id, ...driverIds]);
      } else {
        query = query.eq('verifier_id', profile.id);
      }

      const { data } = await query;
      setWarehouseAssets(data || []);
    };
    fetchWarehouse();
  }, [profile?.id, currentCompanyId]);

  // 2. Map Dynamic Categories from DB, filtered by agent's accepted_materials
  const availableCategories = useMemo(() => {
    const accepted = agentConfig?.accepted_materials || [];
    if (accepted.length === 0 || categories.length === 0) return [];

    return categories
      .filter(cat => {
        const slug = cat.slug || cat.id;
        return accepted.includes(slug);
      })
      .map(cat => {
        const slug = cat.slug || cat.id;
        // Get sub-grades from materialPrices table
        const subcats = materialPrices.filter(
          m => m.category === cat.id || m.category === cat.slug || m.category === cat.label
        );
        let icon = cat.icon || '♻️';
        // Override paper icon to avoid looking like the default package box
        if (slug === 'paper' || slug === 'paper_cardboard') icon = '🗞️';

        return {
          id: slug,
          label: cat.label,
          icon: icon,
          subcategories: subcats.length > 0
            ? subcats.map(s => ({ id: s.id, label: s.material_name }))
            : [{ id: `mixed_${slug}`, label: `${cat.label} (Mixed)` }]
        };
      });
  }, [agentConfig, categories, materialPrices]);

  // 3. Yard Balances for selected material
  const balances = useMemo(() => {
    if (!formData.category) return { verified: 0, offline: 0 };
    const cat = availableCategories.find(c => c.id === formData.category);
    const searchLabel = (cat?.label || '').toLowerCase();
    
    const relevantAssets = warehouseAssets.filter(a => {
      const assetType = (a.material_type || '').toLowerCase();
      return assetType.includes(searchLabel) || searchLabel.includes(assetType);
    });

    return {
      verified: relevantAssets.filter(a => a.status === 'verified').reduce((acc, a) => acc + (parseFloat(a.weight_kg) || 0), 0),
      offline: relevantAssets.filter(a => a.status === 'offline').reduce((acc, a) => acc + (parseFloat(a.weight_kg) || 0), 0)
    };
  }, [formData.category, warehouseAssets, availableCategories]);

  // 4. Subcategory change (no price auto-fill — agent sets their own selling price)
  const handleSubcategoryChange = (subLabel) => {
    setFormData(prev => ({ 
      ...prev, 
      subcategory: subLabel, 
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

  const stepLabels = ['Capture', 'Quantify', 'Confirm'];

  return (
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-lg mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                if (step > 1) { setStep(step - 1); setStepError(''); }
                else navigate(-1);
              }} 
              className="p-2 -ml-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 active:scale-90 transition-all border border-slate-100 dark:border-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Sell Collection</h1>
              <p className="text-[9px] font-bold text-primary capitalize tracking-widest mt-0.5">{stepLabels[step - 1]}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-6 bg-primary shadow-[0_0_8px_rgba(16,185,129,0.3)]' : i < step ? 'w-2 bg-primary/40' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+5rem)] px-2 pb-8 max-w-lg mx-auto w-full">

        {/* ── STEP 1: CAPTURE ── */}
        {step === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            {/* Photo Capture */}
            <div className="relative group">
              <label className={`block w-full aspect-video rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-all shadow-sm ${
                formData.imageUrl 
                  ? 'border-primary bg-primary/5' 
                  : !formData.imageUrl && stepError 
                    ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/10' 
                    : 'border-emerald-500/50 bg-emerald-600 hover:border-emerald-400'
              }`}>
                {formData.imageUrl ? (
                  <OptimizedImage src={formData.imageUrl} className="w-full h-full object-cover" wrapperClassName="w-full h-full" alt="Preview" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-5 bg-emerald-600 p-4">
                    <div className="text-center">
                      <p className="text-sm font-bold text-white uppercase tracking-wider">Capture Stock Photo</p>
                      <p className="text-[10px] font-semibold text-emerald-100 mt-1">Proof of inventory required for listing</p>
                    </div>
                    <div className="flex items-center justify-center gap-4 w-full px-6 max-w-[300px]">
                      <div className="flex-1 flex flex-col items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all py-3 rounded-xl border border-white/20">
                        <Camera className="w-5 h-5 text-white" />
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">Take Photo</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all py-3 rounded-xl border border-white/20">
                        <Smartphone className="w-5 h-5 text-white" />
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">Gallery</span>
                      </div>
                    </div>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>

            {/* Material Identification */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white capitalize tracking-widest">Material Identification</h2>
              </div>
              
              <div className="space-y-3">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your Accepted Categories</label>
                {availableCategories.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Package className="w-5 h-5 mx-auto mb-2 text-slate-300" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No categories configured</p>
                    <p className="text-[9px] text-slate-400 mt-1">Set accepted materials in your Agent Config first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setFormData({ ...formData, category: cat.id, subcategory: '' });
                          setStepError('');
                        }}
                        className={`p-3 rounded-xl border-2 text-center transition-all active:scale-95 ${
                          formData.category === cat.id 
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/30'
                        }`}
                      >
                        <span className="text-xl block mb-1.5">{cat.icon}</span>
                        <span className="text-[9px] font-bold capitalize tracking-wider text-slate-700 dark:text-slate-300 leading-tight block">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {formData.category && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Grade</label>
                  <div className="relative">
                    <select 
                      value={formData.subcategory}
                      onChange={(e) => {
                        handleSubcategoryChange(e.target.value);
                        setStepError('');
                      }}
                      className={`w-full h-12 bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 text-xs font-bold text-slate-900 dark:text-white appearance-none outline-none transition-colors ${
                        !formData.subcategory && stepError 
                          ? 'border-rose-400' 
                          : 'border-slate-200 dark:border-slate-700 focus:border-primary'
                      }`}
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
              <div className="p-3.5 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center shrink-0">
                  <Info className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 leading-tight">
                  {stepError}
                </p>
              </div>
            )}

            <button 
              onClick={nextStep}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs capitalize tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Specify Quantity <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: QUANTIFY ── */}
        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            {/* Yard Balance Hero */}
            <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[60px] -mr-16 -mt-16" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Warehouse className="w-4 h-4 opacity-70" />
                    <p className="text-[12px] font-bold capitalize tracking-widest opacity-80">Total Collection Weight</p>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-3xl font-black">{balances.verified.toFixed(1)}</h3>
                    <span className="text-xs font-bold opacity-70">KG</span>
                  </div>
                  <p className="text-[9px] font-semibold mt-1 opacity-60 capitalize tracking-widest">
                    Available to list
                  </p>
                </div>
                
                <div className="text-right border-l border-white/20 pl-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Offline Stock</p>
                  <p className="text-xl font-bold">{balances.offline.toFixed(1)} <span className="text-[10px] opacity-70">KG</span></p>
                  <p className="text-[8px] font-medium mt-1 opacity-60 max-w-[80px] leading-tight ml-auto">
                    Material collected Offline
                  </p>
                </div>
              </div>
            </div>

            {/* Weight & Price Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-3.5 h-3.5 text-blue-500" />
                  <h2 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Weight</h2>
                </div>
                <div className="flex items-baseline gap-1 border-b border-slate-100 dark:border-slate-800 pb-1">
                  <input 
                    type="number"
                    placeholder="0.0"
                    max={balances.verified}
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full bg-transparent text-xl font-black text-slate-900 dark:text-white focus:outline-none placeholder:opacity-30"
                  />
                  <span className="text-[10px] font-bold text-slate-400">KG</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-3.5 h-3.5 text-emerald-500" />
                  <h2 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Your Price</h2>
                </div>
                <div className="flex items-baseline gap-1 border-b border-slate-100 dark:border-slate-800 pb-1">
                  <input 
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-transparent text-xl font-black text-slate-900 dark:text-white focus:outline-none placeholder:opacity-30"
                  />
                  <span className="text-[10px] font-bold text-slate-400">KSh</span>
                </div>
              </div>
            </div>

            {/* Trade Settings */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white capitalize tracking-widest">Trade Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Minimum Order Quantity (KG)</label>
                  <input 
                    type="number"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Batch Description (Optional)</label>
                  <textarea 
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the quality, baling status, or moisture levels..."
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs font-bold text-slate-900 dark:text-white resize-none outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={!formData.weight || !formData.price || parseFloat(formData.weight) > balances.verified}
              onClick={() => setStep(3)}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs capitalize tracking-widest shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              Preview Listing <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 3: CONFIRM ── */}
        {step === 3 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Merchant Card Preview</p>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl">
              <div className="aspect-video relative">
                <OptimizedImage src={formData.imageUrl} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-bold text-white uppercase tracking-widest border border-white/10">
                  Live Preview
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="bg-primary px-3 py-1.5 rounded-lg text-[10px] font-black text-white capitalize tracking-tight shadow-lg">
                    {formData.subcategory}
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{formData.subcategory}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold capitalize tracking-widest mt-1 flex items-center gap-1.5">
                      <Scale className="w-3 h-3" /> {formData.weight} KG Available
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-emerald-600">KSh {formData.price}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">per KG</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">KSh {(parseFloat(formData.weight || '0') * parseFloat(formData.price || '0')).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Min Order</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formData.minOrder || '0'} KG</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 leading-tight">
                    By posting, you agree to fulfill orders of at least {formData.minOrder || 0}kg from your verified yard stock.
                  </p>
                </div>
              </div>
            </div>

            <button 
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs capitalize tracking-[0.15em] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Deploy Listing to Market
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
