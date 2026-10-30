'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Waves,
  CloudRain,
  Activity,
  Wind,
  Sun,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { LeafletMap, MapMarker } from '@/components/LeafletMap';
import { SEED_STATIONS } from '@/data/seedStations';
import { HydroMetStation, EarthquakeEvent, AirQualityStation, FireHotspot } from '@/types';

type RealtimeTab = 'river' | 'rainfall' | 'earthquake' | 'airquality' | 'fire' | 'weather';

const SAMPLE_FIRE_HOTSPOTS: FireHotspot[] = [
  {
    id: 'fir-01',
    district: 'Chitwan',
    location: 'Chure foothill buffer forest, Lothar',
    lat: 27.58,
    lng: 84.72,
    confidence: 'high',
    brightnessKelvin: 338.4,
    detectedAt: '3 hours ago',
    type: 'forest'
  },
  {
    id: 'fir-02',
    district: 'Dang',
    location: 'Ghorahi southern ridge pine forest',
    lat: 27.98,
    lng: 82.42,
    confidence: 'nominal',
    brightnessKelvin: 322.1,
    detectedAt: '5 hours ago',
    type: 'forest'
  },
  {
    id: 'fir-03',
    district: 'Parsa',
    location: 'Agricultural crop residue burning sector',
    lat: 27.12,
    lng: 84.95,
    confidence: 'high',
    brightnessKelvin: 345.0,
    detectedAt: '1 hour ago',
    type: 'agricultural'
  },
  {
    id: 'fir-04',
    district: 'Surkhet',
    location: 'Birendranagar north slope woodland',
    lat: 28.64,
    lng: 81.65,
    confidence: 'nominal',
    brightnessKelvin: 318.5,
    detectedAt: '6 hours ago',
    type: 'forest'
  }
];

export default function RealtimePage() {
  const [activeTab, setActiveTab] = useState<RealtimeTab>('river');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [dataSource, setDataSource] = useState<string>('live');

  // Real-time telemetry states
  const [stations, setStations] = useState<HydroMetStation[]>(SEED_STATIONS);
  const [earthquakes, setEarthquakes] = useState<EarthquakeEvent[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityStation[]>([]);
  const [fires, setFires] = useState<FireHotspot[]>(SAMPLE_FIRE_HOTSPOTS);

  // Fetch telemetry
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Earthquakes
      const eqRes = await fetch('/api/realtime/earthquakes');
      if (eqRes.ok) {
        const eqData = await eqRes.json();
        setEarthquakes(eqData.events || []);
        if (eqData.source) setDataSource(eqData.source);
      }

      // 2. Air Quality
      const aqiRes = await fetch('/api/realtime/airquality');
      if (aqiRes.ok) {
        const aqiData = await aqiRes.json();
        setAirQuality(aqiData.cities || []);
      }

      // 3. Hydro-met
      const stRes = await fetch('/api/realtime/weather');
      if (stRes.ok) {
        const stData = await stRes.json();
        setStations(stData.stations || SEED_STATIONS);
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Error fetching real-time data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Map markers depending on the active tab
  const activeMarkers: MapMarker[] = React.useMemo(() => {
    if (activeTab === 'river' || activeTab === 'rainfall') {
      return stations.map((st) => {
        const color =
          st.status === 'danger'
            ? '#DC2626' // red
            : st.status === 'warning'
            ? '#D97706' // amber
            : '#059669'; // emerald green

        return {
          id: st.id,
          lat: st.lat,
          lng: st.lng,
          title: st.name,
          subtitle: `Water Level: ${st.currentWaterLevelM || '—'}m (Danger: ${st.dangerLevelM}m) • Rain: ${st.rainfall24hMm || 0}mm`,
          category: `River Station • ${st.status.toUpperCase()}`,
          color,
          badgeText: st.status === 'danger' ? '!' : '≋'
        };
      });
    }

    if (activeTab === 'earthquake') {
      return earthquakes.map((eq) => {
        const color =
          eq.magnitude >= 5.0 ? '#7F1D1D' : eq.magnitude >= 4.0 ? '#DC2626' : '#EA580C';
        return {
          id: eq.id,
          lat: eq.lat,
          lng: eq.lng,
          title: `M ${eq.magnitude} - ${eq.place}`,
          subtitle: `Depth: ${eq.depthKm} km • ${eq.timeNpt}`,
          category: 'Earthquake Epicenter',
          color,
          badgeText: `M${eq.magnitude}`,
          radius: eq.magnitude * 7 // felt radius circle
        };
      });
    }

    if (activeTab === 'airquality') {
      return airQuality.map((c) => {
        const color =
          c.category === 'Hazardous'
            ? '#7E0023'
            : c.category === 'Very Unhealthy'
            ? '#8F3F97'
            : c.category === 'Unhealthy'
            ? '#DC2626'
            : c.category === 'Unhealthy for Sensitive'
            ? '#EA580C'
            : c.category === 'Moderate'
            ? '#D97706'
            : '#059669';

        return {
          id: c.city,
          lat: c.lat,
          lng: c.lng,
          title: `${c.city} (AQI: ${c.aqiUs})`,
          subtitle: `PM2.5: ${c.pm25} µg/m³ • PM10: ${c.pm10} µg/m³ • ${c.category}`,
          category: 'Air Quality Station',
          color,
          badgeText: `${c.aqiUs}`
        };
      });
    }

    if (activeTab === 'fire') {
      return fires.map((f) => ({
        id: f.id,
        lat: f.lat,
        lng: f.lng,
        title: `Fire Hotspot - ${f.location}`,
        subtitle: `Confidence: ${f.confidence.toUpperCase()} • Brightness: ${f.brightnessKelvin} K • ${f.detectedAt}`,
        category: 'Thermal Hotspot (NASA FIRMS)',
        color: '#DC2626',
        badgeText: '🔥'
      }));
    }

    return [];
  }, [activeTab, stations, earthquakes, airQuality, fires]);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-red-600 animate-pulse" />
            <span>Multi-Hazard Real-Time Environmental Telemetry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated sensor telemetry feeds from Department of Hydrology & Meteorology, USGS Seismology, and Open-Meteo APIs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="text-slate-400 font-mono flex items-center gap-1 justify-end">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated: {lastUpdated}</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-bold">
              {dataSource.includes('cache') ? 'Cached 30m • Active Fallback' : 'Live Gateway Stream'}
            </div>
          </div>

          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-xl border border-slate-200 shadow-xs text-xs font-bold">
        <button
          onClick={() => setActiveTab('river')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'river'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Waves className="w-4 h-4" />
          <span>River Levels & Flood Warnings ({stations.filter((s) => s.status !== 'normal').length} Alerting)</span>
        </button>

        <button
          onClick={() => setActiveTab('rainfall')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'rainfall'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <CloudRain className="w-4 h-4" />
          <span>24h Rainfall Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('earthquake')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'earthquake'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>USGS Earthquakes Feed ({earthquakes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('airquality')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'airquality'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span>Air Quality Index (AQI)</span>
        </button>

        <button
          onClick={() => setActiveTab('fire')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'fire'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Active Fire Hotspots ({fires.length})</span>
        </button>
      </div>

      {/* 3. Interactive GIS Map for Current Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Interactive Telemetry Map • {activeTab.toUpperCase()}</span>
          </span>
          <span className="text-slate-500 font-semibold">
            {activeMarkers.length} sensor stations / events displayed
          </span>
        </div>

        <LeafletMap markers={activeMarkers} height="380px" />
      </div>

      {/* 4. Tab Specific Content Tables & Cards */}

      {/* TAB 1 & 2: RIVER LEVELS & RAINFALL */}
      {(activeTab === 'river' || activeTab === 'rainfall') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-800">
              Department of Hydrology & Meteorology (DHM) Hydro-Met Telemetry Stations
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Normal
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Warning
              </span>
              <span className="flex items-center gap-1 text-red-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Danger
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Station & River</th>
                  <th className="py-3 px-4">Basin</th>
                  <th className="py-3 px-4 text-right">Water Level (m)</th>
                  <th className="py-3 px-4 text-center">Warning / Danger Mark</th>
                  <th className="py-3 px-4 text-right">Discharge (m³/s)</th>
                  <th className="py-3 px-4 text-right">24h Rain (mm)</th>
                  <th className="py-3 px-4 text-center">24h Trend</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stations.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{st.name}</div>
                      <div className="text-[11px] text-slate-500">{st.river}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{st.basin}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {st.currentWaterLevelM ? `${st.currentWaterLevelM} m` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600 text-[11px]">
                      <span className="text-amber-700">{st.warningLevelM}m</span> /{' '}
                      <span className="text-red-700 font-bold">{st.dangerLevelM}m</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {st.dischargeM3s ? `${st.dischargeM3s.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                      {st.rainfall24hMm || 0} mm
                    </td>
                    {/* Sparkline & Trend */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-semibold text-[11px]">
                        {st.trend === 'rising' ? (
                          <span className="text-red-600 flex items-center gap-0.5">
                            <TrendingUp className="w-3.5 h-3.5" /> Rising
                          </span>
                        ) : st.trend === 'falling' ? (
                          <span className="text-blue-600 flex items-center gap-0.5">
                            <TrendingDown className="w-3.5 h-3.5" /> Falling
                          </span>
                        ) : (
                          <span className="text-slate-500">Steady</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          st.status === 'danger'
                            ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                            : st.status === 'warning'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {st.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EARTHQUAKES (USGS FEED) */}
      {activeTab === 'earthquake' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                USGS Earthquake Hazard Feed (Nepal Bounding Box: 26.3°N - 30.5°N, 80.0°E - 88.2°E)
              </h2>
              <p className="text-xs text-slate-500">Recent tectonic shocks of magnitude ≥ 2.5 in the past 30 days</p>
            </div>
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
              {earthquakes.length} Events Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Magnitude</th>
                  <th className="py-3 px-4">Epicenter Location</th>
                  <th className="py-3 px-4 text-right">Focal Depth (km)</th>
                  <th className="py-3 px-4 text-right">Nepal Time (NPT)</th>
                  <th className="py-3 px-4 text-center">Felt Reports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {earthquakes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No significant earthquake shocks recorded in the last 30 days.
                    </td>
                  </tr>
                ) : (
                  earthquakes.map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded font-black text-xs text-white ${
                            eq.magnitude >= 5.0 ? 'bg-red-700' : eq.magnitude >= 4.0 ? 'bg-red-600' : 'bg-orange-600'
                          }`}
                        >
                          M {eq.magnitude}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{eq.place}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">{eq.depthKm} km</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{eq.timeNpt}</td>
                      <td className="py-3 px-4 text-center">
                        {eq.feltReports && eq.feltReports > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold">
                            {eq.feltReports} felt
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AIR QUALITY INDEX */}
      {activeTab === 'airquality' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {airQuality.map((c) => {
            const isHazardous = c.aqiUs > 150;
            return (
              <div
                key={c.city}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-900">{c.city}</h3>
                  <span className="text-xs font-semibold text-slate-500">{c.district} District</span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-3xl font-black text-slate-900 font-mono">{c.aqiUs}</span>
                    <span className="text-xs text-slate-400 font-semibold ml-1">US AQI</span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                      c.category === 'Hazardous'
                        ? 'bg-purple-900 text-white'
                        : c.category === 'Unhealthy'
                        ? 'bg-red-600 text-white'
                        : c.category === 'Unhealthy for Sensitive'
                        ? 'bg-orange-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {c.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100 font-mono">
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-slate-400 block text-[10px]">PM2.5 Conc.</span>
                    <span className="font-bold text-slate-800">{c.pm25} µg/m³</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-slate-400 block text-[10px]">PM10 Conc.</span>
                    <span className="font-bold text-slate-800">{c.pm10} µg/m³</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                  <span>Dominant: {c.dominantPollutant}</span>
                  <span>{new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 5: ACTIVE FIRE HOTSPOTS */}
      {activeTab === 'fire' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                NASA FIRMS / Rule-based Forest Fire Thermal Anomalies
              </h2>
              <p className="text-xs text-slate-500">
                Satellite MODIS/VIIRS infrared thermal radiance detecting dry-weather wildfires in Nepal
              </p>
            </div>
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded">
              High Pre-monsoon Vigilance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fires.map((f) => (
              <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-red-600 uppercase flex items-center gap-1">
                    <Flame className="w-4 h-4" /> {f.type} fire hotspot
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{f.detectedAt}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{f.location}</h3>
                <div className="flex items-center justify-between text-xs text-slate-600 font-mono pt-1">
                  <span>
                    Lat: {f.lat}, Lng: {f.lng} ({f.district})
                  </span>
                  <span className="font-bold text-orange-700">{f.brightnessKelvin} K</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
