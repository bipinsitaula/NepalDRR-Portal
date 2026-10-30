import { HazardType } from '@/types';

/**
 * How the full-screen incoming-disaster alert looks and sounds for each kind of
 * disaster. Keys match the preparedness guide ids.
 */

export type AlertEffect = 'water' | 'debris' | 'shake' | 'embers' | 'lightning';

export interface AlertTone {
  /** 'wail' sweeps between the two frequencies; 'alternate' steps between them. */
  pattern: 'wail' | 'alternate';
  low: number;
  high: number;
  /** Length of one sweep or one step, in ms. */
  stepMs: number;
  wave: OscillatorType;
}

export interface AlertTheme {
  id: string;
  hazards: HazardType[];
  headline: string;
  /** What is happening, for drills (real alerts use the alert's own message). */
  situation: string;
  /** How soon, for drills. */
  timing: string;
  actions: string[];
  background: string;
  accent: string;
  effect: AlertEffect;
  tone: AlertTone;
  vibrate: number[];
  /** Earthquake drills count down to the shaking, like an early-warning system. */
  countdownSeconds?: number;
}

export const ALERT_THEMES: AlertTheme[] = [
  {
    id: 'flood',
    hazards: ['flood', 'glof'],
    headline: 'Flood warning',
    situation: 'The river has passed the danger level and is still rising.',
    timing: 'Low-lying areas may flood within 2 hours',
    actions: ['Move to higher ground now', 'Do not cross moving water', 'Take documents, medicines and water'],
    background: 'linear-gradient(180deg, #0b2a5b 0%, #0e3b7d 100%)',
    accent: '#7cc4ff',
    effect: 'water',
    tone: { pattern: 'wail', low: 520, high: 880, stepMs: 1600, wave: 'sine' },
    vibrate: [800, 400, 800, 400, 800]
  },
  {
    id: 'landslide',
    hazards: ['landslide', 'avalanche'],
    headline: 'Landslide danger',
    situation: 'Heavy rain has saturated the slopes above your area.',
    timing: 'Slides are likely tonight',
    actions: ['Move away from steep slopes', 'Go sideways out of the path, not downhill', 'Watch for cracks and muddy water'],
    background: 'linear-gradient(180deg, #3b2412 0%, #5c3a1c 100%)',
    accent: '#f2c48d',
    effect: 'debris',
    tone: { pattern: 'alternate', low: 330, high: 440, stepMs: 600, wave: 'triangle' },
    vibrate: [300, 200, 300, 200, 300, 200, 300]
  },
  {
    id: 'earthquake',
    hazards: ['earthquake'],
    headline: 'Earthquake',
    situation: 'Strong shaking detected nearby.',
    timing: 'Shaking expected in seconds',
    actions: ['Drop to your hands and knees', 'Cover under a sturdy table', 'Hold on until the shaking stops'],
    background: 'linear-gradient(180deg, #4a0d14 0%, #7a1220 100%)',
    accent: '#ffb4b4',
    effect: 'shake',
    tone: { pattern: 'alternate', low: 740, high: 990, stepMs: 180, wave: 'square' },
    vibrate: [200, 100, 200, 100, 200, 100, 200, 100, 200],
    countdownSeconds: 10
  },
  {
    id: 'fire',
    hazards: ['fire_house', 'fire_forest'],
    headline: 'Fire approaching',
    situation: 'A forest fire is spreading towards settlements on this side of the ridge.',
    timing: 'Could reach the area within 3 hours',
    actions: ['Prepare to leave early', 'Close windows and doors', 'Move gas cylinders away from the house'],
    background: 'linear-gradient(180deg, #3a1306 0%, #7c2d0b 100%)',
    accent: '#ffc27a',
    effect: 'embers',
    tone: { pattern: 'alternate', low: 880, high: 0, stepMs: 250, wave: 'square' },
    vibrate: [150, 100, 150, 100, 150, 100, 150]
  },
  {
    id: 'lightning',
    hazards: ['thunderbolt'],
    headline: 'Severe thunderstorm',
    situation: 'A thunderstorm with frequent lightning is moving into your area.',
    timing: 'Arriving within 30 minutes',
    actions: ['Go inside a solid building', 'Stay away from open fields and lone trees', 'Unplug electrical appliances'],
    background: 'linear-gradient(180deg, #1a1838 0%, #2e2a63 100%)',
    accent: '#c7c2ff',
    effect: 'lightning',
    tone: { pattern: 'wail', low: 600, high: 760, stepMs: 900, wave: 'sawtooth' },
    vibrate: [500, 300, 100, 100, 500]
  }
];

export function themeForHazard(hazard?: HazardType): AlertTheme {
  return ALERT_THEMES.find((t) => hazard && t.hazards.includes(hazard)) ?? ALERT_THEMES[0];
}
