const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT, 'client', 'public', 'assets', 'real-image-map.json');

const DATASET_FILES = [
  path.join(ROOT, 'dataset', 'hidden_places_states.json'),
  path.join(ROOT, 'dataset', 'hidden_places_territories.json'),
  path.join(ROOT, 'dataset', 'india_tourism_dataset.json'),
  path.join(ROOT, 'client', 'public', 'assets', 'combined_hidden_places.json'),
];

const JS_DATA_FILES = [
  path.join(ROOT, 'api', 'data', 'indiaTourismData.js'),
  path.join(ROOT, 'api', 'data', 'realTourismData.js'),
];

const EXISTING_MAP_FILE = path.join(ROOT, 'client', 'public', 'assets', 'local-image-map.json');
const MAX_IMAGES = 6;
const CONCURRENCY = 5;

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

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Array.isArray(data) ? data : [];
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

function pickTitle(place = {}) {
  return place.title || place.name || place.Destination_Name || 'Destination';
}

function pickState(place = {}) {
  return place.state || place.State || place.address?.split(',')?.[1]?.trim() || 'India';
}

function pickDistrict(place = {}) {
  return place.district || place.city || '';
}

function buildKeyCandidates(place, title, state) {
  const id = normalizeKey(place.id || '');
  const slugTitle = slugify(title);
  const slugComposite = slugify(`${title}-${state}`);
  return [
    id,
    normalizeKey(title),
    normalizeKey(`${title}|${state}`),
    normalizeKey(slugTitle),
    normalizeKey(slugComposite),
    normalizeKey(place.name),
    normalizeKey(place.title),
    normalizeKey(place.Destination_Name),
  ].filter(Boolean);
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function isValidImage(url) {
  if (!/^https?:\/\//i.test(String(url || ''))) return false;
  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (head.ok) {
      const type = head.headers.get('content-type') || '';
      if (type.includes('image/')) return true;
    }
  } catch {
    // ignore and retry with GET
  }

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-1' },
    });
    if (!res.ok && res.status !== 206) return false;
    const type = res.headers.get('content-type') || '';
    return type.includes('image/');
  } catch {
    return false;
  }
}

function unique(list = []) {
  return [...new Set(list.filter(Boolean).map((x) => String(x).trim()))];
}

async function wikipediaSummaryImages(query) {
  const normalized = encodeURIComponent(String(query).replace(/\s+/g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${normalized}`;
  try {
    const data = await fetchJson(url);
    return unique([
      data?.originalimage?.source,
      data?.thumbnail?.source,
    ]);
  } catch {
    return [];
  }
}

async function commonsSearchImages(query, limit = 8) {
  const q = encodeURIComponent(query);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url`;
  try {
    const data = await fetchJson(url);
    const pages = Object.values(data?.query?.pages || {});
    const urls = pages
      .map((p) => p?.imageinfo?.[0]?.url)
      .filter(Boolean);
    return unique(urls);
  } catch {
    return [];
  }
}

async function findRealImagesForPlace(place) {
  const title = pickTitle(place);
  const state = pickState(place);
  const district = pickDistrict(place);

  const queries = unique([
    title,
    `${title} ${state}`,
    `${title} ${district} ${state}`,
    `${title} India`,
    `${state} tourism`,
    `${state} landscape`,
  ]);

  const candidates = [];

  for (const query of queries) {
    if (candidates.length >= MAX_IMAGES) break;

    const [summaryImgs, commonsImgs] = await Promise.all([
      wikipediaSummaryImages(query),
      commonsSearchImages(query),
    ]);

    for (const url of unique([...summaryImgs, ...commonsImgs])) {
      if (candidates.length >= MAX_IMAGES) break;
      // eslint-disable-next-line no-await-in-loop
      const ok = await isValidImage(url);
      if (ok) candidates.push(url);
    }
  }

  return unique(candidates).slice(0, MAX_IMAGES);
}

function collectPlaces() {
  const jsonPlaces = DATASET_FILES.flatMap(readJsonArray);
  const jsPlaces = JS_DATA_FILES.flatMap(readJsPlaces);
  return [...jsonPlaces, ...jsPlaces];
}

function dedupePlaces(places = []) {
  const seen = new Set();
  const out = [];
  for (const place of places) {
    const title = pickTitle(place);
    const state = pickState(place);
    const key = normalizeKey(place.id || `${title}|${state}`);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(place);
  }
  return out;
}

async function runPool(tasks, concurrency = 5) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const current = index;
      index += 1;
      // eslint-disable-next-line no-await-in-loop
      results[current] = await tasks[current]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  const places = dedupePlaces(collectPlaces());
  const fallbackMap = fs.existsSync(EXISTING_MAP_FILE)
    ? JSON.parse(fs.readFileSync(EXISTING_MAP_FILE, 'utf-8'))?.map || {}
    : {};

  const map = {};

  const tasks = places.map((place, i) => async () => {
    const title = pickTitle(place);
    const state = pickState(place);
    const keys = buildKeyCandidates(place, title, state);

    let realImages = [];
    try {
      realImages = await findRealImagesForPlace(place);
    } catch {
      realImages = [];
    }

    let finalImages = realImages;
    if (finalImages.length < MAX_IMAGES) {
      const fallback = keys.flatMap((k) => (Array.isArray(fallbackMap[k]) ? fallbackMap[k] : []));
      finalImages = unique([...finalImages, ...fallback]).slice(0, MAX_IMAGES);
    }

    if (!finalImages.length && Array.isArray(fallbackMap.__default)) {
      finalImages = fallbackMap.__default.slice(0, MAX_IMAGES);
    }

    keys.forEach((k) => {
      map[k] = finalImages;
    });

    console.log(`[${i + 1}/${places.length}] ${title} -> ${finalImages.length} images`);
    return finalImages.length;
  });

  const counts = await runPool(tasks, CONCURRENCY);
  const coverage = counts.filter((c) => c > 0).length;
  const fullCoverage = counts.filter((c) => c >= MAX_IMAGES).length;

  const payload = {
    generatedAt: new Date().toISOString(),
    totalDestinations: places.length,
    withAtLeastOneImage: coverage,
    withSixImages: fullCoverage,
    map,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2));
  console.log(`Saved: ${path.relative(ROOT, OUTPUT_FILE)}`);
  console.log(`Coverage: ${coverage}/${places.length}, full(${MAX_IMAGES}): ${fullCoverage}/${places.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
