import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, ArrowRight, CheckCircle2, Truck, X, 
  PackageCheck, AlertTriangle, ChevronDown, Activity, 
  Lightbulb, AlertCircle, Info, Check, BarChart3, Users, Search
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { FulfillmentOrder } from '@klinflow/core/stores/fulfillmentStore.types';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid, YAxis } from 'recharts';
import 'leaflet/dist/leaflet.css';

const mapCenter: [number, number] = [-1.2921, 36.8219];

const createDriverIcon = (isEnRoute: boolean) => new L.DivIcon({
  className: 'bg-transparent',
  html: `<div class="w-8 h-8 rounded-full ${isEnRoute ? 'bg-amber-500' : 'bg-emerald-500'} flex items-center justify-center text-white shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Dummy performance data
const performanceData = [
  { time: '12 AM', value: 10, value2: 5 }, { time: '3 AM', value: 15, value2: 8 },
  { time: '6 AM', value: 25, value2: 18 }, { time: '9 AM', value: 35, value2: 25 },
  { time: '12 PM', value: 45, value2: 30 }, { time: '3 PM', value: 40, value2: 28 },
  { time: '6 PM', value: 25, value2: 20 }, { time: '9 PM', value: 12, value2: 10 },
  { time: '12 AM', value: 10, value2: 8 }
];

export default function DispatchManagement() {
  const { profile } = useAuthStore();
  const { dispatchQueue, activeFulfillments, fetchDispatchQueue, fetchActiveFulfillments, assignDriver, isLoading } = useFulfillmentStore();
  const { fleetDrivers, fetchFleetDrivers } = useAgentStore();
  const { addNotification } = useNotificationStore();
  
  const [activeTab, setActiveTab] = useState<'awaiting' | 'active' | 'completed' | 'delayed' | 'analytics' | 'map'>('awaiting');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<FulfillmentOrder | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchDispatchQueue(profile.id);
      fetchActiveFulfillments(profile.id, 'company');
      fetchFleetDrivers();
    }
  }, [profile?.id, fetchDispatchQueue, fetchActiveFulfillments, fetchFleetDrivers]);

  const handleOpenAssign = (order: FulfillmentOrder) => {
    setSelectedOrder(order);
    setIsAssignModalOpen(true);
  };

  const handleAssignDriver = async (driverId: string) => {
    if (!selectedOrder || !profile?.id) return;
    setIsAssigning(true);
    try {
      await assignDriver(selectedOrder.id, profile.id, driverId);
      await addNotification('New Pickup Assigned!', 'A new pickup has been dispatched to your active route.', 'warning', 'agent', driverId);
      toast.success('Driver assigned successfully!');
      setIsAssignModalOpen(false);
      fetchDispatchQueue(profile.id);
      fetchActiveFulfillments(profile.id, 'company');
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign driver');
    } finally {
      setIsAssigning(false);
    }
  };

  const onlineDrivers = fleetDrivers.filter(driver => driver.is_online);
  const completedTodayCount = 24; 
  const delayedCount = 2; 
  const totalTons = 18.6; 

  const getPriorityConfig = (order: any) => {
    const w = order.proposal?.offered_weight || 0;
    if (w > 2000) return { label: 'HIGH', color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' };
    if (w > 1000) return { label: 'MEDIUM', color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' };
    return { label: 'NORMAL', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' };
  };

  const currentList = activeTab === 'awaiting' ? dispatchQueue : activeTab === 'active' ? activeFulfillments : [];

  return (
    <div className="flex h-full w-full relative bg-transparent">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-6 animate-fade-in pb-10 space-y-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Dispatch Management</h1>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">Dispatch drivers, monitor active collections, and track fleet logistics in real-time.</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 mt-2">
          
          {/* LEFT COLUMN: KPIs + Tabs + Content */}
          <div className="xl:col-span-8 2xl:col-span-9 flex flex-col gap-4">
            
            {/* 1. KPIs (Moved inside left column) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { label: 'Awaiting Dispatch', value: dispatchQueue.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { label: 'Active Pickups', value: activeFulfillments.length, icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'In Transit', value: onlineDrivers.length, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Delayed', value: delayedCount, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                { label: 'Completed Today', value: completedTodayCount, icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { label: 'Tons Collected', value: `${totalTons} t`, icon: PackageCheck, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex gap-4 items-center transition-all hover:border-emerald-500/30">
                  <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
                      {kpi.label}
                    </p>
                    <h3 className="text-lg font-bold text-[#131722] dark:text-white leading-none mt-1">{kpi.value}</h3>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[#e0e3eb] dark:border-slate-700/50 pb-2 gap-4">
              <div className="flex items-center gap-6 overflow-x-auto w-full sm:w-auto custom-scrollbar">
                {[
                  { id: 'awaiting', label: `Awaiting (${dispatchQueue.length})` },
                  { id: 'active', label: `Active (${activeFulfillments.length})` },
                  { id: 'map', label: 'Map View' },
                  { id: 'completed', label: `Completed (${completedTodayCount})` },
                  { id: 'delayed', label: `Exceptions (${delayedCount})` },
                  { id: 'analytics', label: 'Analytics' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 text-xs font-bold capitalize transition-all border-b-2 whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                        : 'border-transparent text-slate-500 hover:text-[#131722] dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search dispatches..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs outline-none focus:border-emerald-500 dark:text-white"
                />
              </div>
            </div>

            {/* Conditional Content based on Tab */}
            {activeTab === 'analytics' ? (
              
              /* ANALYTICS VIEW */
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-6 flex flex-col min-h-[500px]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-500"/> Dispatch Performance</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Pickups vs Tons Collected (Last 24 Hours)</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><div className="w-3 h-3 rounded bg-emerald-500"></div> Pickups</div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><div className="w-3 h-3 rounded bg-blue-500"></div> Tons Collected</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-[#e0e3eb] dark:border-slate-700/50">
                    <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest leading-tight mb-2">Pickups Completed</p>
                    <div className="flex items-end justify-between">
                      <p className="font-black text-2xl text-[#131722] dark:text-white">24</p>
                      <p className="font-bold text-[10px] text-emerald-500 flex items-center">↑ 18%</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-[#e0e3eb] dark:border-slate-700/50">
                    <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest leading-tight mb-2">Tons Collected</p>
                    <div className="flex items-end justify-between">
                      <p className="font-black text-2xl text-[#131722] dark:text-white">18.6 <span className="text-sm">t</span></p>
                      <p className="font-bold text-[10px] text-emerald-500 flex items-center">↑ 14%</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-[#e0e3eb] dark:border-slate-700/50">
                    <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest leading-tight mb-2">Total Value Moved</p>
                    <div className="flex items-end justify-between">
                      <p className="font-black text-xl text-[#131722] dark:text-white">KES 1.2M</p>
                      <p className="font-bold text-[10px] text-emerald-500 flex items-center">↑ 22%</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-[#e0e3eb] dark:border-slate-700/50">
                    <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest leading-tight mb-2">Avg Dispatch Time</p>
                    <div className="flex items-end justify-between">
                      <p className="font-black text-2xl text-[#131722] dark:text-white">4<span className="text-sm">m</span> 12<span className="text-sm">s</span></p>
                      <p className="font-bold text-[10px] text-emerald-500 flex items-center">↓ 8%</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                      <Area type="monotone" dataKey="value2" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            ) : activeTab === 'map' ? (
              
              /* MAP VIEW */
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden shadow-sm h-[600px] relative">
                <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between z-10 absolute top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500"/> Live Operations Map
                  </h3>
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Pending</span>
                    <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active</span>
                  </div>
                </div>
                
                <div className="flex-1 w-full mt-14 z-0">
                  <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    {onlineDrivers.filter(d => d.location?.latitude).map(driver => (
                      <Marker key={driver.id} position={[driver.location.latitude, driver.location.longitude]} icon={createDriverIcon(true)}>
                        <Popup><span className="font-bold text-xs">{driver.name}</span></Popup>
                      </Marker>
                    ))}
                    {/* Dummy Markers for visual completeness */}
                    {onlineDrivers.length < 3 ? (
                      <LayerGroup>
                        <Marker position={[-1.28, 36.82]} icon={createDriverIcon(true)} />
                        <Marker position={[-1.25, 36.85]} icon={createDriverIcon(true)} />
                        <Marker position={[-1.31, 36.78]} icon={createDriverIcon(false)} />
                      </LayerGroup>
                    ) : null}
                  </MapContainer>
                </div>
              </div>

            ) : (

              /* QUEUE LIST VIEW */
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden shadow-sm h-[600px]">
                <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#131722] dark:text-white capitalize flex items-center gap-2">
                    {activeTab} Pickups
                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px]">{currentList.length}</span>
                  </h3>
                  <button className="text-[10px] font-bold text-slate-500 flex items-center gap-1 hover:text-[#131722] dark:hover:text-white uppercase tracking-widest transition-colors">
                    Sort by: Time <ChevronDown className="w-3 h-3"/>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {isLoading ? (
                    <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
                  ) : currentList.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      <PackageCheck className="w-8 h-8 text-slate-300 mb-3" />
                      <p className="font-bold text-sm text-[#131722] dark:text-white">No items found</p>
                      <p className="text-xs text-slate-500 mt-1">Your {activeTab} queue is empty.</p>
                    </div>
                  ) : (
                    currentList.map(order => {
                      const pConf = getPriorityConfig(order);
                      return (
                        <div key={order.id} className="flex flex-col p-4 rounded-xl border border-[#e0e3eb] dark:border-slate-700/50 hover:border-emerald-500/50 transition-all bg-slate-50/50 dark:bg-slate-900/20 group gap-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                                {activeTab === 'awaiting' ? <PackageCheck className="w-5 h-5 text-amber-500" /> : <Truck className="w-5 h-5 text-emerald-500" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase ${pConf.color}`}>{pConf.label}</span>
                                  <span className="font-bold text-xs text-[#131722] dark:text-white">RFQ-{order.id.substring(0, 4).toUpperCase()}</span>
                                </div>
                                <p className="font-bold text-[11px] text-slate-600 dark:text-slate-300 capitalize">{order.rfq?.category || 'Material'} • <span className="text-emerald-600 dark:text-emerald-400">{order.proposal?.offered_weight || 0} kg</span></p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">Value</p>
                              <p className="font-black text-sm text-[#131722] dark:text-white">KSh {((order.proposal?.offered_weight || 0) * (order.proposal?.offered_price || 0)).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-[#e0e3eb] dark:border-slate-700/50">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-bold text-rose-500 dark:text-rose-400">{Math.floor(Math.random() * 5) + 2}h {Math.floor(Math.random() * 59)}m left</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{order.pickup_address || order.rfq?.pickup_area || 'Hub Location'}</span>
                              </div>
                            </div>
                            
                            {activeTab === 'awaiting' ? (
                              <button 
                                onClick={() => handleOpenAssign(order)} 
                                className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 hover:dark:bg-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                              >
                                Assign Driver
                              </button>
                            ) : (
                              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                                En Route
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            
          </div>

          {/* RIGHT COLUMN: AI Recommendations & Alerts */}
          <div className="xl:col-span-4 2xl:col-span-3 flex flex-col gap-1">
            {/* Dispatch Insights & Alerts */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500"/> Operational Alerts
                </h3>
                <button className="text-[10px] font-bold text-emerald-600 hover:underline uppercase tracking-widest flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3"/>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <div>
                    <p className="font-bold text-xs text-[#131722] dark:text-white">2 pickups at risk of delay</p>
                    <p className="font-medium text-[10px] text-slate-500 mt-0.5 mb-2">Drivers are currently stuck in heavy traffic.</p>
                    <button className="text-[10px] font-bold text-rose-600 uppercase tracking-widest hover:underline">View details</button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 flex gap-3">
                  <Info className="w-5 h-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="font-bold text-xs text-[#131722] dark:text-white">Westlands Hub demand surge</p>
                    <p className="font-medium text-[10px] text-slate-500 mt-0.5">High volume of pickups requested in the last hour.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 flex gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="font-bold text-xs text-[#131722] dark:text-white">Traffic on Thika Road</p>
                    <p className="font-medium text-[10px] text-slate-500 mt-0.5">Expect delays of ~15 mins for outbound fleet.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Dispatch Recommendation Card */}
            <div className="bg-[#131722] dark:bg-slate-900 border border-slate-800 dark:border-slate-800 rounded-xl p-6 flex flex-col relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Activity className="w-32 h-32 text-emerald-500" />
              </div>
              
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-emerald-400"/> 
                </div>
                <h3 className="text-sm font-bold text-white">AI Dispatch <br/>Recommendation</h3>
                <span className="ml-auto bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-emerald-500/30">BETA</span>
              </div>

              <div className="flex-1 relative z-10 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Optimal Assignment</p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">RFQ-5821</span>
                      <ArrowRight className="w-4 h-4 text-slate-500"/>
                      <span className="font-black text-sm text-emerald-400">Truck KDG 218A</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confidence</p>
                    <div className="inline-flex items-center justify-center px-2 py-1 bg-emerald-500/20 rounded border border-emerald-500/30">
                      <span className="font-black text-sm text-emerald-400">94%</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Algorithm Reasoning</p>
                <ul className="space-y-2">
                  {[
                    'Closest available truck (4.2 km away)',
                    'Capacity sufficient for 3.2 tons',
                    'Estimated arrival in 12 mins',
                    'Driver performance: Excellent'
                  ].map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0"/> {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 relative z-10">
                <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl transition-all">
                  View Details
                </button>
                <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2">
                  Auto Assign
                </button>
              </div>
            </div>
        
          </div>
        </div>
      </div>

      {/* ASSIGNMENT MODAL */}
      <AnimatePresence>
        {isAssignModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAssignModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              
              <div className="p-6 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-start justify-between bg-slate-50 dark:bg-slate-900/50">
                <div>
                  <h2 className="text-lg font-black text-[#131722] dark:text-white">Assign Driver</h2>
                  <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mt-1">Order RFQ-{selectedOrder.id.substring(0, 4).toUpperCase()} • {selectedOrder.pickup_address || 'Hub'}</p>
                </div>
                <button onClick={() => setIsAssignModalOpen(false)} className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors shadow-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3 custom-scrollbar">
                {onlineDrivers.length === 0 ? (
                  <div className="p-10 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Truck className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-bold text-sm text-[#131722] dark:text-white">No drivers online</p>
                    <p className="text-xs text-slate-500 mt-1">Your fleet drivers must go online in their app.</p>
                  </div>
                ) : (
                  onlineDrivers.map(driver => (
                    <div key={driver.id} className="w-full bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between hover:border-emerald-500 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 font-bold text-lg border border-emerald-100 dark:border-emerald-500/20">
                            {driver.name.charAt(0)}
                          </div>
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#131722] dark:text-white">{driver.name}</p>
                          <div className="flex gap-3 mt-1 text-[10px] font-bold text-slate-500">
                            <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-emerald-500"/> Truck • 1.5T</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-500"/> 4.2 km away</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAssignDriver(driver.id)} 
                        disabled={isAssigning} 
                        className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-widest rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAssigning ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}