'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingDown,
  Printer,
  Download,
  Calendar,
  Building2,
  Home,
  HeartPulse,
  UserX,
  Users,
  Wheat,
  IndianRupee,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { usePortalStore } from '@/lib/store';
import { downloadCsv } from '@/lib/exportCsv';
import { LeafletMap, MapMarker } from '@/components/LeafletMap';
import { DISTRICTS, PROVINCES, HAZARD_INFO } from '@/data/locations';
import { KpiCard } from '@/components/KpiCard';

export default function DamageLossPage() {
  const { filteredIncidents, language, t } = usePortalStore();

  const [compareYear, setCompareYear] = useState<number>(2025);
  const [baselineYear, setBaselineYear] = useState<number>(2024);
  const [selectedHazard, setSelectedHazard] = useState<string>('all');
  const [breakdownTab, setBreakdownTab] = useState<'district' | 'province' | 'hazard'>('district');

  // Aggregated Total Damages
  const summary = useMemo(() => {
    return filteredIncidents.reduce(
      (acc, inc) => {
        acc.deaths += inc.deaths || 0;
        acc.injured += inc.injured || 0;
        acc.missing += inc.missing || 0;
        acc.destroyed += inc.housesDestroyed || 0;
        acc.damaged += inc.housesDamaged || 0;
        acc.livestock += inc.livestockLost || 0;
        acc.economicLoss += inc.estimatedLossNpr || 0;
        return acc;
      },
      {
        deaths: 0,
        injured: 0,
        missing: 0,
        destroyed: 0,
        damaged: 0,
        livestock: 0,
        economicLoss: 0
      }
    );
  }, [filteredIncidents]);

  // Year vs Year Comparison Data
  const comparisonData = useMemo(() => {
    const hazards = Object.keys(HAZARD_INFO);
    return hazards
      .map((hKey) => {
        const info = HAZARD_INFO[hKey];
        const year1Incidents = filteredIncidents.filter(
          (inc) =>
            new Date(inc.dateTime).getFullYear() === compareYear &&
            (selectedHazard === 'all' || inc.hazardType === selectedHazard) &&
            inc.hazardType === hKey
        );
        const year2Incidents = filteredIncidents.filter(
          (inc) =>
            new Date(inc.dateTime).getFullYear() === baselineYear &&
            (selectedHazard === 'all' || inc.hazardType === selectedHazard) &&
            inc.hazardType === hKey
        );

        const loss1 = year1Incidents.reduce((s, i) => s + (i.estimatedLossNpr || 0), 0) / 1000000;
        const loss2 = year2Incidents.reduce((s, i) => s + (i.estimatedLossNpr || 0), 0) / 1000000;

        return {
          hazard: info?.label || hKey,
          [`Year ${compareYear}`]: Number(loss1.toFixed(2)),
          [`Year ${baselineYear}`]: Number(loss2.toFixed(2))
        };
      })
      .filter((item) => (item as any)[`Year ${compareYear}`] > 0 || (item as any)[`Year ${baselineYear}`] > 0);
  }, [filteredIncidents, compareYear, baselineYear, selectedHazard]);

  // District Aggregations for Choropleth-style Map
  const districtLossStats = useMemo(() => {
    const distMap: Record<
      string,
      {
        id: string;
        name: string;
        nameNepali: string;
        lat: number;
        lng: number;
        loss: number;
        deaths: number;
        destroyed: number;
      }
    > = {};

    DISTRICTS.forEach((d) => {
      distMap[d.id] = {
        id: d.id,
        name: d.name,
        nameNepali: d.nameNepali,
        lat: d.lat,
        lng: d.lng,
        loss: 0,
        deaths: 0,
        destroyed: 0
      };
    });

    filteredIncidents.forEach((inc) => {
      if (distMap[inc.districtId]) {
        distMap[inc.districtId].loss += inc.estimatedLossNpr || 0;
        distMap[inc.districtId].deaths += inc.deaths || 0;
        distMap[inc.districtId].destroyed += inc.housesDestroyed || 0;
      }
    });

    return Object.values(distMap);
  }, [filteredIncidents]);

  // Max district loss for normalization
  const maxDistLoss = Math.max(...districtLossStats.map((d) => d.loss), 1);

  // Markers for Choropleth Map with circle radii & color heat based on economic loss
  const choroplethMarkers: MapMarker[] = useMemo(() => {
    return districtLossStats
      .filter((d) => d.loss > 0)
      .map((d) => {
        const ratio = d.loss / maxDistLoss;
        const color =
          ratio > 0.6
            ? '#991B1B' // Deep red (highest loss)
            : ratio > 0.3
            ? '#EA580C' // Orange
            : ratio > 0.1
            ? '#D97706' // Amber
            : '#2563EB'; // Blue

        return {
          id: d.id,
          lat: d.lat,
          lng: d.lng,
          title: `${d.name} District`,
          subtitle: `Est. Loss: NPR ${(d.loss / 1000000).toFixed(1)}M • ${d.deaths} Deaths • ${d.destroyed} Destroyed`,
          category: 'District Loss Impact',
          color: color,
          badgeText: `${(d.loss / 10000000).toFixed(1)}Cr`,
          radius: 12 + ratio * 20
        };
      });
  }, [districtLossStats, maxDistLoss]);

  // Breakdown tables data
  const districtTableData = useMemo(() => {
    return [...districtLossStats].sort((a, b) => b.loss - a.loss);
  }, [districtLossStats]);

  const provinceTableData = useMemo(() => {
    return PROVINCES.map((p) => {
      const pIncidents = filteredIncidents.filter((i) => i.provinceId === p.id);
      return {
        id: p.id,
        name: language === 'ne' ? p.nameNepali : p.name,
        incidentsCount: pIncidents.length,
        deaths: pIncidents.reduce((s, i) => s + (i.deaths || 0), 0),
        housesDestroyed: pIncidents.reduce((s, i) => s + (i.housesDestroyed || 0), 0),
        livestock: pIncidents.reduce((s, i) => s + (i.livestockLost || 0), 0),
        lossNpr: pIncidents.reduce((s, i) => s + (i.estimatedLossNpr || 0), 0)
      };
    }).sort((a, b) => b.lossNpr - a.lossNpr);
  }, [filteredIncidents, language]);

  const hazardTableData = useMemo(() => {
    return Object.entries(HAZARD_INFO).map(([key, info]) => {
      const hIncidents = filteredIncidents.filter((i) => i.hazardType === key);
      return {
        id: key,
        name: language === 'ne' ? info.labelNepali : info.label,
        color: info.color,
        incidentsCount: hIncidents.length,
        deaths: hIncidents.reduce((s, i) => s + (i.deaths || 0), 0),
        housesDestroyed: hIncidents.reduce((s, i) => s + (i.housesDestroyed || 0), 0),
        lossNpr: hIncidents.reduce((s, i) => s + (i.estimatedLossNpr || 0), 0)
      };
    }).sort((a, b) => b.lossNpr - a.lossNpr);
  }, [filteredIncidents, language]);

  const handleExportCsv = () => {
    const exportRows = districtLossStats.map((d) => ({
      District: d.name,
      Deaths: d.deaths,
      DestroyedHouses: d.destroyed,
      LossNPR: d.loss,
      LossInCrores: (d.loss / 10000000).toFixed(2)
    }));
    downloadCsv(exportRows, `NepalDRR_Damage_Loss_Summary_${new Date().toISOString().split('T')[0]}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>Damage & Loss Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Post-disaster human casualties, housing destruction, public infrastructure impairment, and financial loss evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 transition"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard
          title="Human Deaths"
          value={summary.deaths}
          icon={UserX}
          color="text-red-600"
          bgGradient="from-red-50 to-white"
        />
        <KpiCard
          title="Injuries"
          value={summary.injured}
          icon={HeartPulse}
          color="text-amber-600"
          bgGradient="from-amber-50 to-white"
        />
        <KpiCard
          title="Missing"
          value={summary.missing}
          icon={Users}
          color="text-purple-600"
          bgGradient="from-purple-50 to-white"
        />
        <KpiCard
          title="Homes Destroyed"
          value={summary.destroyed}
          icon={Home}
          color="text-orange-600"
          bgGradient="from-orange-50 to-white"
        />
        <KpiCard
          title="Homes Damaged"
          value={summary.damaged}
          icon={Building2}
          color="text-yellow-600"
          bgGradient="from-yellow-50 to-white"
        />
        <KpiCard
          title="Livestock Lost"
          value={summary.livestock}
          icon={Wheat}
          color="text-emerald-600"
          bgGradient="from-emerald-50 to-white"
        />
        <KpiCard
          title="Total Loss (NPR)"
          value={`₹ ${(summary.economicLoss / 10000000).toFixed(2)} Cr`}
          icon={IndianRupee}
          color="text-indigo-600"
          bgGradient="from-indigo-50 to-white"
        />
      </div>

      {/* 3. Year-over-Year Comparison Analysis */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-bold text-sm text-slate-900">Comparative Loss by Hazard: Selected vs Baseline Year</h2>
              <p className="text-xs text-slate-500">Economic damage comparison across disaster types (in Million NPR)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs no-print">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
              <span className="font-bold text-slate-600">Year A:</span>
              <select
                value={compareYear}
                onChange={(e) => setCompareYear(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-900 outline-hidden"
              >
                {[2026, 2025, 2024, 2023, 2022].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-400 font-bold">vs</span>

            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
              <span className="font-bold text-slate-600">Year B:</span>
              <select
                value={baselineYear}
                onChange={(e) => setBaselineYear(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-900 outline-hidden"
              >
                {[2026, 2025, 2024, 2023, 2022].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="hazard" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="M" />
              <Tooltip
                formatter={(val: any) => [`NPR ${val} Million`, 'Loss']}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey={`Year ${compareYear}`} fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey={`Year ${baselineYear}`} fill="#94A3B8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Choropleth Map: Economic Loss Heat By District */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-600" />
            <div>
              <h2 className="font-bold text-sm text-slate-900">District Choropleth Loss Intensity Map</h2>
              <p className="text-xs text-slate-500">
                Spatial distribution of aggregated economic loss (darker red & wider perimeter = severe cumulative loss)
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-800"></span> Extreme (&gt;60%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-orange-600"></span> High (30-60%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span> Low
            </span>
          </div>
        </div>

        <LeafletMap markers={choroplethMarkers} height="420px" showLegend={false} />
      </div>

      {/* 5. Breakdown Tables (Tabs: District / Province / Hazard) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setBreakdownTab('district')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                breakdownTab === 'district' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              By District ({districtTableData.length})
            </button>
            <button
              onClick={() => setBreakdownTab('province')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                breakdownTab === 'province' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              By Province ({provinceTableData.length})
            </button>
            <button
              onClick={() => setBreakdownTab('hazard')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                breakdownTab === 'hazard' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              By Hazard Typology
            </button>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Official summary breakdown for disaster risk financing
          </span>
        </div>

        <div className="overflow-x-auto">
          {breakdownTab === 'district' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4 text-center">Deaths</th>
                  <th className="py-3 px-4 text-center">Destroyed Houses</th>
                  <th className="py-3 px-4 text-right">Total Est. Loss (NPR)</th>
                  <th className="py-3 px-4 text-right">In Crores</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {districtTableData.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {language === 'ne' ? d.nameNepali : d.name}
                    </td>
                    <td className="py-2.5 px-4 text-center font-semibold text-red-600">{d.deaths}</td>
                    <td className="py-2.5 px-4 text-center text-slate-700">{d.destroyed}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-900">
                      ₹ {d.loss.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-700">
                      ₹ {(d.loss / 10000000).toFixed(2)} Cr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {breakdownTab === 'province' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Province</th>
                  <th className="py-3 px-4 text-center">Incidents</th>
                  <th className="py-3 px-4 text-center">Deaths</th>
                  <th className="py-3 px-4 text-center">Houses Destroyed</th>
                  <th className="py-3 px-4 text-center">Livestock Lost</th>
                  <th className="py-3 px-4 text-right">Total Loss (NPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {provinceTableData.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-700">{p.incidentsCount}</td>
                    <td className="py-3 px-4 text-center font-semibold text-red-600">{p.deaths}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{p.housesDestroyed}</td>
                    <td className="py-3 px-4 text-center text-emerald-700 font-semibold">{p.livestock}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹ {(p.lossNpr / 10000000).toFixed(2)} Cr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {breakdownTab === 'hazard' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Hazard Type</th>
                  <th className="py-3 px-4 text-center">Incidents</th>
                  <th className="py-3 px-4 text-center">Deaths</th>
                  <th className="py-3 px-4 text-center">Houses Destroyed</th>
                  <th className="py-3 px-4 text-right">Est. Loss (NPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hazardTableData.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: h.color }}></span>
                      <span>{h.name}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-700">{h.incidentsCount}</td>
                    <td className="py-3 px-4 text-center font-semibold text-red-600">{h.deaths}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{h.housesDestroyed}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹ {(h.lossNpr / 10000000).toFixed(2)} Cr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
