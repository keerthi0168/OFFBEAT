// Script to combine and flatten hidden places datasets for frontend use
const fs = require('fs');
const path = require('path');

const statesPath = path.join(__dirname, '../dataset/hidden_places_states.json');
const territoriesPath = path.join(__dirname, '../dataset/hidden_places_territories.json');
const outputPath = path.join(__dirname, '../client/public/assets/combined_hidden_places.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function dedupe(items = []) {
  return [...new Set(items.map((v) => String(v || '').trim()).filter(Boolean))];
}

function fallbackImages(place) {
  const query = [place.name, place.state, place.region_type, 'india travel']
    .filter(Boolean)
    .join(',');
  const seed = slugify(`${place.id || place.name}-${place.state || 'india'}`);

  return [
    `https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}&sig=1`,
    `https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}&sig=2`,
    `https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}&sig=3`,
    `https://loremflickr.com/1600/900/${encodeURIComponent('india,travel,landscape')}?lock=${seed}-1`,
    `https://loremflickr.com/1600/900/${encodeURIComponent('india,travel,landscape')}?lock=${seed}-2`,
    `https://picsum.photos/seed/${encodeURIComponent(`${seed}-1`)}/1600/900`,
  ];
}

function ensureMinImages(place, min = 6) {
  let images = dedupe(Array.isArray(place.images) ? place.images : []);
  if (images.length < min) {
    images = dedupe([...images, ...fallbackImages(place)]);
  }
  if (images.length < min) {
    images = dedupe([
      ...images,
      ...Array.from({ length: min - images.length }, (_, i) =>
        `https://picsum.photos/seed/${encodeURIComponent(`${slugify(place.id || place.name || 'place')}-extra-${i + 1}`)}/1600/900`
      ),
    ]);
  }
  return images;
}

function flattenPlaces(arr) {
  return arr.map(place => ({
    id: place.id || '',
    name: place.name || '',
    state: place.state || '',
    district: place.district || '',
    region: place.region_type || '',
    tourism_type: place.tourism_type || '',
    description: place.description || '',
    images: ensureMinImages(place, 6),
    google_url: place.google_url || '',
    rating: place.rating || null,
    best_season: place.best_season || [],
    activities: place.activities || [],
    coordinates: place.coordinates || null,
    source: place.source || '',
  }));
}

const states = readJson(statesPath);
const territories = readJson(territoriesPath);
const all = [...flattenPlaces(states), ...flattenPlaces(territories)];

fs.writeFileSync(outputPath, JSON.stringify(all, null, 2));
console.log(`Combined ${all.length} places into ${outputPath}`);
