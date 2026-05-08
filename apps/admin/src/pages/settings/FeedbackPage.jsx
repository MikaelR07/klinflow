import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Star, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function FeedbackPage() {
  const navigate = useNavigate();
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
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Thank You!', { description: 'Your feedback helps us improve CleanFlow.' });
    navigate('/settings');
  };

  return (
    <div className="animate-slide-up pb-20">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold dark:text-white">Give Feedback</h1>
      </header>

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
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Feedback Category</label>
             <select 
               value={category} 
               onChange={(e) => setCategory(e.target.value)} 
               className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 text-sm appearance-none"
             >
               {categories.map((cat) => (
                 <option key={cat} value={cat}>{cat}</option>
               ))}
             </select>
           </div>

           <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Your Thoughts</label>
             <textarea 
               required 
               rows={5} 
               value={feedback} 
               onChange={(e) => setFeedback(e.target.value)} 
               placeholder="What do you think we can improve?" 
               className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 text-sm resize-none" 
             />
           </div>

           <button type="submit" disabled={isLoading} className="w-full py-4 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2">
             {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-1" />} Submit Feedback
           </button>
        </div>

      </form>
    </div>
  );
}
