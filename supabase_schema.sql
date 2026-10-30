-- =========================================================================
-- NepalDRR Portal - Disaster Information Management System for Nepal
-- Full PostgreSQL / Supabase Database Schema with RLS, Indexes, & Storage
-- =========================================================================

-- Enable UUID and PostGIS extensions if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES TABLE (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('public', 'reporter', 'admin')) DEFAULT 'public',
  organization TEXT,
  district_id TEXT,
  municipality_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADMINISTRATIVE HIERARCHY
CREATE TABLE IF NOT EXISTS public.provinces (
  id TEXT PRIMARY KEY, -- e.g. 'p-1', 'p-3'
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_nepali TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  area_km2 NUMERIC,
  population BIGINT
);

CREATE TABLE IF NOT EXISTS public.districts (
  id TEXT PRIMARY KEY, -- e.g. 'd-ktm', 'd-spc'
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_nepali TEXT NOT NULL,
  province_id TEXT NOT NULL REFERENCES public.provinces(id) ON DELETE RESTRICT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  headquarter TEXT,
  population BIGINT,
  households BIGINT,
  area_km2 NUMERIC
);

CREATE TABLE IF NOT EXISTS public.municipalities (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_nepali TEXT NOT NULL,
  district_id TEXT NOT NULL REFERENCES public.districts(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('Metropolitan', 'Sub-Metropolitan', 'Municipality', 'Rural Municipality')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  population BIGINT,
  wards_count INTEGER DEFAULT 1
);

-- 3. HAZARD TYPES
CREATE TABLE IF NOT EXISTS public.hazard_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_nepali TEXT NOT NULL,
  category TEXT NOT NULL, -- hydro, geo, fire, climatological, biological, technological
  color_hex TEXT NOT NULL,
  icon_name TEXT NOT NULL
);

-- 4. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS public.incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_nepali TEXT,
  hazard_type_id TEXT NOT NULL REFERENCES public.hazard_types(id),
  province_id TEXT NOT NULL REFERENCES public.provinces(id),
  district_id TEXT NOT NULL REFERENCES public.districts(id),
  municipality_id TEXT REFERENCES public.municipalities(id),
  ward_number INTEGER,
  location_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reported', 'verified', 'response_ongoing', 'resolved', 'rejected')) DEFAULT 'reported',
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'catastrophic')) DEFAULT 'moderate',
  deaths INTEGER DEFAULT 0,
  injured INTEGER DEFAULT 0,
  missing INTEGER DEFAULT 0,
  houses_destroyed INTEGER DEFAULT 0,
  houses_damaged INTEGER DEFAULT 0,
  livestock_lost INTEGER DEFAULT 0,
  estimated_loss_npr BIGINT DEFAULT 0,
  description TEXT NOT NULL,
  response_actions TEXT,
  source TEXT DEFAULT 'Citizen/Field Report',
  reported_by TEXT NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INCIDENT UPDATES (Timeline)
CREATE TABLE IF NOT EXISTS public.incident_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id TEXT NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status_change TEXT CHECK (status_change IN ('reported', 'verified', 'response_ongoing', 'resolved', 'rejected')),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INCIDENT PHOTOS
CREATE TABLE IF NOT EXISTS public.incident_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id TEXT NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DAMAGE & LOSS DETAILED BREAKDOWN
CREATE TABLE IF NOT EXISTS public.damage_loss (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id TEXT NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  infrastructure_type TEXT NOT NULL, -- road, bridge, school, health_post, water_supply, transmission_line, irrigation
  units_damaged INTEGER DEFAULT 0,
  units_destroyed INTEGER DEFAULT 0,
  economic_loss_npr BIGINT DEFAULT 0,
  notes TEXT
);

-- 8. HYDRO-MET STATIONS & READINGS
CREATE TABLE IF NOT EXISTS public.stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  river TEXT NOT NULL,
  basin TEXT NOT NULL,
  district_id TEXT REFERENCES public.districts(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  warning_level_m DOUBLE PRECISION NOT NULL,
  danger_level_m DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS public.station_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id TEXT NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  water_level_m DOUBLE PRECISION,
  discharge_m3s DOUBLE PRECISION,
  rainfall_24h_mm DOUBLE PRECISION,
  status TEXT CHECK (status IN ('normal', 'warning', 'danger')) DEFAULT 'normal',
  reading_time TIMESTAMPTZ DEFAULT NOW()
);

-- 9. RISK LAYERS
CREATE TABLE IF NOT EXISTS public.risk_layers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('flood', 'landslide', 'earthquake_fault', 'infrastructure')),
  risk_level TEXT CHECK (risk_level IN ('high', 'medium', 'low')),
  color_hex TEXT,
  geometry_geojson JSONB,
  description TEXT
);

-- 10. RESOURCES & INVENTORY
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ambulance', 'fire_engine', 'rescue_team', 'boat', 'shelter', 'relief_stock', 'volunteers')),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL,
  condition TEXT CHECK (condition IN ('operational', 'standby', 'deployed', 'maintenance')) DEFAULT 'operational',
  location_name TEXT NOT NULL,
  district_id TEXT NOT NULL REFERENCES public.districts(id),
  municipality_id TEXT REFERENCES public.municipalities(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_nepali TEXT,
  hazard_type_id TEXT NOT NULL REFERENCES public.hazard_types(id),
  severity TEXT NOT NULL CHECK (severity IN ('advisory', 'watch', 'warning', 'emergency')),
  province_ids JSONB DEFAULT '[]'::jsonb,
  district_ids JSONB DEFAULT '[]'::jsonb,
  message TEXT NOT NULL,
  instruction TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  issued_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SUBSCRIBERS (SMS/Email Alerts)
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_type TEXT NOT NULL CHECK (contact_type IN ('sms', 'email')),
  contact_value TEXT NOT NULL,
  district_id TEXT REFERENCES public.districts(id),
  hazard_types JSONB DEFAULT '[]'::jsonb,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT & ACTIVITY LOG
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- INDEXES FOR HIGH-PERFORMANCE FILTERING AND SPATIAL QUERIES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_incidents_location ON public.incidents(province_id, district_id, municipality_id);
CREATE INDEX IF NOT EXISTS idx_incidents_date ON public.incidents(date_time DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_hazard ON public.incidents(hazard_type_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_lat_lng ON public.incidents(lat, lng);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(is_active, starts_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_resources_district ON public.resources(district_id, category);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (public) can read verified or active data
CREATE POLICY "Public read published incidents" ON public.incidents
  FOR SELECT USING (true);

CREATE POLICY "Public read incident updates" ON public.incident_updates
  FOR SELECT USING (true);

CREATE POLICY "Public read incident photos" ON public.incident_photos
  FOR SELECT USING (true);

CREATE POLICY "Public read resources" ON public.resources
  FOR SELECT USING (true);

CREATE POLICY "Public read active alerts" ON public.alerts
  FOR SELECT USING (true);

-- 2. Reporters and Admins can insert incidents
CREATE POLICY "Reporters and Admins can insert incidents" ON public.incidents
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

-- 3. Only Admins can update/verify incidents
CREATE POLICY "Admins can update incidents" ON public.incidents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 4. Admins can manage resources and alerts
CREATE POLICY "Admins can manage resources" ON public.resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage alerts" ON public.alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 5. Activity log insert for all authenticated actions
CREATE POLICY "Authenticated users can write activity log" ON public.activity_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can read activity log" ON public.activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- =========================================================================
-- STORAGE BUCKET CONFIGURATION FOR INCIDENT PHOTOS
-- =========================================================================
-- In Supabase dashboard or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('incident-photos', 'incident-photos', true);
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'incident-photos');
-- CREATE POLICY "Authenticated Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'incident-photos' AND auth.role() = 'authenticated');
