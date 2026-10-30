'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Search,
  Download,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { downloadCsv } from '@/lib/exportCsv';
import { HAZARD_INFO, DISTRICTS, PROVINCES } from '@/data/locations';
import { Incident, IncidentStatus, IncidentSeverity } from '@/types';

export default function IncidentsPage() {
  const {
    filteredIncidents,
    filters,
    setFilters,
    language,
    currentUser,
    verifyIncident,
    openReport
  } = usePortalStore();

  const [sortField, setSortField] = useState<'dateTime' | 'deaths' | 'estimatedLossNpr'>('dateTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Sorting
  const sortedIncidents = useMemo(() => {
    return [...filteredIncidents].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'dateTime') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (sortDirection === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [filteredIncidents, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedIncidents.length / pageSize) || 1;
  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedIncidents.slice(start, start + pageSize);
  }, [sortedIncidents, currentPage, pageSize]);

  const handleSort = (field: 'dateTime' | 'deaths' | 'estimatedLossNpr') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportCsv = () => {
    const exportData = sortedIncidents.map((inc) => ({
      ID: inc.id,
      Title: inc.title,
      Hazard: inc.hazardType,
      Province: inc.provinceId,
      District: inc.districtId,
      Location: inc.locationName,
      Latitude: inc.lat,
      Longitude: inc.lng,
      Date: inc.dateTime,
      Status: inc.status,
      Severity: inc.severity,
      Deaths: inc.deaths,
      Injured: inc.injured,
      Missing: inc.missing,
      HousesDestroyed: inc.housesDestroyed,
      HousesDamaged: inc.housesDamaged,
      EstimatedLossNpr: inc.estimatedLossNpr,
      ReportedBy: inc.reportedBy
    }));

    downloadCsv(exportData, `NepalDRR_Incidents_${new Date().toISOString().split('T')[0]}`);
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Verified
          </span>
        );
      case 'response_ongoing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Clock className="w-3 h-3 text-blue-600" />
            Response Active
          </span>
        );
      case 'reported':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Reported
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Resolved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3 text-red-600" />
            Rejected
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'catastrophic':
        return <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-red-700 text-white">Catastrophic</span>;
      case 'severe':
        return <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-orange-600 text-white">Severe</span>;
      case 'moderate':
        return <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-slate-900">Moderate</span>;
      case 'minor':
        return <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">Minor</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Search, Filter & Actions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-600" />
              <span>National Disaster Incidents Registry</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive chronological log of verified, active, and reported disasters across Nepal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 transition"
              title="Export current filtered data to CSV"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button type="button" onClick={openReport} className="btn btn-danger">
              <PlusCircle className="w-4 h-4" />
              <span>Report incident</span>
            </button>
          </div>
        </div>

        {/* 2. Comprehensive Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Search Query Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, location, description..."
              value={filters.searchQuery}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Hazard Type Filter */}
          <div>
            <select
              value={filters.hazardType}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, hazardType: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 outline-hidden"
            >
              <option value="all">All Hazard Types</option>
              {Object.entries(HAZARD_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {language === 'ne' ? info.labelNepali : info.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="response_ongoing">Response Ongoing</option>
              <option value="reported">Reported (Pending)</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, startDate: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 outline-hidden"
              placeholder="From Date"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, endDate: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 outline-hidden"
              placeholder="To Date"
            />
          </div>
        </div>
      </div>

      {/* 3. Incidents Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Hazard</th>
                <th className="py-3 px-4">Incident Title & Location</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
                  onClick={() => handleSort('dateTime')}
                >
                  <div className="flex items-center gap-1">
                    <span>Date / Time</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Severity</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
                  onClick={() => handleSort('deaths')}
                >
                  <div className="flex items-center gap-1">
                    <span>Casualties</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none text-right"
                  onClick={() => handleSort('estimatedLossNpr')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Loss (NPR)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-sm">No disaster incidents matched current filters.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the location or hazard filter.</p>
                  </td>
                </tr>
              ) : (
                paginatedIncidents.map((inc) => {
                  const info = HAZARD_INFO[inc.hazardType];
                  const dist = DISTRICTS.find((d) => d.id === inc.districtId);

                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition group">
                      {/* Hazard Badge */}
                      <td className="py-3 px-4 shrink-0">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold text-white uppercase whitespace-nowrap shadow-2xs"
                          style={{ backgroundColor: info?.color || '#2563EB' }}
                        >
                          {info?.label || inc.hazardType}
                        </span>
                      </td>

                      {/* Title & Location */}
                      <td className="py-3 px-4 max-w-xs">
                        <Link
                          href={`/incidents/${inc.id}`}
                          className="font-bold text-slate-900 group-hover:text-blue-600 block line-clamp-1"
                        >
                          {language === 'ne' && inc.titleNepali ? inc.titleNepali : inc.title}
                        </Link>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-slate-700">{dist?.name || inc.districtId}</span>
                          <span>•</span>
                          <span className="truncate">{inc.locationName}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {new Date(inc.dateTime).toLocaleDateString()}
                        <div className="text-[10px] text-slate-400">
                          {new Date(inc.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-4 whitespace-nowrap">{getSeverityBadge(inc.severity)}</td>

                      {/* Casualties */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {inc.deaths > 0 || inc.injured > 0 || inc.missing > 0 ? (
                          <div className="space-y-0.5 text-[11px]">
                            {inc.deaths > 0 && <span className="font-bold text-red-600 block">{inc.deaths} Dead</span>}
                            {inc.injured > 0 && <span className="text-amber-700 block">{inc.injured} Injured</span>}
                            {inc.missing > 0 && <span className="text-purple-700 block">{inc.missing} Missing</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None reported</span>
                        )}
                      </td>

                      {/* Estimated Loss */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-800">
                        {inc.estimatedLossNpr > 0 ? (
                          inc.estimatedLossNpr >= 10000000 ? (
                            `₹ ${(inc.estimatedLossNpr / 10000000).toFixed(2)} Cr`
                          ) : inc.estimatedLossNpr >= 100000 ? (
                            `₹ ${(inc.estimatedLossNpr / 100000).toFixed(1)} Lakh`
                          ) : (
                            `₹ ${inc.estimatedLossNpr.toLocaleString('en-IN')}`
                          )
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">{getStatusBadge(inc.status)}</td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/incidents/${inc.id}`}
                            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-blue-600 transition"
                            title="View Incident Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Quick Admin Verification Button */}
                          {currentUser.role === 'admin' && inc.status === 'reported' && (
                            <button
                              onClick={() => verifyIncident(inc.id, 'Verified directly from table view.')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                              title="Verify incident"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-900">{Math.min(sortedIncidents.length, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
            <strong className="text-slate-900">{Math.min(sortedIncidents.length, currentPage * pageSize)}</strong> of{' '}
            <strong className="text-slate-900">{sortedIncidents.length}</strong> incidents
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
