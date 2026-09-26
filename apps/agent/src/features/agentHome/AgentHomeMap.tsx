/**
 * AgentHomeMap — Leaflet-based live map for Agent Home
 *
 * Architecture:
 *   - Receives position from parent via props (single source of truth from useAgentLocation)
 *   - MapController handles follow-mode camera logic
 *   - User drag/zoom disables follow-mode; recenter button re-enables it
 *   - Marker always tracks agent position regardless of follow-mode
 *   - Existing job markers, popups, tiles, and Supabase logic preserved
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { LocateFixed } from 'lucide-react';

const isDev = (import.meta as any).env?.DEV ?? false;

// ─── Icons ───────────────────────────────────────────────────────────────────

// Custom pulsing agent marker
const agentLocationIcon = L.divIcon({
  className: 'agent-location-icon',
  html: `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(16,185,129,0.2);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="width:18px;height:18px;border-radius:50%;background:#10b981;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);position:relative;z-index:10;"></div>
    </div>
    <style>
      @keyframes ping { 75%,100% { transform:scale(2.5); opacity:0; } }
    </style>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Professional sharp place marker pin (Google Maps style)
const createPickupIcon = (isTrade = false) => {
  const color = isTrade ? '#8b5cf6' : '#3b82f6';
  return L.divIcon({
    className: '',
    html: `
      <svg width="22" height="38" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,0.35));">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28C32 7.16 24.84 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="15" r="7" fill="white"/>
        <circle cx="16" cy="15" r="3.5" fill="${color}"/>
      </svg>
    `,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
  });
};

// ─── MapController ───────────────────────────────────────────────────────────
// Separates location tracking from camera following, per the architecture spec.

// Haversine distance in meters
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calculate an offset center so the marker isn't hidden under the bottom stats card
function getOffsetCenter(map: L.Map, lat: number, lng: number, yOffsetPixels: number = 180): [number, number] {
  const targetPoint = map.project([lat, lng], map.getZoom());
  // Positive Y moves the camera center DOWN (South), which pushes the agent marker UP on the screen
  targetPoint.y += yOffsetPixels;
  const targetLatLng = map.unproject(targetPoint, map.getZoom());
  return [targetLatLng.lat, targetLatLng.lng];
}

interface MapControllerProps {
  lat: number;
  lng: number;
  followMode: boolean;
  onFollowModeChange: (follow: boolean) => void;
  hasLocation: boolean;
  recenterTrigger: number;
}

function MapController({ lat, lng, followMode, onFollowModeChange, hasLocation, recenterTrigger }: MapControllerProps) {
  const map = useMap();
  const initialCenterDone = useRef(false);
  const lastCameraPan = useRef<{ lat: number; lng: number } | null>(null);

  // ── Invalidate size once after mount to prevent Leaflet gray-tile bug ──
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);

  // ── Detect user map interaction (pan or zoom) → disable follow mode ──
  useMapEvents({
    dragstart: (e) => {
      // Ensure it's a real user interaction (has originalEvent)
      if ((e as any).originalEvent) {
        if (isDev) console.log('[USER_MAP_INTERACTION] dragstart → followMode OFF');
        onFollowModeChange(false);
      }
    },
    zoomstart: (e) => {
      if ((e as any).originalEvent) {
        if (isDev) console.log('[USER_MAP_INTERACTION] zoomstart → followMode OFF');
        onFollowModeChange(false);
      }
    }
  });

  // ── Initial center & Recenter button force-pan ──
  useEffect(() => {
    if (!hasLocation) return;
    
    // If it's the very first time we got a location, do an instant center without animation
    if (!initialCenterDone.current) {
      if (isDev) console.log('[CAMERA_FOLLOW] Initial center →', { lat, lng });
      const offsetCenter = getOffsetCenter(map, lat, lng);
      map.setView(offsetCenter, 15, { animate: false });
      initialCenterDone.current = true;
      lastCameraPan.current = { lat, lng };
      return;
    }

    // If the recenter button was clicked (trigger changed)
    if (recenterTrigger > 0) {
      if (isDev) console.log('[CAMERA_FOLLOW] Recenter force-pan →', { lat, lng });
      const offsetCenter = getOffsetCenter(map, lat, lng);
      map.panTo(offsetCenter, { animate: true, duration: 0.8 });
      lastCameraPan.current = { lat, lng };
    }
  }, [hasLocation, recenterTrigger, map, lat, lng]);

  // ── Follow mode: 15m camera deadzone ──
  useEffect(() => {
    if (!followMode || !hasLocation || !initialCenterDone.current) return;

    if (lastCameraPan.current) {
      const dist = haversineMeters(lastCameraPan.current.lat, lastCameraPan.current.lng, lat, lng);
      
      // Only pan the camera if the agent moved > 15m from the last camera position
      if (dist > 15) {
        if (isDev) console.log('[CAMERA_FOLLOW] 15m deadzone crossed, panTo → dist:', dist.toFixed(1) + 'm');
        const offsetCenter = getOffsetCenter(map, lat, lng);
        map.panTo(offsetCenter, { animate: true, duration: 0.8 });
        lastCameraPan.current = { lat, lng };
      }
    } else {
      // Fallback
      const offsetCenter = getOffsetCenter(map, lat, lng);
      map.panTo(offsetCenter, { animate: true, duration: 0.8 });
      lastCameraPan.current = { lat, lng };
    }
  }, [lat, lng, followMode, hasLocation, map]);

  return null;
}

// ─── AgentHomeMap ────────────────────────────────────────────────────────────

interface AgentHomeMapProps {
  isOnline: boolean;
  /** Current agent GPS position from useAgentLocation (null if not yet acquired) */
  agentPosition: { lat: number; lng: number } | null;
  /** GPS accuracy in meters (null if not yet acquired) */
  agentAccuracy: number | null;
  /** True once the first valid GPS reading has been received */
  hasLocation: boolean;
  /** Geolocation permission state */
  permissionState: 'prompt' | 'granted' | 'denied' | 'unavailable';
  /** Geolocation error, if any */
  locationError: GeolocationPositionError | null;
}

export default function AgentHomeMap({
  isOnline,
  agentPosition,
  agentAccuracy,
  hasLocation,
  permissionState,
  locationError,
}: AgentHomeMapProps) {
  const profile = useAuthStore(s => (s as any).profile);

  // ── Fallback center for initial map render (before GPS arrives) ──
  const fallbackLat = profile?.location?.latitude ? Number(profile.location.latitude) : -1.2921;
  const fallbackLng = profile?.location?.longitude ? Number(profile.location.longitude) : 36.8219;

  // Use agent position if available, otherwise fallback
  const displayLat = agentPosition?.lat ?? fallbackLat;
  const displayLng = agentPosition?.lng ?? fallbackLng;

  // ── Follow mode & Recenter state ──
  const [followMode, setFollowMode] = useState(true);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // When the first location arrives, ensure follow mode is on
  const initialFollowSet = useRef(false);
  useEffect(() => {
    if (hasLocation && !initialFollowSet.current) {
      setFollowMode(true);
      initialFollowSet.current = true;
    }
  }, [hasLocation]);

  const handleFollowModeChange = useCallback((follow: boolean) => {
    if (isDev) console.log('[FOLLOW_MODE_CHANGED]', follow);
    setFollowMode(follow);
  }, []);

  const handleRecenter = useCallback(() => {
    if (isDev) console.log('[FOLLOW_MODE_CHANGED] recenter → true');
    setFollowMode(true);
    setRecenterTrigger(prev => prev + 1); // Force MapController to pan immediately
  }, []);

  // ── Job markers (existing Supabase logic, unchanged) ──
  const [mapJobs, setMapJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchMapJobs = async () => {
      try {
        const { data, error } = await supabase.rpc('get_active_agent_jobs', { agent_uuid: profile.id });
        if (error) { console.error('Map RPC error:', error); return; }
        if (!data) return;

        const jobs = (data as any[])
          .filter(b => b.latitude && b.longitude)
          .map(b => ({
            id: b.id,
            latitude: b.latitude,
            longitude: b.longitude,
            isTrade: b.is_market_trade || b.booking_type === 'marketplace_pickup'
          }));

        setMapJobs(jobs);
      } catch (err) {
        console.error('Error fetching map jobs:', err);
      }
    };

    fetchMapJobs();
    const interval = setInterval(fetchMapJobs, 30000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  // ── Render ──
  return (
    <div className="absolute inset-0 z-0">

      {/* Map always renders from frame 1 with fallback center */}
      <MapContainer
        center={[fallbackLat, fallbackLng]}
        zoom={15}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full"
        style={{ background: '#e5e9ea' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapController
          lat={displayLat}
          lng={displayLng}
          followMode={followMode}
          onFollowModeChange={handleFollowModeChange}
          hasLocation={hasLocation}
          recenterTrigger={recenterTrigger}
        />

        {/* Agent GPS accuracy circle (subtle, only when accuracy > 30m) */}
        {hasLocation && agentAccuracy && agentAccuracy > 30 && (
          <Circle
            center={[displayLat, displayLng]}
            radius={agentAccuracy}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.08,
              weight: 1,
              opacity: 0.3,
            }}
          />
        )}

        {/* Agent Location Marker (always updates regardless of follow mode) */}
        <Marker position={[displayLat, displayLng]} icon={agentLocationIcon}>
          <Popup className="font-sans">
            <div className="text-center font-bold text-slate-800 text-[13px] px-1 py-0.5">
              📍 You (Agent)
              {agentAccuracy && (
                <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                  ±{agentAccuracy.toFixed(0)}m accuracy
                </div>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Active Jobs Locations (existing, unchanged) */}
        {mapJobs.map((job) => (
          <Marker
            key={job.id}
            position={[job.latitude, job.longitude]}
            icon={createPickupIcon(job.isTrade)}
          >
            <Popup className="font-sans">
              <div className="text-center font-bold text-slate-800 text-[13px] px-1 py-0.5">
                📦 {job.isTrade ? 'Market Trade' : 'Customer Pickup'}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ── Loading overlay (fades out once GPS acquired) ── */}
      <div
        className={`absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-start justify-center pt-20 transition-opacity duration-1000 pointer-events-none ${
          hasLocation ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ zIndex: 9999 }}
      >
        <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 dark:border-slate-700" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-xs font-black text-slate-600 dark:text-slate-300 tracking-widest uppercase">
            {permissionState === 'denied' ? 'Location access denied' : 'Acquiring GPS...'}
          </p>
        </div>
      </div>

      {/* ── Recenter / Follow-Me Button (Permanently visible) ── */}
      {hasLocation && (
        <button
          onClick={handleRecenter}
          className={`absolute top-[calc(env(safe-area-inset-top,1rem)+6rem)] right-3 z-[1000] w-11 h-11 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center active:scale-90 transition-all ${
            followMode 
              ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
              : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
          aria-label="Recenter on my location"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      )}

      {/* ── Location Error Banner (non-blocking) ── */}
      {permissionState === 'denied' && hasLocation === false && (
        <div className="absolute top-[calc(env(safe-area-inset-top,1rem)+5rem)] left-3 right-3 z-30 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-2xl px-4 py-3 shadow-md">
          <p className="text-[12px] font-bold text-amber-800 dark:text-amber-200">
            📍 Location access denied
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-300 mt-0.5">
            Enable location in your browser settings to see your position on the map.
          </p>
        </div>
      )}

      {/* Offline overlay (existing, unchanged) */}
      {!isOnline && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/60 backdrop-blur-sm z-[500] flex items-center justify-center">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-full shadow-md mb-40 border border-slate-200 dark:border-slate-700">
            Go online to receive missions
          </p>
        </div>
      )}
    </div>
  );
}
