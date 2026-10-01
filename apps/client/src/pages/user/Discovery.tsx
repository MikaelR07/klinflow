import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Star, Building2, Truck,
  ArrowLeft, SlidersHorizontal, X,
  Filter, ChevronRight, Package, Info,
  CircleCheck, Navigation2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/supabase';
import { MATERIAL_LABELS } from '@klinflow/core/data/wasteDefinitions';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { normalizeKeys } from '@klinflow/core/validation';
import { useLocationStore } from '@klinflow/core/stores/locationStore';

const SCALE_DEFS = [
  { id: 'all', label: 'Any Scale', icon: Truck, description: 'Show all partners' },
  { id: 'standard', label: 'Standard', icon: Truck, description: 'Households & small waste (< 50kg)' },
  { id: 'bulk', label: 'Bulk', icon: Building2, description: 'Estates & large loads (50kg+)' }
];



function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}

export default function DiscoveryHub() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMaterial, setActiveMaterial] = useState('all');
  const [activeScale, setActiveScale] = useState('all');
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'requesting' | 'granted' | 'denied' | 'idle'>('idle');

  const materials = ['all', 'recyclable', 'metal', 'ewaste', 'paper', 'glass', 'organic', 'general'];

  // Request user's GPS location via unified locationStore
  useEffect(() => {
    const fetchLoc = async () => {
      try {
        const { useLocationStore } = await import('@klinflow/core/stores/locationStore');
        const store = useLocationStore.getState();
        if (store.status === 'idle') store.startTracking();
        
        const loc = await store.getCurrentLocation();
        if (validCoords(loc.latitude, loc.longitude)) {
          setUserCoords({ lat: loc.latitude, lng: loc.longitude });
          setLocationStatus('granted');
        } else {
          setLocationStatus('denied');
        }
      } catch (err) {
        setLocationStatus('denied');
      }
    };
    fetchLoc();
  }, []);

  useEffect(() => {
    const fetchPartners = async () => {
      // We only fetch when we have a location or it has definitively failed
      if (locationStatus === 'requesting' || locationStatus === 'idle') return;

      setIsLoading(true);
      try {
        const lat = userCoords?.lat || -1.2921; // fallback to default location if denied
        const lng = userCoords?.lng || 36.8219;

        const { data, error } = await supabase.rpc('get_discovery_partners', {
          p_lat: lat,
          p_lng: lng,
          p_material: activeMaterial,
          p_scale: activeScale,
          p_max_results: 30
        });

        if (error) throw error;
        setPartners(data || []);
      } catch (err) {
        console.error('[Discovery] RPC Error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPartners();
  }, [userCoords, locationStatus, activeMaterial, activeScale]);

  const filteredPartners = useMemo(() => {
    if (!searchQuery) return partners;

    return partners.filter(p => {
      const nameMatch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const companyMatch = p.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || companyMatch;
    });
  }, [partners, searchQuery]);

  return (
    <div className="bg-slate-50 dark:bg-slate-800 transition-colors">
      {/* ── FIXED HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-900/50">
        <div className="w-full mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-3xl active:scale-90 transition-all">
              <ArrowLeft className="w-4 h-4 dark:text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold dark:text-white tracking-tight leading-none mb-0.5">Explore Nearby Collectors</h1>
              <div className="flex items-center gap-1.5">
                {locationStatus === 'granted' && (
                  <>
                    <Navigation2 className="w-3 h-3 text-emerald-500" />
                    <p className="text-[10px] font-bold text-emerald-500 tracking-[0.15em]">Sorted by distance</p>
                  </>
                )}
                {locationStatus === 'requesting' && (
                  <p className="text-[10px] font-bold text-amber-500 tracking-[0.15em]">Getting your location…</p>
                )}
                {(locationStatus === 'denied' || locationStatus === 'idle') && (
                  <p className="text-[10px] font-bold text-primary capitalize tracking-[0.2em]">Select from verified collectors near you</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search partners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-200 dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-primary/20 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold dark:text-white outline-none transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0 ${showFilters || activeScale !== 'all'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Material Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {materials.map(m => (
                <button
                  key={m}
                  onClick={() => setActiveMaterial(m)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize tracking-widest whitespace-nowrap transition-all border ${activeMaterial === m
                    ? 'bg-primary border-primary text-white'
                    : 'bg-slate-400 dark:bg-slate-400 text-slate-100 border-slate-100 dark:border-slate-800'
                    }`}
                >
                  {m === 'all' ? 'All' : ((MATERIAL_LABELS as any)[m] || m)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full pt-[calc(env(safe-area-inset-top,1rem)+9rem)] pb-6 px-0 space-y-6">

        {/* ── EXPANDABLE FILTERS ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden px-4"
            >
              <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.25rem] shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Filter className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <h3 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">Operation Scale</h3>
                  </div>
                  {activeScale !== 'all' && (
                    <button
                      onClick={() => setActiveScale('all')}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {SCALE_DEFS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setActiveScale(s.id)}
                      className={`relative flex flex-col p-3 rounded-xl border text-left transition-all overflow-hidden group ${s.id === 'all' ? 'col-span-2' : ''
                        } ${activeScale === s.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                        }`}
                    >
                      {activeScale === s.id && (
                        <div className="absolute top-0 right-0 w-8 h-8 bg-primary rounded-bl-xl flex items-start justify-end p-1.5 shadow-sm">
                          <CircleCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <s.icon className={`w-3.5 h-3.5 ${activeScale === s.id ? 'text-primary' : 'text-slate-400 group-hover:text-slate-500'}`} />
                        <p className={`text-xs font-bold capitalize tracking-tight ${activeScale === s.id ? 'text-primary' : 'text-slate-700 dark:text-white'}`}>
                          {s.label}
                        </p>
                      </div>
                      <p className={`text-[10px] font-medium leading-relaxed ${activeScale === s.id ? 'text-primary/70' : 'text-slate-500 dark:text-slate-400'}`}>
                        {s.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PARTNERS LIST ── */}
        <div className="space-y-1">
          {isLoading ? (
            <div className="space-y-1.5 px-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-28 bg-white dark:bg-slate-800 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredPartners.length > 0 ? (
            filteredPartners.map((partner: any, i) => {
              const acceptedMaterials = partner.accepted_materials || [];
              const scale = partner.service_scale || 'standard';
              const isCompany = partner.agent_account_type === 'company_admin';
              const hasDistance = partner.distance_km !== null && partner.distance_km !== undefined;
              
              // Determine online status based on freshness
              const isOnlineNow = partner.is_online && partner.last_pulse && (new Date().getTime() - new Date(partner.last_pulse).getTime() <= 5 * 60 * 1000);

              return (
                <div
                  key={partner.id}
                  className="w-full bg-slate-100 dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 overflow-hidden transition-all text-left block cursor-pointer"
                  onClick={() => navigate(`/company/${partner.id}`)}
                >
                  <div className="p-2 flex gap-3 relative">
                    {/* Avatar */}
                    <div className="shrink-0 mt-0.5">
                      <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center text-xl font-bold shadow-inner relative overflow-hidden ${isCompany ? 'bg-indigo-600 dark:bg-indigo-900/30 text-white' : 'bg-[#138a53] text-white'}`}>
                        {partner.avatar_url ? (
                          <img src={getThumbnailUrl(partner.avatar_url, { width: 150 })} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span>{(partner.name || 'P').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex justify-between">
                      <div className="min-w-0 flex-1">
                        {/* Name & Badge */}
                        <div className="flex items-center gap-1 mb-1">
                          <h4 className="text-[15px] font-bold text-[#0e1d2c] dark:text-white truncate">
                            {partner.name}
                          </h4>
                          {isOnlineNow && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online Now" />
                          )}
                        </div>

                        {/* Rating & Distance */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-[11px] font-black text-[#0e1d2c] dark:text-white">{(partner.rating || 0) > 0 ? (partner.rating || 0).toFixed(1) : 'New'}</span>
                            {(partner.rating || 0) > 0 && <span className="text-[11px] font-medium text-slate-400">({partner.reviewCount || 0})</span>}
                          </div>
                          {partner.rating > 4.5 && (
                            <span className="text-[9px] font-bold text-[#138a53] bg-green-50 dark:bg-green-500/10 dark:text-green-400 px-1.5 py-0.5 rounded">Top Rated</span>
                          )}
                          {/* Distance badge */}
                          {hasDistance && (
                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                              <MapPin className="w-2.5 h-2.5" />
                              {partner.entity_type === 'agent' ? 'Base: ' : 'Depot: '}
                              {formatDistance(partner.distance_km)}
                            </span>
                          )}
                        </div>

                        {/* Pickups + Location */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-medium text-slate-500">{Number(partner.totalPickups || 0)} Pickups</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-medium text-slate-500 truncate max-w-[100px]">{partner.estate || 'Nairobi'}</span>
                          </div>
                        </div>

                        {/* Materials */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {acceptedMaterials
                            .filter((m: any) => !!(MATERIAL_LABELS as any)[m])
                            .slice(0, 3)
                            .map((m: any) => (
                              <span key={m} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 rounded-full text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                                {(MATERIAL_LABELS as any)[m]}
                              </span>
                            ))}
                          {acceptedMaterials.filter((m: any) => !!(MATERIAL_LABELS as any)[m]).length > 3 && (
                            <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-full text-[9px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                              +{acceptedMaterials.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end justify-between pl-2 pb-1">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded capitalize ${scale === 'bulk' || scale === 'industrial' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-green-50 text-[#138a53] dark:bg-green-500/10 dark:text-green-400'}`}>
                          {scale}
                        </span>
                        <div className="flex items-center gap-1 mt-auto h-full">
                          <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-300 ml-1 -mr-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="mx-4 text-center py-24 bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-slate-200" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No results found</h3>
              <p className="text-xs font-medium text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                We couldn't find any partners matching your current filters.
              </p>
              <button
                onClick={() => { setActiveMaterial('all'); setActiveScale('all'); setSearchQuery(''); }}
                className="mt-6 text-xs font-semibold text-primary capitalize tracking-widest hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* ── INFO BOX ── */}
        <div className="px-1.5">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-3 rounded-[1rem] border border-blue-100/50 dark:border-slate-800 flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-600 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white dark:text-white capitalize tracking-widest mb-1">Choosing the right scale</h4>
              <p className="text-xs font-medium text-slate-200 leading-relaxed">
                Standard agents use small vehicles for fast, small pickups. Bulk partners use trucks for estate-wide or industrial recycling.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
