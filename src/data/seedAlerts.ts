import { DisasterAlert } from '@/types';

export const SEED_ALERTS: DisasterAlert[] = [
  {
    id: 'alt-01',
    title: 'RED ALERT: Extreme River Flood Warning for Karnali Basin',
    titleNepali: 'रातो चेतावनी: कर्णाली जलाधार क्षेत्रमा उच्च बाढीको जोखिम',
    hazardType: 'flood',
    severity: 'emergency',
    provinceIds: ['p-7', 'p-6'],
    districtIds: ['d-kll', 'd-knc', 'd-srk'],
    message: 'Water levels at Chisapani gauge have breached the Danger Threshold (10.8m) and are rising. Severe inundation imminent in low-lying riverside wards of Tikapur, Janaki, and Bhajani.',
    instruction: 'Immediately evacuate vulnerable families, livestock, and essential valuables to designated high-ground community flood shelters. Avoid all water transport and fishing.',
    startsAt: '2026-10-03T06:00:00Z',
    expiresAt: '2026-10-04T18:00:00Z',
    isActive: true,
    issuedBy: 'Department of Hydrology and Meteorology (DHM) / National Disaster Risk Reduction & Management Authority (NDRRMA)'
  },
  {
    id: 'alt-02',
    title: 'ORANGE WARNING: High Landslide Vulnerability along Melamchi and Bhotekoshi Corridors',
    titleNepali: 'सुन्तला चेतावनी: मेलम्ची र भोटेकोशी करिडोरमा पहिरोको उच्च जोखिम',
    hazardType: 'landslide',
    severity: 'warning',
    provinceIds: ['p-3'],
    districtIds: ['d-spc', 'd-kvr'],
    message: 'Continuous cumulative 48-hour rainfall exceeding 180mm has saturated mountain slopes. High probability of debris flows and rockfalls on Araniko and Helambu access roads.',
    instruction: 'Halt non-essential highway travel. Communities residing beneath steep gullies must maintain night-watch vigilance and relocate to ward shelters if muddy runoff is sighted.',
    startsAt: '2026-10-02T12:00:00Z',
    expiresAt: '2026-10-04T12:00:00Z',
    isActive: true,
    issuedBy: 'Sindhupalchok District Emergency Operations Center (DEOC)'
  },
  {
    id: 'alt-03',
    title: 'YELLOW WATCH: Heavy Rainfall and Urban Inundation Advisory for Kathmandu Valley',
    titleNepali: 'पहेंलो सतर्कता: काठमाडौँ उपत्यकामा भारी वर्षा र डुबान सम्भावना',
    hazardType: 'flood',
    severity: 'watch',
    provinceIds: ['p-3'],
    districtIds: ['d-ktm', 'd-lal', 'd-bkt'],
    message: 'Monsoon trough situated close to central Nepal is producing intense localized downpours. Hanumante, Dhobikhola, and Bagmati river corridors may experience rapid swelling.',
    instruction: 'Keep ground floor basement storage clear in Balkhu, Shankhamul, and Radhe Radhe areas. Do not attempt driving through submerged underpasses.',
    startsAt: '2026-10-03T00:00:00Z',
    expiresAt: '2026-10-03T23:59:59Z',
    isActive: true,
    issuedBy: 'Kathmandu Valley DRR Coordination Committee'
  },
  {
    id: 'alt-04',
    title: 'BLUE ADVISORY: Thunderstorm and Lightning Precaution for Madhesh Plains',
    titleNepali: 'नीलो सल्लाह: मधेश प्रदेशमा हावाहुरी तथा चट्याङ्गको सतर्कता',
    hazardType: 'thunderbolt',
    severity: 'advisory',
    provinceIds: ['p-2'],
    districtIds: ['d-dhn', 'd-par'],
    message: 'Convective storm cloud clusters developing across Dhanusha and Parsa plains with active lightning discharge expected this afternoon.',
    instruction: 'Avoid staying in open agricultural fields or sheltering under isolated trees. Disconnect high-voltage household electrical appliances.',
    startsAt: '2026-10-03T08:00:00Z',
    expiresAt: '2026-10-03T20:00:00Z',
    isActive: true,
    issuedBy: 'Meteorological Forecasting Division (MFD)'
  }
];
