import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Star, Building2, Truck, 
  ArrowLeft, SlidersHorizontal, ShieldCheck, X,
  Sparkles, Filter, ChevronRight, Scale, Info, Package
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
    <div className="min-h-screen bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+0.5rem)] pb-3 px-4 border-b border-slate-200 dark:border-slate-800 ">
        <div className="w-full mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl active:scale-90 transition-all">
              <ArrowLeft className="w-4 h-4 dark:text-white" />
            </button>
            <div>
              <h1 className="text-xl font-semibold dark:text-white tracking-tight leading-none mb-1">Find a Partner</h1>
              <p className="text-xs font-semibold text-primary capitalize tracking-[0.2em]">Verified Logistics</p>
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
                className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-primary/20 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold dark:text-white outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                showFilters || activeMaterial !== 'all' || activeScale !== 'all'
                ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500'
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
                      className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize tracking-widest whitespace-nowrap transition-all border ${
                        activeMaterial === m 
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
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        s.id === 'all' ? 'col-span-2' : ''
                      } ${
                        activeScale === s.id
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
                <motion.button
                  key={partner.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/company/${partner.id}`)}
                  className="w-full bg-white dark:bg-slate-800 p-4 rounded-none border-y border-x-0 border-slate-100 dark:border-slate-800/80 active:scale-[0.99] transition-all group text-left"
                >
                  <div className="flex gap-4">
                    {/* Avatar/Icon */}
                    <div className="relative shrink-0">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner relative overflow-hidden ${
                        isCompany ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30'
                      }`}>
                        {partner.avatarUrl ? (
                          <OptimizedImage src={getThumbnailUrl(partner.avatarUrl, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                        ) : (
                          isCompany ? '🏢' : '🚛'
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {isCompany ? (partner.companyName || partner.name) : partner.name}
                            </h4>
                            {partner.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-primary fill-primary/10" />}
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="flex items-center gap-0.5 text-amber-500">
                               <Star className="w-2.5 h-2.5 fill-current" />
                               <span className="text-xs font-semibold">{(partner.rating || 0) > 0 ? (partner.rating || 0).toFixed(1) : 'New'}</span>
                             </div>
                              <span className="text-xs text-slate-300">•</span>
                              <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                                <Package className="w-2.5 h-2.5" />
                                <span>{Number(partner.totalPickups || 0)} Pickups</span>
                              </div>
                              <span className="text-xs text-slate-300">•</span>
                              <span className={`text-xs font-semibold capitalize tracking-widest ${
                                scale === 'bulk' || scale === 'industrial' ? 'text-indigo-500' : 'text-emerald-500'
                              }`}>
                                 {scale}
                              </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-xs font-semibold text-slate-400 capitalize leading-none mb-0.5">Fee</p>
                          <p className="text-xs font-semibold text-primary">KSh {logisticsFee}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {acceptedMaterials
                          .filter((m: any) => !!(MATERIAL_LABELS as any)[m])
                          .slice(0, 3)
                          .map((m: any) => (
                            <span key={m} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 border border-slate-100/50 dark:border-white/5">
                              {(MATERIAL_LABELS as any)[m]}
                            </span>
                          ))}
                        {acceptedMaterials.filter((m: any) => !!(MATERIAL_LABELS as any)[m]).length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-400 dark:text-slate-500 border border-slate-100/50 dark:border-white/5 italic">
                            etc
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
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
        <div className="px-4">
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-[2.5rem] border border-blue-100/50 dark:border-blue-800/30 flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shrink-0">
               <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-400 capitalize tracking-widest mb-1">Choosing the right scale</h4>
              <p className="text-xs font-medium text-blue-800/60 dark:text-blue-300/60 leading-relaxed">
                Standard agents use small vehicles for fast, small pickups. Bulk partners use trucks for estate-wide or industrial recycling.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
