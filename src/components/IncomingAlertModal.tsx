'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Waves, Mountain, Activity, Flame, CloudLightning, Volume2, VolumeX, Phone, ListChecks } from 'lucide-react';
import { AlertTheme, AlertEffect } from '@/data/alertThemes';
import { DisasterAlert } from '@/types';
import { startSiren } from '@/lib/siren';

const ICONS: Record<string, React.ElementType> = {
  flood: Waves,
  landslide: Mountain,
  earthquake: Activity,
  fire: Flame,
  lightning: CloudLightning
};

interface IncomingAlertModalProps {
  open: boolean;
  theme: AlertTheme;
  /** Present for a real alert; absent for a practice drill. */
  alert?: DisasterAlert;
  areaName?: string;
  onClose: () => void;
  onGetReady: () => void;
}

/**
 * Full-screen incoming-disaster alert, in the style of a phone emergency
 * broadcast. Each disaster type has its own colours, motion and tone.
 */
export const IncomingAlertModal: React.FC<IncomingAlertModalProps> = (props) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (props.open && !dialog.open) dialog.showModal();
    if (!props.open && dialog.open) dialog.close();
  }, [props.open]);

  return (
    <dialog
      ref={ref}
      className="modal incoming-alert"
      role="alertdialog"
      aria-labelledby="incoming-alert-title"
      aria-describedby="incoming-alert-situation"
      onCancel={(e) => {
        e.preventDefault();
        props.onClose();
      }}
    >
      {/* Remounts per open so the countdown, sound and effects start fresh */}
      {props.open && <AlertScreen key={props.theme.id} {...props} />}
    </dialog>
  );
};

function AlertScreen({ theme, alert, areaName, onClose, onGetReady }: IncomingAlertModalProps) {
  const isDrill = !alert;
  const Icon = ICONS[theme.id] ?? Activity;
  const countdownFrom = isDrill ? theme.countdownSeconds : undefined;
  const [secondsLeft, setSecondsLeft] = useState(countdownFrom ?? 0);
  const [muted, setMuted] = useState(false);
  const getReadyRef = useRef<HTMLButtonElement>(null);
  const shaking = theme.effect === 'shake' && secondsLeft === 0;

  useEffect(() => {
    getReadyRef.current?.focus();
    try {
      navigator.vibrate?.(theme.vibrate);
    } catch {}
  }, [theme]);

  useEffect(() => {
    if (muted) return;
    return startSiren(theme.tone);
  }, [theme, muted]);

  useEffect(() => {
    if (!countdownFrom) return;
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [countdownFrom]);

  const headline = alert ? alert.title : theme.headline;
  const situation = alert ? alert.message : theme.situation;
  const actions = alert ? [alert.instruction, ...theme.actions.slice(0, 2)] : theme.actions;

  return (
    <div className="flex h-full w-full items-stretch justify-center sm:items-center sm:p-6">
      <div
        className={`modal-card relative flex w-full max-w-md flex-col overflow-hidden text-white shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:rounded-2xl ${
          shaking ? 'alert-shake' : ''
        }`}
        style={{ background: theme.background }}
      >
        <EffectLayer effect={theme.effect} accent={theme.accent} />

        <div className="relative flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-5">
          <div className="flex items-center justify-between gap-3">
            {isDrill ? (
              <span className="rounded-full border border-dashed border-white/60 px-3 py-1 text-xs font-medium">
                Practice drill. Not a real alert.
              </span>
            ) : (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">Emergency alert</span>
            )}
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label={muted ? 'Turn alert sound on' : 'Turn alert sound off'}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <span
              className="alert-icon grid h-16 w-16 shrink-0 place-items-center rounded-full"
              style={{ backgroundColor: `${theme.accent}26`, color: theme.accent }}
            >
              <Icon className="h-8 w-8" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id="incoming-alert-title" className={`font-bold leading-tight ${headline.length > 32 ? 'text-2xl' : 'text-3xl'}`}>
                {headline}
              </h2>
              <p className="text-sm text-white/75">
                For {areaName ?? 'your area'}
              </p>
            </div>
          </div>

          <p id="incoming-alert-situation" className="mt-5 text-[15px] leading-relaxed text-white/90">
            {situation}
          </p>

          {countdownFrom ? (
            <div className="mt-4 rounded-xl bg-black/25 px-4 py-3" aria-live="assertive">
              {secondsLeft > 0 ? (
                <p className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tabular" style={{ color: theme.accent }}>
                    {secondsLeft}
                  </span>
                  <span className="text-sm text-white/85">seconds until shaking</span>
                </p>
              ) : (
                <p className="text-xl font-bold" style={{ color: theme.accent }}>
                  Shaking now. Drop, cover, hold on.
                </p>
              )}
            </div>
          ) : (
            !alert && (
              <p className="mt-4 inline-flex self-start rounded-full bg-black/25 px-3 py-1.5 text-sm" style={{ color: theme.accent }}>
                {theme.timing}
              </p>
            )
          )}

          <div className="mt-6">
            <p className="text-sm font-semibold text-white/80">Do this now</p>
            <ol className="mt-2 space-y-2">
              {actions.map((a, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-snug">
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-black/80 tabular"
                    style={{ backgroundColor: theme.accent }}
                  >
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{a}</span>
                </li>
              ))}
            </ol>
          </div>

          {alert && <p className="mt-5 text-xs text-white/60">Issued by {alert.issuedBy}</p>}

          <div className="mt-auto space-y-2 pt-8">
            <button
              ref={getReadyRef}
              type="button"
              onClick={onGetReady}
              className="btn w-full bg-white py-3 text-base font-semibold text-ink hover:bg-white/90"
            >
              <ListChecks className="h-5 w-5" aria-hidden />
              Get ready
            </button>
            <div className="grid grid-cols-2 gap-2">
              <a href="tel:1155" className="btn border border-white/40 py-2.5 text-white hover:bg-white/10">
                <Phone className="h-4 w-4" aria-hidden />
                Call 1155
              </a>
              <button type="button" onClick={onClose} className="btn border border-white/40 py-2.5 text-white hover:bg-white/10">
                {isDrill ? 'End practice' : 'I’m safe'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Decorative motion behind the content, different for each disaster. */
function EffectLayer({ effect, accent }: { effect: AlertEffect; accent: string }) {
  switch (effect) {
    case 'water':
      return (
        <div className="fx-water pointer-events-none absolute inset-x-0 bottom-0" aria-hidden>
          <svg className="fx-wave absolute -top-5 left-0 h-6 w-[200%]" viewBox="0 0 1200 24" preserveAspectRatio="none">
            <path d="M0 12 Q 75 0 150 12 T 300 12 T 450 12 T 600 12 T 750 12 T 900 12 T 1050 12 T 1200 12 V24 H0 Z" fill={`${accent}33`} />
          </svg>
          <div className="h-full w-full" style={{ backgroundColor: `${accent}33` }} />
        </div>
      );
    case 'debris':
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {DEBRIS.map((d, i) => (
            <span
              key={i}
              className="fx-debris absolute -top-6 rounded-sm"
              style={{
                left: `${d.x}%`,
                width: d.size,
                height: d.size,
                backgroundColor: `${accent}55`,
                animationDelay: `${d.delay}s`,
                animationDuration: `${d.dur}s`
              }}
            />
          ))}
        </div>
      );
    case 'shake':
      return (
        <svg className="pointer-events-none absolute inset-x-0 bottom-44 h-24 w-full opacity-30" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden>
          <polyline
            className="fx-seismo"
            fill="none"
            stroke={accent}
            strokeWidth="2"
            points="0,50 40,50 50,30 60,72 70,20 80,82 90,38 100,60 110,50 160,50 170,10 180,92 190,25 200,78 210,40 220,58 230,50 280,50 290,35 300,66 310,45 320,52 400,50"
          />
        </svg>
      );
    case 'embers':
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="fx-glow absolute inset-x-0 bottom-0 h-1/2" style={{ background: `linear-gradient(0deg, ${accent}55, transparent)` }} />
          {EMBERS.map((e, i) => (
            <span
              key={i}
              className="fx-ember absolute bottom-0 rounded-full"
              style={{
                left: `${e.x}%`,
                width: e.size,
                height: e.size,
                backgroundColor: accent,
                animationDelay: `${e.delay}s`,
                animationDuration: `${e.dur}s`
              }}
            />
          ))}
        </div>
      );
    case 'lightning':
      return (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="fx-rain absolute inset-0 opacity-25" />
          <div className="fx-flash absolute inset-0 bg-white" />
        </div>
      );
  }
}

// Fixed positions keep the effects identical between renders.
const DEBRIS = [
  { x: 8, size: 6, delay: 0, dur: 2.4 },
  { x: 22, size: 10, delay: 0.8, dur: 3 },
  { x: 37, size: 5, delay: 1.6, dur: 2.2 },
  { x: 51, size: 8, delay: 0.4, dur: 2.8 },
  { x: 66, size: 12, delay: 1.2, dur: 3.2 },
  { x: 79, size: 6, delay: 2, dur: 2.5 },
  { x: 91, size: 9, delay: 0.6, dur: 2.9 }
];

const EMBERS = [
  { x: 6, size: 4, delay: 0, dur: 3.5 },
  { x: 18, size: 3, delay: 1.2, dur: 4 },
  { x: 31, size: 5, delay: 0.5, dur: 3.2 },
  { x: 45, size: 3, delay: 2, dur: 4.4 },
  { x: 58, size: 4, delay: 0.9, dur: 3.6 },
  { x: 72, size: 5, delay: 1.7, dur: 3.9 },
  { x: 86, size: 3, delay: 0.3, dur: 4.2 },
  { x: 94, size: 4, delay: 2.4, dur: 3.4 }
];
