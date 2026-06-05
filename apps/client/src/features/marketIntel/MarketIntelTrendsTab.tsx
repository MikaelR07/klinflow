import { GitGraph, TrendingUp, Zap, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MarketIntelData } from './marketIntel.types';

interface MarketIntelTrendsTabProps {
  marketData: MarketIntelData;
}

export default function MarketIntelTrendsTab({ marketData }: MarketIntelTrendsTabProps) {
  return (
    <motion.div
      key="trends-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 px-1.5 pb-5"
    >
      {/* AI MARKET SIGNAL HERO */}
      <div className="bg-[#0A101D] border border-emerald-900/50 rounded-xl p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-transparent z-0 pointer-events-none" />
        <div className="relative z-10 flex flex-row gap-3 items-center justify-between">
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-emerald-900/40 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0">
                <GitGraph className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest leading-none mb-1">Market Intel</p>
                <h2 className="text-base font-bold text-white tracking-tight leading-none"> Opportunities Detected</h2>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug mb-3 pr-2">
              Our AI is tracking market movements, buyer behavior, and pricing patterns to help you sell for more.
            </p>
          </div>
          {/* Signals List */}
          <div className="flex flex-col gap-1.5 shrink-0 w-[140px]">
            {marketData.market_signals?.map((sig: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-900/40 p-2 rounded-xl border border-slate-800/50">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${sig.trend === 'up' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}`}>
                  <TrendingUp className={`w-3 h-3 ${sig.trend === 'down' ? 'rotate-180' : ''}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-white leading-tight mb-0.5 truncate">{sig.text}</p>
                  <p className={`text-[8px] font-semibold leading-tight truncate ${sig.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>{sig.subtext}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TODAY'S TOP OPPORTUNITIES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-400 tracking-tight">Today's Top Opportunities</h3>
        </div>

        <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar -mx-4 px-4">
          {marketData.opportunities?.map((opp: any, idx: number) => {
            const bgStyles = opp.tagColor === 'amber' ? 'bg-gradient-to-br from-slate-900 to-[#1e1b10] border-amber-900/30' :
              opp.tagColor === 'blue' ? 'bg-gradient-to-br from-slate-900 to-[#0c182a] border-blue-900/30' :
                'bg-gradient-to-br from-slate-900 to-[#1c1020] border-purple-900/30';
            const textColor = opp.tagColor === 'amber' ? 'text-amber-500' : opp.tagColor === 'blue' ? 'text-blue-500' : 'text-purple-500';
            const iconBg = opp.tagColor === 'amber' ? 'bg-amber-500/20' : opp.tagColor === 'blue' ? 'bg-blue-500/20' : 'bg-purple-500/20';

            return (
              <div key={idx} className={`shrink-0 w-44 rounded-2xl p-3 border relative overflow-hidden ${bgStyles}`}>
                <div className="flex items-center gap-1.5 ">
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${iconBg}`}>
                    <Zap className={`w-2.5 h-2.5 ${textColor}`} />
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-widest ${textColor}`}>{opp.tag}</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{opp.material}</h4>

                <div className="space-y-1 ">
                  <p className="text-[9px] font-semibold text-slate-400">{opp.metricLabel}</p>
                  <p className="text-[11px] font-bold text-white leading-none">{opp.metricValue}</p>
                  <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold mt-1 ${opp.changeType === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {opp.changeType === 'positive' ? '▲' : '▼'} {opp.change}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* REGIONAL HOTSPOTS */}
      <div className="space-y-3 !mt-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-bold text-slate-400 tracking-tight">Regional Hotspots</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Places with highest buyer demand right now</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {marketData.hotspots?.map((spot: any, idx: number) => (
            <div key={idx} className="bg-slate-700 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-white truncate">{spot.area}</span>
              </div>
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Demand Score</p>
              <div className="flex items-end gap-2">
                <span className="text-lg font-bold text-white leading-none">{spot.score}</span>
                <div className="flex gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className={`w-1.5 h-2.5 rounded-sm ${i * 15 <= spot.score ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI RECOMMENDATIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">AI Recommendations</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Personalised insights to help you earn more</p>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar -mx-4 px-4">
          {marketData.recommendations?.map((rec: any, idx: number) => {
            const bgClass = rec.color === 'emerald' ? 'bg-emerald-900/80 border-emerald-800/40 shadow-sm' :
              rec.color === 'amber' ? 'bg-amber-900/80 border-amber-800/40 shadow-sm' :
                'bg-purple-900/80 border-purple-800/40 shadow-sm';
            return (
              <div key={idx} className={`shrink-0 w-64 rounded-xl p-4 border ${bgClass} flex gap-3`}>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white mb-1.5">{rec.title}</h4>
                  <p className="text-[10px] text-slate-100 leading-relaxed mb-3 line-clamp-3">{rec.text}</p>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${rec.color === 'emerald' ? 'bg-emerald-900/50 text-emerald-400' : rec.color === 'amber' ? 'bg-amber-900/50 text-amber-400' : 'bg-purple-900/50 text-purple-400'}`}>
                    {rec.priority}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  );
}
