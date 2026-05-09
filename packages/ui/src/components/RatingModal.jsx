import React, { useState } from 'react';
import { Star, X, Send, Heart, MessageSquare, ArrowRight } from 'lucide-react';

export default function RatingModal({ isOpen, onClose, onSubmit, onSkip, agentName = 'your agent' }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    await onSubmit(rating, feedback);
    setIsSubmitting(false);
    onClose();
  };

  const handleSkip = () => {
    onSkip?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="relative p-6 text-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
          
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce-subtle">
            <Heart className="w-10 h-10 text-emerald-500" />
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
            Clean-up Complete!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 px-6 leading-relaxed">
            How was your experience with <span className="font-bold text-emerald-500">{agentName}</span> today?
          </p>
        </div>

        {/* Stars */}
        <div className="px-6 pb-6 pt-2 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
              className="group transition-transform active:scale-90 p-1"
            >
              <Star 
                className={`w-10 h-10 transition-all duration-200 ${
                  (hover || rating) >= star 
                    ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-sm' 
                    : 'text-slate-200 dark:text-slate-700'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Feedback Input */}
        {rating > 0 && (
          <div className="px-8 pb-6 animate-in slide-in-from-top-4 duration-300">
            <div className="relative">
              <MessageSquare className="absolute top-4 left-3 w-4 h-4 text-slate-300" />
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional: What went well? (or what could be better?)"
                className="w-full h-24 pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none dark:text-white"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 text-right italic font-medium">Your feedback helps improve our community.</p>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Skip for now
          </button>
          
          <button
            disabled={rating === 0 || isSubmitting}
            onClick={handleSubmit}
            className={`flex-[2] py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              rating === 0 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 saturate-50' 
                : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:scale-[1.02] active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Submit Experience <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
