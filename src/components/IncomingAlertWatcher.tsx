'use client';

import React, { useMemo, useState } from 'react';
import { usePortalStore } from '@/lib/store';
import { useUserLocation } from '@/lib/location';
import { alertsFor } from '@/lib/nearby';
import { DISTRICTS } from '@/data/locations';
import { themeForHazard } from '@/data/alertThemes';
import { IncomingAlertModal } from './IncomingAlertModal';
import { PreparednessModal } from './PreparednessModal';
import { HazardType } from '@/types';

const SEEN_KEY = 'nepaldrr_seen_alerts';

function loadSeen(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Raises the full-screen alert on any page when a warning or emergency covers
 * the user's location. Each alert is shown once per browser session.
 */
export const IncomingAlertWatcher: React.FC = () => {
  const { alerts } = usePortalStore();
  const { location } = useUserLocation();
  const [seen, setSeen] = useState<string[]>(() => (typeof window === 'undefined' ? [] : loadSeen()));
  const [prepHazard, setPrepHazard] = useState<HazardType | null>(null);

  const alert = useMemo(() => {
    if (!location) return undefined;
    return alertsFor(alerts, location).find(
      (a) => (a.severity === 'warning' || a.severity === 'emergency') && !seen.includes(a.id)
    );
  }, [alerts, location, seen]);

  const markSeen = (id: string) => {
    const next = [...seen, id];
    setSeen(next);
    try {
      sessionStorage.setItem(SEEN_KEY, JSON.stringify(next));
    } catch {}
  };

  const district = location ? DISTRICTS.find((d) => d.id === location.districtId) : undefined;

  return (
    <>
      <IncomingAlertModal
        open={!!alert}
        theme={themeForHazard(alert?.hazardType)}
        alert={alert}
        areaName={district ? `${district.name} district` : undefined}
        onClose={() => alert && markSeen(alert.id)}
        onGetReady={() => {
          if (!alert) return;
          markSeen(alert.id);
          setPrepHazard(alert.hazardType);
        }}
      />
      <PreparednessModal
        open={prepHazard !== null}
        onClose={() => setPrepHazard(null)}
        hazard={prepHazard ?? undefined}
        stage="warning"
      />
    </>
  );
};
