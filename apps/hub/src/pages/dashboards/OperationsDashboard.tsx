import React, { useState, useEffect } from 'react';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import {
   TrendingUp, Scale, Truck, Wallet, Leaf, Activity, ArrowRight, MoreHorizontal,
   Warehouse, ShoppingCart, MapPin, AlertCircle, Globe, Sprout, ChevronRight,
   ChevronLeft, BarChart3, CheckCircle2, Users, Factory, FileText, Zap, ShieldCheck, PieChart, LineChart as LineChartIcon,
   Info, FileX, Clock, MessageSquare, ChevronDown,
   Timer,
   SearchCheck,
   SearchCode,
   Users2,
   Receipt,
   Filter
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import {
   LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart as RePieChart, Pie, Cell,
   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const MOCK_INTAKE_TRENDS = [
   { name: 'Mon', PET: 4000, HDPE: 2400, PP: 1400, LDPE: 1200, Others: 800 },
   { name: 'Tue', PET: 3000, HDPE: 1398, PP: 2210, LDPE: 1400, Others: 900 },
   { name: 'Wed', PET: 2000, HDPE: 9800, PP: 2290, LDPE: 1800, Others: 1000 },
   { name: 'Thu', PET: 2780, HDPE: 3908, PP: 2000, LDPE: 1900, Others: 1200 },
   { name: 'Fri', PET: 1890, HDPE: 4800, PP: 2181, LDPE: 2000, Others: 1300 },
   { name: 'Sat', PET: 2390, HDPE: 3800, PP: 2500, LDPE: 2100, Others: 1400 },
   { name: 'Sun', PET: 3490, HDPE: 4300, PP: 2100, LDPE: 2200, Others: 1500 },
];

const MOCK_MATERIAL_COST_TRENDS = [
   { name: 'Mon', PET: 45000, HDPE: 24000, PP: 14000, LDPE: 12000, Others: 8000 },
   { name: 'Tue', PET: 30000, HDPE: 13980, PP: 22100, LDPE: 14000, Others: 9000 },
   { name: 'Wed', PET: 20000, HDPE: 98000, PP: 22900, LDPE: 18000, Others: 10000 },
   { name: 'Thu', PET: 27800, HDPE: 39080, PP: 20000, LDPE: 19000, Others: 12000 },
   { name: 'Fri', PET: 18900, HDPE: 48000, PP: 21810, LDPE: 20000, Others: 13000 },
   { name: 'Sat', PET: 23900, HDPE: 38000, PP: 25000, LDPE: 21000, Others: 14000 },
   { name: 'Sun', PET: 34900, HDPE: 43000, PP: 21000, LDPE: 22000, Others: 15000 },
];

const MOCK_TOP_PERFORMERS = [
   { name: 'GreenCycle Youth', value: 8450, max: 10000 },
   { name: 'EcoCollect Ltd', value: 7230, max: 10000 },
   { name: 'Westlands Raiders', value: 6890, max: 10000 },
   { name: 'KleanStream', value: 5420, max: 10000 },
   { name: 'Recycle Heroes', value: 4910, max: 10000 },
];

const MOCK_LOCATION_COLLECTION = [
   { name: 'Nairobi CBD', value: 12450, max: 15000 },
   { name: 'Westlands', value: 10230, max: 15000 },
   { name: 'Kilimani', value: 8890, max: 15000 },
   { name: 'Karen', value: 5420, max: 15000 },
   { name: 'Eastleigh', value: 4910, max: 15000 },
];

const MOCK_PAYOUTS = [
   { name: 'Apr 21-27', weekly: 800000, monthly: 3200000 },
   { name: 'Apr 28-May 4', weekly: 600000, monthly: 2800000 },
   { name: 'May 5-11', weekly: 1100000, monthly: 4100000 },
   { name: 'May 12-18', weekly: 1000000, monthly: 3900000 },
   { name: 'June 04-16', weekly: 700000, monthly: 2600000 },
   { name: 'June 18-29', weekly: 1200000, monthly: 4500000 },
   { name: 'July 06-18', weekly: 1800000, monthly: 5200000 },
];

const MOCK_MATERIAL_COMPOSITION = [
   { name: 'PET', value: 46.2, kg: '59,310', color: '#10b981' },
   { name: 'HDPE', value: 21.5, kg: '27,580', color: '#3b82f6' },
   { name: 'PP', value: 13.7, kg: '17,560', color: '#8b5cf6' },
   { name: 'LDPE', value: 9.8, kg: '12,580', color: '#f59e0b' },
   { name: 'Others', value: 8.8, kg: '11,420', color: '#ef4444' },
];

const MOCK_PICKUP_STATUS = [
   { name: 'Completed', value: 256, pct: '68.1%', color: '#10b981' },
   { name: 'In Progress', value: 72, pct: '19.1%', color: '#3b82f6' },
   { name: 'Scheduled', value: 34, pct: '9.0%', color: '#f59e0b' },
   { name: 'Cancelled', value: 14, pct: '3.8%', color: '#ef4444' },
];

const MOCK_DISPUTES_REASON = [
   { name: 'Contamination', value: 8, pct: '44.4%', max: 15 },
   { name: 'Weight Mismatch', value: 5, pct: '27.8%', max: 15 },
   { name: 'Material Quality', value: 3, pct: '16.7%', max: 15 },
   { name: 'Pickup Issue', value: 2, pct: '11.1%', max: 15 },
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

const MOCK_COLLECTION_TIME = [
   { name: 'May 12', val: 15000 },
   { name: 'May 13', val: 18000 },
   { name: 'May 14', val: 21000 },
   { name: 'May 15', val: 38000 },
   { name: 'May 16', val: 22000 },
   { name: 'May 17', val: 28000 },
   { name: 'May 18', val: 39000 },
];

export default function OperationsDashboard() {
   const { isDarkMode } = useThemeStore();
   const currentCompanyId = useAuthStore(s => (s as any).currentCompanyId);
   const profile = useAuthStore(s => (s as any).profile);
   const currentCompanyName = useAuthStore(s => (s as any).currentCompanyName);
   const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
   const [kpis, setKpis] = useState<any>(null);

   useEffect(() => {
      if (!currentCompanyId) return;
      const fetchKpis = async () => {
         const { data } = await supabase.rpc('rpc_get_operations_kpis', { p_company_id: currentCompanyId });
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
            <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center mb-6">
               <div className="flex flex-col mb-6">
                  <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {(profile?.name || 'Operations Manager').split(' ')[0]} 👋</h2>
               </div>
               
            </div>
            {/* ROW 1: KPI Cards (6 cards) */}
          
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
               {[
                  { label: 'Total Collection', val: '128,450', unit: 'kg', icon: Factory, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', cardBg: '!bg-emerald-50/30 dark:!bg-emerald-500/5', trend: '↑ 12.4%' },
                  { label: 'Collection Value', val: 'KES 1.2M', unit: '', icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', cardBg: '!bg-blue-50/30 dark:!bg-blue-500/5', trend: '↑ 15.7%' },
                  { label: 'Hub Dropoffs', val: '45,200', unit: 'kg', icon: Warehouse, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', cardBg: '!bg-amber-50/30 dark:!bg-amber-500/5', trend: '↑ 8.2%' },
                  { label: 'Fleet Collection', val: '83,250', unit: 'kg', icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', cardBg: '!bg-purple-50/30 dark:!bg-purple-500/5', trend: '↑ 14.5%' },
                  { label: 'Completed Pickups', val: '342', unit: '', icon: CheckCircle2, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', cardBg: '!bg-teal-50/30 dark:!bg-teal-500/5', trend: '↑ 5.3%' },
                  { label: 'Total Payout', val: 'KES 876K', unit: '', icon: Wallet, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', cardBg: '!bg-rose-50/30 dark:!bg-rose-500/5', trend: '↑ 10.3%' },
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
                        <span className={`text-[11px] font-bold text-emerald-500`}>{kpi.trend}</span>
                        <span className="font-medium text-[10px] text-slate-500">vs May 5 - May 11</span>
                     </div>
                  </Card>
               ))}
            </div>
            
            {/* ROW 3: (2 cards) - Material Intake showing money, Payouts*/}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
               <Card className="flex flex-col" style={{ background: 'linear-gradient(135deg, rgba(7, 109, 75, 0.8)  0%, rgba(9, 150, 65, 0.8) 100%)' }}>
                  <SectionHeader title="Material Intake Value (KES)"/>
                  <div className="h-[320px] w-full pt-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_MATERIAL_COST_TRENDS} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#fafcffff' }} />
                           <YAxis axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000)}K`} tick={{ fontSize: 10, fill: '#ffffffff' }} />
                           <Tooltip content={<CustomTooltip />} />
                           <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                           <Line type="monotone" dataKey="PET" stroke="#feffffff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                           <Line type="monotone" dataKey="HDPE" stroke="#145fd6ff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                           <Line type="monotone" dataKey="PP" stroke="#4ee337ff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                           {/* <Line type="monotone" dataKey="LDPE" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                           <Line type="monotone" dataKey="Others" stroke="#ff3535ff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} /> */}
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
               
               <Card className="flex flex-col h-full" style={{ background: isDarkMode ? 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(99,102,241,0.04) 100%)' : 'linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(99,102,241,1) 100%)' }}  >
                  <SectionHeader title="Payouts" action="Weekly vs Monthly" />
                  <div className="flex-1 w-full pt-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_PAYOUTS} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#ffffffff'} vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffffff' }} dy={5} />
                           <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#ffffffff' }} />
                           <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                           <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                           <Bar dataKey="weekly" name="Weekly" fill="#ff9900ff" radius={[2, 2, 0, 0]} barSize={20} />
                           <Bar dataKey="monthly" name="Monthly" fill="#ffffffff" radius={[2, 2, 0, 0]} barSize={20} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
            </div>
            
            {/* ROW 4: (3 cards) - agent vs hub, Collection by location, waste by material,  */}
          
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-1 !mt-1">
                {/* Intake Volume Bar Graph */}
               <Card className="flex flex-col h-full !p-0 overflow-hidden" style={{ background: isDarkMode ? 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(37,99,235,0.05) 100%)' : 'linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(37,99,235,1) 100%)' }}>
                  <div className="p-4 pb-0">
                     <SectionHeader title="Intake Volume (kg)" action="Daily" />
                  </div>
                  <div className="flex-1 w-full px-2 pb-4" style={{ minHeight: 280 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_COLLECTION_TIME} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffffcc' }} dy={5} />
                           <YAxis axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}K`} tick={{ fontSize: 10, fill: '#ffffffcc' }} />
                           <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                           <Bar dataKey="val" name="Volume" fill="#ffffff" radius={[3, 3, 0, 0]} barSize={24} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
               <Card className="flex flex-col relative h-full">
                  <SectionHeader title="Waste by Material Type" />
                  <div className="flex-1 flex flex-row items-center w-full relative">
                     
                     <div className="w-[140px] flex flex-col justify-center gap-4 pl-4 border-r border-[#e0e3eb] dark:border-slate-700/50">
                        {MOCK_MATERIAL_COMPOSITION.map(s => (
                           <div key={s.name} className="flex flex-col">
                              <div className="flex items-center gap-2 mb-1">
                                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                                 <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>{s.name}</span>
                              </div>
                              <span className={`text-lg font-bold text-slate-700 pl-4 ${textTitle}`}>{s.value}%</span>
                           </div>
                        ))}
                     </div>
                     <div className="flex-1 h-[260px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                           <RePieChart>
                              <Pie data={MOCK_MATERIAL_COMPOSITION} cx="50%" cy="50%" innerRadius={0} outerRadius={125} paddingAngle={0} dataKey="value" stroke="none">
                                 {MOCK_MATERIAL_COMPOSITION.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                           </RePieChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </Card>

               <Card className="flex flex-col">
                  <SectionHeader title="Agent vs Hub Dropoff (kg)" />
                  <div className="h-[320px] w-full pt-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_AGENT_VS_HUB} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                           <Tooltip content={<CustomTooltip />} />
                           <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />
                           <Line type="monotone" dataKey="Agent" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                           <Line type="monotone" dataKey="Hub" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
               
            </div>
            

            {/* ROW 5: (3 cards) - Collection Over Time, Pickup Status, Intake Volume */}
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-1 !mt-1">
                <Card className="flex flex-col">
                  <SectionHeader title="Collection Over Time (kg)" action="Daily" />
                  <div className="h-[320px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MOCK_COLLECTION_TIME} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                           <defs>
                              <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                           <YAxis axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}K`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                           <Tooltip content={<CustomTooltip />} />
                           <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorColl)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
               <Card className="flex flex-col relative h-full">
                  <SectionHeader title="Pickup Status" />
                  <div className="flex-1 flex flex-row items-center w-full relative">
                     <div className="flex-1 h-[260px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                           <RePieChart>
                              <Pie data={MOCK_PICKUP_STATUS} cx="50%" cy="50%" innerRadius={50} outerRadius={115} paddingAngle={1} dataKey="value" stroke="none">
                                 {MOCK_PICKUP_STATUS.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                           </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                           <span className={`text-xl font-bold ${textTitle}`}>376</span>
                           <span className={`text-xs font-bold uppercase tracking-widest ${textSub}`}>Total</span>
                        </div>
                     </div>
                     <div className="w-[140px] flex flex-col justify-center gap-4 pl-4 border-l border-[#e0e3eb] dark:border-slate-700/50">
                        {MOCK_PICKUP_STATUS.map(s => (
                           <div key={s.name} className="flex flex-col">
                              <div className="flex items-center gap-2 mb-1">
                                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                                 <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>{s.name}</span>
                              </div>
                              <span className={`text-lg font-bold pl-4 ${textTitle}`}>{s.pct}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </Card>

               <Card className="flex flex-col">
                  <SectionHeader title="Collection by Location (kg)" action="This Week" />
                  <div className="h-[320px] overflow-y-auto space-y-6 pr-2 pt-2 scrollbar-hide">
                     {MOCK_LOCATION_COLLECTION.map((loc, i) => (
                        <div key={i} className="w-full relative">
                           <div className="flex justify-between items-end mb-1  relative z-10">
                              <span className={`text-[12px] font-bold ${textSub}`}>{loc.name}</span>
                              <span className={`text-[12px] font-bold ${textTitle}`}>{loc.value.toLocaleString()} kg</span>
                           </div>
                           <div className={`w-full h-5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(loc.value / loc.max) * 100}%` }}></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>

         </div>

         {/* ── RIGHT SIDEBAR (ACTIVITY FEED) ── */}
         <div className={`fixed right-0 top-0 bottom-0 w-80 z-[60] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} ${isDarkMode ? 'bg-slate-900 border-slate-800 border-l' : 'bg-slate-50 border-slate-200 border-l'}`}>
            {/* Toggle Close Button placed inside the sidebar at top left, but visually overlapping outside */}
            <button 
               onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
               className={`absolute top-20 -left-10 w-10 h-10 flex items-center justify-center rounded-l-lg border border-r-0 shadow-lg cursor-pointer pointer-events-auto transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-emerald-600'}`}
            >
               {isRightSidebarOpen ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
            </button>
            <div className="p-4 border-b border-inherit">
               <h3 className="font-bold text-sm text-[#131722] dark:text-white">Hub Activity Feed</h3>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Real-time operations</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {[
                  { title: 'New pickup completed by GreenCycle Youth', time: '2 min ago', icon: CheckCircle2, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
                  { title: '1,250 kg of PET received from Westlands Raiders', time: '15 min ago', icon: Truck, bg: 'bg-blue-500/10', color: 'text-blue-500' },
                  { title: 'Payout of KES 45,000 initiated to EcoCollect Ltd', time: '1 hr ago', icon: Wallet, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
                  { title: 'Dispute raised for pickup #PKP-1287', time: '2 hrs ago', icon: AlertCircle, bg: 'bg-rose-500/10', color: 'text-rose-500' },
                  { title: 'New agent KleanStream onboarded', time: '3 hrs ago', icon: Users, bg: 'bg-purple-500/10', color: 'text-purple-500' },
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
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">AI Insights</h4>
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-500/20">
                     <p className="text-xs font-medium text-[#131722] dark:text-slate-300 mb-2">High collection volume expected today.</p>
                     <p className="text-[10px] text-slate-500">Based on historical data, Fridays typically see a 24% increase in drop-offs. Ensure sufficient processing capacity.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
