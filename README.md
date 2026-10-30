# NepalDRR Portal (नेपाल विपद् पोर्टल)
### National Disaster Information Management System for Nepal

> **Hackathon Edition — Decision Support & Multi-Hazard Telemetry Platform**  
> *All statistical records are seeded synthetic baseline models, clearly marked as **Demo data**.*

---

## 🚀 Key Highlights & Architecture

NepalDRR Portal is an enterprise-grade government decision-support platform designed for the **National Emergency Operations Center (NEOC)**, **NDRRMA**, and provincial/municipal disaster management desks in Nepal.

- **Data-Dense Government Portal Look**: Clean deep navy blue (`#0F2C59`) and white base with emergency crimson/orange accents inspired by the national flag of Nepal.
- **Three-Level Administrative Scoping**: Cascading dropdowns (**Province > District > Municipality**) filtering every chart, map, and metric card across all pages.
- **URL-Based Scoping**: Direct permalinks for any administrative territory:
  - `/p/bagmati`, `/p/koshi`, `/p/gandaki`...
  - `/d/kathmandu`, `/d/sindhupalchok`, `/d/chitwan`, `/d/kailali`...
  - `/m/melamchi`, `/m/kathmandu-metro`, `/m/pokhara`...
- **Multi-Map Integration**: Seamless toggle between **Leaflet GIS (OpenStreetMap / CartoDB)**, **Google Maps Hybrid (Satellite Imagery)**, **Google Terrain (Elevation Contours)**, and **Google Roadmap**, plus direct deep-links into native Google Maps/Earth!
- **Zero-Friction Offline Demo Fallback**: Works 100% offline out-of-the-box with **150 realistic disaster incidents** over 5 years (2022–2026), 22 hydro-met river stations, emergency resource inventories, and live USGS/Open-Meteo gateway caching.
- **Turnkey Supabase Backend**: Full `supabase_schema.sql` included with PostgreSQL tables, foreign keys, geospatial coordinates, Row Level Security (RLS) policies, indexes, and storage buckets.

---

## 📦 Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router) + TypeScript + React 19 |
| **Styling** | Tailwind CSS + Lucide React Icons |
| **Mapping Engines** | **Leaflet** + **OpenStreetMap** (SSR-safe dynamic import) + **Google Maps** (Hybrid Satellite, Topographic Terrain, Roadmap, Embed) |
| **Data Visualization** | **Recharts** (Area charts, multi-year lines, hazard donuts, horizontal bar charts) |
| **Database & Auth** | **Supabase** (Postgres + Auth RBAC + Realtime + Photo Storage) with mock/offline fallback store |
| **APIs** | Live USGS Earthquake API, Open-Meteo River Discharge & Flood API, Open-Meteo Air Quality API |
| **Deployment** | Vercel Ready (Standalone output, static + dynamic route handlers) |

---

## 👥 User Roles & Seeded Accounts

The portal features an instant **Demo Role Switcher** in the top navigation bar, plus a dedicated `/login` page with 1-click evaluation shortcuts:

1. **Public Viewer** (`citizen.viewer@nepaldrr.gov.np`):
   - Read-only access to all dashboards, interactive maps, telemetry feeds, and open data downloads. No login required.
2. **Reporter (Municipal / Ward Officer)** (`reporter.melamchi@nepaldrr.gov.np`):
   - Authorized to log new field incidents, attach damage and casualty statistics, and upload field photos with interactive GPS map pin picker.
3. **Administrator (NEOC Command Officer)** (`admin.neoc@nepaldrr.gov.np`):
   - Can verify or reject pending field incidents, update response statuses, post official timeline bulletins, manage emergency resource inventories, issue sirens/alerts, and review the security audit log.

---

## 🏛️ Administrative Hierarchy

Nepal has **7 Provinces**, **77 Districts**, and **753 Municipalities**. Seed data includes:
- **7 Provinces**: Koshi, Madhesh, Bagmati, Gandaki, Lumbini, Karnali, Sudurpashchim.
- **18 Key Districts**: Kathmandu, Lalitpur, Bhaktapur, Sindhupalchok, Kavrepalanchok, Chitwan, Kaski, Gorkha, Morang, Jhapa, Dhanusha, Parsa, Rupandehi, Dang, Surkhet, Jumla, Kailali, Kanchanpur.
- **45 Municipalities**: Metropolitans, Sub-Metropolitans, Municipalities, and Rural Municipalities with centroids and ward counts.

---

## 📑 Portal Modules & Pages

### 1. Situational Dashboard (`/`)
- **Emergency Helpline Strip**: 1155 (NEOC Disaster Toll-Free), 1149 (Flood Warning), 100 (Police), 101 (Fire), 102 (Ambulance).
- **Active Alerts Ticker**: Real-time broadcast banner for Red and Orange warnings.
- **8 Primary KPI Metric Cards**: Total incidents, human deaths, injuries, missing persons, destroyed houses, damaged houses, livestock lost, and estimated economic loss (NPR) with trend indicators.
- **Interactive GIS Map**: Incident clustering and multi-hazard distribution with Google Satellite/Terrain toggles.
- **Latest Incidents Feed**: Quick situational dispatch stream.
- **4 Recharts Visualizations**:
  - *Monsoon Seasonality Pattern*: Area chart highlighting intense surge during Ashadh, Shrawan, Bhadra (June-September).
  - *Multi-Year Incidents Trend*: 5-year line chart (2022–2026).
  - *Hazard Typology Donut*: Proportional incident breakdown.
  - *Top 10 Affected Districts*: Horizontal bar chart ranking vulnerability and loss.

### 2. Incidents Registry & Field Intake (`/incidents`)
- Search, filter by hazard, province, district, date range, severity, and status.
- Sorting by date, casualties, or economic loss.
- One-click CSV Export.
- **Incident Detail View** (`/incidents/[id]`):
  - Mini map with Google Maps / GIS toggle.
  - Casualty grid, field documentation photos gallery, operational response summary.
  - Timeline of chronological updates.
  - **Admin Command Panel**: Verify/reject reports and post official operational status updates.
- **Report Incident Form** (`/incidents/report`):
  - Interactive map pin selection (click on map to capture exact coordinates).
  - Multi-photo attachment simulation.
  - Form validation with immediate database integration.

### 3. Damage & Loss Analytics (`/damage-loss`)
- Multi-dimensional impact breakdown across human life, private housing, agriculture/livestock, and public infrastructure.
- **Comparative Loss Analysis**: Selected Year vs Baseline Year selector per hazard type.
- **District Choropleth Loss Map**: Color-coded circles scaling with financial damage.
- Categorical breakdown tables by District, Province, and Hazard.
- **Print Report**: Formatted CSS print layout ready for PDF generation.

### 4. Real-Time Multi-Hazard Telemetry (`/realtime`)
- **River Levels & Flood Warnings**: 22 hydro-met river stations (Devghat, Chatara, Chisapani, Karmaiya, Melamchi, etc.) comparing current discharge/water level against warning and danger thresholds with 24-hour trend sparklines.
- **USGS Earthquakes Live Gateway**: Bounding box query around Nepal (26.3°N–30.5°N, 80.0°E–88.2°E) from the USGS API with magnitude, focal depth, epicenter, and NPT time.
- **Open-Meteo Air Quality**: Live US AQI, PM2.5, PM10 metrics for Kathmandu, Pokhara, Biratnagar, Birgunj, and Nepalgunj.
- **Fire Hotspots**: NASA FIRMS infrared thermal anomaly hotspots with brightness temperatures.
- **Server Caching**: 30-minute in-memory caching with automatic fallback if upstream APIs are unreachable.

### 5. Multi-Hazard Risk Atlas & Early Warning (`/risk-info`)
- Toggleable GIS layers:
  - Flood-prone riverine corridors (Karnali delta, Melamchi, Koshi basin).
  - Landslide susceptibility zones (High/Medium/Low mountain belts).
  - Main Boundary Thrust (MBT) seismic fault front.
  - Critical infrastructure (Referral hospitals, emergency heliports, warehouses).
  - Historical incident density heatmap.
- **Impact-Based Early Warning (IBEW) Decision Matrix**:
  - Interactive mathematical model computing:  
    $$\text{Composite Risk Score} = (\text{Hazard} \times 0.45) + (\text{Exposure} \times 0.35) + (\text{Vulnerability} \times 0.20)$$
  - Dynamically calculates affected population and provides clear decision-support recommendations.

### 6. Local Profile & Capacity (`/profile`)
- Administrative demographic profile (Population, Households, Area, Local Units).
- **DDMC Leadership Roster**: Focal contacts for CDO, Municipal DRR Section, and Red Cross.
- **Resource Inventory**: Ambulances, fire engines, rescue teams, rafts/boats, evacuation shelters, relief food packs, tents, blankets, and volunteer corps.
- **Nearest Resources Dispatch Tool**: Uses the Haversine formula to compute straight-line distance in kilometers from any incident to the closest ambulances, shelters, and search squads!

### 7. Emergency Warnings & Bulletins (`/alerts`)
- Public emergency alerts bulletin sorted by severity (Emergency, Warning, Watch, Advisory).
- Interactive warning zones map.
- Public Early Warning Subscription form (SMS / Email simulation).
- **Public Feeds**:
  - JSON: `/api/alerts`
  - RSS 2.0 XML: `/api/alerts?format=rss`

### 8. Open Data & Admin Governance (`/data` & `/admin`)
- **Open Data Portal**: Direct downloads of Incidents, Emergency Resources, and Telemetry Stations in CSV and JSON formats.
- **Interactive REST API Explorer**: Built-in tester for `/api/incidents`, `/api/alerts`, `/api/resources`, `/api/realtime/earthquakes`, etc.
- **Admin Command Portal**:
  - Incident verification queue.
  - Bulk CSV incident parser and ingestion tool.
  - Role-based access control (RBAC) user governance.
  - Immutable activity audit trail log.

---

## 🛠️ Quick Start & Local Development

### 1. Installation
```bash
git clone <repo-url>
cd disaster
npm install
```

### 2. Environment Setup (Optional)
The portal runs out-of-the-box in **Offline Demo Mode** with complete seed data. To connect to your live Supabase database, update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** (or the port indicated in terminal) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🧪 Hackathon Demo Test Checklist

- [x] **Header & Location Selector**: Pick "Bagmati" > "Sindhupalchok" > "Melamchi" and verify all statistics and maps filter down to that scope.
- [x] **URL Scoping**: Visit `/p/bagmati` or `/d/kathmandu` and confirm the localized scoped portal view.
- [x] **Language Toggle**: Click the language toggle button to seamlessly switch between English and Nepali.
- [x] **Google Maps Integration**: On any map, click the layer menu in the top-right corner to toggle between **Google Hybrid (Satellite)**, **Google Terrain**, **Google Roadmap**, and **CartoDB/OSM**, or click **Google Maps** to deep link into native Google Maps!
- [x] **Incident Workflow**:
  - Use the role switcher to select **Reporter**.
  - Go to **Report Incident**, pick a location on the map, enter details, and submit.
  - Switch role to **Administrator**, go to the **Admin Panel**, and verify the pending report.
  - Check the incident detail page to see the verified status and updated timeline.
- [x] **Nearest Resources Tool**: On the **Profile** page, select an incident to calculate straight-line distances to the nearest ambulances and evacuation shelters.
- [x] **Live Telemetry**: Go to **Real-Time Feeds** to inspect live USGS earthquakes, hydro-met river crests, and city Air Quality Indexes.
- [x] **Open Data & API Explorer**: Go to `/data`, click "Send Request" in the API explorer, and download the full incident dataset in CSV format.
