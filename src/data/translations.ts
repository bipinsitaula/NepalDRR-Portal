export type Language = 'en' | 'ne';

export const TRANSLATIONS = {
  en: {
    portalName: 'NepalDRR Portal',
    portalSub: 'Disaster Information Management System of Nepal',
    govHeader: 'Government of Nepal • National Emergency Operations Center (NEOC)',
    nav: {
      dashboard: 'Dashboard',
      nearMe: 'Near me',
      volunteer: 'Volunteer',
      assistant: 'Assistant',
      sos: 'Emergency help',
      incidents: 'Incidents',
      damageLoss: 'Damage & loss',
      realtime: 'Live feeds',
      riskInfo: 'Risk',
      profile: 'Local profile',
      alerts: 'Alerts',
      dataApi: 'Open data',
      admin: 'Admin',
      reportIncident: 'Report incident',
      login: 'Login',
      logout: 'Logout'
    },
    location: {
      allProvinces: 'All provinces',
      allDistricts: 'All districts',
      allMunicipalities: 'All municipalities',
      selectProvince: 'Province',
      selectDistrict: 'District',
      selectMunicipality: 'Municipality',
      clearScope: 'Clear',
      scopedTo: 'Area'
    },
    kpi: {
      totalIncidents: 'Incidents',
      deaths: 'Deaths',
      injured: 'Injuries',
      missing: 'Missing',
      housesDestroyed: 'Houses destroyed',
      housesDamaged: 'Houses damaged',
      livestockLost: 'Livestock lost',
      economicLoss: 'Estimated loss'
    },
    charts: {
      incidentsOverTime: 'Incidents by year',
      incidentsByHazard: 'Incidents by hazard',
      topDistricts: 'Most affected districts',
      seasonality: 'Incidents by month',
      lossByHazard: 'Economic loss by hazard'
    },
    helpline: {
      police: 'Police 100',
      fire: 'Fire 101',
      ambulance: 'Ambulance 102',
      neoc: 'Disaster 1155',
      floodTollFree: 'Flood warning 1149'
    }
  },
  ne: {
    portalName: 'नेपाल विपद् पोर्टल',
    portalSub: 'नेपाल विपद् पूर्वसूचना तथा सूचना व्यवस्थापन प्रणाली',
    govHeader: 'नेपाल सरकार • राष्ट्रिय आपतकालीन कार्यसञ्चालन केन्द्र (NEOC)',
    nav: {
      dashboard: 'ड्यासबोर्ड',
      nearMe: 'मेरो नजिक',
      volunteer: 'स्वयंसेवा',
      assistant: 'सहायक',
      sos: 'आपतकालीन सहायता',
      incidents: 'विपद् घटनाहरू',
      damageLoss: 'क्षति तथा नोक्सानी',
      realtime: 'प्रत्यक्ष तथ्याङ्क',
      riskInfo: 'जोखिम तथा पूर्वसूचना',
      profile: 'स्थानीय प्रोफाइल र स्रोत',
      alerts: 'चेतावनीहरू',
      dataApi: 'खुल्ला तथ्याङ्क र API',
      admin: 'प्रशासक प्यानल',
      reportIncident: 'घटना रिपोर्ट गर्नुहोस्',
      login: 'लगइन',
      logout: 'लगआउट'
    },
    location: {
      allProvinces: 'सबै प्रदेशहरू',
      allDistricts: 'सबै जिल्लाहरू',
      allMunicipalities: 'सबै पालिकाहरू',
      selectProvince: 'प्रदेश',
      selectDistrict: 'जिल्ला',
      selectMunicipality: 'पालिका',
      clearScope: 'हटाउनुहोस्',
      scopedTo: 'क्षेत्र'
    },
    kpi: {
      totalIncidents: 'कुल घटनाहरू',
      deaths: 'मृत्यु',
      injured: 'घाइते',
      missing: 'बेपत्ता',
      housesDestroyed: 'पूर्ण नष्ट घर',
      housesDamaged: 'आंशिक क्षति घर',
      livestockLost: 'चौपाया क्षति',
      economicLoss: 'अनुमानित आर्थिक क्षति (रु)'
    },
    charts: {
      incidentsOverTime: 'समय अनुसार घटनाको प्रवृत्ति (२०२२-२०२६)',
      incidentsByHazard: 'प्रकोप अनुसार घटनाहरू',
      topDistricts: 'सबैभन्दा बढी प्रभावित जिल्लाहरू',
      seasonality: 'मनसुन मौसमी ढाँचा (मासिक घटना वितरण)',
      lossByHazard: 'प्रकोप अनुसार आर्थिक क्षति'
    },
    helpline: {
      police: 'प्रहरी १००',
      fire: 'दमकल १०१',
      ambulance: 'एम्बुलेन्स १०२',
      neoc: 'विपद् ११५५',
      floodTollFree: 'बाढी पूर्वसूचना ११४९'
    }
  }
};
