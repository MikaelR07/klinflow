import React, { useState, useEffect } from 'react';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { 
   TrendingUp, Scale, Truck, Wallet, Leaf, Activity, ArrowRight, MoreHorizontal,
   Warehouse, ShoppingCart, MapPin, AlertCircle, Globe, Sprout, ChevronRight,
   ChevronLeft, BarChart3, CheckCircle2, Users, Factory, FileText, Zap, ShieldCheck, PieChart, LineChart as LineChartIcon, LayoutDashboard, ChevronDown
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import {
   LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart as RePieChart, Pie, Cell,
   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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
   { name: 'Industrial Area', value: 8500, max: 10000 },
   { name: 'Westlands', value: 6200, max: 10000 },
   { name: 'Embakasi', value: 5400, max: 10000 },
   { name: 'Kasarani', value: 4800, max: 10000 },
   { name: 'Kibera', value: 4200, max: 10000 },
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
   { name: 'Global Plastics', value: 12000000, max: 15000000 },
   { name: 'Nairobi Mills', value: 8500000, max: 15000000 },
   { name: 'EcoGlass Kenya', value: 5200000, max: 15000000 },
   { name: 'MetalWorks Ltd', value: 4100000, max: 15000000 },
];

const MOCK_RFQ_PIPELINE = [
   { name: 'Open RFQs', value: 450, max: 500, color: 'bg-blue-500' },
   { name: 'Submitted Quotes', value: 320, max: 500, color: 'bg-indigo-500' },
   { name: 'In Negotiation', value: 150, max: 500, color: 'bg-amber-500' },
   { name: 'Awarded Contracts', value: 95, max: 500, color: 'bg-emerald-500' },
   { name: 'Completed', value: 80, max: 500, color: 'bg-teal-600' },
];

const MOCK_PROFITABILITY = [
   { name: 'PET', profit: 450000, margin: 24 },
   { name: 'HDPE', profit: 320000, margin: 18 },
   { name: 'Cardboard', profit: 280000, margin: 12 },
   { name: 'Metal', profit: 150000, margin: 35 },
];

// Heatmap Mock Points
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

export default function ExecutiveDashboard() {
   const { isDarkMode } = useThemeStore();
   const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
   const currentCompanyId = useAuthStore(s => (s as any).currentCompanyId);
   const profile = useAuthStore(s => (s as any).profile);
   const currentCompanyName = useAuthStore(s => (s as any).currentCompanyName);
   const [kpis, setKpis] = useState<any>(null);

   useEffect(() => {
      if (!currentCompanyId) return;
      const fetchKpis = async () => {
         const { data } = await supabase.rpc('rpc_get_executive_kpis', { p_company_id: currentCompanyId });
         if (data) setKpis(data);
      };
      fetchKpis();
   }, [currentCompanyId]);

   const Card = ({ children, className = '', flexCol = false, style }: any) => (
      <div className={`bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 shadow-none ${flexCol ? 'flex flex-col' : ''} ${className}`} style={style}>
         {children}
      </div>
   );

   const SectionHeader = ({ icon: Icon, title, action, actionLabel = 'View all' }: any) => (
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
            {Icon && <Icon className="font-medium w-4 h-4 text-slate-500" />}
            <h3 className="text-xs font-bold text-[#131722] dark:text-white">{title}</h3>
         </div>
         {action && (
            <button className="font-medium text-[10px] text-primary capitalize tracking-widest hover:underline flex items-center gap-1">
               {actionLabel} <ChevronDown className="w-3 h-3" />
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
      <div className="flex h-full w-full relative bg-transparent overflow-hidden">
         {/* ── MAIN SCROLLABLE DASHBOARD ── */}
         <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fade-in pb-20 space-y-6 pt-16 md:pt-20">
            
            {/* Header */}
            <div className="flex flex-col mb-6">
               <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {(profile?.name || 'Executive').split(' ')[0]} 👋</h2>
            </div>

            {/* ROW 1: KPI Cards (6 cards) */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
               {[
                  { label: 'Total Intake', val: kpis ? `${kpis.totalIntake}` : '240', unit: 'Kg', icon: Factory, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', cardBg: '!bg-emerald-50/30 dark:!bg-emerald-500/5', trend: '↑ 15.2%', trendUp: true },
                  { label: 'Active Agents', val: kpis ? `${kpis.activeAgents}` : '142', unit: '', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', cardBg: '!bg-blue-50/30 dark:!bg-blue-500/5', trend: '↑ 8.4%', trendUp: true },
                  { label: 'Monthly Revenue', val: kpis ? `KES ${kpis.monthlyRevenue}` : 'KES 4.2M', unit: '', icon: Wallet, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', cardBg: '!bg-fuchsia-50/30 dark:!bg-fuchsia-500/5', trend: '↑ 12.1%', trendUp: true },
                  { label: 'Completed Pickups', val: kpis ? `${kpis.completedPickups}` : '840', unit: '', icon: CheckCircle2, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10', cardBg: '!bg-violet-50/30 dark:!bg-violet-500/5', trend: '↓ 2.4%', trendUp: false },
                  { label: 'RFQs Won', val: '142', unit: '', icon: FileText, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/10', cardBg: '!bg-pink-50/30 dark:!bg-pink-500/5', trend: '↑ 5.0%', trendUp: true },
                  { label: 'Transactions', val: '12,450', unit: '', icon: Activity, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', cardBg: '!bg-teal-50/30 dark:!bg-teal-500/5', trend: '↑ 22.4%', trendUp: true },
               ].map((kpi, i) => (
                  <Card key={i} className={`!p-4 ${kpi.cardBg}`}>
                     <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                           <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="font-bold text-[9px] xl:text-[10px] text-slate-500 uppercase tracking-widest truncate">{kpi.label}</p>
                           <h2 className={`text-base xl:text-lg font-bold text-slate-700 tracking-tighter truncate ${textTitle}`}>
                              {kpi.val} {kpi.unit && <span className="text-xs ml-0.5 font-semibold text-slate-400">{kpi.unit}</span>}
                           </h2>
                        </div>
                     </div>
                     <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-[#e0e3eb] dark:border-slate-700/50">
                        <span className={`text-[11px] font-bold ${kpi.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>{kpi.trend}</span>
                        <span className="font-medium text-[10px] text-slate-500">vs last month</span>
                     </div>
                  </Card>
               ))}
            </div>

            {/* ROW 2: Additional KPI Cards (6 cards) */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 !mt-1">
               {[
                  { label: 'Total Agents', val: '3,240', unit: '', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', trend: '↑ 4.2%', trendUp: true },
                  { label: 'Fleet Collection', val: '580', unit: 'Tons', icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', trend: '↑ 12.5%', trendUp: true },
                  { label: 'Complaints', val: '14', unit: '', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', trend: '↓ 12.0%', trendUp: true },
                  { label: 'Fleet Utilization', val: '84', unit: '%', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', trend: '↑ 2.4%', trendUp: true },
                  { label: 'ESG Score', val: '92', unit: '/100', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', trend: '↑ 1.5', trendUp: true },
                  { label: 'Fleet Rating', val: '4.8', unit: '/5.0', icon: Zap, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', trend: '↑ 0.1', trendUp: true },
               ].map((kpi, i) => (
                  <Card key={i} className="!p-4">
                     <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                           <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="font-bold text-[9px] xl:text-[10px] text-slate-500 uppercase tracking-widest truncate">{kpi.label}</p>
                           <h2 className={`text-base xl:text-lg font-bold text-slate-700 tracking-tighter truncate ${textTitle}`}>
                              {kpi.val} {kpi.unit && <span className="text-xs ml-0.5 font-semibold text-slate-400">{kpi.unit}</span>}
                           </h2>
                        </div>
                     </div>
                     <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-[#e0e3eb] dark:border-slate-700/50">
                        <span className={`text-[11px] font-bold ${kpi.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>{kpi.trend}</span>
                        <span className="font-medium text-[10px] text-slate-500">vs last month</span>
                     </div>
                  </Card>
               ))}
            </div>

            {/* ROW 3: Financials (3 cards) */}
            <div className="mb-1 mt-4">
               <h2 className={`text-sm font-bold ${textTitle}`}>Financial Overview</h2>
               <p className={`text-[11px] ${textSub}`}>Revenue trajectory, payouts, and margin breakdown</p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-2">
               {/* Revenue Growth Area */}
               <Card className="flex flex-col">
                  <SectionHeader title="Revenue Growth (KES)" action="Monthly" />
                  <div className="h-[320px] w-full mt-2">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MOCK_REVENUE_GROWTH} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                           <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                           <Tooltip content={<CustomTooltip />} />
                           <Area type="monotone" dataKey="revenue" stroke="#d946ef" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </Card>

               {/* Weekly Payouts */}
               <Card className="flex flex-col h-full" style={{ background: isDarkMode ? 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(99,102,241,0.04) 100%)' : 'linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(99,102,241,1) 100%)' }}>
                  <SectionHeader title="Weekly Payouts" action="This Month" />
                  <div className="flex-1 w-full pt-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_PAYOUTS} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#ffffffff'} vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffffff' }} dy={5} />
                           <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#ffffffff' }} />
                           <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                           <Bar dataKey="amount" name="Payout" fill="#31d02eff" radius={[2, 2, 0, 0]} barSize={24} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>

               {/* Revenue Breakdown */}
               <Card className="flex flex-col items-center justify-between relative">
                  <div className="w-full">
                     <SectionHeader title="Revenue Breakdown" />
                  </div>
                  <div className="h-[220px] w-full relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                           <Pie data={MOCK_MATERIAL_COMPOSITION} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                              {MOCK_MATERIAL_COMPOSITION.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                           </Pie>
                           <Tooltip content={<CustomTooltip />} />
                        </RePieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                        <span className={`text-2xl font-bold ${textTitle}`}>100%</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>Total</span>
                     </div>
                  </div>
                  <div className="w-full flex flex-wrap items-center justify-center gap-3 mt-4 pt-4 border-t border-[#e0e3eb] dark:border-slate-700/50">
                     {MOCK_MATERIAL_COMPOSITION.map(s => (
                        <div key={s.name} className="flex items-center gap-1.5">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                           <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>{s.name}</span>
                           <span className={`text-[10px] font-bold ${textTitle}`}>{s.value}%</span>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>

            {/* ROW 4: Operations & Supply (3 cards) */}
            <div className="mb-1 mt-4">
               <h2 className={`text-sm font-bold ${textTitle}`}>Operations Intelligence</h2>
               <p className={`text-[11px] ${textSub}`}>Fleet capability, agent leadership, and RFQ pipeline</p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-2">
               {/* Fleet Status Donut */}
               <Card className="flex flex-col items-center justify-between relative">
                  <div className="w-full">
                     <SectionHeader title="Fleet Status" />
                  </div>
                  <div className="h-[220px] w-full relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                           <Pie data={MOCK_FLEET_STATUS} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                              {MOCK_FLEET_STATUS.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                           </Pie>
                           <Tooltip content={<CustomTooltip />} />
                        </RePieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                        <span className={`text-2xl font-bold ${textTitle}`}>100</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>Total</span>
                     </div>
                  </div>
                  <div className="w-full flex flex-wrap items-center justify-center gap-3 mt-4 pt-4 border-t border-[#e0e3eb] dark:border-slate-700/50">
                     {MOCK_FLEET_STATUS.map(s => (
                        <div key={s.name} className="flex items-center gap-1.5">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                           <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>{s.name}</span>
                           <span className={`text-[10px] font-bold ${textTitle}`}>{s.value}</span>
                        </div>
                     ))}
                  </div>
               </Card>

               {/* Top Agents Table */}
               <Card className="flex flex-col">
                  <SectionHeader title="Top Agents Leaderboard" action="This Month" />
                  <div className="flex-1 overflow-y-auto scrollbar-hide h-[320px]">
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
                                 <td className={`py-4 font-bold truncate max-w-[120px] ${textTitle}`}>{agent.name}</td>
                                 <td className={`py-4 text-right font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{agent.kg}</td>
                                 <td className={`py-4 text-right font-bold ${textSub}`}>{agent.pickups}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </Card>

               {/* RFQ Pipeline Bars */}
               <Card className="flex flex-col">
                  <SectionHeader title="RFQ Pipeline" action="View All" />
                  <div className="h-[320px] overflow-y-auto space-y-6 pr-2 pt-4 scrollbar-hide">
                     {MOCK_RFQ_PIPELINE.map((rfq, i) => (
                        <div key={i} className="w-full relative">
                           <div className="flex justify-between items-end mb-2 relative z-10">
                              <span className={`text-[11px] font-bold uppercase tracking-widest ${textSub}`}>{rfq.name}</span>
                              <span className={`text-[12px] font-bold ${textTitle}`}>{rfq.value.toLocaleString()}</span>
                           </div>
                           <div className={`w-full h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                              <div className={`h-full ${rfq.color} rounded-full`} style={{ width: `${(rfq.value / rfq.max) * 100}%` }}></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>

            {/* ROW 5: Market & Geography (3 cards) */}
            <div className="mb-1 mt-4">
               <h2 className={`text-sm font-bold ${textTitle}`}>Market Dynamics</h2>
               <p className={`text-[11px] ${textSub}`}>Pickup trends, top buyers, and collection density</p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-2">
               {/* Completed Pickups Bar */}
               <Card className="flex flex-col">
                  <SectionHeader title="Completed Pickups" action="Today" />
                  <div className="h-[320px] w-full mt-2">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_PICKUPS_DAILY} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                           <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                           <Bar dataKey="completed" name="Pickups" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>

               {/* Top Buyers HTML Bars */}
               <Card className="flex flex-col">
                  <SectionHeader title="Top Buyers" action="This Month" />
                  <div className="h-[320px] overflow-y-auto space-y-6 pr-2 pt-4 scrollbar-hide">
                     {MOCK_TOP_BUYERS.map((buyer, i) => (
                        <div key={i} className="w-full relative">
                           <div className="flex justify-between items-end mb-2 relative z-10">
                              <span className={`text-[11px] font-bold uppercase tracking-widest ${textSub}`}>{buyer.name}</span>
                              <span className={`text-[12px] font-bold ${textTitle}`}>KES {(buyer.value/1000000).toFixed(1)}M</span>
                           </div>
                           <div className={`w-full h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                              <div className={`h-full bg-indigo-500 rounded-full`} style={{ width: `${(buyer.value / buyer.max) * 100}%` }}></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>

               {/* Geographic Heatmap */}
               <Card className="flex flex-col !p-0 overflow-hidden relative">
                  <div className="p-4 z-10 relative">
                     <SectionHeader title="Collection Density (HQ)" />
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
            </div>

         </div>

         {/* ── RIGHT SIDEBAR (ACTIVITY FEED) ── */}
         <div className={`fixed right-0 top-0 bottom-0 w-80 z-[60] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} ${isDarkMode ? 'bg-slate-900 border-slate-800 border-l' : 'bg-slate-50 border-slate-200 border-l'}`}>
            <button 
               onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
               className={`absolute top-20 -left-10 w-10 h-10 flex items-center justify-center rounded-l-lg border border-r-0 shadow-lg cursor-pointer pointer-events-auto transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-emerald-600'}`}
            >
               {isRightSidebarOpen ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
            </button>
            <div className="p-4 border-b border-inherit">
               <h3 className="font-bold text-sm text-[#131722] dark:text-white">Executive Activity Feed</h3>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">High-level insights & alerts</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {[
                  { title: 'New RFQ awarded by Global Plastics for 50T PET', time: '15 min ago', icon: FileText, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
                  { title: 'Weekly payout of KES 1.2M successfully processed', time: '1 hr ago', icon: Wallet, bg: 'bg-fuchsia-500/10', color: 'text-fuchsia-500' },
                  { title: 'Fleet efficiency dropped below 85% threshold', time: '2 hrs ago', icon: Activity, bg: 'bg-rose-500/10', color: 'text-rose-500' },
                  { title: 'New top performing agent: Kamau Logistics', time: '4 hrs ago', icon: Users, bg: 'bg-blue-500/10', color: 'text-blue-500' },
                  { title: 'Sustainability milestone: 4,000T CO2 saved', time: '5 hrs ago', icon: Globe, bg: 'bg-teal-500/10', color: 'text-teal-500' },
               ].map((feed, i) => (
                  <div key={i} className="flex gap-3">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${feed.bg}`}>
                        <feed.icon className={`w-4 h-4 ${feed.color}`} />
                     </div>
                     <div>
                        <p className="text-xs font-medium text-[#131722] dark:text-slate-300 leading-snug">{feed.title}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{feed.time}</p>
                     </div>
                  </div>
               ))}
               
               <div className="mt-8 pt-4 border-t border-inherit">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">AI Intelligence</h4>
                  <div className="bg-fuchsia-50 dark:bg-fuchsia-900/10 rounded-xl p-3 border border-fuchsia-100 dark:border-fuchsia-500/20">
                     <p className="text-xs font-medium text-[#131722] dark:text-slate-300 mb-2">Revenue optimization identified.</p>
                     <p className="text-[10px] text-slate-500">Redirecting 20% of fleet capacity to the Industrial Area this week could increase total volume by 12% based on historical trends.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

// Quick fallback icons for ESG since they might not be imported above
function RecycleIcon(props: any) { 
   return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 5.857 9.369a1.828 1.828 0 0 1-.001-1.788 1.785 1.785 0 0 1 1.547-.887H11.5"/><path d="m3 11 3-3-3-3"/><path d="M19.743 14.244 15.5 6.904a1.828 1.828 0 0 0-1.555-.898 1.784 1.784 0 0 0-1.536.88L11 9.5"/><path d="m16 4-3 3 3 3"/></svg> }
function DropletIcon(props: any) { 
   return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg> }