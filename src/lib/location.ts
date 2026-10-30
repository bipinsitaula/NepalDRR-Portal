'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { UserLocation } from '@/types';
import { DISTRICTS } from '@/data/locations';
import { calculateDistanceKm } from '@/lib/distance';

/*
 * The user's location, shared across pages. Held in module state and mirrored
 * to sessionStorage so it survives navigation and reloads within the tab, but
 * is not kept once the tab closes.
 */

const KEY = 'nepaldrr_location';
const listeners = new Set<() => void>();
let current: UserLocation | null | undefined; // undefined = not yet read from storage

function read(): UserLocation | null {
  if (current === undefined) {
    try {
      const raw = sessionStorage.getItem(KEY);
      current = raw ? (JSON.parse(raw) as UserLocation) : null;
    } catch {
      current = null;
    }
  }
  return current;
}

function write(loc: UserLocation | null) {
  current = loc;
  try {
    if (loc) sessionStorage.setItem(KEY, JSON.stringify(loc));
    else sessionStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function nearestDistrictId(lat: number, lng: number): string {
  let best = DISTRICTS[0];
  let bestKm = Infinity;
  for (const d of DISTRICTS) {
    const km = calculateDistanceKm(lat, lng, d.lat, d.lng);
    if (km < bestKm) {
      best = d;
      bestKm = km;
    }
  }
  return best.id;
}

export type LocationStatus = 'idle' | 'locating' | 'denied' | 'unavailable';

export function useUserLocation() {
  const location = useSyncExternalStore(subscribe, read, () => null);
  const [status, setStatus] = useState<LocationStatus>('idle');

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        write({
          lat: latitude,
          lng: longitude,
          accuracyM: Math.round(accuracy),
          source: 'gps',
          districtId: nearestDistrictId(latitude, longitude)
        });
        setStatus('idle');
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  const setDistrict = useCallback((districtId: string) => {
    const d = DISTRICTS.find((x) => x.id === districtId);
    if (d) write({ lat: d.lat, lng: d.lng, source: 'district', districtId: d.id });
  }, []);

  const clear = useCallback(() => write(null), []);

  return { location, status, requestLocation, setDistrict, clear };
}
