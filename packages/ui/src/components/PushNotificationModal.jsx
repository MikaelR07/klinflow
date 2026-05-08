import React, { useState } from 'react';
import { Bell, ShieldCheck, Sparkles, X, Loader2, Info } from 'lucide-react';
import { useNotificationStore } from '@cleanflow/core';
import { toast } from 'sonner';

export default function PushNotificationModal({ isOpen, onClose }) {
  const { subscribeToPush } = useNotificationStore();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleEnable = async () => {
    setIsProcessing(true);
    try {
      // This will trigger the native browser popup
      const success = await subscribeToPush();
      
      if (success) {
        toast.success("Mission Alerts Live!", { 
          description: "You'll now receive instant mission updates." 
        });
      } else {
        // Even if they denied it, we close our modal to avoid being annoying
        console.warn('[Push] Permission was likely denied or failed.');
      }
      
      // Auto-close regardless of outcome to respect user flow
      onClose();
    } catch (err) {
      console.error(err);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-fade-in" 
        onClick={onClose} 
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up border border-slate-100 dark:border-white/5 p-8 text-center">
        
        {/* Visual Header */}
        <div className="relative w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
           <Bell className="w-10 h-10 text-emerald-600 animate-bounce" />
           <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white dark:border-slate-900" />
        </div>

        {/* Text Content */}
        <div className="space-y-3">
           <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Enable Mission Alerts?</h3>
           <p className="text-xs text-slate-500 font-bold leading-relaxed px-2">
             Get real-time updates on your missions, payouts, and hero points directly on your phone's lock screen.
           </p>
        </div>

        {/* Feature List */}
        <div className="mt-8 space-y-3">
           <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Instant Mission Dispatches</p>
           </div>
           <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl text-left">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Reward & Payout Alerts</p>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 space-y-4">
           <button 
             onClick={handleEnable}
             disabled={isProcessing}
             className="w-full py-5 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
           >
             {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Turn On Alerts'}
           </button>
           
           <button 
             onClick={onClose}
             className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
           >
             Maybe Later
           </button>
        </div>

        {/* Privacy Note */}
        <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
           <Info className="w-3 h-3" />
           <p className="text-[9px] font-bold">You can disable this anytime in settings.</p>
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600">
           <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
