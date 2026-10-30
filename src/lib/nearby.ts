import { DisasterAlert, Incident, ResourceItem, UserLocation } from '@/types';
import { DISTRICTS } from '@/data/locations';
import { calculateDistanceKm } from '@/lib/distance';

export type WithDistance<T> = T & { distanceKm: number };

function withDistance<T extends { lat: number; lng: number }>(items: T[], loc: UserLocation): WithDistance<T>[] {
  return items.map((item) => ({ ...item, distanceKm: calculateDistanceKm(loc.lat, loc.lng, item.lat, item.lng) }));
}

/** Incidents within the radius, newest first. Rejected reports are excluded. */
export function incidentsNear(incidents: Incident[], loc: UserLocation, radiusKm: number) {
  return withDistance(incidents.filter((i) => i.status !== 'rejected'), loc)
    .filter((i) => i.distanceKm <= radiusKm)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

/** Resources sorted by distance, optionally limited to some categories. */
export function resourcesNear(
  resources: ResourceItem[],
  loc: UserLocation,
  categories?: ResourceItem['category'][]
) {
  return withDistance(
    resources.filter((r) => !categories || categories.includes(r.category)),
    loc
  ).sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Active alerts covering the user's district (or its whole province when no districts are listed). */
export function alertsFor(alerts: DisasterAlert[], loc: UserLocation) {
  const district = DISTRICTS.find((d) => d.id === loc.districtId);
  return alerts.filter(
    (a) =>
      a.isActive &&
      (a.districtIds.includes(loc.districtId) ||
        (a.districtIds.length === 0 && !!district && a.provinceIds.includes(district.provinceId)))
  );
}

export function formatKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** First dialable number in strings like "01-4221177 / 101". */
export function telHref(phone: string) {
  const first = phone.split('/')[0].replace(/[^\d+]/g, '');
  return `tel:${first}`;
}

export function directionsHref(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
