'use client';

import { useSyncExternalStore } from 'react';
import { VolunteerSignup } from '@/types';

/*
 * Volunteer sign-ups, persisted to localStorage. Uses useSyncExternalStore with
 * an empty server snapshot so the server render and first client render match.
 */

const KEY = 'nepaldrr_volunteers';
const EMPTY: VolunteerSignup[] = [];
const listeners = new Set<() => void>();
let cache: VolunteerSignup[] | undefined;

function read(): VolunteerSignup[] {
  if (cache === undefined) {
    try {
      cache = JSON.parse(localStorage.getItem(KEY) || '[]') as VolunteerSignup[];
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useVolunteers() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function saveVolunteer(data: Omit<VolunteerSignup, 'id' | 'createdAt'>): VolunteerSignup {
  const signup: VolunteerSignup = { ...data, id: `vol-${Date.now()}`, createdAt: new Date().toISOString() };
  cache = [signup, ...read()];
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  listeners.forEach((l) => l());
  return signup;
}
