import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Star, Building2, Truck,
  ArrowLeft, SlidersHorizontal, X,
  Filter, ChevronRight, Package, Info,
  CircleCheck, Navigation2, ShieldCheck
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



function validCoords(lat: number | null | undefined, lng: number | null | undefined): boolean {
  return typeof lat === 'number' && typeof lng === 'number' && lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng);
}

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
  const [currentSlide, setCurrentSlide] = useState(0);

  const bannerImages = ['/vectors/discover2.webp', '/vectors/discover.webp'];

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % bannerImages.length);
    }, 12000); // Change every 12 seconds

    return () => clearInterval(interval);
  }, []);

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
    <div className="bg-white dark:bg-slate-800 min-h-screen transition-colors">
      {/* ── FIXED HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-900 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-700/50">
        <div className="w-full mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-3xl active:scale-90 transition-all">
              <ArrowLeft className="w-4 h-4 dark:text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-emerald-600 dark:text-white tracking-tight leading-none mb-0.5">Explore Nearby Collectors</h1>
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
                  <p className="text-[10px] font-bold text-emerald-500 capitalize tracking-[0.2em]">Select from verified collectors near you</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary/40 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold dark:text-white outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0 ${showFilters || activeScale !== 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Material Filter Tabs in TopNav */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2.5 pb-1">
            {materials.map(m => (
              <button
                key={m}
                onClick={() => setActiveMaterial(m)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all border ${activeMaterial === m
                  ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80'
                  }`}
              >
                {m === 'all' ? 'All' : ((MATERIAL_LABELS as any)[m] || m)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto pt-[calc(env(safe-area-inset-top,1rem)+9.25rem)] pb-8 px-1.5 space-y-4">

        {/* ── BANNER CAROUSEL ── */}
        <div className="px-0">
          <div className="relative w-full aspect-[2.5/1] max-h-48 overflow-hidden rounded-2xl shadow-xs">
            {bannerImages.map((img, index) => (
              <img
                key={img}
                src={img}
                alt={`Banner ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
            {/* Carousel Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {bannerImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide ? 'bg-slate-900 w-6' : 'bg-slate-900/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── EXPANDABLE FILTERS ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden px-0"
            >
              <div className="bg-slate-50 dark:bg-slate-800/90 p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Filter className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <h3 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">Operation Scale</h3>
                  </div>
                  {activeScale !== 'all' && (
                    <button
                      onClick={() => setActiveScale('all')}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
                      className={`relative flex flex-col p-3 rounded-xl border text-left transition-all overflow-hidden group ${
                        s.id === 'all' ? 'col-span-2' : ''
                      } ${
                        activeScale === s.id
                          ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-xs'
                          : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border-slate-200/70 dark:border-slate-700/60'
                      }`}
                    >
                      {activeScale === s.id && (
                        <div className="absolute top-0 right-0 w-8 h-8 bg-primary rounded-bl-xl flex items-start justify-end p-1.5 shadow-sm">
                          <CircleCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <s.icon className={`w-3.5 h-3.5 ${activeScale === s.id ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                        <p className={`text-xs font-bold capitalize tracking-tight ${activeScale === s.id ? 'text-primary' : 'text-slate-700 dark:text-white'}`}>
                          {s.label}
                        </p>
                      </div>
                      <p className={`text-[10px] font-medium leading-relaxed ${activeScale === s.id ? 'text-primary/80 dark:text-primary/90' : 'text-slate-500 dark:text-slate-400'}`}>
                        {s.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SECTION HEADER & RESULTS COUNT ── */}
        <div className="flex items-center justify-between px-0.5 pt-1">
          <div>
            <h2 className="text-[13px] font-bold text-slate-800 dark:text-white capitalize tracking-wide flex items-center gap-1.5">
              Verified Collectors
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
                {filteredPartners.length} Nearby
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Certified recycling agents & collection hubs
            </p>
          </div>
        </div>

        {/* ── PARTNERS LIST ── */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredPartners.length > 0 ? (
            filteredPartners.map((partner: any) => {
              const acceptedMaterials = partner.accepted_materials || [];
              const scale = partner.service_scale || 'standard';
              const isCompany = partner.agent_account_type === 'company_admin';
              const hasDistance = partner.distance_km !== null && partner.distance_km !== undefined;
              
              // Determine online status based on freshness
              const isOnlineNow = partner.is_online && partner.last_pulse && (new Date().getTime() - new Date(partner.last_pulse).getTime() <= 5 * 60 * 1000);

              return (
                <div
                  key={partner.id}
                  className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-3.5 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-xs active:scale-[0.99] transition-all text-left block cursor-pointer group"
                  onClick={() => navigate(`/company/${partner.id}`)}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-base shadow-xs overflow-hidden ${
                        isCompany 
                          ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white' 
                          : 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white'
                      }`}>
                        {partner.avatar_url ? (
                          <img src={getThumbnailUrl(partner.avatar_url, { width: 150 })} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span>{(partner.name || 'P').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      {isOnlineNow && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-50 dark:border-slate-800 rounded-full" title="Online Now" />
                      )}
                    </div>

                    {/* Partner Details */}
                    <div className="flex-1 min-w-0">
                      {/* Name & Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-[14px] font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {partner.name}
                          </h4>
                          {isCompany ? (
                            <span className="shrink-0 text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <Building2 className="w-2.5 h-2.5" /> Company
                            </span>
                          ) : (
                            <span className="shrink-0 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" /> Verified
                            </span>
                          )}
                        </div>

                        {/* Scale Badge */}
                        <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-md capitalize tracking-wide ${
                          scale === 'bulk' || scale === 'industrial'
                            ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40'
                            : 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                        }`}>
                          {scale}
                        </span>
                      </div>

                      {/* Meta Row: Rating, Distance, Pickups & Location */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                          <span>{(partner.rating || 0) > 0 ? (partner.rating || 0).toFixed(1) : 'New'}</span>
                          {(partner.rating || 0) > 0 && <span className="font-normal text-slate-400 text-[10px]">({partner.reviewCount || 0})</span>}
                        </div>

                        {hasDistance && (
                          <div className="flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-semibold text-[10.5px]">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{formatDistance(partner.distance_km)}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-[10.5px]">
                          <Package className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{Number(partner.totalPickups || 0)} pickups</span>
                        </div>

                        <div className="text-[10.5px] truncate max-w-[120px] text-slate-500 dark:text-slate-400">
                          • {partner.estate || 'Nairobi'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Materials & Action Row */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1 items-center min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">Accepts:</span>
                      {acceptedMaterials
                        .filter((m: any) => !!(MATERIAL_LABELS as any)[m])
                        .slice(0, 3)
                        .map((m: any) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 rounded-md text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                          >
                            {(MATERIAL_LABELS as any)[m]}
                          </span>
                        ))}
                      {acceptedMaterials.filter((m: any) => !!(MATERIAL_LABELS as any)[m]).length > 3 && (
                        <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 rounded-md text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                          +{acceptedMaterials.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      <span>View Rates</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/60 p-6">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <Search className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No collectors found</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                We couldn't find any partners matching your current filters.
              </p>
              <button
                onClick={() => { setActiveMaterial('all'); setActiveScale('all'); setSearchQuery(''); }}
                className="mt-4 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-xs"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* ── INFO BOX: SCALE GUIDE ── */}
        <div className="pt-2">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/40">
              <Info className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1">
              <h4 className="text-[12px] font-bold text-slate-900 dark:text-white capitalize tracking-wide mb-0.5">
                Standard vs. Bulk Collection
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Standard agents use motorbikes and tuktuk for fast household pickups (&lt; 50kg). Bulk collectors operate larger trucks for estates, schools, and commercial facilities (50kg+).
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
