import React, { useState, useEffect } from 'react';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { 
   TrendingUp, Scale, Truck, Wallet, Leaf, Activity, ArrowRight, MoreHorizontal,
   Warehouse, ShoppingCart, MapPin, AlertCircle, Globe, Sprout, ChevronRight,
   ChevronLeft, BarChart3, CheckCircle2, Users, Factory, FileText, Zap, ShieldCheck, PieChart, LineChart as LineChartIcon, LayoutDashboard, ChevronDown, Wrench, Clock, Navigation
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import {
   LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart as RePieChart, Pie, Cell,
   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// ─── DUMMY DATA ─────────────────────────────────────────────────────────────

const MOCK_AGENT_STATUS = [
   { name: 'Active', value: 65, color: '#10b981' },
   { name: 'Idle', value: 20, color: '#f59e0b' },
   { name: 'Offline', value: 10, color: '#64748b' },
   { name: 'Maintenance', value: 5, color: '#ef4444' },
];

const MOCK_WEIGHT_COLLECTION = [
   { name: 'Week 1', weight: 4500 },
   { name: 'Week 2', weight: 5200 },
   { name: 'Week 3', weight: 4800 },
   { name: 'Week 4', weight: 6100 },
   { name: 'Week 5', weight: 5900 },
   { name: 'Week 6', weight: 7200 },
];

const MOCK_ACCEPTED_PICKUPS = [
   { name: 'Mon', pickups: 42 },
   { name: 'Tue', pickups: 58 },
   { name: 'Wed', pickups: 45 },
   { name: 'Thu', pickups: 62 },
   { name: 'Fri', pickups: 70 },
   { name: 'Sat', pickups: 35 },
   { name: 'Sun', pickups: 15 },
];

const MOCK_AGENT_COMPLAINTS = [
   { name: 'Vehicle Breakdown', value: 12, fill: '#ef4444' },
   { name: 'App Issues', value: 8, fill: '#f59e0b' },
   { name: 'Salary', value: 5, fill: '#3b82f6' },
   { name: 'Route', value: 3, fill: '#8b5cf6' },
];

const MOCK_DELIVERY_VS_PICKUPS = [
   { name: 'Mon', pickups: 42, deliveries: 12 },
   { name: 'Tue', pickups: 58, deliveries: 15 },
   { name: 'Wed', pickups: 45, deliveries: 18 },
   { name: 'Thu', pickups: 62, deliveries: 20 },
   { name: 'Fri', pickups: 70, deliveries: 25 },
   { name: 'Sat', pickups: 35, deliveries: 10 },
   { name: 'Sun', pickups: 15, deliveries: 5 },
];

const MOCK_VEHICLE_HEALTH = [
   { name: 'Good', value: 75, color: '#10b981' },
   { name: 'Fair', value: 15, color: '#f59e0b' },
   { name: 'Needs Attention', value: 10, color: '#ef4444' },
];

const MOCK_VEHICLE_TYPES = [
   { name: 'TukTuk', value: 40, color: '#3b82f6' },
   { name: 'Pick-ups', value: 35, color: '#8b5cf6' },
   { name: 'Lorries', value: 15, color: '#ec4899' },
   { name: 'Bikes', value: 10, color: '#14b8a6' },
];

const MOCK_OPERATING_COSTS = [
   { name: 'Jan', amount: 1200000 },
   { name: 'Feb', amount: 1100000 },
   { name: 'Mar', amount: 1350000 },
   { name: 'Apr', amount: 1250000 },
   { name: 'May', amount: 1400000 },
];

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

export default function FleetDashboard() {
   const { isDarkMode } = useThemeStore();
   const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
   const currentCompanyId = useAuthStore(s => (s as any).currentCompanyId);
   const profile = useAuthStore(s => (s as any).profile);
   const currentCompanyName = useAuthStore(s => (s as any).currentCompanyName);
   const [kpis, setKpis] = useState<any>(null);

   useEffect(() => {
      if (!currentCompanyId) return;
      const fetchKpis = async () => {
         const { data } = await supabase.rpc('rpc_get_fleet_kpis', { p_company_id: currentCompanyId });
         if (data) setKpis(data);
      };
      fetchKpis();
   }, [currentCompanyId]);

   const Card = ({ children, className = '', flexCol = false, style }: any) => (
      <div className={`bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 shadow-none ${flexCol ? 'flex flex-col' : ''} ${className}`} style={style}>
         {children}
      </div>
   );

   const SectionHeader = ({ icon: Icon, title, action, actionLabel = 'View all', titleClass, actionClass }: any) => (
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
            {Icon && <Icon className={`font-medium w-4 h-4 ${titleClass ? 'text-white/80' : 'text-slate-500'}`} />}
            <h3 className={`text-xs font-bold ${titleClass || 'text-[#131722] dark:text-white'}`}>{title}</h3>
         </div>
         {action && (
            <button className={`font-medium text-[10px] capitalize tracking-widest hover:underline flex items-center gap-1 ${actionClass || 'text-primary'}`}>
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
         {/* ── MAIN SCROLLABLE DASHBOARD ── */}
         <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fade-in pb-20 space-y-6 pt-16 md:pt-20">
            
            {/* Header */}
            <div className="flex flex-col mb-6">
               <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {(profile?.name || 'Fleet Manager').split(' ')[0]} 👋</h2>
            </div>

            {/* ROW 1: KPI Cards (6 cards) */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
               {[
                  { label: 'Total Agents', val: '65', unit: '', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', cardBg: '!bg-emerald-50/30 dark:!bg-emerald-500/5', trend: '↑ 5%', trendUp: true },
                  { label: 'Total Vehicles', val: '124', unit: '', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', cardBg: '!bg-blue-50/30 dark:!bg-blue-500/5', trend: '↑ 12%', trendUp: true },
                  { label: 'Completed Pickups', val: '450', unit: '', icon: Factory, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', cardBg: '!bg-fuchsia-50/30 dark:!bg-fuchsia-500/5', trend: '↑ 24', trendUp: true },
                  { label: 'Weight Collected', val: '12.4K', unit: 'kg', icon: Scale, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10', cardBg: '!bg-violet-50/30 dark:!bg-violet-500/5', trend: '↑ 15%', trendUp: true },
                  { label: 'Agent Complaints', val: '3', unit: '', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', cardBg: '!bg-rose-50/30 dark:!bg-rose-500/5', trend: '↓ 4', trendUp: true },
                  { label: 'Suspended Agents', val: '5', unit: '', icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', cardBg: '!bg-amber-50/30 dark:!bg-amber-500/5', trend: '↑ 2', trendUp: false },
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

           
            {/* ROW 2: Utilization (2 cards) */}
          
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
               {/* Agents Weight Collection (Line) */}
               <Card className="flex flex-col" style={{ background: 'linear-gradient(135deg, rgba(8, 102, 145, 0.9) 0%, rgba(2, 132, 199, 0.9) 100%)' }}>
                  <SectionHeader title="Agents Weight Collection (kg)" action="Weekly Trend" titleClass="text-white" actionClass="text-white hover:text-white/80" />
                  <div className="h-[320px] w-full mt-2">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_WEIGHT_COLLECTION} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff33" vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff' }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff' }} />
                           <Tooltip content={<CustomTooltip />} />
                           <Line type="monotone" dataKey="weight" stroke="#ffffff" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#0284c7', fill: '#ffffff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </Card>

               {/* Agents Accepted Pickups (Bar) */}
               <Card className="flex flex-col" style={{ background: 'linear-gradient(135deg, rgba(200, 77, 10, 0.9) 0%, rgba(194, 65, 12, 0.9) 100%)' }}>
                  <SectionHeader title="Agents Accepted Pickups" action="This Week" titleClass="text-white" actionClass="text-white hover:text-white/80" />
                  <div className="h-[320px] w-full mt-2">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_ACCEPTED_PICKUPS} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff33" vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff' }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff' }} />
                           <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} content={<CustomTooltip />} />
                           <Bar dataKey="pickups" name="Accepted Pickups" fill="#ffffff" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
            </div>

            {/* ROW 3: Agent Status & Performance (3 cards) */}
           
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 !mt-2">
               {/* Agent Status Distribution */}
               <Card className="flex flex-col relative h-full">
                  <div className="w-full mb-4">
                     <SectionHeader title="Agent Status Distribution" />
                  </div>
                  <div className="flex-1 flex flex-row items-center w-full">
                     <div className="w-[50%] h-[240px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                           <RePieChart>
                              <Pie data={MOCK_AGENT_STATUS} cx="50%" cy="50%" innerRadius={40} outerRadius={95} paddingAngle={1} dataKey="value" stroke="none">
                                 {MOCK_AGENT_STATUS.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                           </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                           <span className={`text-xl font-bold ${textTitle}`}>100</span>
                           <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>Total</span>
                        </div>
                     </div>
                     <div className="w-[50%] flex flex-col gap-5 pl-6 border-l border-[#e0e3eb] dark:border-slate-700/50 justify-center">
                        {MOCK_AGENT_STATUS.map((s: any) => (
                           <div key={s.name} className="flex flex-col">
                              <div className="flex items-center gap-2 mb-1">
                                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                                 <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>{s.name}</span>
                              </div>
                              <span className={`text-xl font-bold ${textTitle} pl-4`}>{s.value}%</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </Card>

               {/* Agent Complaints By Type (Horizontal Bar) */}
               <Card className="flex flex-col relative h-full">
                  <div className="mb-4">
                     <SectionHeader title="Agent Complaints by Type" action="Monthly" />
                  </div>
                  <div className="flex-1 w-full flex flex-col justify-center gap-6 mt-2 pb-4">
                     {MOCK_AGENT_COMPLAINTS.map((item, index) => {
                        const maxValue = Math.max(...MOCK_AGENT_COMPLAINTS.map(d => d.value));
                        const percentage = (item.value / maxValue) * 100;
                        return (
                           <div key={index} className="w-full">
                              <div className="flex justify-between items-center mb-2">
                                 <span className={`text-xs font-bold ${textTitle}`}>{item.name}</span>
                                 <span className={`text-[11px] font-bold ${textSub}`}>{item.value} Tickets</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-2.5">
                                 <div 
                                    className="h-5 rounded-full transition-all duration-500 ease-out" 
                                    style={{ width: `${percentage}%`, backgroundColor: item.fill }}
                                 />
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </Card>

               {/* Agents Delivery vs Pickups (Multi-line) */}
               <Card className="flex flex-col">
                  <SectionHeader title="Agents Delivery vs Pickups" action="Daily Trend" />
                  <div className="h-[320px] w-full mt-2">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_DELIVERY_VS_PICKUPS} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                           <Tooltip content={<CustomTooltip />} />
                           <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                           <Line type="monotone" dataKey="pickups" name="Pickups" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                           <Line type="monotone" dataKey="deliveries" name="Deliveries" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                     </ResponsiveContainer>
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
               <h3 className="font-bold text-sm text-[#131722] dark:text-white">Fleet Activity Feed</h3>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Live dispatches & alerts</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {[
                  { title: 'Vehicle KCB 456T flagged for immediate tire replacement.', time: '5 min ago', icon: AlertCircle, bg: 'bg-rose-500/10', color: 'text-rose-500' },
                  { title: 'TukTuk KCA 123G returned to base. Driver: M. Kamau', time: '20 min ago', icon: Truck, bg: 'bg-indigo-500/10', color: 'text-indigo-500' },
                  { title: 'Route C optimized: saving estimated 4L diesel.', time: '1 hr ago', icon: Activity, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
                  { title: 'Routine maintenance completed for 3 Lorries.', time: '3 hrs ago', icon: Wrench, bg: 'bg-blue-500/10', color: 'text-blue-500' },
                  { title: 'Fuel top-up registered: 45L at Industrial Area station.', time: '4 hrs ago', icon: Zap, bg: 'bg-amber-500/10', color: 'text-amber-500' },
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
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">System Notification</h4>
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 border border-amber-100 dark:border-amber-500/20">
                     <p className="text-xs font-medium text-[#131722] dark:text-slate-300 mb-2">Weather Alert</p>
                     <p className="text-[10px] text-slate-500">Heavy rain expected in Kasarani and Westlands. Inform drivers to expect delays up to 20 minutes.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}