'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPinned, MessageSquareText, HandHeart } from 'lucide-react';
import { usePortalStore } from '@/lib/store';

/** Bottom navigation on phones, with SOS raised in the centre. */
export const MobileTabBar: React.FC = () => {
  const pathname = usePathname();
  const { t } = usePortalStore();

  const tabs = [
    { href: '/', label: t.nav.dashboard, icon: Home },
    { href: '/near-me', label: t.nav.nearMe, icon: MapPinned },
    { href: '/sos', label: 'SOS', icon: null },
    { href: '/assistant', label: t.nav.assistant, icon: MessageSquareText },
    { href: '/volunteer', label: t.nav.volunteer, icon: HandHeart }
  ];

  return (
    <nav
      aria-label="Quick access"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          if (!tab.icon) {
            return (
              <li key={tab.href} className="flex justify-center">
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className="-mt-5 grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-crimson text-base font-bold tracking-wide text-white shadow-lg shadow-crimson/30"
                >
                  SOS
                </Link>
              </li>
            );
          }
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] ${
                  active ? 'font-medium text-accent' : 'text-muted'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
