/**
 * Reviews Page — Displays customer feedback and ratings for the agent
 */
import { useEffect } from 'react';
import { Star, MessageSquare, ArrowLeft, User, Calendar, Tag, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore, useAuthStore, getThumbnailUrl } from '@cleanflow/core';
import EmptyState from '@cleanflow/ui/components/EmptyState';

export default function ReviewsPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { recentReviews, fetchReviews, isLoadingReviews } = useAgentStore();

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        </button>
        <div>
          <h1 className="text-xl font-semibold dark:text-white">Reviews & Feedback</h1>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Your Performance History</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card bg-gradient-to-br from-primary to-green-600 p-6 text-white overflow-hidden relative">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80 font-medium">Average Rating</p>
            <h2 className="text-4xl font-semibold mt-1 flex items-baseline gap-2">
              {profile?.rating || '5.0'}
              <span className="text-lg font-semibold opacity-60">/ 5.0</span>
            </h2>
          </div>
          <div className="text-right">
            <Star className="w-12 h-12 text-yellow-300 fill-yellow-300" />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm dark:text-white px-1">Recent Feedback ({recentReviews.length})</h3>

        {isLoadingReviews ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
             <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
             <p className="text-sm font-medium">Fetching feedback...</p>
          </div>
        ) : recentReviews.length === 0 ? (
          <EmptyState 
            icon={MessageSquare}
            title="No reviews yet"
            subtitle="Complete more jobs and provide great service to earn ratings from your customers!"
          />
        ) : (
          recentReviews.map((review) => (
            <div key={review.id} className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-primary/20 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                    {review.customerAvatar ? (
                      <img src={getThumbnailUrl(review.customerAvatar, { width: 200 })} loading="lazy" alt={review.customerName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm dark:text-white leading-none">{review.customerName}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 dark:text-slate-700'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-300 dark:text-slate-600 uppercase tracking-tighter">• {review.date}</span>
                    </div>
                  </div>
                </div>
                <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-md">
                   <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none">id: {review.id.slice(0,8)}</p>
                </div>
              </div>

              {review.feedback ? (
                <div className="relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-primary/20 rounded-full"></div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic pl-4 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                    "{review.feedback}"
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic">No detailed comment provided.</p>
              )}

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  <Tag className="w-3 h-3" /> {review.wasteType || 'General Waste'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
