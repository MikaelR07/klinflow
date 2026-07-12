import { useState } from 'react';
import { 
  Search, Filter, Download, Activity, AlertTriangle, 
  CheckCircle2, Box, Truck, Map as MapIcon, RefreshCw, 
  Settings2, MoreHorizontal,ArrowRight,FileText, Navigation2, AlignLeft
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- MOCK DATA ---
const MOCK_TRANSFERS = [
  { id: 'TO-5042', origin: 'Nairobi Hub', destination: 'Nakuru Hub', material: 'PET Bottles', volume: 12.5, status: 'In Transit', progress: 65, eta: 'Today, 14:30', color: 'text-blue-500', bg: 'bg-blue-500', alert: false },
  { id: 'TO-5043', origin: 'Kisumu Hub', destination: 'Eldoret Hub', material: 'HDPE Rigid', volume: 8.2, status: 'Delayed', progress: 30, eta: 'Tomorrow, 09:00', color: 'text-rose-500', bg: 'bg-rose-500', alert: true },
  { id: 'TO-5044', origin: 'Nakuru Hub', destination: 'Nairobi Hub', material: 'Mixed Paper', volume: 15.0, status: 'Loading', progress: 10, eta: 'Today, 18:00', color: 'text-amber-500', bg: 'bg-amber-500', alert: false },
  
  { id: 'TO-5045', origin: 'Eldoret Hub', destination: 'Kisumu Hub', material: 'LDPE Film', volume: 5.5, status: 'Pending Approval', progress: 0, eta: '-', color: 'text-slate-500', bg: 'bg-slate-500', alert: false },
  { id: 'TO-5046', origin: 'Nairobi Hub', destination: 'Eldoret Hub', material: 'Cardboard', volume: 22.0, status: 'Pending Approval', progress: 0, eta: '-', color: 'text-slate-500', bg: 'bg-slate-500', alert: false },
  
  { id: 'TO-5038', origin: 'Kisumu Hub', destination: 'Nakuru Hub', material: 'PP Rigid', volume: 9.0, status: 'Completed', progress: 100, eta: 'Yesterday', color: 'text-emerald-500', bg: 'bg-emerald-500', alert: false },
  { id: 'TO-5039', origin: 'Nairobi Hub', destination: 'Kisumu Hub', material: 'PET Flakes', volume: 18.5, status: 'Completed', progress: 100, eta: 'Yesterday', color: 'text-emerald-500', bg: 'bg-emerald-500', alert: false },
];

const HUB_COORDS = {
  nairobi: [-1.2921, 36.8219] as [number, number],
  eldoret: [0.5143, 35.2698] as [number, number],
  kisumu: [-0.0917, 34.7680] as [number, number],
  nakuru: [-0.3031, 36.0800] as [number, number],
};

const createHubIcon = (colorClass: string) => L.divIcon({
  className: 'custom-hub-icon',
  html: `<div class="w-4 h-4 rounded-full ${colorClass} border-2 border-white dark:border-slate-800 shadow-lg"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function TransferOrders() {
  const { isDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'completed' | 'map'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Top KPIs
  const kpis = [
    { label: 'Active Transfers', value: '8', trend: 'In Transit', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Pending Approvals', value: '4', trend: 'Requires Action', icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Volume Transferred', value: '142.5 t', trend: 'This Week', icon: Box, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Exceptions', value: '1', trend: 'Delayed / Route Issue', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Transfer Orders</h1>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">Manage internal inventory balancing and hub-to-hub logistics.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-[#131722] dark:text-white flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            <button className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2">
              + New Transfer
            </button>
          </div>
        </div>

        {/* 4 Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex gap-4 items-center">
              <div className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
                  {kpi.label}
                </p>
                <h3 className="text-xl font-bold text-[#131722] dark:text-white leading-none mt-1">{kpi.value}</h3>
                <p className="text-[9px] font-medium mt-1.5 text-slate-500">
                  {kpi.trend}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid: 9 Cols Left (Tabs + Content), 3 Cols Right (Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-9 flex flex-col gap-4">
            
            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-[#e0e3eb] dark:border-slate-700/50 overflow-x-auto">
              {[
                { id: 'active', label: 'Active Transfers' },
                { id: 'pending', label: 'Pending Approval' },
                { id: 'map', label: 'Network Map' },
                { id: 'completed', label: 'Completed' }
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
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col min-h-[500px] overflow-hidden">
              
              {/* TABLE VIEWS (ACTIVE / PENDING / COMPLETED) */}
              {(activeTab === 'active' || activeTab === 'pending' || activeTab === 'completed') && (
                <>
                  <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                      <input 
                        type="text" 
                        placeholder="Search transfers, hubs, materials..." 
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
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                        <tr>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Transfer ID</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Route</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Material</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Volume (t)</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">ETA</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                        {MOCK_TRANSFERS
                          .filter(t => {
                            if (activeTab === 'active') return t.status === 'In Transit' || t.status === 'Loading' || t.status === 'Delayed';
                            if (activeTab === 'pending') return t.status === 'Pending Approval';
                            if (activeTab === 'completed') return t.status === 'Completed';
                            return true;
                          })
                          .map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-4 text-xs font-bold text-[#131722] dark:text-white">{t.id}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-500">{t.origin}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span className="text-xs font-bold text-[#131722] dark:text-white">{t.destination}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-xs font-medium text-slate-500">{t.material}</td>
                            <td className="px-5 py-4 text-xs font-bold text-[#131722] dark:text-white text-right">{t.volume.toFixed(1)}</td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1.5">
                                <span className={`w-fit px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border ${
                                  t.alert ? 'border-rose-500/30 text-rose-600 dark:text-rose-400' :
                                  t.status === 'Pending Approval' ? 'border-amber-500/30 text-amber-600 dark:text-amber-400' :
                                  t.status === 'Completed' ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
                                  'border-blue-500/30 text-blue-600 dark:text-blue-400'
                                } bg-transparent`}>
                                  {t.status}
                                </span>
                                {activeTab === 'active' && (
                                  <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full ${t.bg} transition-all`} style={{ width: `${t.progress}%` }} />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-xs font-medium text-slate-500">{t.eta}</td>
                            <td className="px-5 py-4 text-right">
                              {activeTab === 'pending' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-500 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors">
                                    Deny
                                  </button>
                                  <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors">
                                    Approve
                                  </button>
                                </div>
                              ) : (
                                <button className="text-slate-400 hover:text-emerald-500 transition-colors">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-[#e0e3eb] dark:border-slate-700/50 flex justify-between items-center text-xs text-slate-500">
                    <span>Showing filtered transfer orders</span>
                  </div>
                </>
              )}

              {/* MAP VIEW TAB */}
              {activeTab === 'map' && (
                <div className="flex-1 w-full h-[500px] relative">
                  <MapContainer center={[-0.1, 35.5]} zoom={7} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false} attributionControl={false}>
                    <TileLayer url={`https://{s}.basemaps.cartocdn.com/${isDarkMode ? 'light_all' : 'light_all'}/{z}/{x}/{y}{r}.png`} />
                    
                    {/* Routes */}
                    <Polyline positions={[HUB_COORDS.nairobi, HUB_COORDS.nakuru]} color="#3b82f6" weight={3} dashArray="5, 10" />
                    <Polyline positions={[HUB_COORDS.kisumu, HUB_COORDS.eldoret]} color="#f43f5e" weight={3} dashArray="5, 10" />
                    <Polyline positions={[HUB_COORDS.nakuru, HUB_COORDS.nairobi]} color="#f59e0b" weight={3} dashArray="5, 10" />

                    {/* Markers */}
                    <Marker position={HUB_COORDS.nairobi} icon={createHubIcon('bg-emerald-500')} />
                    <Marker position={HUB_COORDS.nakuru} icon={createHubIcon('bg-emerald-500')} />
                    <Marker position={HUB_COORDS.kisumu} icon={createHubIcon('bg-emerald-500')} />
                    <Marker position={HUB_COORDS.eldoret} icon={createHubIcon('bg-emerald-500')} />
                  </MapContainer>
                  
                  {/* Map Legend Overlay */}
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-[#e0e3eb] dark:border-slate-700 rounded-xl p-3 z-10">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Network Hubs</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-[#131722] dark:text-white"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Hub Location</div>
                      <div className="flex items-center gap-2 text-xs text-[#131722] dark:text-white"><div className="w-4 h-0 border-t-2 border-blue-500 border-dashed"></div> Active Transfer</div>
                      <div className="flex items-center gap-2 text-xs text-[#131722] dark:text-white"><div className="w-4 h-0 border-t-2 border-rose-500 border-dashed"></div> Delayed Transfer</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* RIGHT COLUMN */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            
            {/* AI Insights - Smart Balancing */}
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <RefreshCw className="w-32 h-32 text-emerald-500" />
              </div>
              <div className="p-4 border-b border-emerald-100 dark:border-emerald-500/20 flex items-center justify-between bg-emerald-100/30 dark:bg-emerald-900/20 relative z-10">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Smart Balancing
                </h3>
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold">AI</span>
              </div>
              <div className="p-5 space-y-4 relative z-10">
                <div className="flex gap-3 items-start bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/30">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <Navigation2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    <span className="font-bold">Nairobi Hub</span> is at 92% capacity for HDPE. Recommend transferring 20t to Nakuru Hub which has surplus capacity.
                  </p>
                </div>
                
                <div className="flex gap-3 items-start bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-amber-100 dark:border-amber-500/30">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    <span className="font-bold">Kisumu Hub</span> processing queue for PET is empty. Consider accelerating inbound transfers to avoid downtime.
                  </p>
                </div>
                
                <button className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:underline mt-2">
                  View all recommendations
                </button>
              </div>
            </div>

            {/* Audit Log */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl flex flex-col flex-1 overflow-hidden min-h-[300px]">
              <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-slate-400" /> Activity Log
                </h3>
              </div>
              <div className="p-5 relative">
                <div className="absolute top-5 bottom-5 left-[27px] w-px bg-[#e0e3eb] dark:bg-slate-700"></div>
                <div className="space-y-6 relative z-10">
                  
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-slate-800 mt-1 shrink-0 z-10 relative"></div>
                    <div>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">TO-5042 Dispatched</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Left Nairobi Hub en route to Nakuru.</p>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 block">15 mins ago</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-800 mt-1 shrink-0 z-10 relative"></div>
                    <div>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">TO-5046 Approved</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Manager approved transfer to Eldoret.</p>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 block">1 hour ago</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full bg-rose-500 border-4 border-white dark:border-slate-800 mt-1 shrink-0 z-10 relative"></div>
                    <div>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">TO-5043 Delay Reported</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Vehicle breakdown reported near Kakamega.</p>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 block">2 hours ago</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 border-4 border-white dark:border-slate-800 mt-1 shrink-0 z-10 relative"></div>
                    <div>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">Transfer Requested</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Eldoret requested 5.5t of LDPE from Kisumu.</p>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 block">4 hours ago</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
