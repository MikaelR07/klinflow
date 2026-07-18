/**
 * MyRoutes.jsx — Klinflow Premium Route Optimizer (Uber-Style)
 * High-performance logistics terminal for agents.
 */
import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  MapPin,
  Clock,
  ChevronUp,
  ChevronDown,
  Navigation2,
  RotateCcw,
  Zap,
  Phone,
  ExternalLink,
  Truck,
  PackageCheck,
  MoreVertical
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { toast } from 'sonner';

// ── CUSTOM ICONS ──
const agentIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-10 h-10 rounded-2xl bg-blue-600 border-2 border-white shadow-[0_10px_20px_rgba(37,99,235,0.4)] flex items-center justify-center text-white animate-pulse">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const createStopIcon = (number, isNext = false) => L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div class="relative flex flex-col items-center justify-center">
      <div class="w-8 h-8 rounded-full ${isNext ? 'bg-emerald-500 scale-110' : 'bg-slate-800'} border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold z-10">
        ${number}
      </div>
      <div class="w-1 h-3 ${isNext ? 'bg-emerald-500' : 'bg-slate-800'} shadow-sm"></div>
      ${isNext ? '<div class="absolute top-0 w-8 h-8 bg-emerald-500 rounded-full animate-ping opacity-30"></div>' : ''}
    </div>
  `,
  iconSize: [32, 44],
  iconAnchor: [16, 44]
});

// Helper to recenter map
function MapRecenter({ center }) {
  const map = useMap();
  const lastMoved = useRef(0);
  const hasInitialJumped = useRef(false);

  useEffect(() => {
    if (!center) return;
    const now = Date.now();

    // FORCE INITIAL JUMP: Ensure we land on the profile location as soon as it exists
    if (!hasInitialJumped.current) {
      map.setView(center, 15, { animate: false });
      hasInitialJumped.current = true;
      return;
    }

    // SMART RECENTER: Only auto-move if user isn't interacting
    if (now - lastMoved.current > 5000) {
      map.panTo(center, { animate: true, duration: 1 });
      lastMoved.current = now;
    }
  }, [center, map]);

  // Disable auto-recenter when user interacts
  useMapEvents({
    dragstart: () => { lastMoved.current = Date.now() + 1000000; }, // Disable for a long time
    zoomstart: () => { lastMoved.current = Date.now() + 1000000; }
  });

  return null;
}

export default function MyRoutes() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { activeJobs, fetchActiveJobs, subscribeToMissionUpdates } = useAgentStore();

  const initialPos = useMemo(() => {
    const lat = profile?.location?.latitude;
    const lng = profile?.location?.longitude;
    if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
      return [Number(lat), Number(lng)];
    }
    return [-1.286389, 36.817223]; // General Kenya center as last resort
  }, [profile?.location?.latitude, profile?.location?.longitude]);

  const [currentPos, setCurrentPos] = useState(initialPos);
  const [roadPath, setRoadPath] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [orderedJobs, setOrderedJobs] = useState([]);

  // 1. Initial Sync & Real-time
  useEffect(() => {
    fetchActiveJobs();

    // Sync currentPos with initialPos when the page first loads or profile updates
    setCurrentPos(initialPos);

    const channel = subscribeToMissionUpdates(() => {
      fetchActiveJobs();
      toast.info("Route Updated", { description: "Mission parameters have changed." });
    });

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          // Only update if accuracy is high (< 100m) to prevent snapping to Nairobi
          if (pos.coords.accuracy < 100) {
            setCurrentPos([pos.coords.latitude, pos.coords.longitude]);
          }
        },
        null,
        { enableHighAccuracy: true, maximumAge: 0 }
      );
      return () => {
        navigator.geolocation.clearWatch(watchId);
        channel.unsubscribe();
      };
    }
    return () => channel.unsubscribe();
  }, [initialPos[0], initialPos[1]]);

  // Sync currentPos when initialPos changes (e.g. settings update)
  useEffect(() => {
    setCurrentPos(initialPos);
  }, [initialPos]);

  useEffect(() => {
    if (activeJobs.length !== orderedJobs.length) {
      setOrderedJobs(activeJobs);
    }
  }, [activeJobs]);

  const [tripDistance, setTripDistance] = useState(0);

  // 2. Road Optimization (OSRM)
  const calculateRoute = async (optimizeOrder = false) => {
    if (activeJobs.length === 0) return;
    setIsOptimizing(true);
    try {
      const currentJobs = orderedJobs.length === activeJobs.length ? orderedJobs : activeJobs;
      const stops = [
        { lng: currentPos[1], lat: currentPos[0] },
        ...currentJobs.filter(j => j.latitude).map(j => ({ lng: j.longitude, lat: j.latitude }))
      ];

      const coords = stops.map(s => `${s.lng},${s.lat}`).join(';');
      
      let url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
      if (optimizeOrder) {
        url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&roundtrip=false&overview=full&geometries=geojson`;
      }
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.code === 'Ok') {
        let routeData = null;

        if (optimizeOrder && data.waypoints) {
          const jobsWaypoints = data.waypoints.slice(1);
          const newOrder = new Array(currentJobs.length);
          for (let i = 0; i < jobsWaypoints.length; i++) {
             const sortedIdx = jobsWaypoints[i].waypoint_index - 1;
             newOrder[sortedIdx] = currentJobs[i];
          }
          setOrderedJobs(newOrder.filter(Boolean));
          routeData = data.trips && data.trips[0];
        } else {
          routeData = data.routes && data.routes[0];
        }

        if (routeData) {
          const points = routeData.geometry.coordinates.map(c => [c[1], c[0]]);
          setRoadPath(points);
          setTripDistance(routeData.distance); // Distance in meters
        }
      }
    } catch (e) { console.error(e); }
    finally { setIsOptimizing(false); }
  };

  useEffect(() => {
    if (activeJobs.length > 0) calculateRoute(false);
  }, [activeJobs.length]);

  const nextStop = orderedJobs.length > 0 ? orderedJobs[0] : activeJobs[0];
  const totalShiftProfit = activeJobs.reduce((sum, job) => sum + (Number(job.pay) || 0), 0);

  const distanceLabel = useMemo(() => {
    if (!tripDistance) return 'Calculating...';
    if (tripDistance < 1000) return `${Math.round(tripDistance)}m away`;
    return `${(tripDistance / 1000).toFixed(1)} km away`;
  }, [tripDistance]);

  return (
    <div className="fixed inset-0 bg-[#F8F8FF] dark:bg-slate-800 z-[100] overflow-hidden flex flex-col">
      {/* ── TOP HUD (Earnings & Load) ── */}
      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex gap-3">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-white/20 flex-1 pointer-events-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize tracking-widest leading-none mb-0.5">Total Stops</p>
              <p className="text-base font-semibold dark:text-white">{activeJobs.length}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize tracking-widest leading-none mb-0.5">Stops Left</p>
            <p className="text-base font-semibold dark:text-white">{activeJobs.length}</p>
          </div>
        </div>
      </div>

      {/* ── MAP CANVAS ── */}
      {(!currentPos || isNaN(currentPos[0]) || isNaN(currentPos[1])) ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800">
          <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-4 animate-pulse">
            <Navigation2 className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Finding your location...</p>
        </div>
      ) : (
        <div className="flex-1 relative">
          <MapContainer center={currentPos} zoom={15} zoomControl={false} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapRecenter center={currentPos} />

            {roadPath.length > 0 && (
              <Polyline positions={roadPath} color="#2563EB" weight={5} opacity={0.7} />
            )}

            <Marker position={currentPos} icon={agentIcon} zIndexOffset={1000} />

            {(orderedJobs.length > 0 ? orderedJobs : activeJobs).map((job, idx) => {
              if (!job.latitude || !job.longitude) return null;
              return (
                <Marker
                  key={job.id}
                  position={[job.latitude, job.longitude]}
                  icon={createStopIcon(idx + 1, idx === 0)}
                />
              );
            })}
          </MapContainer>

          {/* ── FLOATING MAP CONTROLS ── */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-3">
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => setCurrentPos(initialPos)} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all border border-slate-200 dark:border-slate-800">
                <Navigation2 className="w-5 h-5 text-blue-600" />
              </button>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/80 dark:bg-slate-800/80 px-1 rounded backdrop-blur-sm shadow-sm">Recenter</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button
                onClick={async () => {
                  toast.loading("AI Swarm Optimizer Active...", { id: 'opt' });
                  await calculateRoute(true);
                  toast.success("Route Optimized for Swarms!", { id: 'opt' });
                }}
                className={`w-12 h-12 bg-white dark:bg-slate-900/80 rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all border  dark:border-slate-900 dark:border-emerald-500/20 group relative`}
              >
                <div className="absolute inset-0 bg-emerald-500/10 animate-pulse rounded-2xl" />
                <Zap className={`w-5 h-5 text-emerald-400 relative z-10`} />
              </button>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/50 px-1 rounded backdrop-blur-sm shadow-sm">Optimize</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button onClick={() => calculateRoute(false)} className={`w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all border border-slate-200 dark:border-slate-800 ${isOptimizing ? 'animate-spin' : ''}`}>
                <RotateCcw className="w-5 h-5 text-slate-500" />
              </button>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/80 dark:bg-slate-800/80 px-1 rounded backdrop-blur-sm shadow-sm">Refresh</span>
            </div>
          </div>
        </div>
      )}

      {/* ── MISSION HUD (UBER-STYLE) ── */}
      <AnimatePresence>
        {nextStop && (
          <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            className="absolute mb-12 bottom-6 left-4 right-4 z-[1000]"
          >
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-[0_25px_50_rgba(0,0,0,0.3)] p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-500 capitalize tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50">Next Stop</span>
                      <span className="text-xs font-semibold text-slate-400">· {distanceLabel}</span>
                    </div>
                    <h3 className="text-xl font-semibold dark:text-white mt-1">{nextStop.customer || 'Resident'}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{nextStop.location} · {nextStop.material}</p>
                  </div>
                </div>
                <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${nextStop.latitude},${nextStop.longitude}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] font-semibold text-sm capitalize tracking-widest  active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Navigation className="w-5 h-5" /> START MISSION
                </button>

                <button
                  onClick={() => window.location.href = `tel:${nextStop.phone}`}
                  className="w-20 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-semibold text-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  <Phone className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Trigger */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-full mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 capitalize tracking-widest"
              >
                <ChevronUp className="w-4 h-4" /> View Trip List ({activeJobs.length} Stops)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MANIFEST DRAWER ── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[65vh] z-[2000] bg-white dark:bg-slate-800 rounded-t-[2rem] shadow-[0_-20px_50px_rgba(0,0,0,0.2)] flex flex-col"
          >
            <div className="absolute top-4 left-0 right-0 flex justify-center z-20">
              <button onClick={() => setIsDrawerOpen(false)} className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
            </div>

            <div className="p-6 pt-10 flex-1 overflow-y-auto no-scrollbar pb-32">
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm z-10 py-2">
                <h2 className="text-2xl font-semibold dark:text-white">Trip Manifest</h2>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20">{activeJobs.length} Stops</span>
              </div>

              <div className="space-y-3">
                {(orderedJobs.length > 0 ? orderedJobs : activeJobs).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold dark:text-white truncate">{item.customer || 'Resident'}</p>
                      <p className="text-[11px] font-semibold text-slate-500 capitalize truncate mt-0.5">{item.location || 'Pending Location'} · {item.material}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {item.pay > 0 ? `KSh ${item.pay.toLocaleString()}` : 'Pending'}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1">
                        {item.actual_weight_kg ? `${item.actual_weight_kg} KG` : (item.bags ? `${item.bags} BAGS` : 'EST. WEIGHT')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 px-6 pt-6 pb-28 bg-gradient-to-t from-white via-white dark:from-slate-800 dark:via-slate-800 to-transparent z-20">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all"
              >
                Close Manifest
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
