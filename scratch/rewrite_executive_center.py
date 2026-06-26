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
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

// Heatmap Mock Points (Nairobi roughly)
const HEATMAP_POINTS = [
  { lat: -1.2921, lng: 36.8219, intensity: 0.8 }, // Nairobi Center
  { lat: -1.3000, lng: 36.8500, intensity: 0.9 }, // Industrial Area
  { lat: -1.2667, lng: 36.8000, intensity: 0.6 }, // Westlands
  { lat: -1.2167, lng: 36.9000, intensity: 0.4 }, // Kasarani
  { lat: -1.3167, lng: 36.7833, intensity: 0.7 }, // Kibera
  { lat: -1.3167, lng: 36.9000, intensity: 0.5 }, // Embakasi
  { lat: -1.3333, lng: 36.7167, intensity: 0.3 }, // Karen
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

  // Styling utility
  const cardBg = isDarkMode ? 'bg-surface-900 border-white/5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]';
  const textTitle = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSub = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg border text-xs shadow-xl ${isDarkMode ? 'bg-surface-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <p className="font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
              <span className="font-semibold">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-full w-full relative">
      {/* ── MAIN SCROLLABLE DASHBOARD ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          
          {/* TITLE */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${textTitle}`}>Greenloop Global Hub</h1>
              <p className={`text-sm mt-1 font-medium ${textSub}`}>Enterprise Command OS • Real-time Operations & Intelligence</p>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${isDarkMode ? 'bg-surface-900 border-white/10 hover:border-emerald-500/50 text-emerald-400' : 'bg-white border-slate-200 hover:border-emerald-500/50 text-emerald-600'}`}
               >
                 <Activity className="w-4 h-4" /> Live Feed
               </button>
            </div>
          </div>

          {/* ROW 1: Executive KPI Cards (6) */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Total Materials Collected', val: '1,425', unit: 'Tons', trend: [20, 35, 25, 45, 60, 50, 75], color: '#10b981' },
              { label: 'Collected Material Value', val: 'KES 42.5M', unit: '', trend: [40, 35, 55, 45, 65, 70, 85], color: '#3b82f6' },
              { label: 'Total Hub Dropoffs', val: '8,420', unit: '', trend: [10, 15, 12, 25, 20, 30, 35], color: '#f59e0b' },
              { label: 'Hub Collection', val: '845', unit: 'Tons', trend: [5, 10, 15, 12, 18, 25, 22], color: '#8b5cf6' },
              { label: 'RFQs Won', val: '142', unit: '', trend: [10, 8, 15, 12, 20, 18, 25], color: '#ec4899' },
              { label: 'Transactions', val: '12,450', unit: '', trend: [40, 45, 42, 50, 48, 55, 60], color: '#14b8a6' },
            ].map((kpi, i) => (
              <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between ${cardBg}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest truncate mb-3 ${textSub}`}>{kpi.label}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className={`text-xl lg:text-2xl font-bold tracking-tight ${textTitle}`}>{kpi.val}</span>
                    {kpi.unit && <span className={`text-xs ml-1 font-semibold ${textSub}`}>{kpi.unit}</span>}
                  </div>
                  <Sparkline data={kpi.trend} color={kpi.color} />
                </div>
              </div>
            ))}
          </div>

          {/* ROW 2: Additional KPI Cards (6) */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Total Agents', val: '3,240', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Fleet Collection', val: '580 Tons', icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
              { label: 'Completed Pickups', val: '24,150', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Agent Complaints', val: '14', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
              { label: 'Fleet Utilization', val: '84%', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Fleet Rating', val: '4.8/5.0', icon: Zap, color: 'text-teal-500', bg: 'bg-teal-500/10' },
            ].map((kpi, i) => (
              <div key={i} className={`p-4 rounded-xl border flex items-center gap-4 ${cardBg}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.bg}`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${textSub}`}>{kpi.label}</p>
                  <p className={`text-lg font-bold tracking-tight truncate ${textTitle}`}>{kpi.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ROW 3: Analytics Visualizations (4 Column Grid) */}
          <div className="grid xl:grid-cols-4 gap-4 lg:gap-6">
            {/* Multi-line chart (Col span 2) */}
            <div className={`xl:col-span-2 p-5 rounded-2xl border ${cardBg}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 ${textTitle}`}>Material Intake Trends</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_INTAKE_TRENDS} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff10' : '#00000010'} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
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
            </div>

            {/* Horizontal Bar Chart (Col span 1) */}
            <div className={`p-5 rounded-2xl border ${cardBg}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 ${textTitle}`}>Collection by Location</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_LOCATION_RANKING} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff10' : '#00000010'} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} width={80} />
                    <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Agents Table & Payouts Bar (Col span 1) */}
            <div className={`p-5 rounded-2xl border flex flex-col ${cardBg}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${textTitle}`}>Top Agents & Payouts</h3>
              
              {/* Leaderboard */}
              <div className="flex-1 overflow-y-auto mb-4 scrollbar-hide">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`text-[10px] uppercase tracking-wider font-bold ${textSub} border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                      <th className="pb-2 font-bold">Agent</th>
                      <th className="pb-2 text-right font-bold">Kg</th>
                      <th className="pb-2 text-right font-bold">Pickups</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {MOCK_TOP_AGENTS.map((agent, i) => (
                      <tr key={i} className={`border-b last:border-0 ${isDarkMode ? 'border-white/5' : 'border-slate-50'}`}>
                        <td className={`py-2 font-semibold truncate max-w-[100px] ${textTitle}`}>{agent.name}</td>
                        <td className={`py-2 text-right font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{agent.kg}</td>
                        <td className={`py-2 text-right font-medium ${textSub}`}>{agent.pickups}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tiny Payouts chart */}
              <div className="h-[80px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_PAYOUTS} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: isDarkMode ? '#94a3b8' : '#64748b' }} dy={5} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ROW 4: Advanced Intelligence */}
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            
            {/* Fleet Status Donut */}
            <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center relative ${cardBg}`}>
              <h3 className={`absolute top-5 left-5 text-sm font-bold uppercase tracking-wider ${textTitle}`}>Fleet Status</h3>
              <div className="h-[200px] w-full mt-8 relative">
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
            </div>

            {/* Completed Pickups Bar */}
            <div className={`p-5 rounded-2xl border ${cardBg}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-sm font-bold uppercase tracking-wider ${textTitle}`}>Completed Pickups</h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded bg-slate-100 dark:bg-surface-800 ${textSub}`}>Today</span>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_PICKUPS_DAILY} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff10' : '#00000010'} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                    <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                    <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Material Comp Donut */}
            <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center relative ${cardBg}`}>
              <h3 className={`absolute top-5 left-5 text-sm font-bold uppercase tracking-wider ${textTitle}`}>Material Comp</h3>
              <div className="h-[200px] w-full mt-8 relative">
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
            </div>

            {/* Revenue Growth Area */}
            <div className={`p-5 rounded-2xl border ${cardBg}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 ${textTitle}`}>Revenue Growth</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_REVENUE_GROWTH} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff10' : '#00000010'} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* ROW 5: ESG & Sustainability */}
          <div>
            <h2 className={`text-sm font-bold uppercase tracking-widest mb-4 mt-4 ${textSub}`}>ESG & Environmental Impact</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                { label: 'CO₂ Saved', val: '4,520', unit: 'Tons', icon: Globe, color: 'text-emerald-500' },
                { label: 'Landfill Diversion', val: '92.4', unit: '%', icon: RecycleIcon, color: 'text-indigo-500' },
                { label: 'Trees Equivalent', val: '12,400', unit: '', icon: Leaf, color: 'text-teal-500' },
                { label: 'Communities Served', val: '142', unit: '', icon: Users, color: 'text-amber-500' },
                { label: 'Water Saved', val: '8.2M', unit: 'Liters', icon: DropletIcon, color: 'text-blue-500' },
                { label: 'Energy Recovered', val: '450', unit: 'MWh', icon: Zap, color: 'text-rose-500' },
              ].map((esg, i) => (
                <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between ${cardBg}`}>
                   <div className="flex items-center gap-2 mb-4">
                     <esg.icon className={`w-4 h-4 ${esg.color}`} />
                     <span className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>{esg.label}</span>
                   </div>
                   <div className="flex items-baseline gap-1">
                     <span className={`text-2xl font-bold tracking-tight ${textTitle}`}>{esg.val}</span>
                     {esg.unit && <span className={`text-xs font-semibold ${textSub}`}>{esg.unit}</span>}
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROW 6: Marketplace Intelligence */}
          <div className="grid xl:grid-cols-3 gap-4 lg:gap-6">
            
            {/* RFQ Pipeline Funnel (Mocked as BarChart) */}
            <div className={`p-5 rounded-2xl border ${cardBg}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 ${textTitle}`}>RFQ Pipeline</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Open', value: 450, fill: '#3b82f6' },
                    { name: 'Submitted', value: 320, fill: '#8b5cf6' },
                    { name: 'Negotiation', value: 150, fill: '#f59e0b' },
                    { name: 'Awarded', value: 95, fill: '#10b981' },
                    { name: 'Completed', value: 80, fill: '#059669' },
                  ]} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} width={80} />
                    <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                       {/* Label at end of bar */}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Geographic Heatmap */}
            <div className={`p-5 rounded-2xl border flex flex-col ${cardBg}`}>
               <div className="flex items-center justify-between mb-4">
                 <h3 className={`text-sm font-bold uppercase tracking-wider ${textTitle}`}>Collection Density</h3>
                 <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-indigo-500/10 text-indigo-500`}>Nairobi HQ</span>
               </div>
               <div className="flex-1 rounded-xl overflow-hidden relative border border-slate-200 dark:border-white/5 z-0">
                  <MapContainer center={[-1.2921, 36.8219]} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer
                      url={isDarkMode 
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
                      attribution='&copy; OpenStreetMap'
                    />
                    {/* Mock Heatmap using Circles */}
                    {HEATMAP_POINTS.map((point, idx) => (
                      <Circle 
                        key={idx} 
                        center={[point.lat, point.lng]} 
                        pathOptions={{ 
                          fillColor: point.intensity > 0.7 ? '#ef4444' : point.intensity > 0.4 ? '#f59e0b' : '#10b981', 
                          fillOpacity: 0.5, 
                          weight: 0 
                        }} 
                        radius={point.intensity * 3000} 
                      />
                    ))}
                  </MapContainer>
               </div>
            </div>

            {/* Top Buyers */}
            <div className={`p-5 rounded-2xl border ${cardBg}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 ${textTitle}`}>Top Buyers</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_TOP_BUYERS} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff10' : '#00000010'} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} width={100} />
                    <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* ROW 7: Financial Intelligence */}
          <div className="grid xl:grid-cols-4 gap-4 lg:gap-6 pb-12">
            
            {/* Revenue Breakdown */}
            <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center relative ${cardBg}`}>
              <h3 className={`absolute top-5 left-5 text-sm font-bold uppercase tracking-wider ${textTitle}`}>Revenue Breakdown</h3>
              <div className="h-[200px] w-full mt-8 relative">
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
            </div>

            {/* Profitability Analysis */}
            <div className={`p-5 rounded-2xl border ${cardBg}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 ${textTitle}`}>Profitability Margin (%)</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_PROFITABILITY} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff10' : '#00000010'} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                    <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                    <Bar dataKey="margin" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Procurement Spend */}
            <div className={`p-5 rounded-2xl border ${cardBg}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 ${textTitle}`}>Procurement Spend</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_SPEND} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff10' : '#00000010'} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} width={80} />
                    <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Agent vs Hub */}
            <div className={`p-5 rounded-2xl border ${cardBg}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 ${textTitle}`}>Agent vs Hub Collection</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_AGENT_VS_HUB} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff10' : '#00000010'} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Agent" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Hub" stroke="#06b6d4" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ── SLIDING RIGHT SIDEBAR (Always available via toggle) ── */}
      <div className={`absolute top-0 right-0 h-full transition-transform duration-300 z-30 flex ${isSidebarOpen ? 'translate-x-0' : 'translate-x-[320px]'}`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-1/2 -left-8 -translate-y-1/2 w-8 h-16 flex items-center justify-center rounded-l-xl border-y border-l shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.1)] transition-colors
            ${isDarkMode ? 'bg-surface-900 border-white/5 hover:bg-surface-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
        >
          {isSidebarOpen ? <ChevronRight className="w-5 h-5 text-slate-400" /> : <ChevronLeft className="w-5 h-5 text-slate-400" />}
        </button>

        {/* Sidebar Content */}
        <div className={`w-[320px] h-full border-l shadow-2xl flex flex-col ${isDarkMode ? 'bg-surface-900/95 backdrop-blur border-white/5' : 'bg-white/95 backdrop-blur border-slate-200'}`}>
          <div className={`p-4 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
             <h3 className={`font-bold uppercase tracking-wider text-sm ${textTitle}`}>Live Operations Feed</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
             {/* AI Insights Block */}
             <div>
               <div className="flex items-center gap-2 mb-3">
                 <Zap className="w-4 h-4 text-amber-500" />
                 <h4 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>AI Insights</h4>
               </div>
               <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                 <p className={`text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                   Market forecast: PET demand increasing by 15% next week. Consider holding inventory.
                 </p>
               </div>
             </div>

             {/* Latest Operations */}
             <div>
               <div className="flex items-center gap-2 mb-3">
                 <Activity className="w-4 h-4 text-emerald-500" />
                 <h4 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Latest Activity</h4>
               </div>
               <div className="space-y-4">
                  {[
                    { title: 'Truck Arrived', desc: 'KDA 123G (Kamau Logistics)', time: '2m ago', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { title: 'Ticket Closed', desc: 'Ticket #4402 - PET 1.2T', time: '15m ago', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { title: 'Payout Sent', desc: 'KES 45,000 to Agent', time: '1h ago', icon: Wallet, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                  ].map((feed, i) => (
                    <div key={i} className="flex gap-3">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${feed.bg}`}>
                         <feed.icon className={`w-4 h-4 ${feed.color}`} />
                       </div>
                       <div>
                         <p className={`text-xs font-bold ${textTitle}`}>{feed.title}</p>
                         <p className={`text-[10px] font-medium ${textSub}`}>{feed.desc}</p>
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
                 <h4 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Recent RFQs</h4>
               </div>
               <div className="space-y-3">
                  {[
                    { company: 'Global Plastics', req: '100T PET', status: 'Accepted' },
                    { company: 'Nairobi Mills', req: '50T Paper', status: 'Pending' },
                  ].map((rfq, i) => (
                    <div key={i} className={`p-3 rounded-xl border flex flex-col gap-1 ${isDarkMode ? 'bg-surface-800 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between">
                         <span className={`text-xs font-bold ${textTitle}`}>{rfq.company}</span>
                         <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${rfq.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{rfq.status}</span>
                      </div>
                      <span className={`text-[10px] font-medium ${textSub}`}>{rfq.req}</span>
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

print("Updated ExecutiveCommandCenter.tsx")
