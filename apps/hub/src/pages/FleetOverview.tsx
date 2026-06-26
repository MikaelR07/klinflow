import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Copy, RefreshCw, Star, Wallet, Scale,
  Truck, CheckCircle2, Phone, MessageSquare,
  MoreVertical, UserPlus, X, MapPin, Calendar, Activity, Zap, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  BarChart, Bar
} from 'recharts';

// --- Deterministic Mock Generators ---
const getStableHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const generateMockVehicle = (id: string) => {
  const hash = getStableHash(id);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const plate = `K${letters[hash % 26]}${letters[(hash >> 1) % 26]} ${(hash % 999).toString().padStart(3, '0')}${letters[(hash >> 2) % 26]}`;
  const types = ['Truck', 'Motorbike', 'Tricycle', 'Van'];
  return `${plate} (${types[hash % types.length]})`;
};

const generateMockSuccessRate = (id: string) => 85 + (getStableHash(id) % 15);
const generateMockJoinDate = (id: string) => {
  const hash = getStableHash(id);
  const date = new Date(Date.now() - (hash % 10000000000));
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const generateTimeline = (id: string) => {
  const hash = getStableHash(id);
  return [
    { label: 'Pickup Completed', time: '12:42 PM', color: 'text-emerald-500 bg-emerald-500' },
    { label: 'RFQ Accepted', time: '11:35 AM', color: 'text-blue-500 bg-blue-500' },
    { label: 'Route Started', time: '10:01 AM', color: 'text-amber-500 bg-amber-500' },
    { label: 'Checked In', time: '08:15 AM', color: 'text-slate-500 bg-white/10' }
  ].slice(0, (hash % 3) + 2);
};

export default function FleetOverview() {
  const profile = useAuthStore(s => s.profile);
  const fleetDrivers = useAgentStore(s => s.fleetDrivers);
  const fetchFleetDrivers = useAgentStore(s => s.fetchFleetDrivers);
  const isLoadingFleet = useAgentStore(s => s.isLoadingFleet);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All Agents');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    fetchFleetDrivers();
  }, [fetchFleetDrivers]);

  const handleCopyCode = () => {
    if (profile?.fleetInviteCode) {
      navigator.clipboard.writeText(profile.fleetInviteCode);
      toast.success('Code Copied!', { description: 'Share this with your new drivers.' });
    }
  };

  // --- Fleet Status & KPI Calculations ---
  const maintenanceDrivers = fleetDrivers.filter((d: any) => (d.location as any)?.status === 'maintenance');
  const onlineDrivers = fleetDrivers.filter((d: any) => d.is_online && (d.location as any)?.status !== 'maintenance');
  const enRouteDrivers = onlineDrivers.filter((d: any) => d.is_en_route || (d.location as any)?.status === 'en_route');
  const idleDrivers = onlineDrivers.filter((d: any) => !d.is_en_route && (d.location as any)?.status !== 'en_route');
  const offlineDrivers = fleetDrivers.filter((d: any) => !d.is_online && (d.location as any)?.status !== 'maintenance');

  const fleetStatusData = [
    { name: 'Online', value: idleDrivers.length, color: '#22c55e' },
    { name: 'On Route', value: enRouteDrivers.length, color: '#3b82f6' },
    { name: 'Offline', value: offlineDrivers.length, color: '#94a3b8' },
    { name: 'Maintenance', value: maintenanceDrivers.length, color: '#ef4444' }
  ];

  const totalAgents = fleetDrivers.length;
  const onlinePercent = totalAgents > 0 ? Math.round((onlineDrivers.length / totalAgents) * 100) : 0;
  
  const avgRating = fleetDrivers.length > 0 
    ? (fleetDrivers.reduce((sum: number, d: any) => sum + Number(d.rating || 0), 0) / fleetDrivers.length).toFixed(1)
    : '0.0';

  const totalCollections = fleetDrivers.reduce((sum: number, d: any) => sum + Number(d.collected_kg || 0), 0);
  const totalPayouts = fleetDrivers.reduce((sum: number, d: any) => sum + Number(d.payout_amount || 0), 0);

  // Professional fleet KPIs
  const totalCompletedJobs = fleetDrivers.reduce((sum: number, d: any) => sum + Number(d.completed_jobs || 0), 0);
  const totalAssignedJobs = fleetDrivers.reduce((sum: number, d: any) => sum + Number(d.total_jobs || d.completed_jobs || 0), 0);
  const completionRate = totalAssignedJobs > 0 ? Math.round((totalCompletedJobs / totalAssignedJobs) * 100) : 0;
  const avgResponseMin = fleetDrivers.length > 0
    ? Math.round(fleetDrivers.reduce((sum: number, d: any) => sum + Number(d.avg_response_time || 8 + Math.random() * 7), 0) / fleetDrivers.length)
    : 0;

  // --- Weekly Performance Data (Stacked Bar) ---
  const weeklyPerformanceData = [
    { day: 'Mon', pickups: Math.floor(totalCompletedJobs * 0.12), revenue: Math.floor(totalPayouts * 0.1), weight: Math.floor(totalCollections * 0.1) },
    { day: 'Tue', pickups: Math.floor(totalCompletedJobs * 0.15), revenue: Math.floor(totalPayouts * 0.14), weight: Math.floor(totalCollections * 0.15) },
    { day: 'Wed', pickups: Math.floor(totalCompletedJobs * 0.13), revenue: Math.floor(totalPayouts * 0.12), weight: Math.floor(totalCollections * 0.12) },
    { day: 'Thu', pickups: Math.floor(totalCompletedJobs * 0.18), revenue: Math.floor(totalPayouts * 0.2), weight: Math.floor(totalCollections * 0.25) },
    { day: 'Fri', pickups: Math.floor(totalCompletedJobs * 0.2), revenue: Math.floor(totalPayouts * 0.18), weight: Math.floor(totalCollections * 0.18) },
    { day: 'Sat', pickups: Math.floor(totalCompletedJobs * 0.14), revenue: Math.floor(totalPayouts * 0.16), weight: Math.floor(totalCollections * 0.12) },
    { day: 'Sun', pickups: Math.floor(totalCompletedJobs * 0.08), revenue: Math.floor(totalPayouts * 0.1), weight: Math.floor(totalCollections * 0.08) },
  ];

  // --- Top Performers (Horizontal Bar) Demo Data ---
  const topPerformers = [
    { name: 'John Doe', jobs: 145, kg: 820 },
    { name: 'Alice M', jobs: 132, kg: 750 },
    { name: 'Peter K', jobs: 118, kg: 690 },
    { name: 'Sarah W', jobs: 104, kg: 580 },
    { name: 'David O', jobs: 92, kg: 450 },
  ];

  // --- Chart Data (Mocking a 7-day trend based on totalCollections for visual) ---
  const chartData = [
    { day: 'Mon', collections: Math.floor(totalCollections * 0.1) },
    { day: 'Tue', collections: Math.floor(totalCollections * 0.15) },
    { day: 'Wed', collections: Math.floor(totalCollections * 0.12) },
    { day: 'Thu', collections: Math.floor(totalCollections * 0.25) },
    { day: 'Fri', collections: Math.floor(totalCollections * 0.18) },
    { day: 'Sat', collections: Math.floor(totalCollections * 0.2) },
    { day: 'Sun', collections: Math.floor(totalCollections * 0.3) },
  ];

  // --- Filters ---
  const filteredDrivers = useMemo(() => {
    return fleetDrivers.filter(driver => {
      const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            driver.phone?.includes(searchQuery) ||
                            driver.klinflow_id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'Online') matchesTab = driver.is_online && (driver.location as any)?.status !== 'maintenance';
      if (activeTab === 'Top Performers') matchesTab = Number(driver.rating || 0) >= 4.5;
      if (activeTab === 'Maintenance') matchesTab = (driver.location as any)?.status === 'maintenance';
      if (activeTab === 'Pending Approval') matchesTab = driver.status === 'pending';
      if (activeTab === 'Suspended') matchesTab = driver.status === 'suspended';
      
      return matchesSearch && matchesTab;
    });
  }, [fleetDrivers, searchQuery, activeTab]);

  const selectedAgent = fleetDrivers.find(d => d.id === selectedAgentId);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/50 pb-10">
      <div className="p-4 sm:p-2 max-w-[1600px] mx-auto space-y-4">
        
        {/* ── DESCRIPTION & INVITE ── */}
        <div className="mb-4 flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#e0e3eb] dark:border-slate-800 shadow-none">
          <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Manage and monitor your operations team in real-time.</p>
          <div className="flex items-center gap-3">
            <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Fleet Invite Code</p>
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && profile?.fleetInviteCode) {
                  navigator.clipboard.writeText(profile.fleetInviteCode);
                  // toast.success('Code Copied!');
                }
              }}
              className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-lg px-3 py-1.5 flex items-center gap-3 transition-all"
            >
              <span className="font-medium text-sm tracking-[0.15em] text-[#131722] dark:text-white">
                {profile?.fleetInviteCode || '------'}
              </span>
              <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-500" />
            </button>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Users, label: 'Total Fleet', value: totalAgents, trend: `${onlineDrivers.length} online now`, trendUp: true, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
            { icon: Activity, label: 'Active Now', value: onlineDrivers.length, trend: `${onlinePercent}% utilization`, trendUp: onlinePercent > 50, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
            { icon: CheckCircle2, label: 'Completion Rate', value: `${completionRate}%`, trend: `${totalCompletedJobs} of ${totalAssignedJobs} jobs`, trendUp: completionRate >= 80, color: completionRate >= 80 ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
            { icon: Zap, label: 'Avg Response', value: `${avgResponseMin} min`, trend: avgResponseMin <= 10 ? 'Within SLA target' : 'Above SLA target', trendUp: avgResponseMin <= 10, color: avgResponseMin <= 10 ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' },
            { icon: Scale, label: 'Total Collected', value: `${totalCollections.toLocaleString()} Kg`, trend: `${fleetDrivers.filter((d: any) => Number(d.collected_kg || 0) > 0).length} agents contributing`, trendUp: true, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' },
            { icon: Wallet, label: 'Pending Payouts', value: `KES ${totalPayouts.toLocaleString()}`, trend: `${fleetDrivers.filter((d: any) => Number(d.payout_amount || 0) > 0).length} agents owed`, trendUp: false, color: 'text-slate-500 bg-white dark:bg-slate-800' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg p-4 shadow-none flex flex-col justify-between">
              <div className="flex items-start gap-3 mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <p className="font-bold text-[10px] text-slate-600 uppercase tracking-widest dark:text-slate-400">{kpi.label}</p>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-[#131722] dark:text-white leading-none">{kpi.value}</h3>
              <p className={`text-[10px] mt-2 ${kpi.trendUp ? 'text-emerald-500' : 'text-slate-400'}`}>
                {kpi.trend}
              </p>
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* 1. Fleet Utilization — Pie Chart */}
          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg p-5 shadow-none flex flex-col">
            <h3 className="text-sm font-bold text-[#131722] dark:text-white mb-2">Fleet Utilization</h3>
            <div className="flex-1 flex flex-col items-center justify-between mt-2">
            <div className="w-full h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fleetStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius="100%"
                    paddingAngle={0}
                    dataKey="value"
                    strokeWidth={0}
                    labelLine={false}
                  >
                    {fleetStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "none" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 w-full border-t border-[#e0e3eb] dark:border-slate-700/50 pt-4">
              {fleetStatusData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shadow-none shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="font-semibold text-[11px] text-slate-600 dark:text-slate-500 capitalize">{s.name}</span>
                  <span className="font-bold text-xs text-[#131722] dark:text-white ml-0.5">{s.value}</span>
                </div>
              ))}
            </div>
            </div>
          </div>

          {/* 2. Weekly Performance — Stacked Bar Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg p-5 shadow-none flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#131722] dark:text-white mb-0.5">Weekly Performance</h3>
                <p className="text-[10px] text-slate-400 font-medium">Pickups & collected weight by day</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500" /><span className="text-[9px] text-slate-500">Pickups</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-blue-500" /><span className="text-[9px] text-slate-500">Weight (Kg)</span></div>
              </div>
            </div>
            <div className="h-[200px] -mx-2 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyPerformanceData} barGap={2} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={35} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                  />
                  <Bar dataKey="pickups" name="Pickups" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="weight" name="Weight (Kg)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Top Performers */}
          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg p-5 shadow-none flex flex-col">
            <h3 className="text-sm font-bold text-[#131722] dark:text-white mb-1">Top Performers</h3>
            <p className="text-[10px] text-slate-400 font-medium mb-2">By completed jobs</p>
            <div className="flex-1 flex flex-col justify-center space-y-3.5">
              {topPerformers.map((item, i) => {
                const max = Math.max(...topPerformers.map(d => d.jobs));
                const percentage = (item.jobs / max) * 100;
                return (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className="text-[#131722] dark:text-white">{item.jobs}</span>
                    </div>
                    <div className="w-full h-6 bg-slate-300 dark:bg-slate-700/50 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── LISTINGS AREA (FILTERS + TABS + TABLE) ── */}
        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg shadow-none overflow-hidden flex flex-col relative">
          
          <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-800/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="font-medium absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, phone or agent ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="font-medium w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <select className="font-medium hidden sm:block text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
                <option>All Status</option>
                <option>Online</option>
                <option>Offline</option>
                <option>Maintenance</option>
              </select>
              <select className="font-medium hidden sm:block text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
                <option>All Vehicles</option>
                <option>Trucks</option>
                <option>Motorbikes</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 p-2 border-b border-[#e0e3eb] dark:border-slate-800/60 overflow-x-auto">
            {['All Agents', 'Online', 'Top Performers', 'Maintenance', 'Pending Approval', 'Suspended'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs transition-all ${activeTab === tab ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead className="font-bold bg-white dark:bg-slate-800/50 border-b border-[#e0e3eb] dark:border-slate-800 text-[10px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-6 py-4">Agent</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-4 py-4">Vehicle</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Collections Today</th>
                  <th className="px-4 py-4">Success Rate</th>
                  <th className="px-4 py-4">Rating</th>
                  <th className="px-4 py-4">Earnings Today</th>
                  <th className="px-4 py-4">Last Activity</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredDrivers.map(agent => {
                  const successRate = generateMockSuccessRate(agent.id!);
                  return (
                    <tr 
                      key={agent.id} 
                      onClick={() => setSelectedAgentId(agent.id!)}
                      className={`cursor-pointer transition-colors ${selectedAgentId === agent.id ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : 'hover:bg-white dark:hover:bg-slate-800/40'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border-2 border-transparent shadow-none">
                            {agent.avatar_url ? (
                              <OptimizedImage src={getThumbnailUrl(agent.avatar_url, { width: 100 })} className="w-full h-full object-cover" />
                            ) : (
                              <div className="font-medium w-full h-full flex items-center justify-center text-slate-400">{agent.name.charAt(0).toUpperCase()}</div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[#131722] dark:text-white">{agent.name}</p>
                            <p className="font-medium text-[10px] text-slate-400 tracking-wider">ID: {agent.klinflow_id || `AGT-${agent.id?.substring(0, 4)}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <MapPin className="font-medium w-3.5 h-3.5 text-slate-400" />
                          {(agent.location as any)?.estate || 'Nairobi'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Truck className="font-medium w-3.5 h-3.5 text-slate-400" />
                          <div className="flex flex-col">
                            <span>{generateMockVehicle(agent.id!).split(' (')[0]}</span>
                            <span className="font-medium text-[10px] text-slate-400">{generateMockVehicle(agent.id!).split('(')[1].replace(')', '')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest ${
                          agent.is_online ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          (agent.location as any)?.status === 'maintenance' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                          'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${agent.is_online ? 'bg-emerald-500 animate-pulse' : (agent.location as any)?.status === 'maintenance' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                          {agent.is_online ? (agent.is_en_route ? 'On Route' : 'Online') : (agent.location as any)?.status === 'maintenance' ? 'Maintenance' : 'Offline'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-[#131722] dark:text-white">{(agent.collected_kg || 0).toLocaleString()} Kg</span>
                          <span className="font-medium text-[10px] text-emerald-500">↑ 20%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-20">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-[#131722] dark:text-white">{successRate}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${successRate}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Star className="font-medium w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="font-medium text-sm text-[#131722] dark:text-white">{Number(agent.rating || 0).toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-sm text-[#131722] dark:text-white">KES {(agent.payout_amount || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="font-medium flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </div>
                          <span className="font-medium text-[10px] text-slate-400">{Math.floor(Math.random() * 10) + 1} min ago</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button className="font-medium p-2 text-slate-400 hover:text-[#131722] dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredDrivers.length === 0 && !isLoadingFleet && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Users className="font-medium w-10 h-10 text-slate-300 mb-4" />
                <p className="font-medium text-sm text-[#131722] dark:text-white">No agents found</p>
                <p className="font-medium text-xs text-slate-500 mt-1">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDEBAR (AGENT DETAILS) ── */}
      <AnimatePresence>
        {selectedAgentId && selectedAgent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAgentId(null)}
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-white dark:bg-slate-800 z-50 shadow-2xl border-l border-[#e0e3eb] dark:border-slate-800 overflow-y-auto flex flex-col"
            >
              <div className="p-4 pb-0 flex items-start justify-between">
                <button onClick={() => setSelectedAgentId(null)} className="font-medium p-2 -ml-2 text-slate-400 hover:text-[#131722] dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 border-b border-[#e0e3eb] dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border-2 border-[#e0e3eb] dark:border-slate-700 shadow-none shrink-0">
                    {selectedAgent.avatar_url ? (
                      <OptimizedImage src={getThumbnailUrl(selectedAgent.avatar_url, { width: 200 })} className="w-full h-full object-cover" />
                    ) : (
                      <div className="font-medium w-full h-full flex items-center justify-center text-xl text-slate-400">{selectedAgent.name.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#131722] dark:text-white">{selectedAgent.name}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedAgent.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span className="font-medium text-xs text-slate-600 dark:text-slate-300">{selectedAgent.is_online ? 'Online' : 'Offline'}</span>
                    </div>
                    <p className="font-medium text-[10px] text-slate-400 mt-1 uppercase tracking-widest">KLIN-ID: {selectedAgent.klinflow_id || `AGT-${selectedAgent.id?.substring(0, 4)}`}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full mt-6">
                  {[
                    { icon: Phone, label: 'Call', action: () => window.location.href = `tel:${selectedAgent.phone}` },
                    { icon: MessageSquare, label: 'Message', action: () => {} },
                    { icon: Wallet, label: 'Transfer', action: () => {} },
                    { icon: MoreVertical, label: 'More', action: () => {} }
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.action} className="flex-1 flex flex-col items-center gap-1">
                      <div className="font-medium w-10 h-10 rounded-full border border-[#e0e3eb] dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <btn.icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-[10px] text-slate-500">{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 space-y-5 flex-1">
                <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[10px] text-slate-400 uppercase tracking-widest mb-1">Wallet Balance</p>
                    <p className="font-bold text-sm text-[#131722] dark:text-white tracking-tight">KES {Number(selectedAgent.user_wallets?.cash_balance || 0).toLocaleString()}</p>
                    <button className="font-medium text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 hover:underline">View Payouts</button>
                  </div>
                  <div className="font-medium w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today's Performance</h3>
                    <button className="font-medium text-[10px] text-primary hover:underline">View All</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl p-3">
                      <p className="font-medium text-[9px] text-slate-400 uppercase tracking-widest mb-1">Collections</p>
                      <p className="font-medium text-base text-[#131722] dark:text-white">{(selectedAgent.collected_kg || 0).toLocaleString()}</p>
                      <p className="font-medium text-[9px] text-emerald-500 mt-0.5">↑ 20%</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl p-3">
                      <p className="font-medium text-[9px] text-slate-400 uppercase tracking-widest mb-1">Success Rate</p>
                      <p className="font-medium text-base text-[#131722] dark:text-white">{generateMockSuccessRate(selectedAgent.id!)}%</p>
                      <p className="font-medium text-[9px] text-emerald-500 mt-0.5">↑ 3%</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl p-3">
                      <p className="font-medium text-[9px] text-slate-400 uppercase tracking-widest mb-1">Rating</p>
                      <p className="font-medium text-base flex items-center gap-1 text-[#131722] dark:text-white"><Star className="font-medium w-3.5 h-3.5 fill-amber-400 text-amber-400"/> {Number(selectedAgent.rating || 0).toFixed(1)}</p>
                      <p className="font-medium text-[9px] text-emerald-500 mt-0.5">↑ 0.2</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Agent Information</h3>
                  <div className="space-y-3">
                    {[
                      { icon: MapPin, label: 'Current Location', value: (selectedAgent.location as any)?.estate || 'Nairobi, Kenya' },
                      { icon: Truck, label: 'Assigned Vehicle', value: generateMockVehicle(selectedAgent.id!) },
                      { icon: Calendar, label: 'Join Date', value: generateMockJoinDate(selectedAgent.id!) },
                      { icon: Phone, label: 'Phone Number', value: selectedAgent.phone || 'N/A' },
                    ].map((info, i) => (
                      <div key={i} className="flex gap-3">
                        <info.icon className="font-medium w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-[9px] text-slate-400 uppercase tracking-widest">{info.label}</p>
                          <p className="font-medium text-sm text-[#131722] dark:text-white">{info.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="font-medium flex items-center justify-center gap-2 p-2.5 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                      <Users className="w-3.5 h-3.5" /> View Profile
                    </button>
                    <button className="font-medium flex items-center justify-center gap-2 p-2.5 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                      <Activity className="w-3.5 h-3.5" /> Performance
                    </button>
                    <button className="font-medium flex items-center justify-center gap-2 p-2.5 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                      <Truck className="w-3.5 h-3.5" /> Assign Vehicle
                    </button>
                    <button className="font-medium flex items-center justify-center gap-2 p-2.5 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-xs hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                      <AlertTriangle className="w-3.5 h-3.5" /> Suspend Agent
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);
