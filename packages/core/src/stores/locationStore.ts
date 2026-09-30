import { create } from 'zustand';

export type LocationStatus = 'idle' | 'locating' | 'tracking' | 'stale' | 'denied' | 'error' | 'unavailable';

export interface LiveLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationState {
  status: LocationStatus;
  coords: LiveLocation | null;
  liveAddress: string | null;
  errorMsg: string | null;
  watchId: number | null;

  startTracking: () => void;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<LiveLocation>;
  _reverseGeocode: (lat: number, lng: number) => Promise<void>;
}

// Haversine distance calculation in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  status: 'idle',
  coords: null,
  liveAddress: null,
  errorMsg: null,
  watchId: null,

  startTracking: () => {
    const { watchId } = get();
    if (watchId !== null) return; // Already tracking
    
    if (!navigator.geolocation) {
      set({ status: 'unavailable', errorMsg: 'Geolocation not supported' });
      return;
    }

    set({ status: 'locating', errorMsg: null });

    let lastGeocodeCoords: LiveLocation | null = null;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const now = Date.now();
        const currentCoords = get().coords;
        
        // 1. Reject garbage readings
        if (accuracy > 500) return;

        // 2. Reject teleport spikes
        if (currentCoords) {
          const dist = getDistance(currentCoords.latitude, currentCoords.longitude, latitude, longitude);
          const dt = (now - currentCoords.timestamp) / 1000;
          
          const accuracyBuffer = Math.min(accuracy + currentCoords.accuracy, 500);
          const allowedDistance = (dt * 45) + accuracyBuffer; // 45 m/s max speed
          
          if (dist > allowedDistance && dist > 50) return; // Teleport rejected
        }

        const newCoords = { latitude, longitude, accuracy, timestamp: now };
        set({ coords: newCoords, status: 'tracking', errorMsg: null });

        // Throttle reverse geocoding to 150 meters
        if (!lastGeocodeCoords || getDistance(lastGeocodeCoords.latitude, lastGeocodeCoords.longitude, latitude, longitude) > 150) {
          lastGeocodeCoords = newCoords;
          get()._reverseGeocode(latitude, longitude);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          set({ status: 'denied', errorMsg: 'Location permission denied' });
        } else {
          set({ status: get().coords ? 'stale' : 'error', errorMsg: err.message });
        }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 }
    );

    set({ watchId: id });
  },

  stopTracking: () => {
    const { watchId } = get();
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      set({ watchId: null, status: 'idle' });
    }
  },

  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      const { coords, status } = get();
      if (coords && (status === 'tracking' || status === 'stale')) {
        return resolve(coords);
      }
      
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation not supported'));
      }

      set({ status: 'locating', errorMsg: null });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: Date.now()
          };
          set({ coords: newCoords, status: 'tracking' });
          get()._reverseGeocode(newCoords.latitude, newCoords.longitude);
          resolve(newCoords);
        },
        (err) => {
          set({ status: err.code === err.PERMISSION_DENIED ? 'denied' : 'error', errorMsg: err.message });
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
      );
    });
  },

  _reverseGeocode: async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'User-Agent': 'Klinflow-App' }
      });
      if (!res.ok) throw new Error('Geocoding failed');
      
      const data = await res.json();
      const address = data.address;
      
      const street = address.road || address.pedestrian || address.suburb || address.neighbourhood;
      const city = address.city || address.town || address.county;
      
      if (street && city) {
        set({ liveAddress: `${street}, ${city}` });
      } else if (street || city) {
        set({ liveAddress: street || city });
      } else {
        set({ liveAddress: data.display_name.split(',').slice(0, 2).join(',') });
      }
    } catch (err) {
      console.warn('Reverse geocoding failed', err);
    }
  }
}));
