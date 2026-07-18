import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Tag,
  MapPin,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
// @ts-ignore
window.L = L;

// ── HUB PIN ICON ──
const hubPinIcon = L.divIcon({
  className: 'custom-hub-pin',
  html: `<div class="w-10 h-10 rounded-xl bg-emerald-600 border-[3px] border-white shadow-xl flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

// ── REVERSE GEOCODE HELPER ─────────────────────────────────────────
const fetchAddress = async (lat: number, lon: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { headers: { 'User-Agent': 'Klinflow-PWA/1.0' } }
    );
    const data = await response.json();
    if (!data || !data.address) return null;
    const addr = data.address;
    return addr.neighbourhood || addr.suburb || addr.quarter || addr.suburb || addr.road || data.display_name.split(',')[0];
  } catch (err) {
    return null;
  }
};

// ── MAP DRAG HANDLER ───────────────────────────────────────────────
function MapDragHandler({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  const map = useMap();
  useMapEvents({
    dragend() {
      const center = map.getCenter();
      onMove(center.lat, center.lng);
    },
    zoomend() {
      const center = map.getCenter();
      onMove(center.lat, center.lng);
    }
  });
  return null;
}

// ── FIXED CENTER PIN ───────────────────────────────────────────────
const FixedCenterPin = () => (
  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-[1000]">
    <div className="relative flex flex-col items-center -mt-10">
      <div className="w-10 h-10 rounded-xl bg-emerald-600 border-[3px] border-white shadow-xl flex items-center justify-center text-white animate-pulse">
        <MapPin className="w-6 h-6" />
      </div>
      <div className="w-2 h-2 bg-slate-900/50 rounded-full blur-[2px] mt-1"></div>
    </div>
  </div>
);

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

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
    max_weight: 100
  });

  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showHubMapModal, setShowHubMapModal] = useState(false);

  // Hub Mode State
  const [hubData, setHubData] = useState({
    active: profile?.isHubActive || false,
    address: profile?.hubAddress || '',
    coords: profile?.hubLocation || profile?.location || null
  });
  
  const reverseGeocodeTimer = useRef<NodeJS.Timeout | null>(null);

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

  // Re-initialize service_profile fields when profile updates
  useEffect(() => {
    if (!profile) return;

    const sp = profile.serviceProfile || profile.service_profile;
    console.log('[DEBUG] PROFILE LOADED:', profile);
    console.log('[DEBUG] SP OBJ:', sp);
    if (sp) {
      console.log('[DEBUG] SP WEIGHTS:', sp.minWeight, sp.min_weight, sp.maxWeight, sp.max_weight);
      setFormData(prev => ({
        ...prev,
        min_weight: sp.minWeight ?? sp.min_weight ?? 5,
        max_weight: sp.maxWeight ?? sp.max_weight ?? 100
      }));
    }

    setHubData({
      active: profile.isHubActive || false,
      address: profile.hubAddress || '',
      coords: profile.hubLocation || profile.location || null
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
            categories: formData.accepted_materials.map(m => ({ name: m, enabled: true }))
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
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* Fixed Top Nav */}
      {!isCompanyAdmin && (
        <div className="fixed top-0 left-0 right-0 z-[1001] max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
          <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3.5 px-4 flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5">
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

            {!isFleetDriver && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3.5 py-2.5 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isSaving ? 'Saving...' : 'Save All Changes'}
              </button>
            )}
          </div>
        </div>
      )}

      <main className={`flex-1 ${isCompanyAdmin ? 'pt-4' : 'pt-[calc(env(safe-area-inset-top,1rem)+3.5rem)]'} px-1.5 pb-5 w-full max-w-lg mx-auto space-y-2`}>
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
                onClick={() => {
                  const newActive = !hubData.active;
                  setHubData(prev => ({ ...prev, active: newActive }));
                  if (newActive) setShowHubMapModal(true);
                }}
                className={`w-12 h-6 rounded-full relative transition-colors ${hubData.active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${hubData.active ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {hubData.active && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                {/* Location Preview Card */}
                {hubData.coords?.latitude ? (
                  <div className="rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800/40">
                    <div className="h-32 relative">
                      <MapContainer
                        center={[hubData.coords.latitude, hubData.coords.longitude]}
                        zoom={16}
                        zoomControl={false}
                        dragging={false}
                        scrollWheelZoom={false}
                        doubleClickZoom={false}
                        className="h-full w-full z-0"
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[hubData.coords.latitude, hubData.coords.longitude]} {...({ icon: hubPinIcon } as any)} />
                      </MapContainer>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] font-bold text-white/90 tracking-wide">
                            {hubData.coords.latitude.toFixed(4)}, {hubData.coords.longitude.toFixed(4)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowHubMapModal(true)}
                          className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/30 transition-colors"
                        >
                          Edit Pin
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowHubMapModal(true)}
                    className="w-full p-6 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 text-center space-y-2 hover:border-emerald-500 transition-colors active:scale-[0.98]"
                  >
                    <MapPin className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Tap to Pin Your Hub Location</p>
                    <p className="text-[10px] font-semibold text-slate-400">Required for sellers to find you on the map</p>
                  </button>
                )}

                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    By enabling Hub Mode, your pinned location will appear on the marketplace as a verified drop-off point for sellers.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HUB LOCATION PICKER MODAL ── */}
        {showHubMapModal && createPortal(
          <div className="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-slate-900 max-w-lg mx-auto w-full">
            {/* Modal Header */}
            <div className="pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)] pb-4 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0 shadow-sm z-10">
              <button
                type="button"
                onClick={() => setShowHubMapModal(false)}
                className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Pin Hub Location</h2>
                <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest mt-0.5">Tap the map to place your hub</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setHubData(prev => ({
                          ...prev,
                          coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
                        }));
                        toast.success('Moved to your current location');
                      },
                      () => toast.error('GPS access denied'),
                      { enableHighAccuracy: true }
                    );
                  }
                }}
                className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center active:scale-95 transition-all"
              >
                <Navigation className="w-4 h-4 text-emerald-600" />
              </button>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
              <MapContainer
                center={[
                  hubData.coords?.latitude || profile?.location?.latitude || -1.2635,
                  hubData.coords?.longitude || profile?.location?.longitude || 36.8048
                ]}
                zoom={15}
                zoomControl={false}
                className="h-full w-full z-0"
                key={showHubMapModal ? 'open' : 'closed'}
              >
                <MapInvalidator />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapDragHandler
                  onMove={(lat, lng) => {
                    setHubData(prev => ({
                      ...prev,
                      coords: { latitude: lat, longitude: lng }
                    }));
                    
                    if (reverseGeocodeTimer.current) clearTimeout(reverseGeocodeTimer.current);
                    reverseGeocodeTimer.current = setTimeout(async () => {
                      const addr = await fetchAddress(lat, lng);
                      if (addr) {
                        setHubData(prev => ({ ...prev, address: addr }));
                      }
                    }, 1500);
                  }}
                />
              </MapContainer>
              
              <FixedCenterPin />

              {/* Floating Coords Badge */}
              {hubData.coords?.latitude && (
                <div className="absolute top-4 left-4 right-4 z-[400] flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl px-3.5 py-2.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Pinned Location</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                      {hubData.coords.latitude.toFixed(5)}, {hubData.coords.longitude.toFixed(5)}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                </div>
              )}

              {/* Floating Instruction */}
              <div className="absolute top-4 left-4 right-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">Drag the map to place the pin precisely on your hub</p>
              </div>
            </div>

            {/* Bottom Panel */}
            <div className="shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-[calc(env(safe-area-inset-bottom,1rem)+0.5rem)] space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Physical Address / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Langata Rd, Opp T-Mall, Gate 5"
                  value={hubData.address}
                  onChange={(e) => setHubData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <button
                type="button"
                disabled={!hubData.coords?.latitude}
                onClick={() => {
                  setShowHubMapModal(false);
                  toast.success('Hub location pinned!', { description: hubData.address || 'Location saved' });
                }}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <CheckCircle2 className="w-5 h-5" />
                Confirm Hub Location
              </button>
            </div>
          </div>,
          document.body
        )}
        {/* 🚚 LOGISTICS FEE */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-3 relative overflow-hidden opacity-80 cursor-not-allowed">
          <div className="absolute inset-0 z-10 pointer-events-auto" title="This feature will be unlocked upon full verification." />
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white capitalize tracking-widest">Base Logistics Fee</h3>
                <p className="text-[9px] text-slate-400 font-semibold capitalize tracking-widest">Your standard pickup charge</p>
              </div>
            </div>
            <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md uppercase tracking-widest border border-amber-500/20">Coming Soon</span>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Base Fee (KSh)</label>
            <input
              type="text"
              inputMode="decimal"
              disabled={true}
              value={formData.base_logistics_fee}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-400 dark:text-slate-500 outline-none cursor-not-allowed"
            />
            <p className="text-[9px] font-bold text-amber-600 dark:text-amber-500 capitalize tracking-widest mt-1.5 flex items-center gap-1.5 ml-1">
              <Info className="w-3 h-3 shrink-0" /> Feature unlocks upon full Klinflow verification.
            </p>
          </div>
        </div>

        {/* ⚖️ OPERATIONAL CAPACITY */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white capitalize tracking-widest">Operational Capacity</h3>
              <p className="text-[9px] text-slate-400 font-semibold capitalize tracking-widest">Set your weight boundaries</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Min Weight (KG)</label>
              <input
                type="number"
                disabled={isFleetDriver}
                value={formData.min_weight}
                onChange={(e) => setFormData({ ...formData, min_weight: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Max Load (KG)</label>
              <input
                type="number"
                disabled={isFleetDriver}
                value={formData.max_weight}
                onChange={(e) => setFormData({ ...formData, max_weight: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex items-start gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
            <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[9px] font-semibold text-slate-500 leading-relaxed">
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




      </main>
    </div>
  );
}
