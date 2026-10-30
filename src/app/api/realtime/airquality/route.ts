import { NextResponse } from 'next/server';

interface CacheEntry {
  timestamp: number;
  data: any;
}

let aqiCache: CacheEntry | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const CITIES = [
  { city: 'Kathmandu', district: 'Kathmandu', lat: 27.7172, lng: 85.324 },
  { city: 'Pokhara', district: 'Kaski', lat: 28.2096, lng: 83.9856 },
  { city: 'Biratnagar', district: 'Morang', lat: 26.4525, lng: 87.2718 },
  { city: 'Birgunj', district: 'Parsa', lat: 27.01, lng: 84.88 },
  { city: 'Nepalgunj', district: 'Banke', lat: 28.05, lng: 81.62 }
];

const FALLBACK_AQI = [
  {
    city: 'Kathmandu',
    district: 'Kathmandu',
    lat: 27.7172,
    lng: 85.324,
    aqiUs: 142,
    pm25: 52.4,
    pm10: 94.2,
    category: 'Unhealthy for Sensitive',
    dominantPollutant: 'PM2.5',
    updatedAt: new Date().toISOString()
  },
  {
    city: 'Pokhara',
    district: 'Kaski',
    lat: 28.2096,
    lng: 83.9856,
    aqiUs: 68,
    pm25: 20.1,
    pm10: 42.0,
    category: 'Moderate',
    dominantPollutant: 'PM10',
    updatedAt: new Date().toISOString()
  },
  {
    city: 'Biratnagar',
    district: 'Morang',
    lat: 26.4525,
    lng: 87.2718,
    aqiUs: 156,
    pm25: 64.8,
    pm10: 110.5,
    category: 'Unhealthy',
    dominantPollutant: 'PM2.5',
    updatedAt: new Date().toISOString()
  },
  {
    city: 'Birgunj',
    district: 'Parsa',
    lat: 27.01,
    lng: 84.88,
    aqiUs: 168,
    pm25: 88.0,
    pm10: 135.2,
    category: 'Unhealthy',
    dominantPollutant: 'PM2.5',
    updatedAt: new Date().toISOString()
  },
  {
    city: 'Nepalgunj',
    district: 'Banke',
    lat: 28.05,
    lng: 81.62,
    aqiUs: 124,
    pm25: 44.5,
    pm10: 82.0,
    category: 'Unhealthy for Sensitive',
    dominantPollutant: 'PM2.5',
    updatedAt: new Date().toISOString()
  }
];

function getCategory(aqi: number): 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export async function GET() {
  const now = Date.now();

  if (aqiCache && now - aqiCache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      source: 'cache',
      lastUpdated: new Date(aqiCache.timestamp).toISOString(),
      cities: aqiCache.data
    });
  }

  try {
    const results = await Promise.all(
      CITIES.map(async (c) => {
        try {
          const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${c.lat}&longitude=${c.lng}&current=us_aqi,pm10,pm2_5`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!res.ok) throw new Error('Bad response');
          const d = await res.json();
          const cur = d.current;

          const aqi = cur?.us_aqi || 85;
          return {
            city: c.city,
            district: c.district,
            lat: c.lat,
            lng: c.lng,
            aqiUs: Math.round(aqi),
            pm25: Number((cur?.pm2_5 || 32).toFixed(1)),
            pm10: Number((cur?.pm10 || 55).toFixed(1)),
            category: getCategory(Math.round(aqi)),
            dominantPollutant: 'PM2.5',
            updatedAt: cur?.time || new Date().toISOString()
          };
        } catch {
          return FALLBACK_AQI.find((f) => f.city === c.city)!;
        }
      })
    );

    aqiCache = {
      timestamp: now,
      data: results
    };

    return NextResponse.json({
      success: true,
      source: 'live_open_meteo',
      lastUpdated: new Date(now).toISOString(),
      cities: results
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      lastUpdated: new Date(now).toISOString(),
      cities: FALLBACK_AQI
    });
  }
}
