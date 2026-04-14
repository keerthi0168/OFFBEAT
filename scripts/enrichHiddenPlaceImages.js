const fs = require('fs');
const path = require('path');

const DATASET_FILES = [
  path.join(__dirname, '../dataset/hidden_places_states.json'),
  path.join(__dirname, '../dataset/hidden_places_territories.json'),
];

const MIN_IMAGES = 6;

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toKeywords(place) {
  const chunks = [
    place?.name,
    place?.state,
    place?.district,
    place?.region_type,
    place?.tourism_type,
    'india',
    'travel',
  ]
    .filter(Boolean)
    .map((item) => String(item).trim());

  const longQuery = chunks.join(',');
  const shortQuery = [place?.name, place?.state, 'india'].filter(Boolean).join(',');
  return { longQuery, shortQuery };
}

function generateFallbacks(place) {
  const { longQuery, shortQuery } = toKeywords(place);
  const seedBase = slugify(`${place?.id || place?.name || 'destination'}-${place?.state || 'india'}`);

  const unsplash = Array.from({ length: 3 }, (_, i) =>
    `https://source.unsplash.com/1600x900/?${encodeURIComponent(longQuery)}&sig=${i + 1}`
  );

  const loremFlickr = Array.from({ length: 2 }, (_, i) =>
    `https://loremflickr.com/1600/900/${encodeURIComponent('india,travel,landscape')}?lock=${seedBase}-${i + 1}`
  );

  const picsum = Array.from({ length: 3 }, (_, i) =>
    `https://picsum.photos/seed/${encodeURIComponent(`${seedBase}-${i + 1}`)}/1600/900`
  );

  const scenicQuery = `https://source.unsplash.com/1600x900/?${encodeURIComponent(
    `${shortQuery},tourism,landscape`
  )}&sig=91`;

  return [...unsplash, ...loremFlickr, ...picsum, scenicQuery];
}

function dedupeAndTrim(urls) {
  const seen = new Set();
  const result = [];

  for (const url of urls) {
    const value = String(url || '').trim();
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }

  return result;
}

function enrichPlaceImages(place) {
  const existing = Array.isArray(place.images) ? place.images : [];
  let merged = dedupeAndTrim(existing);

  if (merged.length < MIN_IMAGES) {
    merged = dedupeAndTrim([...merged, ...generateFallbacks(place)]);
  }

  if (merged.length < MIN_IMAGES) {
    merged = dedupeAndTrim([
      ...merged,
      ...Array.from({ length: MIN_IMAGES - merged.length }, (_, i) =>
        `https://picsum.photos/seed/${encodeURIComponent(`${place?.id || 'place'}-extra-${i + 1}`)}/1600/900`
      ),
    ]);
  }

  return {
    ...place,
    images: merged.slice(0, Math.max(MIN_IMAGES, merged.length)),
    num_images: merged.length,
  };
}

function enrichFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  const enriched = data.map(enrichPlaceImages);
  fs.writeFileSync(filePath, JSON.stringify(enriched, null, 2));

  const minCount = enriched.reduce((min, place) => Math.min(min, (place.images || []).length), Infinity);
  const belowMin = enriched.filter((place) => (place.images || []).length < MIN_IMAGES).length;

  console.log(
    `${path.basename(filePath)}: updated ${enriched.length} places, min_images=${minCount}, below_${MIN_IMAGES}=${belowMin}`
  );
}

for (const filePath of DATASET_FILES) {
  enrichFile(filePath);
}

console.log(`Done. Every place now has at least ${MIN_IMAGES} images.`);
