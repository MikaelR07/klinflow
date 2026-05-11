import { useState } from 'react';
import { useBookingStore, useAuthStore } from '@cleanflow/core';
import { CheckCircle, Truck, Star, X, Wallet, ArrowRight, ShieldCheck, Heart, Scale } from 'lucide-react';
import { toast } from 'sonner';

export default function WeightVerificationModal() {
  const { role } = useAuthStore();
  const { activeVerificationBooking, verifyWeight, clearActiveVerification, submitAgentRating } = useBookingStore();
  const [step, setStep] = useState('verify'); // 'verify' | 'rate' | 'done'
  const [rating, setRating] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!activeVerificationBooking) return null;

  const handleVerify = async () => {
    setIsProcessing(true);
    try {
      await verifyWeight(activeVerificationBooking.id);
      toast.success('Weight Verified!', {
        description: 'Thank you for confirming the collection details.'
      });
      setStep('rate');
    } catch (err) {
      toast.error('Verification Failed', { description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRate = async () => {
    if (rating === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      await submitAgentRating(activeVerificationBooking.id, rating);
      setStep('done');
      
      // OPTIMISTIC UPDATE: Clear immediately to prevent re-popups
      setTimeout(() => {
        clearActiveVerification();
        // Reset local state for next time
        setStep('verify');
        setRating(0);
        setIsProcessing(false);
      }, 1200);
    } catch (err) {
      toast.error('Rating failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={clearActiveVerification} />
      
      <div className="relative w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-6 pb-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Digital Weight Verification</span>
          </div>
          {step === 'verify' && (
             <button onClick={clearActiveVerification} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
               <X className="w-4 h-4 text-slate-400" />
             </button>
          )}
        </div>

        <div className="p-8 text-center">
          {step === 'verify' && (
            <div className="space-y-6">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/40">
                  <Scale className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg ring-4 ring-white dark:ring-slate-900">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white leading-tight tracking-tighter">Collection Verified</h3>
                <p className="text-xs text-slate-400 mt-2 font-semibold px-2 leading-relaxed">
                  The agent has logged <span className="text-primary font-semibold">{activeVerificationBooking.actual_weight_kg || 0}kg</span> of {activeVerificationBooking.waste_type || 'Recyclables'}.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-5 border border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Earnings Earned</span>
                  <span className="text-base font-semibold text-slate-900 dark:text-white font-mono">KSh {(activeVerificationBooking.total_price || 0).toLocaleString()}</span>
                </div>
                <div className="h-px bg-slate-200/50 dark:bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest">Impact Reward</span>
                  <span className={`text-2xl font-semibold font-mono ${role === 'seller' ? 'text-slate-300 dark:text-slate-600' : 'text-primary'}`}>
                    {role === 'seller' ? 'NONE' : `${(activeVerificationBooking.actual_weight_kg || 0) * 2} GFP`}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleVerify}
                disabled={isProcessing}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-semibold text-[12px] uppercase tracking-widest shadow-xl shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {isProcessing ? 'Verifying...' : (
                  <>Confirm & Verify Weight <CheckCircle className="w-4 h-4" /></>
                )}
              </button>
              
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest opacity-60">Verified weight ensures fair payout</p>
            </div>
          )}

          {step === 'rate' && (
            <div className="space-y-6 py-4">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-10 h-10 text-amber-500 animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white leading-tight">Rate your Agent</h3>
                <p className="text-xs text-slate-400 mt-2 font-semibold">How was your pickup experience today?</p>
              </div>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform active:scale-90"
                  >
                    <Star className={`w-8 h-8 ${rating >= star ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-700'}`} />
                  </button>
                ))}
              </div>

              <button 
                onClick={handleRate}
                disabled={rating === 0}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-semibold text-[12px] uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                Submit Rating
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-6 py-10 animate-fade-in">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">All Set!</h3>
                <p className="text-xs text-slate-400 mt-2 font-semibold">Thank you for helping keep Kenya clean.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
