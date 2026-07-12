import { useState, useMemo } from 'react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { OptimizedImage } from '@klinflow/ui';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import {
  Map as MapIcon, Rocket as RouteIcon, Zap, MapPin, Search, ChevronRight,
  TrendingDown, CheckCircle2, Navigation, AlertCircle, GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createStopIcon = (status: string, index: number) => {
  const bgColor = status === 'completed' ? 'bg-slate-300 text-slate-500' :
                  status === 'in-progress' ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30' :
                  'bg-white text-indigo-500 border-2 border-indigo-500';
  return new L.DivIcon({
    className: 'bg-transparent',
    html: `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${bgColor}"><span class="font-bold text-xs">${index}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const createAgentIcon = (initial: string) => {
  return new L.DivIcon({
    className: 'bg-transparent',
    html: `<div class="w-10 h-10 rounded-full flex items-center justify-center shadow-xl border-2 border-indigo-500 bg-slate-200 font-bold text-xs text-slate-500">${initial}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

// --- Deterministic Mock Generators ---
const getStableHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const MOCK_LOCATIONS = [
  'Westlands Hub', 'Kilimani Center', 'Lavington Point', 'Kileleshwa Stage',
  'Ngong Road', 'Upper Hill', 'CBD Core', 'Industrial Area', 'South B', 'Langata',
  'Karen Junction', 'Muthaiga', 'Parklands', 'Gigiri', 'Runda'
];

export default function RouteOptimizer() {
  const fleetDrivers = useAgentStore(s => s.fleetDrivers);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Generate Mock Routes
  const agentRoutes = useMemo(() => {
    return fleetDrivers.filter(d => d.is_online).map((driver, index) => {
      const hash = getStableHash(driver.id || String(index));
      const stopCount = (hash % 6) + 3; // 3 to 8 stops
      const completedStops = hash % (stopCount + 1);
      
      const stops = Array.from({ length: stopCount }).map((_, i) => {
        const stopHash = getStableHash(`${driver.id}-stop-${i}`);
        return {
          id: `stop-${stopHash}`,
          address: MOCK_LOCATIONS[stopHash % MOCK_LOCATIONS.length],
          status: i < completedStops ? 'completed' : i === completedStops ? 'in-progress' : 'pending',
          eta: new Date(Date.now() + 1000 * 60 * 20 * (i - completedStops + 1)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          priority: stopHash % 5 === 0 ? 'high' : 'normal',
          lat: -1.35 + ((50 + (stopHash % 40)) / 100) * 0.1, // Map 0-100% to -1.35 to -1.25
          lng: 36.75 + ((20 + ((stopHash * 3) % 60)) / 100) * 0.15, // Map 0-100% to 36.75 to 36.90
        };
      });

      return {
        driver,
        stops,
        completedStops,
        totalStops: stopCount,
        distance: ((hash % 30) + 10) + ((stopCount * 2.5) % 15),
        estimatedFuelSaved: (hash % 10) + 5, // % saved
      };
    }).sort((a, b) => b.totalStops - a.totalStops);
  }, [fleetDrivers]);

  const filteredRoutes = useMemo(() => {
    return agentRoutes.filter(route => 
      route.driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.stops.some(s => s.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [agentRoutes, searchQuery]);

  const selectedRoute = useMemo(() => {
    return agentRoutes.find(r => r.driver.id === selectedAgentId) || agentRoutes[0];
  }, [agentRoutes, selectedAgentId]);

  // KPIs
  const totalActiveRoutes = agentRoutes.length;
  const totalDistance = agentRoutes.reduce((sum, r) => sum + r.distance, 0);
  const avgStops = totalActiveRoutes ? Math.round(agentRoutes.reduce((sum, r) => sum + r.totalStops, 0) / totalActiveRoutes) : 0;
  const avgFuelSaved = totalActiveRoutes ? Math.round(agentRoutes.reduce((sum, r) => sum + r.estimatedFuelSaved, 0) / totalActiveRoutes) : 0;

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-transparent pb-10">
      <div className="p-4 sm:p-6 lg:p-6 mx-auto space-y-6 animate-fade-in w-full h-[calc(100vh-2rem)] flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-[#e0e3eb] dark:border-slate-700/50 shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#131722] dark:text-white">Route Optimizer</h1>
            <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">AI-driven route planning and dynamic dispatch management.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 py-2.5 flex items-center justify-center gap-2 transition-all font-bold text-xs shadow-sm shadow-indigo-600/20 disabled:opacity-70"
            >
              <Zap className={`w-4 h-4 ${isOptimizing ? 'animate-pulse' : ''}`} />
              {isOptimizing ? 'Optimizing Routes...' : 'Run AI Optimization'}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {[
            { icon: Navigation, label: 'Active Routes', value: totalActiveRoutes, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { icon: RouteIcon, label: 'Total Distance', value: `${Math.round(totalDistance)} km`, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { icon: TrendingDown, label: 'Avg. Fuel Saved', value: `${avgFuelSaved}%`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { icon: MapPin, label: 'Avg Stops / Route', value: avgStops, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex gap-4 items-center">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
                  {kpi.label}
                </p>
                <h3 className="text-lg font-black text-[#131722] dark:text-white leading-none mt-1">{kpi.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Main Interface: Left Panel (List) + Right Panel (Map) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-2 min-h-0">
          
          {/* Left Panel: Route Manager */}
          <div className="w-full lg:w-[400px] flex flex-col bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl overflow-hidden shrink-0">
            <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search agents or locations..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-[#131722] dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => (
                  <div key={route.driver.id} className="flex flex-col">
                    <button 
                      onClick={() => setSelectedAgentId(route.driver.id!)}
                      className={`w-full text-left p-3 rounded-xl transition-colors border ${
                        selectedRoute?.driver.id === route.driver.id 
                          ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30' 
                          : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border border-[#e0e3eb] dark:border-slate-600 shrink-0">
                            {route.driver.avatar_url ? (
                              <OptimizedImage src={getThumbnailUrl(route.driver.avatar_url, { width: 100 })} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">{route.driver.name.charAt(0)}</div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#131722] dark:text-white">{route.driver.name}</p>
                            <p className="font-bold text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
                              {route.completedStops} / {route.totalStops} Stops
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xs text-emerald-600 dark:text-emerald-400">{Math.round(route.distance)} km</p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${(route.completedStops / route.totalStops) * 100}%` }}
                        />
                      </div>
                    </button>

                    {/* Expanded Stops View */}
                    <AnimatePresence>
                      {selectedRoute?.driver.id === route.driver.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pr-2 py-3 space-y-0 relative before:absolute before:inset-y-3 before:left-[27px] before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700">
                            {route.stops.map((stop, idx) => (
                              <div key={stop.id} className="flex items-start gap-4 py-2 relative z-10 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded-lg pr-2 -ml-2 pl-2">
                                <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0 cursor-grab" />
                                <div className={`w-4 h-4 rounded-full mt-1 shrink-0 flex items-center justify-center border-2 ${
                                  stop.status === 'completed' ? 'bg-emerald-500 border-emerald-500' :
                                  stop.status === 'in-progress' ? 'bg-white dark:bg-slate-800 border-indigo-500' :
                                  'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                                }`}>
                                  {stop.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                  {stop.status === 'in-progress' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-xs truncate ${stop.status === 'completed' ? 'text-slate-400 line-through' : 'text-[#131722] dark:text-white'}`}>
                                    {stop.address}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-[10px] font-bold text-slate-500">ETA: {stop.eta}</p>
                                    {stop.priority === 'high' && (
                                      <span className="text-[8px] font-bold uppercase tracking-widest text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">High Priority</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500">
                  <MapPin className="w-8 h-8 text-slate-300 mb-3" />
                  <p className="font-bold text-xs">No routes found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Live Map Mockup */}
          <div className="flex-1 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl overflow-hidden relative min-h-[400px] flex flex-col">
            <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex justify-between items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur z-10">
              <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-indigo-500" />
                Live Route Map
              </h3>
              {selectedRoute && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg">
                  Viewing: <span className="text-indigo-600 dark:text-indigo-400">{selectedRoute.driver.name}</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 relative bg-slate-50 dark:bg-[#0f172a] overflow-hidden z-0">
              <MapContainer center={[-1.2921, 36.8219]} zoom={12} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false} attributionControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                
                {selectedRoute && (
                  <Polyline 
                    positions={selectedRoute.stops.map(s => [s.lat, s.lng] as [number, number])} 
                    color="#6366f1" 
                    weight={3} 
                    dashArray="5, 10" 
                  />
                )}

                {selectedRoute?.stops.map((stop, i) => (
                  <Marker 
                    key={`marker-${i}`} 
                    position={[stop.lat, stop.lng]} 
                    icon={createStopIcon(stop.status, i + 1)}
                  >
                    <Popup className="custom-popup border-0 p-0 m-0 shadow-lg rounded-xl overflow-hidden">
                      <div className="p-3 bg-white">
                        <p className="font-bold text-xs text-[#131722]">{stop.address}</p>
                        <p className="text-[10px] text-slate-500 mt-1">ETA: {stop.eta}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {selectedRoute && (
                  <Marker 
                    position={[
                      selectedRoute.stops[Math.max(0, selectedRoute.completedStops - 1)].lat,
                      selectedRoute.stops[Math.max(0, selectedRoute.completedStops - 1)].lng
                    ]}
                    icon={createAgentIcon(selectedRoute.driver.name.charAt(0))}
                  />
                )}
              </MapContainer>
            </div>

            {/* Floating Action/Info Bar on Map */}
            {selectedRoute && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl px-6 py-3 shadow-xl flex items-center gap-6">
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Est. Completion</p>
                  <p className="text-sm font-black text-[#131722] dark:text-white">{selectedRoute.stops[selectedRoute.stops.length-1].eta}</p>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Efficiency</p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">+{selectedRoute.estimatedFuelSaved}%</p>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
      
    </div>
  );
}
