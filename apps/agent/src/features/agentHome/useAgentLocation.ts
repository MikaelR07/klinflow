/**
 * useAgentLocation — Single authoritative GPS watcher for the Agent app.
 *
 * Architecture:
 *   ONE device GPS watcher → validate reading → update shared state
 *   All consumers (map marker, camera follow, backend broadcast) read from this hook.
 *
 * GPS Filtering Logic:
 *   1. Accept any reading with accuracy ≤ 500m (generous for mobile).
 *   2. Reject readings where accuracy > 500m (clearly garbage).
 *   3. Reject "teleport" jumps: if the new position is > 2km from the last accepted
 *      position AND the time delta is < 5 seconds, it's a GPS spike — ignore it.
 *   4. Always accept the very first valid reading regardless of jump distance.
 *
 * This prevents the agent from disappearing when GPS accuracy dips to 180m,
 * while still protecting against wild GPS spikes that would make the marker jump
 * across the city.
 */
import { useEffect, useRef, useCallback, useState } from 'react';

export interface AgentLocationState {
  /** Current accepted lat/lng, or null if no valid reading yet */
  position: { lat: number; lng: number } | null;
  /** Raw accuracy of the last accepted reading (meters) */
  accuracy: number | null;
  /** True once the first valid GPS reading has been accepted */
  hasLocation: boolean;
  /** Geolocation error, if any */
  error: GeolocationPositionError | null;
  /** 'prompt' | 'granted' | 'denied' | 'unavailable' */
  permissionState: 'prompt' | 'granted' | 'denied' | 'unavailable';
}

// Haversine distance in meters between two lat/lng points
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const isDev = (import.meta as any).env?.DEV ?? false;

/**
 * Single authoritative GPS hook. Mount this ONCE in the Agent Homepage.
 *
 * @param onLocationUpdate  Optional callback fired on every accepted reading.
 *                          Use this to broadcast to Supabase/backend.
 */
export function useAgentLocation(
  onLocationUpdate?: (lat: number, lng: number, accuracy: number) => void
): AgentLocationState {
  const [state, setState] = useState<AgentLocationState>({
    position: null,
    accuracy: null,
    hasLocation: false,
    error: null,
    permissionState: 'prompt',
  });

  // Stable refs to avoid re-creating the watcher when state changes
  const lastAccepted = useRef<{ lat: number; lng: number; time: number; accuracy: number } | null>(null);
  const callbackRef = useRef(onLocationUpdate);
  callbackRef.current = onLocationUpdate;

  useEffect(() => {
    // ── 1. Check Permission State ──
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        if (isDev) console.log('[LOCATION_PERMISSION]', result.state);
        setState((s) => ({ ...s, permissionState: result.state as any }));
        result.onchange = () => {
          if (isDev) console.log('[LOCATION_PERMISSION] changed →', result.state);
          setState((s) => ({ ...s, permissionState: result.state as any }));
        };
      });
    }

    // ── 2. Guard: Geolocation API available? ──
    if (!navigator.geolocation) {
      if (isDev) console.warn('[LOCATION_ERROR] Geolocation API not available');
      setState((s) => ({ ...s, permissionState: 'unavailable' }));
      return;
    }

    // ── 3. Validate a raw GPS reading ──
    const validateAndAccept = (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      const now = Date.now();

      if (isDev) console.log('[GPS_UPDATE]', { lat, lng, accuracy: accuracy.toFixed(1) + 'm' });

      // Rule 1: Reject obviously garbage readings (accuracy > 500m)
      if (accuracy > 500) {
        if (isDev) console.log('[LOCATION_REJECTED] accuracy too low:', accuracy.toFixed(0) + 'm');
        return;
      }

      // Rule 2: Reject teleport spikes based on speed and accuracy
      if (lastAccepted.current) {
        const dist = haversineMeters(lastAccepted.current.lat, lastAccepted.current.lng, lat, lng);
        const dt = (now - lastAccepted.current.time) / 1000; // seconds

        // Max realistic vehicle speed ~ 150 km/h = ~42 meters/second
        // Buffer using both PREVIOUS and CURRENT accuracy (capped to prevent wild jumps)
        const prevAccuracy = lastAccepted.current.accuracy;
        const accuracyBuffer = Math.min(accuracy + prevAccuracy, 500);
        
        const allowedDistance = (dt * 45) + accuracyBuffer; 
        
        // If they jumped further than physically possible (even accounting for drift), it's a spike
        if (dist > allowedDistance && dist > 50) { 
          if (isDev) console.log('[LOCATION_REJECTED] teleport spike:', dist.toFixed(0) + 'm in ' + dt.toFixed(1) + 's');
          return;
        }
      }

      // ── Accepted ──
      if (isDev) console.log('[LOCATION_ACCEPTED]', { lat, lng, accuracy: accuracy.toFixed(1) + 'm' });
      lastAccepted.current = { lat, lng, time: now, accuracy };

      setState((s) => ({
        ...s,
        position: { lat, lng },
        accuracy,
        hasLocation: true,
        error: null,
      }));

      // Fire the backend broadcast callback
      callbackRef.current?.(lat, lng, accuracy);
    };

    // ── 4. Error handler ──
    const handleError = (err: GeolocationPositionError) => {
      if (isDev) console.warn('[LOCATION_ERROR]', { code: err.code, message: err.message });
      setState((s) => ({
        ...s,
        error: err,
        permissionState: err.code === 1 ? 'denied' : s.permissionState,
      }));
    };

    // ── 5. Watcher options (balanced for field agent on mobile) ──
    const watchOptions: PositionOptions = {
      enableHighAccuracy: true,
      // Allow cached readings up to 3s old — prevents unnecessary hardware polls
      maximumAge: 3000,
      // 20s timeout — generous enough for cold GPS start indoors
      timeout: 20000,
    };

    // ── 6. Start the ONE watcher ──
    const watchId = navigator.geolocation.watchPosition(
      validateAndAccept,
      handleError,
      watchOptions
    );

    if (isDev) console.log('[GPS_WATCHER] Created watchId:', watchId);

    // ── 7. Cleanup on unmount ──
    return () => {
      if (isDev) console.log('[GPS_WATCHER] Clearing watchId:', watchId);
      navigator.geolocation.clearWatch(watchId);
    };
  }, []); // Empty deps: watcher is created once and never recreated

  return state;
}
