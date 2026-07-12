import React, { useState } from 'react';
import { Star, MessageCircle, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useFeedbackStore } from '@klinflow/core/stores/feedbackStore';
import { toast } from 'sonner';

export default function Feedback() {
  const { profile } = useAuthStore();
  const submitFeedback = useFeedbackStore((s: any) => s.submitFeedback);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackCategory, setFeedbackCategory] = useState('UI / App Experience');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Missing Rating', { description: 'Please select a star rating.' });
    setIsSubmittingFeedback(true);
    try {
      if (submitFeedback) {
        await submitFeedback({
          userId: profile?.id,
          name: profile?.name || 'Agent',
          phone: profile?.phone,
          rating,
          category: feedbackCategory,
          text: feedbackText,
          sourceApp: 'hub_web'
        });
      }
      toast.success('Thank You!', { description: 'Your feedback helps us improve Klinflow.' });
      setFeedbackText('');
      setRating(0);
    } catch (err) {
      toast.error('Submission Failed', { description: 'Please try again later.' });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <>
      <div className="flex h-full w-full relative bg-transparent overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-20">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            
            <div className="flex flex-col gap-1 pb-4">
              <h1 className="text-3xl font-bold tracking-tight text-[#131722] dark:text-white">Feedback</h1>
              <p className="text-[16px] text-slate-500 dark:text-slate-400">Share your thoughts to help us improve the platform.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-6 py-5 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#131722] dark:text-white">Feedback & Suggestions</h3>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                  <div className="flex flex-col items-center justify-center py-4 border border-dashed border-[#e0e3eb] dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <p className="text-base font-bold text-[#131722] dark:text-white mb-3">How would you rate your experience?</p>
                    <div className="flex gap-2" onMouseLeave={() => setHoveredRating(0)}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star} type="button"
                          onMouseEnter={() => setHoveredRating(star)}
                          onClick={() => setRating(star)}
                          className="p-1 transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star className={`w-8 h-8 transition-colors ${(hoveredRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Feedback Category</label>
                    <select 
                      value={feedbackCategory} onChange={(e) => setFeedbackCategory(e.target.value)} 
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none appearance-none"
                    >
                      {['UI / App Experience', 'Pickup Services', 'HygeneX AI', 'Reporting Issues', 'Other'].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Your Thoughts</label>
                    <textarea required rows={2} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="What do you think we can improve?" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none resize-none" />
                  </div>
                  <button type="submit" disabled={isSubmittingFeedback} className="w-full py-3 bg-[#131722] dark:bg-white dark:text-[#131722] hover:opacity-90 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                    {isSubmittingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Feedback
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
