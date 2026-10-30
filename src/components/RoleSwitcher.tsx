'use client';

import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { UserRole } from '@/types';

const ROLES: { role: UserRole; label: string; desc: string }[] = [
  { role: 'public', label: 'Public', desc: 'View dashboards and maps' },
  { role: 'reporter', label: 'Reporter', desc: 'Report incidents and record damage' },
  { role: 'admin', label: 'Administrator', desc: 'Verify incidents, manage resources, issue alerts' }
];

/** Demo-only control for switching the simulated signed-in role. */
export const RoleSwitcher: React.FC = () => {
  const { currentUser, switchRole } = usePortalStore();
  const [open, setOpen] = useState(false);

  const current = ROLES.find((r) => r.role === currentUser.role) ?? ROLES[0];
  const initials = currentUser.fullName
    .replace(/^(Dr\.|Mr\.|Ms\.)\s*/, '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-md text-sm text-white/85 hover:bg-white/10 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-white/15 grid place-items-center text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden md:inline">{current.label}</span>
        <ChevronDown className="w-4 h-4 opacity-60" aria-hidden />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-lg bg-white text-text shadow-xl border border-line z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-line">
              <div className="text-sm font-medium">{currentUser.fullName}</div>
              <div className="text-[13px] text-muted truncate">{currentUser.organization}</div>
            </div>
            <div className="p-1.5">
              <p className="px-2.5 pt-1 pb-1.5 text-xs text-muted">Switch demo role</p>
              {ROLES.map((item) => {
                const selected = item.role === currentUser.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => {
                      switchRole(item.role);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-md flex items-start gap-2 transition-colors ${
                      selected ? 'bg-accent-soft' : 'hover:bg-page'
                    }`}
                  >
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 text-accent ${selected ? '' : 'invisible'}`} aria-hidden />
                    <span>
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block text-[13px] text-muted leading-snug">{item.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
