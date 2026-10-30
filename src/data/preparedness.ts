import { HazardType } from '@/types';
import { SAFETY_GUIDES } from './safetyGuides';

/**
 * Preparedness guidance by stage. "During" steps come from SAFETY_GUIDES so the
 * get-ready popup and the assistant's offline answers never disagree.
 */

export type PrepStage = 'prepare' | 'warning' | 'during' | 'after';

export const PREP_STAGES: { id: PrepStage; label: string; hint: string }[] = [
  { id: 'prepare', label: 'Prepare now', hint: 'Do these before anything happens' },
  { id: 'warning', label: 'When it’s coming', hint: 'An alert is issued or signs appear' },
  { id: 'during', label: 'During', hint: 'Protect yourself first' },
  { id: 'after', label: 'After', hint: 'Stay safe while things settle' }
];

export interface PrepGuide {
  id: string;
  label: string;
  /** Alert hazard types that open this guide. */
  hazards: HazardType[];
  prepare: string[];
  warning: string[];
  after: string[];
}

export const PREP_GUIDES: PrepGuide[] = [
  {
    id: 'flood',
    label: 'Flood',
    hazards: ['flood', 'glof'],
    prepare: [
      'Find out if your home is in a flood-prone area and where the nearest high ground is.',
      'Agree on a meeting place with your family in case you are separated.',
      'Keep important documents in a waterproof bag, up high.',
      'Pack an emergency bag (see the list below).',
      'Save 1149 (flood warning) and 1155 (disaster helpline) in your phone.',
      'Know how to switch off your electricity and gas.'
    ],
    warning: [
      'Move people who need help first: elderly, children, people with disabilities, pregnant women.',
      'Move valuables, grain and documents to an upper floor.',
      'Take livestock to higher ground if you can do it safely.',
      'Charge your phone and power bank.',
      'Fill clean containers with drinking water.',
      'Be ready to leave as soon as the ward office or police tell you to.'
    ],
    after: [
      'Return home only when authorities say it is safe.',
      'Do not touch electrical equipment if it is wet or you are standing in water.',
      'Boil or treat all drinking water until supply is declared safe.',
      'Throw away food that has touched flood water.',
      'Take photos of damage for relief and compensation claims.',
      'Watch for snakes and sharp debris in mud and water.'
    ]
  },
  {
    id: 'landslide',
    label: 'Landslide',
    hazards: ['landslide', 'avalanche'],
    prepare: [
      'Learn the warning signs: new cracks, tilting trees or poles, muddy streams, rumbling sounds.',
      'Identify a safe place away from steep slopes and river valleys.',
      'Keep drainage channels around your house clear.',
      'Agree on a meeting place and an evacuation route with your family.',
      'Pack an emergency bag (see the list below).'
    ],
    warning: [
      'During heavy rain, do not sleep in rooms facing a steep slope.',
      'Take turns keeping watch at night when rain is heavy.',
      'Avoid travel on mountain roads unless necessary.',
      'Move to your safe place early if cracks or muddy water appear.',
      'Tell neighbours about any warning signs you see.'
    ],
    after: [
      'Stay away from the slide area; more slides often follow.',
      'Check for injured or trapped people nearby without entering the slide area, and direct rescuers to them.',
      'Report blocked roads and broken power or water lines to the ward office or 1155.',
      'Watch for flooding, which can follow a landslide that blocks a river.'
    ]
  },
  {
    id: 'earthquake',
    label: 'Earthquake',
    hazards: ['earthquake'],
    prepare: [
      'Fix heavy furniture, shelves and gas cylinders to the wall.',
      'Keep heavy objects on low shelves, not above beds.',
      'Find the safe spots in each room: under a sturdy table, away from windows.',
      'Practise drop, cover and hold on with your family.',
      'Agree on an open meeting place away from buildings.',
      'Pack an emergency bag (see the list below).'
    ],
    warning: [
      'Earthquakes come without warning. Keep your emergency bag by the door.',
      'After a large earthquake, expect aftershocks for days or weeks.',
      'Sleep with shoes and a torch near your bed.'
    ],
    after: [
      'Check yourself and others for injuries. Give first aid if you can.',
      'Leave damaged buildings carefully. Do not use lifts.',
      'If you smell gas, open windows, leave, and do not use flames or switches.',
      'Stay out of damaged buildings until engineers say they are safe.',
      'Use text messages to reach family; keep phone lines free for rescue.',
      'Listen to radio or official alerts for instructions.'
    ]
  },
  {
    id: 'fire',
    label: 'Fire',
    hazards: ['fire_house', 'fire_forest'],
    prepare: [
      'Keep a bucket of sand or water and a fire extinguisher if possible.',
      'Check gas cylinders, pipes and wiring for leaks or damage.',
      'Never leave cooking fires or candles unattended.',
      'Plan two ways out of every room.',
      'Near forests, clear dry leaves and grass around your house in the dry season.'
    ],
    warning: [
      'If a forest fire is nearby, close windows and doors to keep out smoke and embers.',
      'Move gas cylinders and fuel away from the house.',
      'Wet the roof and the area around the house if water is available.',
      'Be ready to leave early. Do not wait until the fire is close.',
      'Wear a damp cloth or mask over your nose and mouth in heavy smoke.'
    ],
    after: [
      'Do not go back into a burned building until it is declared safe.',
      'Watch for hot spots and smouldering embers.',
      'Get medical help for burns and smoke inhalation, even if they seem minor.',
      'Take photos of damage for relief and compensation claims.'
    ]
  },
  {
    id: 'lightning',
    label: 'Storm and lightning',
    hazards: ['thunderbolt'],
    prepare: [
      'Find out if your house or school has a lightning rod.',
      'Know where the nearest solid shelter is when working in fields.',
      'Trim dead branches near your house.'
    ],
    warning: [
      'When you hear thunder, go inside a solid building or hard-roofed vehicle.',
      'Bring livestock in or away from lone trees.',
      'Unplug electrical appliances.',
      'Stay off rooftops and away from water.'
    ],
    after: [
      'Wait 30 minutes after the last thunder before going outside.',
      'Someone struck by lightning is safe to touch. Call 102 and start CPR if they are not breathing.',
      'Stay away from fallen power lines.'
    ]
  }
];

export const EMERGENCY_BAG = [
  'Drinking water: about 3 litres per person per day, for 3 days',
  'Dry food: chiura, biscuits, dried fruit, noodles',
  'Medicines and copies of prescriptions',
  'First aid kit',
  'Torch with spare batteries',
  'Charged power bank and phone charger',
  'Copies of citizenship, land papers and bank documents in a waterproof bag',
  'Some cash',
  'Whistle to signal for help',
  'Warm clothes, rain jacket and blanket',
  'Important phone numbers written on paper',
  'Face masks, soap and sanitary items',
  'Items for babies, older people or anyone with special needs'
];

export function duringSteps(guideId: string): string[] {
  return SAFETY_GUIDES.find((g) => g.id === guideId)?.steps ?? [];
}

export function guideForHazard(hazard?: HazardType): PrepGuide {
  return PREP_GUIDES.find((g) => hazard && g.hazards.includes(hazard)) ?? PREP_GUIDES[0];
}
