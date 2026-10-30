'use client';

import React, { useState, useMemo } from 'react';
import {
  Users2,
  Building,
  Phone,
  Mail,
  Truck,
  Flame,
  LifeBuoy,
  Home,
  Package,
  HeartHandshake,
  MapPin,
  Navigation,
  PlusCircle,
  Filter,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { LeafletMap, MapMarker } from '@/components/LeafletMap';
import { DISTRICTS, PROVINCES, MUNICIPALITIES } from '@/data/locations';
import { DISTRICT_COMMITTEES } from '@/data/seedRiskLayers';
import { calculateDistanceKm } from '@/lib/distance';
import { ResourceItem } from '@/types';

export default function ProfilePage() {
  const {
    filters,
    setFilters,
    resources,
    filteredResources,
    addResource,
    updateResource,
    incidents,
    currentUser,
    language
  } = usePortalStore();

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(filters.districtId || 'd-spc'); // default Sindhupalchok
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState<string>('all');

  // "Nearest Resources Tool" Target Selector
  const [targetIncidentId, setTargetIncidentId] = useState<string>('inc-2026-001'); // Melamchi flood default
  const [customPin, setCustomPin] = useState<{ lat: number; lng: number } | null>(null);

  // Admin Add Resource Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRes, setNewRes] = useState<Omit<ResourceItem, 'id'>>({
    name: '',
    category: 'ambulance',
    quantity: 1,
    unit: 'units',
    condition: 'operational',
    locationName: '',
    districtId: selectedDistrictId,
    lat: 27.7,
    lng: 85.3,
    contactPerson: '',
    phone: '',
    notes: ''
  });

  const activeDistrict = DISTRICTS.find((d) => d.id === selectedDistrictId) || DISTRICTS[0];
  const activeProvince = PROVINCES.find((p) => p.id === activeDistrict.provinceId);
  const districtMunicipalities = MUNICIPALITIES.filter((m) => m.districtId === activeDistrict.id);
  const committeeContacts = DISTRICT_COMMITTEES.filter((c) => c.districtId === activeDistrict.id);

  // Target coordinates for "Nearest Resources"
  const targetCoords = useMemo(() => {
    if (customPin) return customPin;
    const inc = incidents.find((i) => i.id === targetIncidentId);
    if (inc) return { lat: inc.lat, lng: inc.lng, title: inc.title };
    return { lat: activeDistrict.lat, lng: activeDistrict.lng, title: activeDistrict.name };
  }, [customPin, targetIncidentId, incidents, activeDistrict]);

  // Nearest resources calculated via Haversine formula
  const nearestResources = useMemo(() => {
    return resources
      .map((res) => {
        const distKm = calculateDistanceKm(targetCoords.lat, targetCoords.lng, res.lat, res.lng);
        return { ...res, distanceKm: distKm };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 8);
  }, [resources, targetCoords]);

  // Category Icon & Color Helper
  const getCategoryMeta = (cat: ResourceItem['category']) => {
    switch (cat) {
      case 'ambulance':
        return { label: 'Ambulance', icon: Truck, color: 'text-red-600 bg-red-50 border-red-200' };
      case 'fire_engine':
        return { label: 'Fire Engine', icon: Flame, color: 'text-orange-600 bg-orange-50 border-orange-200' };
      case 'rescue_team':
        return { label: 'Rescue Squad', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'boat':
        return { label: 'Rescue Boat', icon: LifeBuoy, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'shelter':
        return { label: 'Evacuation Shelter', icon: Home, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'relief_stock':
        return { label: 'Relief Supplies', icon: Package, color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'volunteers':
        return { label: 'Trained Volunteers', icon: HeartHandshake, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' };
    }
  };

  // Map Markers for Resources
  const resourceMarkers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = resources
      .filter((r) => resourceCategoryFilter === 'all' || r.category === resourceCategoryFilter)
      .map((r) => {
        const meta = getCategoryMeta(r.category);
        return {
          id: r.id,
          lat: r.lat,
          lng: r.lng,
          title: r.name,
          subtitle: `${r.quantity} ${r.unit} • ${r.locationName} • Contact: ${r.phone}`,
          category: meta.label,
          color: r.category === 'ambulance' ? '#DC2626' : r.category === 'shelter' ? '#059669' : '#2563EB',
          badgeText: r.category === 'shelter' ? 'S' : r.category === 'ambulance' ? 'A' : 'R'
        };
      });

    // Add target incident pin
    list.push({
      id: 'target-pin',
      lat: targetCoords.lat,
      lng: targetCoords.lng,
      title: `Incident: ${(targetCoords as any).title || 'Target Point'}`,
      subtitle: 'Evaluation Ground Zero',
      category: 'Target Point',
      color: '#000000',
      badgeText: '🎯'
    });

    return list;
  }, [resources, resourceCategoryFilter, targetCoords]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addResource({
      ...newRes,
      districtId: selectedDistrictId,
      lat: Number(newRes.lat),
      lng: Number(newRes.lng),
      quantity: Number(newRes.quantity)
    });
    setShowAddModal(false);
    alert('New emergency resource registered successfully!');
  };

  return (
    <div className="space-y-6">
      {/* 1. Profile Scope Selector & Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users2 className="w-6 h-6 text-blue-600" />
            <span>Local Capacity, Demographics & Resource Inventory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administrative baseline profiles, Disaster Management Committee (DDMC) focal contacts, and prepositioned relief stocks.
          </p>
        </div>

        {/* Quick District Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-600">Select Area Profile:</span>
          <select
            value={selectedDistrictId}
            onChange={(e) => {
              setSelectedDistrictId(e.target.value);
              setFilters((prev) => ({ ...prev, districtId: e.target.value }));
            }}
            className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            {DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {language === 'ne' ? d.nameNepali : d.name} ({d.headquarter})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Demographic Profile Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Population</span>
          <span className="text-2xl font-black text-slate-900 font-mono">
            {activeDistrict.population.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">2021 National Census</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Households</span>
          <span className="text-2xl font-black text-slate-900 font-mono">
            {activeDistrict.households.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Avg 4.2 members/household</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Area</span>
          <span className="text-2xl font-black text-slate-900 font-mono">
            {activeDistrict.areaKm2.toLocaleString()} km²
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">HQ: {activeDistrict.headquarter}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Municipalities</span>
          <span className="text-2xl font-black text-blue-600 font-mono">
            {districtMunicipalities.length || '5'} Local Units
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Province: {activeProvince?.name}</span>
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Key Vulnerability</span>
          <span className="text-sm font-black text-red-600 block mt-1">
            {activeDistrict.code === 'sindhupalchok'
              ? 'Landslide & Flash Flood'
              : activeDistrict.code === 'kailali'
              ? 'Terai Inundation & Riverine'
              : 'Urban Waterlogging & Seismic'}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">High monsoon exposure</span>
        </div>
      </div>

      {/* 3. DDMC Leadership & Focal Contacts Directory */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-600" />
            <span>District Disaster Management Committee (DDMC) Focal Roster</span>
          </h2>
          <span className="text-xs text-slate-400 font-semibold">{activeDistrict.name} Command Desk</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {committeeContacts.length > 0 ? (
            committeeContacts.map((c) => (
              <div key={c.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                <span className="text-[10px] uppercase font-black text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded inline-block">
                  {c.role}
                </span>
                <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-500">{c.organization}</p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
                  <a
                    href={`tel:${c.phone}`}
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{c.phone}</span>
                  </a>
                  <a href={`mailto:${c.email}`} className="text-slate-500 hover:text-slate-800" title={c.email}>
                    <Mail className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 col-span-3">
              Chief District Officer (CDO) Emergency Desk: <strong>01-4262446 / 9851200001</strong> • Red Cross Focal
              Office: <strong>102</strong>
            </div>
          )}
        </div>
      </div>

      {/* 4. "Nearest Resources to this Incident" Tool (Haversine Formula) */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                Nearest Emergency Resources Dispatch Calculator
              </h2>
              <p className="text-xs text-slate-400">
                Calculates real-time straight-line Haversine distance to closest ambulances, shelters, and search teams
              </p>
            </div>
          </div>

          {/* Incident Selector for Distance Reference */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Incident:</span>
            <select
              value={targetIncidentId}
              onChange={(e) => {
                setTargetIncidentId(e.target.value);
                setCustomPin(null);
              }}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-hidden max-w-xs truncate"
            >
              {incidents.slice(0, 10).map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.title} ({inc.locationName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nearest 4 Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {nearestResources.slice(0, 4).map((res) => {
            const meta = getCategoryMeta(res.category);
            return (
              <div key={res.id} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900">
                    {meta.label}
                  </span>
                  <span className="text-xs font-mono font-black text-amber-400">
                    {res.distanceKm} km away
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white line-clamp-1">{res.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-1">{res.locationName}</p>
                <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 font-bold">
                    {res.quantity} {res.unit}
                  </span>
                  <a
                    href={`tel:${res.phone}`}
                    className="text-blue-400 font-bold hover:underline flex items-center gap-1 font-mono"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Unit</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Resource Map and Complete Inventory List */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
              Complete Resource & Shelter Inventory
            </h2>
            <p className="text-xs text-slate-500">Live operational readiness and contact registry</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={resourceCategoryFilter}
              onChange={(e) => setResourceCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-hidden"
            >
              <option value="all">All Categories</option>
              <option value="ambulance">Ambulances</option>
              <option value="fire_engine">Fire Engines</option>
              <option value="rescue_team">Rescue Teams</option>
              <option value="boat">Boats / Rafts</option>
              <option value="shelter">Shelters</option>
              <option value="relief_stock">Relief Stocks</option>
              <option value="volunteers">Volunteers</option>
            </select>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Resource</span>
              </button>
            )}
          </div>
        </div>

        <LeafletMap markers={resourceMarkers} height="360px" />

        {/* Resources Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Resource Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Available Quantity</th>
                <th className="py-3 px-4 text-center">Condition</th>
                <th className="py-3 px-4">Focal Person & Phone</th>
                {currentUser.role === 'admin' && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resources
                .filter((r) => resourceCategoryFilter === 'all' || r.category === resourceCategoryFilter)
                .map((res) => {
                  const meta = getCategoryMeta(res.category);
                  return (
                    <tr key={res.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{res.name}</td>
                      <td className="py-2.5 px-4 text-slate-600 text-[11px]">{res.locationName}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">
                        {res.quantity.toLocaleString()} {res.unit}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                          {res.condition}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-800">{res.contactPerson}</div>
                        <a href={`tel:${res.phone}`} className="text-blue-600 font-mono text-[11px] hover:underline">
                          {res.phone}
                        </a>
                      </td>
                      {currentUser.role === 'admin' && (
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => {
                              const newQty = prompt('Update available quantity:', String(res.quantity));
                              if (newQty && !isNaN(Number(newQty))) {
                                updateResource(res.id, { quantity: Number(newQty) });
                              }
                            }}
                            className="text-xs text-blue-600 hover:underline font-bold"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Add Emergency Resource Inventory</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Resource Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Armed Police Force Rapid Raft Squadron"
                  value={newRes.name}
                  onChange={(e) => setNewRes({ ...newRes, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newRes.category}
                    onChange={(e) => setNewRes({ ...newRes, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    <option value="ambulance">Ambulance</option>
                    <option value="fire_engine">Fire Engine</option>
                    <option value="rescue_team">Rescue Team</option>
                    <option value="boat">Rescue Boat</option>
                    <option value="shelter">Evacuation Shelter</option>
                    <option value="relief_stock">Relief Stock</option>
                    <option value="volunteers">Volunteers</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity & Unit</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      required
                      value={newRes.quantity}
                      onChange={(e) => setNewRes({ ...newRes, quantity: Number(e.target.value) })}
                      className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="e.g. units"
                      value={newRes.unit}
                      onChange={(e) => setNewRes({ ...newRes, unit: e.target.value })}
                      className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Base / Depot Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kurintar Base / Ward 4 Emergency Hall"
                  value={newRes.locationName}
                  onChange={(e) => setNewRes({ ...newRes, locationName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Officer</label>
                  <input
                    type="text"
                    required
                    placeholder="Name & rank"
                    value={newRes.contactPerson}
                    onChange={(e) => setNewRes({ ...newRes, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="01-xxxxxx / 98xxxxxxxx"
                    value={newRes.phone}
                    onChange={(e) => setNewRes({ ...newRes, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
