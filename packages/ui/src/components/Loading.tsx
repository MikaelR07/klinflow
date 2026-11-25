import React from 'react';
import { Recycle } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  backgroundImage?: string;
  tagline?: string;
}

export const LoadingScreen = ({
  message = "Loading",
  backgroundImage,
  tagline,
}: LoadingScreenProps) => {
  const isAgentApp = typeof document !== 'undefined' && document.title.toLowerCase().includes('agent');
  const resolvedBg = backgroundImage ?? (isAgentApp ? '/welcome/login.webp' : '/welcome/loading.webp');
  const resolvedTagline = tagline ?? (isAgentApp ? 'Source · Collect · Deliver' : 'Connect · Collect · Earn');

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-emerald-950 transition-opacity duration-300">
      {/* Full-screen Splash Image */}
      <img
        src={resolvedBg}
        alt="Loading background"
        fetchPriority="high"
        decoding="sync"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
      />

      {/* Minimal Scrim for Legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.12) 100%)',
        }}
      />

      {/* Fixed Center Animated Cog-Line Spinner */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-11 h-11"
        aria-label="Loading"
      >
        <div className="relative w-full h-full animate-[spin_6s_linear_infinite]">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 left-1/2 w-[3px] -ml-[1.5px] rounded-full bg-white"
              style={{
                height: '11px',
                transform: `rotate(${i * 30}deg)`,
                transformOrigin: '1.5px 22px',
                animation: `cog-fade 1.2s linear infinite`,
                animationDelay: `${-1.1 + i * 0.1}s`,
              }}
            />
          ))}
        </div>
        <style>{`@keyframes cog-fade { 0%, 100% { opacity: 1; height: 12px; } 50% { opacity: 0.2; height: 8px; } }`}</style>
      </div>

      {/* Bottom Status & Tagline (No Klinflow text, already in image) */}
      <div
        className="fixed left-0 right-0 z-20 flex flex-col items-center text-center px-6 gap-1.5"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 16px) + 44px)' }}
      >
        <p className="text-[13px] font-bold text-white uppercase tracking-[0.14em] drop-shadow">
          {message}
        </p>
        <p className="text-[13px] font-semibold text-white/90 tracking-wider drop-shadow">
          {resolvedTagline}
        </p>
      </div>
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