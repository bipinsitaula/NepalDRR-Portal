import { DisasterCommitteeContact } from '@/types';

export interface RiskZonePolygon {
  id: string;
  name: string;
  category: 'flood' | 'landslide' | 'earthquake_fault';
  riskLevel: 'high' | 'medium' | 'low';
  color: string;
  coordinates: [number, number][]; // [lat, lng] array
  description: string;
}

export interface CriticalFacility {
  id: string;
  name: string;
  type: 'hospital' | 'shelter' | 'heliport' | 'depot';
  lat: number;
  lng: number;
  districtId: string;
  capacity?: string;
  contact?: string;
}

export const RISK_ZONE_POLYGONS: RiskZonePolygon[] = [
  // Karnali Delta Flood Zone
  {
    id: 'rz-fl-01',
    name: 'Karnali Lower Delta Flood Inundation Plain',
    category: 'flood',
    riskLevel: 'high',
    color: '#2563EB',
    coordinates: [
      [28.72, 81.18],
      [28.65, 81.28],
      [28.48, 81.25],
      [28.42, 81.08],
      [28.52, 81.02],
      [28.72, 81.18]
    ],
    description: 'High frequency seasonal inundation zone affecting Tikapur, Bhajani, and southern Kailali.'
  },
  // Melamchi River Corridor Flash Flood & Debris Zone
  {
    id: 'rz-fl-02',
    name: 'Melamchi - Indrawati High-Energy Debris Corridor',
    category: 'flood',
    riskLevel: 'high',
    color: '#0284C7',
    coordinates: [
      [27.98, 85.54],
      [27.91, 85.59],
      [27.83, 85.62],
      [27.81, 85.55],
      [27.89, 85.51],
      [27.98, 85.54]
    ],
    description: 'Steep catchment with significant moraine sediment deposits upstream prone to rapid channel blockage.'
  },
  // Sindhupalchok High Landslide Susceptibility Zone
  {
    id: 'rz-ls-01',
    name: 'Sindhupalchok High Landslide Susceptibility Belt',
    category: 'landslide',
    riskLevel: 'high',
    color: '#DC2626',
    coordinates: [
      [27.95, 85.65],
      [27.92, 85.92],
      [27.75, 85.95],
      [27.72, 85.68],
      [27.85, 85.62],
      [27.95, 85.65]
    ],
    description: 'Slopes over 35 degrees with fractured metamorphic schist, high monsoon precipitation and post-2015 seismic fissures.'
  },
  // Gorkha - Barpak Seismic Fault & High Susceptibility
  {
    id: 'rz-ls-02',
    name: 'Gorkha - Trishuli Mountain Slope Risk Zone',
    category: 'landslide',
    riskLevel: 'medium',
    color: '#F59E0B',
    coordinates: [
      [28.32, 84.62],
      [28.3, 84.85],
      [28.15, 84.88],
      [28.12, 84.6],
      [28.32, 84.62]
    ],
    description: 'Moderate to high terrain vulnerability along deep Himalayan river valleys.'
  },
  // Main Boundary Thrust (MBT) Seismic Trace
  {
    id: 'rz-eq-01',
    name: 'Main Boundary Thrust (MBT) Tectonic Front',
    category: 'earthquake_fault',
    riskLevel: 'high',
    color: '#7F1D1D',
    coordinates: [
      [28.85, 80.35],
      [28.45, 81.65],
      [27.95, 83.25],
      [27.55, 84.8],
      [27.2, 86.2],
      [26.85, 87.8]
    ],
    description: 'Major active tectonic boundary between Lesser Himalayas and Sub-Himalayas (Siwalik hills) with locked seismic strain.'
  }
];

export const CRITICAL_FACILITIES: CriticalFacility[] = [
  {
    id: 'cf-01',
    name: 'Tribhuvan University Teaching Hospital (TUTH)',
    type: 'hospital',
    lat: 27.735,
    lng: 85.33,
    districtId: 'd-ktm',
    capacity: '1,000 beds, Heliport on-site, Level-1 Trauma'
  },
  {
    id: 'cf-02',
    name: 'Patan Hospital & Emergency Hub',
    type: 'hospital',
    lat: 27.668,
    lng: 85.321,
    districtId: 'd-lal',
    capacity: '550 beds, Emergency triage ward'
  },
  {
    id: 'cf-03',
    name: 'Bhotekoshi Relief Staging Helipad (Larcha)',
    type: 'heliport',
    lat: 27.87,
    lng: 85.92,
    districtId: 'd-spc',
    capacity: 'All-weather concrete pad for MI-17 helicopters'
  },
  {
    id: 'cf-04',
    name: 'Chitwan Medical College Hospital',
    type: 'hospital',
    lat: 27.68,
    lng: 84.43,
    districtId: 'd-cht',
    capacity: '750 beds, Critical care ICU'
  },
  {
    id: 'cf-05',
    name: 'Western Regional Hospital (Pokhara Academy of Health Sciences)',
    type: 'hospital',
    lat: 28.21,
    lng: 83.99,
    districtId: 'd-ksk',
    capacity: '600 beds, Trauma center'
  },
  {
    id: 'cf-06',
    name: 'Koshi Hospital Biratnagar',
    type: 'hospital',
    lat: 26.46,
    lng: 87.28,
    districtId: 'd-mor',
    capacity: '400 beds'
  },
  {
    id: 'cf-07',
    name: 'Seti Provincial Hospital (Dhangadhi)',
    type: 'hospital',
    lat: 28.7,
    lng: 80.59,
    districtId: 'd-kll',
    capacity: '350 beds'
  },
  {
    id: 'cf-08',
    name: 'Lumbini Provincial Hospital (Butwal)',
    type: 'hospital',
    lat: 27.7,
    lng: 83.45,
    districtId: 'd-rup',
    capacity: '500 beds'
  }
];

export const DISTRICT_COMMITTEES: DisasterCommitteeContact[] = [
  {
    id: 'com-ktm-1',
    districtId: 'd-ktm',
    role: 'Coordinator / Chief District Officer (CDO)',
    name: 'Jitendra Basnet',
    organization: 'District Administration Office, Kathmandu',
    phone: '01-4262446 / 9851200001',
    email: 'cdo.kathmandu@moha.gov.np'
  },
  {
    id: 'com-ktm-2',
    districtId: 'd-ktm',
    role: 'Metropolitan Disaster Focal Person',
    name: 'Archana Shrestha',
    organization: 'Kathmandu Metropolitan City DRR Section',
    phone: '01-4231481 / 1180',
    email: 'drr@kathmandu.gov.np'
  },
  {
    id: 'com-spc-1',
    districtId: 'd-spc',
    role: 'Coordinator / Chief District Officer',
    name: 'Kiran Thapa',
    organization: 'District Administration Office, Sindhupalchok',
    phone: '011-620133 / 9851123450',
    email: 'cdo.sindhupalchok@moha.gov.np'
  },
  {
    id: 'com-spc-2',
    districtId: 'd-spc',
    role: 'Nepal Red Cross Chapter Chair',
    name: 'Rajendra Man Dongol',
    organization: 'NRCS Sindhupalchok Chapter',
    phone: '011-620144 / 9841334455',
    email: 'nrcs.sindhupalchok@nrcs.org'
  },
  {
    id: 'com-cht-1',
    districtId: 'd-cht',
    role: 'Coordinator / Chief District Officer',
    name: 'Bhupendra Thapa',
    organization: 'District Administration Office, Chitwan',
    phone: '056-520133 / 9855012345',
    email: 'cdo.chitwan@moha.gov.np'
  },
  {
    id: 'com-ksk-1',
    districtId: 'd-ksk',
    role: 'Coordinator / Chief District Officer',
    name: 'Basanta Adhikari',
    organization: 'District Administration Office, Kaski',
    phone: '061-520133 / 9856012345',
    email: 'cdo.kaski@moha.gov.np'
  },
  {
    id: 'com-kll-1',
    districtId: 'd-kll',
    role: 'Coordinator / Chief District Officer',
    name: 'Dharmendra Kumar Mishra',
    organization: 'District Administration Office, Kailali',
    phone: '091-521133 / 9858412345',
    email: 'cdo.kailali@moha.gov.np'
  },
  {
    id: 'com-mor-1',
    districtId: 'd-mor',
    role: 'Coordinator / Chief District Officer',
    name: 'Prem Prasad Bhattarai',
    organization: 'District Administration Office, Morang',
    phone: '021-522133 / 9852012345',
    email: 'cdo.morang@moha.gov.np'
  }
];
