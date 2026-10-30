'use client';

import React, { useState } from 'react';
import { ExternalLink, Layers, Navigation, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface GoogleMapViewProps {
  lat?: number;
  lng?: number;
  zoom?: number;
  locationName?: string;
  height?: string;
  className?: string;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  lat = 27.7172,
  lng = 85.324,
  zoom = 12,
  locationName = 'Kathmandu, Nepal',
  height = '420px',
  className = ''
}) => {
  const [mapType, setMapType] = useState<'m' | 'k' | 'p'>('k'); // m = roadmap, k = satellite, p = terrain

  // Google Maps interactive embed URL
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=${zoom}&t=${mapType}&output=embed`;
  const directGoogleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 ${className}`}>
      {/* Google Maps Embed Iframe */}
      <iframe
        title={`Google Map - ${locationName}`}
        src={embedUrl}
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        className="w-full"
      />

      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold border border-slate-800 shadow-md flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span>Google Maps Engine • {locationName}</span>
          <span className="text-[10px] font-mono text-slate-400">
            ({lat.toFixed(4)}, {lng.toFixed(4)})
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Map Type Switcher */}
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-lg border border-slate-200 shadow-md flex text-[11px] font-bold">
            <button
              onClick={() => setMapType('k')}
              className={`px-2 py-1 rounded transition ${
                mapType === 'k' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapType('p')}
              className={`px-2 py-1 rounded transition ${
                mapType === 'p' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Terrain
            </button>
            <button
              onClick={() => setMapType('m')}
              className={`px-2 py-1 rounded transition ${
                mapType === 'm' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Roads
            </button>
          </div>

          {/* Open In Google Maps Fullscreen */}
          <a
            href={directGoogleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-white/95 hover:bg-white text-slate-800 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-md border border-slate-200 text-xs font-bold transition hover:text-blue-600"
            title="Open in Native Google Maps Application"
          >
            <span>Open in App</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          </a>
        </div>
      </div>
    </div>
  );
};
