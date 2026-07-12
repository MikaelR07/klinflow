import { useState } from 'react';
import { 
  Warehouse, Search, Layers, Box, Calendar, ChevronDown, Filter, Download,
  TrendingUp, TrendingDown, AlertTriangle, Activity, CheckCircle2, AlertCircle,
  Lightbulb
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend 
} from 'recharts';

// Mock Data
const MOCK_INVENTORY_TREND = [
  { day: 'May 9', value: 180 }, { day: 'May 10', value: 210 },
  { day: 'May 11', value: 260 }, { day: 'May 12', value: 280 },
  { day: 'May 13', value: 275 }, { day: 'May 14', value: 285 },
  { day: 'May 15', value: 287.45 }
];

const MOCK_VALUE_TREND = [
  { day: 'May 9', value: 6.2 }, { day: 'May 10', value: 6.8 },
  { day: 'May 11', value: 7.5 }, { day: 'May 12', value: 8.1 },
  { day: 'May 13', value: 8.0 }, { day: 'May 14', value: 8.4 },
  { day: 'May 15', value: 8.64 }
];

const MOCK_STOCK_CATEGORY = [
  { name: 'Plastics', value: 156.20, color: '#8b5cf6' },
  { name: 'Papers', value: 62.40, color: '#3b82f6' },
  { name: 'Metals', value: 34.80, color: '#f59e0b' },
  { name: 'Glass', value: 18.65, color: '#10b981' },
  { name: 'Others', value: 15.40, color: '#8b5cf6' }
];

const MOCK_STOCK_LOCATION = [
  { location: 'Main Warehouse', volume: 142.30 },
  { location: 'Sorting Area', volume: 78.40 },
  { location: 'Baling Area', volume: 41.20 },
  { location: 'Transit Area', volume: 25.55 }
];

const MOCK_AGING = [
  { name: '0-7 Days', value: 114.25, color: '#10b981' },
  { name: '8-30 Days', value: 98.60, color: '#f59e0b' },
  { name: '31-60 Days', value: 48.30, color: '#3b82f6' },
  { name: '60+ Days', value: 26.30, color: '#f43f5e' }
];

const MOCK_MATERIALS = [
  { material: 'PET Bottles', category: 'Plastics', onHand: 86.40, reserved: 5.20, available: 81.20, unitValue: 28500, totalValue: 2320200, trend: 'up', status: 'Healthy' },
  { material: 'HDPE', category: 'Plastics', onHand: 62.15, reserved: 3.10, available: 59.05, unitValue: 24000, totalValue: 1490400, trend: 'up', status: 'Healthy' },
  { material: 'PP', category: 'Plastics', onHand: 38.70, reserved: 2.00, available: 36.70, unitValue: 22000, totalValue: 851400, trend: 'down', status: 'Low Stock' },
  { material: 'LDPE Film', category: 'Plastics', onHand: 45.30, reserved: 4.30, available: 41.00, unitValue: 18500, totalValue: 838050, trend: 'up', status: 'Healthy' },
  { material: 'Mixed Paper', category: 'Papers', onHand: 28.60, reserved: 1.50, available: 27.10, unitValue: 15000, totalValue: 429000, trend: 'up', status: 'Healthy' },
];

export default function InventoryCommand() {
  const { isDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'materials' | 'value' | 'turnover' | 'analytics'>('materials');
  const [searchQuery, setSearchQuery] = useState('');

  // Top KPIs
  const kpis = [
    { label: 'Total Inventory', sub: '(All Materials)', value: '287.45 t', trend: '+12.6% vs last 7 days', icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Inventory Value', sub: '', value: 'KES 8.64M', trend: '+9.8% vs last 7 days', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Low Stock Items', sub: '5 materials', value: '8', trend: '', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Over Stock Items', sub: '3 materials', value: '6', trend: '', icon: Warehouse, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Stock Turnover', sub: '(7D)', value: '2.45x', trend: '+0.35 vs last 7 days', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Inventory</h1>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">Real-time visibility and analysis of materials and stock across the hub</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-[#131722] dark:text-white flex items-center gap-2">
              <Warehouse className="w-3.5 h-3.5 text-emerald-500" /> Nairobi Hub <ChevronDown className="w-3 h-3" />
            </button>
            <button className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-[#131722] dark:text-white flex items-center gap-2">
              May 9 - May 15, 2025 <Calendar className="w-3.5 h-3.5" />
            </button>
            <button className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-[#131722] dark:text-white flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            <button className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex gap-4 items-center">
              <div className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
                  {kpi.label} {kpi.sub && <span className="block">{kpi.sub}</span>}
                </p>
                <h3 className="text-xl font-bold text-[#131722] dark:text-white leading-none mt-1">{kpi.value}</h3>
                {kpi.trend && (
                  <p className={`text-[9px] font-medium mt-1.5 ${kpi.trend.includes('-') ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ↗ {kpi.trend}
                  </p>
                )}
                {!kpi.trend && kpi.sub.includes('materials') && (
                  <p className="text-[9px] font-medium mt-1.5 text-slate-500">
                    {kpi.sub}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid: 9 Cols Left (Tabs + Content), 3 Cols Right (Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-9 flex flex-col gap-4">
            
            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-[#e0e3eb] dark:border-slate-700/50 overflow-x-auto">
              {[
                { id: 'materials', label: 'Materials' },
                { id: 'value', label: 'Inventory Value' },
                { id: 'turnover', label: 'Stock Turnover' },
                { id: 'analytics', label: 'Analytics' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                      : 'border-transparent text-slate-500 hover:text-[#131722] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content Container */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col min-h-[500px] overflow-hidden">
              
              {/* MATERIALS TAB */}
              {activeTab === 'materials' && (
                <>
                  <div className="p-5 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#131722] dark:text-white">Inventory Summary</h2>
                    <div className="relative w-full max-w-sm">
                      <input 
                        type="text" 
                        placeholder="Search materials..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs outline-none focus:border-emerald-500 dark:text-white"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                        <tr>
                          <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Material</th>
                          <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Category</th>
                          <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">On Hand (t)</th>
                          <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Reserved (t)</th>
                          <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Available (t)</th>
                          <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Unit Value (KES/t)</th>
                          <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Total Value (KES)</th>
                          <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">Trend</th>
                          <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                        {MOCK_MATERIALS.map((m, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-4 text-xs font-bold text-[#131722] dark:text-white">{m.material}</td>
                            <td className="px-5 py-4 text-xs font-medium text-slate-500">{m.category}</td>
                            <td className="px-5 py-4 text-xs font-bold text-[#131722] dark:text-white text-right">{m.onHand.toFixed(2)}</td>
                            <td className="px-5 py-4 text-xs font-medium text-slate-500 text-right">{m.reserved.toFixed(2)}</td>
                            <td className="px-5 py-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-right">{m.available.toFixed(2)}</td>
                            <td className="px-5 py-4 text-xs font-medium text-slate-500 text-right">{m.unitValue.toLocaleString()}</td>
                            <td className="px-5 py-4 text-xs font-bold text-[#131722] dark:text-white text-right">{m.totalValue.toLocaleString()}</td>
                            <td className="px-5 py-4 text-center">
                              {m.trend === 'up' ? (
                                <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-rose-500 mx-auto" />
                              )}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded border ${
                                m.status === 'Healthy' 
                                  ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                  : 'border-amber-500/30 text-amber-600 dark:text-amber-400'
                              } bg-transparent`}>
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-[#e0e3eb] dark:border-slate-700/50 flex justify-between items-center text-xs text-slate-500">
                    <span>Showing 1 to 5 of 12 materials</span>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 hover:underline">View full inventory</button>
                  </div>
                </>
              )}

              {/* ANALYTICS TAB */}
              {activeTab === 'analytics' && (
                <div className="p-6 flex flex-col gap-6 bg-slate-50/50 dark:bg-slate-900/20 flex-1">
                  
                  {/* Top Row: Area Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5 h-[280px] flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-[#131722] dark:text-white">Inventory Trend (Tonnes)</h3>
                        <span className="text-xs font-bold text-emerald-500">287.45 t ↗ 12.6%</span>
                      </div>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={MOCK_INVENTORY_TREND}>
                            <defs>
                              <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5 h-[280px] flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-[#131722] dark:text-white">Inventory Value Trend (KES)</h3>
                        <span className="text-xs font-bold text-blue-500">KES 8.64M ↗ 9.8%</span>
                      </div>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={MOCK_VALUE_TREND}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} tickFormatter={(v) => `${v}M`} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Breakdown Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Stock by Category */}
                    <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5 flex flex-col h-[280px]">
                      <h3 className="text-sm font-bold text-[#131722] dark:text-white mb-2">Stock by Category <span className="text-slate-500 font-normal text-xs">(Tonnes)</span></h3>
                      <div className="flex-1 flex items-center">
                        <div className="w-[120px] h-[120px] relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={MOCK_STOCK_CATEGORY} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                                {MOCK_STOCK_CATEGORY.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-sm font-bold text-[#131722] dark:text-white leading-none">287.45</span>
                            <span className="text-[8px] font-bold uppercase text-slate-500 mt-1">Total</span>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-2 pl-4">
                          {MOCK_STOCK_CATEGORY.map(s => (
                            <div key={s.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{s.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#131722] dark:text-white text-[10px]">{s.value.toFixed(2)}</span>
                                <span className="text-[9px] text-slate-400 w-6 text-right">({Math.round((s.value / 287.45) * 100)}%)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stock by Location */}
                    <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5 flex flex-col h-[280px]">
                      <h3 className="text-sm font-bold text-[#131722] dark:text-white mb-4">Stock by Location <span className="text-slate-500 font-normal text-xs">(Tonnes)</span></h3>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={MOCK_STOCK_LOCATION} layout="vertical" barSize={12}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="location" type="category" width={90} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                            <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                            <Bar dataKey="volume" fill="#10b981" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#94a3b8', fontSize: 9, formatter: (v: number) => v.toFixed(2) }} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Inventory Aging */}
                    <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5 flex flex-col h-[280px]">
                      <h3 className="text-sm font-bold text-[#131722] dark:text-white mb-2">Inventory Aging <span className="text-slate-500 font-normal text-xs">(Tonnes)</span></h3>
                      <div className="flex-1 flex items-center">
                        <div className="w-[120px] h-[120px] relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={MOCK_AGING} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                                {MOCK_AGING.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-sm font-bold text-[#131722] dark:text-white leading-none">287.45</span>
                            <span className="text-[8px] font-bold uppercase text-slate-500 mt-1">Total</span>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-2 pl-4">
                          {MOCK_AGING.map(s => (
                            <div key={s.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{s.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#131722] dark:text-white text-[10px]">{s.value.toFixed(2)}</span>
                                <span className="text-[9px] text-slate-400 w-6 text-right">({Math.round((s.value / 287.45) * 100)}%)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* VALUE / TURNOVER PLACEHOLDERS */}
              {(activeTab === 'value' || activeTab === 'turnover') && (
                <div className="p-10 flex flex-col items-center justify-center h-[500px] text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-[#131722] dark:text-white mb-2 capitalize">{activeTab} Details</h3>
                  <p className="text-sm text-slate-500 max-w-md">Detailed visualization and reporting for {activeTab} will be available in the next update phase.</p>
                </div>
              )}

            </div>
          </div>


          {/* RIGHT COLUMN */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            
            {/* Inventory Insights */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Inventory Insights
                </h3>
                <button className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 hover:underline">This Week <ChevronDown className="w-3 h-3 inline-block" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-3 items-start">
                  <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    Inventory increased by <span className="font-bold text-[#131722] dark:text-white">12.6%</span> compared to last week.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <Box className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    PET Bottles and Mixed Paper are the top contributors to value.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    8 items are low in stock and may require replenishment.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    Stock turnover improved by <span className="font-bold text-[#131722] dark:text-white">0.35x</span> compared to last week.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Activity className="w-32 h-32 text-emerald-500" />
              </div>
              <div className="p-4 border-b border-emerald-100 dark:border-emerald-500/20 flex items-center justify-between bg-emerald-100/30 dark:bg-emerald-900/20 relative z-10">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> AI Insights
                </h3>
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold">BETA</span>
              </div>
              <div className="p-5 space-y-4 relative z-10">
                <div className="flex gap-3 items-start bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/30">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    Demand for PET Bottles is likely to increase by 18% next week based on historical trends.
                  </p>
                </div>
                
                <div className="flex gap-3 items-start bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-amber-100 dark:border-amber-500/30">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    LDPE Film has been slow moving for 18 days. Consider a promotion or transfer.
                  </p>
                </div>

                <div className="flex gap-3 items-start bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-blue-100 dark:border-blue-500/30">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    HDPE stock levels are optimal. Reorder not required for the next 7 days.
                  </p>
                </div>
                
                <button className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:underline mt-2">
                  View all AI insights
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
