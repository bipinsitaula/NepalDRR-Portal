'use client';

import React, { useEffect, use } from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/store';
import { DISTRICTS } from '@/data/locations';
import DashboardPage from '@/app/page';
import { MapPin, ArrowLeft } from 'lucide-react';

export default function ScopedDistrictPage({ params }: { params: Promise<{ district: string }> }) {
  const resolvedParams = use(params);
  const { district } = resolvedParams;
  const { setFilters, language } = usePortalStore();

  const foundDistrict = DISTRICTS.find(
    (d) => d.code.toLowerCase() === district.toLowerCase() || d.id.toLowerCase() === district.toLowerCase()
  );

  useEffect(() => {
    if (foundDistrict) {
      setFilters((prev) => ({
        ...prev,
        provinceId: foundDistrict.provinceId,
        districtId: foundDistrict.id,
        municipalityId: ''
      }));
    }
  }, [foundDistrict, setFilters]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-500" />
          <div>
            <h1 className="text-base font-bold">
              {foundDistrict ? (language === 'ne' ? foundDistrict.nameNepali : foundDistrict.name) : district} District
              <span className="ml-2 text-xs font-normal text-slate-300">
                (HQ: {foundDistrict?.headquarter} • Households: {foundDistrict?.households.toLocaleString()} • Pop: {foundDistrict?.population.toLocaleString()})
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
