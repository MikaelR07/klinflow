import React from 'react';
import { Recycle } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = "Syncing with Klinflow..." }: LoadingScreenProps) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center animate-fade-in overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] animate-pulse" />

      <div className="relative flex flex-col items-center">
        {/* Floating Icon Container */}
        <div className="relative w-28 h-28 flex items-center justify-center animate-bounce-slow">
          
          {/* Outer Ring Pulse */}
          <div className="absolute inset-0 rounded-[2.5rem] border-2 border-primary/20 animate-ping [animation-duration:3s]" />
          <div className="absolute inset-2 rounded-[2rem] border-2 border-primary/40 animate-ping [animation-duration:2s]" />

          {/* Main Icon Card */}
          <div className="relative w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none border border-slate-200/50 dark:border-slate-800 flex items-center justify-center z-10 overflow-hidden group">
            
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-50" />
            
            {/* The Icon */}
            <Recycle 
              className="w-10 h-10 text-primary animate-pulse" 
              strokeWidth={2.5} 
            />

            {/* Liquid Wave Effect at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20 animate-pulse" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="mt-12 text-center space-y-3 z-10">
          <div className="flex flex-col items-center">
             <h2 className="text-sm font-black tracking-[0.4em] text-slate-900 dark:text-white uppercase mb-1">
                {message}
             </h2>
             <p className="text-xs font-bold text-primary animate-pulse tracking-widest uppercase">
               Sustainomics AI Active
             </p>
          </div>
          
          {/* Progress Bar Placeholder */}
          <div className="w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-primary w-1/2 rounded-full animate-progress-indefinite" />
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-12 flex flex-col items-center gap-1 opacity-40">
        <div className="flex items-center gap-2 mb-1">
           <div className="w-1.5 h-1.5 rounded-full bg-primary" />
           <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Klinflow Logistics</p>
           <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">OPTIMIZING CIRCULAR ECONOMY</p>
      </div>

      {/* Add Custom Keyframes if not in CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress-indefinite {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-progress-indefinite {
          animation: progress-indefinite 2s infinite linear;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}} />
    </div>
  );
};

interface SpinnerProps {
  className?: string;
  color?: string;
}

export const Spinner = ({ className = "w-6 h-6", color = "text-primary" }: SpinnerProps) => (
  <Recycle className={`${className} ${color} animate-spin-slow`} />
);
