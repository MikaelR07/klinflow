/**
 * MarketIntel Tips Tab — Actionable Market Insights
 * Extracted from MarketIntelligenceHub.tsx
 */
import { Zap, TrendingUp, Target, Users, ArrowRight, Bell, MapPin, Award, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MarketIntelData } from './marketIntel.types';

interface MarketIntelTipsTabProps {
  marketData: MarketIntelData;
}

export default function MarketIntelTipsTab({ marketData }: MarketIntelTipsTabProps) {
  return (
    <motion.div
      key="tips-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 pb-5"
    >
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-emerald-800 to-emerald-900 dark:bg-[#0A101D] rounded-xl p-4 relative overflow-hidden shadow-sm dark:shadow-none">
        
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-900 dark:bg-emerald-900/40 rounded-full flex items-center justify-center border border-emerald-900 dark:border-emerald-500/30 shrink-0">
                  <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-200 capitalize tracking-widest leading-none mb-1">Intelligence Coach</p>
                  <h2 className="text-lg font-bold text-white tracking-tight leading-none">HygeneX Insights</h2>
                </div>
              </div>
              <h3 className="text-[11px] font-bold text-white leading-tight mb-1">
                {marketData?.insights?.length || 0} active insights available
              </h3>
              <p className="text-[11px] text-slate-50 leading-snug pr-2">
                Review market opportunities and recommendations designed to improve your collection earnings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-emerald-500/30">
            <div className="flex flex-col bg-emerald-900/40 p-2 rounded-lg border border-emerald-600">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-sm font-bold text-white leading-none">{marketData?.insights?.length || 0}</span>
              </div>
              <p className="text-[8px] font-bold text-emerald-200/80 capitalize tracking-widest">Active Insights</p>
            </div>

            <div className="flex flex-col bg-emerald-900/40 p-2 rounded-lg border border-emerald-600">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-sm font-bold text-white leading-none">92%</span>
              </div>
              <p className="text-[8px] font-bold text-emerald-200/80 capitalize tracking-widest">Confidence</p>
            </div>

            <div className="flex flex-col bg-emerald-900/40 p-2 rounded-lg border border-emerald-600">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-sm font-bold text-white leading-none">18%</span>
              </div>
              <p className="text-[8px] font-bold text-emerald-200/80 capitalize tracking-widest">Potential Upside</p>
            </div>

            <div className="flex flex-col bg-emerald-900/40 p-2 rounded-lg border border-emerald-600">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-sm font-bold text-white leading-none">High</span>
              </div>
              <p className="text-[8px] font-bold text-emerald-200/80 capitalize tracking-widest">Market Activity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="!mt-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Market Opportunities
        </h3>

        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
          Insights generated from current market activity
        </p>
      </div>

      {/* Insights List */}
      <div className="space-y-1 !mt-2">
        {!marketData?.insights || marketData.insights.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />

                <div className="flex-1 space-y-2.5">
                  <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            </div>
          ))
        ) : (
          marketData.insights.map((tip: any, i: number) => {
            const IconComponent =
              tip.iconName === 'bell'
                ? Bell
                : tip.iconName === 'mappin'
                ? MapPin
                : tip.iconName === 'trendingup'
                ? TrendingUp
                : tip.iconName === 'award'
                ? Award
                : Clock;

            const colorClassesBg =
              tip.color === 'rose'
                ? 'bg-rose-500/10 border-rose-500/20'
                : tip.color === 'indigo'
                ? 'bg-indigo-500/10 border-indigo-500/20'
                : tip.color === 'emerald'
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : tip.color === 'purple'
                ? 'bg-purple-500/10 border-purple-500/20'
                : 'bg-amber-500/10 border-amber-500/20';

            const colorClassesText =
              tip.color === 'rose'
                ? 'text-rose-500'
                : tip.color === 'indigo'
                ? 'text-indigo-500'
                : tip.color === 'emerald'
                ? 'text-emerald-500'
                : tip.color === 'purple'
                ? 'text-purple-500'
                : 'text-amber-500';

            const badgeClasses =
              tip.color === 'rose'
                ? 'bg-rose-500/10 text-rose-500'
                : tip.color === 'indigo'
                ? 'bg-indigo-500/10 text-indigo-500'
                : tip.color === 'emerald'
                ? 'bg-emerald-500/10 text-emerald-500'
                : tip.color === 'purple'
                ? 'bg-purple-500/10 text-purple-500'
                : 'bg-amber-500/10 text-amber-500';

            return (
              <div
                key={i}
                className="bg-white dark:bg-[#0A101D] rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm dark:shadow-none"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${colorClassesBg}`}
                    >
                      <IconComponent
                        className={`w-4 h-4 ${colorClassesText}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-widest ${colorClassesText}`}
                        >
                          {tip.category}
                        </span>

                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${badgeClasses}`}
                        >
                          {tip.badge}
                        </span>
                      </div>

                      <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
                        {tip.title}
                      </h4>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                        {tip.text}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Community Banner */}
      <div className="bg-white dark:bg-[#0A101D] rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm dark:shadow-none mt-4">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            </div>

            <div className="flex-1">
              <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">
                Community Forum
              </h4>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Connect with other sellers, discuss market trends, share
                opportunities and learn new ways to increase earnings.
              </p>
            </div>
          </div>

          <button className="mt-4 w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
            Join Community
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
