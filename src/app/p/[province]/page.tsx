'use client';

import React, { useEffect, use } from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/store';
import { PROVINCES } from '@/data/locations';
import DashboardPage from '@/app/page';
import { MapPin, ArrowLeft } from 'lucide-react';

export default function ScopedProvincePage({ params }: { params: Promise<{ province: string }> }) {
  const resolvedParams = use(params);
  const { province } = resolvedParams;
  const { setFilters, language } = usePortalStore();

  const foundProvince = PROVINCES.find(
    (p) => p.code.toLowerCase() === province.toLowerCase() || p.id.toLowerCase() === province.toLowerCase()
  );

  useEffect(() => {
    if (foundProvince) {
      setFilters((prev) => ({
        ...prev,
        provinceId: foundProvince.id,
        districtId: '',
        municipalityId: ''
      }));
    }
  }, [foundProvince, setFilters]);

  return (
    <div className="space-y-4">
      <div className="bg-blue-900 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-400" />
          <div>
            <h1 className="text-base font-bold">
              {foundProvince ? (language === 'ne' ? foundProvince.nameNepali : foundProvince.name) : province}
              <span className="ml-2 text-xs font-normal text-blue-200">
                (Provincial Portal Scope • Area: {foundProvince?.areaKm2.toLocaleString()} km² • Pop: {foundProvince?.population.toLocaleString()})
              </span>
            </h1>
          </div>
        </div>
        <Link
          href="/"
          className="text-xs bg-blue-800 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>National View</span>
        </Link>
      </div>

      <DashboardPage />
    </div>
  );
}
