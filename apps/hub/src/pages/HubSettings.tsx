import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Settings, 
  LogOut,
  Save,
  Loader2,
  Scale,
  CheckCircle2,
  Package,
  Layers
} from 'lucide-react';
import { 
  useAuthStore, 
  supabase,
  normalizeKeys,
  Profile
} from '@klinflow/core';
import { toast } from 'sonner';

interface SupportedCategory {
  name: string;
  enabled: boolean;
}

interface SettingsFormData {
  hubName: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  capacityKg: string;
  operatingHours: string;
  minWeight: number;
  maxWeight: number;
  supportedCategories: SupportedCategory[];
}

interface ServiceCategory {
  id: string;
  label: string;
  icon?: string;
  is_active: boolean;
}

export default function HubSettings() {
  const { profile, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  const [formData, setFormData] = useState<SettingsFormData>({
    hubName: profile?.companyName || '',
    address: (profile as any)?.hubConfig?.address || '',
    contactEmail: (profile as any)?.hubConfig?.contactEmail || profile?.email || '',
    contactPhone: (profile as any)?.hubConfig?.contactPhone || profile?.phone || '',
    capacityKg: (profile as any)?.hubConfig?.capacityKg || '5000',
    operatingHours: (profile as any)?.hubConfig?.operatingHours || 'Mon - Sat: 08:00 - 18:00',
    minWeight: (profile as any)?.serviceProfile?.minWeight || 5,
    maxWeight: (profile as any)?.serviceProfile?.maxWeight || 500,
    supportedCategories: (profile as any)?.serviceProfile?.categories || []
  });

  // Fetch standard categories
  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from('service_categories').select('*').eq('is_active', true);
      if (data) setCategories(data);
    };
    fetchCats();
  }, []);

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      const uiProfile = profile as any;
      setFormData({
        hubName: profile.companyName || '',
        address: uiProfile.hubConfig?.address || '',
        contactEmail: uiProfile.hubConfig?.contactEmail || profile.email || '',
        contactPhone: uiProfile.hubConfig?.contactPhone || profile.phone || '',
        capacityKg: uiProfile.hubConfig?.capacityKg || '5000',
        operatingHours: uiProfile.hubConfig?.operatingHours || 'Mon - Sat: 08:00 - 18:00',
        minWeight: uiProfile.serviceProfile?.minWeight || 5,
        maxWeight: uiProfile.serviceProfile?.maxWeight || 500,
        supportedCategories: uiProfile.serviceProfile?.categories || []
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isChecked = (e.target as HTMLInputElement).checked;
    setFormData({ ...formData, [name]: type === 'checkbox' ? isChecked : value });
  };

  const handleToggleCategory = (catLabel: string) => {
    setFormData(prev => {
      const exists = prev.supportedCategories.find(c => c.name === catLabel);
      if (exists) {
        return { ...prev, supportedCategories: prev.supportedCategories.filter(c => c.name !== catLabel) };
      } else {
        return { ...prev, supportedCategories: [...prev.supportedCategories, { name: catLabel, enabled: true }] };
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return toast.error("Session Error: Please log in again");
    
    setIsSaving(true);
    
    try {
      const payload = {
        hub_config: {
          address: formData.address,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          capacityKg: formData.capacityKg,
          operatingHours: formData.operatingHours,
        },
        service_profile: {
          min_weight: Number(formData.minWeight),
          max_weight: Number(formData.maxWeight),
          categories: formData.supportedCategories
        },
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(payload as any)
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success("Settings Saved", {
        description: "Service profile & facility data synchronized."
      });

      // Refresh store
      const { fetchProfile } = useAuthStore.getState();
      await fetchProfile();
      
    } catch (err: any) {
      toast.error(`Save Failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (err) {
      toast.error("Failed to log out");
    }
  };

  const tabs = [
    { id: 'general', label: 'Facility Info', icon: Building2 },
    { id: 'service', label: 'Service Profile', icon: Scale },
    { id: 'location', label: 'Location & Hours', icon: MapPin },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-6xl">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">Hub Settings</h1>
          <p className="text-xs text-slate-500 font-semibold mt-2 uppercase tracking-widest">
            Control Facility Operations & Service Capabilities
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="px-5 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-2xl text-xs font-semibold uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2 w-fit shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          Terminate Session
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* ── SIDEBAR TABS ── */}
        <div className="md:col-span-1 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-3xl text-xs font-semibold uppercase tracking-[0.1em] transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CONTENT AREA ── */}
        <div className="md:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-sm">
            
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100 dark:border-white/5">
              <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                <Settings className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white capitalize">{tabs.find(t => t.id === activeTab)?.label}</h2>
                <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">Configure your {activeTab} parameters</p>
              </div>
            </div>

            {activeTab === 'general' && (
              <form onSubmit={handleSave} className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Facility Branding Name (Company)</label>
                     <input
                       type="text"
                       name="hubName"
                       value={formData.hubName}
                       readOnly
                       className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-500 cursor-not-allowed outline-none"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Total Storage Capacity (KG)</label>
                     <input
                       type="number"
                       name="capacityKg"
                       value={formData.capacityKg}
                       onChange={handleChange}
                       className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all"
                     />
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-slate-100 dark:border-white/5 flex justify-end">
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-10 py-5 bg-primary text-white rounded-[2rem] font-semibold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Configuration</>}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'service' && (
              <form onSubmit={handleSave} className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Minimum Collection Weight (KG)</label>
                      <input
                        type="number"
                        name="minWeight"
                        value={formData.minWeight}
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <p className="text-xs text-slate-400 mt-2">Pickups below this weight will be ignored by matching.</p>
                   </div>
                   <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Maximum Fleet Capacity (KG)</label>
                      <input
                        type="number"
                        name="maxWeight"
                        value={formData.maxWeight}
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <p className="text-xs text-slate-400 mt-2">Maximum weight your fleet can handle in a single trip.</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">Supported Material Categories</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categories.map(cat => {
                      const isActive = formData.supportedCategories.find(c => c.name === cat.label);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleToggleCategory(cat.label)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                            isActive 
                              ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                              : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-500 hover:border-indigo-300'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isActive ? 'bg-white/20' : 'bg-white dark:bg-slate-800'}`}>
                            {cat.icon || '📦'}
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-tight">{cat.label}</p>
                            <p className={`text-xs font-semibold ${isActive ? 'text-white/70' : 'text-slate-400'}`}>Enable for fleet collection</p>
                          </div>
                          {isActive && <CheckCircle2 className="w-5 h-5 ml-auto text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-slate-100 dark:border-white/5 flex justify-end">
                   <button 
                     type="submit" 
                     disabled={isSaving}
                     className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-semibold text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all flex items-center gap-3 disabled:opacity-50"
                   >
                     {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Layers className="w-4 h-4" /> Save Service Profile</>}
                   </button>
                </div>
              </form>
            )}

            {activeTab === 'location' && (
              <form onSubmit={handleSave} className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 gap-8">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Facility Physical Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl px-6 py-5 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Public Operating Hours</label>
                    <input
                      type="text"
                      name="operatingHours"
                      value={formData.operatingHours}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-slate-100 dark:border-white/5 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-10 py-5 bg-primary text-white rounded-[2rem] font-semibold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Update Facility Data</>}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
