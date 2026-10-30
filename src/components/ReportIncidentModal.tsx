'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, CheckCircle2, ImagePlus, MapPin } from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { LeafletMap } from '@/components/LeafletMap';
import { PROVINCES, DISTRICTS, MUNICIPALITIES, HAZARD_INFO } from '@/data/locations';
import { HazardType, IncidentPhoto, IncidentSeverity, IncidentStatus } from '@/types';

interface ReportIncidentModalProps {
  open: boolean;
  onClose: () => void;
}

type FormState = {
  title: string;
  titleNepali: string;
  hazardType: HazardType;
  severity: IncidentSeverity;
  provinceId: string;
  districtId: string;
  municipalityId: string;
  wardNumber: number;
  locationName: string;
  dateTime: string;
  source: string;
  deaths: number;
  injured: number;
  missing: number;
  housesDestroyed: number;
  housesDamaged: number;
  livestockLost: number;
  estimatedLossNpr: number;
  description: string;
  responseActions: string;
};

const SEVERITY_OPTIONS: { value: IncidentSeverity; label: string; hint: string }[] = [
  { value: 'minor', label: 'Minor', hint: 'Localised, little damage' },
  { value: 'moderate', label: 'Moderate', hint: 'Structural damage, few casualties' },
  { value: 'severe', label: 'Severe', hint: 'Many casualties or displacement' },
  { value: 'catastrophic', label: 'Catastrophic', hint: 'Widespread devastation' }
];

const IMPACT_FIELDS: { key: keyof FormState; label: string }[] = [
  { key: 'deaths', label: 'Deaths' },
  { key: 'injured', label: 'Injured' },
  { key: 'missing', label: 'Missing' },
  { key: 'livestockLost', label: 'Livestock lost' },
  { key: 'housesDestroyed', label: 'Houses destroyed' },
  { key: 'housesDamaged', label: 'Houses damaged' }
];

const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=800&q=80'
];

function initialForm(): FormState {
  return {
    title: '',
    titleNepali: '',
    hazardType: 'flood',
    severity: 'moderate',
    provinceId: 'p-3',
    districtId: 'd-spc',
    municipalityId: 'm-melamchi',
    wardNumber: 1,
    locationName: '',
    dateTime: new Date().toISOString().slice(0, 16),
    source: 'Ward DRR field desk',
    deaths: 0,
    injured: 0,
    missing: 0,
    housesDestroyed: 0,
    housesDamaged: 0,
    livestockLost: 0,
    estimatedLossNpr: 0,
    description: '',
    responseActions: ''
  };
}

/**
 * The incident report form, presented as a modal dialog. Uses the native
 * <dialog> element so focus trapping, Esc handling and the inert background
 * come from the browser.
 */
export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({ open, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Start on the first field rather than the close button
      dialog.querySelector<HTMLElement>('form select, form input')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="report-incident-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="flex h-full w-full items-stretch justify-center overflow-y-auto sm:p-6 sm:items-center">
        {/* Content mounts only while open so the form resets and the map sizes correctly */}
        {open && <ReportIncidentForm onClose={onClose} />}
      </div>
    </dialog>
  );
};

const ReportIncidentForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUser, addIncident } = usePortalStore();
  const [form, setForm] = useState<FormState>(initialForm);
  const [pin, setPin] = useState({ lat: 27.83, lng: 85.58 });
  const [photos, setPhotos] = useState<IncidentPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const districts = DISTRICTS.filter((d) => d.provinceId === form.provinceId);
  const municipalities = MUNICIPALITIES.filter((m) => m.districtId === form.districtId);

  const handleProvinceChange = (provinceId: string) => {
    const firstDistrict = DISTRICTS.find((d) => d.provinceId === provinceId);
    const firstMuni = firstDistrict ? MUNICIPALITIES.find((m) => m.districtId === firstDistrict.id) : undefined;
    setForm((prev) => ({
      ...prev,
      provinceId,
      districtId: firstDistrict?.id ?? '',
      municipalityId: firstMuni?.id ?? ''
    }));
    if (firstDistrict) setPin({ lat: firstDistrict.lat, lng: firstDistrict.lng });
  };

  const handleDistrictChange = (districtId: string) => {
    const district = DISTRICTS.find((d) => d.id === districtId);
    const firstMuni = MUNICIPALITIES.find((m) => m.districtId === districtId);
    setForm((prev) => ({ ...prev, districtId, municipalityId: firstMuni?.id ?? '' }));
    if (district) setPin({ lat: district.lat, lng: district.lng });
  };

  const handleAddPhoto = () => {
    setPhotos((prev) => [
      ...prev,
      {
        id: `photo-${Date.now()}`,
        url: SAMPLE_PHOTOS[prev.length % SAMPLE_PHOTOS.length],
        caption: `Field photo ${prev.length + 1}`
      }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const id = await addIncident({
        title: form.title.trim(),
        titleNepali: form.titleNepali.trim() || undefined,
        hazardType: form.hazardType,
        provinceId: form.provinceId,
        districtId: form.districtId,
        municipalityId: form.municipalityId,
        wardNumber: Number(form.wardNumber) || 1,
        locationName: form.locationName.trim(),
        lat: pin.lat,
        lng: pin.lng,
        dateTime: new Date(form.dateTime).toISOString(),
        status: (currentUser.role === 'admin' ? 'verified' : 'reported') as IncidentStatus,
        severity: form.severity,
        deaths: Number(form.deaths) || 0,
        injured: Number(form.injured) || 0,
        missing: Number(form.missing) || 0,
        housesDestroyed: Number(form.housesDestroyed) || 0,
        housesDamaged: Number(form.housesDamaged) || 0,
        livestockLost: Number(form.livestockLost) || 0,
        estimatedLossNpr: Number(form.estimatedLossNpr) || 0,
        description: form.description.trim(),
        responseActions: form.responseActions.trim() || undefined,
        source: form.source,
        reportedBy: currentUser.fullName,
        reporterRole: currentUser.role,
        photos
      });
      setCreatedId(id);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdId) {
    const verified = currentUser.role === 'admin';
    return (
      <div className="modal-card w-full max-w-md rounded-lg bg-white p-8 text-center shadow-2xl">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
        <h2 id="report-incident-title" className="mt-4 text-xl font-semibold text-text">
          Incident reported
        </h2>
        <p className="mt-2 text-sm text-muted">
          Saved as <span className="font-medium text-text tabular">{createdId}</span>.{' '}
          {verified
            ? 'It is marked verified because you are signed in as an administrator.'
            : 'An administrator will review and verify it.'}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setCreatedId(null);
              setForm(initialForm());
              setPhotos([]);
            }}
          >
            Report another
          </button>
          <Link href={`/incidents/${createdId}`} onClick={onClose} className="btn btn-primary">
            View incident
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="modal-card flex w-full max-w-3xl flex-col bg-white shadow-2xl h-full sm:h-auto sm:max-h-[calc(100vh-3rem)] sm:rounded-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
        <div>
          <h2 id="report-incident-title" className="text-lg font-semibold text-text">
            Report an incident
          </h2>
          <p className="text-[13px] text-muted">
            Reporting as {currentUser.fullName}, {currentUser.organization}
          </p>
        </div>
        <button type="button" onClick={onClose} className="btn btn-ghost -mr-2 p-2" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
        <Section title="What happened">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Hazard type" htmlFor="ri-hazard">
              <select
                id="ri-hazard"
                className="field"
                value={form.hazardType}
                onChange={(e) => set('hazardType', e.target.value as HazardType)}
              >
                {Object.entries(HAZARD_INFO).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date and time" htmlFor="ri-date">
              <input
                id="ri-date"
                type="datetime-local"
                required
                className="field"
                value={form.dateTime}
                onChange={(e) => set('dateTime', e.target.value)}
              />
            </Field>
          </div>

          <fieldset>
            <legend className="field-label">Severity</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SEVERITY_OPTIONS.map((opt) => {
                const checked = form.severity === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`cursor-pointer rounded-md border px-3 py-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/30 ${
                      checked ? 'border-accent bg-accent-soft' : 'border-line hover:border-[#c9ced6]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value={opt.value}
                      checked={checked}
                      onChange={() => set('severity', opt.value)}
                      className="sr-only"
                    />
                    <span className="block text-sm font-medium text-text">{opt.label}</span>
                    <span className="block text-xs text-muted leading-snug">{opt.hint}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Field label="Title" htmlFor="ri-title">
            <input
              id="ri-title"
              type="text"
              required
              className="field"
              placeholder="Flash flood along the Melamchi river"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>
          <Field label="Title in Nepali" htmlFor="ri-title-ne" optional>
            <input
              id="ri-title-ne"
              type="text"
              lang="ne"
              className="field"
              placeholder="मेलम्ची नदीमा आकस्मिक बाढी"
              value={form.titleNepali}
              onChange={(e) => set('titleNepali', e.target.value)}
            />
          </Field>
          <Field label="Description" htmlFor="ri-desc">
            <textarea
              id="ri-desc"
              required
              rows={4}
              className="field resize-y"
              placeholder="How it unfolded, which settlements are affected, what infrastructure failed"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Where">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Province" htmlFor="ri-prov">
              <select
                id="ri-prov"
                className="field"
                value={form.provinceId}
                onChange={(e) => handleProvinceChange(e.target.value)}
              >
                {PROVINCES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="District" htmlFor="ri-dist">
              <select
                id="ri-dist"
                className="field"
                value={form.districtId}
                onChange={(e) => handleDistrictChange(e.target.value)}
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Municipality" htmlFor="ri-muni">
              <select
                id="ri-muni"
                className="field"
                value={form.municipalityId}
                onChange={(e) => set('municipalityId', e.target.value)}
              >
                {municipalities.length === 0 && <option value="">No municipalities listed</option>}
                {municipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
            <Field label="Settlement or tole" htmlFor="ri-loc">
              <input
                id="ri-loc"
                type="text"
                required
                className="field"
                placeholder="Melamchi Bazaar, near the bridge"
                value={form.locationName}
                onChange={(e) => set('locationName', e.target.value)}
              />
            </Field>
            <Field label="Ward" htmlFor="ri-ward">
              <input
                id="ri-ward"
                type="number"
                min={1}
                max={35}
                className="field tabular"
                value={form.wardNumber}
                onChange={(e) => set('wardNumber', Number(e.target.value))}
              />
            </Field>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="field-label mb-0 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-crimson" aria-hidden />
                Click the map to place the pin
              </span>
              <span className="text-xs text-muted tabular">
                {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
              </span>
            </div>
            <LeafletMap
              height="260px"
              center={[pin.lat, pin.lng]}
              zoom={10}
              pinPickerMode
              selectedPin={pin}
              onPinSelect={setPin}
              className="overflow-hidden rounded-md border border-line"
            />
          </div>
        </Section>

        <Section title="Impact" description="Enter what is known now. Figures can be updated later.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {IMPACT_FIELDS.map(({ key, label }) => (
              <Field key={key} label={label} htmlFor={`ri-${key}`}>
                <input
                  id={`ri-${key}`}
                  type="number"
                  min={0}
                  className="field tabular"
                  value={form[key] as number}
                  onChange={(e) => set(key, Number(e.target.value) as never)}
                />
              </Field>
            ))}
          </div>
          <Field label="Estimated economic loss (NPR)" htmlFor="ri-loss">
            <input
              id="ri-loss"
              type="number"
              min={0}
              step={10000}
              className="field tabular sm:max-w-xs"
              value={form.estimatedLossNpr}
              onChange={(e) => set('estimatedLossNpr', Number(e.target.value))}
            />
          </Field>
          <Field label="Response so far" htmlFor="ri-resp" optional>
            <textarea
              id="ri-resp"
              rows={2}
              className="field resize-y"
              placeholder="40 families sheltered at the school; army boats deployed"
              value={form.responseActions}
              onChange={(e) => set('responseActions', e.target.value)}
            />
          </Field>
          <Field label="Source of information" htmlFor="ri-src">
            <input
              id="ri-src"
              type="text"
              className="field"
              value={form.source}
              onChange={(e) => set('source', e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Photos" optional>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.url}
                alt={p.caption}
                className="aspect-[4/3] w-full rounded-md border border-line object-cover"
              />
            ))}
            <button
              type="button"
              onClick={handleAddPhoto}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#c9ced6] text-sm text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <ImagePlus className="h-5 w-5" aria-hidden />
              Add photo
            </button>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-line bg-page/60 px-6 py-3 sm:rounded-b-lg">
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn btn-danger">
          {isSubmitting ? 'Submitting…' : 'Submit report'}
        </button>
      </div>
    </form>
  );
};

const Section: React.FC<{
  title: string;
  description?: string;
  optional?: boolean;
  children: React.ReactNode;
}> = ({ title, description, optional, children }) => (
  <section className="space-y-4">
    <div>
      <h3 className="text-[15px] font-semibold text-text">
        {title}
        {optional && <span className="ml-1.5 text-[13px] font-normal text-muted">Optional</span>}
      </h3>
      {description && <p className="text-[13px] text-muted">{description}</p>}
    </div>
    {children}
  </section>
);

const Field: React.FC<{
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}> = ({ label, htmlFor, optional, children }) => (
  <div>
    <label htmlFor={htmlFor} className="field-label">
      {label}
      {optional && <span className="ml-1.5 font-normal text-muted">Optional</span>}
    </label>
    {children}
  </div>
);
