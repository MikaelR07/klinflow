import React from 'react';
import { Recycle } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({
  message = "Loading...",
}: LoadingScreenProps) => {
  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(to bottom right, hsl(153, 100%, 33%), #059669, #065f46)' }}
    >

      {/* Subtle Intersecting Circles in Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute w-[300px] h-[300px] rounded-full border border-white translate-y-[-100px]" />
        <div className="absolute w-[350px] h-[350px] rounded-full border border-white translate-y-[100px]" />
      </div>

      {/* Noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full px-6 -mt-16">

        {/* Minimalist Floating Loader */}
        <div className="relative flex items-center justify-center w-40 h-40 mb-12">
          {/* Rotating Ring */}
          <div className="absolute w-full h-full rounded-full border border-white/10" />
          <div className="absolute w-full h-full rounded-full border-t-2 border-white/80 border-r-2 border-transparent border-b-2 border-transparent border-l-2 border-transparent animate-spin-slow" />

          {/* Inner Logo */}
          <img
            src="/vectors/client-app-logo.webp"
            alt="Client App Logo"
            className="absolute z-10 w-[140px] h-[140px] object-contain animate-icon-float"
          />
        </div>

        {/* High-Ranking Branding */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[28px] uppercase tracking-[0.2em] text-white/90 font-bold drop-shadow-sm">
            Klinflow
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>

        {/* New Tagline */}
        <p className="text-sm font-medium text-white/80 tracking-wide mb-8">
          Collecting.Connecting.Cleaning
        </p>

        {/* Loading Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-white animate-bounce-dot [animation-delay:0ms]" />
          <div className="w-2 h-2 rounded-full bg-white animate-bounce-dot [animation-delay:150ms]" />
          <div className="w-2 h-2 rounded-full bg-white animate-bounce-dot [animation-delay:300ms]" />
        </div>
      </div>

      {/* Bottom Text */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center w-full px-6 text-center">
        <p className="text-xs font-semibold text-white/60 tracking-widest uppercase">
          AI Powered Informal weaver Network
        </p>
      </div>

      {/* Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
              animation: spin-slow 3s linear infinite;
            }
            @keyframes icon-float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }
            .animate-icon-float {
              animation: icon-float 2.5s ease-in-out infinite;
            }
            @keyframes bounce-dot {
              0%, 80%, 100% {
                transform: scale(0.7);
                opacity: 0.4;
              }
              40% {
                transform: scale(1);
                opacity: 1;
              }
            }
            .animate-bounce-dot {
              animation: bounce-dot 1.4s infinite ease-in-out;
            }
          `,
        }}
      />
    </div>
  );
};

interface SpinnerProps {
  className?: string;
  color?: string;
}

export const Spinner = ({
  className = "w-6 h-6",
  color = "text-primary",
}: SpinnerProps) => (
  <Recycle className={`${className} ${color} animate-spin-slow`} />
);