/**
 * CompanyProfile — Dedicated company/agent profile page in aggregator mode
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, MapPin, Truck, ShieldCheck, Package,
  Zap, ChevronRight, Clock, Share, MoreVertical, CheckCircle2,
  CircleCheck, MessageSquare
} from 'lucide-react';
import { supabase } from '@klinflow/supabase';
import { MATERIAL_LABELS } from '@klinflow/core/data/wasteDefinitions';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { toast } from 'sonner';

export default function CompanyProfile() {
  const navigate = useNavigate();
  const { agentId } = useParams();

  const [company, setCompany] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
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
  const isFleetAdmin = company?.agent_account_type === 'company_admin' || company?.role === 'admin' || company?.role === 'company_admin';

  // Compute dynamic rating and review count from fetched reviews
  const reviewCount = reviews.length;
  const computedRating = reviewCount > 0
    ? (reviews.reduce((sum: number, r: any) => sum + (r.agent_rating || 0), 0) / reviewCount).toFixed(1)
    : (company?.rating > 0 ? company.rating.toFixed(1) : '0.0');

  return (
    <div className="bg-slate-50 dark:bg-slate-800 transition-colors min-h-screen">
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
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-4 text-white shadow-lg shadow-indigo-900/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-300/20 rounded-full blur-[60px] -ml-10 -mb-10 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="relative w-[90px] h-[90px] shrink-0">
                <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl overflow-hidden shadow-inner border-[2px] border-white/20">
                  {company?.avatarUrl || company?.avatar_url ? (
                    <OptimizedImage src={getThumbnailUrl(company.avatarUrl || company.avatar_url, { width: 250 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                  ) : (
                    isFleetAdmin ? '🏢' : '🚛'
                  )}
                </div>
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 backdrop-blur-md px-3 py-1 rounded-full border flex items-center gap-1.5 z-10 shadow-sm ${company?.is_online ? 'bg-emerald-500/90 border-emerald-300/50' : 'bg-amber-500/90 border-amber-300/50'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full bg-white ${company?.is_online ? 'animate-pulse shadow-[0_0_5px_white]' : ''}`} />
                  <span className="text-[9px] font-bold text-white capitalize tracking-widest pr-0.5">
                    {company?.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex-1 pt-1">
                <div className="flex flex-col gap-1.5 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-[1.15rem] text-white font-black tracking-tight leading-none drop-shadow-sm">{company?.company_name || company?.name || 'Klinflow Partner'}</h2>
                    <ShieldCheck className="w-4 h-4 text-white/90 drop-shadow-sm" />
                  </div>
                  <div className="flex items-center gap-1 flex-wrap mt-0.5">
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10 w-fit">
                      <MapPin className="w-3 h-3 text-white" />
                      <span className="text-[9px] font-bold text-white">{company?.location?.estate || 'Starehe, Nairobi'}</span>
                    </div>
                    <span className="text-white/40 text-[10px]">•</span>
                    <p className="text-[10px] font-medium text-white/90">
                      {isFleetAdmin ? 'Verified Fleet' : 'Independent Agent'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300 drop-shadow-sm" />
                    <span className="text-[11px] font-bold text-white">
                      {computedRating}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
              <div className="flex flex-col items-center justify-center flex-1 border-r border-white/50 last:border-0">
                <Package className="w-4 h-4 text-white/80 mb-1.5" />
                <p className="text-[13px] font-black text-white leading-none mb-1">{Number(company?.total_pickups || 1)}</p>
                <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Pickups</p>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 border-r border-white/50 last:border-0">
                <MessageSquare className="w-4 h-4 text-white/80 mb-1.5" />
                <p className="text-[13px] font-black text-white leading-none mb-1">{reviewCount}</p>
                <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Reviews</p>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 last:border-0">
                <Zap className="w-4 h-4 text-white/80 mb-1.5" />
                <p className="text-[13px] font-black text-white leading-none mb-1">KSh {logisticsFee}</p>
                <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Base Fee</p>
              </div>
            </div>
          </div>
        </div>


        {/* ── SERVICES & PRICING WRAPPER ── */}
        <div className="bg-slate-200 dark:bg-slate-800 p-3 rounded-2xl space-y-1 mt-4">
          {/* Accepted Materials */}
          {materials.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-white px-1">Accepted Materials</h3>
              <div className="flex overflow-x-auto gap-3 pb-1 no-scrollbar px-1">
                {(showAllMaterials ? materials : materials.slice(0, 3)).map((m: string) => {
                    let bgImage = '';
                    const identifier = m.toLowerCase();
                    const catLabel = m.toLowerCase();
                    if (identifier.includes('textile') || identifier.includes('clothes') || catLabel.includes('textile') || catLabel.includes('clothes')) bgImage = '/material-categories/textile.webp';
                    else if (identifier.includes('paper') || identifier.includes('cardboard') || identifier.includes('carton')) bgImage = '/material-categories/boxes.webp';
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
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-white px-1">Pricing</h3>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border-none shadow-sm flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Base Logistics Fee</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug pr-4">
                      Final price depends on material type and weight, confirmed after pickup.
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none mb-2">KSh {logisticsFee}</p>
                    <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold rounded-md">No booking fee</span>
                  </div>
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
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No reviews yet.</p>
            ) : (
              reviews.slice(0, 2).map((review, index) => {
                const profile = Array.isArray(review.profiles) ? review.profiles[0] : review.profiles;
                const reviewerName = profile?.full_name || profile?.first_name || 'Anonymous User';
                const initial = reviewerName.charAt(0).toUpperCase();
                const rating = review.agent_rating || 5;
                const dateObj = new Date(review.updated_at);
                const dateString = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const isPositive = rating >= 4;

                return (
                  <div key={review.id || index}>
                    {index > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800 w-full mb-4" />}
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-lg ${isPositive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'}`}>
                        {profile?.avatar_url ? (
                          <img src={getThumbnailUrl(profile.avatar_url, { width: 100 })} alt={reviewerName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          initial
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{reviewerName}</h4>
                          <span className="text-[10px] text-slate-400">{dateString}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className={`w-3 h-3 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                          {review.agent_rating_comment ? `"${review.agent_rating_comment}"` : 'No written feedback provided.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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
