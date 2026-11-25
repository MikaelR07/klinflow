import { useState, useEffect, useMemo } from 'react';
import { Star, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';

function formatReviewDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function ReviewCard({ review, isCompanyOwner }: { review: any; isCompanyOwner?: boolean }) {
  return (
    <div
      className={`bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3.5 space-y-2 ${
        isCompanyOwner ? 'h-full flex flex-col justify-between' : ''
      }`}
    >
      {/* Top Row: Reviewer Info + Stars below name, Date on top right */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-slate-200/70 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600">
            {review.customerAvatar ? (
              <img
                src={getThumbnailUrl(review.customerAvatar, { width: 100 })}
                className="w-full h-full object-cover"
                alt={review.customerName}
              />
            ) : (
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {review.customerName?.charAt(0)?.toUpperCase() || 'C'}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-[13px] font-bold text-slate-900 dark:text-white truncate leading-tight">
              {review.customerName || 'Customer'}
            </h4>
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${
                    s <= review.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <span className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 tabular-nums shrink-0 mt-0.5">
          {formatReviewDate(review.date)}
        </span>
      </div>

      {/* Review Content */}
      <div>
        {review.feedback ? (
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {review.feedback}
          </p>
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            No written comment provided.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const isCompanyOwner = profile?.agentAccountType === 'company_admin';
  const [starFilter, setStarFilter] = useState<'all' | '5' | '4' | 'low'>('all');

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
    if (total === 0) return { breakdown: [], total: 0, average: '0.0', positivePct: 0 };

    const counts = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1
    let sum = 0;
    let positive = 0;

    recentReviews.forEach((r: any) => {
      const idx = Math.min(4, Math.max(0, 5 - Math.round(r.rating)));
      counts[idx] = (counts[idx] ?? 0) + 1;
      sum += r.rating;
      if (r.rating >= 4) positive++;
    });

    return {
      total,
      average: (sum / total).toFixed(1),
      positivePct: Math.round((positive / total) * 100),
      breakdown: counts.map((c, i) => ({
        stars: 5 - i,
        count: c,
        percentage: (c / total) * 100
      }))
    };
  }, [recentReviews]);

  const filteredReviews = useMemo(() => {
    if (starFilter === 'all') return recentReviews;
    if (starFilter === '5') return recentReviews.filter((r: any) => Math.round(r.rating) === 5);
    if (starFilter === '4') return recentReviews.filter((r: any) => Math.round(r.rating) === 4);
    return recentReviews.filter((r: any) => Math.round(r.rating) <= 3);
  }, [recentReviews, starFilter]);

  const displayRating = stats.total === 0 ? '0.0' : (stats.average || Number(profile?.rating || 0).toFixed(1));

  return (
    <div className="-mx-1 bg-white dark:bg-slate-800  pb-10 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3 px-4 flex items-center justify-between relative">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              Reviews & Feedback
            </h1>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">
              Customer feedback & ratings
            </p>
          </div>
          <div className="w-10 h-10" />
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+4.75rem)] px-2 mx-auto max-w-lg w-full space-y-5">

        {/* ── RATING SUMMARY & BREAKDOWN HERO ── */}
        <div className="bg-gradient-to-br from-[#1178ab] to-[#085078] rounded-3xl p-5 text-white border border-sky-400/30  relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-sky-400/20 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

          <div className="flex gap-5 sm:gap-7 relative z-10 items-center">
            {/* Left: Rating Summary */}
            <div className="flex flex-col items-center justify-center shrink-0 border-r border-white/15 pr-5 sm:pr-7">
              <p className="text-[10px] font-bold text-sky-100/80 uppercase tracking-widest mb-1">
                Overall
              </p>
              <div className="flex items-baseline gap-1">
                <h2 className="text-4xl font-bold tracking-tight tabular-nums text-white leading-none">
                  {displayRating}
                </h2>
                <span className="text-sm font-bold text-sky-100/75">/5</span>
              </div>
              <div className="flex gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= Math.round(Number(displayRating))
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-white/25'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-sky-100/85 mt-1.5 font-semibold">
                {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Right: Breakdown Bars */}
            <div className="flex-1 space-y-1.5">
              {(stats.breakdown.length > 0
                ? stats.breakdown
                : [5, 4, 3, 2, 1].map(stars => ({ stars, count: 0, percentage: 0 }))
              ).map((item) => (
                <div key={item.stars} className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-sky-100/90 w-4 tabular-nums">{item.stars}★</span>
                  <div className="flex-1 h-1.5 bg-black/25 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-700"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-[10.5px] font-bold text-white/90 w-8 text-right tabular-nums">
                    {Math.round(item.percentage)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {stats.total > 0 && (
            <div className="relative z-10 mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[11px]">
              <span className="text-sky-100/80 font-medium">Positive rating (4–5★)</span>
              <span className="font-bold text-emerald-300 tabular-nums">{stats.positivePct}% positive</span>
            </div>
          )}
        </div>

        {/* ── RECENT FEEDBACK ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
                Recent Feedback
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Verified customer ratings from pickups
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
              {filteredReviews.length}
            </span>
          </div>

          {/* Filter Pills */}
          {recentReviews.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: 'all', label: 'All' },
                { id: '5', label: '5 ★' },
                { id: '4', label: '4 ★' },
                { id: 'low', label: '3 ★ & below' },
              ].map(tab => {
                const isActive = starFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStarFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                      isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {isLoadingReviews ? (
            <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading feedback...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="py-12 px-4 text-center bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2.5">
                <MessageSquare className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {recentReviews.length === 0 ? 'No Reviews Yet' : 'No Matching Reviews'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-[240px] mx-auto">
                {recentReviews.length === 0
                  ? 'Complete more pickups to start receiving feedback from customers.'
                  : 'Try selecting another rating filter above.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-2 grid-cols-1">
              {filteredReviews.map((review: any) => (
                <ReviewCard key={review.id} review={review} isCompanyOwner={isCompanyOwner} />
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
