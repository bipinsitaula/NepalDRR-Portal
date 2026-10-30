'use client';

import React, { useState, useMemo } from 'react';
import {
  Layers,
  ShieldAlert,
  AlertTriangle,
  Info,
  Sliders,
  CheckCircle,
  Activity,
  Hospital,
  Compass,
  ArrowRight,
  Calculator
} from 'lucide-react';
import { LeafletMap, MapMarker, MapPolygon } from '@/components/LeafletMap';
import { RISK_ZONE_POLYGONS, CRITICAL_FACILITIES } from '@/data/seedRiskLayers';
import { DISTRICTS, PROVINCES } from '@/data/locations';
import { SEED_STATIONS } from '@/data/seedStations';
import { usePortalStore } from '@/lib/store';

export default function RiskInfoPage() {
  const { filteredIncidents, language } = usePortalStore();

  // Layer toggles
  const [showFloodZones, setShowFloodZones] = useState(true);
  const [showLandslideZones, setShowLandslideZones] = useState(true);
  const [showFaultLines, setShowFaultLines] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showIncidentDensity, setShowIncidentDensity] = useState(true);

  // Impact-Based Early Warning (IBEW) Simulation State
  const [selectedStationId, setSelectedStationId] = useState<string>('st-03'); // Karnali at Chisapani
  const [simulatedRainfallMm, setSimulatedRainfallMm] = useState<number>(120); // 120mm heavy rain
  const [vulnerabilityWeight, setVulnerabilityWeight] = useState<number>(0.75); // moderate-high vulnerability

  const selectedStation = SEED_STATIONS.find((s) => s.id === selectedStationId) || SEED_STATIONS[0];
  const stationDistrict = DISTRICTS.find((d) => d.id === selectedStation.districtId) || DISTRICTS[0];

  // Dynamic Calculation for Impact-Based Early Warning Score
  // Formula: Impact Score = (Hazard Ratio) * (Exposure Factor) * (Vulnerability Index)
  const ibewResult = useMemo(() => {
    // 1. Hazard Score (0 to 10): ratio of rainfall/water level to danger mark
    const rainfallRatio = simulatedRainfallMm / 150; // 150mm is extreme threshold
    const hazardScore = Math.min(10, Math.max(1, rainfallRatio * 10));

    // 2. Exposure Score (0 to 10): scaled by district population density
    const exposureFactor = Math.min(10, Math.max(2, (stationDistrict.population / 1000000) * 8));

    // 3. Vulnerability Score (0 to 10): based on poverty/infrastructure index
    const vulnerabilityScore = vulnerabilityWeight * 10;

    // Composite Impact = (Hazard * 0.45) + (Exposure * 0.35) + (Vulnerability * 0.20)
    const compositeScore = Number(
      (hazardScore * 0.45 + exposureFactor * 0.35 + vulnerabilityScore * 0.2).toFixed(1)
    );

    let level: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';
    let color = '#059669';
    let expectedDamageText = 'Localized surface drainage choke; low displacement risk.';

    if (compositeScore >= 7.5) {
      level = 'Severe';
      color = '#DC2626';
      expectedDamageText =
        'Major embankment breach probable. Over 800 households in riverine wards require immediate pre-emptive evacuation.';
    } else if (compositeScore >= 5.5) {
      level = 'High';
      color = '#EA580C';
      expectedDamageText =
        'Extensive inundation of agricultural land and low-lying market settlements. Roads may be submerged for 24-48 hours.';
    } else if (compositeScore >= 3.5) {
      level = 'Moderate';
      color = '#D97706';
      expectedDamageText =
        'Waterlogging in low areas. Pre-position local search and rescue teams on 1-hour readiness.';
    }

    return {
      hazardScore: Number(hazardScore.toFixed(1)),
      exposureScore: Number(exposureFactor.toFixed(1)),
      vulnerabilityScore: Number(vulnerabilityScore.toFixed(1)),
      compositeScore,
      level,
      color,
      expectedDamageText,
      estAffectedPeople: Math.round(stationDistrict.population * (compositeScore / 100) * 0.05)
    };
  }, [simulatedRainfallMm, vulnerabilityWeight, stationDistrict]);

  // Polygons for the map based on toggles
  const mapPolygons: MapPolygon[] = useMemo(() => {
    return RISK_ZONE_POLYGONS.filter((poly) => {
      if (poly.category === 'flood' && !showFloodZones) return false;
      if (poly.category === 'landslide' && !showLandslideZones) return false;
      if (poly.category === 'earthquake_fault' && !showFaultLines) return false;
      return true;
    }).map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      coordinates: p.coordinates,
      description: p.description
    }));
  }, [showFloodZones, showLandslideZones, showFaultLines]);

  // Markers for the map
  const mapMarkers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];

    // 1. Critical Facilities
    if (showFacilities) {
      CRITICAL_FACILITIES.forEach((cf) => {
        list.push({
          id: cf.id,
          lat: cf.lat,
          lng: cf.lng,
          title: cf.name,
          subtitle: `Type: ${cf.type.toUpperCase()} • ${cf.capacity || ''}`,
          category: 'Critical Infrastructure',
          color: '#0284C7',
          badgeText: cf.type === 'hospital' ? 'H' : '✈'
        });
      });
    }

    // 2. Incident Density Heat Markers
    if (showIncidentDensity) {
      filteredIncidents.slice(0, 50).forEach((inc) => {
        list.push({
          id: `dense-${inc.id}`,
          lat: inc.lat,
          lng: inc.lng,
          title: inc.title,
          subtitle: `Recorded Hazard: ${inc.hazardType} (${inc.severity})`,
          category: 'Historical Hazard Density',
          color: '#DC2626',
          badgeText: '•',
          radius: 10 // small heat circle
        });
      });
    }

    return list;
  }, [showFacilities, showIncidentDensity, filteredIncidents]);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            <span>Multi-Hazard Risk Atlas & Impact-Based Early Warning</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic vulnerability overlays and predictive decision-support models for disaster risk reduction.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-lg">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Demo Risk Projections • Not Official DHM Forecast</span>
        </div>
      </div>

      {/* 2. Interactive Map with Layer Control Toggles */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
            Layer Controls & Spatial Overlays
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setShowFloodZones(!showFloodZones)}
              className={`px-2.5 py-1 rounded-md font-bold transition border ${
                showFloodZones
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              ≋ Flood Plain Inundation
            </button>

            <button
              onClick={() => setShowLandslideZones(!showLandslideZones)}
              className={`px-2.5 py-1 rounded-md font-bold transition border ${
                showLandslideZones
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              ▲ Landslide Susceptibility
            </button>

            <button
              onClick={() => setShowFaultLines(!showFaultLines)}
              className={`px-2.5 py-1 rounded-md font-bold transition border ${
                showFaultLines
                  ? 'bg-red-50 text-red-800 border-red-300'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              ⚡ Active Seismic Faults
            </button>

            <button
              onClick={() => setShowFacilities(!showFacilities)}
              className={`px-2.5 py-1 rounded-md font-bold transition border ${
                showFacilities
                  ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              🏥 Critical Facilities (Hospitals)
            </button>

            <button
              onClick={() => setShowIncidentDensity(!showIncidentDensity)}
              className={`px-2.5 py-1 rounded-md font-bold transition border ${
                showIncidentDensity
                  ? 'bg-purple-50 text-purple-800 border-purple-300'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              🔥 Historical Incident Density
            </button>
          </div>
        </div>

        <LeafletMap markers={mapMarkers} polygons={mapPolygons} height="460px" />
      </div>

      {/* 3. Impact-Based Early Warning (IBEW) Decision Support Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                Impact-Based Early Warning Decision Matrix (IBEW)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Moving from <em>"What the hazard will be"</em> to <em>"What the hazard will DO"</em>
              </p>
            </div>
          </div>

          <div className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-xs text-blue-300 font-semibold">
            Formula: Risk = Hazard (45%) × Exposure (35%) × Vulnerability (20%)
          </div>
        </div>

        {/* Matrix Controls & Output Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Simulation Inputs */}
          <div className="space-y-4 bg-slate-800/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              1. Simulation Parameters
            </span>

            {/* River Station Selector */}
            <div>
              <label className="text-xs text-slate-300 block mb-1">Target Monitoring Gauge</label>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-hidden font-semibold"
              >
                {SEED_STATIONS.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.basin} Basin)
                  </option>
                ))}
              </select>
            </div>

            {/* Forecast Rainfall Slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Forecast 24h Rainfall:</span>
                <span className="font-mono font-bold text-blue-400">{simulatedRainfallMm} mm</span>
              </div>
              <input
                type="range"
                min={20}
                max={250}
                step={5}
                value={simulatedRainfallMm}
                onChange={(e) => setSimulatedRainfallMm(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>20mm (Light)</span>
                <span>100mm (Warning)</span>
                <span>250mm (Extreme Cloudburst)</span>
              </div>
            </div>

            {/* Socio-Economic Vulnerability Slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Vulnerability Index:</span>
                <span className="font-mono font-bold text-amber-400">
                  {vulnerabilityWeight > 0.7 ? 'High' : vulnerabilityWeight > 0.4 ? 'Moderate' : 'Low'} (
                  {vulnerabilityWeight})
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1.0}
                step={0.05}
                value={vulnerabilityWeight}
                onChange={(e) => setVulnerabilityWeight(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Accounts for building resilience, slope steepness, and road access.
              </span>
            </div>
          </div>

          {/* Column 2: Calculated Component Breakdown */}
          <div className="space-y-4 bg-slate-800/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                2. Risk Component Scores (0 to 10)
              </span>

              <div className="space-y-3 text-xs">
                {/* Hazard Level */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">Hazard Magnitude (45% wt)</span>
                    <span className="font-mono font-bold text-blue-400">{ibewResult.hazardScore} / 10</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${ibewResult.hazardScore * 10}%` }}
                    />
                  </div>
                </div>

                {/* Exposure Level */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">Human & Asset Exposure (35% wt)</span>
                    <span className="font-mono font-bold text-purple-400">{ibewResult.exposureScore} / 10</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${ibewResult.exposureScore * 10}%` }}
                    />
                  </div>
                </div>

                {/* Vulnerability Level */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">Vulnerability Index (20% wt)</span>
                    <span className="font-mono font-bold text-amber-400">{ibewResult.vulnerabilityScore} / 10</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${ibewResult.vulnerabilityScore * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              Evaluated Area: <strong>{stationDistrict.name} District</strong> ({stationDistrict.population.toLocaleString()}{' '}
              people)
            </div>
          </div>

          {/* Column 3: Expected Impact Warning Outcome */}
          <div
            className="p-5 rounded-xl border flex flex-col justify-between"
            style={{
              backgroundColor: `${ibewResult.color}15`,
              borderColor: `${ibewResult.color}40`
            }}
          >
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                3. Expected Impact Outcome
              </span>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-black font-mono tracking-tight" style={{ color: ibewResult.color }}>
                  {ibewResult.level.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-slate-400">Score: {ibewResult.compositeScore} / 10</span>
              </div>

              <div className="space-y-2 text-xs leading-relaxed text-slate-200 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                <p className="font-semibold">{ibewResult.expectedDamageText}</p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  Est. Population at Immediate Risk: <strong className="text-white font-mono">{ibewResult.estAffectedPeople.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-2">
              <a
                href="/alerts"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md"
              >
                <span>Draft Warning Bulletin for DEOC</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
          <strong>Mandatory Hackathon Disclaimer:</strong> Risk indexes, hazard thresholds, and impact scores displayed on
          this portal are simulated decision-support mathematical models. They do not constitute official emergency orders or
          meteorological forecasts issued by the Government of Nepal.
        </p>
      </div>
    </div>
  );
}
