'use client';

import React from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import { useUserLocation } from '@/lib/location';
import { DISTRICTS } from '@/data/locations';
import { usePortalStore } from '@/lib/store';

/**
 * Shows where the user is (or asks for it). GPS first; a district picker is
 * always offered so people without location permission can still continue.
 */
export const LocationPrompt: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { location, status, requestLocation, setDistrict } = useUserLocation();
  const { language } = usePortalStore();
  const district = location ? DISTRICTS.find((d) => d.id === location.districtId) : undefined;
  const districtName = district ? (language === 'ne' ? district.nameNepali : district.name) : '';

  const picker = (
    <select
      aria-label="Choose your district"
      className="field"
      value={location?.source === 'district' ? location.districtId : ''}
      onChange={(e) => e.target.value && setDistrict(e.target.value)}
    >
      <option value="">Choose district instead</option>
      {[...DISTRICTS]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((d) => (
          <option key={d.id} value={d.id}>
            {language === 'ne' ? d.nameNepali : d.name}
          </option>
        ))}
    </select>
  );

  if (location) {
    return (
      <div className={`flex items-center gap-3 ${compact ? '' : 'panel px-4 py-3'}`}>
        <MapPin className="h-5 w-5 shrink-0 text-crimson" aria-hidden />
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-medium text-text">
            {location.source === 'gps' ? `Near ${districtName}` : `${districtName} district`}
          </span>
          <span className="block text-[13px] text-muted">
            {location.source === 'gps'
              ? `From your device${location.accuracyM ? `, accurate to about ${location.accuracyM} m` : ''}`
              : 'Using the district centre'}
          </span>
        </p>
        <button type="button" onClick={requestLocation} className="btn btn-ghost px-2.5 text-[13px]">
          {status === 'locating' ? 'Locating…' : 'Update'}
        </button>
      </div>
    );
  }

  return (
    <div className="panel space-y-3 p-4">
      <div>
        <p className="font-medium text-text">Where are you?</p>
        <p className="text-[13px] text-muted">
          Your location stays on this device. It is used to show nearby alerts, incidents and shelters.
        </p>
      </div>
      <button type="button" onClick={requestLocation} disabled={status === 'locating'} className="btn btn-primary w-full">
        <LocateFixed className="h-4 w-4" aria-hidden />
        {status === 'locating' ? 'Finding your location…' : 'Use my location'}
      </button>
      {status === 'denied' && (
        <p className="text-[13px] text-crimson">Location permission was blocked. Choose your district below.</p>
      )}
      {status === 'unavailable' && (
        <p className="text-[13px] text-crimson">Could not get your location. Choose your district below.</p>
      )}
      {picker}
    </div>
  );
};
