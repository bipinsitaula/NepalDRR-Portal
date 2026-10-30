'use client';

import React, { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { PROVINCES, DISTRICTS, MUNICIPALITIES } from '@/data/locations';

/**
 * Area filter shown as a single button with the current scope; the three
 * cascading selects live in a popover.
 */
export const LocationSelector: React.FC<{ variant?: 'dark' | 'light' }> = ({ variant = 'dark' }) => {
  const { filters, setFilters, language, t } = usePortalStore();
  const [open, setOpen] = useState(false);

  const nameOf = (item?: { name: string; nameNepali: string }) =>
    item ? (language === 'ne' ? item.nameNepali : item.name) : undefined;

  const province = PROVINCES.find((p) => p.id === filters.provinceId);
  const district = DISTRICTS.find((d) => d.id === filters.districtId);
  const muni = MUNICIPALITIES.find((m) => m.id === filters.municipalityId);
  const scopeLabel = nameOf(muni) ?? nameOf(district) ?? nameOf(province) ?? (language === 'ne' ? 'सम्पूर्ण नेपाल' : 'All of Nepal');
  const isFiltered = Boolean(province || district || muni);

  const handleProvinceChange = (val: string) =>
    setFilters((prev) => ({ ...prev, provinceId: val, districtId: '', municipalityId: '' }));

  const handleDistrictChange = (val: string) => {
    const dist = DISTRICTS.find((d) => d.id === val);
    setFilters((prev) => ({
      ...prev,
      districtId: val,
      provinceId: dist ? dist.provinceId : prev.provinceId,
      municipalityId: ''
    }));
  };

  const handleMunicipalityChange = (val: string) => {
    const m = MUNICIPALITIES.find((x) => x.id === val);
    const dist = m ? DISTRICTS.find((d) => d.id === m.districtId) : undefined;
    setFilters((prev) => ({
      ...prev,
      municipalityId: val,
      districtId: dist ? dist.id : prev.districtId,
      provinceId: dist ? dist.provinceId : prev.provinceId
    }));
  };

  const availableDistricts = filters.provinceId
    ? DISTRICTS.filter((d) => d.provinceId === filters.provinceId)
    : DISTRICTS;
  const availableMunicipalities = filters.districtId
    ? MUNICIPALITIES.filter((m) => m.districtId === filters.districtId)
    : MUNICIPALITIES.filter((m) => {
        if (!filters.provinceId) return true;
        return DISTRICTS.find((d) => d.id === m.districtId)?.provinceId === filters.provinceId;
      });

  const triggerClass =
    variant === 'dark'
      ? 'text-white/90 hover:bg-white/10 border-white/15'
      : 'text-text hover:bg-page border-line bg-white';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-md border px-2.5 h-9 text-sm transition-colors max-w-[16rem] ${triggerClass}`}
      >
        <MapPin className={`w-4 h-4 shrink-0 ${isFiltered ? 'text-crimson' : 'opacity-60'}`} aria-hidden />
        <span className="opacity-60 hidden sm:inline">{t.location.scopedTo}</span>
        <span className="font-medium truncate">{scopeLabel}</span>
        <ChevronDown className="w-4 h-4 shrink-0 opacity-60" aria-hidden />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 lg:left-auto lg:right-0 mt-2 w-72 rounded-lg bg-white text-text shadow-xl border border-line p-4 z-50 space-y-3">
            <div>
              <label htmlFor="scope-prov" className="field-label">{t.location.selectProvince}</label>
              <select id="scope-prov" className="field" value={filters.provinceId} onChange={(e) => handleProvinceChange(e.target.value)}>
                <option value="">{t.location.allProvinces}</option>
                {PROVINCES.map((p) => (
                  <option key={p.id} value={p.id}>{nameOf(p)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="scope-dist" className="field-label">{t.location.selectDistrict}</label>
              <select id="scope-dist" className="field" value={filters.districtId} onChange={(e) => handleDistrictChange(e.target.value)}>
                <option value="">{t.location.allDistricts}</option>
                {availableDistricts.map((d) => (
                  <option key={d.id} value={d.id}>{nameOf(d)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="scope-muni" className="field-label">{t.location.selectMunicipality}</label>
              <select id="scope-muni" className="field" value={filters.municipalityId} onChange={(e) => handleMunicipalityChange(e.target.value)}>
                <option value="">{t.location.allMunicipalities}</option>
                {availableMunicipalities.map((m) => (
                  <option key={m.id} value={m.id}>{nameOf(m)}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-between pt-1">
              <button
                type="button"
                className="btn btn-ghost px-2"
                disabled={!isFiltered}
                onClick={() => setFilters((prev) => ({ ...prev, provinceId: '', districtId: '', municipalityId: '' }))}
              >
                {t.location.clearScope}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
