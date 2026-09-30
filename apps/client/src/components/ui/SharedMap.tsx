import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';

export function RecenterButton({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: 'none' }}>
      <div className="leaflet-control" style={{ pointerEvents: 'auto', marginBottom: '16px', marginRight: '16px' }}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            map.setView(center, 15, { animate: true });
          }}
          className="w-11 h-11 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center active:scale-90 transition-all text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
          title="Recenter Map"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export function MapBounds({ center, items = [] }: { center: [number, number], items?: any[] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([center]);
    let hasMarkers = false;
    
    if (items?.length) {
      items.forEach(item => {
        const lat = item.location?.latitude || item.lat || center[0];
        const lng = item.location?.longitude || item.lng || center[1];
        bounds.extend([lat, lng]);
        hasMarkers = true;
      });
    }

    if (hasMarkers) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true });
    } else {
      map.setView(center, 14, { animate: true });
    }
  }, [center, items, map]);
  return null;
}

interface SharedMapProps {
  center: [number, number];
  height?: string;
  boundsItems?: any[]; // Array of agents/hubs to fit bounds to
  children?: React.ReactNode;
}

export function SharedMap({ center, height = 'h-[350px]', boundsItems = [], children }: SharedMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMapLoaded(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`${height} -mx-3.5 w-auto rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 relative shadow-sm group`}>
      {/* ── Premium Glass Loading Overlay ── */}
      <div className={`absolute inset-0 z-50 pointer-events-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-1000 ${mapLoaded ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
           <div className="relative flex items-center justify-center">
             <div className="w-12 h-12 rounded-full border-4 border-slate-100 dark:border-slate-700" />
             <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
           </div>
           <p className="text-xs font-black text-slate-600 dark:text-slate-300 tracking-widest uppercase">Loading Map...</p>
        </div>
      </div>

      <MapContainer center={center} zoom={13} zoomControl={false} className="h-full w-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapBounds center={center} items={boundsItems} />
        <RecenterButton center={center} />
        
        {children}
      </MapContainer>
    </div>
  );
}
