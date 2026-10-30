import { NextResponse } from 'next/server';
import { ALL_SEED_INCIDENTS } from '@/data/seedIncidents';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const hazard = searchParams.get('hazard');
  const province = searchParams.get('province');
  const district = searchParams.get('district');
  const status = searchParams.get('status');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 100;

  let results = ALL_SEED_INCIDENTS;

  if (hazard && hazard !== 'all') {
    results = results.filter((i) => i.hazardType.toLowerCase() === hazard.toLowerCase());
  }

  if (province && province !== 'all') {
    results = results.filter((i) => i.provinceId.toLowerCase() === province.toLowerCase());
  }

  if (district && district !== 'all') {
    results = results.filter((i) => i.districtId.toLowerCase() === district.toLowerCase());
  }

  if (status && status !== 'all') {
    results = results.filter((i) => i.status.toLowerCase() === status.toLowerCase());
  }

  const paginated = results.slice(0, isNaN(limit) ? 100 : limit);

  return NextResponse.json({
    status: 'success',
    totalAvailable: results.length,
    returned: paginated.length,
    filtersApplied: {
      hazard: hazard || null,
      province: province || null,
      district: district || null,
      status: status || null,
      limit: limit || 100
    },
    incidents: paginated
  });
}
