const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'dataset', 'hidden_places_states.json');
const raw = fs.readFileSync(filePath, 'utf-8');
const arr = JSON.parse(raw);

const seen = new Set();

const popularityMap = {
  'very low': 1,
  'low': 2,
  'low-medium': 3,
  'medium': 3,
  'high': 4,
  'very high': 5,
};

function slugify(v = '') {
  return String(v)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function makeFallbackImages(place, count = 6) {
  const seedBase = slugify(place.id || place.name || 'place');
  return Array.from(
    { length: count },
    (_, i) => `https://picsum.photos/seed/${encodeURIComponent(`${seedBase}-safe-${i + 1}`)}/1600/900`
  );
}

const cleaned = [];

for (const p of arr) {
  const id = String(p.id || '').trim();
  const key = id || `${String(p.name || '').trim().toLowerCase()}|${String(p.state || '').trim().toLowerCase()}`;
  if (!key || seen.has(key)) continue;
  seen.add(key);

  const place = { ...p };

  const gUrl = place.google_url || place.google_maps_url || '';
  if (gUrl) {
    place.google_url = gUrl;
    if (!place.google_maps_url) place.google_maps_url = gUrl;
  }
  place.has_google_url = Boolean(gUrl);

  if (place.popularity_score == null) {
    place.popularity_score = popularityMap[String(place.popularity || '').toLowerCase()] ?? 3;
  }

  const images = Array.isArray(place.images) ? place.images : [];
  const filtered = [];
  const imageSeen = new Set();

  for (const img of images) {
    const url = String(img || '').trim();
    if (!url) continue;

    // Remove known unreliable hosts that frequently break or throttle
    if (/source\.unsplash\.com/i.test(url)) continue;
    if (/loremflickr\.com/i.test(url)) continue;

    if (!imageSeen.has(url)) {
      imageSeen.add(url);
      filtered.push(url);
    }
  }

  // Ensure enough deterministic, always-available images
  const minImages = 8;
  if (filtered.length < minImages) {
    const extras = makeFallbackImages(place, minImages - filtered.length);
    for (const ex of extras) {
      if (!imageSeen.has(ex)) {
        imageSeen.add(ex);
        filtered.push(ex);
      }
    }
  }

  place.images = filtered;
  place.num_images = filtered.length;
  place.activity_count = Array.isArray(place.activities) ? place.activities.length : (place.activity_count || 0);
  place.season_count = Array.isArray(place.best_season) ? place.best_season.length : (place.season_count || 0);
  place.description_length = String(place.description || '').length;

  cleaned.push(place);
}

fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2), 'utf-8');
console.log(`Cleaned hidden_places_states.json: ${arr.length} -> ${cleaned.length} entries`);
