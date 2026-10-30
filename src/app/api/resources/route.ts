import { NextResponse } from 'next/server';
import { SEED_RESOURCES } from '@/data/seedResources';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category');
  const district = searchParams.get('district');

  let results = SEED_RESOURCES;

  if (category && category !== 'all') {
    results = results.filter((r) => r.category.toLowerCase() === category.toLowerCase());
  }

  if (district && district !== 'all') {
    results = results.filter((r) => r.districtId.toLowerCase() === district.toLowerCase());
  }

  return NextResponse.json({
    status: 'success',
    count: results.length,
    resources: results
  });
}
