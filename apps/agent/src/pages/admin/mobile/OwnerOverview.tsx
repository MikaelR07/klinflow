import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import { 
  PackageCheck, Scale, DollarSign, Clock, Users, 
  AlertTriangle, ShieldAlert, BarChart3, Receipt, ArrowRight, TrendingUp, MessageSquare
} from 'lucide-react';
import { CartesianGrid, BarChart,Cell, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { MaterialsPieChart } from './MaterialsPieChart';


export default function OwnerOverview() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const fleetDrivers = useAgentStore(s => s.fleetDrivers);
  const fetchFleetDrivers = useAgentStore(s => s.fetchFleetDrivers);
  const fetchActiveFulfillments = useFulfillmentStore(s => s.fetchActiveFulfillments);
  const activeFulfillments = useFulfillmentStore(s => s.activeFulfillments);

  useEffect(() => {
    fetchFleetDrivers();
    fetchActiveFulfillments();
  }, [fetchFleetDrivers, fetchActiveFulfillments]);

  const onlineDrivers = fleetDrivers.filter(d => d.is_online);
  const totalCollections = fleetDrivers.reduce((sum, d) => sum + Number(d.collected_kg || 0), 0);
  const totalCompletedJobs = fleetDrivers.reduce((sum, d) => sum + Number(d.completed_jobs || 0), 0);
  const collectionValue = totalCollections * 40; // rough mock value

  // 1. KPI Cards data
  const kpis = [
    { label: 'Completed Pickups', value: totalCompletedJobs.toString(), subtext: '98% success rate', icon: PackageCheck, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-[#F8F8FF] dark:bg-slate-800', border: 'border-slate-100 dark:border-slate-800' },
    { label: 'Collection Value', value: `KES ${collectionValue.toLocaleString()}`, subtext: '+5% vs last week', icon: DollarSign, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-[#F8F8FF] dark:bg-slate-800', border: 'border-slate-100 dark:border-slate-800' },
    { label: 'Collection Today', value: `${totalCollections.toLocaleString()} kg`, subtext: '+12% vs yesterday', icon: Scale, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-[#F8F8FF] dark:bg-slate-800', border: 'border-slate-100 dark:border-slate-800' },
    { label: 'Active Dispatches', value: activeFulfillments.length.toString(), subtext: 'On time delivery', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-[#F8F8FF] dark:bg-slate-800', border: 'border-slate-100 dark:border-slate-800' },
    { label: 'Active Agents', value: onlineDrivers.length.toString(), subtext: '1 offline', icon: Users, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-[#F8F8FF] dark:bg-slate-800', border: 'border-slate-100 dark:border-slate-800' },
    { label: 'Pending Issues', value: '3', subtext: 'Needs attention', icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-[#F8F8FF] dark:bg-slate-800', border: 'border-slate-100 dark:border-slate-800', isDanger: true },
  ];

  // Group into rows of 3 for the scrollable container
  const row1 = kpis.slice(0, 3);
  const row2 = kpis.slice(3, 6);


  const scrollableQuickActions = [
    { title: 'Deposit Requests', icon: Receipt, path: '/finance', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { title: 'Broadcast Message', icon: MessageSquare, path: '/broadcast', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { title: 'View Disputes', icon: ShieldAlert, path: '/disputes', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    { title: 'Critical Alerts', icon: AlertTriangle, path: '/alerts', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { title: 'Price Override', icon: DollarSign, path: '/approvals', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
  ];

  // 2. Module Quick Links data
  const quickLinks = [
    { title: 'Disputes', desc: 'Resolve issues', icon: ShieldAlert, path: '/disputes', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    { title: 'Finance', desc: 'View wallets', icon: Receipt, path: '/finance', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-4 pb-2 animate-in fade-in duration-300">
      
      {/* ── HERO CARD ── */}
      <div className="">
        <div className="relative bg-gradient-to-br from-blue-900 to-blue-600 rounded-xl p-5 shadow-md">
          <div className="flex items-start justify-between gap-3">
            
            {/* LEFT: Weight Collected */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-blue-100/80 mb-1 tracking-widest uppercase">
                Weight Collected
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <h2 className="text-3xl font-black text-white truncate">
                  {totalCollections.toLocaleString()}
                </h2>
                <span className="text-sm font-bold text-blue-300 shrink-0">
                  kg
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-300" />
                <span className="text-[10px] font-bold text-emerald-300">+12% vs last week</span>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="w-px self-stretch bg-blue-500/50" />

            {/* RIGHT: Wallet Balance */}
            <div className="flex-1 min-w-0 flex flex-col items-end text-right">
              <p className="text-[10px] font-black text-blue-100/80 mb-1 tracking-widest uppercase">
                Wallet Balance
              </p>
              <div className="flex items-baseline justify-end gap-1 mb-4 w-full">
                <span className="text-sm font-bold text-blue-300 shrink-0">
                  KSh
                </span>
                <h2 className="text-2xl font-black text-white truncate">
                  {(profile?.walletBalance || 0).toLocaleString()}
                </h2>
              </div>
              <button
                onClick={() => navigate('/finance')}
                className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-2 rounded-xl font-black text-[10px] tracking-widest flex items-center justify-center active:scale-95 transition-all whitespace-nowrap shadow-sm uppercase w-full"
              >
                Deposit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS SCROLLABLE ── */}
      <div className="space-y-2">
        <h2 className="text-[11px] font-black text-slate-400 capitalize tracking-widest px-2">Quick Actions</h2>
        <div className="overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-1 px-2 -mx-2">
          <div className="flex gap-1 w-max px-2">
          {scrollableQuickActions.map((action, i) => (
            <button key={i} onClick={() => navigate(action.path)} className="snap-start shrink-0 flex items-center gap-2 bg-[#F8F8FF] dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl p-2 pr-3 shadow-sm active:scale-95 transition-all w-[120px]">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.bg} ${action.color}`}>
                <action.icon className="w-5 h-5 " />
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-200 whitespace-normal leading-tight">{action.title}</span>
            </button>
          ))}
        </div>
      </div>
      </div>

      {/* ── HERO KPI  SECTION ── */}
      <div className="space-y-2">
        <h2 className="text-[11px] font-black text-slate-400 capitalize tracking-widest px-2">Today's Analytics</h2>
        
        <div className="flex flex-col gap-2 px-1">
          {/* Row 1: All 3 cards visible */}
          <div className="flex gap-1.5">
            {row1.map((kpi, i) => (
              <div key={i} className={`relative flex-1 min-w-0 ${kpi.bg} border ${kpi.border} rounded-xl p-2.5 shadow-sm flex flex-col justify-between h-[100px] overflow-hidden`}>
                <div className="relative z-10 flex flex-col gap-0.5 pr-6">
                  <span className={`text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 leading-tight`}>{kpi.label}</span>
                  <p className={`text-base font-semibold tracking-tight ${kpi.isDanger ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                    {kpi.value}
                  </p>
                </div>
                <div className="relative z-10 mt-auto">
                  <span className={`text-[9px] font-bold ${kpi.color} leading-tight`}>{kpi.subtext}</span>
                </div>
                <kpi.icon className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 ${kpi.color} opacity-30`} strokeWidth={1.5} />
              </div>
            ))}
          </div>
          
          {/* Row 2: All 3 cards visible */}
          <div className="flex gap-1.5">
            {row2.map((kpi, i) => (
              <div key={i} className={`relative flex-1 min-w-0 ${kpi.bg} border ${kpi.border} rounded-xl p-2.5 shadow-sm flex flex-col justify-between h-[100px] overflow-hidden`}>
                <div className="relative z-10 flex flex-col gap-0.5 pr-6">
                  <span className={`text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 leading-tight`}>{kpi.label}</span>
                  <p className={`text-base font-semibold tracking-tight ${kpi.isDanger ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                    {kpi.value}
                  </p>
                </div>
                <div className="relative z-10 mt-auto">
                  <span className={`text-[9px] font-bold ${kpi.color} leading-tight`}>{kpi.subtext}</span>
                </div>
                <kpi.icon className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 ${kpi.color} opacity-30`} strokeWidth={1.5} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── QUICK LINKS SECTION ── */}
      <div className="space-y-3 !mt-2">
        <h2 className="text-[11px] font-black text-slate-500 capitalize tracking-widest px-2">Management Modules</h2>
        <div className="grid grid-cols-2 gap-3 px-1.5">
          {quickLinks.map((link, i) => {
            const isDisputes = link.title === 'Disputes';
            const cardBg = isDisputes ? 'bg-amber-500 dark:bg-amber-600' : 'bg-blue-600 dark:bg-slate-800';
            return (
            <button 
              key={i}
              onClick={() => navigate(link.path)}
              className={`${cardBg} border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col items-start gap-3 active:scale-[0.98] transition-all group`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/15`}>
                  <link.icon className="w-4.5 h-4.5 text-white" />
                </div>
                {link.title === 'Finance' && (
                  <svg className="w-10 h-5 text-emerald-300 opacity-70" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 2 15 9 10 4 2 12"></polyline>
                  </svg>
                )}
                {isDisputes && (
                  <span className="text-[9px] font-black text-white/80 bg-white/15 px-2 py-0.5 rounded-full">3 Open</span>
                )}
              </div>
              <div className="text-left w-full">
                <h3 className="text-[13px] font-bold text-white">{link.title}</h3>
                <p className="text-[10px] font-medium text-white/70 mt-0.5">{link.desc}</p>
              </div>
            </button>
          )})}
        </div>
      </div>
      
      {/* Market Intelligence Full Width */}
      <div className="px-1.5 !mt-2">
        <button 
          onClick={() => navigate('/market-prices')}
          className="w-full bg-gradient-to-r from-primary to-emerald-600 text-white border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-200 dark:text-white">Market Intelligence</h3>
              <p className="text-[10px] font-medium text-slate-200 mt-0.5">Live material prices and trends</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full  flex items-center justify-center text-slate-400  transition-colors">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </button>
      </div>
      <MaterialsPieChart  /> 
    </div>
  );
}
