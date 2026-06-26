import React, { useEffect, useState, useMemo } from 'react';
import { useMarketStore } from '@klinflow/core/stores/marketStore';
import {
  Search, Filter, ChevronDown, ChevronRight, Bell, Sparkles, DownloadCloud,
  ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus,
  Box, BarChart3, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Activity, X
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

// --- MOCK DATA FOR SPARKLINE CHARTS ---
const generateSparkline = (points = 10, trend = 'up') => {
  return Array.from({ length: points }).map((_, i) => ({
    val: trend === 'up' ? 20 + i * 2 + Math.random() * 5 : 40 - i * 2 + Math.random() * 5
  }));
};

const CATEGORY_COLORS: Record<string, { iconBg: string; iconColor: string; bg: string; text: string }> = {
  plastic: { iconBg: 'bg-emerald-100 dark:bg-emerald-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 text-emerald-700', text: 'Plastics' },
  metal: { iconBg: 'bg-indigo-100 dark:bg-indigo-500/20', iconColor: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 text-indigo-700', text: 'Metals' },
  paper: { iconBg: 'bg-amber-100 dark:bg-amber-500/20', iconColor: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 text-amber-700', text: 'Paper' },
  glass: { iconBg: 'bg-cyan-100 dark:bg-cyan-500/20', iconColor: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 text-cyan-700', text: 'Glass' },
  'e-waste': { iconBg: 'bg-rose-100 dark:bg-rose-500/20', iconColor: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 text-rose-700', text: 'Electronics' },
  textile: { iconBg: 'bg-purple-100 dark:bg-purple-500/20', iconColor: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 text-purple-700', text: 'Textiles' },
  organic: { iconBg: 'bg-orange-100 dark:bg-orange-500/20', iconColor: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 text-orange-700', text: 'Organic' },
};

const getCategoryStyle = (materialName: string) => {
  const name = materialName.toLowerCase();
  if (name.includes('plastic') || name.includes('hdpe') || name.includes('pet') || name.includes('pp')) return CATEGORY_COLORS.plastic;
  if (name.includes('metal') || name.includes('aluminium') || name.includes('copper') || name.includes('iron') || name.includes('brass') || name.includes('steel')) return CATEGORY_COLORS.metal;
  if (name.includes('paper') || name.includes('cardboard') || name.includes('occ')) return CATEGORY_COLORS.paper;
  if (name.includes('glass')) return CATEGORY_COLORS.glass;
  if (name.includes('waste') || name.includes('batteries')) return CATEGORY_COLORS['e-waste'];
  if (name.includes('textile')) return CATEGORY_COLORS.textile;
  if (name.includes('wood')) return CATEGORY_COLORS.organic;
  return CATEGORY_COLORS.plastic; // default
};

const getDemandSupplyColor = (level: string) => {
  if (level === 'HIGH' || level === 'High') return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10';
  if (level === 'MEDIUM' || level === 'Medium') return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10';
  if (level === 'LOW' || level === 'Low' || level === 'Critical') return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10';
  return 'text-slate-600 bg-white dark:text-slate-400 dark:bg-slate-800';
};

const DEMAND_REGIONS = [
  { name: 'Nairobi', pct: '92%' },
  { name: 'Mombasa', pct: '83%' },
  { name: 'Kisumu', pct: '74%' },
  { name: 'Eldoret', pct: '62%' },
  { name: 'Nakuru', pct: '53%' },
  { name: 'Kakamega', pct: '41%' },
  { name: 'Thika', pct: '38%' },
];

const MOCK_AI_SIGNALS = [
  { material: 'PET Plastic', type: 'up', text: 'demand has increased by 22% in Nairobi over the last 14 days.', time: '2h ago' },
  { material: 'Cardboard', type: 'down', text: 'prices are expected to decline by 8% next week.', time: '4h ago' },
  { material: 'Copper', type: 'up', text: 'inventory shortage detected in Mombasa market.', time: '6h ago' },
  { material: 'HDPE', type: 'up', text: 'showing strong upward trend. Good time to hold inventory.', time: '8h ago' },
];

export default function PriceDashboard() {
  const { materialPrices, fetchMaterialPrices } = useMarketStore();
  
  const [alerts, setAlerts] = useState([
    { id: 1, material: 'PET Plastic', type: 'Above', threshold: '70.00', enabled: true },
    { id: 2, material: 'Copper', type: 'Above', threshold: '100.00', enabled: true },
    { id: 3, material: 'Cardboard', type: 'Below', threshold: '22.00', enabled: true },
    { id: 4, material: 'Aluminium', type: 'Above', threshold: '80.00', enabled: false },
  ]);

  useEffect(() => {
    fetchMaterialPrices();
  }, [fetchMaterialPrices]);

  // Derived KPIs
  const totalTracked = materialPrices.length;
  const avgPrice = materialPrices.reduce((sum, m) => sum + m.price_per_kg, 0) / (totalTracked || 1);
  const rising = materialPrices.filter(m => (m.change_pct || 0) > 0).length;
  const falling = materialPrices.filter(m => (m.change_pct || 0) < 0).length;
  const highestDemandItem = [...materialPrices].sort((a, b) => {
    const score = (val: string) => val === 'High' ? 3 : val === 'Medium' ? 2 : 1;
    return score(b.demand || '') - score(a.demand || '');
  })[0];

  const sortedByChange = [...materialPrices].sort((a, b) => (b.change_pct || 0) - (a.change_pct || 0));
  const gainers = sortedByChange.filter(m => (m.change_pct || 0) > 0).slice(0, 5);

  const handleAlertToggle = (id: number) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleAlertChange = (id: number, val: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, threshold: val } : a));
  };

  return (
    <div className="font-medium min-h-screen text-[#131722] dark:text-slate-100 font-sans pb-12">
      <div className="p-1 max-w-[1600px] mx-auto">
        
        {/* HEADER */}
        {/* ── DESCRIPTION ── */}
        <div className="mb-4">
          <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mt-2">Live market prices, demand trends and commodity insights.</p>
        </div>        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mt-2">
          
          {/* MAIN COLUMN (LEFT) */}
          <div className="xl:col-span-3 space-y-4">

        
        {/* KPI CARDS (TOP 5) */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3.5 border border-[#e0e3eb] dark:border-slate-800 shadow-none flex flex-col relative overflow-hidden">
             <div className="flex items-center gap-2 mb-2 z-10">
               <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                 <BarChart3 className="font-medium w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
               </div>
               <p className="font-bold text-[10px] text-slate-600 uppercase tracking-wide dark:text-slate-400">Market Value Tracked</p>
             </div>
             <div className="z-10">
               <h3 className="text-sm font-bold text-[#131722] dark:text-white tracking-tight">KES {avgPrice.toFixed(2)} <span className="text-sm font-bold text-slate-500">/kg avg</span></h3>
               <p className="font-medium text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1"><ArrowUpRight className="font-medium w-3 h-3"/> +4.6% vs last 7 days</p>
             </div>
             <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={generateSparkline(10, 'up')}>
                   <Area type="monotone" dataKey="val" stroke="#10b981" fill="#10b981" strokeWidth={2} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-3.5 border border-[#e0e3eb] dark:border-slate-800 shadow-none flex flex-col relative overflow-hidden">
             <div className="flex items-center gap-2 mb-2 z-10">
               <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                 <Box className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
               </div>
               <p className="font-bold text-[10px] text-slate-600 uppercase tracking-wide dark:text-slate-400">Materials Tracked</p>
             </div>
             <div className="z-10">
               <h3 className="text-lg font-bold text-[#131722] dark:text-white tracking-tight">{totalTracked}</h3>
               <p className="font-medium text-[10px] text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1"><ArrowUpRight className="font-medium w-3 h-3"/> +3 new this week</p>
             </div>
             <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={generateSparkline(10, 'up')}>
                   <Area type="monotone" dataKey="val" stroke="#8b5cf6" fill="#8b5cf6" strokeWidth={2} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-3.5 border border-[#e0e3eb] dark:border-slate-800 shadow-none flex flex-col relative overflow-hidden">
             <div className="flex items-center gap-2 mb-2 z-10">
               <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                 <TrendingUpIcon className="font-medium w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
               </div>
               <p className="font-bold text-[10px] text-slate-600 uppercase tracking-wide dark:text-slate-400">Materials Rising</p>
             </div>
             <div className="z-10">
               <h3 className="text-lg font-bold text-[#131722] dark:text-white tracking-tight">{rising}</h3>
               <p className="font-medium text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1"><ArrowUpRight className="font-medium w-3 h-3"/> High momentum</p>
             </div>
             <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={generateSparkline(10, 'up')}>
                   <Area type="monotone" dataKey="val" stroke="#10b981" fill="#10b981" strokeWidth={2} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-3.5 border border-[#e0e3eb] dark:border-slate-800 shadow-none flex flex-col relative overflow-hidden">
             <div className="flex items-center gap-2 mb-2 z-10">
               <div className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                 <TrendingDownIcon className="font-medium w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
               </div>
               <p className="font-bold text-[10px] text-slate-600 uppercase tracking-wide dark:text-slate-400">Materials Falling</p>
             </div>
             <div className="z-10">
               <h3 className="text-lg font-bold text-[#131722] dark:text-white tracking-tight">{falling}</h3>
               <p className="font-medium text-[10px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1"><ArrowDownRight className="font-medium w-3 h-3"/> Watch closely</p>
             </div>
             <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={generateSparkline(10, 'down')}>
                   <Area type="monotone" dataKey="val" stroke="#f43f5e" fill="#f43f5e" strokeWidth={2} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-3.5 border border-[#e0e3eb] dark:border-slate-800 shadow-none flex flex-col relative overflow-hidden">
             <div className="flex items-center gap-2 mb-2 z-10">
               <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                 <Activity className="font-medium w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
               </div>
               <p className="font-bold text-[10px] text-slate-600 uppercase tracking-wide dark:text-slate-400">Highest Demand</p>
             </div>
             <div className="z-10">
               <h3 className="text-lg font-bold text-[#131722] dark:text-white tracking-tight truncate">{highestDemandItem?.material_name || 'N/A'}</h3>
               <p className="font-medium text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1"><Sparkles className="font-medium w-3 h-3"/> Top sourced item</p>
             </div>
             <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={generateSparkline(10, 'up')}>
                   <Area type="monotone" dataKey="val" stroke="#f59e0b" fill="#f59e0b" strokeWidth={2} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        
            
            {/* MATERIAL PRICES TABLE CARD */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg shadow-none flex flex-col">
              
              {/* Toolbar */}
              <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="font-medium absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search material..."
                    className="font-medium w-full bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <button className="font-medium flex items-center justify-between gap-2 px-3 py-2 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap hover:bg-white dark:hover:bg-slate-800">
                    All Categories <ChevronDown className="font-medium w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button className="font-medium flex items-center justify-between gap-2 px-3 py-2 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap hover:bg-white dark:hover:bg-slate-800">
                    All Demand <ChevronDown className="font-medium w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button className="font-medium flex items-center gap-2 px-3 py-2 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap hover:bg-white dark:hover:bg-slate-800">
                    <Filter className="w-3.5 h-3.5" /> Filters
                  </button>
                </div>
              </div>

              {/* Scrollable Table Container */}
              <div className="overflow-hidden flex flex-col">
                {/* Table Header */}
                <div className="font-medium bg-white dark:bg-slate-800/40 border-b border-[#e0e3eb] dark:border-slate-800 grid grid-cols-8 px-6 py-3 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                  <div className="col-span-2">MATERIAL</div>
                  <div>PRICE (KES/KG)</div>
                  <div>CHANGE (7D)</div>
                  <div>HIGHEST PRICE</div>
                  <div>LOWEST PRICE</div>
                  <div>DEMAND</div>
                  <div>SUPPLY</div>
                </div>
                
                {/* Scrollable Body */}
                <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
                  <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60">
                    {materialPrices.map(item => {
                      const style = getCategoryStyle(item.material_name);
                      const changeKsh = item.change_ksh || 0;
                      const changePct = item.change_pct || 0;
                      const isUp = changeKsh > 0;
                      const isDown = changeKsh < 0;

                      return (
                        <div key={item.id} className="grid grid-cols-8 items-center px-6 py-4 hover:bg-white dark:hover:bg-slate-800/30 transition-colors group cursor-pointer">
                          
                          {/* Material */}
                          <div className="col-span-2 flex items-center gap-3 pr-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg} ${style.iconColor}`}>
                              <Box className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-semibold text-[#131722] dark:text-white truncate">{item.material_name}</h4>
                              <p className="font-medium text-[10px] text-slate-400 mt-0.5">{style.text}</p>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="font-medium text-xs text-[#131722] dark:text-white">
                            {item.price_per_kg.toFixed(2)}
                          </div>

                          {/* Change */}
                          <div className="flex flex-col">
                            <span className={`text-xs flex items-center gap-0.5 ${isUp ? 'text-emerald-500' : isDown ? 'text-rose-500' : 'text-slate-400'}`}>
                              {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                              {isUp ? '+' : ''}{changeKsh.toFixed(2)}
                            </span>
                            <span className={`text-[10px] mt-0.5 ${isUp ? 'text-emerald-600/70 dark:text-emerald-400/80' : isDown ? 'text-rose-600/70 dark:text-rose-400/80' : 'text-slate-400'}`}>
                              {isUp ? '+' : ''}{changePct.toFixed(1)}%
                            </span>
                          </div>

                          {/* High */}
                          <div className="font-medium text-xs text-[#131722] dark:text-white">
                            {((item.price_per_kg * 1.1) || 0).toFixed(2)}
                          </div>
                          
                          {/* Low */}
                          <div className="font-medium text-xs text-[#131722] dark:text-white">
                            {((item.price_per_kg * 0.9) || 0).toFixed(2)}
                          </div>

                          {/* Demand */}
                          <div>
                            <span className={`px-2.5 py-1 rounded-md font-bold text-[9px] tracking-widest uppercase ${getDemandSupplyColor(item.demand || 'MEDIUM')}`}>
                              {item.demand || 'MEDIUM'}
                            </span>
                          </div>

                          {/* Supply & Arrow */}
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-1 rounded-md font-bold text-[9px] tracking-widest uppercase ${getDemandSupplyColor(item.supply || 'MEDIUM')}`}>
                              {item.supply || 'MEDIUM'}
                            </span>
                            <ChevronRight className="font-medium w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Table Footer */}
              <div className="p-4 border-t border-[#e0e3eb] dark:border-slate-800 bg-white dark:bg-slate-800/30 flex items-center justify-between">
                <span className="font-medium text-xs text-slate-500">Showing 1 to {materialPrices.length} of {materialPrices.length} materials</span>
                <button className="font-medium flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 shadow-none hover:bg-white">
                  Load More <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* BOTTOM SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Material Details Card */}
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg shadow-none p-5 flex flex-col">
                <div className="flex items-start justify-between mb-5 border-b border-[#e0e3eb] dark:border-slate-700/50 pb-4">
                   <div className="flex items-center gap-3">
                     <div className="font-medium w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                       <Box className="w-5 h-5" />
                     </div>
                     <div>
                       <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                         PET Plastic <span className="font-medium px-2 py-0.5 rounded text-[8px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">HIGH DEMAND</span>
                       </h3>
                       <p className="font-medium text-[10px] text-slate-500 mt-0.5">Polyethylene Terephthalate</p>
                     </div>
                   </div>
                   <button className="font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                     <X className="w-4 h-4" />
                   </button>
                </div>
                
                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-[#e0e3eb] dark:border-slate-700/50 mb-4 overflow-x-auto no-scrollbar pb-1">
                  <button className="font-medium text-[11px] text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 pb-2 whitespace-nowrap">Overview</button>
                  <button className="font-medium text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 pb-2 whitespace-nowrap">Price Trend</button>
                  <button className="font-medium text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 pb-2 whitespace-nowrap">Buyers</button>
                  <button className="font-medium text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 pb-2 whitespace-nowrap">Supply</button>
                  <button className="font-medium text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 pb-2 whitespace-nowrap">News</button>
                </div>

                {/* Price and Metrics */}
                <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                  <div>
                    <h4 className="text-xl font-bold text-[#131722] dark:text-white tracking-tight">KES 68.00 <span className="text-xs text-slate-500 font-semibold">/kg</span></h4>
                    <p className="font-medium text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1"><TrendingUp className="font-medium w-3.5 h-3.5" /> +12.4% (7D)</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="font-medium text-[9px] text-slate-400 mb-1">Demand</p>
                      <span className="font-medium px-2 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 block">HIGH</span>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-[9px] text-slate-400 mb-1">Supply</p>
                      <span className="font-medium px-2 py-0.5 rounded text-[9px] bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 block">LOW</span>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="font-medium text-[9px] text-slate-400 mb-1">Active Buyers</p>
                      <span className="font-medium text-xs text-[#131722] dark:text-white block">12</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[9px] text-slate-400 mb-1">Forecast (14D)</p>
                      <p className="font-medium text-xs text-[#131722] dark:text-white block">KES 72.00</p>
                    </div>
                  </div>
                </div>

                {/* Chart Mockup */}
                <div className="flex-1 min-h-[120px] w-full bg-white dark:bg-slate-900/50 rounded-xl border border-[#e0e3eb] dark:border-slate-800 p-2">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={generateSparkline(20, 'up')}>
                       <Area type="monotone" dataKey="val" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                     </AreaChart>
                   </ResponsiveContainer>
                </div>
              </div>

              {/* AI Market Signals Card (Horizontal format) */}
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg shadow-none p-5 flex flex-col">
                <div className="flex items-center justify-between mb-5 border-b border-[#e0e3eb] dark:border-slate-700/50 pb-4">
                  <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                    <Sparkles className="font-medium w-4 h-4 text-emerald-500" /> AI Market Signals
                  </h3>
                  <button className="font-medium text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                    View all <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {MOCK_AI_SIGNALS.map((signal, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-[#e0e3eb] dark:border-slate-800">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${signal.type === 'up' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-500'}`}>
                        {signal.type === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                          <span className="font-medium text-[#131722] dark:text-white">{signal.material}</span> {signal.text}
                        </p>
                        <p className="font-medium text-[9px] text-slate-400 mt-2">{signal.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* SIDEBAR (RIGHT) */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Top Movers */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg shadow-none flex flex-col p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">Top Movers <span className="text-slate-400 font-medium">(This Week)</span></h3>
                <ChevronDown className="font-medium w-4 h-4 text-slate-400" />
              </div>
              
              <div className="flex items-center gap-2 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-max">
                <button className="font-medium px-3 py-1.5 bg-white dark:bg-slate-700 rounded-md text-[10px] text-[#131722] dark:text-white shadow-none uppercase tracking-widest">Gainers</button>
                <button className="font-medium px-3 py-1.5 rounded-md text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-slate-700">Losers</button>
              </div>

              <div className="space-y-4">
                {gainers.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="font-medium w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">{idx + 1}</span>
                      <span className="font-medium text-xs text-[#131722] dark:text-white">{item.material_name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[11px] text-emerald-500">+{item.change_pct?.toFixed(1)}%</p>
                      <p className="font-medium text-[9px] text-slate-400 mt-0.5">KES {item.price_per_kg.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="font-medium mt-5 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                View full market movers <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Demand by Region */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg shadow-none flex flex-col p-5">
              <h3 className="text-sm font-bold text-[#131722] dark:text-white mb-5">Demand by Region</h3>
              
              <div className="space-y-3.5">
                {DEMAND_REGIONS.map((region, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="font-medium text-xs text-slate-700 dark:text-slate-300">{region.name}</span>
                    <span className="font-medium text-xs text-[#131722] dark:text-white">{region.pct}</span>
                  </div>
                ))}
              </div>

              <button className="font-medium mt-5 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                View full regional report <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Price Alerts */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg shadow-none flex flex-col p-5">
              <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2 mb-5">
                <Bell className="font-medium w-4 h-4 text-slate-400" /> Price Alerts
              </h3>
              
              <div className="space-y-4">
                {alerts.map(alert => {
                  const isUp = alert.type === 'Above';
                  return (
                    <div key={alert.id} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isUp ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'}`}>
                          {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-semibold text-[#131722] dark:text-white mb-1">{alert.material}</h4>
                          {alert.enabled ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-[10px] text-slate-500">{alert.type} KES</span>
                              <input 
                                type="text" 
                                value={alert.threshold}
                                onChange={(e) => handleAlertChange(alert.id, e.target.value)}
                                className="font-medium w-16 bg-slate-100 dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-[#131722] dark:text-white outline-none focus:border-emerald-500 transition-colors"
                              />
                            </div>
                          ) : (
                            <p className="font-medium text-[10px] text-slate-400">{alert.type} KES {alert.threshold}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Custom Toggle Switch */}
                      <button 
                        onClick={() => handleAlertToggle(alert.id)}
                        className={`w-9 h-5 rounded-full relative transition-colors ${alert.enabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-none transition-all ${alert.enabled ? 'left-4.5 right-0.5' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  );
                })}
              </div>

              <button className="font-medium mt-5 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                Manage alerts <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
