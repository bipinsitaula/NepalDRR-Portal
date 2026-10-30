'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { DISTRICTS } from '@/data/locations';

export const AlertBanner: React.FC = () => {
  const { activeAlerts, language } = usePortalStore();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !activeAlerts.length) return null;

  const topAlert = activeAlerts[0];
  const isEmergency = topAlert.severity === 'emergency' || topAlert.severity === 'warning';
  const areas = topAlert.districtIds.map((id) => DISTRICTS.find((d) => d.id === id)?.name ?? id).join(', ');
  const severityLabel = topAlert.severity.charAt(0).toUpperCase() + topAlert.severity.slice(1);

  return (
    <aside
      aria-label="Active alert"
      className={isEmergency ? 'bg-crimson text-white' : 'bg-amber-100 text-amber-950 border-b border-amber-200'}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 truncate">
          <span className="font-semibold">{severityLabel}: </span>
          {language === 'ne' && topAlert.titleNepali ? topAlert.titleNepali : topAlert.title}
          {areas && <span className="hidden md:inline opacity-80"> in {areas}</span>}
        </p>
        <Link href="/alerts" className="shrink-0 font-medium underline underline-offset-2 decoration-1">
          {activeAlerts.length > 1 ? `All ${activeAlerts.length} alerts` : 'Details'}
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 -mr-1 rounded hover:bg-black/10"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
