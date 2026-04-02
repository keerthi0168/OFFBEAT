const fs = require('fs');
const path = require('path');

class MlModel {
  constructor() {
    this.initialized = false;
    this.rawPlaces = [];
    this.featuredPlaces = [];
    this.meta = {
      tourismTypes: [],
      regionTypes: [],
      activityTypes: [],
    };
  }

  init() {
    if (this.initialized) return;

    const statesCandidates = [
      path.join(__dirname, '../../data/hidden_places_states.json'),
      path.join(__dirname, '../../dataset/hidden_places_states.json'),
    ];
    const territoriesCandidates = [
      path.join(__dirname, '../../data/hidden_places_territories.json'),
      path.join(__dirname, '../../dataset/hidden_places_territories.json'),
    ];

    const statesPath = statesCandidates.find((candidate) => fs.existsSync(candidate));
    const territoriesPath = territoriesCandidates.find((candidate) => fs.existsSync(candidate));

    const parseArray = (filePath) => {
      if (!filePath) return [];
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed?.places)) return parsed.places;
      } catch (error) {
        return [];
      }
      return [];
    };

    const statesPlaces = parseArray(statesPath);
    const territoriesPlaces = parseArray(territoriesPath);
    const combined = [...statesPlaces, ...territoriesPlaces];
    const uniqueByKey = new Map();
    combined.forEach((place) => {
      const key = String(place.id || `${place.name || ''}|${place.state || ''}`);
      if (!uniqueByKey.has(key)) {
        uniqueByKey.set(key, place);
      }
    });
    this.rawPlaces = [...uniqueByKey.values()];

    if (!this.rawPlaces.length) {
      const fallbackCandidates = [
        path.join(__dirname, '../../offbeat_places.json'),
        path.join(__dirname, '../../dataset/pondicherry.json'),
      ];
      const fallbackPath = fallbackCandidates.find((candidate) => fs.existsSync(candidate));

      if (!fallbackPath) {
        throw new Error('No supported dataset found. Expected hidden_places_states/territories files.');
      }

      const fallbackParsed = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
      this.rawPlaces = Array.isArray(fallbackParsed)
        ? fallbackParsed
        : Array.isArray(fallbackParsed?.places)
        ? fallbackParsed.places
        : [];
    }

    if (!this.rawPlaces.length) {
      throw new Error('Dataset is empty or invalid.');
    }

    this.meta.tourismTypes = [...new Set(this.rawPlaces.map((p) => String(p.tourism_type || 'Unknown')))];
    this.meta.regionTypes = [...new Set(this.rawPlaces.map((p) => String(p.region_type || 'Unknown')))];
    this.meta.activityTypes = [
      ...new Set(
        this.rawPlaces.flatMap((p) => (Array.isArray(p.activities) ? p.activities.map(String) : []))
      ),
    ];

    this.featuredPlaces = this.rawPlaces.map((place) => ({
      place,
      vector: this.toFeatureVector(place),
    }));

    this.initialized = true;
  }

  parseBudgetAverage(budgetRange) {
    if (!budgetRange || typeof budgetRange !== 'string') return 2500;

    const cleaned = budgetRange.replace(/,/g, '').trim();
    const matches = cleaned.match(/\d+/g);
    if (!matches || matches.length === 0) return 2500;

    if (matches.length === 1) return Number(matches[0]);

    const low = Number(matches[0]);
    const high = Number(matches[1]);
    if (Number.isNaN(low) || Number.isNaN(high)) return 2500;

    return (low + high) / 2;
  }

  seasonToNumber(season) {
    const map = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };

    if (!season) return 6;
    if (Array.isArray(season)) {
      const nums = season
        .map((s) => map[String(s).toLowerCase()])
        .filter((n) => typeof n === 'number');
      if (!nums.length) return 6;
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    }

    return map[String(season).toLowerCase()] || 6;
  }

  oneHot(value, classes) {
    return classes.map((c) => (String(value || 'Unknown') === String(c) ? 1 : 0));
  }

  multiHot(values, classes) {
    const set = new Set((Array.isArray(values) ? values : []).map(String));
    return classes.map((c) => (set.has(String(c)) ? 1 : 0));
  }

  toFeatureVector(input) {
    const budget = this.parseBudgetAverage(input.budget_range);
    const rating = Number(input.rating || 3.5);
    const season = this.seasonToNumber(input.season || input.best_season || input.best_time_of_day);

    const tourismVec = this.oneHot(input.tourism_type || 'Unknown', this.meta.tourismTypes);
    const regionVec = this.oneHot(input.region_type || 'Unknown', this.meta.regionTypes);
    const activityVec = this.multiHot(input.activities || [], this.meta.activityTypes);

    return [
      budget / 10000,
      Math.max(0, Math.min(5, rating)) / 5,
      season / 12,
      ...tourismVec,
      ...regionVec,
      ...activityVec,
    ];
  }

  euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i += 1) {
      const diff = (a[i] || 0) - (b[i] || 0);
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  getTopRated(limit = 5) {
    return [...this.rawPlaces]
      .sort((x, y) => Number(y.rating || 0) - Number(x.rating || 0))
      .slice(0, limit)
      .map((p) => ({
        name: p.name,
        state: p.state,
        rating: Number(p.rating || 0),
        similarity_score: 1,
        description: p.description || '',
        images: Array.isArray(p.images) ? p.images.slice(0, 3) : [],
      }));
  }

  getRecommendations(userInput = {}, limit = 5) {
    this.init();

    if (!userInput || Object.keys(userInput).length === 0) {
      return this.getTopRated(limit);
    }

    const userVector = this.toFeatureVector(userInput);

    const ranked = this.featuredPlaces
      .map(({ place, vector }) => {
        const distance = this.euclideanDistance(userVector, vector);
        return { place, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    const maxDist = ranked.length ? ranked[ranked.length - 1].distance || 1 : 1;

    return ranked.map(({ place, distance }) => {
      const similarity = Math.max(0, 1 - distance / maxDist);
      return {
        name: place.name,
        state: place.state,
        rating: Number(place.rating || 0),
        similarity_score: Number(similarity.toFixed(2)),
        description: place.description || '',
        images: Array.isArray(place.images) ? place.images.slice(0, 3) : [],
      };
    });
  }
}

let cachedModel = null;

function getModel() {
  if (!cachedModel) {
    cachedModel = new MlModel();
  }
  return cachedModel;
}

module.exports = {
  getModel,
};
