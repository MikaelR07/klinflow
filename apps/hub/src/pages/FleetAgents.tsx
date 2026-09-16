import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, ChevronDown, User, Truck, Star, MapPin, 
  Calendar, Phone, Mail, ShieldAlert, CheckCircle2, AlertTriangle,
  X, MessageSquare, Activity, FileText,Users, Settings, ShieldCheck,
  TrendingUp, CreditCard, ChevronRight, Ban, Copy, RefreshCw, Zap, Scale
} from 'lucide-react';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { AgentProfile } from '@klinflow/core/stores/agentStore.types';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  BarChart, Bar
} from 'recharts';



export default function FleetAgents() {
  const profile = useAuthStore(s => s.profile);
  const { fleetDrivers, fleetAnalytics, fetchFleetDrivers, isLoadingFleet } = useAgentStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('All Agents');

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

  // --- Chart Data ---
  const weeklyPerformanceData = fleetAnalytics?.weeklyPerformanceData || [];
  const financialData = fleetAnalytics?.financialData || [];
  const complainsData = fleetAnalytics?.complainsData || [];

  const collectionTrendData = weeklyPerformanceData.map(d => ({
    day: d.day,
    collection: d.weight
  }));

  // --- Extended Data for Modal ---
  const getExtendedData = (agent: any) => {
    return {
      klinId: agent.klinflow_id || `KFL-${agent.id?.substring(0, 4).toUpperCase()}`,
      status: agent.is_online ? 'Active' : 'Offline',
      vehicleType: agent.vehicle_type || 'Unassigned',
      plate: agent.vehicle_plate || 'Unassigned',
      totalKg: (agent.lifetime_kg || 0).toLocaleString(),
      rating: Number(agent.rating || 0).toFixed(1),
      completion: agent.total_assigned_jobs > 0 ? Math.round((agent.trips_completed / agent.total_assigned_jobs) * 100) : 0,
      dateJoined: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      trips: agent.trips_completed || 0,
      payouts: `KES ${(agent.lifetime_payouts || 0).toLocaleString()}`
    };
  };

  // --- Filters ---
  const filteredAgents = useMemo(() => {
    return fleetDrivers.filter((driver: any) => {
      const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            driver.phone?.includes(searchQuery) ||
                            driver.klinflow_id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'Online') matchesTab = driver.is_online && (driver.location as any)?.status !== 'maintenance';
      if (activeTab === 'Top Performers') matchesTab = Number(driver.rating || 0) >= 4.5;
      if (activeTab === 'Maintenance') matchesTab = (driver.location as any)?.status === 'maintenance';
      
      return matchesSearch && matchesTab;
    });
  }, [fleetDrivers, searchQuery, activeTab]);

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header & Invite Code */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Fleet Agents Directory</h1>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">Manage your entire fleet operations and agents in real-time.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-2 px-3 flex items-center gap-3">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block">Fleet Invite Code</p>
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && profile?.fleetInviteCode) {
                    navigator.clipboard.writeText(profile.fleetInviteCode);
                    toast.success('Invite Code Copied!');
                  }
                }}
                className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-lg px-2 py-1 flex items-center justify-center gap-2 transition-all"
              >
                <span className="font-bold text-xs tracking-[0.2em] text-[#131722] dark:text-white">
                  {profile?.fleetInviteCode || 'KFL-789-QZ'}
                </span>
                <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-500" />
              </button>
            </div>
            
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

        {/* Directory Table Area */}
        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
          {/* Toolbar (Search & Tabs) */}
          <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by agent name or KLIN-ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs outline-none text-[#131722] dark:text-white placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar">
              {['All Agents', 'Online', 'Top Performers', 'Maintenance'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50 sticky top-0 z-10 backdrop-blur">
                <tr>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Agent</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">KLIN-ID</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Location</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Success Rate</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Total Collection</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Collections Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                {filteredAgents.map((agent: any) => {
                  const successRate = agent.total_assigned_jobs > 0 ? Math.round((agent.trips_completed / agent.total_assigned_jobs) * 100) : 0;
                  return (
                    <tr 
                      key={agent.id} 
                      onClick={() => setSelectedAgent(agent)}
                      className={`transition-colors cursor-pointer group hover:bg-slate-50/50 dark:hover:bg-slate-900/20`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-[#e0e3eb] dark:border-slate-600 flex items-center justify-center font-bold text-xs text-slate-500">
                            {agent.avatar_url ? (
                              <OptimizedImage src={getThumbnailUrl(agent.avatar_url, { width: 100 })} className="w-full h-full object-cover" />
                            ) : (
                              agent.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#131722] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{agent.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5 hidden sm:block">{agent.phone || '+254 7XX XXX XXX'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-xs text-slate-600 dark:text-slate-300">
                          {agent.klinflow_id || `KFL-${agent.id?.substring(0, 4).toUpperCase()}`}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {(agent.location as any)?.estate || 'Nairobi'}
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
                        <span className="font-bold text-xs text-[#131722] dark:text-white">{(agent.lifetime_kg || 0).toLocaleString()} Kg</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-bold text-xs text-[#131722] dark:text-white">{(agent.collections_today_kg || 0).toLocaleString()} Kg</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredAgents.length === 0 && !isLoadingFleet && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Users className="w-12 h-12 text-slate-300 mb-4" />
                <p className="font-bold text-base text-[#131722] dark:text-white">No agents found</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* 4. ── VISUALIZATIONS ROW 1 (Line & Bar) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
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
                <LineChart data={collectionTrendData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
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
                <BarChart data={weeklyPerformanceData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="pickups" name="Pickups" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="weight" name="Weight" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 5. ── VISUALIZATIONS ROW 2 (Pie, Area, Bar) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <AreaChart data={financialData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
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
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
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
                <BarChart data={complainsData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="complains" name="Complains" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* Slide-over Deep Dive Panel */}
      <AnimatePresence>
        {selectedAgent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAgent(null)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40"
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="absolute top-0 right-0 bottom-0 w-full md:w-[450px] bg-white dark:bg-slate-900 border-l border-[#e0e3eb] dark:border-slate-800 shadow-2xl z-50 flex flex-col"
            >
              {(() => {
                const ext = getExtendedData(selectedAgent);
                return (
                  <>
                    {/* Panel Header */}
                    <div className="p-5 border-b border-[#e0e3eb] dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900/50">
                      <div className="flex items-start justify-between w-full mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border border-[#e0e3eb] dark:border-slate-700/50 dark:bg-slate-800 shrink-0 flex items-center justify-center text-slate-500 text-2xl font-black shadow-inner">
                            {selectedAgent.avatar_url ? (
                              <OptimizedImage src={getThumbnailUrl(selectedAgent.avatar_url, { width: 100 })} className="w-full h-full object-cover" />
                            ) : (
                              selectedAgent.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h2 className="text-sm font-bold text-[#131722] dark:text-white">{selectedAgent.name}</h2>
                            <div className="flex flex-col mt-1 gap-0.5">
                              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500"><Star className="w-3 h-3 fill-amber-500"/> Rating: {ext.rating}</span>
                              <span className="font-bold text-[11px] text-slate-500 dark:text-slate-400">
                                Status: <span className={ext.status === 'Active' ? 'text-emerald-500' : ''}>{ext.status}</span>
                              </span>
                            </div>
                            <p className="font-bold text-[10px] text-slate-400 mt-1 uppercase tracking-widest">KLIN-ID: {ext.klinId}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedAgent(null)} className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-[#131722] dark:hover:text-white transition-colors rounded-full">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20">
                          <MessageSquare className="w-3.5 h-3.5"/> Message
                        </button>
                        <button className="flex-1 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                          <Settings className="w-3.5 h-3.5"/> Manage
                        </button>
                        <button className={`flex-1 py-2 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-sm ${ext.status === 'Suspended' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-500 hover:bg-rose-600'}`}>
                          {ext.status === 'Suspended' ? <CheckCircle2 className="w-3.5 h-3.5"/> : <Ban className="w-3.5 h-3.5"/>}
                          {ext.status === 'Suspended' ? 'Activate' : 'Suspend'}
                        </button>
                      </div>
                    </div>

                    {/* Panel Content (All Info Visible) */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/20 custom-scrollbar space-y-8">
                      
                      {/* Profile & Contact Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pb-2 border-b border-[#e0e3eb] dark:border-slate-700">
                          <User className="w-4 h-4"/> Contact & Identity
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center"><Phone className="w-4 h-4 text-slate-500"/></div>
                            <div><p className="text-[10px] font-bold text-slate-500">Phone Number</p><p className="text-sm font-bold text-[#131722] dark:text-white">{selectedAgent.phone || '+254 712 345 678'}</p></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center"><Mail className="w-4 h-4 text-slate-500"/></div>
                            <div><p className="text-[10px] font-bold text-slate-500">Email Address</p><p className="text-sm font-bold text-[#131722] dark:text-white">{selectedAgent.name.split(' ')[0].toLowerCase()}@klinfleet.com</p></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 p-3 rounded-xl flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-500"/>
                            <div><p className="text-[10px] font-bold text-slate-500">National ID</p><p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Verified</p></div>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 p-3 rounded-xl flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-500"/>
                            <div><p className="text-[10px] font-bold text-slate-500">Driving License</p><p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Verified</p></div>
                          </div>
                        </div>
                      </div>

                      {/* Performance Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pb-2 border-b border-[#e0e3eb] dark:border-slate-700">
                          <TrendingUp className="w-4 h-4"/> Performance Analytics
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 p-4 rounded-xl">
                            <TrendingUp className="w-4 h-4 text-emerald-500 mb-2"/>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total KG</p>
                            <p className="text-xl font-bold text-slate-700 dark:text-white mt-1">{ext.totalKg}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 p-4 rounded-xl">
                            <Activity className="w-4 h-4 text-blue-500 mb-2"/>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trips Completed</p>
                            <p className="text-xl font-black text-slate-700 dark:text-white mt-1">{ext.trips}</p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Earnings Lifetime</h4>
                            <CreditCard className="w-4 h-4 text-emerald-500"/>
                          </div>
                          <p className="text-xl font-black text-slate-700 dark:text-white">{ext.payouts}</p>
                          <p className="text-xs font-bold text-emerald-500 mt-2">↑ Top 15% of fleet</p>
                        </div>
                      </div>
                      
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
