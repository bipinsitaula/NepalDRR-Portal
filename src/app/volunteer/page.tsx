'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Users } from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { useUserLocation } from '@/lib/location';
import { useVolunteers, saveVolunteer } from '@/lib/volunteers';
import { calculateDistanceKm } from '@/lib/distance';
import { formatKm } from '@/lib/nearby';
import { DISTRICTS, HAZARD_INFO } from '@/data/locations';
import { LocationPrompt } from '@/components/LocationPrompt';
import { Modal } from '@/components/Modal';
import { HazardType, Incident, VolunteerSignup, VolunteerSkill } from '@/types';

const SKILL_LABELS: Record<VolunteerSkill, string> = {
  first_aid: 'First aid',
  search_rescue: 'Search and rescue',
  medical: 'Doctor or nurse',
  driving: 'Driving',
  cooking: 'Cooking and food',
  logistics: 'Carrying and sorting supplies',
  shelter: 'Shelter set-up',
  counselling: 'Counselling and care'
};

/** What responders typically need for each hazard. */
const NEEDS: Partial<Record<HazardType, VolunteerSkill[]>> = {
  flood: ['logistics', 'cooking', 'shelter', 'first_aid'],
  landslide: ['search_rescue', 'logistics', 'shelter', 'first_aid'],
  earthquake: ['search_rescue', 'medical', 'shelter', 'counselling'],
  fire_house: ['shelter', 'logistics', 'counselling'],
  fire_forest: ['logistics', 'driving', 'first_aid'],
  glof: ['logistics', 'shelter', 'search_rescue'],
  epidemic: ['medical', 'logistics', 'counselling'],
  road_accident: ['first_aid', 'driving']
};
const DEFAULT_NEEDS: VolunteerSkill[] = ['logistics', 'first_aid'];

type Availability = VolunteerSignup['availability'];
const AVAILABILITY: { value: Availability; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'weekends', label: 'Weekends' }
];

export default function VolunteerPage() {
  const { incidents, language, addActivityLog } = usePortalStore();
  const { location } = useUserLocation();
  const volunteers = useVolunteers();
  const [selected, setSelected] = useState<Incident | null>(null);

  const openIncidents = useMemo(() => {
    const active = incidents.filter((i) => i.status === 'response_ongoing' || i.status === 'verified');
    const withKm = active.map((i) => ({
      ...i,
      distanceKm: location ? calculateDistanceKm(location.lat, location.lng, i.lat, i.lng) : null
    }));
    return withKm
      .sort((a, b) =>
        a.distanceKm !== null && b.distanceKm !== null
          ? a.distanceKm - b.distanceKm
          : new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      )
      .slice(0, 12);
  }, [incidents, location]);

  const countFor = (id: string) => volunteers.filter((v) => v.incidentId === id).length;

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold leading-tight text-text">Volunteer</h1>
        <p className="text-sm text-muted">
          Offer your help for an incident where response is still going on. The local disaster desk will contact
          you and tell you where and when to go.
        </p>
      </div>

      <div className="max-w-xl">
        <LocationPrompt />
      </div>

      {volunteers.length > 0 && (
        <p className="flex items-center gap-2 text-sm text-text">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
          You have offered to help with {volunteers.length} {volunteers.length === 1 ? 'incident' : 'incidents'}.
        </p>
      )}

      <section aria-label="Incidents that need help">
        <h2 className="mb-3 text-[15px] font-semibold text-text">
          {location ? 'Closest incidents needing help' : 'Incidents needing help'}
        </h2>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {openIncidents.map((inc) => {
            const info = HAZARD_INFO[inc.hazardType];
            const district = DISTRICTS.find((d) => d.id === inc.districtId);
            const needs = NEEDS[inc.hazardType] ?? DEFAULT_NEEDS;
            const signedUp = countFor(inc.id);
            const mine = volunteers.some((v) => v.incidentId === inc.id);
            return (
              <li key={inc.id} className="panel flex flex-col p-5">
                <p className="flex items-center gap-2 text-[13px] text-muted">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: info?.color }} aria-hidden />
                  {info?.label}, {district?.name}
                  {inc.distanceKm !== null && <span className="ml-auto tabular">{formatKm(inc.distanceKm)}</span>}
                </p>
                <Link href={`/incidents/${inc.id}`} className="mt-1.5 font-medium leading-snug text-text hover:text-accent">
                  {language === 'ne' && inc.titleNepali ? inc.titleNepali : inc.title}
                </Link>
                <p className="mt-0.5 text-[13px] text-muted">{inc.locationName}</p>

                <p className="mt-3 text-[13px] text-muted">Help needed with</p>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {needs.map((s) => (
                    <li key={s} className="rounded bg-page px-2 py-0.5 text-[13px] text-text">
                      {SKILL_LABELS[s]}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="flex items-center gap-1.5 text-[13px] text-muted">
                    <Users className="h-4 w-4" aria-hidden />
                    {signedUp === 0 ? 'No volunteers yet' : `${signedUp} offered`}
                  </span>
                  {mine ? (
                    <span className="text-sm font-medium text-emerald-700">You offered help</span>
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={() => setSelected(inc)}>
                      I can help
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <SignupDialog
        incident={selected}
        onClose={() => setSelected(null)}
        onSaved={(s) =>
          addActivityLog(
            'VOLUNTEER_SIGNUP',
            'incident',
            s.incidentId,
            `${s.name} offered help (${s.skills.map((k) => SKILL_LABELS[k]).join(', ')})`
          )
        }
      />
    </div>
  );
}

function SignupDialog({
  incident,
  onClose,
  onSaved
}: {
  incident: Incident | null;
  onClose: () => void;
  onSaved: (s: VolunteerSignup) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState<VolunteerSkill[]>([]);
  const [availability, setAvailability] = useState<Availability>('this_week');
  const [hasTransport, setHasTransport] = useState(false);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    onClose();
    setDone(false);
    setError('');
  };

  const toggleSkill = (s: VolunteerSkill) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;
    if (skills.length === 0) {
      setError('Choose at least one way you can help.');
      return;
    }
    const saved = saveVolunteer({
      incidentId: incident.id,
      name: name.trim(),
      phone: phone.trim(),
      skills,
      availability,
      hasTransport,
      note: note.trim() || undefined
    });
    onSaved(saved);
    setDone(true);
  };

  if (!incident) return null;

  if (done) {
    return (
      <Modal
        open
        onClose={close}
        title="Thank you"
        footer={
          <button type="button" className="btn btn-primary" onClick={close}>
            Done
          </button>
        }
      >
        <div className="space-y-3 text-sm text-text">
          <p>
            Your offer to help with <span className="font-medium">{incident.title}</span> has been sent to the
            local disaster desk.
          </p>
          <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-950">
            Please wait for their call before you travel. People arriving unannounced can block roads and rescue work.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={close}
      title="Offer your help"
      description={incident.title}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancel
          </button>
          <button type="submit" form="volunteer-form" className="btn btn-primary">
            Send offer
          </button>
        </>
      }
    >
      <form id="volunteer-form" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="v-name" className="field-label">Your name</label>
            <input id="v-name" required className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="v-phone" className="field-label">Phone number</label>
            <input
              id="v-phone"
              required
              type="tel"
              inputMode="tel"
              pattern="[0-9+\- ]{7,15}"
              className="field tabular"
              placeholder="98XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
        </div>

        <fieldset>
          <legend className="field-label">How can you help?</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SKILL_LABELS) as VolunteerSkill[]).map((s) => {
              const on = skills.includes(s);
              return (
                <label
                  key={s}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/30 ${
                    on ? 'border-accent bg-accent-soft text-text' : 'border-line text-text hover:border-[#c9ced6]'
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleSkill(s)} />
                  {SKILL_LABELS[s]}
                </label>
              );
            })}
          </div>
          {error && <p className="mt-1.5 text-[13px] text-crimson">{error}</p>}
        </fieldset>

        <fieldset>
          <legend className="field-label">When are you available?</legend>
          <div className="grid grid-cols-3 gap-2">
            {AVAILABILITY.map((a) => (
              <label
                key={a.value}
                className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/30 ${
                  availability === a.value ? 'border-accent bg-accent-soft' : 'border-line hover:border-[#c9ced6]'
                }`}
              >
                <input
                  type="radio"
                  name="availability"
                  className="sr-only"
                  checked={availability === a.value}
                  onChange={() => setAvailability(a.value)}
                />
                {a.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={hasTransport} onChange={(e) => setHasTransport(e.target.checked)} className="h-4 w-4 accent-[#1F4E8C]" />
          I have my own transport
        </label>

        <div>
          <label htmlFor="v-note" className="field-label">
            Anything else<span className="ml-1.5 font-normal text-muted">Optional</span>
          </label>
          <textarea
            id="v-note"
            rows={2}
            className="field resize-y"
            placeholder="Languages you speak, equipment you can bring"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
