/**
 * MarketIntel Prices Tab — Live commodity prices grid
 * Extracted from MarketIntelligenceHub.tsx
 */
import { TrendingUp, BarChart3, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MarketIntelCommodityTrend, MarketIntelData } from './marketIntel.types';

interface MarketIntelPricesTabProps {
  marketData: MarketIntelData;
  filteredTrends: MarketIntelCommodityTrend[];
}

export default function MarketIntelPricesTab({ marketData, filteredTrends }: MarketIntelPricesTabProps) {
  return (
    <motion.div
      key="prices-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-0.5"
    >
      {/* ── MACRO MARKET INDICATOR (TradingView Style) ── */}
      <div className="bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 rounded-xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-amber-500/15 pb-2.5">
            <h3 className="text-[10px] font-bold capitalize tracking-[0.2em] text-white">Market Overview</h3>
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Live
            </div>
          </div>

          {(() => {
            const upCount = filteredTrends.filter(t => t.trend === 'up').length;
            const downCount = filteredTrends.filter(t => t.trend === 'down').length;
            const stableCount = filteredTrends.filter(t => t.trend === 'stable').length;
            const totalMaterials = filteredTrends.length;
            const isBullish = upCount >= downCount;
            const sentimentScore = totalMaterials > 0 ? Math.round((upCount / totalMaterials) * 100) : 50;

            return (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-1">Overall Sentiment</p>
                    <div className="flex items-baseline gap-2">
                      <h2 className={`text-2xl font-black tracking-tighter ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isBullish ? 'BULLISH' : 'BEARISH'}
                      </h2>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="w-24 h-1.5 bg-amber-950/50 rounded-full overflow-hidden mt-1 flex">
                      <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${sentimentScore}%` }} />
                      <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${100 - sentimentScore}%` }} />
                    </div>
                    <p className="text-[9px] font-bold text-white/70 mt-1.5">
                      <span className="text-emerald-400">{upCount} Up</span> • <span className="text-rose-400">{downCount} Down</span>
                    </p>
                  </div>
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-500/20">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Tracked Assets</span>
                    <span className="text-sm font-black text-white mt-0.5">{totalMaterials}</span>
                  </div>
                  <div className="flex flex-col border-l border-amber-500/20 pl-2">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Stable</span>
                    <span className="text-sm font-black text-white mt-0.5">{stableCount}</span>
                  </div>
                  <div className="flex flex-col border-l border-amber-500/20 pl-2">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Update Freq</span>
                    <span className="text-sm font-black text-white mt-0.5 flex items-center gap-1">Real-time</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── PRICE GRID ── */}
      <div className="flex flex-col space-y-1 pt-1">
        {filteredTrends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-800 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">No Commodities Found</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto font-medium">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          filteredTrends.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between group active:scale-[0.99] transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                  item.trend === 'down' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600' : 'bg-slate-50 dark:bg-slate-700 text-slate-400'
                }`}>
                  {item.trend === 'up' ? <TrendingUp className="w-5 h-5" /> : item.trend === 'down' ? <TrendingUp className="w-5 h-5 rotate-180" /> : <BarChart3 className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize tracking-tight leading-tight">{item.label}</h4>
                  <p className="text-[10px] font-semibold capitalize tracking-widest mt-0.5 text-slate-400 flex items-center gap-2">
                    <span>Demand: <span className={item.demand === 'High' || item.demand === 'Critical' ? 'text-emerald-500 font-bold' : 'text-slate-400'}>{item.demand}</span></span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span>Supply: <span className={item.supply.toLowerCase().includes('low') ? 'text-rose-500' : 'text-emerald-500'}>{item.supply}</span></span>
                  </p>
                </div>
              </div>

              {/* Sparkline & Price */}
              <div className="flex items-center gap-3">
                {/* Stylized Sparkline */}
                <div className="w-14 h-7 opacity-70">
                  <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                    {item.trend === 'up' ? (
                      <>
                        <path d="M0 30 C 20 30, 30 10, 50 15 C 70 20, 80 5, 100 0" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
                        <circle cx="100" cy="0" r="2" className="fill-emerald-500 animate-pulse" />
                      </>
                    ) : item.trend === 'down' ? (
                      <>
                        <path d="M0 0 C 20 0, 30 20, 50 15 C 70 10, 80 25, 100 30" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-500" />
                        <circle cx="100" cy="30" r="2" className="fill-rose-500 animate-pulse" />
                      </>
                    ) : (
                      <>
                        <path d="M0 15 L 20 12 L 40 18 L 60 14 L 80 16 L 100 15" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600" />
                        <circle cx="100" cy="15" r="2" className="fill-slate-300 dark:fill-slate-600 animate-pulse" />
                      </>
                    )}
                  </svg>
                </div>

                <div className="text-right">
                  <p className="text-[13px] font-black text-slate-900 dark:text-white">KSh {item.price}<span className="text-[10px] text-slate-400 font-bold">/kg</span></p>
                  <div className={`text-[10px] font-black flex items-center justify-end gap-1 mt-1`}>
                    <span className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                      item.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 
                      item.trend === 'down' ? 'bg-rose-500/10 text-rose-500' : 
                      'bg-slate-100 dark:bg-slate-700/50 text-slate-500'
                    }`}>
                      {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '•'}
                      {item.trend === 'up' && !item.change.startsWith('+') ? '+' : ''}{item.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-3">
        <p className="text-center text-[10px] font-bold text-slate-400 capitalize tracking-widest italic">
          Prices updated every 3 hours based on hub data.
        </p>
      </div>
    </motion.div>
  );
}
