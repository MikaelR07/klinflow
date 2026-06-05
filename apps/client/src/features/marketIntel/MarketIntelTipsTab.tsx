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
      {/* Hero Card */}
      <div className="bg-slate-800 dark:bg-slate-900/60 rounded-[1rem] p-4 border border-slate-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="flex items-start gap-4 mb-2">
          <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-amber-500/20">
            <Zap className="w-7 h-7 text-amber-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Intelligence Coach</h3>
            <p className="text-sm font-medium text-slate-400">Actionable tips to maximize your earnings</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 pt-6 border-t border-slate-800/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-lg font-bold text-white">{marketData?.insights?.length || 0}</span>
            </div>
            <p className="text-[10px] font-semibold text-emerald-500/70 uppercase tracking-wider">Insights</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="text-lg font-bold text-white">92%</span>
            </div>
            <p className="text-[10px] font-semibold text-purple-500/70 uppercase tracking-wider">confidence</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-lg font-bold text-white">18%</span>
            </div>
            <p className="text-[10px] font-semibold text-blue-500/70 uppercase tracking-wider">Upside</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-lg font-bold text-white">High</span>
            </div>
            <p className="text-[10px] font-semibold text-amber-500/70 uppercase tracking-wider">Activity</p>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {(!marketData?.insights || marketData.insights.length === 0) ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-[1rem] p-6 border border-slate-800/60 animate-pulse flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-32 bg-slate-800 rounded" />
                  <div className="h-6 w-48 bg-slate-800 rounded" />
                  <div className="h-4 w-full bg-slate-800 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : (
          marketData.insights.map((tip: any, i: number) => {
            const IconComponent = tip.iconName === 'bell' ? Bell :
              tip.iconName === 'mappin' ? MapPin :
                tip.iconName === 'trendingup' ? TrendingUp :
                  tip.iconName === 'award' ? Award : Clock;

            const colorClassesBg = tip.color === 'rose' ? 'bg-rose-500/10 border-rose-500/20' :
              tip.color === 'indigo' ? 'bg-indigo-500/10 border-indigo-500/20' :
                tip.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' :
                  tip.color === 'purple' ? 'bg-purple-500/10 border-purple-500/20' :
                    'bg-amber-500/10 border-amber-500/20';

            const colorClassesText = tip.color === 'rose' ? 'text-rose-500' :
              tip.color === 'indigo' ? 'text-indigo-500' :
                tip.color === 'emerald' ? 'text-emerald-500' :
                  tip.color === 'purple' ? 'text-purple-500' :
                    'text-amber-500';

            const badgeClasses = tip.color === 'rose' ? 'bg-rose-500/10 text-rose-400' :
              tip.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400' :
                tip.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                  tip.color === 'purple' ? 'bg-purple-500/10 text-purple-400' :
                    'bg-amber-500/10 text-amber-400';

            return (
              <div key={i} className="bg-slate-800 rounded-[1rem] dark:bg-slate-900/60 p-5 border border-slate-800/60 flex flex-col gap-5">
                <div className="flex items-start gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${colorClassesText}`}>{tip.category}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${badgeClasses}`}>
                        {tip.badge}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">{tip.title}</h4>

                    <div className="flex flex-col md:flex-row gap-5">
                      <div className="flex-1">
                        <p className="text-sm text-slate-400 leading-relaxed">{tip.text}</p>
                        <div className="mt-4 space-y-1">
                          <p className={`text-xs font-semibold ${colorClassesText}`}>Why this matters:</p>
                          <p className="text-xs text-slate-300">Actioning this insight allows you to capitalize on current market momentum and secure better margins.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Community Banner */}
      <div className="mt-4 bg-slate-800 rounded-[24px] p-6 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Users className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white mb-1">Join the Community Forum</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">Connect with other sellers, share insights and stay ahead of the market.</p>
          </div>
        </div>
        <button className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0">
          Join Now <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
