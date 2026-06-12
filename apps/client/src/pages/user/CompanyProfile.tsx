/**
 * CompanyProfile — Dedicated company/agent profile page in aggregator mode
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, MapPin, Truck, ShieldCheck, Package,
  Zap, ChevronRight, Clock, Share, MoreVertical, CheckCircle2,
  CircleCheck
} from 'lucide-react';
import { supabase } from '@klinflow/supabase';
import { MATERIAL_LABELS } from '@klinflow/core/data/wasteDefinitions';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { toast } from 'sonner';

export default function CompanyProfile() {
  const navigate = useNavigate();
  const { agentId } = useParams();

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllMaterials, setShowAllMaterials] = useState(false);

  useEffect(() => {
    if (!agentId) { navigate('/'); return; }
    setLoading(true);
    supabase
      .from('profiles')
      .select('*, agent_configurations(*)')
      .eq('id', agentId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { toast.error('Company not found'); navigate('/'); return; }
        setCompany(data);
        setLoading(false);
      });
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-800">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const config = (Array.isArray(company?.agent_configurations) ? company.agent_configurations[0] : company?.agent_configurations) || {};
  const materials = config.accepted_materials?.length > 0
    ? config.accepted_materials
    : (company?.service_profile?.categories?.filter((c: any) => c.enabled).map((c: any) => c.name) || []);
  const logisticsFee = config.base_logistics_fee ?? company?.service_profile?.base_logistics_fee ?? 0;
  const isFleetAdmin = company?.role === 'admin';

  return (
    <div className="bg-[#F8F8FF] dark:bg-slate-800 transition-colors min-h-screen">
      {/* ── FIXED HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto  bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 border-b border-slate-100 dark:border-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl active:scale-90 transition-all border border-slate-200 dark:border-slate-700">
              <ArrowLeft className="w-5 h-5 dark:text-white" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight leading-none mb-1">Company Profile</h1>
              <p className="text-[10px] font-bold text-primary capitalize tracking-[0.25em]">Partner Details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 bg-white dark:bg-slate-800 rounded-xl active:scale-90 transition-all border border-slate-200 dark:border-slate-700">
              <Share className="w-5 h-5 dark:text-white" />
            </button>
            <button className="p-2.5 bg-white dark:bg-slate-800 rounded-xl active:scale-90 transition-all border border-slate-200 dark:border-slate-700">
              <MoreVertical className="w-5 h-5 dark:text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full pt-[calc(env(safe-area-inset-top,1rem)+3.75rem)] pb-5 px-1.5 space-y-4 max-w-lg mx-auto">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-emerald-800 p-3 text-white ">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[80px] -mr-16 -mt-16" />
          
          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="relative w-[85px] h-[85px] shrink-0">
                <div className="w-full h-full rounded-[1.25rem] bg-emerald-800 dark:bg-slate-800 flex items-center justify-center text-3xl overflow-hidden shadow-md">
                  {company?.avatarUrl || company?.avatar_url ? (
                    <OptimizedImage src={getThumbnailUrl(company.avatarUrl || company.avatar_url, { width: 250 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                  ) : (
                    isFleetAdmin ? '🏢' : '🚛'
                  )}
                </div>
                <div className="absolute -bottom-2 -left-2 bg-black/70 px-2 py-0.5 rounded-full border-2 border-green-500 flex items-center gap-1.5 z-10 shadow-sm">
                  <div className={`w-1.5 h-1.5 rounded-full ${company?.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-[9px] font-bold text-white capitalize tracking-wide pr-0.5">
                    {company?.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex-1 pt-1">
                <div className="flex items-center gap-1 mb-0.5">
                  <h2 className="text-lg text-white font-bold tracking-tight leading-none">{company?.company_name || company?.name || 'Klinflow Partner'}</h2>
                  <CircleCheck className="w-4 h-4 text-green-400 fill-green-600/20" />
                </div>
                <p className="text-[12px] font-medium text-emerald-100 mb-2">
                  {isFleetAdmin ? 'Verified Fleet Company' : 'Independent Agent'}
                </p>

                <div className="flex items-center gap-1 mb-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-[12px] font-bold text-white">
                    {company?.rating > 0 ? company.rating.toFixed(1) : '4.8'}
                  </span>
                  <span className="text-[11px] text-emerald-200/80">({company?.total_reviews || 0} reviews)</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-medium text-emerald-200/90">Verified by Klinflow</span>
                </div>
              </div>
            </div>

            <div className=" border-t border-white/50 dark:border-slate-200 rounded-3xl p-3 flex items-center justify-between shadow-sm">
              <div className="flex flex-col items-center justify-center flex-1 border-r border-slate-100 dark:border-slate-800 last:border-0">
                <Package className="w-4 h-4 text-emerald-200 mb-1" />
                <p className="text-sm font-bold text-white dark:text-white leading-none mb-0.5">{Number(company?.total_pickups || 1)}</p>
                <p className="text-[9px] text-slate-200 font-medium">Total Pickups</p>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 border-r border-slate-100 dark:border-slate-800 last:border-0">
                <Star className="w-4 h-4 text-amber-400 mb-1" />
                <p className="text-sm font-bold text-white dark:text-white leading-none mb-0.5">{company?.rating > 0 ? company.rating.toFixed(1) : '4.8'}</p>
                <p className="text-[9px] text-slate-200 font-medium">Rating</p>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 border-r border-slate-100 dark:border-slate-800 last:border-0">
                <Clock className="w-4 h-4 text-blue-400 mb-1" />
                <p className="text-sm font-bold text-white dark:text-white leading-none mb-0.5">1-2 hrs</p>
                <p className="text-[9px] text-slate-200 font-medium">Avg. Arrival</p>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 last:border-0">
                <Zap className="w-4 h-4 text-purple-400 mb-1" />
                <p className="text-sm font-bold text-white dark:text-white leading-none mb-0.5">KSh {logisticsFee}</p>
                <p className="text-[9px] text-slate-200 font-medium">Base Fee</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Area */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Service Area</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{company?.location?.estate || 'Starehe, Nairobi'}</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">View on map</span>
            <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>

        {/* Accepted Materials */}
        {materials.length > 0 && (
          <div className="space-y-3 pt-2 !mt-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white px-1">Accepted Materials</h3>
            <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar px-1">
              {(showAllMaterials ? materials : materials.slice(0, 3)).map((m: string) => {
                  let bgImage = '';
                  const identifier = m.toLowerCase();
                  if (identifier.includes('paper') || identifier.includes('cardboard') || identifier.includes('carton')) bgImage = '/material-categories/boxes.webp';
                  else if (identifier.includes('plastic')) bgImage = '/material-categories/plastic.webp';
                  else if (identifier.includes('ewaste') || identifier.includes('e-waste') || identifier.includes('electronic')) bgImage = '/material-categories/E-waste.webp';
                  else if (identifier.includes('metal')) bgImage = '/material-categories/metal.webp';
                  else if (identifier.includes('organic') || identifier.includes('food')) bgImage = '/material-categories/organic-waste.webp';
                  else if (identifier.includes('general') || identifier.includes('trash')) bgImage = '/material-categories/general-waste.webp';
                  else if (identifier.includes('glass')) bgImage = '/material-categories/glasses.webp';
                  else if (identifier.includes('appliance')) bgImage = '/material-categories/bulky-item.webp';
                  else if (identifier.includes('bulky') || identifier.includes('sofa') || identifier.includes('furniture')) bgImage = '/material-categories/bulky-sofas.webp';
                  else if (identifier.includes('recycl')) bgImage = '/material-categories/recyclables.webp';

                  return (
                  <div 
                    key={m} 
                    className="shrink-0 w-[85px] h-[85px] bg-slate-100 dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-2 shadow-md relative overflow-hidden"
                    style={bgImage ? {
                      backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.8)), url(${bgImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    } : {}}
                  >
                    <span className="text-[10px] font-black text-white capitalize tracking-widest text-center leading-tight italic z-10 relative">
                      {m.replace(/_/g, ' ')}
                    </span>
                  </div>
                )})}
              {!showAllMaterials && materials.length > 3 && (
                <button 
                  onClick={() => setShowAllMaterials(true)}
                  className="shrink-0 w-[85px] h-[85px] bg-slate-300 dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-2 shadow-sm active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">+{materials.length - 3}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">
                    More
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pricing Card */}
        <div className="space-y-3 pt-2 !mt-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white px-1">Pricing</h3>
          <div className="bg-emerald-50/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-emerald-100 dark:border-slate-800 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Base Logistics Fee</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug pr-4">
                    Final price depends on material type and weight, confirmed after pickup.
                  </p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end">
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 leading-none mb-2">KSh {logisticsFee}</p>
                  <span className="px-2 py-1 bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold rounded-md">No booking fee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What customers say */}
        <div className="space-y-4 pt-4 !mt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">What customers say</h3>
            <button 
              onClick={() => navigate(`/company/${agentId}/reviews`)}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center active:scale-95 transition-transform"
            >
              See all reviews <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            {/* Review 1 */}
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                M
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Mary Wanjiku</h4>
                  <span className="text-[10px] text-slate-400">2 days ago</span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Very reliable and professional. Came on time and handled everything smoothly.
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

            {/* Review 2 */}
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-700 dark:text-blue-400 font-bold text-lg">
                J
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">James O.</h4>
                  <span className="text-[10px] text-slate-400">1 week ago</span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Great service! The agent was very friendly and helped me sort out my recyclables. Will definitely use them again.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Book Action Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[1.25rem] p-4 border border-slate-100 dark:border-slate-800 shadow-sm mt-8">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/book-pickup?agentId=${agentId}&companyName=${encodeURIComponent(company?.company_name || company?.name || '')}`)}
            className="w-full py-3.5 bg-[#138a53] text-white rounded-[0.85rem] font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <Truck className="w-4 h-4" />
            Book This Agent
          </motion.button>
          
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-[10px] text-slate-500 font-medium">You're booking with a verified partner. Your data is safe with us.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
