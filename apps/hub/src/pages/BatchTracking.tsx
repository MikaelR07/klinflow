import { useState } from 'react';
import { 
  Search, Filter, Download, Activity, AlertTriangle, 
  CheckCircle2, Box, Layers, Clock, Settings2, MoreHorizontal,
  ArrowRight, TrendingUp, TrendingDown, AlignLeft
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, CartesianGrid, Legend 
} from 'recharts';

// --- MOCK DATA ---
const MOCK_BATCHES = [
  { id: 'B-1042', material: 'PET Bottles', stage: 'Intake & Staging', input: 4500, yield: null, timeInStage: '2h 15m', progress: 30, color: 'text-blue-500', bg: 'bg-blue-500', alert: false },
  { id: 'B-1043', material: 'HDPE Rigid', stage: 'Sorting & Washing', input: 3200, yield: null, timeInStage: '4h 30m', progress: 75, color: 'text-amber-500', bg: 'bg-amber-500', alert: true },
  { id: 'B-1044', material: 'Mixed Paper', stage: 'Sorting & Washing', input: 5100, yield: null, timeInStage: '1h 10m', progress: 20, color: 'text-blue-500', bg: 'bg-blue-500', alert: false },
  { id: 'B-1040', material: 'PET Bottles', stage: 'Processing', input: 4200, yield: null, timeInStage: '3h 45m', progress: 60, color: 'text-blue-500', bg: 'bg-blue-500', alert: false },
  { id: 'B-1041', material: 'LDPE Film', stage: 'Processing', input: 2800, yield: null, timeInStage: '5h 20m', progress: 90, color: 'text-amber-500', bg: 'bg-amber-500', alert: false },
  { id: 'B-1038', material: 'Cardboard', stage: 'Finished Goods', input: 6000, output: 5580, yield: 93.0, timeInStage: '1d 2h', progress: 100, color: 'text-emerald-500', bg: 'bg-emerald-500', alert: false },
  { id: 'B-1039', material: 'PP Rigid', stage: 'Finished Goods', input: 1500, output: 1410, yield: 94.0, timeInStage: '12h 30m', progress: 100, color: 'text-emerald-500', bg: 'bg-emerald-500', alert: false },
];

const MOCK_YIELD_TREND = [
  { day: 'Mon', yield: 91.2 }, { day: 'Tue', yield: 92.5 },
  { day: 'Wed', yield: 89.8 }, { day: 'Thu', yield: 93.1 },
  { day: 'Fri', yield: 94.2 }, { day: 'Sat', yield: 93.8 },
  { day: 'Sun', yield: 92.9 }
];

const MOCK_WASTE_DATA = [
  { material: 'PET Bottles', waste: 8.5 },
  { material: 'HDPE Rigid', waste: 12.2 },
  { material: 'LDPE Film', waste: 15.4 },
  { material: 'Cardboard', waste: 5.1 },
  { material: 'Mixed Paper', waste: 18.3 }
];

export default function BatchTracking() {
  const { isDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'ledger' | 'analytics'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');

  // Top KPIs
  const kpis = [
    { label: 'Active Batches', value: '14', trend: 'In Progress', icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Volume Processed', value: '18.4 t', trend: 'Today', icon: Box, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Exceptions', value: '2', trend: 'Requires Attention', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Pending Batches', value: '4', trend: 'Requires Attention', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Completed', value: '28', trend: 'This Week', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Average Yield', value: '92.5%', trend: 'Target: 90%', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const stages = ['Intake & Staging', 'Sorting & Washing', 'Processing', 'Finished Goods'];

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Batch Tracking</h1>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">Monitor materials progressing through operational stages in real-time.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-[#131722] dark:text-white flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            <button className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Export Log
            </button>
          </div>
        </div>

        {/* 5 Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex gap-4 items-center">
              <div className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
                  {kpi.label}
                </p>
                <h3 className="text-xl font-bold text-[#131722] dark:text-white leading-none mt-1">{kpi.value}</h3>
                <p className="text-[9px] font-medium mt-1.5 text-slate-500">
                  {kpi.trend}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid: 9 Cols Left (Tabs + Content), 3 Cols Right (Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-9 flex flex-col gap-4">
            
            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-[#e0e3eb] dark:border-slate-700/50 overflow-x-auto">
              {[
                { id: 'pipeline', label: 'Pipeline View' },
                { id: 'ledger', label: 'Batch Ledger' },
                { id: 'analytics', label: 'Yield Analytics' }
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
            <div className="bg-transparent flex flex-col min-h-[500px]">
              
              {/* PIPELINE KANBAN VIEW */}
              {activeTab === 'pipeline' && (
                <div className="flex gap-2 overflow-x-auto pb-4 h-full min-h-[600px]">
                  {stages.map((stage) => {
                    const stageBatches = MOCK_BATCHES.filter(b => b.stage === stage);
                    
                    return (
                      <div key={stage} className="flex flex-col w-[280px] shrink-0 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-[#e0e3eb] dark:border-slate-700/50">
                        {/* Stage Header */}
                        <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 rounded-t-2xl">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-[#131722] dark:text-white">{stage}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {stageBatches.length}
                          </span>
                        </div>
                        
                        {/* Stage Cards */}
                        <div className="p-3 flex flex-col gap-3 overflow-y-auto">
                          {stageBatches.map(batch => (
                            <div key={batch.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#e0e3eb] dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${batch.color}`}>{batch.id}</span>
                                {batch.alert && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                              </div>
                              <h4 className="text-sm font-bold text-[#131722] dark:text-white mb-3">{batch.material}</h4>
                              
                              <div className="flex justify-between items-end mb-4">
                                <div>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Input Vol.</p>
                                  <p className="text-xs font-bold text-[#131722] dark:text-white">{batch.input.toLocaleString()} kg</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5"><Clock className="w-3 h-3 inline mr-1" /> Time</p>
                                  <p className="text-xs font-bold text-[#131722] dark:text-white">{batch.timeInStage}</p>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div>
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Stage Progress</span>
                                  <span className="text-[9px] font-bold text-slate-500">{batch.progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className={`h-full ${batch.bg} transition-all`} style={{ width: `${batch.progress}%` }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* BATCH LEDGER (TABLE) VIEW */}
              {activeTab === 'ledger' && (
                <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                      <input 
                        type="text" 
                        placeholder="Search batches, materials, operators..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs outline-none focus:border-emerald-500 dark:text-white"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#131722] dark:hover:text-white">
                      <Settings2 className="w-4 h-4" /> Columns
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                        <tr>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Batch ID</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Material</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Current Stage</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Input (kg)</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Output (kg)</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Yield (%)</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">Status</th>
                          <th className="px-5 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                        {MOCK_BATCHES.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-4 text-xs font-bold text-[#131722] dark:text-white">{b.id}</td>
                            <td className="px-5 py-4 text-xs font-medium text-slate-500">{b.material}</td>
                            <td className="px-5 py-4 text-xs font-medium text-slate-500">{b.stage}</td>
                            <td className="px-5 py-4 text-xs font-bold text-[#131722] dark:text-white text-right">{b.input.toLocaleString()}</td>
                            <td className="px-5 py-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-right">{b.output ? b.output.toLocaleString() : '-'}</td>
                            <td className="px-5 py-4 text-xs font-medium text-slate-500 text-right">{b.yield ? b.yield.toFixed(1) : '-'}</td>
                            <td className="px-5 py-4 text-center">
                              {b.alert ? (
                                <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded border border-rose-500/30 text-rose-600 dark:text-rose-400 bg-transparent">Flagged</span>
                              ) : (
                                <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-transparent">Healthy</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button className="text-slate-400 hover:text-emerald-500 transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-[#e0e3eb] dark:border-slate-700/50 flex justify-between items-center text-xs text-slate-500">
                    <span>Showing 1 to 7 of 42 active batches</span>
                  </div>
                </div>
              )}

              {/* YIELD ANALYTICS TAB */}
              {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[500px]">
                  {/* Yield Trend Line */}
                  <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5 flex flex-col h-[350px]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-[#131722] dark:text-white">Average Yield Trend</h3>
                      <span className="text-xs font-bold text-emerald-500">92.5% Target: 90%</span>
                    </div>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MOCK_YIELD_TREND}>
                          <defs>
                            <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                          <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} tickFormatter={(v) => `${v}%`} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                          <Area type="monotone" dataKey="yield" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorYield)" dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Waste by Material Bar */}
                  <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5 flex flex-col h-[350px]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-[#131722] dark:text-white">Waste % by Material</h3>
                      <span className="text-xs font-bold text-amber-500">Avg Waste: 7.5%</span>
                    </div>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_WASTE_DATA} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} />
                          <YAxis dataKey="material" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                          <Bar dataKey="waste" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* RIGHT COLUMN */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            
            {/* AI Insights */}
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Activity className="w-32 h-32 text-emerald-500" />
              </div>
              <div className="p-4 border-b border-emerald-100 dark:border-emerald-500/20 flex items-center justify-between bg-emerald-100/30 dark:bg-emerald-900/20 relative z-10">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Process Insights
                </h3>
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold">AI</span>
              </div>
              <div className="p-5 space-y-4 relative z-10">
                <div className="flex gap-3 items-start bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-amber-100 dark:border-amber-500/30">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    Yield for <span className="font-bold">Mixed Paper</span> has dropped 4% below average today. Recommend inspecting the sorting line.
                  </p>
                </div>
                <div className="flex gap-3 items-start bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/30">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    PET Washing line efficiency is optimal. Current batches are processing 15% faster than average.
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Log */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl flex flex-col flex-1 overflow-hidden min-h-[300px]">
              <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-slate-400" /> Activity Log
                </h3>
              </div>
              <div className="p-5 relative">
                <div className="absolute top-5 bottom-5 left-[27px] w-px bg-[#e0e3eb] dark:bg-slate-700"></div>
                <div className="space-y-6 relative z-10">
                  
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-800 mt-1 shrink-0 z-10 relative"></div>
                    <div>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">Batch B-1038 Completed</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Moved to Finished Goods inventory.</p>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 block">10 mins ago</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-slate-800 mt-1 shrink-0 z-10 relative"></div>
                    <div>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">Batch B-1042 Started Processing</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Operator Mike started extrusion line 1.</p>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 block">45 mins ago</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full bg-amber-500 border-4 border-white dark:border-slate-800 mt-1 shrink-0 z-10 relative"></div>
                    <div>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">Quality Flag on B-1043</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">High moisture content detected in HDPE.</p>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 block">2 hours ago</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 border-4 border-white dark:border-slate-800 mt-1 shrink-0 z-10 relative"></div>
                    <div>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">Batch B-1044 Intake</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">5.1t of Mixed Paper received from Supplier A.</p>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 block">3 hours ago</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
