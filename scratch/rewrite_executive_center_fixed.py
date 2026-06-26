import os

content = """import React, { useState } from 'react';
import { 
  TrendingUp, Scale, Truck, Wallet, Leaf, Activity, ArrowRight, MoreHorizontal,
  Warehouse, ShoppingCart, MapPin, AlertCircle, Globe, Sprout, ChevronRight,
  ChevronLeft, BarChart3, Users, Factory, FileText, Zap, ShieldCheck, PieChart, LineChart as LineChartIcon
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart
} from 'recharts';

// ─── DUMMY DATA ─────────────────────────────────────────────────────────────

const MOCK_INTAKE_TRENDS = [
  { name: 'Mon', PET: 4000, HDPE: 2400, Paper: 2400, Metal: 1200, Glass: 800, Organic: 1000 },
  { name: 'Tue', PET: 3000, HDPE: 1398, Paper: 2210, Metal: 1400, Glass: 900, Organic: 1100 },
  { name: 'Wed', PET: 2000, HDPE: 9800, Paper: 2290, Metal: 1800, Glass: 1000, Organic: 1500 },
  { name: 'Thu', PET: 2780, HDPE: 3908, Paper: 2000, Metal: 1900, Glass: 1200, Organic: 1400 },
  { name: 'Fri', PET: 1890, HDPE: 4800, Paper: 2181, Metal: 2000, Glass: 1300, Organic: 1200 },
  { name: 'Sat', PET: 2390, HDPE: 3800, Paper: 2500, Metal: 2100, Glass: 1400, Organic: 1300 },
  { name: 'Sun', PET: 3490, HDPE: 4300, Paper: 2100, Metal: 2200, Glass: 1500, Organic: 1600 },
];

const MOCK_LOCATION_RANKING = [
  { name: 'Industrial Area', value: 8500 },
  { name: 'Westlands', value: 6200 },
  { name: 'Embakasi', value: 5400 },
  { name: 'Kasarani', value: 4800 },
  { name: 'Kibera', value: 4200 },
  { name: 'Langata', value: 3800 },
  { name: 'Roysambu', value: 3100 },
  { name: 'Karen', value: 2500 },
];

const MOCK_PAYOUTS = [
  { name: 'W1', amount: 1200000 },
  { name: 'W2', amount: 1500000 },
  { name: 'W3', amount: 1100000 },
  { name: 'W4', amount: 1800000 },
];

const MOCK_TOP_AGENTS = [
  { name: 'Kamau Logistics', kg: '12,500', pickups: 142 },
  { name: 'Eco-Klect Nairobi', kg: '10,200', pickups: 115 },
  { name: 'Jane Wambui', kg: '8,400', pickups: 94 },
  { name: 'Ochieng Freights', kg: '7,100', pickups: 86 },
  { name: 'GreenCity Movers', kg: '6,800', pickups: 72 },
];

const MOCK_FLEET_STATUS = [
  { name: 'Active', value: 65, color: '#10b981' },
  { name: 'Idle', value: 20, color: '#f59e0b' },
  { name: 'Maintenance', value: 10, color: '#ef4444' },
  { name: 'Offline', value: 5, color: '#64748b' },
];

const MOCK_PICKUPS_DAILY = [
  { name: '8am', completed: 15 },
  { name: '10am', completed: 28 },
  { name: '12pm', completed: 42 },
  { name: '2pm', completed: 38 },
  { name: '4pm', completed: 51 },
  { name: '6pm', completed: 33 },
];

const MOCK_MATERIAL_COMPOSITION = [
  { name: 'PET', value: 45, color: '#3b82f6' },
  { name: 'HDPE', value: 25, color: '#10b981' },
  { name: 'Cardboard', value: 15, color: '#f59e0b' },
  { name: 'Glass', value: 10, color: '#8b5cf6' },
  { name: 'Metal', value: 5, color: '#ef4444' },
];

const MOCK_REVENUE_GROWTH = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 5000 },
  { name: 'Mar', revenue: 4800 },
  { name: 'Apr', revenue: 6500 },
  { name: 'May', revenue: 8200 },
  { name: 'Jun', revenue: 11000 },
];

const MOCK_TOP_BUYERS = [
  { name: 'Global Plastics Inc', value: 12000000 },
  { name: 'Nairobi Paper Mills', value: 8500000 },
  { name: 'EcoGlass Kenya', value: 5200000 },
  { name: 'MetalWorks Ltd', value: 4100000 },
];

const MOCK_PROFITABILITY = [
  { name: 'PET', profit: 450000, margin: 24 },
  { name: 'HDPE', profit: 320000, margin: 18 },
  { name: 'Cardboard', profit: 280000, margin: 12 },
  { name: 'Metal', profit: 150000, margin: 35 },
];

const MOCK_SPEND = [
  { name: 'Logistics', value: 2100000 },
  { name: 'Agent Payouts', value: 5800000 },
  { name: 'Operations', value: 1200000 },
  { name: 'Equipment', value: 800000 },
];

const MOCK_AGENT_VS_HUB = [
  { name: 'Mon', Agent: 4000, Hub: 2400 },
  { name: 'Tue', Agent: 3000, Hub: 1398 },
  { name: 'Wed', Agent: 2000, Hub: 9800 },
  { name: 'Thu', Agent: 2780, Hub: 3908 },
  { name: 'Fri', Agent: 1890, Hub: 4800 },
  { name: 'Sat', Agent: 2390, Hub: 3800 },
  { name: 'Sun', Agent: 3490, Hub: 4300 },
];

// Heatmap Mock Points (CSS Top/Left percentages)
const HEATMAP_POINTS = [
  { top: '50%', left: '50%', intensity: 0.8, name: 'Nairobi Center' },
  { top: '65%', left: '60%', intensity: 0.9, name: 'Industrial Area' },
  { top: '35%', left: '40%', intensity: 0.6, name: 'Westlands' },
  { top: '25%', left: '75%', intensity: 0.4, name: 'Kasarani' },
  { top: '60%', left: '35%', intensity: 0.7, name: 'Kibera' },
  { top: '65%', left: '80%', intensity: 0.5, name: 'Embakasi' },
  { top: '75%', left: '20%', intensity: 0.3, name: 'Karen' },
];

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

const Sparkline = ({ data, color }: { data: number[], color: string }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d - min) / range) * 100}`).join(' ');

  return (
    <div className="w-16 h-8">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <polyline points={points} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export default function ExecutiveCommandCenter() {
  const { isDarkMode } = useThemeStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // New styling matching CompanyOwnerDashboard.tsx exactly
  const Card = ({ children, className = '', flexCol = false }: any) => (
    <div className={`bg-white dark:bg-slate-800/60 border border-[#e0e3eb] dark:border-slate-700/50 rounded-lg p-5 shadow-none ${flexCol ? 'flex flex-col' : ''} ${className}`}>
      {children}
    </div>
  );

  const SectionHeader = ({ icon: Icon, title, action, actionLabel = 'View all' }: any) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="font-medium w-4 h-4 text-slate-500" />
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
      </div>
      {action && (
        <button className="font-medium text-[10px] text-primary capitalize tracking-widest hover:underline flex items-center gap-1">
          {actionLabel} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  const textTitle = isDarkMode ? 'text-white' : 'text-[#131722]';
  const textSub = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg border text-xs shadow-xl ${isDarkMode ? 'bg-slate-800 border-slate-700/50 text-white' : 'bg-white border-[#e0e3eb] text-slate-900'}`}>
          <p className="font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
              <span className="font-bold">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-full w-full relative bg-transparent">
      {/* ── MAIN SCROLLABLE DASHBOARD ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fade-in pb-10 space-y-5">
        <div className="max-w-[1600px] mx-auto space-y-5">
          
          {/* TITLE */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className={`text-xl font-bold tracking-tight ${textTitle}`}>Greenloop Global Hub</h1>
              <p className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1`}>Enterprise Command OS</p>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md border text-[10px] font-bold shadow-none transition-colors ${isDarkMode ? 'bg-slate-800/60 border-slate-700/50 hover:border-emerald-500/50 text-emerald-400' : 'bg-white border-[#e0e3eb] hover:border-emerald-500/50 text-emerald-600'}`}
               >
                 <Activity className="w-4 h-4" /> Live Feed
               </button>
            </div>
          </div>

          {/* ROW 1: Executive KPI Cards (6) */}
          <div>
             <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Executive KPIs</h3>
             <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
               {[
                 { label: 'Total Materials Collected', val: '1,425', unit: 'Tons', trend: [20, 35, 25, 45, 60, 50, 75], color: '#10b981' },
                 { label: 'Collected Material Value', val: 'KES 42.5M', unit: '', trend: [40, 35, 55, 45, 65, 70, 85], color: '#3b82f6' },
                 { label: 'Total Hub Dropoffs', val: '8,420', unit: '', trend: [10, 15, 12, 25, 20, 30, 35], color: '#f59e0b' },
                 { label: 'Hub Collection', val: '845', unit: 'Tons', trend: [5, 10, 15, 12, 18, 25, 22], color: '#8b5cf6' },
                 { label: 'RFQs Won', val: '142', unit: '', trend: [10, 8, 15, 12, 20, 18, 25], color: '#ec4899' },
                 { label: 'Transactions', val: '12,450', unit: '', trend: [40, 45, 42, 50, 48, 55, 60], color: '#14b8a6' },
               ].map((kpi, i) => (
                 <Card key={i} className="!p-4 flex flex-col justify-between">
                   <p className="font-bold text-[10px] text-slate-600 dark:text-slate-500 uppercase tracking-widest mb-3 truncate">{kpi.label}</p>
                   <div className="flex items-end justify-between">
                     <div>
                       <span className={`text-lg font-bold tracking-tighter ${textTitle}`}>{kpi.val}</span>
                       {kpi.unit && <span className={`text-xs ml-1 font-semibold ${textSub}`}>{kpi.unit}</span>}
                     </div>
                     <Sparkline data={kpi.trend} color={kpi.color} />
                   </div>
                 </Card>
               ))}
             </div>
          </div>

          {/* ROW 2: Additional KPI Cards (6) */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: 'Total Agents', val: '3,240', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
              { label: 'Fleet Collection', val: '580 Tons', icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
              { label: 'Completed Pickups', val: '24,150', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
              { label: 'Agent Complaints', val: '14', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
              { label: 'Fleet Utilization', val: '84%', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
              { label: 'Fleet Rating', val: '4.8/5.0', icon: Zap, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
            ].map((kpi, i) => (
              <Card key={i} className="!p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg}`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[10px] text-slate-600 dark:text-slate-500 uppercase tracking-widest truncate">{kpi.label}</p>
                  <p className={`text-lg font-bold tracking-tighter truncate ${textTitle}`}>{kpi.val}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* ROW 3: Analytics Visualizations (5 Column Grid to separate Top Agents and Payouts) */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 lg:gap-4">
            {/* Multi-line chart (Col span 2) */}
            <Card className="xl:col-span-2 flex flex-col">
              <SectionHeader icon={LineChartIcon} title="Material Intake Trends" />
              <div className="h-[250px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_INTAKE_TRENDS} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="PET" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="HDPE" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Paper" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Metal" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Glass" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Organic" stroke="#14b8a6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Horizontal Bar Chart (Col span 1) */}
            <Card className="flex flex-col">
              <SectionHeader icon={BarChart3} title="Collection by Location" />
              <div className="flex-1 h-[250px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_LOCATION_RANKING} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} />
                    <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Top Agents Table (Col span 1) */}
            <Card className="flex flex-col">
              <SectionHeader icon={Users} title="Top Agents Leaderboard" action="/admin/agents" />
              
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b ${isDarkMode ? 'border-slate-700/50' : 'border-[#e0e3eb]'}`}>
                      <th className="pb-2 font-bold">Agent</th>
                      <th className="pb-2 text-right font-bold">Kg</th>
                      <th className="pb-2 text-right font-bold">Pickups</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {MOCK_TOP_AGENTS.map((agent, i) => (
                      <tr key={i} className={`border-b last:border-0 ${isDarkMode ? 'border-slate-700/30' : 'border-slate-100'}`}>
                        <td className={`py-2 font-bold truncate max-w-[100px] ${textTitle}`}>{agent.name}</td>
                        <td className={`py-2 text-right font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{agent.kg}</td>
                        <td className={`py-2 text-right font-bold ${textSub}`}>{agent.pickups}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Payouts Bar Chart (Col span 1) */}
            <Card className="flex flex-col">
              <SectionHeader icon={Wallet} title="Weekly Payouts" />
              <div className="flex-1 h-[250px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_PAYOUTS} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={5} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ROW 4: Advanced Intelligence */}
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
            
            {/* Fleet Status Donut */}
            <Card className="flex flex-col items-center justify-center relative">
              <div className="absolute top-4 left-5 right-5">
                 <SectionHeader icon={Truck} title="Fleet Status" />
              </div>
              <div className="h-[200px] w-full mt-12 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={MOCK_FLEET_STATUS} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {MOCK_FLEET_STATUS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                   <span className={`text-2xl font-bold ${textTitle}`}>100</span>
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>Total Fleet</span>
                </div>
              </div>
            </Card>

            {/* Completed Pickups Bar */}
            <Card className="flex flex-col">
              <SectionHeader icon={CheckCircle2} title="Completed Pickups (Today)" />
              <div className="flex-1 h-[200px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_PICKUPS_DAILY} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                    <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Material Comp Donut */}
            <Card className="flex flex-col items-center justify-center relative">
              <div className="absolute top-4 left-5 right-5">
                 <SectionHeader icon={PieChart} title="Material Comp" />
              </div>
              <div className="h-[200px] w-full mt-12 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={MOCK_MATERIAL_COMPOSITION} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {MOCK_MATERIAL_COMPOSITION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Revenue Growth Area */}
            <Card className="flex flex-col">
              <SectionHeader icon={TrendingUp} title="Revenue Growth" />
              <div className="flex-1 h-[200px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_REVENUE_GROWTH} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>

          {/* ROW 5: ESG & Sustainability */}
          <div>
            <h2 className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 mt-4`}>ESG & Environmental Impact</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                { label: 'CO₂ Saved', val: '4,520', unit: 'Tons', icon: Globe, color: 'text-emerald-500' },
                { label: 'Landfill Diversion', val: '92.4', unit: '%', icon: RecycleIcon, color: 'text-indigo-500' },
                { label: 'Trees Equivalent', val: '12,400', unit: '', icon: Leaf, color: 'text-teal-500' },
                { label: 'Communities Served', val: '142', unit: '', icon: Users, color: 'text-amber-500' },
                { label: 'Water Saved', val: '8.2M', unit: 'Liters', icon: DropletIcon, color: 'text-blue-500' },
                { label: 'Energy Recovered', val: '450', unit: 'MWh', icon: Zap, color: 'text-rose-500' },
              ].map((esg, i) => (
                <Card key={i} className="!p-4 flex flex-col justify-between">
                   <div className="flex items-center gap-2 mb-4">
                     <esg.icon className={`w-4 h-4 ${esg.color}`} />
                     <span className="font-bold text-[10px] text-slate-600 dark:text-slate-500 uppercase tracking-widest">{esg.label}</span>
                   </div>
                   <div className="flex items-baseline gap-1">
                     <span className={`text-lg font-bold tracking-tighter ${textTitle}`}>{esg.val}</span>
                     {esg.unit && <span className={`text-xs font-semibold ${textSub}`}>{esg.unit}</span>}
                   </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ROW 6: Marketplace Intelligence */}
          <div className="grid xl:grid-cols-3 gap-3 lg:gap-4">
            
            {/* RFQ Pipeline Funnel (Mocked as BarChart) */}
            <Card className="flex flex-col">
              <SectionHeader icon={Factory} title="RFQ Pipeline" />
              <div className="flex-1 h-[250px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Open', value: 450, fill: '#3b82f6' },
                    { name: 'Submitted', value: 320, fill: '#8b5cf6' },
                    { name: 'Negotiation', value: 150, fill: '#f59e0b' },
                    { name: 'Awarded', value: 95, fill: '#10b981' },
                    { name: 'Completed', value: 80, fill: '#059669' },
                  ]} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} />
                    <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Geographic Heatmap */}
            <Card className="flex flex-col !p-0 overflow-hidden relative">
               <div className="p-4 z-10 relative">
                 <SectionHeader icon={MapPin} title="Collection Density (Nairobi HQ)" />
               </div>
               <div className={`absolute inset-0 z-0`}>
                  {/* CSS Grid Pattern Background */}
                  <div className={`absolute inset-0 opacity-20`} style={{ backgroundImage: `radial-gradient(${isDarkMode ? '#ffffff' : '#000000'} 1px, transparent 1px)`, backgroundSize: '20px 20px' }}></div>
                  
                  {/* Mock Heatmap Orbs */}
                  {HEATMAP_POINTS.map((point, idx) => (
                    <div 
                      key={idx} 
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen pointer-events-none"
                      style={{ 
                        top: point.top, 
                        left: point.left,
                        width: `${point.intensity * 120}px`,
                        height: `${point.intensity * 120}px`,
                        background: `radial-gradient(circle, ${point.intensity > 0.7 ? 'rgba(239,68,68,0.8)' : point.intensity > 0.4 ? 'rgba(245,158,11,0.8)' : 'rgba(16,185,129,0.8)'} 0%, transparent 70%)`,
                        filter: 'blur(8px)'
                      }} 
                    />
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                     <Globe className="w-32 h-32 text-slate-400" strokeWidth={1} />
                  </div>
               </div>
            </Card>

            {/* Top Buyers */}
            <Card className="flex flex-col">
              <SectionHeader icon={ShoppingCart} title="Top Buyers" />
              <div className="flex-1 h-[250px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_TOP_BUYERS} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={100} />
                    <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>

          {/* ROW 7: Financial Intelligence */}
          <div className="grid xl:grid-cols-4 gap-3 lg:gap-4 pb-12">
            
            {/* Revenue Breakdown */}
            <Card className="flex flex-col items-center justify-center relative">
              <div className="absolute top-4 left-5 right-5">
                 <SectionHeader icon={PieChart} title="Revenue Breakdown" />
              </div>
              <div className="h-[200px] w-full mt-12 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={MOCK_PROFITABILITY} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="profit" stroke="none">
                      {[ '#3b82f6', '#10b981', '#f59e0b', '#ef4444' ].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Profitability Analysis */}
            <Card className="flex flex-col">
              <SectionHeader icon={Activity} title="Profitability Margin (%)" />
              <div className="flex-1 h-[200px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_PROFITABILITY} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                    <Bar dataKey="margin" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Procurement Spend */}
            <Card className="flex flex-col">
              <SectionHeader icon={Wallet} title="Procurement Spend" />
              <div className="flex-1 h-[200px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_SPEND} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} />
                    <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Agent vs Hub */}
            <Card className="flex flex-col">
              <SectionHeader icon={TrendingUp} title="Agent vs Hub Collection" />
              <div className="flex-1 h-[200px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_AGENT_VS_HUB} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Agent" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Hub" stroke="#06b6d4" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>

        </div>
      </div>

      {/* ── SLIDING RIGHT SIDEBAR (Always available via toggle) ── */}
      <div className={`absolute top-0 right-0 h-full transition-transform duration-300 z-30 flex ${isSidebarOpen ? 'translate-x-0' : 'translate-x-[320px]'}`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-1/2 -left-8 -translate-y-1/2 w-8 h-16 flex items-center justify-center rounded-l-xl border-y border-l shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.1)] transition-colors
            ${isDarkMode ? 'bg-slate-800/90 border-slate-700/50 hover:bg-slate-700' : 'bg-white border-[#e0e3eb] hover:bg-slate-50'}`}
        >
          {isSidebarOpen ? <ChevronRight className="w-5 h-5 text-slate-400" /> : <ChevronLeft className="w-5 h-5 text-slate-400" />}
        </button>

        {/* Sidebar Content */}
        <div className={`w-[320px] h-full border-l shadow-2xl flex flex-col ${isDarkMode ? 'bg-slate-800/95 backdrop-blur border-slate-700/50' : 'bg-white/95 backdrop-blur border-[#e0e3eb]'}`}>
          <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}`}>
             <h3 className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest`}>Live Operations Feed</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
             {/* AI Insights Block */}
             <div>
               <div className="flex items-center gap-2 mb-3">
                 <Zap className="w-4 h-4 text-amber-500" />
                 <h4 className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest`}>AI Insights</h4>
               </div>
               <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                 <p className={`text-xs font-bold leading-relaxed ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                   Market forecast: PET demand increasing by 15% next week. Consider holding inventory.
                 </p>
               </div>
             </div>

             {/* Latest Operations */}
             <div>
               <div className="flex items-center gap-2 mb-3">
                 <Activity className="w-4 h-4 text-emerald-500" />
                 <h4 className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest`}>Latest Activity</h4>
               </div>
               <div className="space-y-4">
                  {[
                    { title: 'Truck Arrived', desc: 'KDA 123G (Kamau Logistics)', time: '2m ago', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                    { title: 'Ticket Closed', desc: 'Ticket #4402 - PET 1.2T', time: '15m ago', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { title: 'Payout Sent', desc: 'KES 45,000 to Agent', time: '1h ago', icon: Wallet, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                  ].map((feed, i) => (
                    <div key={i} className="flex gap-3">
                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${feed.bg}`}>
                         <feed.icon className={`w-4 h-4 ${feed.color}`} />
                       </div>
                       <div>
                         <p className={`text-xs font-bold ${textTitle}`}>{feed.title}</p>
                         <p className={`text-[10px] font-bold text-slate-500`}>{feed.desc}</p>
                         <p className={`text-[9px] font-bold uppercase mt-0.5 text-slate-400`}>{feed.time}</p>
                       </div>
                    </div>
                  ))}
               </div>
             </div>

             {/* Recent RFQs */}
             <div>
               <div className="flex items-center gap-2 mb-3">
                 <ShoppingCart className="w-4 h-4 text-indigo-500" />
                 <h4 className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest`}>Recent RFQs</h4>
               </div>
               <div className="space-y-3">
                  {[
                    { company: 'Global Plastics', req: '100T PET', status: 'Accepted' },
                    { company: 'Nairobi Mills', req: '50T Paper', status: 'Pending' },
                  ].map((rfq, i) => (
                    <div key={i} className={`p-3 rounded-xl border flex flex-col gap-1 ${isDarkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-slate-50 border-[#e0e3eb]'}`}>
                      <div className="flex items-center justify-between">
                         <span className={`text-xs font-bold ${textTitle}`}>{rfq.company}</span>
                         <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${rfq.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{rfq.status}</span>
                      </div>
                      <span className={`text-[10px] font-bold text-slate-500`}>{rfq.req}</span>
                    </div>
                  ))}
               </div>
             </div>

          </div>
        </div>
      </div>

    </div>
  );
}

// Quick fallback icons for ESG since they might not be imported above
function RecycleIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 5.857 9.369a1.828 1.828 0 0 1-.001-1.788 1.785 1.785 0 0 1 1.547-.887H11.5"/><path d="m3 11 3-3-3-3"/><path d="M19.743 14.244 15.5 6.904a1.828 1.828 0 0 0-1.555-.898 1.784 1.784 0 0 0-1.536.88L11 9.5"/><path d="m16 4-3 3 3 3"/></svg> }
function DropletIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg> }
"""

with open('apps/hub/src/pages/ExecutiveCommandCenter.tsx', 'w') as f:
    f.write(content)

print("Updated ExecutiveCommandCenter.tsx with company owner dashboard styles")
