'use client';

import React from 'react';
import { Phone } from 'lucide-react';
import { usePortalStore } from '@/lib/store';

/** Thin utility strip for emergency numbers. */
export const DemoDataBadge: React.FC = () => {
  const { t } = usePortalStore();

  const helplines = [
    { label: t.helpline.neoc, tel: '1155', primary: true },
    { label: t.helpline.floodTollFree, tel: '1149' },
    { label: t.helpline.police, tel: '100' },
    { label: t.helpline.fire, tel: '101' },
    { label: t.helpline.ambulance, tel: '102' }
  ];

  return (
    <div className="bg-white border-b border-line text-[13px] text-muted">
      <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-end gap-4">
        <ul className="flex items-center gap-4 shrink-0">
          {helplines.map((h, i) => (
            <li key={h.tel} className={i === 0 ? '' : i === 1 ? 'hidden md:block' : 'hidden lg:block'}>
              <a
                href={`tel:${h.tel}`}
                className={`inline-flex items-center gap-1 hover:text-text ${h.primary ? 'font-medium text-crimson' : ''}`}
              >
                {h.primary && <Phone className="w-3.5 h-3.5" aria-hidden />}
                {h.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
