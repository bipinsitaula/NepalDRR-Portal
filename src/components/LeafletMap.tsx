'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Layers, Map as MapIcon } from 'lucide-react';

/**
 * =========================================================================
 * MAP ENGINE: LEAFLET & GOOGLE MAPS HYBRID TILE INTEGRATION
 * Supports:
 * - CartoDB / OpenStreetMap
 * - Google Maps Roadmap (lyrs=m)
 * - Google Maps Satellite (lyrs=s)
 * - Google Maps Terrain (lyrs=p)
 * - Google Maps Hybrid (lyrs=y)
 * - Direct "Open in Google Maps" external deep link
 * =========================================================================
 */

export type MapBasemap = 'carto' | 'google_streets' | 'google_satellite' | 'google_terrain' | 'google_hybrid';

const BASEMAP_TILES: Record<MapBasemap, { url: string; subdomains?: string; attribution: string; maxZoom: number }> = {
  // Key kept as 'carto' for existing callers; CartoDB raster tiles now require an API key,
  // so this serves the standard OpenStreetMap tiles instead.
  carto: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  },
  google_streets: {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '© Google Maps',
    maxZoom: 20
  },
  google_satellite: {
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '© Google Satellite Imagery',
    maxZoom: 20
  },
  google_terrain: {
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '© Google Maps Terrain (Elevation Contours)',
    maxZoom: 20
  },
  google_hybrid: {
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '© Google Hybrid (Satellite + Roads)',
    maxZoom: 20
  }
};

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  category?: string;
  color?: string;
  iconType?: 'hazard' | 'station' | 'resource' | 'earthquake' | 'pin';
  badgeText?: string;
  popupHtml?: string;
  radius?: number; // for circles
}

export interface MapPolygon {
  id: string;
  name: string;
  color: string;
  coordinates: [number, number][]; // [lat, lng] array
  description?: string;
  category?: string;
  riskLevel?: string;
}

interface LeafletMapProps {
  markers?: MapMarker[];
  polygons?: MapPolygon[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  interactive?: boolean;
  pinPickerMode?: boolean;
  selectedPin?: { lat: number; lng: number } | null;
  onPinSelect?: (pos: { lat: number; lng: number }) => void;
  className?: string;
  showLegend?: boolean;
  defaultBasemap?: MapBasemap;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  markers = [],
  polygons = [],
  center = [28.15, 84.4], // Approximate center of Nepal
  zoom = 7,
  height = '480px',
  interactive = true,
  pinPickerMode = false,
  selectedPin = null,
  onPinSelect,
  className = '',
  showLegend = false,
  defaultBasemap = 'google_hybrid'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const polygonsLayerRef = useRef<any>(null);
  const pinMarkerRef = useRef<any>(null);

  const [currentBasemap, setCurrentBasemap] = useState<MapBasemap>(defaultBasemap);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize Map on Client
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      // Dynamically import Leaflet only on browser
      const L = (await import('leaflet')).default;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
      });

      if (!isMounted) return;

      // If map is already initialized, clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Create map
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
        attributionControl: false
      });

      // Add Basemap Tile Layer
      const basemapConfig = BASEMAP_TILES[currentBasemap];
      tileLayerRef.current = L.tileLayer(basemapConfig.url, {
        maxZoom: basemapConfig.maxZoom,
        subdomains: basemapConfig.subdomains || ''
      }).addTo(map);

      // Attribution
      L.control
        .attribution({
          position: 'bottomright',
          prefix: basemapConfig.attribution
        })
        .addTo(map);

      // Layers for dynamic items
      markersLayerRef.current = L.layerGroup().addTo(map);
      polygonsLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Handle Pin Picker Clicks
      if (pinPickerMode) {
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          if (onPinSelect) {
            onPinSelect({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) });
          }
        });
      }

      // Invalidate size once container renders
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      setIsLoaded(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [interactive, pinPickerMode]);

  // Update Basemap Layer when user toggles
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    const changeBasemap = async () => {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      const config = BASEMAP_TILES[currentBasemap];

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      tileLayerRef.current = L.tileLayer(config.url, {
        maxZoom: config.maxZoom,
        subdomains: config.subdomains || ''
      }).addTo(map);
      // Markers and polygons live in Leaflet's overlay/marker panes, which always render above tiles.
    };

    changeBasemap();
  }, [currentBasemap, isLoaded]);

  // Update Markers & Polygons reactively
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    const renderLayers = async () => {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;

      // Clear previous layers
      if (markersLayerRef.current) markersLayerRef.current.clearLayers();
      if (polygonsLayerRef.current) polygonsLayerRef.current.clearLayers();

      // Render Polygons
      polygons.forEach((poly) => {
        const leafletPolygon = L.polygon(poly.coordinates, {
          color: poly.color,
          fillColor: poly.color,
          fillOpacity: 0.35,
          weight: 2.5
        });

        leafletPolygon.bindPopup(`
          <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
            <div style="font-weight: 700; color: #0F2C59; font-size: 14px; margin-bottom: 4px;">${poly.name}</div>
            <div style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: ${poly.color}22; color: ${poly.color}; text-transform: uppercase;">
              ${poly.category ? poly.category.toUpperCase() : 'ZONE'} ${poly.riskLevel ? '• ' + poly.riskLevel.toUpperCase() + ' RISK' : ''}
            </div>
            ${poly.description ? `<p style="margin-top: 6px; color: #475569; font-size: 12px;">${poly.description}</p>` : ''}
          </div>
        `);

        polygonsLayerRef.current.addLayer(leafletPolygon);
      });

      // Render Markers
      markers.forEach((m) => {
        const color = m.color || '#2563EB';

        // Custom HTML DivIcon for modern glowing badge markers
        const customIcon = L.divIcon({
          className: 'custom-nepaldrr-marker',
          html: `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 28px;
              height: 28px;
              background-color: ${color};
              color: #ffffff;
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 4px 10px rgba(0,0,0,0.45);
              font-size: 11px;
              font-weight: bold;
              cursor: pointer;
              transition: transform 0.2s ease;
            ">
              ${m.badgeText || '•'}
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([m.lat, m.lng], { icon: customIcon });

        const popupContent =
          m.popupHtml ||
          `
          <div style="font-family: inherit; font-size: 13px; min-width: 190px; max-width: 270px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: ${color};">${m.category || 'Incident'}</span>
            </div>
            <div style="font-weight: 700; color: #0F2C59; font-size: 14px; margin-bottom: 4px;">${m.title}</div>
            ${m.subtitle ? `<div style="color: #64748B; font-size: 12px; margin-bottom: 6px;">${m.subtitle}</div>` : ''}
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #E2E8F0; font-size: 10px; font-family: monospace; color: #64748B;">
              Coords: ${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersLayerRef.current.addLayer(marker);

        // If circle radius is specified
        if (m.radius) {
          const circle = L.circle([m.lat, m.lng], {
            radius: m.radius * 1000,
            color: color,
            fillColor: color,
            fillOpacity: 0.18,
            weight: 1.5
          });
          markersLayerRef.current.addLayer(circle);
        }
      });

      // Handle Pin Picker Marker
      if (selectedPin && pinPickerMode) {
        if (pinMarkerRef.current) {
          pinMarkerRef.current.setLatLng([selectedPin.lat, selectedPin.lng]);
        } else {
          const pinIcon = L.divIcon({
            className: 'selected-pin-marker',
            html: `
              <div style="
                width: 32px;
                height: 32px;
                background: #DC2626;
                color: #ffffff;
                border: 3px solid #ffffff;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(220,38,38,0.5);
              ">
                <div style="transform: rotate(45deg); font-size: 10px; font-weight: bold;">📍</div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });
          pinMarkerRef.current = L.marker([selectedPin.lat, selectedPin.lng], { icon: pinIcon }).addTo(map);
        }
        // Keep the pin in view when it is moved from outside the map (e.g. district change)
        if (!map.getBounds().contains([selectedPin.lat, selectedPin.lng])) {
          map.panTo([selectedPin.lat, selectedPin.lng]);
        }
      }
    };

    renderLayers();
  }, [markers, polygons, selectedPin, pinPickerMode, isLoaded]);

  // Google Maps link generator
  const currentCenterLat = selectedPin ? selectedPin.lat : center[0];
  const currentCenterLng = selectedPin ? selectedPin.lng : center[1];
  const googleMapsUrl = `https://www.google.com/maps/@${currentCenterLat},${currentCenterLng},${zoom + 2}z/data=!3m1!1e3`;

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-200 shadow-sm ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height }} className="z-0 bg-slate-100" />

      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 z-10 backdrop-blur-xs">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-slate-600">Initializing Map Telemetry...</span>
          </div>
        </div>
      )}

      {/* Pin Picker Instructions Overlay */}
      {pinPickerMode && (
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-md border border-slate-200 z-10 text-xs flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
          <span className="font-semibold text-slate-800">
            Click anywhere on the map to pin incident location
          </span>
          {selectedPin && (
            <span className="ml-2 font-mono bg-slate-100 px-2 py-0.5 rounded text-blue-700 font-bold">
              {selectedPin.lat}, {selectedPin.lng}
            </span>
          )}
        </div>
      )}

      {/* Basemap Switcher & Google Maps Controls (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {/* Google Maps External Deep Link */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 bg-white/95 hover:bg-white text-slate-800 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-md border border-slate-200 text-xs font-bold transition hover:text-blue-600"
          title="Open this location in Google Maps Satellite/Earth view"
        >
          <ExternalLink className="w-3.5 h-3.5 text-red-500" />
          <span className="hidden sm:inline">Google Maps</span>
        </a>

        {/* Layer Switcher Toggle Button */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-900 text-white backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-md border border-slate-800 text-xs font-bold transition"
            title="Switch Map Engine (Google Maps Satellite, Terrain, Hybrid, OSM)"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="capitalize">{currentBasemap === 'carto' ? 'OpenStreetMap' : currentBasemap.replace('_', ' ')}</span>
          </button>

          {showLayerMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowLayerMenu(false)} />
              <div className="absolute right-0 mt-1.5 w-52 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 text-xs animate-in fade-in">
                <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Map Engine & Imagery
                </div>
                <button
                  onClick={() => {
                    setCurrentBasemap('google_hybrid');
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between transition ${
                    currentBasemap === 'google_hybrid' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
                  }`}
                >
                  <span>🛰️ Google Hybrid (Satellite)</span>
                  {currentBasemap === 'google_hybrid' && <span className="text-blue-600 font-black">✓</span>}
                </button>
                <button
                  onClick={() => {
                    setCurrentBasemap('google_terrain');
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between transition ${
                    currentBasemap === 'google_terrain' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
                  }`}
                >
                  <span>⛰️ Google Terrain (Contours)</span>
                  {currentBasemap === 'google_terrain' && <span className="text-blue-600 font-black">✓</span>}
                </button>
                <button
                  onClick={() => {
                    setCurrentBasemap('google_streets');
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between transition ${
                    currentBasemap === 'google_streets' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
                  }`}
                >
                  <span>📍 Google Maps (Roadmap)</span>
                  {currentBasemap === 'google_streets' && <span className="text-blue-600 font-black">✓</span>}
                </button>
                <button
                  onClick={() => {
                    setCurrentBasemap('google_satellite');
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between transition ${
                    currentBasemap === 'google_satellite' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
                  }`}
                >
                  <span>🛰️ Pure Satellite Imagery</span>
                  {currentBasemap === 'google_satellite' && <span className="text-blue-600 font-black">✓</span>}
                </button>
                <button
                  onClick={() => {
                    setCurrentBasemap('carto');
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between transition ${
                    currentBasemap === 'carto' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
                  }`}
                >
                  <span>🗺️ OpenStreetMap</span>
                  {currentBasemap === 'carto' && <span className="text-blue-600 font-black">✓</span>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Map Legend */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md p-2.5 rounded-lg shadow-md border border-slate-200 z-10 text-[11px] text-slate-700">
          <div className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span> Map Legend
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Flood
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span> Landslide
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Earthquake
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span> Fire
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Normal River
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> River Danger
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
