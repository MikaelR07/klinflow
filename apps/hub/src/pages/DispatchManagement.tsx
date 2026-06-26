import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ArrowRight, CheckCircle2, Truck, X, PackageCheck, AlertTriangle, ChevronDown, Activity, Lightbulb, AlertCircle, Info, Check } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { FulfillmentOrder } from '@klinflow/core/stores/fulfillmentStore.types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import 'leaflet/dist/leaflet.css';

const mapCenter: [number, number] = [-1.2921, 36.8219];

const createDriverIcon = (isEnRoute: boolean) => new L.DivIcon({
  className: 'bg-transparent',
  html: `<div class="w-8 h-8 rounded-full ${isEnRoute ? 'bg-amber-500' : 'bg-emerald-500'} flex items-center justify-center text-white shadow-none border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Dummy performance data for sparkline
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
  
  const [activeTab, setActiveTab] = useState<'awaiting' | 'active' | 'completed' | 'delayed'>('awaiting');
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
    if (w > 2000) return { label: 'HIGH', color: 'bg-rose-500/10 text-rose-500' };
    if (w > 1000) return { label: 'MEDIUM', color: 'bg-amber-500/10 text-amber-500' };
    return { label: 'NORMAL', color: 'bg-white/10 text-slate-500 dark:bg-slate-400/10 dark:text-slate-400' };
  };

  const currentList = activeTab === 'awaiting' ? dispatchQueue : activeTab === 'active' ? activeFulfillments : [];

  return (
    <div className="flex h-full w-full relative bg-transparent">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fade-in pb-10 space-y-5">
        <div className="max-w-[1600px] mx-auto space-y-6">
      {/* ── DESCRIPTION ── */}
      <div className="mb-4">
        <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mt-2">Dispatch drivers, monitor active pickups, and track fulfillment in real-time.</p>
      </div>{/* ── MAIN CONTENT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-2">
        
        {/* LEFT COLUMN (lg:col-span-9): Queue, Map, Active Cards */}
        <div className="lg:col-span-9 flex flex-col gap-4">
           

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Awaiting Dispatch', value: dispatchQueue.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: '14%' },
          { label: 'Active Pickups', value: activeFulfillments.length, icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '18%' },
          { label: 'In Transit', value: onlineDrivers.length, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: '22%' },
          { label: 'Delayed', value: delayedCount, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10', trend: '100%', trendColor: 'text-rose-500' },
          { label: 'Completed Today', value: completedTodayCount, icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: '16%' },
          { label: 'Tons Collected', value: `${totalTons} t`, icon: PackageCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '14%' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg p-3 shadow-none flex flex-col justify-between group hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="font-bold text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <div className="flex items-end justify-between mt-1">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{kpi.value}</h3>
                <span className={`text-[10px] ${kpi.trendColor || 'text-emerald-500'} flex items-center`}>↗ {kpi.trend} vs yesterday</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      
           {/* ── TABS ── */}
      <div className="flex items-center gap-6 border-b border-[#e0e3eb] dark:border-slate-800 overflow-x-auto">
        {[
          { id: 'awaiting', label: `Awaiting Dispatch (${dispatchQueue.length})` },
          { id: 'active', label: `Active Pickups (${activeFulfillments.length})` },
          { id: 'completed', label: `Completed Today (${completedTodayCount})` },
          { id: 'delayed', label: `Delayed / Exceptions (${delayedCount})` }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 text-xs font-bold capitalize transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-[#131722] dark:hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      
           
           {/* Top Row of Left Column: Queue & Map side-by-side */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[500px]">
              <div className="lg:col-span-6 h-full">
                 {/* LEFT: QUEUE LIST */}
        <div className=" flex flex-col bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg shadow-none overflow-hidden h-full">
          <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800/20">
            <h3 className="text-sm font-bold text-[#131722] dark:text-white">{activeTab === 'awaiting' ? 'Dispatch Queue' : 'Active List'} <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded-full text-[10px] ml-1">{currentList.length}</span></h3>
            <button className="font-medium text-[10px] text-slate-500 flex items-center gap-1 hover:text-[#131722] dark:hover:text-white uppercase tracking-widest">Sort by: Deadline <ChevronDown className="font-medium w-3 h-3"/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {isLoading ? (
               <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : currentList.length === 0 ? (
               <div className="font-medium py-20 text-center text-slate-400 text-sm">No items found</div>
            ) : (
               currentList.map(order => {
                 const pConf = getPriorityConfig(order);
                 return (
                   <div key={order.id} className="flex items-center justify-between p-3 rounded-xl border border-[#e0e3eb] dark:border-slate-800 hover:border-emerald-500/30 transition-all bg-white dark:bg-slate-800 group">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 flex items-center justify-center shrink-0">
                         {activeTab === 'awaiting' ? <PackageCheck className="font-medium w-5 h-5 text-amber-500" /> : <Truck className="font-medium w-5 h-5 text-emerald-500" />}
                       </div>
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <span className={`px-1.5 py-0.5 rounded text-[8px] ${pConf.color}`}>{pConf.label}</span>
                           <span className="font-medium text-xs text-[#131722] dark:text-white">RFQ-{order.id.substring(0, 4).toUpperCase()}</span>
                         </div>
                         <p className="font-medium text-[11px] text-slate-600 dark:text-slate-300 capitalize">{order.rfq?.category || 'Material'} <span className="font-medium text-slate-400">({order.proposal?.offered_weight || 0} kg)</span></p>
                       </div>
                     </div>
                     <div className="hidden sm:block text-left">
                       <p className="font-medium text-[10px] text-slate-400">Deadline / Location</p>
                       <p className="font-medium text-xs text-rose-500 dark:text-rose-400 truncate max-w-[100px] mb-0.5">{Math.floor(Math.random() * 5) + 2}h {Math.floor(Math.random() * 59)}m</p>
                       <p className="font-medium text-[10px] text-slate-500 truncate max-w-[100px]">{order.pickup_address || order.rfq?.pickup_area || 'Hub'}</p>
                     </div>
                     <div className="hidden sm:block text-left pr-2">
                       <p className="font-medium text-[10px] text-slate-400">Value</p>
                       <p className="font-medium text-xs text-[#131722] dark:text-white">KSh {((order.proposal?.offered_weight || 0) * (order.proposal?.offered_price || 0)).toLocaleString()}</p>
                     </div>
                     <div>
                       {activeTab === 'awaiting' ? (
                         <button onClick={() => handleOpenAssign(order)} className="font-medium px-4 py-2 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] uppercase tracking-widest transition-all">
                           Assign
                         </button>
                       ) : (
                         <span className="font-medium px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] uppercase whitespace-nowrap">En Route</span>
                        )}
                     </div>
                   </div>
                 );
               })
            )}
          </div>
          <div className="p-3 border-t border-[#e0e3eb] dark:border-slate-800 text-center">
             <button className="font-medium text-[10px] text-emerald-600 hover:underline uppercase tracking-widest">View all {activeTab} →</button>
          </div>
        </div>
              </div>
              <div className="lg:col-span-6 h-full">
                 {/* RIGHT: MAP & ACTIVE CARDS */}
        <div className=" flex flex-col gap-2 h-full">
          
          {/* MAP */}
          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg shadow-none overflow-hidden flex-1 relative flex flex-col min-h-[350px]">
            <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-800/60 flex items-center justify-between z-10 absolute top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
              <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500"/> Live Operations Map</h3>
              <div className="font-bold flex gap-4 text-[10px] text-slate-600 capitalize tracking-widest">
                 <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Awaiting</span>
                 <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active</span>
                 <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Transit</span>
              </div>
            </div>
            
            <div className="flex-1 w-full mt-14 z-0">
              <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                {onlineDrivers.filter(d => d.location?.latitude).map(driver => (
                  <Marker key={driver.id} position={[driver.location.latitude, driver.location.longitude]} icon={createDriverIcon(true)}>
                    <Popup><span className="">{driver.name}</span></Popup>
                  </Marker>
                ))}
                {/* Dummy Markers for visual completeness matching the mockup map density */}
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

          {/* ACTIVE CARDS (Reduced Size) */}
          <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar shrink-0">
              {/* Show dummy ones if zero for visual mockup fidelity */}
              {(onlineDrivers.length > 0 ? onlineDrivers : [
                 { id: '1', name: 'James Mwangi', location: { estate: 'Westlands Hub' } },
                 { id: '2', name: 'Peter Ochieng', location: { estate: 'Kasarani Hub' } },
                 { id: '3', name: 'John Kamau', location: { estate: 'Dandora Center' } },
              ]).map((d: any, i) => (
                <div key={d.id} className="w-[240px] bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-xl p-3 flex flex-col shrink-0 shadow-none">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                         <Truck className="font-medium w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-medium text-xs text-[#131722] dark:text-white">Truck {d.name.substring(0,3).toUpperCase()} {Math.floor(Math.random() * 900) + 100}T</p>
                        <p className="font-medium text-[10px] text-slate-500">{d.name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto pt-2 border-t border-[#e0e3eb] dark:border-slate-800">
                     <div className="font-medium flex justify-between text-[10px] mb-1.5">
                        <span className="font-medium text-slate-500 flex items-center gap-1"><MapPin className="font-medium w-3 h-3 text-amber-500"/> {d.location?.estate || 'Industrial Area'}</span>
                        <span className="font-medium text-emerald-500">ETA {Math.floor(Math.random() * 20) + 5}m</span>
                     </div>
                     <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.floor(Math.random() * 40) + 30}%` }}></div>
                     </div>
                  </div>
                </div>
              ))}
          </div>

        </div>
              </div>
           </div>
           
        </div>

        {/* RIGHT COLUMN (lg:col-span-3): The 3 Insight Cards Vertical */}
        <div className="lg:col-span-3 flex flex-col gap-4">
           {/* Card 1: Today's Performance */}
         <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg shadow-none p-3.5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-500"/> Today's Performance</h3>
               <button className="font-bold text-[10px] text-emerald-600 hover:underline capitalize tracking-widest flex items-center gap-1">View report <ArrowRight className="font-medium w-3 h-3"/></button>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mb-4">
               <div className="text-center">
                  <p className="font-bold text-sm text-[#131722] dark:text-white">24</p>
                  <p className="font-bold text-[9px] text-slate-500 capitalize tracking-widest leading-tight">Pickups<br/>Completed</p>
                  <p className="font-medium text-[10px] text-emerald-500 mt-1">↑ 18%</p>
               </div>
               <div className="text-center border-l border-[#e0e3eb] dark:border-slate-800">
                  <p className="font-bold text-sm text-[#131722] dark:text-white">18.6 t</p>
                  <p className="font-bold text-[9px] text-slate-500 capitalize tracking-widest leading-tight">Tons<br/>Collected</p>
                  <p className="font-medium text-[10px] text-emerald-500 mt-1">↑ 14%</p>
               </div>
               <div className="text-center border-l border-[#e0e3eb] dark:border-slate-800">
                  <p className="font-bold text-sm text-[#131722] dark:text-white">KES 1.2M</p>
                  <p className="font-bold text-[9px] text-slate-500 capitalize tracking-widest leading-tight">Total Value<br/>Moved</p>
                  <p className="font-medium text-[10px] text-emerald-500 mt-1">↑ 22%</p>
               </div>
               <div className="text-center border-l border-[#e0e3eb] dark:border-slate-800">
                  <p className="font-bold text-sm text-[#131722] dark:text-white">4m 12s</p>
                  <p className="font-bold text-[9px] text-slate-500 capitalize tracking-widest leading-tight">Avg Dispatch<br/>Time</p>
                  <p className="font-medium text-[10px] text-emerald-500 mt-1">↓ 8%</p>
               </div>
            </div>

            <div className="flex-1 min-h-[100px] mt-2">
               <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                 <AreaChart data={performanceData}>
                   <defs>
                     <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                       <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="time" hide />
                   <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: '#1e293b', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                   <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                   <Area type="monotone" dataKey="value2" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue2)" />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
            <div className="font-medium flex items-center gap-4 text-[10px] text-slate-500 mt-2">
               <span className="flex items-center gap-1.5"><div className="w-2 h-1 rounded-full bg-emerald-500"></div> Pickups</span>
               <span className="flex items-center gap-1.5"><div className="w-2 h-1 rounded-full bg-blue-500"></div> Tons Collected (t)</span>
            </div>
         </div>
           {/* Card 2: Dispatch Insights */}
         <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg shadow-none p-3.5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500"/> Dispatch Insights</h3>
               <button className="font-medium text-[10px] text-emerald-600 hover:underline uppercase tracking-widest flex items-center gap-1">View all <ArrowRight className="font-medium w-3 h-3"/></button>
            </div>
            
            <div className="space-y-5 flex-1">
               <div className="flex items-start gap-3">
                  <AlertCircle className="font-medium w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                     <div className="flex items-center justify-between">
                        <p className="font-medium text-xs text-[#131722] dark:text-white">2 pickups are at risk of delay</p>
                        <button className="font-medium text-[10px] text-rose-500 hover:underline">View details</button>
                     </div>
                  </div>
               </div>
               <div className="flex items-start gap-3">
                  <Info className="font-medium w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                     <div className="flex items-center justify-between">
                        <p className="font-medium text-xs text-[#131722] dark:text-white">Westlands Hub has the most pending pickups</p>
                        <span className="font-medium text-[10px] text-slate-500">6 pending</span>
                     </div>
                  </div>
               </div>
               <div className="flex items-start gap-3">
                  <Truck className="font-medium w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                     <p className="font-medium text-xs text-[#131722] dark:text-white mb-0.5">Traffic is heavy on Thika Road</p>
                     <p className="font-medium text-[10px] text-amber-500">Expect delays of ~15 mins</p>
                  </div>
               </div>
            </div>
         </div>
           {/* Card 3: AI Dispatch Recommendation */}
         <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg shadow-none p-3.5 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
               <Activity className="font-medium w-24 h-24 text-emerald-500" />
            </div>
            <div className="flex items-center gap-2 mb-6">
               <Activity className="font-medium w-4 h-4 text-emerald-600 dark:text-emerald-400"/> 
               <h3 className="text-sm font-bold text-[#131722] dark:text-white">AI Dispatch Recommendation</h3>
               <span className="font-medium bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest">BETA</span>
            </div>

            <div className="flex-1">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <p className="font-medium text-[10px] text-slate-500 uppercase tracking-widest mb-1">Recommended Assignment</p>
                   <p className="font-medium text-base text-[#131722] dark:text-white flex items-center gap-2">
                     RFQ-5821 <ArrowRight className="font-medium w-4 h-4 text-slate-400"/> <span className="font-medium text-emerald-600 dark:text-emerald-400">Truck KDG 218A</span>
                   </p>
                 </div>
                 <div className="text-center">
                   <p className="font-medium text-[9px] text-slate-500 uppercase tracking-widest mb-1">Confidence</p>
                   <div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-white dark:bg-slate-800">
                     <span className="font-medium text-xs text-[#131722] dark:text-white">94%</span>
                   </div>
                 </div>
               </div>

               <p className="font-medium text-[11px] text-slate-600 dark:text-slate-300 mb-2">Why this assignment?</p>
               <ul className="space-y-2 mb-6">
                 {[
                   'Closest available truck (4.2 km away)',
                   'Capacity sufficient for 3.2 tons',
                   'Estimated arrival in 12 mins',
                   'Driver performance: Excellent'
                 ].map((reason, idx) => (
                   <li key={idx} className="font-medium flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                     <Check className="font-medium w-3.5 h-3.5 text-emerald-500 shrink-0"/> {reason}
                   </li>
                 ))}
               </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto">
               <button className="font-medium bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 hover:border-emerald-500 text-[#131722] dark:text-white text-xs py-2.5 rounded-xl transition-all shadow-none">
                 View Details
               </button>
               <button className="font-medium bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2.5 rounded-xl transition-all shadow-none">
                 Auto Assign
               </button>
            </div>
         </div>
        </div>
        
      </div>

      {/* ASSIGNMENT MODAL */}
      <AnimatePresence>
        {isAssignModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAssignModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 100, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between p-6 pb-4 border-b border-[#e0e3eb] dark:border-slate-800 shrink-0">
                <div>
                  <h2 className="text-sm font-bold text-[#131722] dark:text-white">Assign Driver</h2>
                  <p className="font-medium text-xs text-slate-500">Select an available driver for this pickup</p>
                </div>
                <button onClick={() => setIsAssignModalOpen(false)} className="font-medium w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"><X className="font-medium w-5 h-5" /></button>
              </div>
              <div className="p-4 overflow-y-auto space-y-3">
                {onlineDrivers.length === 0 ? (
                  <div className="font-medium p-6 text-center text-slate-500"><Truck className="font-medium w-8 h-8 mx-auto mb-2 opacity-50" /><p className="font-medium text-sm">No drivers online</p><p className="font-medium text-xs">Your fleet drivers must go online in their app.</p></div>
                ) : (
                  onlineDrivers.map(driver => (
                    <button key={driver.id} onClick={() => handleAssignDriver(driver.id)} disabled={isAssigning} className="w-full bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <div className="font-medium w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center relative"><Truck className="font-medium w-5 h-5 text-emerald-600 dark:text-emerald-400" /><div className="font-medium absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" /></div>
                        <div><p className="font-medium text-[#131722] dark:text-white">{driver.name}</p><p className="font-medium text-[10px] uppercase tracking-widest text-emerald-500">Available • Fleet Driver</p></div>
                      </div>
                      <ArrowRight className="font-medium w-5 h-5 text-slate-400" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </div>
  );
}