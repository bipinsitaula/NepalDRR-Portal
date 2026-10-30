/**
 * Built-in safety guidance. Used by the assistant when the AI service is
 * unreachable (no network, no API key) so people always get basic steps.
 */
export interface SafetyGuide {
  id: string;
  title: string;
  keywords: string[];
  call?: string;
  steps: string[];
}

export const SAFETY_GUIDES: SafetyGuide[] = [
  {
    id: 'flood',
    title: 'Flood',
    keywords: ['flood', 'water', 'river', 'rain', 'बाढी', 'खोला', 'पानी'],
    call: '1155',
    steps: [
      'Move to higher ground now. Do not wait for water to reach your house.',
      'Never walk or drive through moving water. Ankle-deep water can knock you over, and knee-deep water can carry away a car.',
      'If it is safe, switch off electricity and gas before you leave.',
      'Take documents, medicines, a phone and drinking water. Leave everything else.',
      'Stay away from riverbanks, bridges and drains.',
      'Follow your ward office or police evacuation instructions.',
      'After the flood, boil or treat drinking water before using it.'
    ]
  },
  {
    id: 'earthquake',
    title: 'Earthquake',
    keywords: ['earthquake', 'quake', 'shaking', 'tremor', 'aftershock', 'भूकम्प', 'कम्प'],
    call: '1155',
    steps: [
      'Drop to your hands and knees, take cover under a sturdy table, and hold on until the shaking stops.',
      'If indoors, stay inside. Keep away from windows, shelves and outer walls.',
      'If outside, move to an open space away from buildings, walls, poles and wires.',
      'If in a vehicle, stop in an open area and stay inside.',
      'When the shaking stops, expect aftershocks. Leave damaged buildings carefully and do not use lifts.',
      'If you smell gas, do not use flames or switches. Open windows and leave.',
      'Send text messages instead of calling, to keep phone lines free for rescue.'
    ]
  },
  {
    id: 'landslide',
    title: 'Landslide',
    keywords: ['landslide', 'mudslide', 'debris', 'rockfall', 'slope', 'crack', 'पहिरो', 'ढुङ्गा'],
    call: '1155',
    steps: [
      'Warning signs: new cracks in the ground or walls, tilting trees or poles, sudden muddy water in streams, rumbling sounds.',
      'If you see any of these, move away from the slope at once. Go sideways out of the path, not downhill.',
      'During heavy rain, avoid sleeping in rooms facing a steep slope, and keep a night watch.',
      'Stay away from the slide area afterwards. More slides often follow.',
      'Report blocked roads and broken power lines to your ward office or 1155.'
    ]
  },
  {
    id: 'fire',
    title: 'Fire',
    keywords: ['fire', 'smoke', 'burning', 'flame', 'gas', 'आगो', 'आगलागी', 'डढेलो', 'धुवाँ'],
    call: '101',
    steps: [
      'Get out and stay out. Never go back for belongings.',
      'Crawl low under smoke, where the air is cleaner.',
      'Feel doors with the back of your hand before opening. If hot, use another way out.',
      'If your clothes catch fire: stop, drop to the ground, and roll.',
      'For a forest fire, move away from the direction the fire is spreading, towards cleared ground, roads or water.',
      'Call 101 once you are safe.'
    ]
  },
  {
    id: 'injury',
    title: 'Someone is injured',
    keywords: ['injur', 'hurt', 'bleed', 'blood', 'broken', 'unconscious', 'breath', 'घाइते', 'रगत', 'चोट', 'बेहोस'],
    call: '102',
    steps: [
      'Call 102 for an ambulance.',
      'Press firmly on any bleeding with a clean cloth and keep pressing.',
      'Do not move someone with a possible neck or back injury unless they are in danger where they are.',
      'Keep the person warm and talk to them calmly.',
      'If they are not breathing and you know how, start CPR: push hard and fast in the centre of the chest, about twice per second.'
    ]
  },
  {
    id: 'lightning',
    title: 'Lightning',
    keywords: ['lightning', 'thunder', 'storm', 'चट्याङ', 'मेघ गर्जन'],
    steps: [
      'Go inside a solid building or a hard-roofed vehicle.',
      'Avoid open fields, hilltops, lone trees, water and metal fences.',
      'If caught outside, crouch low on the balls of your feet with feet together. Do not lie flat.',
      'Wait 30 minutes after the last thunder before going back outside.'
    ]
  }
];

export const GENERAL_GUIDE: SafetyGuide = {
  id: 'general',
  title: 'Staying safe',
  keywords: [],
  steps: [
    'If anyone is in immediate danger, call 102 (ambulance), 100 (police), 101 (fire) or 1155 (disaster helpline).',
    'Move away from the hazard: to high ground for floods, open space for earthquakes, away from slopes for landslides.',
    'Follow instructions from your ward office, police and the national alerts on this site.',
    'Keep your phone charged and save battery. Text instead of calling when lines are busy.',
    'Keep water, medicines, documents and a torch ready in one bag.'
  ]
};

export function findGuide(text: string): SafetyGuide {
  const lower = text.toLowerCase();
  return SAFETY_GUIDES.find((g) => g.keywords.some((k) => lower.includes(k))) ?? GENERAL_GUIDE;
}

export function guideAsText(guide: SafetyGuide): string {
  const lines = guide.steps.map((s, i) => `${i + 1}. ${s}`);
  const call = guide.call ? `\n\nIf you need help now, call ${guide.call}.` : '';
  return `${guide.title}: what to do\n\n${lines.join('\n')}${call}`;
}
