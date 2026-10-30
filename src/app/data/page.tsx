'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Download,
  Code2,
  Terminal,
  ExternalLink,
  CheckCircle2,
  Database,
  Layers,
  ArrowRight,
  Play
} from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { downloadCsv } from '@/lib/exportCsv';
import { SEED_STATIONS } from '@/data/seedStations';

export default function DataPage() {
  const { incidents, resources, alerts } = usePortalStore();

  // API Explorer State
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/incidents?hazard=flood&limit=5');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const testApi = async () => {
    setIsLoadingApi(true);
    try {
      const res = await fetch(selectedEndpoint);
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setApiResponse(JSON.stringify({ error: e.message }, null, 2));
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleDownloadIncidentsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(incidents, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'nepaldrr_incidents_full.json');
    dlAnchor.click();
  };

  const handleDownloadIncidentsCsv = () => {
    const rows = incidents.map((i) => ({
      ID: i.id,
      Title: i.title,
      Hazard: i.hazardType,
      District: i.districtId,
      Location: i.locationName,
      DateTime: i.dateTime,
      Status: i.status,
      Severity: i.severity,
      Deaths: i.deaths,
      Injured: i.injured,
      Missing: i.missing,
      HousesDestroyed: i.housesDestroyed,
      HousesDamaged: i.housesDamaged,
      EstimatedLossNpr: i.estimatedLossNpr
    }));
    downloadCsv(rows, 'NepalDRR_Incidents_OpenData');
  };

  const handleDownloadResourcesCsv = () => {
    downloadCsv(resources, 'NepalDRR_Emergency_Resources');
  };

  const handleDownloadStationsCsv = () => {
    downloadCsv(SEED_STATIONS, 'NepalDRR_HydroMet_Stations');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <span>Open Data Portal & Developer REST API</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publicly accessible machine-readable disaster datasets in CSV and JSON formats, conforming to open data governance principles.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Open Government License (OGL-Nepal Compatible)</span>
        </div>
      </div>

      {/* 2. Downloadable Datasets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dataset 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">CSV & JSON</span>
              <span className="text-slate-400 font-mono text-[11px]">{incidents.length} records</span>
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">National Disaster Incidents Registry</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Granular multi-hazard event registry spanning 2022 to 2026 with casualty, location coordinates, and damage statistics.
            </p>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleDownloadIncidentsCsv}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleDownloadIncidentsJson}
              className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border border-blue-200 transition"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Dataset 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">CSV</span>
              <span className="text-slate-400 font-mono text-[11px]">{resources.length} units</span>
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Emergency Resource & Shelter Inventory</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Geo-located directory of ambulances, fire brigades, evacuation shelters with capacity, and district disaster warehouses.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleDownloadResourcesCsv}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Resources CSV</span>
            </button>
          </div>
        </div>

        {/* Dataset 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded">CSV</span>
              <span className="text-slate-400 font-mono text-[11px]">{SEED_STATIONS.length} stations</span>
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Hydro-Meteorological Telemetry Stations</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              River basins, latitude/longitude, danger thresholds, and warning levels for key rivers across Nepal.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleDownloadStationsCsv}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Stations CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Interactive REST API Explorer */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Interactive Public REST API Explorer</h2>
              <p className="text-xs text-slate-400">
                Direct JSON endpoints for integration into third-party early warning apps, GIS dashboards, and researcher models.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
            No API Key Required (Public Tier)
          </span>
        </div>

        {/* Endpoint Selector & Send Button */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 text-xs">
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 font-mono text-xs outline-hidden font-bold"
            >
              <option value="/api/incidents?hazard=flood&limit=5">GET /api/incidents?hazard=flood&limit=5</option>
              <option value="/api/incidents?district=d-spc">GET /api/incidents?district=d-spc (Sindhupalchok)</option>
              <option value="/api/alerts?active=true">GET /api/alerts?active=true (Active Warnings)</option>
              <option value="/api/resources?category=ambulance">GET /api/resources?category=ambulance</option>
              <option value="/api/realtime/earthquakes">GET /api/realtime/earthquakes (USGS Nepal Feed)</option>
              <option value="/api/realtime/weather">GET /api/realtime/weather (Hydro-Met Telemetry)</option>
              <option value="/api/realtime/airquality">GET /api/realtime/airquality (City AQI)</option>
            </select>

            <button
              onClick={testApi}
              disabled={isLoadingApi}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isLoadingApi ? 'Querying...' : 'Send Request'}</span>
            </button>
          </div>

          {/* Response Payload Box */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-500 mb-2">
              <span>RESPONSE PAYLOAD (JSON)</span>
              <span>Status: 200 OK</span>
            </div>

            <pre className="max-h-72 overflow-y-auto text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
              {apiResponse ||
                `// Click "Send Request" to test endpoint live against local server...\n{\n  "status": "ready",\n  "endpoint": "${selectedEndpoint}"\n}`}
            </pre>
          </div>
        </div>

        {/* Curl Example */}
        <div className="text-xs space-y-1 font-mono text-slate-400 bg-slate-850 p-3 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">cURL Command Example:</span>
          <span className="text-blue-300 select-all block overflow-x-auto">
            curl -X GET "https://nepaldrr.gov.np{selectedEndpoint}" -H "Accept: application/json"
          </span>
        </div>
      </div>
    </div>
  );
}
