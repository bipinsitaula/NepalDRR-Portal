'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Ambulance,
  ShieldHalf,
  Flame,
  LifeBuoy,
  Waves,
  MessageSquareText,
  MapPinned,
  HandHeart,
  FilePlus2,
  ListChecks,
  Siren,
  ChevronRight,
  Copy,
  Send,
  Phone
} from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { useUserLocation } from '@/lib/location';
import { alertsFor, incidentsNear, resourcesNear, formatKm, directionsHref } from '@/lib/nearby';
import { EMERGENCY_CONTACTS, EmergencyContact } from '@/data/emergencyContacts';
import { Modal } from '@/components/Modal';
import { LocationPrompt } from '@/components/LocationPrompt';
import { PreparednessModal } from '@/components/PreparednessModal';
import { IncomingAlertModal } from '@/components/IncomingAlertModal';
import { ALERT_THEMES } from '@/data/alertThemes';
import { DISTRICTS, HAZARD_INFO } from '@/data/locations';
import { PREP_GUIDES, PrepStage } from '@/data/preparedness';
import { HazardType } from '@/types';

const CONTACT_ICONS: Record<EmergencyContact['id'], React.ElementType> = {
  ambulance: Ambulance,
  police: ShieldHalf,
  fire: Flame,
  disaster: LifeBuoy,
  flood: Waves
};

// Earthquakes give no warning, so their drill starts at the moment the shaking begins.
const drillStage = (guideId: string): PrepStage => (guideId === 'earthquake' ? 'during' : 'warning');

export default function SosPage() {
  const { incidents, resources, alerts, language, openReport } = usePortalStore();
  const { location, requestLocation } = useUserLocation();
  const [chooserOpen, setChooserOpen] = useState(false);
  const [prep, setPrep] = useState<{ hazard?: HazardType; fromAlert: boolean; drill?: boolean; stage?: PrepStage } | null>(null);
  // Practice drill: simulates an incoming alert so people can rehearse the get-ready steps.
  const [drillPickerOpen, setDrillPickerOpen] = useState(false);
  const [drillGuideId, setDrillGuideId] = useState<string | null>(null);
  const [drillAlertOpen, setDrillAlertOpen] = useState(false);
  const drillGuide = PREP_GUIDES.find((g) => g.id === drillGuideId);
  const drillTheme = ALERT_THEMES.find((t) => t.id === drillGuideId) ?? ALERT_THEMES[0];

  // A drill starts with the full-screen alert, exactly as a real one would arrive.
  const startDrill = (guideId: string) => {
    setDrillGuideId(guideId);
    setDrillPickerOpen(false);
    setDrillAlertOpen(true);
  };

  const openDrillPrep = () => {
    if (!drillGuide) return;
    setDrillAlertOpen(false);
    setPrep({ hazard: drillGuide.hazards[0], fromAlert: true, drill: true, stage: drillStage(drillGuide.id) });
  };
  const [copied, setCopied] = useState(false);

  const area = useMemo(() => {
    if (!location) return null;
    return {
      alerts: alertsFor(alerts, location),
      incidentCount: incidentsNear(incidents, location, 25).length,
      shelter: resourcesNear(resources, location, ['shelter'])[0]
    };
  }, [location, alerts, incidents, resources]);

  const mapsLink = location ? `https://maps.google.com/?q=${location.lat.toFixed(5)},${location.lng.toFixed(5)}` : '';
  const helpMessage = `I need help. My location: ${mapsLink}`;

  const copyLocation = async () => {
    try {
      await navigator.clipboard.writeText(helpMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="sr-only">Emergency help</h1>

      {/* SOS */}
      <section className="flex flex-col items-center pt-2 text-center">
        <button
          type="button"
          onClick={() => setChooserOpen(true)}
          className="sos-button relative grid h-52 w-52 place-items-center rounded-full bg-crimson text-white shadow-[0_12px_40px_-8px_rgb(200_16_46/0.6)] transition-transform active:scale-95 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-crimson"
          aria-haspopup="dialog"
        >
          <span>
            <span className="block text-5xl font-bold tracking-wide">SOS</span>
            <span className="mt-1 block text-sm text-white/85">Tap to call for help</span>
          </span>
        </button>
        <p className="mt-5 max-w-xs text-sm text-muted">
          Choose police, ambulance, fire or the disaster helpline. Calls go straight from your phone.
        </p>
        <button type="button" onClick={() => setDrillPickerOpen(true)} className="btn btn-secondary mt-4">
          <Siren className="h-4 w-4 text-crimson" aria-hidden />
          Practice a drill
        </button>
      </section>

      {/* Simulated alert while a drill is running; styled apart so it can't be mistaken for a real one */}
      {drillGuide && (
        <section className="rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-4" aria-label="Practice drill">
          <p className="text-[13px] font-medium text-amber-800">Practice drill. This is not a real alert.</p>
          <p className="mt-1 text-sm font-semibold text-text">{drillGuide.label} warning for your area</p>
          <p className="mt-0.5 text-[13px] text-muted">
            Imagine the warning has just been issued. Go through each step as if it were real.
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={openDrillPrep} className="btn btn-primary flex-1">
              <ListChecks className="h-4 w-4" aria-hidden />
              Get ready
            </button>
            <button type="button" onClick={() => setDrillAlertOpen(true)} className="btn btn-secondary">
              <Siren className="h-4 w-4" aria-hidden />
              Replay alert
            </button>
          </div>
          <button type="button" onClick={() => setDrillGuideId(null)} className="mt-2 text-[13px] text-muted underline underline-offset-2">
            End drill
          </button>
        </section>
      )}

      <LocationPrompt />

      {/* A disaster is coming: point straight to the get-ready steps for that hazard */}
      {area && area.alerts.length > 0 && (
        <section className="rounded-lg bg-ink p-4 text-white">
          <p className="text-sm font-semibold">
            {HAZARD_INFO[area.alerts[0].hazardType]?.label ?? 'Disaster'} {area.alerts[0].severity} for your area
          </p>
          <p className="mt-0.5 text-[13px] text-white/75">
            Check what to do now, and what to do if it gets worse.
          </p>
          <button
            type="button"
            onClick={() => setPrep({ hazard: area.alerts[0].hazardType, fromAlert: true })}
            className="btn mt-3 w-full bg-white text-ink hover:bg-white/90"
          >
            <ListChecks className="h-4 w-4" aria-hidden />
            Get ready
          </button>
        </section>
      )}

      {/* Your area */}
      {location && area && (
        <section className="panel divide-y divide-line">
          <h2 className="panel-title px-4 pb-2 pt-4">Your area</h2>
          {area.alerts.length > 0 ? (
            area.alerts.slice(0, 2).map((a) => (
              <div key={a.id} className="px-4 py-3">
                <p className="text-sm font-medium text-crimson">
                  {a.severity.charAt(0).toUpperCase() + a.severity.slice(1)} alert
                </p>
                <p className="text-sm text-text">{language === 'ne' && a.titleNepali ? a.titleNepali : a.title}</p>
                <p className="mt-1 text-[13px] text-muted">{a.instruction}</p>
              </div>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-muted">No active alerts for your district.</p>
          )}
          <p className="px-4 py-3 text-sm text-text">
            {area.incidentCount} recorded {area.incidentCount === 1 ? 'incident' : 'incidents'} within 25 km
          </p>
          {area.shelter && (
            <div className="flex items-center gap-3 px-4 py-3">
              <p className="min-w-0 flex-1 text-sm">
                <span className="block text-[13px] text-muted">Nearest shelter, {formatKm(area.shelter.distanceKm)}</span>
                <span className="block truncate font-medium text-text">{area.shelter.name}</span>
              </p>
              <a
                href={directionsHref(area.shelter.lat, area.shelter.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary shrink-0 px-3 text-[13px]"
              >
                Directions
              </a>
            </div>
          )}
        </section>
      )}

      {/* Actions */}
      <nav aria-label="Help options" className="panel divide-y divide-line overflow-hidden">
        <ActionRow onClick={() => setPrep({ fromAlert: false })} icon={ListChecks} title="Get ready for a disaster" text="Checklists for before, during and after" />
        <ActionRow href="/assistant" icon={MessageSquareText} title="What should I do?" text="Get step-by-step advice for your situation" />
        <ActionRow href="/near-me" icon={MapPinned} title="What's happening near me" text="Alerts, incidents, shelters and services nearby" />
        <ActionRow href="/volunteer" icon={HandHeart} title="Help others" text="Volunteer for an incident in your area" />
        <ActionRow onClick={openReport} icon={FilePlus2} title="Report an incident" text="Tell the authorities what you are seeing" />
      </nav>

      <IncomingAlertModal
        open={drillAlertOpen && !!drillGuide}
        theme={drillTheme}
        areaName={location ? DISTRICTS.find((d) => d.id === location.districtId)?.name : undefined}
        onClose={() => {
          setDrillAlertOpen(false);
          setDrillGuideId(null);
        }}
        onGetReady={openDrillPrep}
      />

      <PreparednessModal
        open={prep !== null}
        onClose={() => setPrep(null)}
        hazard={prep?.hazard}
        stage={prep?.stage ?? (prep?.fromAlert ? 'warning' : 'prepare')}
        drill={prep?.drill}
      />

      <Modal
        open={drillPickerOpen}
        onClose={() => setDrillPickerOpen(false)}
        title="Practice a drill"
        description="Pick a disaster. You'll see the alert as it would arrive on your phone, with sound, then walk through what to do."
        sheet
      >
        <ul className="-mx-5 -mt-4 divide-y divide-line">
          {PREP_GUIDES.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => startDrill(g.id)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-page"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: HAZARD_INFO[g.hazards[0]]?.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-text">{g.label}</span>
                  <span className="block text-[13px] text-muted">
                    {ALERT_THEMES.find((t) => t.id === g.id)?.timing}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] text-muted">
          Drills only run on this phone. No one is alerted and nothing is sent.
        </p>
      </Modal>

      {/* Who to call */}
      <Modal
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        title="Who do you need?"
        description="Tap to call. Stay on the line and say where you are."
        sheet
      >
        <ul className="-mx-5 -mt-4 divide-y divide-line">
          {EMERGENCY_CONTACTS.map((c) => {
            const Icon = CONTACT_ICONS[c.id];
            return (
              <li key={c.id}>
                <a href={`tel:${c.number}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-page active:bg-accent-soft">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-page text-text">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-text">
                      {language === 'ne' ? c.labelNepali : c.label}
                    </span>
                    <span className="block text-[13px] text-muted">{c.description}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-lg font-semibold tabular text-crimson">
                    <Phone className="h-4 w-4" aria-hidden />
                    {c.number}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 rounded-md bg-page p-4">
          <p className="text-sm font-medium text-text">Share your location</p>
          {location ? (
            <>
              <p className="mt-0.5 break-all text-[13px] text-muted">{mapsLink}</p>
              <div className="mt-3 flex gap-2">
                <a href={`sms:?body=${encodeURIComponent(helpMessage)}`} className="btn btn-primary flex-1">
                  <Send className="h-4 w-4" aria-hidden />
                  Send by SMS
                </a>
                <button type="button" onClick={copyLocation} className="btn btn-secondary flex-1">
                  <Copy className="h-4 w-4" aria-hidden />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-0.5 text-[13px] text-muted">Turn on location so you can send it to family or rescuers.</p>
              <button type="button" onClick={requestLocation} className="btn btn-secondary mt-3 w-full">
                Use my location
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

function ActionRow({
  href,
  onClick,
  icon: Icon,
  title,
  text
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  const inner = (
    <>
      <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-text">{title}</span>
        <span className="block text-[13px] text-muted">{text}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
    </>
  );
  const cls = 'flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-page';
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
