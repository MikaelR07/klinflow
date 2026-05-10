import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Star, Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore, useFeedbackStore, useSystemStore } from '@cleanflow/core';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [category, setCategory] = useState('UI / App Experience');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { profile } = useAuthStore();
  const { submitFeedback } = useFeedbackStore();
  const { whatsappNumber } = useSystemStore();
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);

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
        name: profile?.name,
        phone: profile?.phone,
        rating,
        category,
        text: feedback
      });

      if (rating <= 2 && category === 'Reporting Issues') {
        setShowWhatsAppPrompt(true);
        return;
      }

      if (rating === 5) {
        toast.success('We love you too!', { description: 'Consider rating us on the App Store.' });
      } else {
        toast.success('Thank You!', { description: 'Your feedback helps us improve CleanFlow.' });
      }
      
      setTimeout(() => navigate('/settings'), 1500);
    } catch (err) {
      toast.error('Submission Failed', { description: 'Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up pb-20 px-2">
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

      {/* WhatsApp Fallback Prompt */}
      {showWhatsAppPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[320px] rounded-[28px] overflow-hidden shadow-2xl animate-scale-in border border-slate-100 dark:border-slate-800 p-6 space-y-4 text-center">
             <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
               <MessageCircle className="w-8 h-8" />
             </div>
             <h3 className="font-semibold text-lg dark:text-white">We're so sorry!</h3>
             <p className="text-sm text-slate-500 leading-relaxed">
               Your feedback has been recorded. Would you like to chat with support on WhatsApp right now to resolve this reporting issue?
             </p>
             <div className="pt-2 space-y-2">
               <a 
                 href={`https://wa.me/${whatsappNumber}?text=Hi, I am experiencing an issue with CleanFlow.`}
                 target="_blank" rel="noreferrer"
                 onClick={() => navigate('/settings')}
                 className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-semibold text-sm block"
               >
                 Chat on WhatsApp
               </a>
               <button 
                 onClick={() => navigate('/settings')}
                 className="w-full py-3 text-slate-500 dark:text-slate-400 font-semibold text-sm"
               >
                 No, Thanks
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
