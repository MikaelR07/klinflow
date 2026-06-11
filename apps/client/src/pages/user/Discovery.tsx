import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Star, Building2, Truck,
  ArrowLeft, SlidersHorizontal, ShieldCheck, X,
  Sparkles, Filter, ChevronRight, Scale, Info, Package,
  CircleCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/supabase';
import { MATERIAL_LABELS, WASTE_CATEGORIES } from '@klinflow/core/data/wasteDefinitions';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { normalizeKeys } from '@klinflow/core/validation';

const SCALE_DEFS = [
  { id: 'all', label: 'Any Scale', icon: Truck, description: 'Show all partners' },
  { id: 'standard', label: 'Standard', icon: Truck, description: 'Households & small waste (< 50kg)' },
  { id: 'bulk', label: 'Bulk', icon: Building2, description: 'Estates & large loads (50kg+)' }
];

export default function DiscoveryHub() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMaterial, setActiveMaterial] = useState('all');
  const [activeScale, setActiveScale] = useState('all');
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const materials = ['all', 'recyclable', 'metal', 'ewaste', 'paper', 'glass', 'organic', 'general'];

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
        const normalized = (data as any[]).map(p => normalizeKeys(p));
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
    return partners.filter(p => {
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
  }, [partners, activeMaterial, activeScale, searchQuery]);

  return (
    <div className=" bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 border-b border-slate-200 dark:border-slate-900/50 ">
        <div className="w-full mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-3xl active:scale-90 transition-all">
              <ArrowLeft className="w-4 h-4 dark:text-white" />
            </button>
            <div>
              <h1 className="text-lg font-bold dark:text-white tracking-tight leading-none mb-1">Find a Partner</h1>
              <p className="text-[10px] font-bold text-primary capitalize tracking-[0.2em]">Verified Logistics</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-300/50 dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-primary/20 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold dark:text-white outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${showFilters || activeMaterial !== 'all' || activeScale !== 'all'
                ? 'bg-primary text-white '
                : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-slate-500'
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full pt-[calc(env(safe-area-inset-top,1rem)+5.75rem)] pb-6 px-0 space-y-6">

        {/* ── EXPANDABLE FILTERS ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden space-y-5 px-4"
            >
              {/* Material Filter */}
              <div className="space-y-2">

                <div className="flex gap-2 overflow-x-auto no-scrollbar pt-4">
                  {materials.map(m => (
                    <button
                      key={m}
                      onClick={() => setActiveMaterial(m)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize tracking-widest whitespace-nowrap transition-all border ${activeMaterial === m
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-800'
                        }`}
                    >
                      {m === 'all' ? 'All' : ((MATERIAL_LABELS as any)[m] || m)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Scale (Weight) Filter */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 capitalize tracking-widest px-1">Scale</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SCALE_DEFS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setActiveScale(s.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${s.id === 'all' ? 'col-span-2' : ''
                        } ${activeScale === s.id
                          ? 'border-primary bg-primary/5'
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800'
                        }`}
                    >
                      <p className={`text-xs font-semibold capitalize tracking-tight mb-0.5 ${activeScale === s.id ? 'text-primary' : 'dark:text-white'}`}>
                        {s.label}
                      </p>
                      <p className="text-xs font-medium text-slate-400 leading-tight">
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
              const logisticsFee = config.baseLogisticsFee ?? partner.serviceProfile?.baseLogisticsFee ?? 0;
              const acceptedMaterials = config.acceptedMaterials || partner.serviceProfile?.categories?.filter((c: any) => c.enabled).map((c: any) => c.name) || [];
              const scale = config.serviceScale || partner.serviceProfile?.scale || (partner.agentAccountType === 'company_admin' ? 'bulk' : 'standard');
              const isCompany = partner.agentAccountType === 'company_admin';

              return (
                <div
                  key={partner.id}
                  className="w-full bg-white dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800  overflow-hidden transition-all text-left  block cursor-pointer"
                  onClick={() => navigate(`/company/${partner.id}`)}
                >
                  <div className="p-4 flex gap-3 relative">
                    {/* Avatar/Icon */}
                    <div className="shrink-0 mt-0.5">
                      <div className={`w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-2xl shadow-inner relative overflow-hidden ${isCompany ? 'bg-indigo-600 dark:bg-indigo-900/30 text-white' : 'bg-[#138a53] text-white'}`}>
                        {partner.avatarUrl ? (
                          <OptimizedImage src={getThumbnailUrl(partner.avatarUrl, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
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
                            <CircleCheck className="w-4 h-4 text-green-500 fill-green-500/20 shrink-0" />
                          </div>

                          {/* Rating & Tag */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span className="text-[11px] font-black text-[#0e1d2c] dark:text-white">{(partner.rating || 0) > 0 ? (partner.rating || 0).toFixed(1) : 'New'}</span>
                              {(partner.rating || 0) > 0 && <span className="text-[11px] font-medium text-slate-400">({partner.reviewCount || 0})</span>}
                            </div>
                            {partner.rating > 4.5 && (
                              <span className="text-[9px] font-bold text-[#138a53] bg-green-50 dark:bg-green-500/10 dark:text-green-400 px-1.5 py-0.5 rounded">Top Rated</span>
                            )}
                          </div>

                          {/* Meta info */}
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

                          {/* Materials Icons row */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {acceptedMaterials
                              .filter((m: any) => !!(MATERIAL_LABELS as any)[m])
                              .slice(0, 3)
                              .map((m: any) => (
                                <span key={m} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 rounded-full text-[9px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
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
                         
                         <div className="flex items-center gap-1 mt-auto">
                           <div className="text-left">
                             <p className="text-[10px] text-slate-500 font-medium leading-none mb-1.5">From</p>
                             <p className="text-[15px] font-black text-[#138a53] dark:text-green-400 leading-none mb-1">KSh {logisticsFee}</p>
                             <p className="text-[9px] text-slate-500 font-medium leading-none">No booking fee</p>
                           </div>
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
          <div className="bg-gradient-to-br from-emerald-800 to-green-500  p-3 rounded-[1rem] border border-blue-100/50 dark:border-slate-800 flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-800 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white dark:text-white capitalize tracking-widest mb-1">Choosing the right scale</h4>
              <p className="text-xs font-medium text-slate-200/70 dark:text-slate-200/70 leading-relaxed">
                Standard agents use small vehicles for fast, small pickups. Bulk partners use trucks for estate-wide or industrial recycling.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
