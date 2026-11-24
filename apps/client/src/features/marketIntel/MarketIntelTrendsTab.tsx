import { TrendingUp, Zap, MapPin, Activity, BarChart3, AlertTriangle, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MarketIntelData } from './marketIntel.types';

interface MarketIntelTrendsTabProps {
  marketData: MarketIntelData;
  profile?: any;
}

export default function MarketIntelTrendsTab({ marketData, profile }: MarketIntelTrendsTabProps) {
  const formatText = (text: string) => {
    if (!text) return text;
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const trends = marketData.commodity_trends || [];
  const topSignals = trends
    .map((item: any) => {
      if (item.demand === 'Critical') return { text: `${item.label}`, badge: 'Critical Demand', subtext: 'Buyers competing for supply', trend: 'up', priority: 1 };
      if (item.demand === 'High') return { text: `${item.label}`, badge: 'High Demand', subtext: 'Strong buyer activity', trend: 'up', priority: 2 };
      if (item.supply === 'Low') return { text: `${item.label}`, badge: 'Low Supply', subtext: 'Limited availability', trend: 'up', priority: 3 };
      if (item.trend === 'up') return { text: `${item.label}`, badge: `▲ ${item.change_30d}`, subtext: '30D price increase', trend: 'up', priority: 4 };
      if (item.trend === 'down') return { text: `${item.label}`, badge: `▼ ${item.change_30d}`, subtext: '30D price decline', trend: 'down', priority: 5 };
      return { text: `${item.label}`, badge: 'Stable', subtext: `KSh ${item.price}/kg`, trend: 'stable', priority: 6 };
    })
    .filter((s: any) => s.trend !== 'stable')
    .sort((a: any, b: any) => a.priority - b.priority)
    .slice(0, 5);

  const tickerItems = topSignals.length > 0 ? [...topSignals, ...topSignals] : [];

  const opportunities = marketData.opportunities || [];
  const recommendations = marketData.recommendations || [];
  const hotspots = marketData.hotspots || [];
  const userCounty = (profile?.county || 'Nairobi').toLowerCase();

  const sortedHotspots = [...hotspots]
    .sort((a: any, b: any) => {
      const aIsLocal = a.area.toLowerCase().includes(userCounty);
      const bIsLocal = b.area.toLowerCase().includes(userCounty);
      if (aIsLocal && !bIsLocal) return -1;
      if (!aIsLocal && bIsLocal) return 1;
      return b.score - a.score;
    })
    .slice(0, 5);

  return (
    <motion.div
      key="trends-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-5 pb-6 overflow-x-hidden"
    >
      {/* ── COMPACT AI TRENDS BANNER ── */}
      <div className="bg-gradient-to-br from-[#1178ab] to-[#085078] rounded-2xl p-4 text-white space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-sky-200" />
            <h2 className="text-sm font-bold text-white tracking-tight">AI Market Trends</h2>
          </div>
          <span className="flex items-center gap-1.5 bg-white/15 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        <p className="text-xs text-sky-100/90 leading-relaxed">
          Real-time price movements, high-demand materials, and regional hotspots to help you sell at the best rates.
        </p>

        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/15 text-center">
          <div>
            <p className="text-sm font-bold leading-none">{topSignals.length}</p>
            <p className="text-[10px] text-sky-100/75 font-medium mt-1">Top Signals</p>
          </div>
          <div className="border-x border-white/15">
            <p className="text-sm font-bold leading-none">{opportunities.length}</p>
            <p className="text-[10px] text-sky-100/75 font-medium mt-1">Opportunities</p>
          </div>
          <div>
            <p className="text-sm font-bold leading-none truncate px-1">{profile?.county || 'Nairobi'}</p>
            <p className="text-[10px] text-sky-100/75 font-medium mt-1">Focus Area</p>
          </div>
        </div>
      </div>

      {/* ── AUTO-SCROLLING MARKET SIGNALS ── */}
      {tickerItems.length > 0 && (
        <div className="overflow-hidden relative flex w-full">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, duration: Math.max(topSignals.length * 6, 24), ease: 'linear' }}
            className="flex gap-2 whitespace-nowrap w-max"
          >
            {tickerItems.map((sig: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shrink-0"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    sig.trend === 'up'
                      ? 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-100/80 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  <TrendingUp className={`w-3.5 h-3.5 ${sig.trend === 'down' ? 'rotate-180' : ''}`} />
                </div>
                <div className="min-w-0 pr-1">
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                    {sig.text}{' '}
                    <span className={sig.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      · {sig.badge}
                    </span>
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{sig.subtext}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* ── MARKET OPPORTUNITIES ── */}
      <section className="space-y-2.5">
        <div className="px-0.5">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
            Market Opportunities
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Materials paying above historical averages
          </p>
        </div>

        {opportunities.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-700/60 text-center">
            <Activity className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Scanning for opportunities...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {opportunities.map((opp: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      opp.tagColor === 'amber'
                        ? 'bg-amber-100/80 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        : opp.tagColor === 'blue'
                        ? 'bg-sky-100/80 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400'
                        : 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate">
                      {formatText(opp.material)}
                    </h4>
                    <p
                      className={`text-[10.5px] font-semibold mt-0.5 truncate ${
                        opp.tagColor === 'amber'
                          ? 'text-amber-600 dark:text-amber-400'
                          : opp.tagColor === 'blue'
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {opp.tag}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">{opp.metricValue}</p>
                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold mt-0.5 ${
                      opp.changeType === 'positive'
                        ? 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-100/80 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {opp.changeType === 'positive' ? '▲' : '▼'} {opp.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── ACTIONABLE INSIGHTS ── */}
      <section className="space-y-2.5">
        <div className="px-0.5">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
            Actionable Insights
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Recommended timing and selling tips
          </p>
        </div>

        {recommendations.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-700/60 text-center">
            <BarChart3 className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Generating insights...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recommendations.map((rec: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {rec.priority === 'Urgent' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {formatText(rec.title)}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                      rec.color === 'emerald'
                        ? 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : rec.color === 'amber'
                        ? 'bg-amber-100/80 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        : 'bg-sky-100/80 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400'
                    }`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {formatText(rec.text)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── REGIONAL DEMAND PROFILE ── */}
      <section className="space-y-2.5">
        <div className="px-0.5">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
            Regional Demand
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Volume concentration prioritized for {profile?.county || 'Nairobi'}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-4">
          {sortedHotspots.length === 0 ? (
            <div className="text-center py-4">
              <MapPin className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mapping regions...</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {sortedHotspots.map((spot: any, idx: number) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {spot.area}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {spot.score}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(spot.score, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
