'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Upload,
  Users,
  Package,
  History,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react';
import { usePortalStore, DEMO_USERS } from '@/lib/store';
import { Incident, IncidentStatus, UserRole } from '@/types';
import { DISTRICTS, HAZARD_INFO } from '@/data/locations';

export default function AdminPage() {
  const {
    currentUser,
    switchRole,
    incidents,
    verifyIncident,
    rejectIncident,
    updateIncidentStatus,
    importIncidentsFromCsv,
    resources,
    updateResource,
    activityLogs,
    openReport
  } = usePortalStore();

  const [activeTab, setActiveTab] = useState<'verifications' | 'csv_import' | 'users' | 'resources' | 'audit_log'>('verifications');

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Filter pending incidents
  const pendingIncidents = incidents.filter((i) => i.status === 'reported');

  // Mock User Roster
  const [userRoster, setUserRoster] = useState([
    { id: 'u1', name: 'Dr. Ramesh Pokharel', email: 'admin.neoc@nepaldrr.gov.np', role: 'admin' as UserRole, org: 'National Emergency Ops Center' },
    { id: 'u2', name: 'Suman Adhikari', email: 'reporter.melamchi@nepaldrr.gov.np', role: 'reporter' as UserRole, org: 'Melamchi Municipal DRR Desk' },
    { id: 'u3', name: 'Sunita Maharjan', email: 'reporter.ktm@nepaldrr.gov.np', role: 'reporter' as UserRole, org: 'Kathmandu Metro DRR Unit' },
    { id: 'u4', name: 'Bikash Tamang', email: 'volunteer.bkt@nepaldrr.gov.np', role: 'reporter' as UserRole, org: 'Budhanilkantha Ward 3' },
    { id: 'u5', name: 'General Citizen Viewer', email: 'citizen.viewer@nepaldrr.gov.np', role: 'public' as UserRole, org: 'Public Access Tier' }
  ]);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUserRoster((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    alert(`User role updated to ${newRole.toUpperCase()}.`);
  };

  const handleCsvImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setImportStatus('CSV requires a header line and at least one data row.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const newItems: Incident[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (row.length < 4) continue;

        const title = row[0] || 'Imported Field Incident';
        const hazardType = (row[1]?.toLowerCase() in HAZARD_INFO ? row[1]?.toLowerCase() : 'flood') as any;
        const districtId = row[2] || 'd-ktm';
        const locationName = row[3] || 'Ward Central';
        const deaths = parseInt(row[4] || '0', 10) || 0;
        const loss = parseInt(row[5] || '0', 10) || 0;

        const newInc: Incident = {
          id: `inc-csv-${Date.now()}-${i}`,
          title: title,
          hazardType: hazardType,
          provinceId: 'p-3',
          districtId: districtId,
          municipalityId: 'm-ktm-metro',
          wardNumber: 1,
          locationName: locationName,
          lat: 27.7172,
          lng: 85.324,
          dateTime: new Date().toISOString(),
          status: 'verified',
          severity: 'moderate',
          deaths: deaths,
          injured: 0,
          missing: 0,
          housesDestroyed: 0,
          housesDamaged: 0,
          livestockLost: 0,
          estimatedLossNpr: loss,
          description: `Bulk imported incident from external CSV file.`,
          source: 'CSV Dataset Batch Import',
          reportedBy: currentUser.fullName,
          reporterRole: currentUser.role,
          photos: [],
          updates: [],
          createdAt: new Date().toISOString()
        };

        newItems.push(newInc);
      }

      importIncidentsFromCsv(newItems);
      setImportStatus(`Successfully parsed and inserted ${newItems.length} incidents into database!`);
      setCsvText('');
    } catch (err: any) {
      setImportStatus(`Import failed: ${err.message}`);
    }
  };

  const loadSampleCsv = () => {
    setCsvText(`Title,Hazard,District,Location,Deaths,LossNPR
Debris flow along hillside,landslide,d-spc,Helambu Ward 2,1,2500000
Flash flood inundation in river ward,flood,d-cht,Bharatpur 26,0,4500000
Dry brush wildfire on ridge,fire_forest,d-ksk,Pokhara hillside,0,800000`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              NEOC Disaster Administration Command
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational verification desk, user role assignments, bulk CSV ingestion, and immutable audit logs.
          </p>
        </div>

        {/* Current Role Switch Reminder */}
        {currentUser.role !== 'admin' ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs">
            <span className="text-amber-800 font-semibold">
              Currently viewing as <strong>{currentUser.role.toUpperCase()}</strong>.
            </span>
            <button
              onClick={() => switchRole('admin')}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold transition shadow-xs"
            >
              Switch to Administrator
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Authenticated as NEOC Command Admin</span>
          </div>
        )}
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-xl border border-slate-200 shadow-xs text-xs font-bold">
        <button
          onClick={() => setActiveTab('verifications')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'verifications'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Incident Verifications ({pendingIncidents.length} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('csv_import')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'csv_import'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Bulk Ingestion (CSV)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User & Role Governance</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'resources'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Resource Inventory</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_log')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
            activeTab === 'audit_log'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>System Audit Log ({activityLogs.length})</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: INCIDENT VERIFICATIONS */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900">
                Pending Incidents Requiring Administrative Verification
              </h2>
              <p className="text-xs text-slate-500">
                Field reports filed by municipal ward officers or citizen hotlines waiting for validation
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-xs">
              {pendingIncidents.length} Pending Action
            </span>
          </div>

          {pendingIncidents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
              <h3 className="font-bold text-sm text-slate-800">All Field Incidents Are Verified!</h3>
              <p className="text-xs text-slate-400">
                No unverified incident reports currently in queue. You can test reporting a new incident.
              </p>
              <button type="button" onClick={openReport} className="btn btn-primary mt-2">
                Report a test incident
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingIncidents.map((inc) => {
                const info = HAZARD_INFO[inc.hazardType];
                const dist = DISTRICTS.find((d) => d.id === inc.districtId);
                return (
                  <div
                    key={inc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className="px-2 py-0.5 rounded font-black text-[10px] text-white uppercase"
                          style={{ backgroundColor: info?.color || '#2563EB' }}
                        >
                          {info?.label || inc.hazardType}
                        </span>
                        <span className="font-mono text-slate-400 text-[11px]">{inc.id}</span>
                        <span className="text-slate-500 font-medium">
                          • {dist?.name || inc.districtId} • {inc.locationName}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900">{inc.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-1">{inc.description}</p>
                      <div className="text-[11px] text-slate-400 pt-1">
                        Reported By: <strong>{inc.reportedBy}</strong> ({inc.source}) on{' '}
                        {new Date(inc.dateTime).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => verifyIncident(inc.id, 'Verified by NEOC Admin verification panel.')}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Publish</span>
                      </button>

                      <button
                        onClick={() => {
                          const reason = prompt('Specify rejection reason for audit log:');
                          if (reason) rejectIncident(inc.id, reason);
                        }}
                        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <Link
                        href={`/incidents/${inc.id}`}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BULK CSV INGESTION */}
      {activeTab === 'csv_import' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900">Bulk Ingestion of Field Incidents (CSV)</h2>
              <p className="text-xs text-slate-500">
                Import historical or third-party NGO disaster records in comma-separated values format
              </p>
            </div>

            <button
              onClick={loadSampleCsv}
              className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Load Sample CSV Template</span>
            </button>
          </div>

          {importStatus && (
            <div
              className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                importStatus.includes('Success')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{importStatus}</span>
            </div>
          )}

          <form onSubmit={handleCsvImport} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Paste CSV Data (Header Format: Title,Hazard,District,Location,Deaths,LossNPR)
              </label>
              <textarea
                rows={8}
                required
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Title,Hazard,District,Location,Deaths,LossNPR&#10;Flash flood inundation in river ward,flood,d-cht,Bharatpur 26,0,4500000"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-md transition"
            >
              <Upload className="w-4 h-4" />
              <span>Parse & Insert Records</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: USER & ROLE GOVERNANCE */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900">User Identity & Access Management (RBAC)</h2>
              <p className="text-xs text-slate-500">
                Grant or revoke Reporter and Admin privileges for municipal officers and command personnel
              </p>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Affiliated Agency / Division</th>
                <th className="py-3 px-4 text-center">Assigned Role</th>
                <th className="py-3 px-4 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userRoster.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{u.email}</td>
                  <td className="py-3 px-4 text-slate-600">{u.org}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'reporter'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                    >
                      <option value="public">Public Viewer</option>
                      <option value="reporter">Reporter</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: RESOURCE INVENTORY MANAGEMENT */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900">Emergency Logistics Inventory Quick Edit</h2>
              <p className="text-xs text-slate-500">Update depot quantities and operational conditions</p>
            </div>
            <Link
              href="/profile"
              className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>View On Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Base Location</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.slice(0, 10).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{r.name}</td>
                    <td className="py-2.5 px-4 text-slate-600">{r.locationName}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">
                      {r.quantity} {r.unit}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {r.condition}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => {
                          const val = prompt('Enter new quantity:', String(r.quantity));
                          if (val && !isNaN(Number(val))) updateResource(r.id, { quantity: Number(val) });
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        Adjust Qty
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM AUDIT & ACTIVITY LOG */}
      {activeTab === 'audit_log' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900">Security & Operational Activity Log</h2>
              <p className="text-xs text-slate-500">Immutable chronological audit log of all system actions</p>
            </div>
            <span className="font-mono text-xs text-slate-400">{activityLogs.length} events logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">User & Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Activity Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <strong className="text-slate-800">{log.userName}</strong>{' '}
                      <span className="text-[10px] text-purple-700 uppercase">({log.userRole})</span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap uppercase text-slate-500">{log.entityType}</td>
                    <td className="py-2.5 px-4 font-sans text-xs text-slate-700">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
