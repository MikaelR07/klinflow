import { useState, useEffect } from 'react';
import { useAgentStore, useAuthStore, useServiceStore, WASTE_CATEGORIES, getCategoryBySlug, supabase } from '@klinflow/core';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Settings2,
  Info,
  Scale,
  Truck,
  Building2,
  Plus,
  Trash2,
  X,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

export default function AgentConfigurationPage() {
  const navigate = useNavigate();
  const { profile, fetchProfile } = useAuthStore();
  const { agentConfig, fetchAgentConfig, updateAgentConfig } = useAgentStore();
  const { categories, fetchCategories } = useServiceStore();
  
  const [formData, setFormData] = useState({
    base_logistics_fee: 200,
    cashback_percentage: 10,
    accepted_materials: [],
    custom_rates: {},
    min_weight: 5,
    max_weight: 100,
    custom_services: [] // [{ category: 'Plastics', icon: '♻️', subcategories: [{ name: 'PET Bottles', rate_per_kg: 12 }] }]
  });

  // Custom category builder state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ category: '', icon: '📦' });
  const [expandedCustomCat, setExpandedCustomCat] = useState(null);
  const [newSubItem, setNewSubItem] = useState({});  // { [catIndex]: { name: '', rate_per_kg: '' } }
  
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Hub Mode State
  const [hubData, setHubData] = useState({
    active: profile?.isHubActive || false,
    address: profile?.hubAddress || '',
    coords: profile?.hubLocation || null
  });

  const isIndividualAgent = profile?.role === 'agent' && profile?.agentAccountType === 'independent';
  const isCompanyOwner = profile?.role === 'agent' && profile?.agentAccountType === 'company_admin';
  const canBeHub = isIndividualAgent || isCompanyOwner;

  useEffect(() => {
    fetchAgentConfig();
    fetchCategories();
  }, [fetchAgentConfig, fetchCategories]);

  // Re-initialize form when agentConfig changes from DB
  useEffect(() => {
    if (!agentConfig) return;
    
    // Filter out legacy materials that are no longer in our current system
    const validSlugs = WASTE_CATEGORIES.map(c => c.id);
    const filteredMaterials = (agentConfig.accepted_materials || []).filter(m => validSlugs.includes(m));

    setFormData(prev => ({
      ...prev,
      base_logistics_fee: agentConfig.base_logistics_fee ?? 200,
      cashback_percentage: agentConfig.cashback_percentage ?? 10,
      accepted_materials: filteredMaterials,
      custom_rates: agentConfig.custom_rates || {},
    }));
  }, [agentConfig]);

  // Re-initialize service_profile fields when profile.service_profile updates
  useEffect(() => {
    if (!profile) return;
    
    if (profile.service_profile) {
      setFormData(prev => ({
        ...prev,
        min_weight: profile.service_profile.min_weight || 5,
        max_weight: profile.service_profile.max_weight || 100,
        custom_services: profile.service_profile.custom_services || []
      }));
    }

    setHubData({
      active: profile.isHubActive || false,
      address: profile.hubAddress || '',
      coords: profile.hubLocation || null
    });
  }, [profile]);

  const handleToggleMaterial = (slug) => {
    setFormData(prev => {
      const isSelected = prev.accepted_materials.includes(slug);
      return {
        ...prev,
        accepted_materials: isSelected 
          ? prev.accepted_materials.filter(m => m !== slug)
          : [...prev.accepted_materials, slug]
      };
    });
  };

  const updateRate = (slug, value) => {
    const cleanValue = value.replace(/^0+(?=\d)/, '');
    setFormData(prev => ({
      ...prev,
      custom_rates: {
        ...prev.custom_rates,
        [slug]: cleanValue
      }
    }));
  };

  // ── Custom Category Handlers ──
  const handleAddCustomCategory = () => {
    if (!newCategory.category.trim()) return toast.error('Category name is required');
    setFormData(prev => ({
      ...prev,
      custom_services: [...prev.custom_services, { ...newCategory, subcategories: [] }]
    }));
    setNewCategory({ category: '', icon: '📦' });
    setShowAddCategory(false);
  };

  const handleDeleteCustomCategory = (index) => {
    setFormData(prev => ({
      ...prev,
      custom_services: prev.custom_services.filter((_, i) => i !== index)
    }));
  };

  const handleAddSubItem = (catIndex) => {
    const item = newSubItem[catIndex];
    if (!item?.name?.trim()) return toast.error('Sub-item name required');
    setFormData(prev => {
      const updated = [...prev.custom_services];
      updated[catIndex] = {
        ...updated[catIndex],
        subcategories: [...(updated[catIndex].subcategories || []), { name: item.name, rate_per_kg: parseFloat(item.rate_per_kg) || 0 }]
      };
      return { ...prev, custom_services: updated };
    });
    setNewSubItem(prev => ({ ...prev, [catIndex]: { name: '', rate_per_kg: '' } }));
  };

  const handleDeleteSubItem = (catIndex, subIndex) => {
    setFormData(prev => {
      const updated = [...prev.custom_services];
      updated[catIndex] = {
        ...updated[catIndex],
        subcategories: updated[catIndex].subcategories.filter((_, i) => i !== subIndex)
      };
      return { ...prev, custom_services: updated };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Ensure custom_rates are parsed to floats before saving
      const parsedRates = Object.fromEntries(
        Object.entries(formData.custom_rates).map(([k, v]) => [k, parseFloat(v) || 0])
      );

      // 1. Update agent_configurations (logistics fee, cashback, rates)
      const { success: legacySuccess, error: configError } = await updateAgentConfig({
        base_logistics_fee: Math.max(0, formData.base_logistics_fee === '' ? 0 : parseFloat(formData.base_logistics_fee) || 0),
        cashback_percentage: formData.cashback_percentage,
        accepted_materials: formData.accepted_materials,
        custom_rates: parsedRates
      });

      if (!legacySuccess) throw new Error(configError || 'Failed to update agent configuration');

      // 2. Update profile (Hub Status + weight limits + custom services)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_hub_active: hubData.active,
          hub_address: hubData.address,
          hub_location: hubData.coords,
          service_profile: {
            min_weight: parseFloat(formData.min_weight),
            max_weight: parseFloat(formData.max_weight),
            categories: formData.accepted_materials.map(m => ({ name: m, enabled: true })),
            custom_services: formData.custom_services
          }
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // 3. SUCCESS: Re-fetch BOTH profile and agentConfig
      await Promise.all([fetchProfile(), fetchAgentConfig()]);
      
      toast.success('Configuration Saved!', { description: 'Your service profile is live.' });
      setTimeout(() => navigate(-1), 100);
      
    } catch (err) {
      console.error('[AgentConfig] Save error:', err);
      toast.error('Save failed', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';

  return (
    <div className="animate-slide-up pb-24 px-1">
      {/* Sticky Top Nav */}
      <div className="sticky top-0 z-50 -mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1.5rem)+0.75rem)] pb-4 px-4 max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-white uppercase">Service Profile</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5 leading-none">
                <Settings2 className="w-3 h-3 text-primary" /> Agent Configuration
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 px-4">

      {/* Content */}
      <div className="space-y-6">
        
        {isFleetDriver && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">
              Pricing is managed by your company admin. You can view rates but cannot change them.
            </p>
          </div>
        )}

        {/* 🏪 HUB MODE SECTION */}
        {canBeHub && (
          <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hubData.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                     <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="text-sm font-semibold dark:text-white uppercase tracking-widest">Hub Mode</h3>
                     <p className="text-xs text-slate-400 font-semibold uppercase tracking-tight">Accept Self Drop-offs</p>
                  </div>
                </div>
                <button 
                  onClick={() => setHubData(prev => ({ ...prev, active: !prev.active }))}
                  className={`w-12 h-6 rounded-full relative transition-colors ${hubData.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hubData.active ? 'right-1' : 'left-1'}`} />
                </button>
             </div>

             {hubData.active && (
               <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Hub Physical Address</label>
                    <input 
                      type="text"
                      placeholder="e.g. Langata Rd, Opp T-Mall"
                      value={hubData.address}
                      onChange={(e) => setHubData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-semibold text-sm outline-none focus:border-emerald-500"
                    />
                 </div>
                 <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 leading-tight">
                      By enabling Hub Mode, your location will appear on the marketplace as a verified drop-off point for sellers.
                    </p>
                 </div>
               </div>
             )}
          </div>
        )}

        {/* 🚚 LOGISTICS FEE */}
        <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm space-y-4">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Truck className="w-5 h-5" />
             </div>
             <div>
                <h3 className="text-sm font-semibold dark:text-white uppercase tracking-widest">Base Logistics Fee</h3>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-tight">Your standard pickup charge</p>
             </div>
           </div>

           <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Base Fee (KSh)</label>
              <input 
                type="text"
                inputMode="decimal"
                disabled={isFleetDriver}
                value={formData.base_logistics_fee}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setFormData({...formData, base_logistics_fee: val});
                }}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-semibold text-sm outline-none focus:border-amber-500"
              />
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                💡 Hint: Setting a 0 base fee attracts significantly more clients!
              </p>
           </div>
        </div>

        {/* ⚖️ OPERATIONAL CAPACITY */}
        <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm space-y-4">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Scale className="w-5 h-5" />
             </div>
             <div>
                <h3 className="text-sm font-semibold dark:text-white uppercase tracking-widest">Operational Capacity</h3>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-tight">Set your weight boundaries</p>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Min Weight (KG)</label>
                <input 
                  type="number"
                  disabled={isFleetDriver}
                  value={formData.min_weight}
                  onChange={(e) => setFormData({...formData, min_weight: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-semibold text-sm outline-none focus:border-indigo-500"
                />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Max Load (KG)</label>
                <input 
                  type="number"
                  disabled={isFleetDriver}
                  value={formData.max_weight}
                  onChange={(e) => setFormData({...formData, max_weight: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-semibold text-sm outline-none focus:border-indigo-500"
                />
             </div>
           </div>
           <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
             <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
             <p className="text-xs text-slate-500 leading-relaxed italic">
               These limits prevent you from being assigned jobs that are too small to be profitable or too heavy for your vehicle.
             </p>
           </div>
        </div>

        {/* Categories Grid */}
        <div className="space-y-4">
           <div>
              <h3 className="text-sm font-semibold dark:text-white uppercase tracking-widest">Collection Services</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Select materials your business accepts.</p>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
             {WASTE_CATEGORIES.map((cat) => {
               const isSelected = formData.accepted_materials.includes(cat.id);
               return (
                 <button
                   key={cat.id}
                   type="button"
                   disabled={isFleetDriver}
                   onClick={() => handleToggleMaterial(cat.id)}
                   className={`p-4 rounded-2xl border-2 text-left transition-all ${
                     isSelected 
                       ? 'border-primary bg-primary/10' 
                       : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-primary/40'
                   } disabled:opacity-50 relative overflow-hidden`}
                 >
                   <div className="text-2xl mb-2">
                      {cat.icon || '📦'}
                    </div>
                   <div className={`text-xs font-semibold uppercase tracking-widest ${isSelected ? 'text-primary' : 'text-slate-500'}`}>
                     {cat.label}
                   </div>
                 </button>
               );
             })}
           </div>

           {/* ── CUSTOM CATEGORIES ── */}
           {!isFleetDriver && (
             <div className="space-y-3 pt-2">
               <div className="flex items-center justify-between">
                 <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Your Custom Categories</p>
                 <button
                   type="button"
                   onClick={() => setShowAddCategory(true)}
                   className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold uppercase tracking-widest"
                 >
                   <Plus className="w-3 h-3" /> Add Category
                 </button>
               </div>

               {/* Add Category Form */}
               {showAddCategory && (
                 <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
                   <div className="flex items-center gap-2">
                     <input
                       placeholder="Icon (emoji)"
                       value={newCategory.icon}
                       onChange={e => setNewCategory({...newCategory, icon: e.target.value})}
                       className="w-16 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xl outline-none"
                     />
                     <input
                       placeholder="Category name (e.g. Copper Wire)"
                       value={newCategory.category}
                       onChange={e => setNewCategory({...newCategory, category: e.target.value})}
                       className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-primary"
                     />
                   </div>
                   <div className="flex gap-2">
                     <button type="button" onClick={handleAddCustomCategory} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold uppercase tracking-widest">Add</button>
                     <button type="button" onClick={() => setShowAddCategory(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold uppercase tracking-widest text-slate-500"><X className="w-4 h-4" /></button>
                   </div>
                 </div>
               )}

               {/* Custom Category List */}
               {formData.custom_services.length === 0 && !showAddCategory && (
                 <div className="p-4 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                   <Tag className="w-5 h-5 mx-auto mb-2 text-slate-300" />
                   <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">No custom categories yet</p>
                 </div>
               )}
               <div className="space-y-2">
                 {formData.custom_services.map((svc, i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-2xl">
                     <div className="flex items-center gap-2">
                       <span className="text-lg">{svc.icon}</span>
                       <div>
                         <p className="text-xs font-semibold dark:text-white">{svc.category}</p>
                         <p className="text-xs text-slate-400">{svc.subcategories?.length || 0} sub-items</p>
                       </div>
                     </div>
                     <button type="button" onClick={() => handleDeleteCustomCategory(i)} className="p-1.5 text-rose-400 hover:text-rose-600">
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>

        {/* Pricing Rates */}
        <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm space-y-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                 <Truck className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-sm font-semibold dark:text-white uppercase tracking-widest">Market Rates</h3>
                 <p className="text-xs text-slate-400 font-semibold uppercase tracking-tight">Set your per-KG purchase prices</p>
              </div>
           </div>

           {formData.accepted_materials.length === 0 ? (
             <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
               <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">No materials selected yet</p>
             </div>
           ) : (
             <div className="space-y-4">
               {formData.accepted_materials.map((slug) => {
                 const category = getCategoryBySlug(slug);
                 if (!category) return null;
                 const isExpanded = expandedCategory === slug;
                 
                 return (
                   <div key={slug} className="space-y-2">
                     <div className="flex flex-col bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-widest">{category.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase">KSh</span>
                            <input 
                              type="number"
                              disabled={isFleetDriver}
                              value={formData.custom_rates?.[slug] ?? 0}
                              onChange={(e) => updateRate(slug, e.target.value)}
                              className="w-16 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-semibold text-primary outline-none"
                            />
                            <span className="text-xs font-semibold text-slate-400 uppercase">/kg</span>
                          </div>
                        </div>

                        <button 
                          type="button"
                          onClick={() => setExpandedCategory(isExpanded ? null : slug)}
                          className="flex items-center justify-between px-4 py-2 bg-slate-100/50 dark:bg-white/5 border-t border-slate-200 dark:border-white/5 group"
                        >
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Settings2 className="w-3 h-3" /> 
                            {isExpanded ? 'Hide Grades' : 'Adjust Material Grades'}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>

                        {isExpanded && (
                          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 space-y-4 animate-slide-down">
                            <div className="flex items-center gap-2 mb-2">
                               <Info className="w-3 h-3 text-primary" />
                               <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Setting a grade price overrides the default {category.label} rate.</p>
                            </div>
                            {category.subcategories.map(sub => {
                              const subSlug = `${slug}_${sub.id}`;
                              return (
                                <div key={sub.id} className="flex items-center justify-between pl-4 border-l-2 border-primary/20">
                                   <div>
                                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{sub.label}</p>
                                      <p className="text-xs font-semibold text-slate-400 uppercase">{sub.description}</p>
                                   </div>
                                   <div className="flex items-center gap-2">
                                      <input 
                                        type="number"
                                        disabled={isFleetDriver}
                                        value={formData.custom_rates?.[subSlug] ?? ''}
                                        onChange={(e) => updateRate(subSlug, e.target.value)}
                                        placeholder={formData.custom_rates?.[slug] || 0}
                                        className="w-14 p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-semibold text-xs outline-none focus:border-primary"
                                      />
                                   </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
        </div>

        
            {/* ── CUSTOM CATEGORY RATES ── */}
            {!isFleetDriver && formData.custom_services.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-semibold dark:text-white uppercase tracking-widest">Custom Category Rates</h4>
                </div>
                <p className="text-xs text-slate-400">Add sub-items and per-KG rates for your custom categories.</p>
                {formData.custom_services.map((svc, catIndex) => {
                  const isExpanded = expandedCustomCat === catIndex;
                  const subInput = newSubItem[catIndex] || { name: '', rate_per_kg: '' };
                  return (
                    <div key={catIndex} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <button type="button" onClick={() => setExpandedCustomCat(isExpanded ? null : catIndex)} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{svc.icon}</span>
                          <span className="text-xs font-semibold dark:text-white uppercase tracking-widest">{svc.category}</span>
                          <span className="text-xs text-slate-400">({svc.subcategories?.length || 0} items)</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {isExpanded && (
                        <div className="p-4 bg-white dark:bg-slate-900 space-y-3">
                          {(svc.subcategories || []).map((sub, subIndex) => (
                            <div key={subIndex} className="flex items-center justify-between pl-3 border-l-2 border-primary/30">
                              <div>
                                <p className="text-xs font-semibold dark:text-white">{sub.name}</p>
                                <p className="text-xs text-emerald-500 font-semibold">KSh {sub.rate_per_kg}/KG</p>
                              </div>
                              <button type="button" onClick={() => handleDeleteSubItem(catIndex, subIndex)} className="p-1.5 text-rose-400 hover:text-rose-600">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                            <input placeholder="Item name" value={subInput.name} onChange={e => setNewSubItem(prev => ({ ...prev, [catIndex]: { ...subInput, name: e.target.value } }))} className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-primary" />
                            <input type="number" placeholder="KSh/KG" value={subInput.rate_per_kg} onChange={e => setNewSubItem(prev => ({ ...prev, [catIndex]: { ...subInput, rate_per_kg: e.target.value } }))} className="w-20 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-primary outline-none focus:border-primary" />
                            <button type="button" onClick={() => handleAddSubItem(catIndex)} className="p-2.5 bg-primary text-white rounded-xl"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

        {/* Save Button */}
        {!isFleetDriver && (
          <div className="pt-6">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2.5rem] font-semibold text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'Deploy New Rates' : 'Deploy New Rates'}
            </button>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mt-4 px-8">
              Changes are pushed instantly to all residents in your service area.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
