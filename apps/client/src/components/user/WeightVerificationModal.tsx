import { useState, useEffect } from 'react';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { Star, X, Heart, Scale, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WeightVerificationModal() {
  const { activeVerificationBooking, clearActiveVerification, submitAgentRating } = useBookingStore();
  const [step, setStep] = useState<'rate' | 'done'>('rate');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when a new booking arrives
  useEffect(() => {
    if (activeVerificationBooking) {
      setStep('rate');
      setRating(0);
      setComment('');
    }
  }, [activeVerificationBooking?.id]);

  if (!activeVerificationBooking) return null;

  const handleRate = async () => {
    if (rating === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      await submitAgentRating(activeVerificationBooking.id, rating, comment);
      setStep('done');
      
      // Auto-close after a delay
      const timer = setTimeout(() => {
        clearActiveVerification();
      }, 2500); // 2.5s for a nice smooth exit

      return () => clearTimeout(timer);
    } catch (err) {
      toast.error('Submission Failed', { description: 'Please try again later' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-zoom-in">
        <div className="p-8">
          
          {step === 'rate' && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Star className="w-7 h-7 fill-white" />
                </div>
                <button onClick={clearActiveVerification} className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight capitalize">Rate your Experience</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Your agent has completed the collection. How was the service?</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 capitalize tracking-widest leading-none">Measured Weight</p>
                    <p className="text-lg font-black dark:text-white mt-1">{activeVerificationBooking.actualWeightKg || activeVerificationBooking.weightKg || 0} KG</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3 py-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      rating >= s 
                        ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/30 scale-110' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Star className={`w-6 h-6 ${rating >= s ? 'fill-white' : ''}`} />
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 capitalize tracking-[0.2em] ml-1">Comments (Optional)</label>
                <textarea
                  placeholder="Tell us more about the service..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-semibold text-sm outline-none focus:border-primary min-h-[100px] resize-none transition-all"
                />
              </div>

              <button
                onClick={handleRate}
                disabled={rating === 0 || isProcessing}
                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-bold text-sm capitalize tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center space-y-6 py-8 animate-bounce-in">
              <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/40">
                <Heart className="w-10 h-10 fill-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white capitalize tracking-tight">All Set!</h3>
                <p className="text-xs text-slate-400 mt-2 font-semibold">Thank you for helping keep Kenya clean.</p>
              </div>
              
              <button
                onClick={clearActiveVerification}
                className="mt-4 px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs capitalize tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

