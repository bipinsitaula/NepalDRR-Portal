'use client';

import React, { useState } from 'react';
import { Check, Phone } from 'lucide-react';
import { Modal } from './Modal';
import { HazardType } from '@/types';
import {
  PREP_GUIDES,
  PREP_STAGES,
  PrepStage,
  EMERGENCY_BAG,
  duringSteps,
  guideForHazard
} from '@/data/preparedness';

interface PreparednessModalProps {
  open: boolean;
  onClose: () => void;
  /** Hazard to open on, e.g. from an active alert. */
  hazard?: HazardType;
  /** Stage to open on; defaults to "when it's coming" if an alert is active, else "prepare now". */
  stage?: PrepStage;
  /** Opened from a practice drill rather than a real alert. */
  drill?: boolean;
}

export const PreparednessModal: React.FC<PreparednessModalProps> = ({ open, onClose, hazard, stage, drill }) => (
  <Modal
    open={open}
    onClose={onClose}
    title="Get ready"
    description={drill ? 'Practice drill: go through each stage as if it were real' : 'What to do before, during and after a disaster'}
    sheet
    footer={
      <>
        <a href="tel:1155" className="btn btn-secondary mr-auto">
          <Phone className="h-4 w-4" aria-hidden />
          Disaster helpline 1155
        </a>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </>
    }
  >
    <PreparednessContent initialGuide={guideForHazard(hazard).id} initialStage={stage ?? 'prepare'} />
  </Modal>
);

const CHECKS_KEY = 'nepaldrr_prep_checks';

function loadChecks(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(CHECKS_KEY) || '{}');
  } catch {
    return {};
  }
}

// Mounted only while the modal is open, so reading localStorage here never affects hydration.
function PreparednessContent({ initialGuide, initialStage }: { initialGuide: string; initialStage: PrepStage }) {
  const [guideId, setGuideId] = useState(initialGuide);
  const [stage, setStage] = useState<PrepStage>(initialStage);
  const [checks, setChecks] = useState<Record<string, boolean>>(loadChecks);

  const guide = PREP_GUIDES.find((g) => g.id === guideId) ?? PREP_GUIDES[0];
  const stageInfo = PREP_STAGES.find((s) => s.id === stage)!;

  const toggle = (key: string) =>
    setChecks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(CHECKS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const items = stage === 'during' ? duringSteps(guide.id) : guide[stage];
  const isChecklist = stage === 'prepare' || stage === 'warning';

  return (
    <div className="space-y-5">
      {/* Hazard */}
      <div role="tablist" aria-label="Type of disaster" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {PREP_GUIDES.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={g.id === guideId}
            onClick={() => setGuideId(g.id)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              g.id === guideId ? 'border-ink bg-ink text-white' : 'border-line text-text hover:border-[#c9ced6]'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Stage: a real sequence, so the steps are numbered */}
      <ol className="grid grid-cols-4 gap-1 rounded-lg bg-page p-1" aria-label="Stage">
        {PREP_STAGES.map((s, i) => {
          const active = s.id === stage;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setStage(s.id)}
                aria-current={active ? 'step' : undefined}
                className={`flex h-full w-full flex-col items-center rounded-md px-1 py-1.5 text-center text-xs leading-tight transition-colors ${
                  active ? 'bg-white font-medium text-text shadow-sm' : 'text-muted hover:text-text'
                }`}
              >
                <span className={`mb-0.5 text-[11px] tabular ${active ? 'text-accent' : ''}`}>{i + 1}</span>
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>

      <div>
        <h3 className="text-[15px] font-semibold text-text">
          {guide.label}: {stageInfo.label.toLowerCase()}
        </h3>
        <p className="text-[13px] text-muted">{stageInfo.hint}</p>

        {isChecklist ? (
          <Checklist
            items={items}
            keyPrefix={`${guide.id}:${stage}`}
            checks={checks}
            onToggle={toggle}
          />
        ) : (
          <ol className="mt-3 space-y-2.5">
            {items.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-text">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent tabular">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {stage === 'prepare' && (
        <div>
          <h3 className="text-[15px] font-semibold text-text">Emergency bag</h3>
          <p className="text-[13px] text-muted">Keep one bag ready by the door for each household.</p>
          <Checklist items={EMERGENCY_BAG} keyPrefix="bag" checks={checks} onToggle={toggle} />
        </div>
      )}
    </div>
  );
}

function Checklist({
  items,
  keyPrefix,
  checks,
  onToggle
}: {
  items: string[];
  keyPrefix: string;
  checks: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  const done = items.filter((_, i) => checks[`${keyPrefix}:${i}`]).length;
  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-page" aria-hidden>
          <div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
        <span className="text-xs text-muted tabular">
          {done} of {items.length} done
        </span>
      </div>
      <ul className="divide-y divide-line rounded-md border border-line">
        {items.map((item, i) => {
          const key = `${keyPrefix}:${i}`;
          const checked = !!checks[key];
          return (
            <li key={key}>
              <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-page has-[:focus-visible]:bg-accent-soft">
                <input type="checkbox" className="sr-only" checked={checked} onChange={() => onToggle(key)} />
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border transition-colors ${
                    checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-[#b9c0ca] bg-white'
                  }`}
                  aria-hidden
                >
                  {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <span className={`text-sm ${checked ? 'text-muted line-through decoration-muted/50' : 'text-text'}`}>
                  {item}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
