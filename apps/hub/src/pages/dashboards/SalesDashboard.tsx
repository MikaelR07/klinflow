import React, { useState, useEffect } from 'react';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import {
   TrendingUp, Scale, Truck, Wallet, Activity, ArrowRight,
   ShoppingCart, AlertCircle, ChevronRight,
   ChevronLeft, CheckCircle2, Users, Factory, FileText, Zap,
   ChevronDown, Target, Building2, DollarSign, Gavel, Package, BarChart3
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import {
   LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const MOCK_RFQ_DAILY = [
   { name: 'Mon', sent: 18, accepted: 6 },
   { name: 'Tue', sent: 24, accepted: 10 },
   { name: 'Wed', sent: 15, accepted: 8 },
   { name: 'Thu', sent: 32, accepted: 14 },
   { name: 'Fri', sent: 28, accepted: 12 },
   { name: 'Sat', sent: 12, accepted: 5 },
   { name: 'Sun', sent: 8, accepted: 3 },
];

const MOCK_RFQ_WEEKLY = [
   { name: 'Week 1', sent: 45, accepted: 12 },
   { name: 'Week 2', sent: 52, accepted: 18 },
   { name: 'Week 3', sent: 38, accepted: 15 },
   { name: 'Week 4', sent: 65, accepted: 22 },
];

const MOCK_MATERIALS_BOUGHT = [
   { name: 'Jan', PET: 12000, HDPE: 8500, Metal: 4200, Cardboard: 6800, Glass: 2100 },
   { name: 'Feb', PET: 14500, HDPE: 9200, Metal: 5100, Cardboard: 7200, Glass: 2400 },
   { name: 'Mar', PET: 11800, HDPE: 10500, Metal: 4800, Cardboard: 6500, Glass: 2800 },
   { name: 'Apr', PET: 16200, HDPE: 11000, Metal: 5500, Cardboard: 7800, Glass: 3200 },
   { name: 'May', PET: 18500, HDPE: 12200, Metal: 6200, Cardboard: 8100, Glass: 3500 },
   { name: 'Jun', PET: 21000, HDPE: 13500, Metal: 7000, Cardboard: 9200, Glass: 3800 },
];

const MOCK_MATERIALS_PIE = [
   { name: 'PET Plastics', value: 38, color: '#3b82f6' },
   { name: 'HDPE', value: 22, color: '#10b981' },
   { name: 'Metals', value: 12, color: '#f59e0b' },
   { name: 'Cardboard', value: 18, color: '#8b5cf6' },
   { name: 'Glass', value: 10, color: '#06b6d4' },
];

const MOCK_SALES_ORDERS_BY_TYPE = [
   { name: 'Spot Purchase', value: 145, max: 200, color: '#3b82f6' },
   { name: 'Contract Order', value: 98, max: 200, color: '#10b981' },
   { name: 'RFQ Response', value: 82, max: 200, color: '#f59e0b' },
   { name: 'Auction Win', value: 64, max: 200, color: '#8b5cf6' },
   { name: 'Bulk Drive', value: 42, max: 200, color: '#ef4444' },
   { name: 'Direct Deal', value: 35, max: 200, color: '#06b6d4' },
];

const MOCK_SALES_PIPELINE = [
   { stage: 'Lead', count: 240, value: 48, color: '#94a3b8', pct: 100 },
   { stage: 'Contacted', count: 180, value: 36, color: '#60a5fa', pct: 75 },
   { stage: 'Negotiating', count: 120, value: 28, color: '#a78bfa', pct: 50 },
   { stage: 'Quote Sent', count: 85, value: 22, color: '#f59e0b', pct: 35 },
   { stage: 'Contract', count: 52, value: 15, color: '#f97316', pct: 22 },
   { stage: 'Won', count: 38, value: 12, color: '#10b981', pct: 16 },
   { stage: 'Lost', count: 14, value: 3, color: '#ef4444', pct: 6 },
];


// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function SalesDashboard() {
   const { isDarkMode } = useThemeStore();
   const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
   const currentCompanyId = useAuthStore(s => (s as any).currentCompanyId);
   const profile = useAuthStore(s => (s as any).profile);
   const currentCompanyName = useAuthStore(s => (s as any).currentCompanyName);
   const [kpis, setKpis] = useState<any>(null);
   const [rfqTimeframe, setRfqTimeframe] = useState<'daily' | 'weekly'>('daily');

   useEffect(() => {
      if (!currentCompanyId) return;
      const fetchKpis = async () => {
         const { data } = await supabase.rpc('rpc_get_sales_kpis', { p_company_id: currentCompanyId });
         if (data) setKpis(data);
      };
      fetchKpis();
   }, [currentCompanyId]);

   const Card = ({ children, className = '', style }: any) => (
      <div className={`bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 shadow-none ${className}`} style={style}>
         {children}
      </div>
   );

   const SectionHeader = ({ title, action, rightContent }: any) => (
      <div className="flex items-center justify-between mb-4">
         <h3 className="text-xs font-bold text-[#131722] dark:text-white">{title}</h3>
         {action && (
            <button className="font-medium text-[10px] text-primary capitalize tracking-widest hover:underline flex items-center gap-1">
               {action} <ChevronDown className="w-3 h-3" />
            </button>
         )}
         {rightContent}
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
                     <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload?.fill || '#10b981' }} />
                     <span className="capitalize">{entry.name}:</span>
                     <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
                  </div>
               ))}
            </div>
         );
      }
      return null;
   };

   const rfqData = rfqTimeframe === 'daily' ? MOCK_RFQ_DAILY : MOCK_RFQ_WEEKLY;

   return (
      <div className="flex h-full w-full relative bg-transparent overflow-hidden">
         {/* ── MAIN SCROLLABLE DASHBOARD ── */}
         <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fade-in pb-20 space-y-6 pt-16 md:pt-20">
            
            {/* Header */}
            <div className="flex flex-col mb-6">
               <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {(profile?.name || 'Sales Manager').split(' ')[0]} 👋</h2>
            </div>

            {/* ════════════════ ROW 1: 6 KPI Cards ════════════════ */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
               {[
                  { label: 'Materials Bought', val: 'KSh 8.4', unit: 'M', icon: ShoppingCart, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', cardBg: '!bg-emerald-50/30 dark:!bg-emerald-500/5', trend: '↑ 18.2%', trendUp: true },
                  { label: 'Total Weight Bought', val: '124.5', unit: 'Tons', icon: Scale, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', cardBg: '!bg-blue-50/30 dark:!bg-blue-500/5', trend: '↑ 12.4%', trendUp: true },
                  { label: 'Total Sales Orders', val: '466', unit: '', icon: FileText, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', cardBg: '!bg-fuchsia-50/30 dark:!bg-fuchsia-500/5', trend: '↑ 8.5%', trendUp: true },
                  { label: 'Total Contracts', val: '28', unit: '', icon: CheckCircle2, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10', cardBg: '!bg-violet-50/30 dark:!bg-violet-500/5', trend: '↑ 4', trendUp: true },
                  { label: 'Total Auctions', val: '52', unit: '', icon: Gavel, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', cardBg: '!bg-amber-50/30 dark:!bg-amber-500/5', trend: '↑ 15%', trendUp: true },
                  { label: 'Auctions Volume', val: '38.2', unit: 'Tons', icon: Package, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', cardBg: '!bg-teal-50/30 dark:!bg-teal-500/5', trend: '↑ 22%', trendUp: true },
               ].map((kpi, i) => (
                  <Card key={i} className={`!p-4 ${kpi.cardBg}`}>
                     <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                           <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="font-bold text-[9px] xl:text-[10px] text-slate-500 uppercase tracking-widest truncate">{kpi.label}</p>
                           <h2 className={`text-base xl:text-lg font-bold tracking-tighter truncate ${textTitle}`}>
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

            {/* ════════════════ ROW 2: 6 KPI Cards ════════════════ */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 !mt-1">
               {[
                  { label: 'Total RFQs Sent', val: '342', unit: '', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', trend: '↑ 18%', trendUp: true },
                  { label: 'Contracts Value', val: '24.5', unit: 'M', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', trend: '↑ 22%', trendUp: true },
                  { label: 'RFQs Accepted', val: '67', unit: '', icon: CheckCircle2, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', trend: '↑ 12%', trendUp: true },
                  { label: 'Total Buyers', val: '120', unit: '', icon: Users, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/10', trend: '↑ 12', trendUp: true },
                  { label: 'Total Suppliers', val: '850', unit: '', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', trend: '↑ 45', trendUp: true },
                  { label: 'Total Sales', val: 'KSh 4.2', unit: 'M', icon: Wallet, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', trend: '↓ 5%', trendUp: false },
               ].map((kpi, i) => (
                  <Card key={i} className="!p-4">
                     <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                           <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="font-bold text-[9px] xl:text-[10px] text-slate-500 uppercase tracking-widest truncate">{kpi.label}</p>
                           <h2 className={`text-base xl:text-lg font-bold tracking-tighter truncate ${textTitle}`}>
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

            {/* ════════════════ ROW 3: 2 Visualization Cards ════════════════ */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
               {/* RFQs Sent vs Accepted — Bar Graph with Daily/Weekly toggle */}
               <Card className="flex flex-col h-full !p-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(37,99,235,1) 100%)' }}>
                  <div className="p-4 pb-0">
                     <SectionHeader
                        title="RFQs Sent vs Accepted"
                        rightContent={
                           <div className="flex items-center gap-1 bg-white/15 rounded-lg p-0.5">
                              {(['daily', 'weekly'] as const).map(t => (
                                 <button
                                    key={t}
                                    onClick={() => setRfqTimeframe(t)}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
                                       rfqTimeframe === t
                                          ? 'bg-white text-blue-700 shadow-sm'
                                          : 'text-white/70 hover:text-white'
                                    }`}
                                 >
                                    {t}
                                 </button>
                              ))}
                           </div>
                        }
                     />
                     {/* Legend */}
                     <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-1.5">
                           <span className="w-2.5 h-2.5 rounded-sm bg-white/90" />
                           <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Sent</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <span className="w-2.5 h-2.5 rounded-sm bg-[#fbbf24]" />
                           <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Accepted</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 w-full px-2 pb-4" style={{ minHeight: 300 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rfqData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffffcc' }} dy={5} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffffcc' }} />
                           <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                           <Bar dataKey="sent" name="Sent" fill="#ffffffee" radius={[3, 3, 0, 0]} barSize={rfqTimeframe === 'daily' ? 18 : 28} />
                           <Bar dataKey="accepted" name="Accepted" fill="#fbbf24" radius={[3, 3, 0, 0]} barSize={rfqTimeframe === 'daily' ? 18 : 28} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>

               {/* Materials Bought from Market — Multi-line graph */}
               <Card className="flex flex-col h-full !p-0 overflow-hidden" style={{ background:'linear-gradient(135deg, rgba(16,185,129,1) 0%, rgba(5,150,105,1) 100%)' }}>
                  <div className="p-4 pb-0">
                     <SectionHeader title="Materials Bought (KG)" action="Monthly" />
                     {/* Legend */}
                     <div className="flex items-center gap-3 flex-wrap mb-2">
                        {[
                           { name: 'PET', color: '#ffffff' },
                           { name: 'HDPE', color: '#fbbf24' },
                           { name: 'Metal', color: '#f87171' },
                           { name: 'Cardboard', color: '#a78bfa' },
                           { name: 'Glass', color: '#38bdf8' },
                        ].map(m => (
                           <div key={m.name} className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                              <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{m.name}</span>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="flex-1 w-full px-2 pb-4" style={{ minHeight: 300 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_MATERIALS_BOUGHT} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffffcc' }} dy={5} />
                           <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#ffffffcc' }} />
                           <Tooltip content={<CustomTooltip />} />
                           <Line type="monotone" dataKey="PET" stroke="#ffffff" strokeWidth={2.5} dot={{ r: 3, fill: '#ffffff' }} />
                           <Line type="monotone" dataKey="HDPE" stroke="#fbbf24" strokeWidth={2} dot={{ r: 2.5, fill: '#fbbf24' }} />
                           <Line type="monotone" dataKey="Metal" stroke="#f87171" strokeWidth={2} dot={{ r: 2.5, fill: '#f87171' }} />
                           <Line type="monotone" dataKey="Cardboard" stroke="#a78bfa" strokeWidth={2} dot={{ r: 2.5, fill: '#a78bfa' }} />
                           <Line type="monotone" dataKey="Glass" stroke="#38bdf8" strokeWidth={2} dot={{ r: 2.5, fill: '#38bdf8' }} />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
            </div>

            {/* ════════════════ ROW 4: 3 Cards ════════════════ */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-2">
               {/* Pie Chart: Materials Bought by Type */}
               <Card className="flex flex-col items-center justify-between relative">
                  <div className="w-full">
                     <SectionHeader title="Materials Bought by Type" />
                  </div>
                  <div className="h-[240px] w-full relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                           <Pie data={MOCK_MATERIALS_PIE} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                              {MOCK_MATERIALS_PIE.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                           </Pie>
                           <Tooltip content={<CustomTooltip />} />
                        </RePieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={`text-2xl font-bold ${textTitle}`}>100%</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>Total</span>
                     </div>
                  </div>
                  <div className="w-full flex flex-wrap items-center justify-center gap-3 mt-3 pt-3 border-t border-[#e0e3eb] dark:border-slate-700/50">
                     {MOCK_MATERIALS_PIE.map(s => (
                        <div key={s.name} className="flex items-center gap-1.5">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                           <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>{s.name}</span>
                           <span className={`text-[10px] font-bold ${textTitle}`}>{s.value}%</span>
                        </div>
                     ))}
                  </div>
               </Card>

               {/* Horizontal Bar: Sales Orders by Type */}
               <Card className="flex flex-col">
                  <SectionHeader title="Sales Orders by Type" action="This Month" />
                  <div className="flex-1 overflow-y-auto space-y-5 pr-2 pt-2 scrollbar-hide" style={{ maxHeight: 380 }}>
                     {MOCK_SALES_ORDERS_BY_TYPE.map((item, i) => (
                        <div key={i} className="w-full relative">
                           <div className="flex justify-between items-end mb-1.5 relative z-10">
                              <span className={`text-[11px] font-bold uppercase tracking-widest ${textSub}`}>{item.name}</span>
                              <span className={`text-[12px] font-bold ${textTitle}`}>{item.value} orders</span>
                           </div>
                           <div className={`w-full h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.value / item.max) * 100}%`, backgroundColor: item.color }}></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>

               {/* Sales Pipeline Funnel */}
               <Card className="flex flex-col">
                  <SectionHeader title="Sales Pipeline" action="Current" />
                  <div className="flex-1 space-y-2 pt-1" style={{ maxHeight: 380 }}>
                     {MOCK_SALES_PIPELINE.map((stage, i) => (
                        <div key={i} className="relative">
                           {/* Funnel Bar */}
                           <div 
                              className="rounded-lg px-3 py-2.5 flex items-center justify-between transition-all"
                              style={{ 
                                 width: `${Math.max(stage.pct, 20)}%`,
                                 backgroundColor: stage.color + (isDarkMode ? '30' : '18'),
                                 borderLeft: `3px solid ${stage.color}`,
                                 marginLeft: 'auto',
                                 marginRight: 'auto',
                              }}
                           >
                              <div className="flex items-center gap-2 min-w-0">
                                 <span className={`text-[10px] font-bold uppercase tracking-widest ${textTitle} truncate`}>{stage.stage}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                 <span className={`text-[10px] font-bold ${textSub}`}>{stage.count} deals</span>
                                 <span className="text-[10px] font-bold" style={{ color: stage.color }}>KSh {stage.value}M</span>
                              </div>
                           </div>
                           {/* Connector line */}
                           {i < MOCK_SALES_PIPELINE.length - 1 && (
                              <div className="flex justify-center py-0.5">
                                 <div className={`w-px h-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
                              </div>
                           )}
                        </div>
                     ))}
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
               <h3 className="font-bold text-sm text-[#131722] dark:text-white">Sales Activity Feed</h3>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Live quotes & contracts</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {[
                  { title: 'Global Plastics awarded contract for 120T PET', time: '10 min ago', icon: Target, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
                  { title: 'New RFQ received from Nairobi Mills (HDPE)', time: '35 min ago', icon: FileText, bg: 'bg-blue-500/10', color: 'text-blue-500' },
                  { title: 'Contract renewal due for EcoGlass Kenya', time: '2 hrs ago', icon: AlertCircle, bg: 'bg-amber-500/10', color: 'text-amber-500' },
                  { title: 'Price variance alert: Metal prices up 4%', time: '4 hrs ago', icon: TrendingUp, bg: 'bg-indigo-500/10', color: 'text-indigo-500' },
                  { title: 'Supplier Eco-Klect met 98% fulfillment rate', time: '6 hrs ago', icon: CheckCircle2, bg: 'bg-teal-500/10', color: 'text-teal-500' },
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
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Market Signal</h4>
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-500/20">
                     <p className="text-xs font-medium text-[#131722] dark:text-slate-300 mb-2">High Demand Alert</p>
                     <p className="text-[10px] text-slate-500">Cardboard prices are expected to rise by 8% next week. Suggest securing current RFQs.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}