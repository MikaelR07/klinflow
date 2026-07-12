import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ArrowRight, CheckCircle2, Truck, X, PackageCheck, AlertTriangle, ChevronDown, Activity, Lightbulb, AlertCircle, Info, Check, Search, Filter, Settings2, BarChart2, TrendingUp, Navigation } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, LayerGroup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import 'leaflet/dist/leaflet.css';

const mapCenter: [number, number] = [-1.2921, 36.8219];

const createDriverIcon = (colorClass: string) => new L.DivIcon({
  className: 'bg-transparent',
  html: `<div class="w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-white shadow-none border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Mock Data
const MOCK_DISPATCHES = [
  { id: 'DSP-2024-0156', destination: 'Westlands Hub', driver: 'John Mwangi', vehicle: 'KCA 123A', status: 'IN PROGRESS', scheduled: '08:00 AM', eta: '09:15 AM', progress: 65, color: 'bg-blue-500', text: 'text-blue-500' },
  { id: 'DSP-2024-0155', destination: 'Thika Transfer Station', driver: 'Peter Otieno', vehicle: 'KCB 456B', status: 'IN PROGRESS', scheduled: '08:30 AM', eta: '10:30 AM', progress: 40, color: 'bg-blue-500', text: 'text-blue-500' },
  { id: 'DSP-2024-0154', destination: 'Karen Collection Point', driver: 'James Kimani', vehicle: 'KCC 789C', status: 'PICKING UP', scheduled: '09:00 AM', eta: '09:45 AM', progress: 20, color: 'bg-purple-500', text: 'text-purple-500' },
  { id: 'DSP-2024-0153', destination: 'CBD Business District', driver: 'David Ouma', vehicle: 'KCD 012D', status: 'DELIVERED', scheduled: '07:00 AM', eta: '07:45 AM', progress: 100, color: 'bg-emerald-500', text: 'text-emerald-500' },
  { id: 'DSP-2024-0152', destination: 'Industrial Area', driver: 'Mike Kamau', vehicle: 'KCE 345E', status: 'IN PROGRESS', scheduled: '08:15 AM', eta: '11:00 AM', progress: 55, color: 'bg-blue-500', text: 'text-blue-500' },
  { id: 'DSP-2024-0151', destination: 'Ngong Road Hub', driver: 'Samuel Kiprotich', vehicle: 'KCF 678F', status: 'DELAYED', scheduled: '07:30 AM', eta: '12:30 PM', progress: 30, color: 'bg-rose-500', text: 'text-rose-500' },
  { id: 'DSP-2024-0150', destination: 'Gigiri Residential', driver: 'Wilson Cheruiyot', vehicle: 'KCG 901G', status: 'PENDING', scheduled: '10:00 AM', eta: 'TBD', progress: 0, color: 'bg-slate-500', text: 'text-slate-500' },
  { id: 'DSP-2024-0149', destination: 'Airport Cargo Terminal', driver: 'Francis Wambua', vehicle: 'KCH 234H', status: 'DELIVERED', scheduled: '06:30 AM', eta: '06:50 AM', progress: 100, color: 'bg-emerald-500', text: 'text-emerald-500' },
];

const MOCK_STATUS_DIST = [
  { name: 'In Progress', value: 42, color: '#3b82f6' },
  { name: 'Delivered', value: 78, color: '#10b981' },
  { name: 'Delayed', value: 6, color: '#f43f5e' },
  { name: 'Pending', value: 12, color: '#64748b' },
];

const performanceData = [
  { time: '00:00', total: 10, onTime: 8 }, { time: '04:00', total: 15, onTime: 12 },
  { time: '08:00', total: 45, onTime: 42 }, { time: '12:00', total: 60, onTime: 55 },
  { time: '16:00', total: 55, onTime: 50 }, { time: '20:00', total: 20, onTime: 18 },
  { time: '24:00', total: 12, onTime: 10 }
];

const MOCK_ANALYTICS_BAR = [
  { day: 'Mon', onTime: 40, delayed: 4 },
  { day: 'Tue', onTime: 30, delayed: 2 },
  { day: 'Wed', onTime: 45, delayed: 5 },
  { day: 'Thu', onTime: 50, delayed: 1 },
  { day: 'Fri', onTime: 35, delayed: 3 },
  { day: 'Sat', onTime: 20, delayed: 0 },
  { day: 'Sun', onTime: 15, delayed: 1 },
];

const MOCK_ANALYTICS_HORIZ = [
  { hub: 'Westlands Hub', volume: 120 },
  { hub: 'Industrial Area', volume: 98 },
  { hub: 'Thika Transfer', volume: 85 },
  { hub: 'Karen Point', volume: 45 },
  { hub: 'CBD District', volume: 30 },
];

export default function DispatchQueue() {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dispatches' | 'map' | 'exceptions' | 'completed' | 'analytics'>('dispatches');
  const [searchQuery, setSearchQuery] = useState('');

  // Top KPIs
  const kpis = [
    { label: 'Total Dispatches', value: '126', trend: '+12% vs yesterday', icon: Truck, color: 'text-slate-400', bg: 'bg-slate-500/10' },
    { label: 'In Progress', value: '42', trend: '33% of total', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Completed', value: '78', trend: '+18% vs yesterday', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Weight Dispatched', value: '45.2 t', trend: '+5.4 t vs yesterday', icon: PackageCheck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'On Time %', value: '94.2%', trend: '+2.1% vs yesterday', icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Delayed', value: '6', trend: '4.8% of total', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Dispatch Center</h1>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">Monitor and manage all dispatch operations in real-time</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-[#131722] dark:text-white flex items-center gap-2">
              Today, May 15 <ChevronDown className="w-3 h-3" />
            </button>
            <button className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-[#131722] dark:text-white flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            <button className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2">
              + New Dispatch
            </button>
          </div>
        </div>

        {/* Main Grid: 9 Cols Left (KPIs + Tabs + Content), 3 Cols Right (Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-9 flex flex-col gap-4">
            
            {/* 6 Top KPIs (Moved inside left column) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {kpis.map((kpi, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{kpi.label}</p>
                    <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>
                      <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#131722] dark:text-white leading-none">{kpi.value}</h3>
                    <p className={`text-[10px] font-medium mt-2 ${kpi.color}`}>{kpi.trend}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-[#e0e3eb] dark:border-slate-700/50 overflow-x-auto">
              {[
                { id: 'awaiting', label: 'Awaiting Dispatches' },
                { id: 'active', label: 'Active Deliveries' },
                { id: 'map', label: 'Map View' },
                { id: 'exceptions', label: 'Delayed/Exceptions' },
                { id: 'completed', label: 'Completed' },
                { id: 'analytics', label: 'Analytics' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                      : 'border-transparent text-slate-500 hover:text-[#131722] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content Container */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col min-h-[400px] overflow-hidden">
              
              {/* DISPATCHES / EXCEPTIONS / COMPLETED LIST */}
              {(activeTab === 'awaiting' || activeTab === 'active' || activeTab === 'exceptions' || activeTab === 'completed') && (
                <>
                  <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                      <input 
                        type="text" 
                        placeholder="Search dispatches, drivers, vehicles..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs outline-none focus:border-emerald-500 dark:text-white"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#131722] dark:hover:text-white">
                      <Settings2 className="w-4 h-4" /> Columns
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                        <tr>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Dispatch ID</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Destination</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Driver</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Vehicle</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Scheduled</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">ETA</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                        {MOCK_DISPATCHES
                          .filter(d => {
                            if (activeTab === 'exceptions') return d.status === 'DELAYED';
                            if (activeTab === 'completed') return d.status === 'DELIVERED';
                            if (activeTab === 'active') return d.status === 'IN PROGRESS' || d.status === 'PICKING UP';
                            if (activeTab === 'awaiting') return d.status === 'PENDING';
                            return true;
                          })
                          .map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3 text-xs font-medium text-slate-500">{d.id}</td>
                            <td className="px-5 py-3 text-xs font-bold text-[#131722] dark:text-white">{d.destination}</td>
                            <td className="px-5 py-3 text-xs font-medium text-slate-500">{d.driver}</td>
                            <td className="px-5 py-3 text-xs font-medium text-slate-500">{d.vehicle}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border ${d.color.replace('bg-', 'border-').replace('500', '500/30')} ${d.text} bg-transparent`}>
                                {d.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs font-medium text-slate-500">{d.scheduled}</td>
                            <td className="px-5 py-3 text-xs font-medium text-[#131722] dark:text-white">{d.eta}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-slate-500 w-6">{d.progress}%</span>
                                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className={`h-full ${d.color}`} style={{ width: `${d.progress}%` }}></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-[#e0e3eb] dark:border-slate-700/50 flex justify-between items-center text-xs text-slate-500">
                    <span>Showing 1 to {activeTab === 'exceptions' ? 1 : activeTab === 'completed' ? 2 : 8} of 126 dispatches</span>
                    <div className="flex gap-1">
                      <button className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">&lt;</button>
                      <button className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 font-bold text-[#131722] dark:text-white">1</button>
                      <button className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">2</button>
                      <button className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">3</button>
                      <span>...</span>
                      <button className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">16</button>
                      <button className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">&gt;</button>
                    </div>
                  </div>
                </>
              )}

              {/* MAP VIEW TAB */}
              {activeTab === 'map' && (
                <div className="flex-1 w-full h-[500px] relative">
                  <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false} attributionControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    
                    {/* Routes */}
                    <Polyline positions={[[-1.26, 36.80], [-1.28, 36.82], [-1.29, 36.83]]} color="#3b82f6" weight={3} dashArray="5, 10" />
                    <Polyline positions={[[-1.31, 36.78], [-1.30, 36.81], [-1.29, 36.82]]} color="#10b981" weight={3} />
                    <Polyline positions={[[-1.25, 36.85], [-1.27, 36.83], [-1.29, 36.82]]} color="#f43f5e" weight={3} dashArray="5, 10" />

                    {/* Markers */}
                    <Marker position={[-1.26, 36.80]} icon={createDriverIcon('bg-blue-500')} />
                    <Marker position={[-1.31, 36.78]} icon={createDriverIcon('bg-emerald-500')} />
                    <Marker position={[-1.25, 36.85]} icon={createDriverIcon('bg-rose-500')} />
                    <Marker position={[-1.29, 36.82]} icon={createDriverIcon('bg-amber-500')} />
                  </MapContainer>
                  
                  {/* Map Legend Overlay */}
                  <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl p-3 z-10">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Live Vehicles</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-white"><div className="w-2 h-2 rounded-full bg-blue-500"></div> In Progress</div>
                      <div className="flex items-center gap-2 text-xs text-white"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Completed</div>
                      <div className="flex items-center gap-2 text-xs text-white"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Delayed</div>
                      <div className="flex items-center gap-2 text-xs text-white"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Hub</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ANALYTICS TAB */}
              {activeTab === 'analytics' && (
                <div className="p-6 flex flex-col gap-6 h-full min-h-[500px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col h-[300px]">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Daily Dispatch Volume</h3>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={MOCK_ANALYTICS_BAR}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            <Bar dataKey="onTime" name="On Time" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="delayed" name="Delayed" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col h-[300px]">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Top Destinations (Volume)</h3>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={MOCK_ANALYTICS_HORIZ} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <YAxis dataKey="hub" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                            <Bar dataKey="volume" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dispatch Status Distribution */}
                    <div className="border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5 flex flex-col h-[280px]">
                      <h3 className="text-sm font-bold text-[#131722] dark:text-white mb-2">Dispatch Status Distribution</h3>
                      <div className="flex-1 flex items-center">
                        <div className="w-1/2 h-[180px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={MOCK_STATUS_DIST} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                                {MOCK_STATUS_DIST.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 flex flex-col gap-3 pl-4">
                          {MOCK_STATUS_DIST.map(s => (
                            <div key={s.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-[#131722] dark:text-white">{s.value}</span>
                                <span className="text-[10px] text-slate-400">({Math.round((s.value / 138) * 100)}%)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Performance Trend */}
                    <div className="border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5 flex flex-col h-[280px]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-[#131722] dark:text-white">Performance Trend</h3>
                        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Total Dispatches</span>
                          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> On Time %</span>
                        </div>
                      </div>
                      <div className="flex-1 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} dx={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            <Line yAxisId="left" type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#1e293b', strokeWidth: 2 }} />
                            <Line yAxisId="right" type="monotone" dataKey="onTime" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#1e293b', strokeWidth: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* RIGHT COLUMN */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            
            {/* Recent Alerts */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">Recent Alerts</h3>
                <button className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 hover:underline">View All</button>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-[#131722] dark:text-white">DSP-2024-0151 delayed</p>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">5 min ago</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ngong Road Hub - Traffic congestion</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-[#131722] dark:text-white">Vehicle KCF 678F maintenance due</p>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">15 min ago</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Service overdue by 2 days</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-[#131722] dark:text-white">High volume alert</p>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">30 min ago</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Westlands Hub - 85% capacity</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dispatch Insights */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">Dispatch Insights</h3>
                <Lightbulb className="w-4 h-4 text-amber-500" />
              </div>
              <div className="p-5 space-y-5">
                <div className="flex gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#131722] dark:text-white">Peak efficiency reached</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Dispatch times are 12% faster today compared to the monthly average.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#131722] dark:text-white">Optimal routing active</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">AI-assisted routing has saved approx. 45km of travel distance today.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Dispatch Recommendations */}
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Activity className="w-32 h-32 text-emerald-500" />
              </div>
              <div className="p-5 relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-[#131722] dark:text-white">Smart Recommend</h3>
                  <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold">AI</span>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-emerald-100 dark:border-emerald-500/30 mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Assign to Pending</p>
                      <p className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                        DSP-0150 <ArrowRight className="w-3 h-3 text-slate-400" /> <span className="text-emerald-600 dark:text-emerald-400">Truck KCG 901G</span>
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-emerald-50 dark:bg-slate-900">
                        <span className="text-xs font-bold text-[#131722] dark:text-white">96%</span>
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                      <Check className="w-3 h-3 text-emerald-500" /> Closest available truck (2.1 km)
                    </li>
                    <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                      <Check className="w-3 h-3 text-emerald-500" /> Matches required capacity
                    </li>
                  </ul>
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all uppercase tracking-widest">
                    Auto Assign
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}