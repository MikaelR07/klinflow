import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedbackStore } from '@klinflow/core/stores/feedbackStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ArrowLeft, Loader2, Star, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { submitFeedback } = useFeedbackStore();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [category, setCategory] = useState('UI / App Experience');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['UI / App Experience', 'Pickup Services', 'HygeneX AI', 'Reporting Issues', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Missing Rating', { description: 'Please select a star rating.' });
      return;
    }
    
    setIsLoading(true);
    try {
      await submitFeedback({
        userId: profile?.id,
        name: profile?.name || 'Agent',
        phone: profile?.phone,
        rating,
        category,
        text: feedback,
        sourceApp: profile?.agentAccountType === 'company_admin' ? 'agent_company' : 'agent_independent'
      });
      toast.success('Thank You!', { description: 'Your feedback helps us improve Klinflow.' });
      navigate('/settings');
    } catch (err) {
      toast.error('Submission Failed', { description: 'Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1.25rem)] pb-4 px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/settings')} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 dark:text-white" />
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none mb-1">Give Feedback</h1>
            <p className="text-[10px] font-bold text-primary capitalize tracking-[0.2em]">Share Your Experience</p>
          </div>
        </div>
      </div>

      <div className="w-full pt-[calc(env(safe-area-inset-top,1rem)+5.5rem)] pb-24 px-1.5 space-y-6 max-w-lg mx-auto">

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Rating Selector */}
        <div className="card p-6 text-center">
           <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Rate Your Experience</h2>
           <div className="flex justify-center gap-2">
             {[1, 2, 3, 4, 5].map((star) => (
               <button
                 key={star}
                 type="button"
                 onMouseEnter={() => setHoveredRating(star)}
                 onMouseLeave={() => setHoveredRating(0)}
                 onClick={() => setRating(star)}
                 className="p-1 transition-transform hover:scale-110 focus:outline-none"
               >
                 <Star 
                   className={`w-10 h-10 transition-colors ${
                     (hoveredRating || rating) >= star 
                       ? 'fill-amber-400 text-amber-400' 
                       : 'text-slate-300 dark:text-slate-700'
                   }`} 
                 />
               </button>
             ))}
           </div>
        </div>

        {/* Details Form */}
        <div className="card p-5 space-y-4">
           <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 capitalize tracking-wider">Feedback Category</label>
             <select 
               value={category} 
               onChange={(e) => setCategory(e.target.value)} 
               className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 text-sm appearance-none"
             >
               {categories.map((cat) => (
                 <option key={cat} value={cat}>{cat}</option>
               ))}
             </select>
           </div>

           <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 capitalize tracking-wider">Your Thoughts</label>
             <textarea 
               required 
               rows={5} 
               value={feedback} 
               onChange={(e) => setFeedback(e.target.value)} 
               placeholder="What do you think we can improve?" 
               className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 text-sm resize-none" 
             />
           </div>

           <button type="submit" disabled={isLoading} className="w-full py-4 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2">
             {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-1" />} Submit Feedback
           </button>
        </div>

      </form>
      </div>
    </div>
  );
}
