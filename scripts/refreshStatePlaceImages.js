const fs = require('fs');
const path = require('path');

const datasetPath = path.join(__dirname, '..', 'dataset', 'hidden_places_states.json');

const MIN_IMAGES = 6;
const BAD_HOSTS = [/picsum\.photos/i, /loremflickr\.com/i, /source\.unsplash\.com/i];

const normalize = (v = '') => String(v || '').trim();

function isGoodUrl(url) {
  const clean = normalize(url);
  if (!/^https?:\/\//i.test(clean)) return false;
  if (BAD_HOSTS.some((rx) => rx.test(clean))) return false;
  return true;
}

function unique(arr = []) {
  return [...new Set(arr.map((x) => normalize(x)).filter(Boolean))];
}

function nameTokens(name = '') {
  return String(name)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4)
    .slice(0, 4);
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function searchCommonsImages(query, tokens = [], limit = 20) {
  const q = encodeURIComponent(query);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url`;
  try {
    const data = await fetchJson(url);
    const pages = Object.values(data?.query?.pages || {});
    const picks = pages
      .map((p) => ({
        title: String(p?.title || '').toLowerCase(),
        url: p?.imageinfo?.[0]?.url,
      }))
      .filter((x) => x.url)
      .filter((x) => (tokens.length ? tokens.some((t) => x.title.includes(t)) : true))
      .map((x) => x.url);
    return unique(picks);
  } catch {
    return [];
  }
}

async function wikipediaSummaryImages(query) {
  const normalized = encodeURIComponent(String(query).replace(/\s+/g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${normalized}`;
  try {
    const data = await fetchJson(url);
    return unique([data?.originalimage?.source, data?.thumbnail?.source].filter(Boolean));
  } catch {
    return [];
  }
}

async function fetchPlaceImages(place) {
  const name = normalize(place?.name || place?.title || place?.Destination_Name);
  const state = normalize(place?.state || place?.State);
  const tokens = nameTokens(name);

  const queries = unique([
    `${name} ${state}`,
    `${name} India`,
    name,
  ]);

  const out = [];
  for (const q of queries) {
    if (out.length >= 12) break;
    // eslint-disable-next-line no-await-in-loop
    const found = await searchCommonsImages(q, tokens, 30);
    out.push(...found);
  }

  if (unique(out).length < MIN_IMAGES) {
    for (const q of queries) {
      if (unique(out).length >= 12) break;
      // eslint-disable-next-line no-await-in-loop
      const relaxed = await searchCommonsImages(q, [], 40);
      out.push(...relaxed);
    }
  }

  if (unique(out).length < MIN_IMAGES) {
    for (const q of queries) {
      if (unique(out).length >= 12) break;
      // eslint-disable-next-line no-await-in-loop
      const wikiImgs = await wikipediaSummaryImages(q);
      out.push(...wikiImgs);
    }
  }

  if (unique(out).length < MIN_IMAGES && state) {
    const stateQueries = [`${state} landscape India`, `${state} tourism India`];
    for (const q of stateQueries) {
      if (unique(out).length >= 12) break;
      // eslint-disable-next-line no-await-in-loop
      const stateImgs = await searchCommonsImages(q, [], 40);
      out.push(...stateImgs);
    }
  }

  return unique(out);
}

async function main() {
  const data = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  if (!Array.isArray(data)) throw new Error('Dataset is not an array');

  for (let i = 0; i < data.length; i += 1) {
    const place = data[i];
    const existing = unique((Array.isArray(place.images) ? place.images : []).filter(isGoodUrl));

    let merged = [...existing];
    if (merged.length < MIN_IMAGES) {
      // eslint-disable-next-line no-await-in-loop
      const fetched = await fetchPlaceImages(place);
      merged = unique([...existing, ...fetched]);
    }

    place.images = merged.slice(0, Math.max(MIN_IMAGES, merged.length));
    place.num_images = place.images.length;

    process.stdout.write(`\r[${i + 1}/${data.length}] ${place.name || place.title} -> ${place.images.length} images`);
  }

  fs.writeFileSync(datasetPath, JSON.stringify(data, null, 2), 'utf-8');
  process.stdout.write('\nDone.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
