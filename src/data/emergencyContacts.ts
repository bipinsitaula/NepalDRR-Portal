export interface EmergencyContact {
  id: 'police' | 'ambulance' | 'fire' | 'disaster' | 'flood';
  number: string;
  label: string;
  labelNepali: string;
  description: string;
}

/** National emergency numbers, in the order a caller is most likely to need them. */
export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'ambulance',
    number: '102',
    label: 'Ambulance',
    labelNepali: 'एम्बुलेन्स',
    description: 'Injury, illness, someone not breathing'
  },
  {
    id: 'police',
    number: '100',
    label: 'Police',
    labelNepali: 'प्रहरी',
    description: 'Crime, violence, missing person, road accident'
  },
  {
    id: 'fire',
    number: '101',
    label: 'Fire brigade',
    labelNepali: 'दमकल',
    description: 'Fire, gas leak, people trapped'
  },
  {
    id: 'disaster',
    number: '1155',
    label: 'Disaster helpline',
    labelNepali: 'विपद् हेल्पलाइन',
    description: 'Flood, landslide, earthquake, rescue and relief'
  },
  {
    id: 'flood',
    number: '1149',
    label: 'Flood warning',
    labelNepali: 'बाढी पूर्वसूचना',
    description: 'River levels and flood early warning'
  }
];
