import { useState, useEffect, useMemo } from 'react';
import { Star, MessageSquare, ArrowLeft, User, Calendar, Tag, Loader2, TrendingUp, Award, ThumbsUp, Heart, ChevronDown, ChevronUp, Clock, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import EmptyState from '@klinflow/ui/components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

function ReviewCard({ review }: { review: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPositive = review.rating >= 4;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all overflow-hidden group">
      {/* Header - Always Visible */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 cursor-pointer select-none flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
            {review.customerAvatar ? (
              <img 
                src={getThumbnailUrl(review.customerAvatar, { width: 100 })} 
                className="w-full h-full object-cover" 
                alt=""
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {review.customerName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-md flex items-center justify-center ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                {isPositive ? <Check className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-tight">{review.customerName}</h4>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-2.5 h-2.5 ${s <= review.rating ? 'fill-primary text-primary' : 'text-slate-200 dark:text-slate-800'}`} />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>• {review.date}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {review.time}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden xs:flex px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
             <p className="text-[9px] font-mono text-slate-400 uppercase">#{review.id.slice(0,6)}</p>
          </div>
          <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
             <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 pt-1">
              <div className="pl-4 border-l-2 border-primary/20 bg-slate-50/50 dark:bg-white/5 p-4 rounded-r-2xl">
                {review.feedback ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                    "{review.feedback}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 font-medium italic opacity-60">No written comment provided.</p>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{review.wasteType || 'General'}</span>
                </div>
                {isPositive && (
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase tracking-widest ml-auto">
                    <Heart className="w-3 h-3 fill-emerald-500" /> Service Champion
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReviewsPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { 
    recentReviews, 
    fetchReviews, 
    isLoadingReviews, 
    subscribeToReviews, 
    cleanupReviews 
  } = useAgentStore();

  useEffect(() => {
    fetchReviews();
    subscribeToReviews();
    return () => cleanupReviews();
  }, [fetchReviews, subscribeToReviews, cleanupReviews]);

  const stats = useMemo(() => {
    const total = recentReviews.length;
    if (total === 0) return { breakdown: [], total: 0, average: 0 };
    
    const counts = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1
    let sum = 0;
    
    recentReviews.forEach(r => {
      const idx = Math.max(0, 5 - Math.round(r.rating));
      counts[idx]++;
      sum += r.rating;
    });

    return {
      total,
      average: (sum / total).toFixed(1),
      breakdown: counts.map((c, i) => ({
        stars: 5 - i,
        count: c,
        percentage: (c / total) * 100
      }))
    };
  }, [recentReviews]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Sticky Top Nav */}
      <div className="sticky top-0 z-50 -mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1.5rem)+0.75rem)] pb-4 px-4 max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-white uppercase">Reviews and Feedback</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5 leading-none">
                <TrendingUp className="w-3 h-3 text-primary" /> Live Reputation Metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Main Rating Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-6 opacity-10 dark:opacity-5">
            <Award className="w-20 h-20 rotate-12 text-slate-900 dark:text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Global Standing</p>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-4xl font-black tracking-tighter">{stats.total === 0 ? '0.0' : (stats.average || Number(profile?.rating || 0).toFixed(1))}</h2>
              <span className="text-sm font-bold text-slate-300 dark:text-slate-600">/5.0</span>
            </div>
            <div className="flex gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(Number(stats.total === 0 ? 0 : (stats.average || profile?.rating || 0))) ? 'fill-primary text-primary' : 'text-slate-100 dark:text-slate-800'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
          <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Rating Analytics</h3>
          <div className="space-y-2">
            {stats.breakdown.length > 0 ? stats.breakdown.map((item) => (
              <div key={item.stars} className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-slate-400 w-3">{item.stars}★</span>
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-500 w-6 text-right">{Math.round(item.percentage)}%</span>
              </div>
            )) : (
              [5,4,3,2,1].map(s => (
                <div key={s} className="flex items-center gap-3 opacity-20">
                  <span className="text-[9px] font-bold text-slate-400 w-3">{s}★</span>
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full" />
                  <span className="text-[9px] font-bold text-slate-500 w-6 text-right">0%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Recent Feedback</h3>
          <div className="px-2 py-1 bg-primary/10 rounded-lg">
            <span className="text-[10px] font-bold text-primary uppercase">{stats.total} reviews</span>
          </div>
        </div>

        {isLoadingReviews ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
             <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
             <p className="text-[10px] font-bold uppercase tracking-widest">Synchronizing History...</p>
          </div>
        ) : recentReviews.length === 0 ? (
          <EmptyState 
            icon={MessageSquare}
            title="Clean Slate"
            subtitle="Complete more missions to start receiving feedback from the community."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recentReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
