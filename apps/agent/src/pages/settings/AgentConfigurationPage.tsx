import { useState, useEffect } from 'react';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { supabase } from '@klinflow/supabase';
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
  const { categories, fetchCategories, materialPrices = [], fetchMaterialPrices } = useServiceStore();

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
    if (fetchMaterialPrices) fetchMaterialPrices();
  }, [fetchAgentConfig, fetchCategories, fetchMaterialPrices]);

  // Re-initialize form when agentConfig changes from DB
  useEffect(() => {
    if (!agentConfig) return;

    // Filter out materials that are no longer in our current system
    const validSlugs = categories.map(c => c.slug || c.id);
    const filteredMaterials = (agentConfig.accepted_materials || []).filter(m => validSlugs.includes(m));

    setFormData(prev => ({
      ...prev,
      base_logistics_fee: agentConfig.base_logistics_fee ?? 200,
      cashback_percentage: agentConfig.cashback_percentage ?? 10,
      accepted_materials: filteredMaterials,
      custom_rates: agentConfig.custom_rates || {},
    }));
  }, [agentConfig, categories]);

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

      // 1. Update legacy agent configuration
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
  const isCompanyAdmin = profile?.agentAccountType === 'company_admin';

  return (
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors min-h-screen">
      {/* Fixed Top Nav */}
      {!isCompanyAdmin && (
        <div className="fixed top-0 left-0 right-0 z-[1001] max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
          <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3.5 px-4 flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Service Profile</h1>
              <p className="text-[10px] font-bold text-primary capitalize tracking-widest flex items-center gap-1 mt-0.5 leading-none">
                <Settings2 className="w-3.5 h-3.5" /> Agent Configuration
              </p>
            </div>
          </div>
        </div>
      )}

      <main className={`flex-1 ${isCompanyAdmin ? 'pt-4' : 'pt-[calc(env(safe-area-inset-top,1rem)+3.5rem)]'} px-1.5 pb-24 w-full max-w-lg mx-auto space-y-2`}>
        {isFleetDriver && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl flex items-start gap-3 shadow-sm mx-0.5">
            <ShieldCheck className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-orange-800 dark:text-orange-300 leading-relaxed">
              Pricing is managed by your company admin. You can view rates but cannot change them.
            </p>
          </div>
        )}

        {/* 🏪 HUB MODE SECTION */}
        {canBeHub && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${hubData.active ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border-emerald-100 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize tracking-widest">Hub Mode</h3>
                  <p className="text-[10px] text-slate-400 font-semibold capitalize tracking-widest">Accept Self Drop-offs</p>
                </div>
              </div>
              <button
                onClick={() => setHubData(prev => ({ ...prev, active: !prev.active }))}
                className={`w-12 h-6 rounded-full relative transition-colors ${hubData.active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${hubData.active ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {hubData.active && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hub Physical Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Langata Rd, Opp T-Mall"
                    value={hubData.address}
                    onChange={(e) => setHubData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    By enabling Hub Mode, your location will appear on the marketplace as a verified drop-off point for sellers.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🚚 LOGISTICS FEE */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize tracking-widest">Base Logistics Fee</h3>
              <p className="text-[10px] text-slate-400 font-semibold capitalize tracking-widest">Your standard pickup charge</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Base Fee (KSh)</label>
            <input
              type="text"
              inputMode="decimal"
              disabled={isFleetDriver}
              value={formData.base_logistics_fee}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setFormData({ ...formData, base_logistics_fee: val });
              }}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
            />
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 capitalize tracking-widest mt-2 flex items-center gap-1.5 ml-1">
              <Info className="w-3 h-3" /> Hint: Setting a 0 base fee attracts significantly more clients!
            </p>
          </div>
        </div>

        {/* ⚖️ OPERATIONAL CAPACITY */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize tracking-widest">Operational Capacity</h3>
              <p className="text-[10px] text-slate-400 font-semibold capitalize tracking-widest">Set your weight boundaries</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Min Weight (KG)</label>
              <input
                type="number"
                disabled={isFleetDriver}
                value={formData.min_weight}
                onChange={(e) => setFormData({ ...formData, min_weight: e.target.value })}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Max Load (KG)</label>
              <input
                type="number"
                disabled={isFleetDriver}
                value={formData.max_weight}
                onChange={(e) => setFormData({ ...formData, max_weight: e.target.value })}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[10px] font-semibold text-slate-500 leading-relaxed">
              These limits prevent you from being assigned jobs that are too small to be profitable or too heavy for your vehicle.
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize tracking-widest">Collection Services</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1 tracking-widest">Select materials your business accepts.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => {
              const slug = cat.slug || cat.id;
              const isSelected = formData.accepted_materials.includes(slug);
              return (
                <button
                  key={cat.id}
                  type="button"
                  disabled={isFleetDriver}
                  onClick={() => handleToggleMaterial(slug)}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col items-start gap-2 ${isSelected
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/40'
                    } disabled:opacity-50 relative overflow-hidden`}
                >
                  <div className="text-2xl">
                    {cat.icon || '📦'}
                  </div>
                  <div className={`text-[11px] font-bold capitalize tracking-widest ${isSelected ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                    {cat.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── CUSTOM CATEGORIES ── */}
          {!isFleetDriver && (
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Custom Categories</p>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors rounded-lg text-[10px] font-bold capitalize tracking-widest"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {/* Add Category Form */}
              {showAddCategory && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      placeholder="Icon"
                      value={newCategory.icon}
                      onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })}
                      className="w-12 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-lg outline-none focus:border-primary"
                    />
                    <input
                      placeholder="Category name..."
                      value={newCategory.category}
                      onChange={e => setNewCategory({ ...newCategory, category: e.target.value })}
                      className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleAddCustomCategory} className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold capitalize tracking-widest">Add Category</button>
                    <button type="button" onClick={() => setShowAddCategory(false)} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              )}

              {/* Custom Category List */}
              {formData.custom_services.length === 0 && !showAddCategory && (
                <div className="p-4 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Tag className="w-4 h-4 mx-auto mb-1.5 text-slate-300" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No custom categories</p>
                </div>
              )}
              <div className="space-y-2">
                {formData.custom_services.map((svc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{svc.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{svc.category}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{svc.subcategories?.length || 0} sub-items</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleDeleteCustomCategory(i)} className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50 dark:bg-rose-900/10 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Rates */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize tracking-widest">Market Rates</h3>
              <p className="text-[10px] text-slate-400 font-semibold capitalize tracking-widest">Set your per-KG purchase prices</p>
            </div>
          </div>

          {formData.accepted_materials.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No materials selected yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.accepted_materials.map((slug) => {
                const category = categories.find(c => (c.slug || c.id) === slug);
                if (!category) return null;
                const isExpanded = expandedCategory === slug;
                const subcats = materialPrices.filter(m => m.category === category.id || m.category === category.slug || m.category === category.label);

                return (
                  <div key={slug} className="flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="flex items-center justify-between p-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{category.icon}</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize tracking-widest">{category.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KSh</span>
                        <input
                          type="number"
                          disabled={isFleetDriver}
                          value={formData.custom_rates?.[slug] ?? 0}
                          onChange={(e) => updateRate(slug, e.target.value)}
                          className="w-16 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-primary outline-none focus:border-primary disabled:opacity-50"
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/kg</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedCategory(isExpanded ? null : slug)}
                      className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100/80 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 group"
                    >
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Settings2 className="w-3.5 h-3.5" />
                        {isExpanded ? 'Hide Grades' : 'Adjust Material Grades'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {isExpanded && (
                      <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 space-y-3 animate-slide-down">
                        <div className="flex items-center gap-2 mb-2 bg-primary/5 p-2 rounded-lg border border-primary/10">
                          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                          <p className="text-[10px] font-bold text-primary capitalize tracking-tight leading-snug">Setting a grade price overrides the default {category.label} rate.</p>
                        </div>
                        {subcats.length > 0 ? subcats.map(sub => {
                          const subSlug = `${slug}_${sub.id}`;
                          return (
                            <div key={sub.id} className="flex items-center justify-between pl-3 border-l-2 border-primary/30 py-1">
                              <div>
                                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 capitalize">{sub.material_name}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">KSh</span>
                                <input
                                  type="number"
                                  disabled={isFleetDriver}
                                  value={formData.custom_rates?.[subSlug] ?? ''}
                                  onChange={(e) => updateRate(subSlug, e.target.value)}
                                  placeholder={formData.custom_rates?.[slug] || 0}
                                  className="w-14 p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-[11px] outline-none focus:border-primary disabled:opacity-50"
                                />
                              </div>
                            </div>
                          );
                        }) : (
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center py-2">No sub-grades defined</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CUSTOM CATEGORY RATES ── */}
        {!isFleetDriver && formData.custom_services.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold dark:text-white capitalize tracking-widest">Custom Category Rates</h4>
            </div>
            {formData.custom_services.map((svc, catIndex) => {
              const isExpanded = expandedCustomCat === catIndex;
              const subInput = newSubItem[catIndex] || { name: '', rate_per_kg: '' };
              return (
                <div key={catIndex} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                  <button type="button" onClick={() => setExpandedCustomCat(isExpanded ? null : catIndex)} className="w-full flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{svc.icon}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white capitalize tracking-widest">{svc.category}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{svc.subcategories?.length || 0}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isExpanded && (
                    <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 space-y-3">
                      {(svc.subcategories || []).map((sub, subIndex) => (
                        <div key={subIndex} className="flex items-center justify-between pl-3 border-l-2 border-primary/30 py-1">
                          <div>
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white capitalize">{sub.name}</p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mt-0.5">KSh {sub.rate_per_kg}/KG</p>
                          </div>
                          <button type="button" onClick={() => handleDeleteSubItem(catIndex, subIndex)} className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50 dark:bg-rose-900/10 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <input placeholder="Item name" value={subInput.name} onChange={e => setNewSubItem(prev => ({ ...prev, [catIndex]: { ...subInput, name: e.target.value } }))} className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none focus:border-primary" />
                        <input type="number" placeholder="KSh/KG" value={subInput.rate_per_kg} onChange={e => setNewSubItem(prev => ({ ...prev, [catIndex]: { ...subInput, rate_per_kg: e.target.value } }))} className="w-20 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-primary outline-none focus:border-primary" />
                        <button type="button" onClick={() => handleAddSubItem(catIndex)} className="p-2.5 bg-primary text-white rounded-lg"><Plus className="w-4 h-4" /></button>
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
          <div className="pt-4 pb-2 px-0.5">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Deploying...' : 'Deploy New Rates'}
            </button>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mt-3">
              Changes are pushed instantly
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
