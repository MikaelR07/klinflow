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

const SCALE_DEFS = [
  { id: 'all', label: 'Any Scale', icon: Truck, description: 'Show all partners' },
  { id: 'standard', label: 'Standard', icon: Truck, description: 'Households & small waste (< 50kg)' },
  { id: 'bulk', label: 'Bulk', icon: Building2, description: 'Estates & large loads (50kg+)' }
];

/** Haversine formula — returns distance in KM between two lat/lng pairs */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Returns true if coordinates are a real, non-zero, in-range position */
function validCoords(lat: any, lng: any): boolean {
  const la = Number(lat);
  const lo = Number(lng);
  return (
    lat !== null && lat !== undefined &&
    lng !== null && lng !== undefined &&
    !isNaN(la) && !isNaN(lo) &&
    !(la === 0 && lo === 0) &&
    Math.abs(la) <= 90 && Math.abs(lo) <= 180
  );
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

  const materials = ['all', 'recyclable', 'metal', 'ewaste', 'paper', 'glass', 'organic', 'general'];

  // Request user's GPS location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // Reject (0,0) and obviously invalid coordinates
        if (validCoords(lat, lng)) {
          setUserCoords({ lat, lng });
          setLocationStatus('granted');
        } else {
          console.warn('[Discovery] Browser returned invalid GPS coords:', lat, lng);
          setLocationStatus('denied');
        }
      },
      (err) => {
        console.warn('[Discovery] Geolocation error:', err.message);
        setLocationStatus('denied');
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    const fetchPartners = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id, name, company_name, role, location, agent_account_type, rating, total_pickups, avatar_url,
            service_profile,
            agent_configurations(*)
          `)
          .in('role', ['agent', 'admin'])
          .in('agent_account_type', ['independent', 'company_admin'])
          .eq('is_online', true);

        if (error) throw error;

        // Fetch review counts
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('agent_id')
          .not('agent_rating', 'is', null);

        const reviewCounts: Record<string, number> = {};
        if (!bookingsError && bookingsData) {
          bookingsData.forEach((b: any) => {
            if (b.agent_id) {
              reviewCounts[b.agent_id] = (reviewCounts[b.agent_id] || 0) + 1;
            }
          });
        }

        const normalized = (data as any[]).map(p => {
          const norm = normalizeKeys(p);
          norm.reviewCount = reviewCounts[p.id] || 0;
          return norm;
        });
        setPartners(normalized);
      } catch (err) {
        console.error('[Discovery] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPartners();
  }, []);

  const filteredPartners = useMemo(() => {
    const list = partners.filter(p => {
      const config = (Array.isArray(p.agentConfigurations) ? p.agentConfigurations[0] : p.agentConfigurations) || {};
      const acceptedMaterials = config.acceptedMaterials || p.serviceProfile?.categories?.filter((c: any) => c.enabled).map((c: any) => c.name) || [];
      const scale = config.serviceScale || p.serviceProfile?.scale || (p.agentAccountType === 'company_admin' ? 'bulk' : 'standard');

      const matchMaterial = activeMaterial === 'all' || acceptedMaterials.includes(activeMaterial);
      const matchScale = activeScale === 'all' || scale === activeScale;
      const matchSearch = !searchQuery ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.companyName?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchMaterial && matchScale && matchSearch;
    });

    // Attach distance and sort — agents without valid coordinates go last
    if (userCoords) {
      return list
        .map(p => {
          // Location may be nested in location JSONB; normalizeKeys only camelCases top-level keys
          const loc = p.location || {};
          const lat = loc.latitude ?? loc.lat ?? null;
          const lng = loc.longitude ?? loc.lng ?? null;
          const distKm = validCoords(lat, lng)
            ? haversineKm(userCoords.lat, userCoords.lng, Number(lat), Number(lng))
            : null;
          return { ...p, distKm };
        })
        .sort((a, b) => {
          if (a.distKm === null && b.distKm === null) return 0;
          if (a.distKm === null) return 1;
          if (b.distKm === null) return -1;
          return a.distKm - b.distKm;
        });
    }

    return list.map(p => ({ ...p, distKm: null }));
  }, [partners, activeMaterial, activeScale, searchQuery, userCoords]);

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
              <h1 className="text-lg font-bold dark:text-white tracking-tight leading-none mb-0.5">Find a Partner</h1>
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
                  <p className="text-[10px] font-bold text-primary capitalize tracking-[0.2em]">Verified Collectors Near You</p>
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
              const config = (Array.isArray(partner.agentConfigurations) ? partner.agentConfigurations[0] : partner.agentConfigurations) || {};
              const acceptedMaterials = config.acceptedMaterials || partner.serviceProfile?.categories?.filter((c: any) => c.enabled).map((c: any) => c.name) || [];
              const scale = config.serviceScale || partner.serviceProfile?.scale || (partner.agentAccountType === 'company_admin' ? 'bulk' : 'standard');
              const isCompany = partner.agentAccountType === 'company_admin';
              const hasDistance = partner.distKm !== null && partner.distKm !== undefined && !isNaN(partner.distKm) && partner.distKm >= 0;

              return (
                <div
                  key={partner.id}
                  className="w-full bg-slate-100 dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 overflow-hidden transition-all text-left block cursor-pointer"
                  onClick={() => navigate(`/company/${partner.id}`)}
                >
                  <div className="p-2 flex gap-3 relative">
                    {/* Avatar */}
                    <div className="shrink-0 mt-0.5">
                      <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center text-2xl shadow-inner relative overflow-hidden ${isCompany ? 'bg-indigo-600 dark:bg-indigo-900/30 text-white' : 'bg-[#138a53] text-white'}`}>
                        {partner.avatarUrl ? (
                          <img src={getThumbnailUrl(partner.avatarUrl, { width: 150 })} className="w-full h-full object-cover" alt="" />
                        ) : (
                          isCompany ? '🏢' : <Truck className="w-7 h-7" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex justify-between">
                      <div className="min-w-0 flex-1">
                        {/* Name & Badge */}
                        <div className="flex items-center gap-1 mb-1">
                          <h4 className="text-[15px] font-bold text-[#0e1d2c] dark:text-white truncate">
                            {isCompany ? (partner.companyName || partner.name) : partner.name}
                          </h4>
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
                              {formatDistance(partner.distKm)}
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
                            <span className="text-[10px] font-medium text-slate-500 truncate max-w-[100px]">{partner.location?.estate || 'Nairobi'}</span>
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
          <div className="bg-gradient-to-br from-purple-400 to-indigo-500 p-3 rounded-[1rem] border border-blue-100/50 dark:border-slate-800 flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-800 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center shrink-0">
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
