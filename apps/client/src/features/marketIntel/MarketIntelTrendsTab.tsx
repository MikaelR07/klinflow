import { TrendingUp, Zap, MapPin, BrainCircuit, Activity, BarChart3, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MarketIntelData } from './marketIntel.types';

interface MarketIntelTrendsTabProps {
  marketData: MarketIntelData;
  profile?: any;
}

export default function MarketIntelTrendsTab({ marketData, profile }: MarketIntelTrendsTabProps) {
  // Helper to ensure any stray raw IDs look professional
  const formatText = (text: string) => {
    if (!text) return text;
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  return (
    <motion.div
      key="trends-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 pb-5 overflow-x-hidden"
    >
      {/* AI MARKET SIGNAL HERO */}
      <div className="rounded-xl p-5 relative overflow-hidden bg-gradient-to-br from-[#110C24] via-[#1E143E] to-[#0B081A] shadow-lg shadow-purple-900/20 border border-purple-900/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center border border-purple-500/30">
                <BrainCircuit className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Algo Insights</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-black text-white tracking-tight leading-tight mb-2">Automated Market Analytics</h2>
            <p className="text-[11px] font-medium text-purple-200/70 leading-relaxed max-w-[90%]">
              Our scrap indexing AI is scanning the market. We analyze price trends, supply/demand imbalances, and regional heatmaps in real-time,to offer you the best intel ahead of others.
            </p>
          </div>
        </div>
      </div>

      {/* LIVE MARKET TICKER (generated from real commodity data) */}
      {(() => {
        const trends = marketData.commodity_trends || [];
        const signals = trends.map((item: any) => {
          // Determine the most interesting signal for each material
          if (item.demand === 'Critical') return { text: `${item.label} — Critical Demand`, subtext: 'Buyers competing for supply', trend: 'up' };
          if (item.demand === 'High') return { text: `${item.label} — High Demand`, subtext: 'Strong buyer activity', trend: 'up' };
          if (item.supply === 'Low') return { text: `${item.label} — Supply Shortage`, subtext: 'Limited availability', trend: 'up' };
          if (item.trend === 'up') return { text: `${item.label} ▲ ${item.change_30d}`, subtext: '30D price increase', trend: 'up' };
          if (item.trend === 'down') return { text: `${item.label} ▼ ${item.change_30d}`, subtext: '30D price decline', trend: 'down' };
          return { text: `${item.label} — Stable`, subtext: `KSh ${item.price}/kg`, trend: 'stable' };
        }).filter((s: any) => s.trend !== 'stable'); // Only show actionable signals

        const tickerItems = signals.length > 0 ? [...signals, ...signals, ...signals, ...signals] : [];

        return tickerItems.length > 0 ? (
          <div className="overflow-hidden relative flex w-full">
            <motion.div 
              animate={{ x: ["0%", "-50%"] }} 
              transition={{ repeat: Infinity, duration: Math.max(tickerItems.length * 8, 40), ease: "linear" }}
              className="flex gap-1 whitespace-nowrap w-max"
            >
              {tickerItems.map((sig: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-200 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0 shadow-sm">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${sig.trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500'}`}>
                    <TrendingUp className={`w-3 h-3 ${sig.trend === 'down' ? 'rotate-180' : ''}`} />
                  </div>
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">{sig.text}</p>
                    <p className="text-[9px] font-semibold text-slate-500">{sig.subtext}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        ) : null;
      })()}

      {/* MARKET OPPORTUNITIES (Vertical Feed) */}
      <div className="space-y-3">
        <div className="flex flex-col gap-1 px-1 mb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Market Opportunities</h3>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%]">
            Discover materials that are currently paying out more than usual. We compare today's prices against historical averages so you know exactly what is most profitable to sell right now.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {(!marketData.opportunities || marketData.opportunities.length === 0) ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 text-center">
              <Activity className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Scanning for opportunities...</p>
            </div>
          ) : (
            marketData.opportunities.map((opp: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group active:scale-[0.99] transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    opp.tagColor === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' :
                    opp.tagColor === 'blue' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' :
                    'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                  }`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize">{formatText(opp.material)}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${
                        opp.tagColor === 'amber' ? 'text-amber-500' :
                        opp.tagColor === 'blue' ? 'text-blue-500' :
                        'text-emerald-500'
                      }`}>{opp.tag}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[13px] font-black text-slate-900 dark:text-white">{opp.metricValue}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black flex items-center gap-0.5 ${
                      opp.changeType === 'positive' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {opp.changeType === 'positive' ? '▲' : '▼'} {opp.change}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ALGORITHMIC RECOMMENDATIONS */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col gap-1 px-1 mb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Actionable Insights</h3>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%]">
            Smart tips from our AI. We watch the market for you and suggest what materials are hot, when to hold onto your stock, and the best time to sell for maximum cash.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {(!marketData.recommendations || marketData.recommendations.length === 0) ? (
             <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 text-center">
             <BarChart3 className="w-6 h-6 text-slate-300 mx-auto mb-2" />
             <p className="text-xs font-bold text-slate-500">Generating insights...</p>
           </div>
          ) : (
            marketData.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  rec.color === 'emerald' ? 'bg-emerald-500' :
                  rec.color === 'amber' ? 'bg-amber-500' :
                  'bg-purple-500'
                }`} />
                <div className="flex items-start justify-between gap-3 ml-2">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {rec.priority === 'Urgent' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      <h4 className="text-[13px] font-bold text-slate-900 dark:text-white">{formatText(rec.title)}</h4>
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{formatText(rec.text)}</p>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md shrink-0 ${
                    rec.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 
                    rec.color === 'amber' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 
                    'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* REGIONAL VOLUME PROFILE (HOTSPOTS) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col gap-1 px-1 mb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Regional Demand Profile</h3>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%]">
            Shows volume concentration by area. We prioritize regions closest to your registered location ({profile?.county || 'Nairobi'}) so you can focus on actionable, local buyers.
          </p>
        </div>

        <div className="bg-slate-200 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          {(!marketData.hotspots || marketData.hotspots.length === 0) ? (
            <div className="text-center py-4">
               <MapPin className="w-6 h-6 text-slate-300 mx-auto mb-2" />
               <p className="text-xs font-bold text-slate-500">Mapping regions...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...marketData.hotspots]
                .sort((a: any, b: any) => {
                  const userCounty = (profile?.county || 'Nairobi').toLowerCase();
                  const aIsLocal = a.area.toLowerCase().includes(userCounty);
                  const bIsLocal = b.area.toLowerCase().includes(userCounty);
                  if (aIsLocal && !bIsLocal) return -1;
                  if (!aIsLocal && bIsLocal) return 1;
                  return b.score - a.score;
                })
                .slice(0, 5)
                .map((spot: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{spot.area}</span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500">{spot.score}%</span>
                  </div>
                  <div className="w-full h-3 bg-white dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-300/30 dark:border-transparent shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.max(spot.score, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </motion.div>
  );
}
