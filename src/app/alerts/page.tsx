'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Rss,
  Send,
  PlusCircle,
  Clock,
  MapPin,
  CheckCircle2,
  Share2,
  Calendar,
  Layers,
  Radio,
  FileCode2
} from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { LeafletMap, MapMarker } from '@/components/LeafletMap';
import { DISTRICTS, PROVINCES, HAZARD_INFO } from '@/data/locations';
import { DisasterAlert, HazardType } from '@/types';

export default function AlertsPage() {
  const { alerts, activeAlerts, addAlert, toggleAlertActive, currentUser, language, addSubscriber } =
    usePortalStore();

  const [hazardFilter, setHazardFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Subscription Form State
  const [subType, setSubType] = useState<'sms' | 'email'>('sms');
  const [subContact, setSubContact] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [subSuccess, setSubSuccess] = useState(false);

  // Admin New Alert Form State
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [newAlertData, setNewAlertData] = useState<Omit<DisasterAlert, 'id'>>({
    title: '',
    titleNepali: '',
    hazardType: 'flood' as HazardType,
    severity: 'warning',
    provinceIds: ['p-3'],
    districtIds: ['d-spc'],
    message: '',
    instruction: '',
    startsAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    isActive: true,
    issuedBy: 'National Disaster Risk Reduction & Management Authority (NDRRMA)'
  });

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alt) => {
      if (hazardFilter !== 'all' && alt.hazardType !== hazardFilter) return false;
      if (severityFilter !== 'all' && alt.severity !== severityFilter) return false;
      return true;
    });
  }, [alerts, hazardFilter, severityFilter]);

  // Alert Map Markers
  const alertMapMarkers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];
    activeAlerts.forEach((alt) => {
      alt.districtIds.forEach((dId) => {
        const dist = DISTRICTS.find((d) => d.id === dId);
        if (dist) {
          list.push({
            id: `alt-mark-${alt.id}-${dId}`,
            lat: dist.lat,
            lng: dist.lng,
            title: alt.title,
            subtitle: `${dist.name} District • ${alt.instruction}`,
            category: `${alt.severity.toUpperCase()} ALERT`,
            color: alt.severity === 'emergency' ? '#DC2626' : alt.severity === 'warning' ? '#EA580C' : '#D97706',
            badgeText: '!',
            radius: 18
          });
        }
      });
    });
    return list;
  }, [activeAlerts]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subContact) return;
    addSubscriber(subType, subContact, subDistrict);
    setSubSuccess(true);
    setSubContact('');
    setTimeout(() => setSubSuccess(false), 5000);
  };

  const handleAdminAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAlert(newAlertData);
    setShowAlertModal(false);
    alert('Emergency disaster warning published across portal and API feeds!');
  };

  const getSeverityStyle = (sev: DisasterAlert['severity']) => {
    switch (sev) {
      case 'emergency':
        return 'border-l-4 border-l-red-600 bg-red-50/50';
      case 'warning':
        return 'border-l-4 border-l-orange-500 bg-orange-50/50';
      case 'watch':
        return 'border-l-4 border-l-amber-400 bg-amber-50/50';
      case 'advisory':
        return 'border-l-4 border-l-blue-500 bg-blue-50/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-600 animate-pulse" />
            <span>National Early Warning & Emergency Bulletins</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active sirens, flood danger crests, weather advisories, and syndication feeds for civil protection agencies.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/api/alerts"
            target="_blank"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-lg border border-slate-200 transition"
          >
            <FileCode2 className="w-4 h-4 text-blue-600" />
            <span>JSON Feed</span>
          </Link>

          <Link
            href="/api/alerts?format=rss"
            target="_blank"
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold px-3 py-2 rounded-lg border border-amber-200 transition"
          >
            <Rss className="w-4 h-4 text-amber-600" />
            <span>RSS 2.0 Feed</span>
          </Link>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowAlertModal(true)}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-lg shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Broadcast Alert</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Map of Active Alert Zones */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-red-600" />
            <span>Geographic Footprint of Active Warning Zones</span>
          </span>
          <span className="text-slate-500 font-semibold">{activeAlerts.length} Active Emergency Bulletins</span>
        </div>

        <LeafletMap markers={alertMapMarkers} height="360px" />
      </div>

      {/* 3. Alerts List and Subscribe Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Alerts Bulletins Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700">Filter Warning Bulletins:</span>
            <div className="flex items-center gap-2">
              <select
                value={hazardFilter}
                onChange={(e) => setHazardFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="all">All Hazards</option>
                {Object.entries(HAZARD_INFO).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="all">All Severities</option>
                <option value="emergency">Emergency (Red)</option>
                <option value="warning">Warning (Orange)</option>
                <option value="watch">Watch (Yellow)</option>
                <option value="advisory">Advisory (Blue)</option>
              </select>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
                No alerts match the selected hazard or severity criteria.
              </div>
            ) : (
              filteredAlerts.map((alt) => {
                const affectedDistricts = alt.districtIds
                  .map((id) => DISTRICTS.find((d) => d.id === id)?.name || id)
                  .join(', ');

                return (
                  <div
                    key={alt.id}
                    className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition hover:shadow-md ${getSeverityStyle(
                      alt.severity
                    )}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black uppercase text-[10px] px-2 py-0.5 rounded text-white ${
                            alt.severity === 'emergency'
                              ? 'bg-red-600'
                              : alt.severity === 'warning'
                              ? 'bg-orange-600'
                              : alt.severity === 'watch'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-blue-600'
                          }`}
                        >
                          {alt.severity}
                        </span>
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          {alt.hazardType}
                        </span>
                        {!alt.isActive && (
                          <span className="px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded text-[10px] font-bold">
                            Expired / Archived
                          </span>
                        )}
                      </div>

                      <span className="text-slate-400 font-mono text-[11px]">
                        Valid until: {new Date(alt.expiresAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="text-base font-black text-slate-900 leading-snug">
                      {language === 'ne' && alt.titleNepali ? alt.titleNepali : alt.title}
                    </h2>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>Affected Areas: {affectedDistricts || 'National Scope'}</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed mt-2.5 bg-white/80 p-3 rounded-lg border border-slate-100">
                      {alt.message}
                    </p>

                    <div className="mt-3 p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-950">
                      <strong className="text-blue-900 uppercase text-[10px] tracking-wide block mb-0.5">
                        Civilian Protection Directives:
                      </strong>
                      <span>{alt.instruction}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400">
                      <span>Issued by: {alt.issuedBy}</span>
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => toggleAlertActive(alt.id)}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          {alt.isActive ? 'Deactivate Alert' : 'Reactivate Alert'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Public Early Warning Subscription */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Subscribe for Early Warnings</h3>
                <p className="text-[11px] text-slate-500">Receive automated emergency sirens</p>
              </div>
            </div>

            {subSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Subscription recorded in local demo registry!</span>
              </div>
            )}

            <form onSubmit={handleSubscribe} className="space-y-3 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSubType('sms')}
                  className={`flex-1 py-1.5 rounded-lg font-bold border transition ${
                    subType === 'sms'
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  SMS Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setSubType('email')}
                  className={`flex-1 py-1.5 rounded-lg font-bold border transition ${
                    subType === 'email'
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Email
                </button>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">
                  {subType === 'sms' ? 'Mobile Phone Number (+977)' : 'Official Email Address'}
                </label>
                <input
                  type={subType === 'sms' ? 'tel' : 'email'}
                  required
                  placeholder={subType === 'sms' ? '98XXXXXXXX' : 'focalperson@organization.org'}
                  value={subContact}
                  onChange={(e) => setSubContact(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Geographic Area of Interest</label>
                <select
                  value={subDistrict}
                  onChange={(e) => setSubDistrict(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium"
                >
                  <option value="">All National Warnings (Priority Only)</option>
                  {DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} District
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Register Emergency Alert Subscriber</span>
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-normal pt-1">
                <strong>Demo Disclaimer:</strong> Contact details are saved to the demo database to simulate alerting
                workflows; no actual SMS or emails are sent outside the testbed.
              </p>
            </form>
          </div>

          {/* Quick Hotline Info Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-sm text-red-400">Immediate Disaster Hotlines</h4>
            <div className="space-y-1 font-mono text-slate-300 pt-1">
              <div>
                National Emergency Ops Center: <strong>1155 (Toll Free)</strong>
              </div>
              <div>
                Flood Warning Real-Time: <strong>1149 (Toll Free)</strong>
              </div>
              <div>
                Emergency Police Response: <strong>100</strong>
              </div>
              <div>
                Ambulance Dispatch: <strong>102</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Publish Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Broadcast Official Disaster Alert</h3>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminAlertSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Alert Title (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RED ALERT: Extreme River Flood Warning for Karnali Basin"
                  value={newAlertData.title}
                  onChange={(e) => setNewAlertData({ ...newAlertData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alert Title (Nepali - Optional)</label>
                <input
                  type="text"
                  placeholder="उदा: रातो चेतावनी: कर्णाली जलाधार क्षेत्रमा उच्च बाढीको जोखिम"
                  value={newAlertData.titleNepali}
                  onChange={(e) => setNewAlertData({ ...newAlertData, titleNepali: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hazard Typology</label>
                  <select
                    value={newAlertData.hazardType}
                    onChange={(e) => setNewAlertData({ ...newAlertData, hazardType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    {Object.entries(HAZARD_INFO).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severity Category</label>
                  <select
                    value={newAlertData.severity}
                    onChange={(e) => setNewAlertData({ ...newAlertData, severity: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    <option value="emergency">Emergency (Red Siren)</option>
                    <option value="warning">Warning (Orange)</option>
                    <option value="watch">Watch (Yellow)</option>
                    <option value="advisory">Advisory (Blue)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Affected Districts</label>
                <select
                  multiple
                  value={newAlertData.districtIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setNewAlertData({ ...newAlertData, districtIds: selected });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs h-24"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400">Hold Ctrl / Cmd to select multiple districts.</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Hazard Message</label>
                <textarea
                  rows={2}
                  required
                  placeholder="River water levels rising past danger mark..."
                  value={newAlertData.message}
                  onChange={(e) => setNewAlertData({ ...newAlertData, message: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Actionable Protection Directives</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Immediately evacuate to designated high-ground shelters..."
                  value={newAlertData.instruction}
                  onChange={(e) => setNewAlertData({ ...newAlertData, instruction: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Broadcast Alert Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
