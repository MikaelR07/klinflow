/**
 * useAgentLocation — Wraps the global locationStore for AgentHome Map.
 */
import { useEffect, useRef } from 'react';
import { useLocationStore } from '@klinflow/core/stores/locationStore';

export function useAgentLocation(
  onLocationUpdate?: (lat: number, lng: number, accuracy: number) => void
): {
  position: { lat: number; lng: number } | null;
  accuracy: number | null;
  hasLocation: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unavailable';
  error: Error | null;
} {
  const { coords, status, errorMsg, startTracking, stopTracking } = useLocationStore();
  
  const callbackRef = useRef(onLocationUpdate);
  callbackRef.current = onLocationUpdate;

  useEffect(() => {
    startTracking();
    // We do NOT stopTracking on unmount here because we want global persistence for the app.
  }, [startTracking]);

  useEffect(() => {
    if (coords && callbackRef.current) {
      callbackRef.current(coords.latitude, coords.longitude, coords.accuracy);
    }
  }, [coords?.latitude, coords?.longitude, coords?.timestamp]);

  return {
    position: coords ? { lat: coords.latitude, lng: coords.longitude } : null,
    accuracy: coords ? coords.accuracy : null,
    hasLocation: !!coords,
    permissionState: status === 'denied' ? 'denied' : status === 'unavailable' ? 'unavailable' : 'granted',
    error: errorMsg ? new Error(errorMsg) : null
  };
}
