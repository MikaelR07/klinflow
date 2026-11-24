/**
 * CompanyProfile — Dedicated company/agent profile page in aggregator mode
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, MapPin, Truck, ShieldCheck, Package,
  Zap, ChevronRight, MessageSquare, MoreVertical
} from 'lucide-react';
import { supabase } from '@klinflow/supabase';
import { MATERIAL_LABELS } from '@klinflow/core/data/wasteDefinitions';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { toast } from 'sonner';

const MATERIAL_IMAGE_MAP: Record<string, string> = {
  plastic: '/material-categories/plastic.webp',
  paper: '/material-categories/boxes.webp',
  cardboard: '/material-categories/boxes.webp',
  carton: '/material-categories/boxes.webp',
  metal: '/material-categories/metal.webp',
  ewaste: '/material-categories/E-waste.webp',
  'e-waste': '/material-categories/E-waste.webp',
  electronic: '/material-categories/E-waste.webp',
  organic: '/material-categories/organic-waste.webp',
  food: '/material-categories/organic-waste.webp',
  glass: '/material-categories/glasses.webp',
  glasses: '/material-categories/glasses.webp',
  textile: '/material-categories/textile.webp',
  clothes: '/material-categories/textile.webp',
  general: '/material-categories/general-waste.webp',
  trash: '/material-categories/general-waste.webp',
  bulky: '/material-categories/bulky-sofas.webp',
  appliance: '/material-categories/bulky-item.webp',
  sofa: '/material-categories/bulky-sofas.webp',
  furniture: '/material-categories/bulky-sofas.webp',
  recyclable: '/material-categories/recyclables.webp',
  recyclables: '/material-categories/recyclables.webp',
};

function getMaterialImage(m: string): string {
  const lower = m.toLowerCase();
  for (const [key, path] of Object.entries(MATERIAL_IMAGE_MAP)) {
    if (lower.includes(key)) return path;
  }
  return '/material-categories/recyclables.webp';
}

export default function CompanyProfile() {
  const navigate = useNavigate();
  const { agentId } = useParams();

  const [company, setCompany] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId) { navigate('/'); return; }
    setLoading(true);
    supabase
      .from('profiles')
      .select('*, agent_configurations(*)')
      .eq('id', agentId)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) { toast.error('Company not found'); navigate('/'); return; }
        setCompany(data);
        setLoading(false);

        const isFleet = data.agent_account_type === 'company_admin' || data.role === 'admin' || data.role === 'company_admin';
        let targetAgentIds: string[] = [agentId!];
        if (isFleet) {
          const { data: fleetAgents } = await supabase
            .from('profiles')
            .select('id')
            .eq('company_id', agentId);
          if (fleetAgents && fleetAgents.length > 0) {
            targetAgentIds = [...fleetAgents.map((a: any) => a.id), agentId!];
          }
        }

        // Fetch reviews
        const { data: reviewData } = await supabase
          .from('bookings')
          .select('id, agent_rating, agent_rating_comment, updated_at, user_id')
          .in('agent_id', targetAgentIds)
          .not('agent_rating', 'is', null)
          .order('updated_at', { ascending: false });

        if (reviewData && reviewData.length > 0) {
          const userIds = [...new Set(reviewData.map((r: any) => r.user_id).filter(Boolean))];
          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, name, avatar_url')
              .in('id', userIds);
            
            const profileMap: any = {};
            if (profilesData) {
              profilesData.forEach((p: any) => { profileMap[p.id] = p; });
            }

            const enrichedReviews = reviewData.map((r: any) => ({
              ...r,
              profiles: profileMap[r.user_id]
            }));
            setReviews(enrichedReviews);
          } else {
            setReviews(reviewData);
          }
        } else {
          setReviews([]);
        }
      });
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  const config = (Array.isArray(company?.agent_configurations) ? company.agent_configurations[0] : company?.agent_configurations) || {};
  const materials = config.accepted_materials?.length > 0
    ? config.accepted_materials
    : (company?.service_profile?.categories?.filter((c: any) => c.enabled).map((c: any) => c.name) || []);
  const logisticsFee = config.base_logistics_fee ?? company?.service_profile?.base_logistics_fee ?? 0;
  const isFleetAdmin = company?.agent_account_type === 'company_admin' || company?.role === 'admin' || company?.role === 'company_admin';
  const customRates = config.custom_rates || {};
  const serviceProfileCategories = company?.service_profile?.categories || [];

  function getMaterialRate(m: string): string | null {
    const normKey = m.toLowerCase();
    if (customRates[normKey]) return `KSh ${customRates[normKey]}/kg`;
    if (customRates[m]) return `KSh ${customRates[m]}/kg`;
    const cat = serviceProfileCategories.find((c: any) => c.name?.toLowerCase() === normKey || normKey.includes(c.name?.toLowerCase()));
    if (cat?.base_rate) return `KSh ${cat.base_rate}/kg`;
    return null;
  }

  // Compute dynamic rating and review count from fetched reviews
  const reviewCount = reviews.length;
  const computedRating = reviewCount > 0
    ? (reviews.reduce((sum: number, r: any) => sum + (r.agent_rating || 0), 0) / reviewCount).toFixed(1)
    : (company?.rating > 0 ? company.rating.toFixed(1) : '0.0');

  return (
    <div className="bg-white dark:bg-slate-900 transition-colors ">
      {/* ── FIXED HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-2.5 px-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl active:scale-90 transition-all border border-slate-200/80 dark:border-slate-700"
            >
              <ArrowLeft className="w-4 h-4 text-slate-800 dark:text-white" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight capitalize leading-none mb-0.5">
                Collector Profile
              </h1>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Verified Recycling Partner
              </p>
            </div>
          </div>
          <button className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl active:scale-90 transition-all border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full pt-[calc(env(safe-area-inset-top,1rem)+3.75rem)] pb-12 px-1.5 space-y-5 max-w-lg mx-auto">
        {/* ── HERO CARD ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-700 p-4 text-white shadow-xs">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-300/20 rounded-full blur-[60px] -ml-10 -mb-10 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="relative w-[84px] h-[84px] shrink-0">
                <div className="w-full h-full rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl overflow-hidden shadow-inner border-[2px] border-white/20">
                  {company?.avatarUrl || company?.avatar_url ? (
                    <img src={getThumbnailUrl(company.avatarUrl || company.avatar_url, { width: 250 })} className="w-full h-full object-cover" alt="" />
                  ) : (
                    isFleetAdmin ? '🏢' : '🚛'
                  )}
                </div>
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 backdrop-blur-md px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 z-10 shadow-sm ${company?.is_online ? 'bg-emerald-500 border-emerald-400/50' : 'bg-amber-500/90 border-amber-300/50'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full bg-white ${company?.is_online ? 'animate-pulse shadow-[0_0_5px_white]' : ''}`} />
                  <span className="text-[9px] font-bold text-white capitalize tracking-widest">
                    {company?.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex-1 pt-0.5 min-w-0">
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-[1.15rem] text-white font-bold tracking-tight leading-tight drop-shadow-sm truncate">
                      {company?.company_name || company?.name || 'Klinflow Partner'}
                    </h2>
                    <ShieldCheck className="w-4 h-4 text-white/90 drop-shadow-sm shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10 w-fit">
                      <MapPin className="w-3 h-3 text-white" />
                      <span className="text-[9.5px] font-bold text-white">{company?.location?.estate || 'Starehe, Nairobi'}</span>
                    </div>
                    <span className="text-white/40 text-[10px]">•</span>
                    <p className="text-[10px] font-medium text-white/90">
                      {isFleetAdmin ? 'Verified Fleet' : 'Independent Collector'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-lg backdrop-blur-sm border border-white/10">
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300 drop-shadow-sm" />
                    <span className="text-[11px] font-bold text-white">
                      {computedRating}
                    </span>
                    <span className="text-[9.5px] text-white/70">({reviewCount})</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
              <div className="flex flex-col items-center justify-center flex-1 border-r border-white/30 last:border-0">
                <Package className="w-4 h-4 text-white/90 mb-1" />
                <p className="text-[13px] font-bold text-white leading-none mb-0.5">{Number(company?.total_pickups || 1)}</p>
                <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider">Pickups</p>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 border-r border-white/30 last:border-0">
                <MessageSquare className="w-4 h-4 text-white/90 mb-1" />
                <p className="text-[13px] font-bold text-white leading-none mb-0.5">{reviewCount}</p>
                <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider">Reviews</p>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 last:border-0">
                <Zap className="w-4 h-4 text-white/90 mb-1" />
                <p className="text-[13px] font-bold text-white leading-none mb-0.5">KSh {logisticsFee}</p>
                <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider">Base Fee</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACCEPTED MATERIALS (SCROLLABLE) ── */}
        {materials.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
                Accepted Materials
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {materials.length} categories
              </span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 snap-x">
              {materials.map((m: string) => {
                const imgPath = getMaterialImage(m);
                const rate = getMaterialRate(m);
                const label = (MATERIAL_LABELS as any)[m] || m.replace(/_/g, ' ');

                return (
                  <div
                    key={m}
                    className="shrink-0 w-28 snap-start bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 overflow-hidden"
                  >
                    <div className="h-16 w-full bg-slate-200/60 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={imgPath}
                        alt={label}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate leading-tight">
                        {label}
                      </p>
                      {rate && (
                        <p className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
                          {rate}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── CUSTOMER REVIEWS ── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
                What customers say
              </h3>
              {reviewCount > 0 && (
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  ({reviewCount})
                </span>
              )}
            </div>
            <button
              onClick={() => navigate(`/company/${agentId}/reviews`)}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 active:scale-95 transition-transform"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-6 text-center">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                No reviews yet.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {reviews.slice(0, 2).map((review, index) => {
                const profile = Array.isArray(review.profiles) ? review.profiles[0] : review.profiles;
                const reviewerName = profile?.name || profile?.full_name || 'Verified User';
                const initial = reviewerName.charAt(0).toUpperCase();
                const rating = review.agent_rating || 5;
                const dateObj = new Date(review.updated_at);
                const dateString = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                return (
                  <div
                    key={review.id || index}
                    className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200/80 dark:border-slate-600">
                          {profile?.avatar_url ? (
                            <img src={getThumbnailUrl(profile.avatar_url, { width: 80 })} alt={reviewerName} className="w-full h-full object-cover" />
                          ) : (
                            initial
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{reviewerName}</h4>
                          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">{dateString}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {review.agent_rating_comment ? `"${review.agent_rating_comment}"` : 'Completed pickup smoothly.'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── BOOKING CTA ── */}
        <section className="pt-1 space-y-2.5">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/book-pickup?agentId=${agentId}&companyName=${encodeURIComponent(company?.company_name || company?.name || '')}`)}
            className="w-full py-4 bg-emerald-950 hover:bg-emerald-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Truck className="w-4 h-4" />
            Book This Agent
          </motion.button>
          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            You're booking with a verified Klinflow partner
          </p>
        </section>

      </div>
    </div>
  );
}
