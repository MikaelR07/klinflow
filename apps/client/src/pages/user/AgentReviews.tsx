/**
 * AgentReviews — All reviews for a specific agent (resident-facing)
 * Currently uses mock data; will be made dynamic later.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Star, ChevronDown, Clock, Check, AlertCircle
} from 'lucide-react';

const MOCK_REVIEWS = [
  {
    id: 'r1',
    customerName: 'Mary Wanjiku',
    rating: 5,
    date: '2 days ago',
    time: '10:34 AM',
    feedback: 'Very reliable and professional. Came on time and handled everything smoothly. Would highly recommend to anyone looking for a trustworthy agent.',
  },
  {
    id: 'r2',
    customerName: 'James O.',
    rating: 5,
    date: '1 week ago',
    time: '2:15 PM',
    feedback: 'Great service! The agent was very friendly and helped me sort out my recyclables. Will definitely use them again.',
  },
  {
    id: 'r3',
    customerName: 'Aisha M.',
    rating: 4,
    date: '2 weeks ago',
    time: '9:00 AM',
    feedback: 'Good experience overall. Arrived a bit later than expected but was very polite and thorough with the pickup.',
  },
  {
    id: 'r4',
    customerName: 'Brian K.',
    rating: 5,
    date: '3 weeks ago',
    time: '11:20 AM',
    feedback: 'Excellent! Very organized and efficient. The agent separated all the materials perfectly.',
  },
  {
    id: 'r5',
    customerName: 'Grace N.',
    rating: 3,
    date: '1 month ago',
    time: '4:45 PM',
    feedback: 'Service was okay. Could improve on communication — I had to call twice to confirm the pickup time.',
  },
  {
    id: 'r6',
    customerName: 'Peter W.',
    rating: 5,
    date: '1 month ago',
    time: '8:30 AM',
    feedback: null,
  },
];

function ReviewCard({ review }: { review: typeof MOCK_REVIEWS[0] }) {
  const isPositive = review.rating >= 4;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.25rem] shadow-sm overflow-hidden p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base shrink-0">
            {review.customerName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-md flex items-center justify-center ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                {isPositive ? <Check className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white tracking-tight">{review.customerName}</h4>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-2.5 h-2.5 ${s <= review.rating ? 'fill-primary text-primary' : 'text-slate-200 dark:text-slate-700'}`} />
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
      </div>

      <div className="pl-4 border-l-2 border-primary/20 bg-slate-50/50 dark:bg-white/5 p-3 rounded-r-xl">
        {review.feedback ? (
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
            "{review.feedback}"
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

  const stats = (() => {
    const total = MOCK_REVIEWS.length;
    const counts = [0, 0, 0, 0, 0];
    let sum = 0;
    MOCK_REVIEWS.forEach(r => {
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
            {MOCK_REVIEWS.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
