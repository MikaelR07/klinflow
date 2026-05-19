import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapPin, Navigation, Loader2, Target, Move, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
// @ts-ignore
import L_ from 'leaflet';
const L = L_ as any;

// Fix Leaflet's default icon issue with Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = (L as any).icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface LocationValue {
  estate?: string;
  latitude?: number | null;
  longitude?: number | null;
  h3_index?: string | null;
  accuracy?: number | null;
  lastUpdated?: string;
}

interface LocationSelectorProps {
  value: LocationValue;
  onChange: (val: LocationValue) => void;
  hideHeaderText?: boolean;
  hideFooterText?: boolean;
}

// ── REVERSE GEOCODE HELPER ─────────────────────────────────────────
const fetchAddress = async (lat: number, lon: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { headers: { 'User-Agent': 'Klinflow-PWA/1.0' } }
    );
    const data = await response.json();
    if (!data || !data.address) return null;

    const addr = data.address;
    return addr.neighbourhood || addr.suburb || addr.quarter || addr.suburb || addr.road || data.display_name.split(',')[0];
  } catch (err) {
    console.error('Reverse Geocode Failed:', err);
    return null;
  }
};

// ── RECENTER MAP HELPER ───────────────────────────────────────────
function RecenterMap({ lat, lng }: { lat: number | null | undefined; lng: number | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 17, {
        animate: true,
        duration: 1.5
      });
    }
  }, [lat, lng, map]);
  return null;
}

// ── MAP EVENT HANDLER ──────────────────────────────────────────────
function MapEvents({ onMove }: { onMove: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e: any) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationSelector({ 
  value, 
  onChange,
  hideHeaderText = false,
  hideFooterText = false
}: LocationSelectorProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showMap, setShowMap] = useState(!!value?.latitude);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const initialPos: [number, number] = useMemo(() => {
    if (value?.latitude && value?.longitude) return [value.latitude, value.longitude];
    return [-1.286389, 36.817223]; // General Kenya center
  }, [value?.latitude, value?.longitude]);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const updateLocation = useCallback((lat: number, lon: number, acc: number | null = null) => {
    setIsCapturing(true);
    
    onChange({
      estate: 'Syncing Pin...',
      latitude: lat,
      longitude: lon,
      accuracy: acc,
      lastUpdated: new Date().toISOString()
    });

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      const areaName = await fetchAddress(lat, lon);
      let h3_index: string | null = null;
      try {
        const { latLngToCell } = await import('h3-js');
        h3_index = latLngToCell(lat, lon, 7);
      } catch (e) {}
      
      onChange({
        estate: areaName || 'Nairobi Sector',
        latitude: lat,
        longitude: lon,
        h3_index,
        accuracy: acc,
        lastUpdated: new Date().toISOString()
      });
      setIsCapturing(false);
    }, 1500);
  }, [onChange]);

  const handleDetect = () => {
    setIsCapturing(true);
    if (!navigator.geolocation) {
      toast.error('GSP Error', { description: 'Browser does not support geolocation.' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        setAccuracy(acc);
        setShowMap(true);
        updateLocation(latitude, longitude, acc);
        toast.success('Position Locked', { description: `Accuracy: ${Math.round(acc)}m` });
      },
      (err) => {
        toast.error('Signal Loss', { description: 'Could not lock GPS. Please use manual selection.' });
        setIsCapturing(false);
        setShowMap(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className={hideHeaderText ? "w-full" : "space-y-4"}>
      {!hideHeaderText && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Location Area</label>
          {accuracy && (
            <span className="flex items-center gap-1.5 text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-widest">
              <Target className="w-3 h-3" /> Precision {Math.round(accuracy)}m
            </span>
          )}
        </div>
      )}

      {!showMap ? (
        <div className={hideHeaderText ? "grid grid-cols-2 gap-3 p-4" : "grid grid-cols-2 gap-3"}>
          <button 
            type="button"
            onClick={handleDetect}
            disabled={isCapturing}
            className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 hover:border-primary transition-all group"
          >
            {isCapturing ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <Navigation className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />}
            <span className="text-xs font-black mt-3 uppercase tracking-tighter">Live Detect</span>
          </button>

          <button 
            type="button"
            onClick={() => setShowMap(true)}
            className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 hover:border-slate-400 transition-all group"
          >
            <MapPin className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
            <span className="text-xs font-black mt-3 uppercase tracking-tighter">Manual Pin</span>
          </button>
        </div>
      ) : (
        <div className={hideHeaderText ? "w-full animate-in fade-in slide-in-from-top-4 duration-500" : "space-y-4 animate-in fade-in slide-in-from-top-4 duration-500"}>
          <div className={hideHeaderText ? "h-56 w-full relative z-0" : "h-48 w-full rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative z-0"}>
            <MapContainer center={initialPos as any} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} {...({} as any)}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <RecenterMap lat={value?.latitude} lng={value?.longitude} />
              <Marker position={[value?.latitude || initialPos[0], value?.longitude || initialPos[1]] as any} draggable={true} {...({ icon: DefaultIcon } as any)} eventHandlers={{
                dragend: (e: any) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  updateLocation(pos.lat, pos.lng);
                }
              }} />
              <MapEvents onMove={updateLocation} />
            </MapContainer>
            
            <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-center pointer-events-none">
              <div className="glass px-4 py-2 rounded-full border border-white/20 shadow-lg flex items-center gap-3 pointer-events-auto">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-primary uppercase tracking-widest leading-none">Sector</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[120px] leading-tight mt-0.5">
                    {value?.estate || 'Detecting...'}
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                <button 
                  type="button"
                  onClick={() => { setShowMap(false); onChange({ ...value, latitude: null, longitude: null }); }}
                  className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {isCapturing && (
              <div className="absolute inset-0 z-[1100] bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          </div>

          {!hideFooterText && (
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center">
              <Move className="w-3 h-3 inline mr-1 mb-0.5" /> Drag the pin to your exact pickup gate
            </p>
          )}
        </div>
      )}
    </div>
  );
}
