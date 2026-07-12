import { useState } from 'react';
import { 
  Download, Filter, Activity, TrendingUp, TrendingDown,
  Box, Truck, Layers, AlertTriangle, ArrowRight,
  RefreshCw, CheckCircle2
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';

// --- MOCK DATA ---
const MATERIAL_FLOW_DATA = [
  { day: 'Mon', intake: 45, dispatch: 38 },
  { day: 'Tue', intake: 52, dispatch: 42 },
  { day: 'Wed', intake: 48, dispatch: 50 },
  { day: 'Thu', intake: 61, dispatch: 45 },
  { day: 'Fri', intake: 58, dispatch: 60 },
  { day: 'Sat', intake: 35, dispatch: 30 },
  { day: 'Sun', intake: 25, dispatch: 20 },
];

const INVENTORY_DATA = [
  { name: 'PET Bottles', value: 45, color: '#3b82f6' },
  { name: 'HDPE Rigid', value: 25, color: '#f59e0b' },
  { name: 'Cardboard', value: 20, color: '#10b981' },
  { name: 'Mixed Paper', value: 10, color: '#8b5cf6' },
];

const STAGE_EFFICIENCY = [
  { stage: 'Sorting', efficiency: 94 },
  { stage: 'Washing', efficiency: 88 },
  { stage: 'Baling', efficiency: 96 },
  { stage: 'Extrusion', efficiency: 82 },
];

const TOP_SOURCES = [
  { name: 'Aggregator Network Alpha', volume: '124.5t', trend: '+12%', type: 'B2B' },
  { name: 'City Municipality Waste', volume: '85.2t', trend: '-3%', type: 'Gov' },
  { name: 'Independent Drivers', volume: '62.8t', trend: '+25%', type: 'B2C' },
  { name: 'Corporate Logistics Partner', volume: '45.0t', trend: '+5%', type: 'B2B' },
];

export default function HubAnalyticsDashboard() {
  const { isDarkMode } = useThemeStore();
  const profile = useAuthStore(s => (s as any).profile);
  const currentCompanyName = useAuthStore(s => (s as any).currentCompanyName);
  const [dateRange, setDateRange] = useState('Last 7 Days');

  const kpis = [
    { label: 'Total Intake Volume', value: '324.5 t', subtext: 'vs last week: 305.2 t', trend: 'up', icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Processing Yield', value: '91.8%', subtext: 'Target: 90.0%', trend: 'up', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Total Dispatched', value: '285.0 t', subtext: 'vs last week: 290.5 t', trend: 'down', icon: Truck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Inventory Turnover', value: '4.2 Days', subtext: 'Target: < 5 Days', trend: 'up', icon: RefreshCw, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fade-in pb-20 space-y-6 pt-16 md:pt-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div className="flex flex-col mb-6">
               <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {(profile?.name || 'Analytics Manager').split(' ')[0]} 👋</h2>
            </div>
          <div className="flex gap-3">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-[#131722] dark:text-white outline-none cursor-pointer"
            >
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>This Month</option>
              <option>This Quarter</option>
            </select>
            <button className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Export Data
            </button>
          </div>
        </div>

        {/* Executive KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5 flex flex-col hover:shadow-lg transition-shadow relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                <kpi.icon className="w-32 h-32" />
              </div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                {kpi.trend === 'up' ? (
                  <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md">
                    <TrendingDown className="w-3 h-3" />
                  </div>
                )}
              </div>
              
              <div className="relative z-10">
                <h3 className="text-[28px] font-black text-[#131722] dark:text-white leading-none mb-1">{kpi.value}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {kpi.label}
                </p>
              </div>
              <div className="relative z-10 mt-4 pt-4 border-t border-[#e0e3eb] dark:border-slate-700/50">
                <p className="text-[10px] font-medium text-slate-400">
                  {kpi.subtext}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Material Flow (Area Chart) - 8 Cols */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-6 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">Material Flow Analysis</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Intake volume vs Dispatched volume (tonnes)</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><div className="w-3 h-3 rounded bg-blue-500/80"></div> Intake</div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><div className="w-3 h-3 rounded bg-emerald-500/80"></div> Dispatch</div>
              </div>
            </div>
            
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MATERIAL_FLOW_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIntake" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDispatch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="intake" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIntake)" />
                  <Area type="monotone" dataKey="dispatch" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDispatch)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Inventory Composition (Donut) - 4 Cols */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-6 flex flex-col h-[400px]">
            <div className="mb-2">
              <h3 className="text-sm font-bold text-[#131722] dark:text-white">Current Inventory</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Composition by material type</p>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={INVENTORY_DATA}
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {INVENTORY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Stock</span>
                <span className="text-2xl font-black text-[#131722] dark:text-white leading-none mt-1">100%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              {INVENTORY_DATA.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1 flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 line-clamp-1">{item.name}</p>
                    <p className="text-[10px] font-bold text-[#131722] dark:text-white">{item.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Bottom Grid: Tables & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Top Intake Sources - 6 Cols */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">Top Intake Sources</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Highest volume providers this period</p>
              </div>
              <button className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:underline">View All</button>
            </div>
            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Source Name</th>
                    <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Type</th>
                    <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Volume</th>
                    <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                  {TOP_SOURCES.map((source, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-bold text-[#131722] dark:text-white">{source.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {source.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-[#131722] dark:text-white text-right">{source.volume}</td>
                      <td className={`px-5 py-3.5 text-[10px] font-bold text-right ${source.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {source.trend}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Processing Efficiency (Bar Chart) - 6 Cols */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">Processing Efficiency</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Average yield percentage by operational stage</p>
              </div>
              <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-widest">Target: 90%</span>
            </div>
            
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={STAGE_EFFICIENCY} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="stage" type="category" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: '#1e293b', opacity: 0.1 }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="efficiency" radius={[0, 4, 4, 0]} barSize={24}>
                    {STAGE_EFFICIENCY.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.efficiency >= 90 ? '#10b981' : entry.efficiency >= 85 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
