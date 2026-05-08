import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { useAssetStore } from '@cleanflow/core';

export default function ImpactTicker() {
  const { assets } = useAssetStore();
  const [index, setIndex] = useState(0);

  // Simulated live events if store is empty for demo
  const mockEvents = [
    { type: 'verify', msg: "Verified: 24kg PET in Westlands", icon: CheckCircle2, color: "text-emerald-500" },
    { type: 'match', msg: "Matched: Asset #802 claimed by Weaver", icon: Target, color: "text-indigo-500" },
    { type: 'value', msg: "Market Pulse: HDPE prices up +2.1%", icon: TrendingUp, color: "text-blue-500" },
    { type: 'impact', msg: "Total Impact: 12.4 Tons Recycled Today", icon: Zap, color: "text-amber-500" },
  ];

  const displayEvents = assets.length > 0 
    ? assets.slice(-5).map(a => ({
        type: 'verify',
        msg: `Verified: ${a.weight}kg ${a.material_type} in Nairobi`,
        icon: CheckCircle2,
        color: "text-emerald-500"
      }))
    : mockEvents;

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % displayEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [displayEvents.length]);

  const current = displayEvents[index];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.9 }}
          className="bg-slate-900/90 dark:bg-black/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 min-w-[320px] pointer-events-auto"
        >
          <div className={`p-1.5 rounded-lg bg-white/5 ${current.color}`}>
            <current.icon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-0.5">Network Live</p>
            <p className="text-xs font-semibold text-white tracking-tight leading-none">{current.msg}</p>
          </div>
          <div className="flex items-center gap-1.5 ml-4">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] font-semibold text-emerald-500 uppercase tracking-widest">Live</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
