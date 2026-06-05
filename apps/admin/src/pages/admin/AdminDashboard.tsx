import {
  TrendingUp, TrendingDown, Sparkles, FileText, Users, Truck,
  Leaf, Star, ShieldCheck, Gift, Recycle, Cpu, Network, Clock,
  AlertCircle, ChevronRight, Activity, Wallet, AlertTriangle, Info, Zap,
  Briefcase, BarChart3, Building2, Brain, ShoppingBag
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { useAdminStore } from '@klinflow/core/stores/adminStore';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const {
    stats, revenueTrends, materialDistribution, systemEvents, highAlerts,
    initAdminLiveFeed, openNemaModal, isLoading
  } = useAdminStore();


  const [activeHub, setActiveHub] = useState('marketplace');
  const navigate = useNavigate();

  useEffect(() => {
    initAdminLiveFeed();
  }, []);

  const hubs = [
    {
      id: 'marketplace',
      label: 'Business',
      icon: Briefcase,
      color: 'emerald',
      desc: 'Business Partners',
      mainMetric: `KSh ${(stats?.totalRevenue || 0).toLocaleString()}`
    },
    {
      id: 'logistics',
      label: 'Agent',
      icon: Truck,
      color: 'indigo',
      desc: 'Drivers & Fleet',
      mainMetric: `${(stats?.totalWeight || 0).toLocaleString()} KG`
    },
    {
      id: 'community',
      label: 'Client',
      icon: Users,
      color: 'slate',
      desc: 'Resident Members',
      mainMetric: `${(stats?.totalUsers || 0).toLocaleString()} Users`
    }
  ];

  const allKpis = [
    {
      hub: 'community',
      label: 'Free Members',
      value: stats?.freeTierMembers || 0,
      unit: '',
      icon: Leaf,
      color: 'slate'
    },
    {
      hub: 'community',
      label: 'Standard Members',
      value: stats?.standardMembers || 0,
      unit: '',
      icon: ShieldCheck,
      color: 'emerald'
    },
    {
      hub: 'community',
      label: 'Premium Members',
      value: stats?.premiumMembers || 0,
      unit: '',
      icon: Star,
      color: 'amber'
    },
    {
      hub: 'logistics',
      label: 'Active Ind. Agents',
      value: stats?.activeAgents || 0,
      unit: '',
      icon: Activity,
      color: 'emerald'
    },
    {
      hub: 'logistics',
      label: 'Total Ind. Agents',
      value: stats?.registeredAgents || 0,
      unit: '',
      icon: Truck,
      color: 'slate'
    },
    {
      hub: 'logistics',
      label: 'Total Companies',
      value: stats?.totalCompanies || 0,
      unit: '',
      icon: Building2,
      color: 'indigo'
    },
    {
      hub: 'logistics',
      label: 'Companies Online',
      value: stats?.activeCompanies || 0,
      unit: '',
      icon: Zap,
      color: 'emerald'
    },
    {
      hub: 'marketplace',
      label: 'Businesses',
      value: stats?.totalBusinesses || 0,
      unit: '',
      icon: Network,
      color: 'indigo'
    },
    {
      hub: 'marketplace',
      label: 'Total Sales',
      value: stats?.totalRevenue || 0,
      unit: 'KSh',
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      hub: 'community',
      label: 'Subscription Earnings',
      value: stats?.subscriptionRevenue || 0,
      unit: 'KSh',
      icon: Zap,
      color: 'indigo'
    },
    {
      hub: 'marketplace',
      label: 'Revenue Generated',
      value: stats?.commissionRevenue || 0,
      unit: 'KSh',
      icon: Gift,
      color: 'purple'
    },
    {
      hub: 'logistics',
      label: 'Recyclables Recovered',
      value: stats?.totalWeight || 0,
      unit: 'KG',
      icon: Recycle,
      color: 'amber'
    },
    {
      hub: 'logistics',
      label: 'Ind. Agents Weight Recovered',
      value: stats?.indAgentWeight || 0,
      unit: 'KG',
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      hub: 'logistics',
      label: 'Company Weight Recovered',
      value: stats?.companyWeight || 0,
      unit: 'KG',
      icon: Building2,
      color: 'indigo'
    },
    {
      hub: 'community',
      label: 'Total Customers',
      value: stats?.totalUsers || 0,
      unit: '',
      icon: Users,
      color: 'slate'
    },
    {
      hub: 'community',
      label: 'Registered Sellers',
      value: stats?.totalSellers || 0,
      unit: '',
      icon: ShoppingBag,
      color: 'blue'
    },
    {
      hub: 'marketplace',
      label: 'User Balances',
      value: stats?.rewardsLiabilities || 0,
      unit: 'KSh',
      icon: Wallet,
      color: 'rose'
    }
  ];

  const activeKpis = allKpis.filter(k => k.hub === activeHub);

  return (
    <div className="space-y-8 animate-slide-up pb-20">

      {/* ── COMMAND CENTER HEADER ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold dark:text-white tracking-tighter">Executive Dashboard</h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">Platform Pulse & Performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openNemaModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <Sparkles className="w-4 h-4" /> AI Compliance
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-[1rem] border border-slate-200 dark:border-white/5">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Live Sync</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>
        </div>
      </header>

      {/* ── INTERACTIVE HUB TILES ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {hubs.map(hub => (
          <button
            key={hub.id}
            onClick={() => setActiveHub(hub.id)}
            className={`relative p-4 rounded-[1rem] border transition-all text-left group overflow-hidden ${activeHub === hub.id
              ? 'bg-white dark:bg-slate-900 border-primary ring-4 ring-primary/10  scale-[1.02]'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
              }`}
          >
            {activeHub === hub.id && (
              <div className="absolute top-6 right-6 px-3 py-1 bg-primary text-white text-xs font-semibold uppercase tracking-widest rounded-full animate-fade-in  flex items-center gap-1.5 z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Selected View
              </div>
            )}

            <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center mb-4 transition-all ${activeHub === hub.id ? 'bg-primary' : 'bg-slate-50 dark:bg-slate-800 group-hover:scale-110'
              }`}>
              <hub.icon className={`w-6 h-6 ${activeHub === hub.id ? 'text-white' : 'text-slate-400'}`} />
            </div>

            <h3 className={`text-xl font-semibold tracking-tight mb-1 ${activeHub === hub.id ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
              {hub.label} Hub
            </h3>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-6 ${activeHub === hub.id ? 'text-primary' : 'text-slate-400'}`}>
              {hub.desc}
            </p>

            <div className="flex items-end justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-tighter mb-1 text-slate-300`}>Cumulative Peak</p>
                <p className="text-2xl font-semibold font-mono text-slate-900 dark:text-white">
                  {hub.mainMetric}
                </p>
              </div>
              <div className={`p-2 rounded-full border transition-all ${activeHub === hub.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'border-slate-100 dark:border-white/5 text-slate-300'}`}>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 py-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-white/5 to-transparent" />
        <div className="flex items-center gap-2 px-6 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-white/5">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {activeHub} Operations Overview
          </h2>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-white/5 to-transparent" />
      </div>

      {/* ── HIGH ALERT BANNER (If any) ── */}
      {highAlerts.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-[1rem] flex items-center justify-between group overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-500" />
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-rose-600 dark:text-rose-400 text-sm uppercase tracking-widest leading-none mb-1">Operational Warning</p>
              <p className="text-xs text-rose-500/80 font-semibold">{highAlerts.length} system anomalies require review.</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-rose-500 text-white rounded-xl font-semibold text-xs uppercase tracking-widest hover:bg-rose-600 transition-colors">
            Analyze
          </button>
        </div>
      )}

      {/* ── DYNAMIC METRICS GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {activeKpis.map((kpi, idx) => (
          <div key={idx} className="p-6 bg-white dark:bg-slate-900 rounded-[1rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-slate-50 dark:bg-slate-800 group-hover:bg-primary/10`}>
                <kpi.icon className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-emerald-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-semibold">Live</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h4 className="text-2xl font-semibold dark:text-white font-mono flex items-baseline gap-1">
              {(kpi.value || 0).toLocaleString()}
              <span className="text-xs font-semibold text-slate-300">{kpi.unit}</span>
            </h4>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Growth Chart */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                  Ecosystem Revenue
                </h3>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Monthly Snapshot • Subscriptions + Service Fees</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold uppercase tracking-widest shadow-lg shadow-primary/20">
                  Live Ecosystem Flow
                </div>
              </div>
            </div>

            <div className="h-[350px] w-full relative">
              <ResponsiveContainer key={activeHub} width="100%" height={350}>
                <LineChart data={revenueTrends.length > 1 ? revenueTrends : [
                  { month: 'Start', revenue: 0 },
                  ...(revenueTrends.length === 1 ? revenueTrends : [{ month: 'Current', revenue: 0 }])
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                    tickFormatter={(val) => `KSh ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '20px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      fontWeight: 800,
                      backgroundColor: '#fff'
                    }}
                    formatter={(val) => [`KSh ${val.toLocaleString()}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#00A651"
                    strokeWidth={5}
                    dot={{ r: 6, fill: '#00A651', strokeWidth: 3, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6 uppercase tracking-widest">Material Breakdown (Top 5)</h3>
              <div className="h-[240px]">
                <ResponsiveContainer key={activeHub} width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={materialDistribution}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#00A651" />
                      <Cell fill="#fbbf24" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#6366f1" />
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-widest">Fleet Efficiency</h3>
                <p className="text-xs text-slate-500 font-medium">Real-time throughput analysis</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-semibold uppercase text-slate-400">Agent Utilization</span>
                  <span className="text-lg font-semibold text-primary">74%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-[74%] bg-gradient-to-r from-primary to-emerald-400 rounded-full" />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <Clock className="w-3 h-3" /> Avg. Pickup: 24 mins
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Activity Sidebar - FIXED STYLING */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[1rem] h-full shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Network className="w-32 h-32 text-primary" />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="font-semibold uppercase tracking-widest text-xs flex items-center gap-2 text-slate-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" /> Live Updates
              </h3>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-semibold uppercase tracking-widest text-slate-400">
                Live
              </span>
            </div>

            <div className="flex-1 space-y-6 overflow-hidden relative z-10">
              {systemEvents.length === 0 && (
                <div className="py-20 text-center opacity-30">
                  <Activity className="w-8 h-8 mx-auto mb-3 animate-pulse text-slate-400" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Deep Listening...</p>
                </div>
              )}
              {systemEvents.map(ev => (
                <div key={ev.id} className="flex gap-4 group border-b border-slate-50 dark:border-slate-800/50 pb-4 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 p-2 -m-2 rounded-xl transition-colors">
                  <div className="mt-1">
                    {ev.type === 'success' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />}
                    {ev.type === 'user' && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />}
                    {ev.type === 'info' && <div className="w-2 h-2 rounded-full bg-slate-400" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight group-hover:text-primary transition-colors">{ev.msg}</p>
                    <p className="text-xs font-semibold uppercase text-slate-400 mt-1">
                      {new Date(ev.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 relative z-10">
              <button className="w-full py-4 bg-slate-50 dark:bg-slate-800 rounded-[1rem] font-semibold text-xs uppercase tracking-widest hover:bg-primary text-slate-500 hover:text-white dark:text-slate-400 transition-all flex items-center justify-center gap-2">
                System Hub <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Floating AI Voice Assistant */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/hygenex')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50 z-50 border-4 border-white dark:border-slate-800"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />
        <Brain className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
}
