'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ShieldAlert,
  UserX,
  HeartPulse,
  Users,
  Home,
  Building,
  TrendingUp,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Send,
  ShieldCheck,
  Camera,
  Layers,
  Share2
} from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { LeafletMap } from '@/components/LeafletMap';
import { GoogleMapView } from '@/components/GoogleMapView';
import { HAZARD_INFO, DISTRICTS, PROVINCES } from '@/data/locations';
import { IncidentStatus } from '@/types';

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { incidents, currentUser, updateIncidentStatus, verifyIncident, rejectIncident } = usePortalStore();

  const incident = incidents.find((inc) => inc.id === id);

  const [mapEngine, setMapEngine] = useState<'leaflet' | 'google'>('leaflet');

  // Admin Timeline Update Form State
  const [newStatus, setNewStatus] = useState<IncidentStatus>(incident?.status || 'verified');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!incident) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h1 className="text-xl font-bold text-slate-800">Incident Record Not Found</h1>
        <p className="text-xs text-slate-500">The requested incident ID "{id}" does not exist in the database.</p>
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents Registry</span>
        </Link>
      </div>
    );
  }

  const hazardInfo = HAZARD_INFO[incident.hazardType];
  const district = DISTRICTS.find((d) => d.id === incident.districtId);
  const province = PROVINCES.find((p) => p.id === incident.provinceId);

  const handleAdminUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateMessage) return;

    setSubmittingUpdate(true);
    updateIncidentStatus(incident.id, newStatus, `${updateTitle ? updateTitle + ': ' : ''}${updateMessage}`);
    setActionNotice('Timeline update posted and status synchronized successfully.');
    setUpdateTitle('');
    setUpdateMessage('');
    setSubmittingUpdate(false);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleQuickVerify = () => {
    verifyIncident(incident.id, 'Verified by NEOC Incident Command Officer.');
    setActionNotice('Incident marked as VERIFIED.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleQuickReject = () => {
    const reason = prompt('Please specify rejection reason for audit log:');
    if (reason) {
      rejectIncident(incident.id, reason);
      setActionNotice('Incident has been REJECTED.');
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const mapMarker = [
    {
      id: incident.id,
      lat: incident.lat,
      lng: incident.lng,
      title: incident.title,
      category: hazardInfo?.label || incident.hazardType,
      color: hazardInfo?.color || '#2563EB',
      badgeText: '!'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Incidents</span>
        </Link>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-slate-400 font-bold">ID: {incident.id}</span>
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert('Incident link copied to clipboard!');
              }
            }}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-md font-semibold transition"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. Main Incident Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Photos, Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Title, Hazard, Meta */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-2.5 py-1 rounded text-xs font-extrabold text-white uppercase shadow-2xs"
                style={{ backgroundColor: hazardInfo?.color || '#2563EB' }}
              >
                {hazardInfo?.label || incident.hazardType}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-slate-100 text-slate-800">
                Severity: {incident.severity}
              </span>
              <span className="ml-auto text-xs text-slate-500 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(incident.dateTime).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{incident.title}</h1>
            {incident.titleNepali && (
              <p className="text-base font-bold text-slate-600">{incident.titleNepali}</p>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <MapPin className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                <strong>{incident.locationName}</strong> — {district?.name}, {province?.name} (Ward{' '}
                {incident.wardNumber || 'N/A'})
              </span>
            </div>

            {/* Description */}
            <div className="pt-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Situational Overview
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {incident.description}
              </p>
            </div>

            {/* Response Actions */}
            {incident.responseActions && (
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Emergency Response & Relief Actions Taken
                </h2>
                <p className="text-sm text-blue-950 leading-relaxed bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                  {incident.responseActions}
                </p>
              </div>
            )}

            {/* Source & Reporter */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div>
                Reported By: <strong className="text-slate-800">{incident.reportedBy}</strong> (
                {incident.reporterRole.toUpperCase()})
              </div>
              <div>
                Source: <span className="font-semibold text-slate-700">{incident.source}</span>
              </div>
            </div>
          </div>

          {/* Card: Casualties & Losses Grid */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Casualty, Damage & Loss Assessment</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-center">
                <span className="text-[10px] font-bold text-red-700 uppercase block">Deaths</span>
                <span className="text-2xl font-black text-red-900">{incident.deaths}</span>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">Injured</span>
                <span className="text-2xl font-black text-amber-900">{incident.injured}</span>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-100 text-center">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">Missing</span>
                <span className="text-2xl font-black text-purple-900">{incident.missing}</span>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-100 text-center">
                <span className="text-[10px] font-bold text-orange-700 uppercase block">Destroyed Homes</span>
                <span className="text-2xl font-black text-orange-900">{incident.housesDestroyed}</span>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100 text-center">
                <span className="text-[10px] font-bold text-yellow-700 uppercase block">Damaged Homes</span>
                <span className="text-2xl font-black text-yellow-900">{incident.housesDamaged}</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Livestock Lost</span>
                <span className="text-2xl font-black text-emerald-900">{incident.livestockLost}</span>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-center flex flex-col justify-center">
                <span className="text-[10px] font-bold text-indigo-700 uppercase block">
                  Est. Economic Damage
                </span>
                <span className="text-xl font-black text-indigo-900 font-mono">
                  NPR {incident.estimatedLossNpr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Photo Gallery */}
          {incident.photos && incident.photos.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Field Documentation Photos</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {incident.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="p-2.5 bg-white text-xs font-semibold text-slate-700">
                      {photo.caption}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card: Timeline of Operational Updates */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Incident Operational Timeline</span>
            </h2>

            {incident.updates && incident.updates.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {incident.updates.map((up) => (
                  <div key={up.id} className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-xs"></div>
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>{new Date(up.createdAt).toLocaleString()}</span>
                      <span className="font-semibold text-slate-600">
                        {up.authorName} ({up.authorRole})
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 mt-1">{up.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{up.message}</p>
                    {up.statusChange && (
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        Status &rarr; {up.statusChange.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No operational updates logged yet.</p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Mini Map & Admin Controls */}
        <div className="space-y-6">
          {/* Mini Map with Google Maps / Leaflet Toggle */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>Incident Coordinates</span>
              </h2>

              {/* Map Engine Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  onClick={() => setMapEngine('leaflet')}
                  className={`px-2 py-0.5 rounded transition ${
                    mapEngine === 'leaflet' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  GIS Map
                </button>
                <button
                  onClick={() => setMapEngine('google')}
                  className={`px-2 py-0.5 rounded transition ${
                    mapEngine === 'google' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Google Maps
                </button>
              </div>
            </div>

            <div className="text-xs font-mono bg-slate-50 p-2 rounded border border-slate-100 text-slate-600">
              Latitude: <strong>{incident.lat}</strong> | Longitude: <strong>{incident.lng}</strong>
            </div>

            {mapEngine === 'leaflet' ? (
              <LeafletMap
                markers={mapMarker}
                center={[incident.lat, incident.lng]}
                zoom={11}
                height="280px"
                interactive={true}
              />
            ) : (
              <GoogleMapView
                lat={incident.lat}
                lng={incident.lng}
                locationName={incident.title}
                zoom={13}
                height="280px"
              />
            )}
          </div>

          {/* Admin Verification & Update Box */}
          <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">NEOC Command Panel</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900 text-purple-200 font-bold uppercase">
                {currentUser.role} mode
              </span>
            </div>

            {currentUser.role === 'admin' ? (
              <div className="space-y-4 pt-1">
                {/* Fast Action Buttons if status is reported */}
                {incident.status === 'reported' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleQuickVerify}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify Incident</span>
                    </button>
                    <button
                      onClick={handleQuickReject}
                      className="py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}

                {/* Post New Timeline Update Form */}
                <form onSubmit={handleAdminUpdateSubmit} className="space-y-3 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                    Add Timeline Update
                  </span>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Set Incident Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-hidden"
                    >
                      <option value="verified">Verified</option>
                      <option value="response_ongoing">Response Ongoing</option>
                      <option value="resolved">Resolved</option>
                      <option value="reported">Reported</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Update Heading</label>
                    <input
                      type="text"
                      placeholder="e.g. Search teams arrived"
                      value={updateTitle}
                      onChange={(e) => setUpdateTitle(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Detailed Message</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Details of rescue, distribution or status change..."
                      value={updateMessage}
                      onChange={(e) => setUpdateMessage(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingUpdate}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Official Update</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-xs text-slate-400 space-y-2 pt-2">
                <p>
                  You are currently viewing as <strong>{currentUser.fullName}</strong> ({currentUser.role}).
                </p>
                <p className="text-[11px] text-slate-400">
                  Switch to <strong>Administrator</strong> in the top header switcher to test verifying incidents,
                  updating response statuses, or posting emergency updates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
