import { TrendingUp, BarChart3, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { CommodityTrend, MarketData } from '../../types/marketPulse.types';

interface MarketPulsePricesTabProps {
  marketData: MarketData;
  filteredTrends: CommodityTrend[];
}

export default function MarketPulsePricesTab({ marketData, filteredTrends }: MarketPulsePricesTabProps) {
  return (
    <motion.div
      key="prices-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-0.5"
    >
      {/* Market Insight Banner */}
      <div className="bg-gradient-to-tr from-emerald-600 to-primary rounded-xl p-4 text-white relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          {/* Title */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-[10px] font-bold capitalize tracking-[0.2em] text-white">Today's Market</h3>
            <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Price
            </div>
          </div>

          {/* Grid metrics in a row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">Top Rising</span>
              <span className="text-[12px] font-semibold text-white mt-0.5 flex items-center gap-0.5 truncate" title={marketData?.opportunities?.[0]?.material}>
                {marketData?.opportunities?.[0]?.material || 'Loading'} <span className="text-emerald-400 font-bold ml-1">{marketData?.opportunities?.[0]?.changeType === 'positive' ? '↑' : ''}</span>
              </span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-2">
              <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">Demanded</span>
              <span className="text-[12px] font-semibold text-white mt-0.5 truncate" title={marketData?.opportunities?.[1]?.material}>
                {marketData?.opportunities?.[1]?.material || 'Loading'}
              </span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-2">
              <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">Trending</span>
              <span className="text-[12px] font-semibold text-indigo-100 mt-0.5 truncate" title={marketData?.opportunities?.[2]?.material}>
                {marketData?.opportunities?.[2]?.material || 'Loading'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Price Grid */}
      <div className="flex flex-col space-y-px">
        {filteredTrends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-800">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">No Commodities Found</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto font-medium">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          filteredTrends.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-none p-4 border-b border-slate-100 dark:border-slate-800/40 flex flex-col gap-3 group active:bg-slate-50 dark:active:bg-slate-800/60 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                    item.trend === 'down' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600' : 'bg-slate-50 dark:bg-slate-700 text-slate-400'
                    }`}>
                    {item.trend === 'up' ? <TrendingUp className="w-5 h-5" /> : item.trend === 'down' ? <TrendingUp className="w-5 h-5 rotate-180" /> : <BarChart3 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white capitalize tracking-tight leading-tight">{item.label}</h4>
                    <p className="text-[10px] font-semibold text-slate-405 dark:text-slate-400 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                      Demand: <span className={item.demand === 'High' || item.demand === 'Critical' ? 'text-emerald-500 font-bold' : 'text-slate-400'}>{item.demand}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">KSh {item.price}<span className="text-[10px] text-slate-400 font-bold">/kg</span></p>
                  <div className={`text-[10px] font-semibold capitalize flex items-center justify-end gap-0.5 ${item.trend === 'up' ? 'text-emerald-500' : item.trend === 'down' ? 'text-rose-500' : 'text-slate-400'
                    }`}>
                    {item.change} {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '•'}
                  </div>
                </div>
              </div>

              {/* Supply & Top Buyer info */}
              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-50 dark:border-slate-700/30 text-[10px] font-semibold capitalize tracking-widest text-slate-400 dark:border-slate-800/40 text-slate-500">
                <div>
                  Supply: <span className={`font-semibold normal-case ml-1 ${item.supply.toLowerCase().includes('high') || item.supply.toLowerCase().includes('abundant')
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : item.supply.toLowerCase().includes('low') || item.supply.toLowerCase().includes('critical')
                      ? 'text-rose-500 font-bold'
                      : 'text-slate-600 dark:text-slate-300'
                    }`}>{item.supply}</span>
                </div>
                <div className="text-right truncate">
                  Top Buyer: <span className="text-slate-700 dark:text-slate-300 font-semibold normal-case ml-1 truncate max-w-[100px] sm:max-w-[140px]" title={item.topBuyer}>{item.topBuyer}</span>
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
