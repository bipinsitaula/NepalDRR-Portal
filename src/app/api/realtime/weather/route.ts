import { NextResponse } from 'next/server';
import { SEED_STATIONS } from '@/data/seedStations';

interface CacheEntry {
  timestamp: number;
  data: any;
}

let stationCache: CacheEntry | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 mins

export async function GET() {
  const now = Date.now();

  if (stationCache && now - stationCache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      source: 'cache',
      lastUpdated: new Date(stationCache.timestamp).toISOString(),
      stations: stationCache.data
    });
  }

  try {
    // Attempt to query live Open-Meteo precipitation for key stations
    const updated = await Promise.all(
      SEED_STATIONS.map(async (st) => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${st.lat}&longitude=${st.lng}&hourly=precipitation&forecast_days=1`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!res.ok) return st;
          const data = await res.json();
          const hourlyPrecip = data.hourly?.precipitation || [];
          const totalPrecip = hourlyPrecip.reduce((a: number, b: number) => a + b, 0);

          return {
            ...st,
            rainfall24hMm: Number(totalPrecip.toFixed(1)) || st.rainfall24hMm,
            lastUpdated: 'Live telemetry'
          };
        } catch {
          return st;
        }
      })
    );

    stationCache = {
      timestamp: now,
      data: updated
    };

    return NextResponse.json({
      success: true,
      source: 'live_open_meteo',
      lastUpdated: new Date(now).toISOString(),
      stations: updated
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      source: 'cached_telemetry',
      lastUpdated: new Date(now).toISOString(),
      stations: SEED_STATIONS
    });
  }
}
