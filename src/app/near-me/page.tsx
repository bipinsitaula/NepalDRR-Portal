'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Phone, Navigation } from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { useUserLocation } from '@/lib/location';
import { alertsFor, incidentsNear, resourcesNear, formatKm, telHref, directionsHref } from '@/lib/nearby';
import { DISTRICTS, HAZARD_INFO } from '@/data/locations';
import { LocationPrompt } from '@/components/LocationPrompt';
import { LeafletMap, MapMarker } from '@/components/LeafletMap';
import { ResourceItem } from '@/types';

const RADII = [10, 25, 50, 100];

const RESOURCE_LABELS: Record<ResourceItem['category'], string> = {
  shelter: 'Shelter',
  ambulance: 'Ambulance',
  fire_engine: 'Fire brigade',
  rescue_team: 'Rescue team',
  boat: 'Rescue boats',
  relief_stock: 'Relief supplies',
  volunteers: 'Volunteer group'
};

export default function NearMePage() {
  const { incidents, resources, alerts, language } = usePortalStore();
  const { location } = useUserLocation();
  const [radius, setRadius] = useState(25);

  const data = useMemo(() => {
    if (!location) return null;
    return {
      alerts: alertsFor(alerts, location),
      incidents: incidentsNear(incidents, location, radius),
      services: resourcesNear(resources, location).slice(0, 8)
    };
  }, [location, alerts, incidents, resources, radius]);

  const markers: MapMarker[] = useMemo(() => {
    if (!location || !data) return [];
    return [
      {
        id: 'you',
        lat: location.lat,
        lng: location.lng,
        title: 'You are here',
        color: '#13213A',
        badgeText: '●'
      },
      ...data.incidents.slice(0, 40).map((i) => ({
        id: i.id,
        lat: i.lat,
        lng: i.lng,
        title: i.title,
        subtitle: `${formatKm(i.distanceKm)} away`,
        category: HAZARD_INFO[i.hazardType]?.label,
        color: HAZARD_INFO[i.hazardType]?.color ?? '#1F4E8C',
        badgeText: '●'
      })),
      ...data.services.map((r) => ({
        id: r.id,
        lat: r.lat,
        lng: r.lng,
        title: r.name,
        subtitle: `${RESOURCE_LABELS[r.category]}, ${formatKm(r.distanceKm)}`,
        category: RESOURCE_LABELS[r.category],
        color: '#047857',
        badgeText: '+'
      }))
    ];
  }, [location, data]);

  const district = location ? DISTRICTS.find((d) => d.id === location.districtId) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-tight text-text">Near me</h1>
          <p className="text-sm text-muted">Alerts, incidents and emergency services around your location.</p>
        </div>
        {location && (
          <div className="flex items-center gap-2">
            <label htmlFor="radius" className="text-sm text-muted">
              Within
            </label>
            <select id="radius" className="field w-auto" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
              {RADII.map((r) => (
                <option key={r} value={r}>
                  {r} km
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="max-w-xl">
        <LocationPrompt />
      </div>

      {location && data && (
        <>
          {/* Alerts come first: they are the instructions people must act on */}
          {data.alerts.length > 0 && (
            <section aria-label="Alerts for your area" className="space-y-3">
              {data.alerts.map((a) => (
                <div key={a.id} className="rounded-lg border border-crimson/30 bg-crimson/5 px-5 py-4">
                  <p className="text-sm font-semibold text-crimson">
                    {a.severity.charAt(0).toUpperCase() + a.severity.slice(1)} for {district?.name}
                  </p>
                  <p className="mt-0.5 font-medium text-text">
                    {language === 'ne' && a.titleNepali ? a.titleNepali : a.title}
                  </p>
                  <p className="mt-1 text-sm text-text">{a.instruction}</p>
                </div>
              ))}
            </section>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <section className="panel overflow-hidden lg:col-span-3">
              <div className="panel-header">
                <h2 className="panel-title">Map</h2>
                <span className="panel-sub">Incidents and services within {radius} km</span>
              </div>
              <LeafletMap
                key={`${location.lat},${location.lng},${radius}`}
                markers={markers}
                center={[location.lat, location.lng]}
                zoom={radius <= 10 ? 12 : radius <= 25 ? 10 : radius <= 50 ? 9 : 8}
                height="440px"
                defaultBasemap="carto"
              />
            </section>

            <section className="panel lg:col-span-2">
              <div className="panel-header">
                <h2 className="panel-title">Emergency services</h2>
                <span className="panel-sub">Closest first</span>
              </div>
              <ul className="divide-y divide-line border-t border-line">
                {data.services.map((r) => (
                  <li key={r.id} className="px-5 py-3">
                    <p className="text-[13px] text-muted">
                      {RESOURCE_LABELS[r.category]}, {formatKm(r.distanceKm)}
                    </p>
                    <p className="font-medium text-text">{r.name}</p>
                    <p className="text-[13px] text-muted">{r.locationName}</p>
                    <div className="mt-2 flex gap-2">
                      <a href={telHref(r.phone)} className="btn btn-secondary px-3 py-1.5 text-[13px]">
                        <Phone className="h-3.5 w-3.5" aria-hidden />
                        Call
                      </a>
                      <a
                        href={directionsHref(r.lat, r.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary px-3 py-1.5 text-[13px]"
                      >
                        <Navigation className="h-3.5 w-3.5" aria-hidden />
                        Directions
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Incidents within {radius} km</h2>
              <span className="panel-sub">{data.incidents.length} recorded, newest first</span>
            </div>
            {data.incidents.length === 0 ? (
              <p className="border-t border-line px-5 py-6 text-sm text-muted">
                No incidents recorded within {radius} km. Try a wider distance.
              </p>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {data.incidents.slice(0, 20).map((i) => {
                  const info = HAZARD_INFO[i.hazardType];
                  return (
                    <li key={i.id}>
                      <Link href={`/incidents/${i.id}`} className="flex gap-3 px-5 py-3 hover:bg-page">
                        <span
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: info?.color }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-text">
                            {language === 'ne' && i.titleNepali ? i.titleNepali : i.title}
                          </span>
                          <span className="block truncate text-[13px] text-muted">
                            {info?.label}, {i.locationName}
                          </span>
                        </span>
                        <span className="shrink-0 text-right text-[13px] tabular text-muted">
                          {formatKm(i.distanceKm)}
                          <span className="block">
                            {new Date(i.dateTime).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
