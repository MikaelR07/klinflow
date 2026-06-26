import { useState, useEffect, useMemo } from 'react';
import { Star, MessageSquare, ArrowLeft, User, Calendar, Tag, Loader2, TrendingUp, Award, ThumbsUp, Heart, ChevronDown, ChevronUp, Clock, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import EmptyState from '@klinflow/ui/components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

function ReviewCard({ review, isCompanyOwner }: { review: any, isCompanyOwner?: boolean }) {
  const isPositive = review.rating >= 4;

  return (
    <div className={`bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group p-5 ${isCompanyOwner ? 'h-full flex flex-col' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
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
              <h4 className="text-sm font-black text-slate-800 dark:text-white tracking-tight leading-tight">{review.customerName}</h4>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-2.5 h-2.5 ${s <= review.rating ? 'fill-primary text-primary' : 'text-slate-200 dark:text-slate-800'}`} />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 capitalize tracking-widest">
                <span>• {review.date}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {review.time}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden xs:flex px-2 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg shrink-0">
          <p className="text-[9px] font-mono text-slate-400 capitalize">#{review.id.slice(0, 6)}</p>
        </div>
      </div>

      {/* Review Content */}
      <div className={`pl-4 border-l-2 border-primary/20 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-r-2xl ${isCompanyOwner ? 'flex-1 mt-4' : ''}`}>
        {review.feedback ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
            "{review.feedback}"
          </p>
        ) : (
          <p className="text-xs text-slate-400 font-medium italic opacity-60">No written comment provided.</p>
        )}
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const isCompanyOwner = profile?.agentAccountType === 'company_admin';
  
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
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-900 min-h-screen pb-2">
      {/* FIXED TOP NAV */}
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-lg mx-auto bg-white dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 -ml-2 bg-[#F8F8FF] dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-600 dark:text-white tracking-tight">Reviews & Feedback</h1>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">customer feedback analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+6rem)] px-1.5 mx-auto max-w-lg w-full space-y-6">

      {/* Rating & Breakdown */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50">
        <div className="flex gap-5 sm:gap-8">
          {/* Left: Rating Summary */}
          <div className="flex flex-col items-center justify-center shrink-0 border-r border-slate-100 dark:border-slate-800 pr-5 sm:pr-8">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 capitalize tracking-[0.2em] mb-1">Rating</p>
            <div className="flex items-baseline gap-1">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{stats.total === 0 ? '0.0' : (stats.average || Number(profile?.rating || 0).toFixed(1))}</h2>
              <span className="text-xs font-bold text-slate-400">/5</span>
            </div>
            <div className="flex gap-0.5 mt-1.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-3 h-3 ${s <= Math.round(Number(stats.total === 0 ? 0 : (stats.average || profile?.rating || 0))) ? 'fill-primary text-primary' : 'text-slate-300 dark:text-slate-600'}`} />
              ))}
            </div>
            <p className="text-[9px] text-slate-400 mt-1.5 font-medium">{stats.total} review{stats.total !== 1 ? 's' : ''}</p>
          </div>

          {/* Right: Breakdown Bars */}
          <div className="flex-1 space-y-2 justify-center flex flex-col">
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
              [5, 4, 3, 2, 1].map(s => (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-[9px] font-bold text-slate-400 w-3">{s}★</span>
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <span className="text-[9px] font-bold text-slate-400 w-6 text-right">0%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4 pt-1 !mt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 capitalize tracking-[0.2em]">Recent Feedback</h3>
          <div className="px-2 py-1 bg-primary/10 rounded-lg">
            <span className="text-[10px] font-bold text-primary capitalize">{stats.total} reviews</span>
          </div>
        </div>

        {isLoadingReviews ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-[10px] font-bold capitalize tracking-widest">Loading History...</p>
          </div>
        ) : recentReviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No Reviews"
            subtitle="Complete more missions to start receiving feedback from the community."
          />
        ) : (
          <div className="grid gap-4 grid-cols-1">
            {recentReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
