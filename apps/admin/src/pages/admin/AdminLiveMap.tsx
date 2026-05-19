import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useAdminStore } from '@klinflow/core/stores/adminStore';
import { useEffect } from 'react';

import L from 'leaflet';
import { Network, Clock, User } from 'lucide-react';

/* Fix Leaflet icons */
if (typeof L !== 'undefined' && L.Icon) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

const statusColors = { active: '#00A651', idle: '#f59e0b', offline: '#94a3b8' };

function makeIcon(status) {
  return new L.DivIcon({
    className: '',
    html: `<div style="background:${statusColors[status] || '#94a3b8'};width:24px;height:24px;border-radius:50%;border:4px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.4);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function AdminLiveMap() {
  const { agents, initAgentTracking } = useAdminStore();

  useEffect(() => {
    const unsub = initAgentTracking();
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  return (
    <div className="flex flex-col h-full space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Live Agent Map</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-800/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live Sync</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 font-medium">Nairobi Operational Fleet • {agents.length} active units</p>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-widest bg-white dark:bg-slate-900 py-3 px-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none">
          <span className="flex items-center gap-2 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full shadow-inner bg-emerald-500" /> Active</span>
          <span className="flex items-center gap-2 border-l border-slate-100 dark:border-slate-800 pl-4 text-amber-500"><span className="w-2.5 h-2.5 rounded-full shadow-inner bg-amber-500" /> Idle</span>
          <span className="flex items-center gap-2 border-l border-slate-100 dark:border-slate-800 pl-4 text-slate-400"><span className="w-2.5 h-2.5 rounded-full shadow-inner bg-slate-400" /> Offline</span>
        </div>
      </div>

      <div className="flex-1 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl relative min-h-[500px]">
        <MapContainer center={[-1.2921, 36.8219]} zoom={13} className="w-full h-full absolute inset-0" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://osm.org">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {agents.map((agent) => (
            <Marker key={agent.id} position={[agent.lat, agent.lng]} icon={makeIcon(agent.status)}>
              <Popup className="custom-popup">
                <div className="flex items-center gap-2 min-w-[110px]">
                   <div className="flex-none w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      <User className="w-3 h-3 text-slate-500" />
                   </div>
                   <div className="overflow-hidden">
                     <p className="text-[12px] font-semibold text-slate-900 dark:text-white leading-none truncate mb-0.5">{agent.name}</p>
                     <div className="flex items-center gap-1">
                        <div className={`w-1 h-1 rounded-full ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-widest leading-none">
                          {agent.status} • {new Date(agent.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                     </div>
                   </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        <div className="absolute bottom-6 left-6 z-[400] bg-white/90 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl flex items-center gap-3 transition-all">
           <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Network className="w-4 h-4 animate-pulse" />
           </div>
           <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Fleet Connectivity</p>
              <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-none">{agents.length} Units Active</p>
           </div>
        </div>
      </div>
    </div>
  );
}
