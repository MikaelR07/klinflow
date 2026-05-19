/**
 * MarketIntelligenceHub.jsx — The "Bloomberg Terminal" for the Circular Economy.
 * Provides price transparency, buy requests (RFQs), and community operational intelligence.
 */
import { useState, useEffect } from 'react';
import { 
  TrendingUp, ArrowLeft, Target, Handshake, 
  AlertCircle, Zap, BarChart3,
  ChevronRight, ArrowUpRight, ArrowDownRight, Clock,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePriceStore } from '@klinflow/core';

const COMMODITY_TRENDS = [
  { id: 'pet', label: 'PET Plastic', price: 22, change: '+5.4%', trend: 'up', demand: 'High' },
  { id: 'hdpe', label: 'HDPE Plastic', price: 18, change: '-2.1%', trend: 'down', demand: 'Stable' },
  { id: 'alu', label: 'Aluminium', price: 45, change: '+12.0%', trend: 'up', demand: 'Critical' },
  { id: 'copper', label: 'Copper', price: 120, change: '+1.5%', trend: 'up', demand: 'High' },
  { id: 'paper', label: 'Cardboard', price: 8, change: '0%', trend: 'stable', demand: 'Low' },
];

const PREDICTIVE_SIGNALS = [
  { id: 'pet-forecast', material: 'PET', trend: 'Bullish', confidence: '89%', prediction: '+3.2 KSh next 15d', reason: 'High regional demand', color: 'emerald' },
  { id: 'alu-forecast', material: 'Aluminium', trend: 'Strong Buy', confidence: '94%', prediction: '+8.5 KSh next 10d', reason: 'Supply chain disruption', color: 'indigo' },
  { id: 'metal-forecast', material: 'Metal', trend: 'Neutral', confidence: '65%', prediction: '±0.5 KSh next 30d', reason: 'Global surplus', color: 'slate' }
];

const MOCK_RFQS = [
  { id: 'rfq-1', company: 'Nairobi Beverages Ltd', material: 'Clear PET Bottles', quantity: '500kg', price: 25, deadline: '2 days', verified: true },
  { id: 'rfq-2', company: 'Steel Mill KE', material: 'Mixed Scrap Metal', quantity: '1,200kg', price: 42, deadline: '5 days', verified: true },
  { id: 'rfq-3', company: 'Eco-Fiber Hub', material: 'LDPE Wraps', quantity: '200kg', price: 15, deadline: 'Tomorrow', verified: false },
];

export default function MarketIntelligenceHub() {
  const navigate = useNavigate();
  const prices = usePriceStore(s => s.prices);
  const fetchPrices = usePriceStore(s => s.fetchPrices);
  const [activeTab, setActiveTab] = useState('prices');

  useEffect(() => {
    fetchPrices();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FF] dark:bg-slate-900 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">Market Intelligence</h1>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Price Ticker & RFQs
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-4 pb-3 gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'prices', label: 'Prices', icon: TrendingUp },
            { id: 'trends', label: 'AI Trends', icon: Sparkles },
            { id: 'rfqs', label: 'Requests', icon: Handshake },
            { id: 'tips', label: 'Insights', icon: Zap },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all border shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-black' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
              <span className="text-[9px] font-bold uppercase tracking-widest leading-none">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+7.75rem)] pb-10 max-w-lg mx-auto w-full px-1 space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'prices' && (
            <motion.div
              key="prices-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Market Insight Banner */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="flex items-start justify-between relative z-10">
                  <div className="max-w-[70%]">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-2">Market Pulse</h3>
                    <p className="text-xs font-medium text-indigo-100 leading-relaxed">
                      PET prices are up <span className="text-white font-black underline underline-offset-4">12%</span> in the central hub. Sell your inventory today for maximum yield.
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Price Grid */}
              <div className="grid grid-cols-1 gap-3">
                {COMMODITY_TRENDS.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm group active:bg-slate-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 
                        item.trend === 'down' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600' : 'bg-slate-50 dark:bg-slate-700 text-slate-400'
                      }`}>
                        {item.trend === 'up' ? <TrendingUp className="w-5 h-5" /> : item.trend === 'down' ? <TrendingUp className="w-5 h-5 rotate-180" /> : <BarChart3 className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{item.label}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          Demand: <span className={item.demand === 'High' || item.demand === 'Critical' ? 'text-emerald-500' : 'text-slate-400'}>{item.demand}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-slate-900 dark:text-white">KSh {item.price}<span className="text-[10px] text-slate-400 font-bold">/kg</span></p>
                      <div className={`text-[9px] font-black uppercase flex items-center justify-end gap-0.5 ${
                        item.trend === 'up' ? 'text-emerald-500' : item.trend === 'down' ? 'text-rose-500' : 'text-slate-400'
                      }`}>
                        {item.change} {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '•'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 italic">
                Prices updated every 12 hours based on hub data.
              </p>
            </motion.div>
          )}

          {activeTab === 'trends' && (
            <motion.div
              key="trends-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 pb-10"
            >
              <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden border border-slate-800">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10" />
                 <div className="flex items-center gap-3 relative z-10 mb-6">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-primary">
                       <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="text-sm font-bold uppercase tracking-tight leading-none mb-1.5">Neural Forecast</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI-Powered Price Signals</p>
                    </div>
                 </div>

                 <div className="space-y-4 relative z-10">
                    {PREDICTIVE_SIGNALS.map(signal => (
                       <div key={signal.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full bg-${signal.color}-500 shadow-[0_0_10px_rgba(var(--${signal.color}-500),0.5)]`} />
                                <h4 className="text-xs font-bold uppercase tracking-tight">{signal.material} · {signal.trend}</h4>
                             </div>
                             <span className="text-[10px] font-bold text-slate-500/80 uppercase tracking-wider">Confidence: {signal.confidence}</span>
                          </div>
                          <p className="text-sm font-black text-white tracking-tight">{signal.prediction}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 italic">{signal.reason}</p>
                       </div>
                    ))}
                 </div>

                 <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Data Latency: 12ms</p>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black text-emerald-500 uppercase">Real-Time</span>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'rfqs' && (
            <motion.div
              key="rfqs-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Discovery Entry */}
              <div className="px-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global Buy Requests</p>
                <p className="text-xs font-semibold text-slate-500">Businesses actively looking for materials right now.</p>
              </div>

              {MOCK_RFQS.map((rfq) => (
                <div key={rfq.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{rfq.company}</h4>
                        {rfq.verified && <Target className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Verified Partner</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Expires In</p>
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-tighter leading-none">{rfq.deadline}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none mb-1">{rfq.material}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rfq.quantity} Goal</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600 leading-none">KSh {rfq.price}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Rate</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/post-trade')}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Fulfill Request <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'tips' && (
            <motion.div
              key="tips-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 pb-10"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">Intelligence Coach</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operational Excellence Tips</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { title: 'Grade A Purity', text: 'Cleaning your PET bottles and removing labels can increase your payout value by up to 20%. Factories pay more for ready-to-process material.', icon: '🧪' },
                    { title: 'Market Timing', text: 'Prices for Scrap Metal usually peak in the first week of the month when industrial demand is high. Try to hold stock until then.', icon: '📅' },
                    { title: 'Safety Gear', text: 'Investing in Grade-1 gloves reduces downtime from injury. Did you know high-trust sellers get discounted PPE at Hub B?', icon: '🛡️' },
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-xl shrink-0">{tip.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase mb-1">{tip.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">{tip.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all">
                  Join Community Forum
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  );
}
