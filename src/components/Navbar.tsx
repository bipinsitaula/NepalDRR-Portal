'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Plus } from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { LocationSelector } from './LocationSelector';
import { RoleSwitcher } from './RoleSwitcher';

/** Two stacked pennants, after the national flag's silhouette. */
const BrandMark = () => (
  <svg viewBox="0 0 20 24" className="w-5 h-6" aria-hidden>
    <path d="M1 1 L18 11 H8 L18 23 H1 Z" fill="#C8102E" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { language, setLanguage, t, openReport } = usePortalStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t.nav.dashboard },
    { href: '/near-me', label: t.nav.nearMe },
    { href: '/incidents', label: t.nav.incidents },
    { href: '/alerts', label: t.nav.alerts },
    { href: '/realtime', label: t.nav.realtime },
    { href: '/risk-info', label: t.nav.riskInfo },
    { href: '/damage-loss', label: t.nav.damageLoss },
    { href: '/volunteer', label: t.nav.volunteer },
    { href: '/assistant', label: t.nav.assistant },
    { href: '/profile', label: t.nav.profile },
    { href: '/data', label: t.nav.dataApi },
    { href: '/admin', label: t.nav.admin }
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 bg-ink text-white">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-auto">
          <BrandMark />
          <span className="leading-tight">
            <span className="block font-semibold text-[15px]">{t.portalName}</span>
            <span className="hidden sm:block text-xs text-white/60">{t.portalSub}</span>
          </span>
        </Link>

        <div className="hidden md:block">
          <LocationSelector />
        </div>

        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
          className="h-9 px-2.5 rounded-md text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          lang={language === 'en' ? 'ne' : 'en'}
          aria-label={language === 'en' ? 'नेपालीमा हेर्नुहोस्' : 'View in English'}
        >
          {language === 'en' ? 'नेपाली' : 'English'}
        </button>

        <RoleSwitcher />

        <Link
          href="/sos"
          className="hidden lg:inline-flex btn h-9 px-3 border border-crimson/70 text-white hover:bg-crimson/20"
        >
          SOS
        </Link>

        <button type="button" onClick={openReport} className="btn btn-danger h-9 px-3">
          <Plus className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline">{t.nav.reportIncident}</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="lg:hidden h-9 w-9 grid place-items-center rounded-md hover:bg-white/10"
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <nav aria-label="Main" className="hidden lg:block border-t border-white/10">
        <ul className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
          {navLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative block px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                    active ? 'text-white font-medium' : 'text-white/65 hover:text-white'
                  }`}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-white" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-ink px-4 py-3 space-y-3">
          <div className="md:hidden">
            <LocationSelector />
          </div>
          <ul className="grid grid-cols-2 gap-1">
            {navLinks.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`block px-3 py-2 rounded-md text-sm ${
                      active ? 'bg-white/10 text-white font-medium' : 'text-white/75 hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
};
