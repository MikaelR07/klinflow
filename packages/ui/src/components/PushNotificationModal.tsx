import React, { useState } from 'react';
import { Bell, ShieldCheck, Sparkles, X, Loader2, Info } from 'lucide-react';
import { useNotificationStore } from '@klinflow/core';
import { toast } from 'sonner';

interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PushNotificationModal({ isOpen, onClose }: PushNotificationModalProps) {
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
        className="absolute inset-0 bg-slate-900/60 animate-fade-in" 
        onClick={onClose} 
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-[320px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-slate-100 dark:border-white/5 p-6 text-center">
        
        {/* Visual Header */}
        <div className="relative w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
           <Bell className="w-7 h-7 text-emerald-600 animate-bounce" />
           <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-slate-900" />
        </div>

        {/* Text Content */}
        <div className="space-y-2">
           <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Mission Alerts?</h3>
           <p className="text-[10px] text-slate-500 font-bold leading-relaxed px-4">
             Get real-time updates on your missions and payouts directly on your lock screen.
           </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
           <button 
             onClick={handleEnable}
             disabled={isProcessing}
             className="w-full py-4 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
           >
             {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Turn On Alerts'}
           </button>
           
           <button 
             onClick={onClose}
             className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
           >
             Maybe Later
           </button>
        </div>

        {/* Privacy Note */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-300">
           <Info className="w-2.5 h-2.5" />
           <p className="text-[9px] font-bold">You can disable this anytime in settings.</p>
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-200 hover:text-slate-400">
           <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
