/**
 * AgentReviews — All reviews for a specific agent (resident-facing)
 * Currently uses mock data; will be made dynamic later.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Star, ChevronDown, Clock, Check, AlertCircle
} from 'lucide-react';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';

function ReviewCard({ review }: { review: any }) {
  const rating = review.agent_rating || 5;
  const isPositive = rating >= 4;
  const profile = Array.isArray(review.profiles) ? review.profiles[0] : review.profiles;
  const reviewerName = profile?.name || 'Anonymous User';
  const initial = reviewerName.charAt(0).toUpperCase();
  const dateObj = new Date(review.updated_at);
  const dateString = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeString = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.25rem] shadow-sm overflow-hidden p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base shrink-0 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={getThumbnailUrl(profile.avatar_url, { width: 100 })} alt={reviewerName} className="w-full h-full object-cover" />
            ) : initial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-md flex items-center justify-center ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                {isPositive ? <Check className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white tracking-tight">{reviewerName}</h4>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-2.5 h-2.5 ${s <= rating ? 'fill-primary text-primary' : 'text-slate-200 dark:text-slate-700'}`} />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 capitalize tracking-widest">
                <span>• {dateString}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {timeString}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pl-4 border-l-2 border-primary/20 bg-slate-50/50 dark:bg-white/5 p-3 rounded-r-xl">
        {review.agent_rating_comment ? (
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
            "{review.agent_rating_comment}"
          </p>
        ) : (
          <p className="text-[11px] text-slate-400 font-medium italic opacity-60">No written comment provided.</p>
        )}
      </div>
    </div>
  );
}

export default function AgentReviews() {
  const navigate = useNavigate();
  const { agentId } = useParams();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId) return;
    setLoading(true);

    supabase
      .from('profiles')
      .select('role, agent_account_type')
      .eq('id', agentId)
      .single()
      .then(async ({ data: profileData }) => {
        let targetAgentIds: string[] = [agentId!];
        if (profileData && (profileData.agent_account_type === 'company_admin' || profileData.role === 'admin' || profileData.role === 'company_admin')) {
          const { data: fleetAgents } = await supabase
            .from('profiles')
            .select('id')
            .eq('company_id', agentId);
          if (fleetAgents && fleetAgents.length > 0) {
            targetAgentIds = [...fleetAgents.map((a: any) => a.id), agentId!];
          }
        }

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
        setLoading(false);
      });
  }, [agentId]);

  const stats = (() => {
    const total = reviews.length;
    if (total === 0) return { total: 0, average: '0.0', breakdown: [5,4,3,2,1].map(s => ({ stars: s, count: 0, percentage: 0 })) };

    const counts = [0, 0, 0, 0, 0];
    let sum = 0;
    reviews.forEach(r => {
      const rating = r.agent_rating || 5;
      const idx = Math.max(0, 5 - Math.round(rating));
      counts[idx]++;
      sum += rating;
    });
    return {
      total,
      average: (sum / total).toFixed(1),
      breakdown: counts.map((c, i) => ({
        stars: 5 - i,
        count: c,
        percentage: (c / total) * 100,
      })),
    };
  })();

  return (
    <div className="bg-[#F8F8FF] dark:bg-slate-800 transition-colors min-h-screen">
      {/* Fixed Top Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 border-b border-slate-100 dark:border-slate-900">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl active:scale-90 transition-all border border-slate-200 dark:border-slate-700">
            <ArrowLeft className="w-5 h-5 dark:text-white" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight leading-none mb-1">All Reviews</h1>
            <p className="text-[10px] font-bold text-primary capitalize tracking-[0.25em]">Customer Feedback</p>
          </div>
        </div>
      </div>

      <div className="w-full pt-[calc(env(safe-area-inset-top,1rem)+3.5rem)] pb-10 px-1.5 space-y-4 max-w-lg mx-auto">

        {/* Rating & Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-[1rem] p-4 border border-slate-100 dark:border-slate-800">
          <div className="flex gap-5">
            {/* Left: Rating Summary */}
            <div className="flex flex-col items-center justify-center shrink-0 pr-5 border-r border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 capitalize tracking-[0.2em] mb-1">Rating</p>
              <div className="flex items-baseline gap-1">
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{stats.average}</h2>
                <span className="text-xs font-bold text-slate-400">/5</span>
              </div>
              <div className="flex gap-0.5 mt-1.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-3 h-3 ${s <= Math.round(Number(stats.average)) ? 'fill-primary text-primary' : 'text-slate-300 dark:text-slate-600'}`} />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{stats.total} reviews</p>
            </div>

            {/* Right: Breakdown Bars */}
            <div className="flex-1 space-y-2 justify-center flex flex-col">
              {stats.breakdown.map((item) => (
                <div key={item.stars} className="flex items-center gap-3">
                  <span className="text-[9px] font-bold text-slate-400 w-3">{item.stars}★</span>
                  <div className="flex-1 h-1.5 bg-slate-400 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 w-6 text-right">{Math.round(item.percentage)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 capitalize tracking-[0.2em]">All Feedback</h3>
            <div className="px-2 py-1 bg-primary/10 rounded-lg">
              <span className="text-[10px] font-bold text-primary capitalize">{stats.total} reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1">
            {loading ? (
              <p className="text-center text-xs text-slate-500 py-10">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-10">No reviews yet for this agent.</p>
            ) : (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
