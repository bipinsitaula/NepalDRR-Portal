import { AlertTone } from '@/data/alertThemes';

const DURATION_S = 8;
const VOLUME = 0.07;

/**
 * Plays an alert tone with the Web Audio API for a few seconds. Returns a stop
 * function. Silently does nothing where audio is unavailable or blocked.
 */
export function startSiren(tone: AlertTone): () => void {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return () => {};

  let ctx: AudioContext;
  try {
    ctx = new AudioContext();
  } catch {
    return () => {};
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tone.wave;
  osc.connect(gain).connect(ctx.destination);

  const start = ctx.currentTime + 0.05;
  const step = tone.stepMs / 1000;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(VOLUME, start + 0.05);

  if (tone.pattern === 'wail') {
    osc.frequency.setValueAtTime(tone.low, start);
    for (let t = start; t < start + DURATION_S; t += step) {
      osc.frequency.linearRampToValueAtTime(tone.high, t + step / 2);
      osc.frequency.linearRampToValueAtTime(tone.low, t + step);
    }
  } else {
    // Alternate between two pitches; a pitch of 0 means a silent gap, giving beeps.
    let high = true;
    for (let t = start; t < start + DURATION_S; t += step, high = !high) {
      const freq = high ? tone.high : tone.low;
      if (freq > 0) {
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(VOLUME, t);
      } else {
        gain.gain.setValueAtTime(0, t);
      }
    }
  }

  gain.gain.setValueAtTime(VOLUME, start + DURATION_S - 0.3);
  gain.gain.linearRampToValueAtTime(0, start + DURATION_S);
  osc.start(start);
  osc.stop(start + DURATION_S + 0.05);

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    try {
      osc.stop();
    } catch {}
    ctx.close().catch(() => {});
  };
}
