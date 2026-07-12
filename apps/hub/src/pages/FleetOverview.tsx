import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Copy, RefreshCw, Star, Wallet, Scale,
  Truck, CheckCircle2, Phone, MessageSquare,
  MoreVertical, UserPlus, X, MapPin, Calendar, Activity, Zap, AlertTriangle, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
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

export default function FleetOverview() {
  const profile = useAuthStore(s => s.profile);
  const companyId = useAuthStore(s => s.currentCompanyId); 
  const fleetDrivers = useAgentStore(s => s.fleetDrivers);
  const fetchFleetDrivers = useAgentStore(s => s.fetchFleetDrivers);
  const isLoadingFleet = useAgentStore(s => s.isLoadingFleet);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All Agents');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    fetchFleetDrivers();
  }, [fetchFleetDrivers]);

  // --- Fleet Status & KPI Calculations ---
  const maintenanceDrivers = fleetDrivers.filter((d: any) => (d.location as any)?.status === 'maintenance');
  const onlineDrivers = fleetDrivers.filter((d: any) => d.is_online && (d.location as any)?.status !== 'maintenance');
  const enRouteDrivers = onlineDrivers.filter((d: any) => d.is_en_route || (d.location as any)?.status === 'en_route');
  const idleDrivers = onlineDrivers.filter((d: any) => !d.is_en_route && (d.location as any)?.status !== 'en_route');
  const offlineDrivers = fleetDrivers.filter((d: any) => !d.is_online && (d.location as any)?.status !== 'maintenance');

  const fleetStatusData = [
    { name: 'Online (Idle)', value: idleDrivers.length, color: '#22c55e' },
    { name: 'On Route', value: enRouteDrivers.length, color: '#3b82f6' },
    { name: 'Offline', value: offlineDrivers.length, color: '#94a3b8' },
    { name: 'Maintenance', value: maintenanceDrivers.length, color: '#ef4444' }
  ];

  const totalAgents = fleetDrivers.length;
  const onlinePercent = totalAgents > 0 ? Math.round((onlineDrivers.length / totalAgents) * 100) : 0;
  
  const totalCollections = fleetDrivers.reduce((sum: number, d: any) => sum + Number(d.collected_kg || 0), 0);
  const totalPayouts = fleetDrivers.reduce((sum: number, d: any) => sum + Number(d.payout_amount || 0), 0);

  const totalCompletedJobs = fleetDrivers.reduce((sum: number, d: any) => sum + Number(d.completed_jobs || 0), 0);
  const totalAssignedJobs = fleetDrivers.reduce((sum: number, d: any) => sum + Number(d.total_jobs || d.completed_jobs || 0), 0);
  const completionRate = totalAssignedJobs > 0 ? Math.round((totalCompletedJobs / totalAssignedJobs) * 100) : 0;

  // --- Weekly Performance Data (Stacked Bar) ---
  const weeklyPerformanceData = [
    { day: 'Mon', pickups: Math.floor(totalCompletedJobs * 0.12), weight: Math.floor(totalCollections * 0.1) },
    { day: 'Tue', pickups: Math.floor(totalCompletedJobs * 0.15), weight: Math.floor(totalCollections * 0.15) },
    { day: 'Wed', pickups: Math.floor(totalCompletedJobs * 0.13), weight: Math.floor(totalCollections * 0.12) },
    { day: 'Thu', pickups: Math.floor(totalCompletedJobs * 0.18), weight: Math.floor(totalCollections * 0.25) },
    { day: 'Fri', pickups: Math.floor(totalCompletedJobs * 0.2), weight: Math.floor(totalCollections * 0.18) },
    { day: 'Sat', pickups: Math.floor(totalCompletedJobs * 0.14), weight: Math.floor(totalCollections * 0.12) },
    { day: 'Sun', pickups: Math.floor(totalCompletedJobs * 0.08), weight: Math.floor(totalCollections * 0.08) },
  ];

  // --- Overall Collection Data (Line Graph) ---
  const collectionTrendData = [
    { day: 'Mon', collection: 420 },
    { day: 'Tue', collection: 480 },
    { day: 'Wed', collection: 450 },
    { day: 'Thu', collection: 590 },
    { day: 'Fri', collection: 520 },
    { day: 'Sat', collection: 380 },
    { day: 'Sun', collection: 290 },
  ];

  // --- Payouts vs Deposits Data (Area/Line) ---
  const financialData = [
    { day: 'Mon', deposits: 45000, payouts: 38000 },
    { day: 'Tue', deposits: 52000, payouts: 42000 },
    { day: 'Wed', deposits: 48000, payouts: 45000 },
    { day: 'Thu', deposits: 61000, payouts: 58000 },
    { day: 'Fri', deposits: 58000, payouts: 55000 },
    { day: 'Sat', deposits: 35000, payouts: 40000 },
    { day: 'Sun', deposits: 25000, payouts: 20000 },
  ];

  // --- Agent Complains (Bar Graph) ---
  const complainsData = [
    { day: 'Mon', complains: 4 },
    { day: 'Tue', complains: 2 },
    { day: 'Wed', complains: 5 },
    { day: 'Thu', complains: 1 },
    { day: 'Fri', complains: 3 },
    { day: 'Sat', complains: 0 },
    { day: 'Sun', complains: 1 },
  ];

  // --- Top Performers (Horizontal Bar) ---
  const topPerformers = [
    { name: 'John Doe', jobs: 145 },
    { name: 'Alice M', jobs: 132 },
    { name: 'Peter K', jobs: 118 },
    { name: 'Sarah W', jobs: 104 },
    { name: 'David O', jobs: 92 },
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
    <div className="min-h-screen bg-transparent pb-10">
      <div className="p-4 sm:p-6 lg:p-6 mx-auto space-y-4 animate-fade-in w-full">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-[#e0e3eb] dark:border-slate-700/50">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#131722] dark:text-white">Fleet Overview</h1>
            <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">Manage your entire fleet operations in real-time.</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block">Fleet Invite Code</p>
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && profile?.fleetInviteCode) {
                  navigator.clipboard.writeText(profile.fleetInviteCode);
                  toast.success('Invite Code Copied!');
                }
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-lg px-3 py-1.5 flex items-center justify-center gap-3 transition-all"
            >
              <span className="font-bold text-sm tracking-[0.2em] text-[#131722] dark:text-white">
                {profile?.fleetInviteCode || 'KFL-789-QZ'}
              </span>
              <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-500" />
            </button>
          </div>
        </div>

        {/* 1. ── KPI CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Users, label: 'Total Fleet', value: totalAgents, trend: 'Registered agents', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { icon: Activity, label: 'Active Agents', value: onlineDrivers.length, trend: 'Online now', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { icon: CheckCircle2, label: 'Agent Complains', value: `${completionRate}%`, trend: 'Assigned jobs', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { icon: Zap, label: 'Offline Agents', value: offlineDrivers.length, trend: 'Not active', color: 'text-slate-500', bg: 'bg-slate-500/10' },
            { icon: RefreshCw, label: 'Fleet Utilization', value: `${onlinePercent}%`, trend: 'Active capacity', color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { icon: Scale, label: 'Total Collected', value: `${totalCollections.toLocaleString()} Kg`, trend: 'Lifetime weight', color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex gap-4 items-center">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div>
                <p className="font-bold text-[9px] xl:text-[10px] text-slate-500 uppercase tracking-widest truncate">
                  {kpi.label}
                </p>
                <h3 className="text-lg font-bold text-[#131722] dark:text-white leading-none mt-1">{kpi.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* 3. ── AGENT TABLE + TOP PERFORMERS ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-2">
        <div className="xl:col-span-9 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl overflow-hidden flex flex-col relative">
          
          <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search agents..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-[#131722] dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              {['All Agents', 'Online', 'Top Performers', 'Maintenance'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === tab ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50 sticky top-0 z-10 backdrop-blur">
                <tr>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Agent</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">KLIN-ID</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Location</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Vehicle</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Success Rate</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Collections Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                {filteredDrivers.map(agent => {
                  const successRate = generateMockSuccessRate(agent.id!);
                  return (
                    <tr 
                      key={agent.id} 
                      className={`transition-colors ${selectedAgentId === agent.id ? 'bg-emerald-50/50 dark:bg-emerald-500/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/20'}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-[#e0e3eb] dark:border-slate-600">
                            {agent.avatar_url ? (
                              <OptimizedImage src={getThumbnailUrl(agent.avatar_url, { width: 100 })} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">{agent.name.charAt(0).toUpperCase()}</div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#131722] dark:text-white">{agent.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-xs text-slate-600 dark:text-slate-300">
                          {agent.klinflow_id || `AGT-${agent.id?.substring(0, 4)}`}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {(agent.location as any)?.estate || 'Nairobi'}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          {generateMockVehicle(agent.id!).split(' (')[0]}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                          agent.is_online ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          (agent.location as any)?.status === 'maintenance' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                          'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {agent.is_online ? (agent.is_en_route ? 'On Route' : 'Online') : (agent.location as any)?.status === 'maintenance' ? 'Maintenance' : 'Offline'}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="w-24">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[10px] text-[#131722] dark:text-white">{successRate}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${successRate}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-bold text-xs text-[#131722] dark:text-white">{(agent.collected_kg || 0).toLocaleString()} Kg</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredDrivers.length === 0 && !isLoadingFleet && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Users className="w-8 h-8 text-slate-300 mb-3" />
                <p className="font-bold text-sm text-[#131722] dark:text-white">No agents found</p>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </div>

          {/* Top Performers (Right Column) */}
          <div className="xl:col-span-3 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-6 flex flex-col">
            <h3 className="text-sm font-bold text-[#131722] dark:text-white mb-1">Top Performing Agents</h3>
            <p className="text-[10px] text-slate-400 font-medium mb-6">By completed jobs</p>
            <div className="flex-1 flex flex-col justify-center space-y-4">
              {topPerformers.map((item, i) => {
                const max = Math.max(...topPerformers.map(d => d.jobs));
                const percentage = (item.jobs / max) * 100;
                return (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className="text-[#131722] dark:text-white">{item.jobs} jobs</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. ── VISUALIZATIONS ROW 1 (Line & Bar) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          
          {/* Overall Collection Trend (Line Graph) */}
          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-6 flex flex-col h-[350px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">Overall Agent Collection</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Total fleet volume over 7 days (Kg)</p>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={collectionTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="collection" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Pickups & Weight (Bar Graph) */}
          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-6 flex flex-col h-[350px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">Weekly Pickups & Weight</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Jobs completed vs Volume (Kg)</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><div className="w-3 h-3 rounded bg-blue-500"></div> Pickups</div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><div className="w-3 h-3 rounded bg-emerald-500"></div> Weight</div>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyPerformanceData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="pickups" name="Pickups" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="weight" name="Weight" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* 5. ── VISUALIZATIONS ROW 2 (Pie, Area, Bar) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Fleet Status (Donut) */}
          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-6 flex flex-col h-[350px]">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[#131722] dark:text-white">Fleet Status</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Current state of vehicles</p>
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div className="relative w-[60%] h-full flex items-center justify-center -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fleetStatusData}
                      cx="50%" cy="50%"
                      innerRadius={70} outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {fleetStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-[#131722] dark:text-white leading-none">{totalAgents}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total</span>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-y-4 w-[40%] pl-2">
                {fleetStatusData.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest line-clamp-1">{item.name}</p>
                    </div>
                    <p className="text-sm font-black text-[#131722] dark:text-white ml-5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payouts vs Deposits (Area Graph) */}
          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-6 flex flex-col h-[350px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">Agent Finances</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Payouts vs Deposits (KES)</p>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPayouts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => `${val/1000}k`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="deposits" name="Deposits" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorDeposits)" />
                  <Area type="monotone" dataKey="payouts" name="Payouts" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorPayouts)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 border-t border-[#e0e3eb] dark:border-slate-700/50 pt-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><div className="w-2.5 h-2.5 rounded-full bg-violet-500"></div> Deposits</div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Payouts</div>
            </div>
          </div>

          {/* Agent Complains (Bar Graph) */}
          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-6 flex flex-col h-[350px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">Agent Complains</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Reported issues over 7 days</p>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complainsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="complains" name="Complains" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
