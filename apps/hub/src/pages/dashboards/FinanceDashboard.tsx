import React, { useState, useEffect } from 'react';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { 
   Wallet, Activity, ArrowRight, ChevronDown, BarChart3, LineChart as LineChartIcon, LayoutDashboard, Target, Building2, TrendingDown, DollarSign, PiggyBank, CreditCard, Banknote, Percent, ChevronLeft, ChevronRight, AlertCircle, TrendingUp
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import {
   LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart as RePieChart, Pie, Cell,
   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// ─── MOCK DATA ─────────────────────────────────────────────────────────────

const MOCK_DAILY_PAYOUTS = [
   { name: 'Mon', value: 450000 },
   { name: 'Tue', value: 520000 },
   { name: 'Wed', value: 480000 },
   { name: 'Thu', value: 610000 },
   { name: 'Fri', value: 590000 },
   { name: 'Sat', value: 320000 },
   { name: 'Sun', value: 210000 },
];

const MOCK_WEEKLY_PAYOUTS = [
   { name: 'Week 1', value: 2400000 },
   { name: 'Week 2', value: 2600000 },
   { name: 'Week 3', value: 2100000 },
   { name: 'Week 4', value: 2900000 },
];

const MOCK_PAYMENT_TYPES = [
   { name: 'Jan', cash: 4500000, wallet: 8500000 },
   { name: 'Feb', cash: 4200000, wallet: 9200000 },
   { name: 'Mar', cash: 3800000, wallet: 10500000 },
   { name: 'Apr', cash: 4100000, wallet: 9800000 },
   { name: 'May', cash: 3500000, wallet: 11200000 },
   { name: 'Jun', cash: 3200000, wallet: 12400000 },
];

const MOCK_MATERIALS_VALUE = [
   { name: 'PET Plastics', value: 12500000 },
   { name: 'Aluminum', value: 8200000 },
   { name: 'Cardboard', value: 5400000 },
   { name: 'HDPE', value: 4100000 },
   { name: 'Glass', value: 1800000 },
];

const MOCK_PAYOUTS_TYPE = [
   { name: 'Sellers', value: 45, color: '#10b981' }, // emerald
   { name: 'RFQ', value: 30, color: '#3b82f6' }, // blue
   { name: 'Walk-ins', value: 15, color: '#f59e0b' }, // amber
   { name: 'Other', value: 10, color: '#8b5cf6' }, // purple
];

const MOCK_MONEY_USAGE = [
   { name: 'Week 1', usage: 1200000 },
   { name: 'Week 2', usage: 1800000 },
   { name: 'Week 3', usage: 1500000 },
   { name: 'Week 4', usage: 2200000 },
   { name: 'Week 5', usage: 1900000 },
];

const MOCK_CASHFLOW = [
   { name: 'Q1', inflow: 15000000, outflow: 12000000 },
   { name: 'Q2', inflow: 18000000, outflow: 14500000 },
   { name: 'Q3', inflow: 22000000, outflow: 16000000 },
   { name: 'Q4', inflow: 25000000, outflow: 18500000 },
];

const MOCK_COMPLAINTS_TYPE = [
   { name: 'Vehicle Breakdown', value: 45, color: '#ef4444' },
   { name: 'App Issues', value: 30, color: '#f59e0b' },
   { name: 'Salary', value: 15, color: '#3b82f6' },
   { name: 'Route', value: 10, color: '#8b5cf6' },
];


export default function FinanceDashboard() {
   const { isDarkMode } = useThemeStore();
   const currentCompanyId = useAuthStore(s => (s as any).currentCompanyId);
   const profile = useAuthStore(s => (s as any).profile);
   const currentCompanyName = useAuthStore(s => (s as any).currentCompanyName);
   const [kpis, setKpis] = useState<any>(null);
   const [payoutView, setPayoutView] = useState<'daily' | 'weekly'>('daily');

   useEffect(() => {
      if (!currentCompanyId) return;
      const fetchKpis = async () => {
         const { data } = await supabase.rpc('rpc_get_finance_kpis' as any, { p_company_id: currentCompanyId });
         if (data) setKpis(data);
      };
      fetchKpis();
   }, [currentCompanyId]);

   const Card = ({ children, className = '', flexCol = false, style }: any) => (
      <div className={`bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-5 shadow-sm ${flexCol ? 'flex flex-col' : ''} ${className}`} style={style}>
         {children}
      </div>
   );

   const SectionHeader = ({ icon: Icon, title, action, actionLabel = 'View all', onActionClick }: any) => (
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-slate-500" />}
            <h3 className="text-sm font-bold text-[#131722] dark:text-white">{title}</h3>
         </div>
         {action && (
            <button onClick={onActionClick} className="font-bold text-[10px] text-emerald-600 dark:text-emerald-400 capitalize tracking-widest hover:underline flex items-center gap-1">
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
                     <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill || '#10b981' }} />
                     <span className="capitalize">{entry.name}:</span>
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
         <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fade-in pb-20 space-y-6 pt-16 md:pt-20">
            
            {/* Header */}
            <div className="flex flex-col mb-6">
               <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {(profile?.name || 'Hub Manager').split(' ')[0]} 👋</h2>
            </div>

            {/* ROW 1: 6 KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
               {[
                  { label: 'Wallet Balance', val: '4.2', unit: 'M', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', trend: '↑ 14%', trendUp: true },
                  { label: 'Collection Value', val: '18.5', unit: 'M', icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', trend: '↑ 8%', trendUp: true },
                  { label: 'Wallet Payouts', val: '8.4', unit: 'M', icon: CreditCard, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', trend: '↑ 12%', trendUp: true },
                  { label: 'Transactions', val: '1,204', unit: '', icon: Activity, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10', trend: '↓ 4%', trendUp: false },
                  { label: 'Cash Paid Out', val: '2.1', unit: 'M', icon: Banknote, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', trend: '↑ 15%', trendUp: true },
                  { label: 'Agent Disbursements', val: '5.6', unit: 'M', icon: PiggyBank, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', trend: '↑ 2%', trendUp: true },
               ].map((kpi, i) => (
                  <Card key={i} className="flex flex-col justify-between">
                     <div className="flex items-center gap-3 mb-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg}`}>
                           <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="font-bold text-[9px] xl:text-[10px] text-slate-500 uppercase tracking-widest mb-1 truncate">{kpi.label}</p>
                           <h2 className={`text-xl xl:text-2xl font-bold text-slate-700 tracking-tighter truncate ${textTitle}`}>
                              {kpi.val} {kpi.unit && <span className="text-sm font-semibold text-slate-400">{kpi.unit}</span>}
                           </h2>
                        </div>
                     </div>
                     <div className="flex items-center gap-1.5  pt-3 border-t border-[#e0e3eb] dark:border-slate-700/50">
                        <span className={`text-[11px] font-bold ${kpi.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>{kpi.trend}</span>
                        <span className="font-medium text-[10px] text-slate-500">vs last month</span>
                     </div>
                  </Card>
               ))}
            </div>

            {/* ROW 2: 2 Visualization Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
               
               {/* Payouts Made (Daily/Weekly toggle) */}
               <Card className="flex flex-col h-full bg-gradient-to-br from-blue-500 to-indigo-500  border-blue-100/50 dark:border-blue-800/30">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-sm font-bold text-[#131722] dark:text-white">Payouts Made</h3>
                     <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                        <button 
                           onClick={() => setPayoutView('daily')} 
                           className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${payoutView === 'daily' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                           Daily
                        </button>
                        <button 
                           onClick={() => setPayoutView('weekly')} 
                           className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${payoutView === 'weekly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                           Weekly
                        </button>
                     </div>
                  </div>
                  <div className="flex-1 w-full min-h-[280px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={payoutView === 'daily' ? MOCK_DAILY_PAYOUTS : MOCK_WEEKLY_PAYOUTS} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffffff' }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#ffffffff' }} />
                           <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                           <Bar dataKey="value" name="Payouts" fill="rgba(255, 255, 255, 1)" radius={[4, 4, 0, 0]} barSize={payoutView === 'daily' ? 20 : 32} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>

               {/* Cash vs Wallet Payments */}
               <Card className="flex flex-col h-full bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-100/50 dark:border-emerald-800/30">
                  <SectionHeader title="Cash vs Wallet Payments" action="YTD" />
                  <div className="flex-1 w-full min-h-[280px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_PAYMENT_TYPES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffffff' }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{ fontSize: 10, fill: '#ffffffff' }} />
                           <Tooltip content={<CustomTooltip />} />
                           <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                           <Line type="monotone" dataKey="cash" name="Cash Payments" stroke="#0dff00ff" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                           <Line type="monotone" dataKey="wallet" name="Wallet Payments" stroke="#ffffffff" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
            </div>

            {/* ROW 3: 4 Visualization Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-1 !mt-2">
               
               {/* Payouts by Type (Pie) */}
               <Card className="flex flex-col relative h-full">
                  <SectionHeader title="Payouts by Type" />
                  <div className="flex-1 flex flex-row items-center w-full relative">
                     <div className="flex-1 h-[260px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                           <RePieChart>
                              <Pie data={MOCK_PAYOUTS_TYPE} cx="50%" cy="50%" innerRadius={10} outerRadius={125} paddingAngle={0} dataKey="value" stroke="none">
                                 {MOCK_PAYOUTS_TYPE.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                           </RePieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="w-[140px] flex flex-col justify-center gap-4 pl-4 border-l border-[#e0e3eb] dark:border-slate-700/50">
                        {MOCK_PAYOUTS_TYPE.map(s => (
                           <div key={s.name} className="flex flex-col">
                              <div className="flex items-center gap-2 mb-1">
                                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                                 <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>{s.name}</span>
                              </div>
                              <span className={`text-lg font-bold pl-4 ${textTitle}`}>{s.value}%</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </Card>

               

               {/* Cashflow In vs Out */}
               <Card className="flex flex-col h-full">
                  <SectionHeader title="Cashflow (In vs Out)" action="YTD" />
                  <div className="flex-1 w-full min-h-[280px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_CASHFLOW} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                           <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                           <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                           <Bar dataKey="inflow" name="Inflow" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                           <Bar dataKey="outflow" name="Outflow" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
                {/* Materials Bought Ranking */}
               <Card className="flex flex-col h-full">
                  <SectionHeader title="Materials Bought (By Value)" action="This Month" />
                  <div className="flex-1 w-full min-h-[280px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_MATERIALS_VALUE} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} horizontal={true} vertical={false} />
                           <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                           <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                           <Tooltip cursor={{ fill: isDarkMode ? '#ffffff05' : '#00000005' }} content={<CustomTooltip />} />
                           <Bar dataKey="value" name="Value (KES)" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
            </div>
            {/* ROW 4: 4 Visualization Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-1 !mt-2">  
               {/* Money Usage Over Time */}
               <Card className="flex flex-col h-full">
                  <SectionHeader title="Collection Value over time" action="This Month" />
                  <div className="flex-1 w-full min-h-[280px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MOCK_MONEY_USAGE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <defs>
                              <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                           <Tooltip content={<CustomTooltip />} />
                           <Area type="monotone" dataKey="usage" name="Total Usage" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
               {/* Complaints by Type */}
               <Card className="flex flex-col relative h-full">
                  <SectionHeader title="Finance Issues by Type" />
                  <div className="flex-1 flex flex-row items-center w-full relative">
                     <div className="flex-1 h-[260px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                           <RePieChart>
                              <Pie data={MOCK_COMPLAINTS_TYPE} cx="50%" cy="50%" innerRadius={40} outerRadius={100} paddingAngle={1} dataKey="value" stroke="none">
                                 {MOCK_COMPLAINTS_TYPE.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                           </RePieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="w-[140px] flex flex-col justify-center gap-4 pl-4 border-l border-[#e0e3eb] dark:border-slate-700/50">
                        {MOCK_COMPLAINTS_TYPE.map(s => (
                           <div key={s.name} className="flex flex-col">
                              <div className="flex items-center gap-2 mb-1">
                                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                                 <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>{s.name}</span>
                              </div>
                              <span className={`text-lg font-bold pl-4 ${textTitle}`}>{s.value}%</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </Card>
            </div>
         </div>
         
      </div>
   );
}