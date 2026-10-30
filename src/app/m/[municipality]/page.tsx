'use client';

import React, { useEffect, use } from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/store';
import { MUNICIPALITIES, DISTRICTS } from '@/data/locations';
import DashboardPage from '@/app/page';
import { MapPin, ArrowLeft } from 'lucide-react';

export default function ScopedMunicipalityPage({ params }: { params: Promise<{ municipality: string }> }) {
  const resolvedParams = use(params);
  const { municipality } = resolvedParams;
  const { setFilters, language } = usePortalStore();

  const foundMuni = MUNICIPALITIES.find(
    (m) => m.code.toLowerCase() === municipality.toLowerCase() || m.id.toLowerCase() === municipality.toLowerCase()
  );

  const parentDistrict = foundMuni ? DISTRICTS.find((d) => d.id === foundMuni.districtId) : null;

  useEffect(() => {
    if (foundMuni) {
      setFilters((prev) => ({
        ...prev,
        provinceId: parentDistrict ? parentDistrict.provinceId : prev.provinceId,
        districtId: foundMuni.districtId,
        municipalityId: foundMuni.id
      }));
    }
  }, [foundMuni, parentDistrict, setFilters]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-500" />
          <div>
            <h1 className="text-base font-bold">
              {foundMuni ? (language === 'ne' ? foundMuni.nameNepali : foundMuni.name) : municipality}
              <span className="ml-2 text-xs font-normal text-slate-300">
                ({foundMuni?.type} • Wards: {foundMuni?.wardsCount} • Pop: {foundMuni?.population.toLocaleString()})
              </span>
            </h1>
          </div>
        </div>
        <Link
          href="/"
          className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>National View</span>
        </Link>
      </div>

      <DashboardPage />
    </div>
  );
}
