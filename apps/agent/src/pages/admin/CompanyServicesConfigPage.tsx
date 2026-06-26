import { useState, useEffect } from 'react';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { supabase } from '@klinflow/supabase';
import {
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

export default function CompanyServicesConfigPage() {
  const { profile, fetchProfile } = useAuthStore();
  const { agentConfig, fetchAgentConfig, updateAgentConfig } = useAgentStore();
  const { categories, fetchCategories, materialPrices = [], fetchMaterialPrices } = useServiceStore();

  const [formData, setFormData] = useState({
    base_logistics_fee: 200,
    cashback_percentage: 10,
    accepted_materials: [],
    custom_rates: {},
    min_weight: 5,
    max_weight: 100,
    custom_services: []
  });

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ category: '', icon: '📦' });
  const [expandedCustomCat, setExpandedCustomCat] = useState(null);
  const [newSubItem, setNewSubItem] = useState({});

  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  const [hubData, setHubData] = useState({
    active: profile?.isHubActive || false,
    address: profile?.hubAddress || '',
    coords: profile?.hubLocation || null
  });

  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';
  // Company owner is accessing this page, so we don't need 'canBeHub' condition, it's always true.

  useEffect(() => {
    fetchAgentConfig();
    fetchCategories();
    if (fetchMaterialPrices) fetchMaterialPrices();
  }, [fetchAgentConfig, fetchCategories, fetchMaterialPrices]);

  useEffect(() => {
    if (!agentConfig) return;
    const validSlugs = categories.map(c => c.slug || c.id);
    const filteredMaterials = (agentConfig.accepted_materials || []).filter(m => validSlugs.includes(m));

    setFormData(prev => ({
      ...prev,
      base_logistics_fee: agentConfig.base_logistics_fee ?? 200,
      cashback_percentage: agentConfig.cashback_percentage ?? 10,
      accepted_materials: agentConfig.accepted_materials || [],
      custom_rates: agentConfig.custom_rates || {},
    }));
  }, [agentConfig, categories]);

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
      custom_rates: { ...prev.custom_rates, [slug]: cleanValue }
    }));
  };

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
      const parsedRates = Object.fromEntries(
        Object.entries(formData.custom_rates).map(([k, v]) => [k, parseFloat(v) || 0])
      );

      const { success: legacySuccess, error: configError } = await updateAgentConfig({
        base_logistics_fee: Math.max(0, formData.base_logistics_fee === '' ? 0 : parseFloat(formData.base_logistics_fee) || 0),
        cashback_percentage: formData.cashback_percentage,
        accepted_materials: formData.accepted_materials,
        custom_rates: parsedRates
      });

      if (!legacySuccess) throw new Error(configError || 'Failed to update agent configuration');

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

      await Promise.all([fetchProfile(), fetchAgentConfig()]);
      toast.success('Configuration Saved!', { description: 'Your service profile is live.' });

    } catch (err) {
      console.error('[CompanyConfig] Save error:', err);
      toast.error('Save failed', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold dark:text-white tracking-tighter">Services & Pricing</h1>
          <p className="font-medium text-xs text-slate-400 uppercase tracking-[0.2em]">Manage Fleet Capabilities & Rates</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="font-medium flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-none shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Deploying...' : 'Save Configuration'}
          </button>
        </div>
      </header>

      {isFleetDriver && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-[1rem] flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="font-medium text-xs text-orange-700 dark:text-orange-300">
            Pricing is managed by your company admin. You can view rates but cannot change them.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Operations & Materials */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* HUB MODE */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[1rem] border border-[#e0e3eb] dark:border-slate-800 shadow-none space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hubData.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold dark:text-white tracking-widest">Company Hub Mode</h3>
                  <p className="font-medium text-xs text-slate-400 tracking-tight">Accept Drop-offs at HQ</p>
                </div>
              </div>
              <button
                onClick={() => setHubData(prev => ({ ...prev, active: !prev.active }))}
                className={`w-12 h-6 rounded-full relative transition-colors ${hubData.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hubData.active ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            {hubData.active && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1.5">
                  <label className="font-medium text-xs text-slate-400 capitalize tracking-widest ml-1">HQ Physical Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Langata Rd, Opp T-Mall"
                    value={hubData.address}
                    onChange={(e) => setHubData(prev => ({ ...prev, address: e.target.value }))}
                    className="font-medium w-full p-4 bg-white dark:bg-slate-800/50 border border-[#e0e3eb] dark:border-slate-700 rounded-[1rem] text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-[1rem]">
                  <p className="font-medium text-xs text-emerald-700 dark:text-emerald-400 leading-tight">
                    By enabling Hub Mode, your location will appear on the marketplace as a verified drop-off point.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* LOGISTICS FEE & CAPACITY GRID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[1rem] border border-[#e0e3eb] dark:border-slate-800 shadow-none space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="font-medium w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold dark:text-white tracking-widest">Base Fee</h3>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-[10px] text-slate-400 uppercase tracking-widest">Amount (KSh)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={isFleetDriver}
                  value={formData.base_logistics_fee}
                  onChange={(e) => setFormData({ ...formData, base_logistics_fee: e.target.value.replace(/[^0-9.]/g, '') })}
                  className="font-medium w-full p-4 bg-white dark:bg-slate-800/50 border border-[#e0e3eb] dark:border-slate-700 rounded-[1rem] text-sm outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-[1rem] border border-[#e0e3eb] dark:border-slate-800 shadow-none space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold dark:text-white tracking-widest">Capacity</h3>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="space-y-1.5 flex-1">
                  <label className="font-medium text-[10px] text-slate-400 uppercase tracking-widest">Min (KG)</label>
                  <input
                    type="number"
                    disabled={isFleetDriver}
                    value={formData.min_weight}
                    onChange={(e) => setFormData({ ...formData, min_weight: e.target.value })}
                    className="font-medium w-full p-4 bg-white dark:bg-slate-800/50 border border-[#e0e3eb] dark:border-slate-700 rounded-[1rem] text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="font-medium text-[10px] text-slate-400 uppercase tracking-widest">Max (KG)</label>
                  <input
                    type="number"
                    disabled={isFleetDriver}
                    value={formData.max_weight}
                    onChange={(e) => setFormData({ ...formData, max_weight: e.target.value })}
                    className="font-medium w-full p-4 bg-white dark:bg-slate-800/50 border border-[#e0e3eb] dark:border-slate-700 rounded-[1rem] text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GLOBAL CATEGORIES */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[1rem] border border-[#e0e3eb] dark:border-slate-800 shadow-none space-y-4">
            <div>
              <h3 className="text-sm font-bold dark:text-white capitalize tracking-widest">Collection Services</h3>
              <p className="font-medium text-xs text-slate-400 mt-1">Select materials your fleet handles.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => {
                const slug = cat.slug || cat.id;
                const isSelected = formData.accepted_materials.includes(slug);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={isFleetDriver}
                    onClick={() => handleToggleMaterial(slug)}
                    className={`p-4 rounded-[1rem] border-2 text-left transition-all ${isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-[#e0e3eb] dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-primary/40'
                      } disabled:opacity-50 relative overflow-hidden`}
                  >
                    <div className="font-medium text-2xl mb-2">{cat.icon || '📦'}</div>
                    <div className={`text-xs capitalize tracking-widest ${isSelected ? 'text-primary' : 'text-slate-500'}`}>
                      {cat.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Pricing & Custom Materials */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* PRICING RATES */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[1rem] border border-[#e0e3eb] dark:border-slate-800 shadow-none space-y-6">
            <div className="flex items-center gap-3 border-b border-[#e0e3eb] dark:border-slate-800 pb-4">
              <div className="font-medium w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold dark:text-white tracking-widest">Fleet Market Rates</h3>
                <p className="font-medium text-xs text-slate-400 tracking-tight">Set your purchasing prices (KSh/KG)</p>
              </div>
            </div>

            {formData.accepted_materials.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-800/50 rounded-[1rem] border-2 border-dashed border-[#e0e3eb] dark:border-slate-700">
                <p className="font-medium text-xs text-slate-400 tracking-widest">Select materials to set rates.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.accepted_materials.map((slug) => {
                  const category = categories.find(c => (c.slug || c.id) === slug);
                  if (!category) return null;
                  const isExpanded = expandedCategory === slug;
                  const subcats = materialPrices.filter(m => m.category === category.id || m.category === category.slug || m.category === category.label);

                  return (
                    <div key={slug} className="flex flex-col bg-white dark:bg-slate-800/50 rounded-[1rem] border border-[#e0e3eb] dark:border-slate-700 overflow-hidden h-fit">
                      <div className="flex items-center justify-between p-4">
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-200 tracking-widest">{category.label}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            disabled={isFleetDriver}
                            value={formData.custom_rates?.[slug] ?? 0}
                            onChange={(e) => updateRate(slug, e.target.value)}
                            className="w-16 p-2 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-center text-primary outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedCategory(isExpanded ? null : slug)}
                        className="flex items-center justify-between px-4 py-2 bg-slate-100/50 dark:bg-slate-800/80 border-t border-[#e0e3eb] dark:border-slate-700 group"
                      >
                        <span className="font-medium text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Settings2 className="w-3 h-3" />
                          {isExpanded ? 'Hide Sub-grades' : 'Manage Sub-grades'}
                        </span>
                        {isExpanded ? <ChevronUp className="font-medium w-4 h-4 text-slate-400" /> : <ChevronDown className="font-medium w-4 h-4 text-slate-400" />}
                      </button>

                      {isExpanded && (
                        <div className="p-4 bg-white dark:bg-slate-800/90 border-t border-[#e0e3eb] dark:border-slate-700 space-y-3">
                          {subcats.length > 0 ? subcats.map(sub => {
                            const subSlug = `${slug}_${sub.id}`;
                            return (
                              <div key={sub.id} className="flex items-center justify-between pl-3 border-l-2 border-primary/30">
                                <p className="font-medium text-xs text-slate-700 dark:text-slate-300 pr-2">{sub.material_name}</p>
                                <input
                                  type="number"
                                  disabled={isFleetDriver}
                                  value={formData.custom_rates?.[subSlug] ?? ''}
                                  onChange={(e) => updateRate(subSlug, e.target.value)}
                                  placeholder={formData.custom_rates?.[slug] || 0}
                                  className="font-medium w-16 p-1.5 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-center text-xs outline-none focus:border-primary"
                                />
                              </div>
                            );
                          }) : (
                            <p className="font-medium text-[10px] text-slate-400 uppercase tracking-widest">No sub-grades defined</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CUSTOM CATEGORIES */}
          {!isFleetDriver && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[1rem] border border-[#e0e3eb] dark:border-slate-800 shadow-none space-y-6">
              <div className="flex items-center justify-between border-b border-[#e0e3eb] dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-semibold dark:text-white tracking-widest">Custom Categories</h3>
                  <p className="font-medium text-xs text-slate-400 tracking-tight">Add niche materials to your catalog</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="font-medium flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Custom
                </button>
              </div>

              {showAddCategory && (
                <div className="p-4 bg-white dark:bg-slate-800/50 border border-[#e0e3eb] dark:border-slate-700 rounded-[1rem] space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      placeholder="Icon"
                      value={newCategory.icon}
                      onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })}
                      className="font-medium w-16 p-3 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-center text-xl outline-none"
                    />
                    <input
                      placeholder="Category name (e.g. Copper)"
                      value={newCategory.category}
                      onChange={e => setNewCategory({ ...newCategory, category: e.target.value })}
                      className="font-medium flex-1 p-3 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleAddCustomCategory} className="font-medium flex-1 py-2.5 bg-primary text-white rounded-xl text-xs tracking-widest">Confirm</button>
                    <button type="button" onClick={() => setShowAddCategory(false)} className="font-medium px-4 py-2.5 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300"><X className="font-medium w-4 h-4" /></button>
                  </div>
                </div>
              )}

              {formData.custom_services.length === 0 && !showAddCategory && (
                <div className="p-8 text-center bg-white dark:bg-slate-800/50 rounded-[1rem] border-2 border-dashed border-[#e0e3eb] dark:border-slate-700">
                  <Tag className="font-medium w-6 h-6 mx-auto mb-3 text-slate-400" />
                  <p className="font-medium text-xs text-slate-500 tracking-widest uppercase">No custom categories yet</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.custom_services.map((svc, catIndex) => {
                  const isExpanded = expandedCustomCat === catIndex;
                  const subInput = newSubItem[catIndex] || { name: '', rate_per_kg: '' };
                  return (
                    <div key={catIndex} className="rounded-[1rem] border border-[#e0e3eb] dark:border-slate-700 overflow-hidden h-fit bg-white dark:bg-slate-800/50">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-xl">{svc.icon}</span>
                          <div>
                            <p className="font-medium text-sm dark:text-white tracking-widest">{svc.category}</p>
                            <p className="font-medium text-[10px] text-slate-400 uppercase">{svc.subcategories?.length || 0} items</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setExpandedCustomCat(isExpanded ? null : catIndex)} className="font-medium p-2 text-slate-500 hover:text-primary">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button type="button" onClick={() => handleDeleteCustomCategory(catIndex)} className="font-medium p-2 text-rose-400 hover:text-rose-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 bg-white dark:bg-slate-800/90 border-t border-[#e0e3eb] dark:border-slate-700 space-y-3">
                          {(svc.subcategories || []).map((sub, subIndex) => (
                            <div key={subIndex} className="flex items-center justify-between pl-3 border-l-2 border-primary/30">
                              <div>
                                <p className="font-medium text-xs dark:text-white">{sub.name}</p>
                                <p className="font-medium text-[10px] text-emerald-500 uppercase tracking-widest">KSh {sub.rate_per_kg}/KG</p>
                              </div>
                              <button type="button" onClick={() => handleDeleteSubItem(catIndex, subIndex)} className="font-medium p-1.5 text-rose-400 hover:text-rose-600">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 pt-3 border-t border-[#e0e3eb] dark:border-slate-700">
                            <input placeholder="Name" value={subInput.name} onChange={e => setNewSubItem(prev => ({ ...prev, [catIndex]: { ...subInput, name: e.target.value } }))} className="font-medium flex-1 p-2 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-600 rounded-lg text-xs outline-none focus:border-primary" />
                            <input type="number" placeholder="KSh" value={subInput.rate_per_kg} onChange={e => setNewSubItem(prev => ({ ...prev, [catIndex]: { ...subInput, rate_per_kg: e.target.value } }))} className="font-medium w-16 p-2 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-600 rounded-lg text-xs text-primary outline-none focus:border-primary text-center" />
                            <button type="button" onClick={() => handleAddSubItem(catIndex)} className="font-medium p-2 bg-primary text-white rounded-lg"><Plus className="font-medium w-4 h-4" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
