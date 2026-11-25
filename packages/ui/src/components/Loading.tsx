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

      {/* Fixed Center Dual-Arc Orbital Spinner */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center"
        aria-label="Loading"
      >
        <div
          className="absolute inset-0 rounded-full border-[2.5px] border-white/15 border-t-white border-r-white/70"
          style={{ animation: 'orbit-spin 0.95s cubic-bezier(0.55, 0.2, 0.35, 0.85) infinite' }}
        />
        <div
          className="absolute inset-[9px] rounded-full border-2 border-transparent border-b-emerald-300 border-l-emerald-300/50"
          style={{ animation: 'orbit-spin-reverse 1.35s linear infinite' }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(110,231,183,0.9)]"
          style={{ animation: 'core-pulse 1.5s ease-in-out infinite' }}
        />
        <style>{`
          @keyframes orbit-spin { to { transform: rotate(360deg); } }
          @keyframes orbit-spin-reverse { to { transform: rotate(-360deg); } }
          @keyframes core-pulse { 0%, 100% { transform: scale(0.85); opacity: 0.7; } 50% { transform: scale(1.25); opacity: 1; } }
        `}</style>
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