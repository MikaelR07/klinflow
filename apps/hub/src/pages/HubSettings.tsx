import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Save,
  Loader2,
  Scale,
  CheckCircle2,
  Package,
  Truck,
  ChevronDown,
  ChevronUp,
  Settings2,
  Info,
  Lock,
  ShieldAlert,
  Clock,
  Phone,
  Mail,
  Zap,
  Layers,
  Users,
  Shield,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { supabase } from '@klinflow/supabase';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { toast } from 'sonner';

interface SettingsFormData {
  hubName: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  capacityKg: string;
  operatingHours: string;
  minWeight: number;
  maxWeight: number;
  baseLogisticsFee: number;
  supportedCategories: string[];
  customRates: Record<string, string>;
}

export default function HubSettings() {
  const { profile, membershipRole, hubPermissions, currentCompanyId } = useAuthStore();
  const { categories, fetchCategories, materialPrices, fetchMaterialPrices } = useServiceStore();
  const { agentConfig, fetchAgentConfig, updateAgentConfig } = useAgentStore();
  const { isDarkMode } = useThemeStore();
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Permission check: only owner or users with DB-level 'setting:update' can edit
  const isOwner = membershipRole === 'owner';
  const canEdit = isOwner || hubPermissions.includes('setting:update' as any);

  const [formData, setFormData] = useState<SettingsFormData>({
    hubName: profile?.companyName || '',
    address: (profile as any)?.hubConfig?.address || '',
    contactEmail: (profile as any)?.hubConfig?.contactEmail || profile?.email || '',
    contactPhone: (profile as any)?.hubConfig?.contactPhone || profile?.phone || '',
    capacityKg: (profile as any)?.hubConfig?.capacityKg || '5000',
    operatingHours: (profile as any)?.hubConfig?.operatingHours || 'Mon - Sat: 08:00 - 18:00',
    minWeight: (profile as any)?.serviceProfile?.minWeight || 5,
    maxWeight: (profile as any)?.serviceProfile?.maxWeight || 500,
    baseLogisticsFee: 200,
    supportedCategories: [],
    customRates: {},
  });

  // Fetch categories, material prices, and agent config
  useEffect(() => {
    fetchCategories();
    if (fetchMaterialPrices) fetchMaterialPrices();
    fetchAgentConfig();
  }, [fetchCategories, fetchMaterialPrices, fetchAgentConfig]);

  // Sync form when profile loads
  // Sync form when profile and agentConfig load
  useEffect(() => {
    if (profile) {
      const uiProfile = profile as any;
      setFormData(prev => ({
        ...prev,
        hubName: profile.companyName || '',
        address: uiProfile.hubConfig?.address || '',
        contactEmail: uiProfile.hubConfig?.contactEmail || profile.email || '',
        contactPhone: uiProfile.hubConfig?.contactPhone || profile.phone || '',
        capacityKg: uiProfile.hubConfig?.capacityKg || '5000',
        operatingHours: uiProfile.hubConfig?.operatingHours || 'Mon - Sat: 08:00 - 18:00',
        minWeight: uiProfile.serviceProfile?.minWeight || 5,
        maxWeight: uiProfile.serviceProfile?.maxWeight || 500,
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (agentConfig) {
      setFormData(prev => ({
        ...prev,
        baseLogisticsFee: agentConfig.base_logistics_fee ?? 200,
        supportedCategories: agentConfig.accepted_materials || [],
        customRates: agentConfig.custom_rates as Record<string, string> || {},
      }));
    }
  }, [agentConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!canEdit) return;
    const { name, value, type } = e.target;
    const isChecked = (e.target as HTMLInputElement).checked;
    setFormData({ ...formData, [name]: type === 'checkbox' ? isChecked : value });
  };

  const handleToggleCategory = (catSlug: string) => {
    if (!canEdit) return;
    setFormData(prev => {
      const isSelected = prev.supportedCategories.includes(catSlug);
      return {
        ...prev,
        supportedCategories: isSelected
          ? prev.supportedCategories.filter(s => s !== catSlug)
          : [...prev.supportedCategories, catSlug]
      };
    });
  };

  const updateRate = (slug: string, value: string) => {
    if (!canEdit) return;
    const cleanValue = value.replace(/^0+(?=\d)/, '');
    setFormData(prev => ({
      ...prev,
      customRates: { ...prev.customRates, [slug]: cleanValue }
    }));
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setIsSaving(true);
    try {
      const parsedRates = Object.fromEntries(
        Object.entries(formData.customRates).map(([k, v]) => [k, parseFloat(v) || 0])
      );

      // 1. Update Agent Config (Shared with Mobile App logic)
      const { success, error: configError } = await updateAgentConfig({
        base_logistics_fee: Math.max(0, formData.baseLogisticsFee || 0),
        accepted_materials: formData.supportedCategories,
        custom_rates: parsedRates,
      });

      if (!success) throw new Error(configError || 'Failed to update configuration');

      // 2. Update Profile Information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_name: formData.hubName,
          hub_config: {
            address: formData.address,
            contactEmail: formData.contactEmail,
            contactPhone: formData.contactPhone,
            capacityKg: formData.capacityKg,
            operatingHours: formData.operatingHours,
          },
          service_profile: {
            minWeight: parseFloat(String(formData.minWeight)),
            maxWeight: parseFloat(String(formData.maxWeight)),
            // Re-sync categories for legacy profile usage
            categories: formData.supportedCategories.map(m => ({ name: m, enabled: true })),
          }
        } as any)
        .eq('id', profile!.id);

      if (profileError) throw profileError;
      toast.success('Settings saved successfully!', { description: 'Your hub configuration has been updated.' });
    } catch (err: any) {
      console.error('[HubSettings] Save error:', err);
      toast.error('Failed to save settings', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Card wrapper component for consistency
  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-2xl border p-6 transition-all ${
      isDarkMode
        ? 'bg-slate-900 border-white/5'
        : 'bg-white border-[#e0e3eb] shadow-sm'
    } ${className}`}>
      {children}
    </div>
  );

  const SectionIcon = ({ icon: Icon, color, bg }: { icon: any; color: string; bg: string }) => (
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
  );

  const selectedSlugs = formData.supportedCategories;

  return (
    <div className="w-full min-h-screen">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* ─── HEADER ─── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>
              Hub Configuration
            </h1>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage your facility parameters, collection services, and market rates.
            </p>
          </div>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2.5 px-7 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-semibold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Deploy Changes'}
            </button>
          )}
        </div>

        {/* ─── PERMISSION BANNER ─── */}
        {!canEdit && (
          <div className={`flex items-center gap-4 p-5 rounded-2xl border ${
            isDarkMode
              ? 'bg-amber-500/5 border-amber-500/20'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isDarkMode ? 'bg-amber-500/10' : 'bg-amber-100'
            }`}>
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-800'}`}>
                Read-Only Mode
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-amber-400/70' : 'text-amber-700'}`}>
                You can view these settings but cannot make changes. Ask the company owner to grant you editing access from this page.
              </p>
            </div>
          </div>
        )}
        {/* ─── TOP ROW: FACILITY INFO + OPERATIONAL BOUNDS ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Facility Details */}
          <Card>
            <div className="flex items-center gap-3.5 mb-6">
              <SectionIcon icon={Building2} color="text-indigo-500" bg={isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'} />
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>
                  Facility Details
                </h3>
                <p className={`text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Your hub's public information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Hub Name
                </label>
                <input
                  type="text"
                  name="hubName"
                  value={formData.hubName}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className={`w-full p-3.5 rounded-xl border text-sm font-semibold outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode
                      ? 'bg-slate-800 border-white/5 text-white focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 text-[#131722] focus:border-indigo-500'
                  }`}
                />
              </div>
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Mail className="w-3 h-3" /> Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className={`w-full p-3.5 rounded-xl border text-sm font-semibold outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode
                      ? 'bg-slate-800 border-white/5 text-white focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 text-[#131722] focus:border-indigo-500'
                  }`}
                />
              </div>
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Phone className="w-3 h-3" /> Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className={`w-full p-3.5 rounded-xl border text-sm font-semibold outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode
                      ? 'bg-slate-800 border-white/5 text-white focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 text-[#131722] focus:border-indigo-500'
                  }`}
                />
              </div>
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Clock className="w-3 h-3" /> Operating Hours
                </label>
                <input
                  type="text"
                  name="operatingHours"
                  value={formData.operatingHours}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className={`w-full p-3.5 rounded-xl border text-sm font-semibold outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode
                      ? 'bg-slate-800 border-white/5 text-white focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 text-[#131722] focus:border-indigo-500'
                  }`}
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <MapPin className="w-3 h-3" /> Physical Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows={2}
                  className={`w-full p-3.5 rounded-xl border text-sm font-semibold outline-none transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode
                      ? 'bg-slate-800 border-white/5 text-white focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 text-[#131722] focus:border-indigo-500'
                  }`}
                />
              </div>
            </div>
          </Card>

          {/* Operational Bounds */}
          <Card>
            <div className="space-y-6">
              {/* Logistics Fee */}
              <div>
                <div className="flex items-center gap-3.5 mb-5">
                  <SectionIcon icon={Truck} color="text-amber-500" bg={isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50'} />
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>
                      Base Logistics Fee
                    </h3>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Standard pickup charge for fleet
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Base Fee (KSh)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="baseLogisticsFee"
                    disabled={!canEdit}
                    value={formData.baseLogisticsFee}
                    onChange={(e) => {
                      if (!canEdit) return;
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setFormData({ ...formData, baseLogisticsFee: parseFloat(val) || 0 });
                    }}
                    className={`w-full p-3.5 rounded-xl border text-sm font-semibold outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? 'bg-slate-800 border-white/5 text-white focus:border-amber-500'
                        : 'bg-slate-50 border-slate-200 text-[#131722] focus:border-amber-500'
                    }`}
                  />
                  <p className={`text-[10px] font-semibold mt-2 flex items-center gap-1.5 ml-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <Info className="w-3 h-3" /> Setting a 0 base fee attracts significantly more clients.
                  </p>
                </div>
              </div>

              {/* Capacity */}
              <div className={`pt-6 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3.5 mb-5">
                  <SectionIcon icon={Scale} color="text-indigo-500" bg={isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'} />
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>
                      Operational Capacity
                    </h3>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Set your weight boundaries
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Min Weight (KG)
                    </label>
                    <input
                      type="number"
                      name="minWeight"
                      disabled={!canEdit}
                      value={formData.minWeight}
                      onChange={(e) => {
                        if (!canEdit) return;
                        setFormData({ ...formData, minWeight: parseFloat(e.target.value) || 0 });
                      }}
                      className={`w-full p-3.5 rounded-xl border text-sm font-semibold outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDarkMode
                          ? 'bg-slate-800 border-white/5 text-white focus:border-indigo-500'
                          : 'bg-slate-50 border-slate-200 text-[#131722] focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Max Capacity (KG)
                    </label>
                    <input
                      type="number"
                      name="maxWeight"
                      disabled={!canEdit}
                      value={formData.maxWeight}
                      onChange={(e) => {
                        if (!canEdit) return;
                        setFormData({ ...formData, maxWeight: parseFloat(e.target.value) || 0 });
                      }}
                      className={`w-full p-3.5 rounded-xl border text-sm font-semibold outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDarkMode
                          ? 'bg-slate-800 border-white/5 text-white focus:border-indigo-500'
                          : 'bg-slate-50 border-slate-200 text-[#131722] focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>

                <div className={`flex items-start gap-2.5 p-3.5 mt-4 rounded-xl border ${
                  isDarkMode
                    ? 'bg-slate-800/50 border-white/5'
                    : 'bg-slate-50 border-slate-100'
                }`}>
                  <Info className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
                  <p className={`text-[10px] font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    These limits control the minimum pickup weight and maximum fleet capacity for a single trip.
                  </p>
                </div>
              </div>

              {/* Storage Capacity */}
              <div className={`pt-6 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Package className="w-3 h-3" /> Total Storage Capacity (KG)
                  </label>
                  <input
                    type="text"
                    name="capacityKg"
                    disabled={!canEdit}
                    value={formData.capacityKg}
                    onChange={handleChange}
                    className={`w-full p-3.5 rounded-xl border text-sm font-semibold outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? 'bg-slate-800 border-white/5 text-white focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-200 text-[#131722] focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ─── COLLECTION SERVICES ─── */}
        <Card>
          <div className="flex items-center gap-3.5 mb-6">
            <SectionIcon icon={Layers} color="text-emerald-500" bg={isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'} />
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>
                Collection Services
              </h3>
              <p className={`text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Select materials your facility accepts for collection
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {categories.map((cat) => {
              const slug = cat.slug || cat.id;
              const isSelected = selectedSlugs.includes(slug);
              return (
                <button
                  key={cat.id}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleToggleCategory(slug)}
                  className={`relative p-4 rounded-2xl border transition-all flex flex-col items-center gap-2.5 text-center group disabled:cursor-not-allowed ${
                    isSelected
                      ? (isDarkMode
                          ? 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
                          : 'border-emerald-500/30 bg-emerald-50 shadow-lg shadow-emerald-500/5')
                      : (isDarkMode
                          ? 'border-white/5 bg-slate-800/50 hover:border-white/10'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300')
                  } ${!canEdit ? 'opacity-60' : ''}`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                  <div className="text-3xl">{cat.icon || '📦'}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest leading-tight ${
                    isSelected
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : (isDarkMode ? 'text-slate-400' : 'text-slate-500')
                  }`}>
                    {cat.label}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ─── MARKET RATES / PRICING ─── */}
        <Card>
          <div className="flex items-center gap-3.5 mb-6">
            <SectionIcon icon={Zap} color="text-emerald-500" bg={isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'} />
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>
                Market Rates
              </h3>
              <p className={`text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Set per-KG purchase prices for each material category
              </p>
            </div>
          </div>

          {selectedSlugs.length === 0 ? (
            <div className={`p-10 text-center rounded-2xl border border-dashed ${
              isDarkMode
                ? 'border-white/10 bg-slate-800/30'
                : 'border-slate-200 bg-slate-50'
            }`}>
              <Package className={`w-8 h-8 mx-auto mb-3 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                No materials selected
              </p>
              <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Enable materials in the Collection Services section above to configure pricing.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedSlugs.map((slug) => {
                const category = categories.find(c => (c.slug || c.id) === slug);
                if (!category) return null;
                const isExpanded = expandedCategory === slug;
                const subcats = materialPrices.filter(
                  m => m.category === category.id || m.category === category.slug || m.category === category.label
                );

                return (
                  <div key={slug} className={`rounded-2xl border overflow-hidden transition-all ${
                    isDarkMode
                      ? 'border-white/5 bg-slate-800/50'
                      : 'border-slate-200 bg-slate-50'
                  }`}>
                    {/* Category header row */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>
                          {category.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          KSh
                        </span>
                        <input
                          type="number"
                          disabled={!canEdit}
                          value={formData.customRates?.[slug] ?? ''}
                          onChange={(e) => updateRate(slug, e.target.value)}
                          placeholder="0"
                          className={`w-20 p-2.5 rounded-xl border text-center font-bold text-sm outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDarkMode
                              ? 'bg-slate-900 border-white/5 text-emerald-400 focus:border-emerald-500'
                              : 'bg-white border-slate-200 text-emerald-600 focus:border-emerald-500'
                          }`}
                        />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          /kg
                        </span>
                      </div>
                    </div>

                    {/* Expand for sub-grades */}
                    {subcats.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setExpandedCategory(isExpanded ? null : slug)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 border-t group ${
                            isDarkMode
                              ? 'bg-slate-900/50 border-white/5'
                              : 'bg-white/60 border-slate-200'
                          }`}
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <Settings2 className="w-3.5 h-3.5" />
                            {isExpanded ? 'Hide Grades' : `Adjust Material Grades (${subcats.length})`}
                          </span>
                          {isExpanded
                            ? <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
                            : <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
                          }
                        </button>

                        {isExpanded && (
                          <div className={`p-4 border-t space-y-3 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
                            <div className={`flex items-center gap-2 p-3 rounded-xl border ${
                              isDarkMode
                                ? 'bg-emerald-500/5 border-emerald-500/10'
                                : 'bg-emerald-50 border-emerald-100'
                            }`}>
                              <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <p className={`text-[10px] font-semibold leading-snug ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                Setting a grade price overrides the default {category.label} rate above.
                              </p>
                            </div>
                            {subcats.map(sub => {
                              const subSlug = `${slug}_${sub.id}`;
                              return (
                                <div key={sub.id} className={`flex items-center justify-between pl-4 border-l-2 py-1.5 ${
                                  isDarkMode ? 'border-emerald-500/30' : 'border-emerald-400/40'
                                }`}>
                                  <p className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {sub.material_name}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-bold uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>KSh</span>
                                    <input
                                      type="number"
                                      disabled={!canEdit}
                                      value={formData.customRates?.[subSlug] ?? ''}
                                      onChange={(e) => updateRate(subSlug, e.target.value)}
                                      placeholder={formData.customRates?.[slug] || '0'}
                                      className={`w-16 p-2 rounded-lg border text-center font-bold text-[11px] outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                        isDarkMode
                                          ? 'bg-slate-800 border-white/5 text-emerald-400 focus:border-emerald-500'
                                          : 'bg-slate-50 border-slate-200 text-emerald-600 focus:border-emerald-500'
                                      }`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ─── BOTTOM SAVE BAR ─── */}
        {canEdit && (
          <div className={`flex items-center justify-between p-5 rounded-2xl border ${
            isDarkMode
              ? 'bg-slate-900 border-white/5'
              : 'bg-white border-[#e0e3eb] shadow-sm'
          }`}>
            <div className="flex items-center gap-3">
              <ShieldAlert className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Changes are pushed instantly to your fleet agents and marketplace profile.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
