import type { Metadata } from 'next';
import Link from 'next/link';
import { Mukta } from 'next/font/google';
import './globals.css';
import { PortalStoreProvider } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { DemoDataBadge } from '@/components/DemoDataBadge';
import { AlertBanner } from '@/components/AlertBanner';
import { GlobalReportModal } from '@/components/GlobalReportModal';
import { MobileTabBar } from '@/components/MobileTabBar';
import { IncomingAlertWatcher } from '@/components/IncomingAlertWatcher';

// Mukta covers both Latin and Devanagari, so English and Nepali views share one typeface.
const mukta = Mukta({
  subsets: ['latin', 'devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mukta',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'NepalDRR Portal • Disaster Information Management System',
  description:
    'National disaster risk reduction and management decision-support platform for Nepal. Real-time multi-hazard tracking, hydro-met stations, damage analytics, and emergency resources.',
  keywords: [
    'Nepal DRR',
    'Disaster Information Management',
    'NDRRMA',
    'Nepal Flood Warning',
    'Nepal Earthquake',
    'Landslide Risk',
    'Open Data Nepal'
  ]
};

const FOOTER_LINKS = [
  { href: '/data', label: 'Open data and API' },
  { href: '/realtime', label: 'Live feeds' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/admin', label: 'Admin' }
];

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: browser extensions commonly inject attributes onto <html>
    <html lang="en" className={mukta.variable} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col">
        <PortalStoreProvider>
          <DemoDataBadge />
          <Navbar />
          <AlertBanner />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">{children}</main>

          <footer className="border-t border-line bg-white text-[13px] text-muted pb-20 lg:pb-0">
            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="font-medium text-text">NepalDRR Portal</p>
                <p>Disaster information management system. Figures shown are demo data.</p>
              </div>
              <nav aria-label="Footer">
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                  {FOOTER_LINKS.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="hover:text-text">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </footer>

          <MobileTabBar />
          <IncomingAlertWatcher />
          <GlobalReportModal />
        </PortalStoreProvider>
      </body>
    </html>
  );
}
