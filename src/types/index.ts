export type UserRole = 'public' | 'reporter' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organization: string;
  districtId?: string;
  municipalityId?: string;
}

export interface Province {
  id: string;
  code: string; // e.g. "p-1", "p-3" (Bagmati)
  name: string;
  nameNepali: string;
  lat: number;
  lng: number;
  areaKm2: number;
  population: number;
}

export interface District {
  id: string;
  code: string; // e.g. "kathmandu", "kaski"
  name: string;
  nameNepali: string;
  provinceId: string;
  lat: number;
  lng: number;
  headquarter: string;
  population: number;
  households: number;
  areaKm2: number;
}

export interface Municipality {
  id: string;
  code: string;
  name: string;
  nameNepali: string;
  districtId: string;
  type: 'Metropolitan' | 'Sub-Metropolitan' | 'Municipality' | 'Rural Municipality';
  lat: number;
  lng: number;
  population: number;
  wardsCount: number;
}

export type HazardType =
  | 'flood'
  | 'landslide'
  | 'earthquake'
  | 'fire_house'
  | 'fire_forest'
  | 'thunderbolt'
  | 'avalanche'
  | 'glof'
  | 'drought'
  | 'epidemic'
  | 'road_accident'
  | 'other';

export type IncidentStatus = 'reported' | 'verified' | 'response_ongoing' | 'resolved' | 'rejected';
export type IncidentSeverity = 'minor' | 'moderate' | 'severe' | 'catastrophic';

export interface IncidentPhoto {
  id: string;
  url: string;
  caption: string;
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  title: string;
  message: string;
  statusChange?: IncidentStatus;
  createdAt: string;
  authorName: string;
  authorRole: string;
}

export interface Incident {
  id: string;
  title: string;
  titleNepali?: string;
  hazardType: HazardType;
  provinceId: string;
  districtId: string;
  municipalityId: string;
  wardNumber?: number;
  locationName: string;
  lat: number;
  lng: number;
  dateTime: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  deaths: number;
  injured: number;
  missing: number;
  housesDestroyed: number;
  housesDamaged: number;
  livestockLost: number;
  estimatedLossNpr: number;
  description: string;
  responseActions?: string;
  source: string;
  reportedBy: string;
  reporterRole: UserRole;
  photos: IncidentPhoto[];
  updates: IncidentUpdate[];
  createdAt: string;
}

export interface HydroMetStation {
  id: string;
  name: string;
  river: string;
  basin: string;
  districtId: string;
  lat: number;
  lng: number;
  warningLevelM: number;
  dangerLevelM: number;
  currentWaterLevelM?: number;
  dischargeM3s?: number;
  rainfall24hMm?: number;
  status: 'normal' | 'warning' | 'danger';
  trend: 'rising' | 'steady' | 'falling';
  sparkline: number[];
  lastUpdated: string;
}

export interface EarthquakeEvent {
  id: string;
  place: string;
  magnitude: number;
  depthKm: number;
  lat: number;
  lng: number;
  timeUtc: string;
  timeNpt: string;
  feltReports?: number;
}

export interface AirQualityStation {
  city: string;
  district: string;
  lat: number;
  lng: number;
  aqiUs: number;
  pm25: number;
  pm10: number;
  category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  dominantPollutant: string;
  updatedAt: string;
}

export interface FireHotspot {
  id: string;
  district: string;
  location: string;
  lat: number;
  lng: number;
  confidence: 'nominal' | 'high';
  brightnessKelvin: number;
  detectedAt: string;
  type: 'forest' | 'agricultural';
}

export interface ResourceItem {
  id: string;
  name: string;
  category: 'ambulance' | 'fire_engine' | 'rescue_team' | 'boat' | 'shelter' | 'relief_stock' | 'volunteers';
  quantity: number;
  unit: string;
  condition: 'operational' | 'standby' | 'deployed' | 'maintenance';
  locationName: string;
  districtId: string;
  municipalityId?: string;
  lat: number;
  lng: number;
  contactPerson: string;
  phone: string;
  notes?: string;
}

export interface DisasterAlert {
  id: string;
  title: string;
  titleNepali?: string;
  hazardType: HazardType;
  severity: 'advisory' | 'watch' | 'warning' | 'emergency';
  provinceIds: string[];
  districtIds: string[];
  message: string;
  instruction: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  issuedBy: string;
}

export interface DisasterCommitteeContact {
  id: string;
  districtId: string;
  role: string;
  name: string;
  organization: string;
  phone: string;
  email: string;
}

export interface ActivityLogItem {
  id: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'incident' | 'alert' | 'resource' | 'damage';
  entityId: string;
  details: string;
  timestamp: string;
}

export type VolunteerSkill =
  | 'first_aid'
  | 'search_rescue'
  | 'medical'
  | 'driving'
  | 'cooking'
  | 'logistics'
  | 'shelter'
  | 'counselling';

export interface VolunteerSignup {
  id: string;
  incidentId: string;
  name: string;
  phone: string;
  skills: VolunteerSkill[];
  availability: 'today' | 'this_week' | 'weekends';
  hasTransport: boolean;
  note?: string;
  createdAt: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  /** 'gps' when from the device, 'district' when the user picked a district */
  source: 'gps' | 'district';
  accuracyM?: number;
  districtId: string;
}
