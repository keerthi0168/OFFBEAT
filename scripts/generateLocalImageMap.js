const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'client', 'public', 'assets', 'local-destination-images');
const OUTPUT_MAP = path.join(ROOT, 'client', 'public', 'assets', 'local-image-map.json');

const DATASET_FILES = [
  path.join(ROOT, 'dataset', 'hidden_places_states.json'),
  path.join(ROOT, 'dataset', 'hidden_places_territories.json'),
];

const JS_DATA_FILES = [
  path.join(ROOT, 'api', 'data', 'indiaTourismData.js'),
  path.join(ROOT, 'api', 'data', 'realTourismData.js'),
];

const IMAGE_VARIANTS = 6;

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeKey(value = '') {
  return String(value || '').trim().toLowerCase();
}

function hashCode(str = '') {
  let hash = 0;
  const text = String(str);
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readJsPlaces(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const mod = require(filePath);
    if (Array.isArray(mod)) return mod;
    if (Array.isArray(mod?.places)) return mod.places;
    return [];
  } catch {
    return [];
  }
}

function pickDestinationName(place = {}) {
  return (
    place.title ||
    place.name ||
    place.Destination_Name ||
    place.destination ||
    'Hidden Destination'
  );
}

function pickState(place = {}) {
  return place.state || place.State || place.address?.split(',')?.[1]?.trim() || 'India';
}

function createSvg({ title, state, variant, seed }) {
  const gradients = [
    ['#060B1E', '#122444'],
    ['#07122A', '#18345A'],
    ['#090F22', '#1A2F4F'],
    ['#050A1A', '#1A385D'],
    ['#071028', '#153451'],
    ['#081126', '#1B3558'],
  ];

  const accent = ['#D4B27A', '#D9B97F', '#C9A96E', '#E0C08A', '#D0AE74', '#DAB980'];
  const [g1, g2] = gradients[variant % gradients.length];
  const a = accent[variant % accent.length];

  const x1 = 180 + (seed % 700);
  const y1 = 130 + (seed % 360);
  const x2 = 760 + (seed % 280);
  const y2 = 300 + (seed % 240);

  const safeTitle = String(title).replace(/[<&>]/g, '');
  const safeState = String(state).replace(/[<&>]/g, '');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${g1}"/>
      <stop offset="100%" stop-color="${g2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.2" r="0.7">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.08)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.02)"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <rect width="1600" height="900" fill="url(#glow)"/>

  <circle cx="${x1}" cy="${y1}" r="180" fill="#14b8a6" opacity="0.14"/>
  <circle cx="${x2}" cy="${y2}" r="120" fill="#1d4ed8" opacity="0.18"/>

  <rect x="120" y="610" rx="28" ry="28" width="1360" height="190" fill="url(#card)" stroke="rgba(212,178,122,0.38)"/>
  <text x="170" y="700" fill="${a}" font-family="Segoe UI, Arial, sans-serif" font-size="58" font-weight="700">${safeTitle}</text>
  <text x="172" y="752" fill="#e5e7eb" font-family="Segoe UI, Arial, sans-serif" font-size="30" opacity="0.88">${safeState} • Offbeat India</text>
</svg>`;
}

function buildKeyCandidates(place, title, state, id, slugTitle, slugComposite) {
  return [
    id,
    title,
    `${title}|${state}`,
    slugTitle,
    slugComposite,
    place.name,
    place.title,
    place.Destination_Name,
  ]
    .map((item) => normalizeKey(item))
    .filter(Boolean);
}

function collectPlaces() {
  const fromJson = DATASET_FILES.flatMap((filePath) => readJsonArray(filePath));
  const fromJs = JS_DATA_FILES.flatMap((filePath) => readJsPlaces(filePath));
  return [...fromJson, ...fromJs];
}

function buildUniquePlaces(places = []) {
  const unique = [];
  const seen = new Set();

  for (const place of places) {
    const title = pickDestinationName(place);
    const state = pickState(place);
    const slugComposite = slugify(`${title}-${state}`);
    const id = normalizeKey(place.id || slugComposite);
    const key = id || normalizeKey(`${title}|${state}`);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push({ place, title, state, id, slugComposite });
  }

  return unique;
}

function generate() {
  ensureDir(OUTPUT_DIR);

  const allPlaces = collectPlaces();
  const uniquePlaces = buildUniquePlaces(allPlaces);
  const map = {};

  uniquePlaces.forEach(({ place, title, state, id, slugComposite }) => {
    const slugTitle = slugify(title);
    const base = slugComposite || slugTitle || id || `destination-${hashCode(title)}`;
    const seed = hashCode(`${title}-${state}-${id}`);

    const imagePaths = [];
    for (let i = 1; i <= IMAGE_VARIANTS; i += 1) {
      const fileName = `${base}-${i}.svg`;
      const absPath = path.join(OUTPUT_DIR, fileName);
      const relPath = `/assets/local-destination-images/${fileName}`;
      const svg = createSvg({ title, state, variant: i, seed: seed + i * 97 });
      fs.writeFileSync(absPath, svg);
      imagePaths.push(relPath);
    }

    const keys = buildKeyCandidates(place, title, state, id, slugTitle, slugComposite);
    keys.forEach((key) => {
      map[key] = imagePaths;
    });
  });

  map.__default = [
    '/assets/local-destination-images/default-1.svg',
    '/assets/local-destination-images/default-2.svg',
    '/assets/local-destination-images/default-3.svg',
    '/assets/local-destination-images/default-4.svg',
    '/assets/local-destination-images/default-5.svg',
    '/assets/local-destination-images/default-6.svg',
  ];

  for (let i = 1; i <= 6; i += 1) {
    const svg = createSvg({ title: 'Discover Hidden India', state: 'Curated Destination', variant: i, seed: 777 + i });
    fs.writeFileSync(path.join(OUTPUT_DIR, `default-${i}.svg`), svg);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    totalDestinations: uniquePlaces.length,
    variantsPerDestination: IMAGE_VARIANTS,
    map,
  };

  fs.writeFileSync(OUTPUT_MAP, JSON.stringify(payload, null, 2));

  console.log(`Generated local image map for ${uniquePlaces.length} destinations.`);
  console.log(`Images: ${path.relative(ROOT, OUTPUT_DIR)}`);
  console.log(`Map: ${path.relative(ROOT, OUTPUT_MAP)}`);
}

generate();
