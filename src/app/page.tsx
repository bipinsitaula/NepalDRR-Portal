'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { usePortalStore } from '@/lib/store';
import { LeafletMap, MapMarker } from '@/components/LeafletMap';
import { DISTRICTS, PROVINCES, MUNICIPALITIES, HAZARD_INFO } from '@/data/locations';

const CHART = {
  primary: '#1F4E8C',
  secondary: '#7FA3D1',
  danger: '#C8102E',
  grid: '#E2E5EA',
  axis: '#5E6878'
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#fff',
    border: '1px solid #E2E5EA',
    borderRadius: 6,
    fontSize: 13,
    boxShadow: '0 6px 16px -6px rgb(19 33 58 / 0.2)'
  },
  labelStyle: { color: '#1A2233', fontWeight: 600 }
};

const axisProps = { stroke: CHART.axis, fontSize: 12, tickLine: false, axisLine: false } as const;

const MONTHS = [
  { en: 'Jan', ne: 'माघ' },
  { en: 'Feb', ne: 'फागुन' },
  { en: 'Mar', ne: 'चैत' },
  { en: 'Apr', ne: 'वैशाख' },
  { en: 'May', ne: 'जेठ' },
  { en: 'Jun', ne: 'असार' },
  { en: 'Jul', ne: 'साउन' },
  { en: 'Aug', ne: 'भदौ' },
  { en: 'Sep', ne: 'असोज' },
  { en: 'Oct', ne: 'कार्तिक' },
  { en: 'Nov', ne: 'मंसिर' },
  { en: 'Dec', ne: 'पुस' }
];

function formatNpr(val: number) {
  if (val >= 10000000) return `Rs ${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `Rs ${(val / 100000).toFixed(1)} Lakh`;
  return `Rs ${val.toLocaleString('en-IN')}`;
}

export default function DashboardPage() {
  const { filteredIncidents, filters, setFilters, language, t, openReport } = usePortalStore();

  const kpis = useMemo(
    () =>
      filteredIncidents.reduce(
        (acc, inc) => {
          acc.total += 1;
          acc.deaths += inc.deaths || 0;
          acc.injured += inc.injured || 0;
          acc.missing += inc.missing || 0;
          acc.destroyed += inc.housesDestroyed || 0;
          acc.damaged += inc.housesDamaged || 0;
          acc.livestock += inc.livestockLost || 0;
          acc.loss += inc.estimatedLossNpr || 0;
          return acc;
        },
        { total: 0, deaths: 0, injured: 0, missing: 0, destroyed: 0, damaged: 0, livestock: 0, loss: 0 }
      ),
    [filteredIncidents]
  );

  const yearlyTrendData = useMemo(() => {
    const years = ['2022', '2023', '2024', '2025', '2026'];
    const counts = Object.fromEntries(years.map((y) => [y, { year: y, count: 0, deaths: 0 }]));
    filteredIncidents.forEach((inc) => {
      const yr = new Date(inc.dateTime).getFullYear().toString();
      if (counts[yr]) {
        counts[yr].count += 1;
        counts[yr].deaths += inc.deaths || 0;
      }
    });
    return Object.values(counts);
  }, [filteredIncidents]);

  const hazardTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredIncidents.forEach((inc) => {
      counts[inc.hazardType] = (counts[inc.hazardType] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([hazard, count]) => {
        const info = HAZARD_INFO[hazard];
        return {
          name: language === 'ne' ? info?.labelNepali || hazard : info?.label || hazard,
          count,
          color: info?.color || CHART.primary
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [filteredIncidents, language]);

  const topDistrictsData = useMemo(() => {
    const byDistrict: Record<string, number> = {};
    filteredIncidents.forEach((inc) => {
      byDistrict[inc.districtId] = (byDistrict[inc.districtId] || 0) + 1;
    });
    return Object.entries(byDistrict)
      .map(([dId, incidents]) => {
        const dist = DISTRICTS.find((d) => d.id === dId);
        return { district: dist ? (language === 'ne' ? dist.nameNepali : dist.name) : dId, incidents };
      })
      .sort((a, b) => b.incidents - a.incidents)
      .slice(0, 8);
  }, [filteredIncidents, language]);

  const seasonalityData = useMemo(() => {
    const all = Array(12).fill(0);
    const floods = Array(12).fill(0);
    filteredIncidents.forEach((inc) => {
      const m = new Date(inc.dateTime).getMonth();
      all[m] += 1;
      if (inc.hazardType === 'flood') floods[m] += 1;
    });
    return MONTHS.map((m, i) => ({
      month: language === 'ne' ? m.ne : m.en,
      allIncidents: all[i],
      floods: floods[i]
    }));
  }, [filteredIncidents, language]);

  const mapMarkers: MapMarker[] = useMemo(
    () =>
      filteredIncidents.slice(0, 75).map((inc) => {
        const info = HAZARD_INFO[inc.hazardType];
        return {
          id: inc.id,
          lat: inc.lat,
          lng: inc.lng,
          title: language === 'ne' && inc.titleNepali ? inc.titleNepali : inc.title,
          subtitle: `${inc.locationName}, ${new Date(inc.dateTime).toLocaleDateString()}`,
          category: info?.label || inc.hazardType,
          color: info?.color || CHART.primary,
          badgeText: inc.severity === 'catastrophic' ? '!' : '●'
        };
      }),
    [filteredIncidents, language]
  );

  const latestIncidents = useMemo(
    () =>
      [...filteredIncidents]
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
        .slice(0, 6),
    [filteredIncidents]
  );

  const scopeName = (() => {
    const pick = (x?: { name: string; nameNepali: string }) => (x ? (language === 'ne' ? x.nameNepali : x.name) : null);
    return (
      pick(MUNICIPALITIES.find((m) => m.id === filters.municipalityId)) ??
      pick(DISTRICTS.find((d) => d.id === filters.districtId)) ??
      pick(PROVINCES.find((p) => p.id === filters.provinceId)) ??
      (language === 'ne' ? 'सम्पूर्ण नेपाल' : 'All of Nepal')
    );
  })();

  const people = [
    { label: t.kpi.deaths, value: kpis.deaths, emphasis: true },
    { label: t.kpi.injured, value: kpis.injured },
    { label: t.kpi.missing, value: kpis.missing }
  ];
  const property = [
    { label: t.kpi.housesDestroyed, value: kpis.destroyed },
    { label: t.kpi.housesDamaged, value: kpis.damaged },
    { label: t.kpi.livestockLost, value: kpis.livestock },
    { label: t.kpi.economicLoss, value: formatNpr(kpis.loss) }
  ];

  return (
    <div className="space-y-6">
      {/* On phones, emergency help comes before the statistics */}
      <section aria-label="Emergency help" className="lg:hidden rounded-lg bg-ink p-4 text-white">
        <div className="flex items-center gap-4">
          <Link
            href="/sos"
            className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-crimson text-xl font-bold tracking-wide shadow-lg shadow-black/30"
          >
            SOS
          </Link>
          <div className="min-w-0">
            <p className="font-semibold">Need help now?</p>
            <p className="text-[13px] text-white/75">Call police, ambulance or fire, and share your location.</p>
            <div className="mt-2 flex gap-3 text-[13px]">
              <Link href="/near-me" className="underline underline-offset-2">Near me</Link>
              <Link href="/assistant" className="underline underline-offset-2">What should I do?</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text leading-tight">{scopeName}</h1>
          <p className="text-sm text-muted">
            {kpis.total.toLocaleString('en-IN')} {t.kpi.totalIncidents.toLowerCase()} recorded, 2022 to 2026
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="dash-from" className="sr-only">From</label>
            <input
              id="dash-from"
              type="date"
              className="field w-auto py-1.5"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <span className="pb-2 text-sm text-muted">to</span>
          <div>
            <label htmlFor="dash-to" className="sr-only">To</label>
            <input
              id="dash-to"
              type="date"
              className="field w-auto py-1.5"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="dash-hazard" className="sr-only">Hazard</label>
            <select
              id="dash-hazard"
              className="field w-auto py-1.5"
              value={filters.hazardType}
              onChange={(e) => setFilters((prev) => ({ ...prev, hazardType: e.target.value }))}
            >
              <option value="all">All hazards</option>
              {Object.entries(HAZARD_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {language === 'ne' ? info.labelNepali : info.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Impact summary: people first, then property */}
      <section aria-label="Impact summary" className="panel grid grid-cols-1 lg:grid-cols-[3fr_4fr] lg:divide-x divide-line">
        <dl className="grid grid-cols-3 divide-x divide-line">
          {people.map((s) => (
            <div key={s.label} className="px-5 py-4">
              <dt className="text-[13px] text-muted">{s.label}</dt>
              <dd className={`mt-0.5 text-3xl font-semibold tabular leading-tight ${s.emphasis ? 'text-crimson' : 'text-text'}`}>
                {s.value.toLocaleString('en-IN')}
              </dd>
            </div>
          ))}
        </dl>
        <dl className="grid grid-cols-2 sm:grid-cols-4 border-t lg:border-t-0 border-line divide-x divide-line">
          {property.map((s) => (
            <div key={s.label} className="px-5 py-4">
              <dt className="text-[13px] text-muted">{s.label}</dt>
              <dd className="mt-1.5 text-xl font-semibold text-text tabular leading-tight">
                {typeof s.value === 'number' ? s.value.toLocaleString('en-IN') : s.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Map and latest incidents */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <section className="panel lg:col-span-2 overflow-hidden">
          <div className="panel-header">
            <h2 className="panel-title">Incident map</h2>
            <span className="panel-sub">Latest {mapMarkers.length} shown</span>
          </div>
          <LeafletMap markers={mapMarkers} height="460px" showLegend />
        </section>

        <section className="panel flex flex-col">
          <div className="panel-header">
            <h2 className="panel-title">Latest incidents</h2>
            <Link href="/incidents" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>

          {latestIncidents.length === 0 ? (
            <p className="flex-1 px-5 py-8 text-sm text-muted">No incidents match these filters.</p>
          ) : (
            <ul className="flex-1 divide-y divide-line border-t border-line">
              {latestIncidents.map((inc) => {
                const info = HAZARD_INFO[inc.hazardType];
                return (
                  <li key={inc.id}>
                    <Link href={`/incidents/${inc.id}`} className="flex gap-3 px-5 py-3 hover:bg-page transition-colors">
                      <span
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: info?.color || CHART.primary }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-text">
                          {language === 'ne' && inc.titleNepali ? inc.titleNepali : inc.title}
                        </span>
                        <span className="block truncate text-[13px] text-muted">
                          {info?.label ?? inc.hazardType}, {inc.locationName}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-[13px] text-muted tabular">
                        {new Date(inc.dateTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {inc.deaths > 0 && <span className="block text-crimson">{inc.deaths} dead</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-line p-4">
            <button type="button" onClick={openReport} className="btn btn-secondary w-full">
              Report an incident
            </button>
          </div>
        </section>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartPanel title={t.charts.seasonality} description="Most incidents fall in the June to September monsoon.">
          <AreaChart data={seasonalityData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="month" {...axisProps} />
            <YAxis {...axisProps} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
            <Area type="monotone" dataKey="allIncidents" name="All incidents" stroke={CHART.primary} fill={CHART.primary} fillOpacity={0.12} strokeWidth={2} />
            <Area type="monotone" dataKey="floods" name="Floods" stroke={CHART.secondary} fill={CHART.secondary} fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ChartPanel>

        <ChartPanel title={t.charts.incidentsOverTime} description="Incident count and deaths per year.">
          <LineChart data={yearlyTrendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="year" {...axisProps} />
            <YAxis {...axisProps} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
            <Line type="monotone" dataKey="count" name="Incidents" stroke={CHART.primary} strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="deaths" name="Deaths" stroke={CHART.danger} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ChartPanel>

        <ChartPanel title={t.charts.incidentsByHazard} description="Share of incidents by hazard type.">
          <PieChart>
            <Pie data={hazardTypeData} dataKey="count" nameKey="name" cx="50%" cy="45%" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="#fff">
              {hazardTypeData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ChartPanel>

        <ChartPanel title={t.charts.topDistricts} description="Districts with the most recorded incidents.">
          <BarChart data={topDistrictsData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke={CHART.grid} />
            <XAxis type="number" {...axisProps} allowDecimals={false} />
            <YAxis dataKey="district" type="category" {...axisProps} stroke="#1A2233" width={96} />
            <Tooltip {...tooltipStyle} cursor={{ fill: '#F4F5F7' }} />
            <Bar dataKey="incidents" name="Incidents" fill={CHART.primary} radius={[0, 3, 3, 0]} barSize={14} />
          </BarChart>
        </ChartPanel>
      </div>
    </div>
  );
}

function ChartPanel({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactElement;
}) {
  return (
    <section className="panel">
      <div className="panel-header pb-1 block">
        <h2 className="panel-title">{title}</h2>
        <p className="panel-sub">{description}</p>
      </div>
      <div className="h-64 px-3 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
