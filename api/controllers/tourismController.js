const fs = require('fs');
const path = require('path');

let cachedDestinations = null;
let cachedSearchIndex = null;
let cachedVectorModel = null;

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'over', 'near',
  'area', 'place', 'visit', 'trip', 'tour', 'tourism', 'travel', 'india',
  'famous', 'known', 'popular', 'best', 'top', 'city', 'state', 'region',
]);

// Load the Indian travel dataset (cached in memory for efficiency)
const loadTravelData = () => {
  if (cachedDestinations) {
    return cachedDestinations;
  }

  const jsonPath = path.join(__dirname, '../data/indian_travel_dataset.json');
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const destinations = raw
    .trim()
    .split('\n')
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);

  cachedDestinations = destinations;
  return destinations;
};

const getSearchIndex = () => {
  if (cachedSearchIndex) {
    return cachedSearchIndex;
  }

  const destinations = loadTravelData();
  cachedSearchIndex = destinations.map((d) => ({
    destination: d,
    nameLower: (d.Destination_Name || '').toLowerCase(),
    stateLower: (d.State || '').toLowerCase(),
    categoryLower: (d.Category || '').toLowerCase(),
    attractionLower: (d.Popular_Attraction || '').toLowerCase(),
    regionLower: (d.Region || '').toLowerCase(),
  }));

  return cachedSearchIndex;
};

const tokenize = (text = '') => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
};

const buildVectorModel = () => {
  const destinations = loadTravelData();
  const documents = destinations.map((d) => {
    const text = [
      d.Destination_Name,
      d.State,
      d.Region,
      d.Category,
      d.Popular_Attraction,
      d.Accessibility,
      d.Nearest_Airport,
      d.Nearest_Railway_Station,
    ]
      .filter(Boolean)
      .join(' ');

    return tokenize(text);
  });

  const docCount = documents.length || 1;
  const docFrequency = {};

  documents.forEach((tokens) => {
    const uniqueTokens = new Set(tokens);
    uniqueTokens.forEach((token) => {
      docFrequency[token] = (docFrequency[token] || 0) + 1;
    });
  });

  const idf = {};
  Object.entries(docFrequency).forEach(([token, df]) => {
    idf[token] = Math.log((docCount + 1) / (df + 1)) + 1;
  });

  const vectors = destinations.map((destination, index) => {
    const tokens = documents[index] || [];
    const tf = {};
    tokens.forEach((token) => {
      tf[token] = (tf[token] || 0) + 1;
    });

    const total = tokens.length || 1;
    const vector = {};
    let norm = 0;

    Object.entries(tf).forEach(([token, count]) => {
      const weight = (count / total) * (idf[token] || 1);
      vector[token] = weight;
      norm += weight * weight;
    });

    return {
      destination,
      vector,
      norm: Math.sqrt(norm),
    };
  });

  return { idf, vectors };
};

const getVectorModel = () => {
  if (cachedVectorModel) {
    return cachedVectorModel;
  }

  try {
    const modelPath = path.join(__dirname, '../data/tourism_model.json');
    if (fs.existsSync(modelPath)) {
      const raw = fs.readFileSync(modelPath, 'utf-8');
      const parsed = JSON.parse(raw);
      const destinations = loadTravelData();
      const destinationMap = new Map(
        destinations.map((d) => [d.Destination_Name, d]),
      );

      cachedVectorModel = {
        idf: parsed.idf || {},
        vectors: (parsed.vectors || [])
          .map((entry) => ({
            destination: destinationMap.get(entry.name),
            vector: entry.vector || {},
            norm: entry.norm || 0,
          }))
          .filter((entry) => entry.destination),
      };

      return cachedVectorModel;
    }
  } catch (error) {
    console.warn('Failed to load tourism model file, rebuilding in memory.');
  }

  cachedVectorModel = buildVectorModel();
  return cachedVectorModel;
};

const buildUserVector = (text, idf) => {
  const tokens = tokenize(text);
  if (!tokens.length) return { vector: {}, norm: 0 };

  const tf = {};
  tokens.forEach((token) => {
    tf[token] = (tf[token] || 0) + 1;
  });

  const total = tokens.length || 1;
  const vector = {};
  let norm = 0;

  Object.entries(tf).forEach(([token, count]) => {
    const weight = (count / total) * (idf[token] || 1);
    vector[token] = weight;
    norm += weight * weight;
  });

  return { vector, norm: Math.sqrt(norm) };
};

const cosineSimilarity = (aVector, aNorm, bVector, bNorm) => {
  if (!aNorm || !bNorm) return 0;
  let dot = 0;
  Object.entries(aVector).forEach(([token, weight]) => {
    if (bVector[token]) {
      dot += weight * bVector[token];
    }
  });
  return dot / (aNorm * bNorm);
};

// Get tourism information by destination
exports.getDestinationInfo = (req, res) => {
  try {
    const { name } = req.params;
    const destinations = loadTravelData();
    
    const destination = destinations.find(d => 
      d.Destination_Name.toLowerCase().includes(name.toLowerCase())
    );

    if (!destination) {
      return res.status(404).json({ 
        error: 'Destination not found',
        suggestions: destinations.slice(0, 5).map(d => d.Destination_Name)
      });
    }

    res.json({
      destination: destination.Destination_Name,
      state: destination.State,
      region: destination.Region,
      category: destination.Category,
      attraction: destination.Popular_Attraction,
      accessibility: destination.Accessibility,
      airport: destination.Nearest_Airport,
      railway: destination.Nearest_Railway_Station,
      description: `${destination.Destination_Name} in ${destination.State} is a popular ${destination.Category.toLowerCase()} destination known for ${destination.Popular_Attraction}. It's ${destination.Accessibility.toLowerCase()} to access via ${destination.Nearest_Airport}.`
    });

  } catch (error) {
    console.error('Error getting destination info:', error);
    res.status(500).json({ error: 'Failed to get destination information' });
  }
};

// Get destinations by category
exports.getDestinationsByCategory = (req, res) => {
  try {
    const { category } = req.params;
    const destinations = loadTravelData();
    
    const filtered = destinations.filter(d => 
      d.Category.toLowerCase() === category.toLowerCase()
    );

    // Remove duplicates
    const unique = Array.from(
      new Map(filtered.map(d => [d.Destination_Name, d])).values()
    );

    res.json({
      category,
      count: unique.length,
      destinations: unique.map(d => ({
        name: d.Destination_Name,
        state: d.State,
        region: d.Region,
        attraction: d.Popular_Attraction,
        accessibility: d.Accessibility
      }))
    });

  } catch (error) {
    console.error('Error getting destinations by category:', error);
    res.status(500).json({ error: 'Failed to get destinations' });
  }
};

// Get destinations by region
exports.getDestinationsByRegion = (req, res) => {
  try {
    const { region } = req.params;
    const destinations = loadTravelData();
    
    const filtered = destinations.filter(d => 
      d.Region.toLowerCase() === region.toLowerCase()
    );

    const unique = Array.from(
      new Map(filtered.map(d => [d.Destination_Name, d])).values()
    );

    res.json({
      region,
      count: unique.length,
      destinations: unique.map(d => ({
        name: d.Destination_Name,
        state: d.State,
        category: d.Category,
        attraction: d.Popular_Attraction
      }))
    });

  } catch (error) {
    console.error('Error getting destinations by region:', error);
    res.status(500).json({ error: 'Failed to get destinations' });
  }
};

// Search destinations
exports.searchDestinations = (req, res) => {
  try {
    const { query } = req.query;
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 0;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchLower = query.toLowerCase();
    const searchIndex = getSearchIndex();
    const seen = new Set();
    const matches = [];

    for (const entry of searchIndex) {
      if (
        entry.nameLower.includes(searchLower) ||
        entry.stateLower.includes(searchLower) ||
        entry.categoryLower.includes(searchLower) ||
        entry.attractionLower.includes(searchLower) ||
        entry.regionLower.includes(searchLower)
      ) {
        const destinationName = entry.destination.Destination_Name;
        if (!seen.has(destinationName)) {
          seen.add(destinationName);
          matches.push(entry.destination);
          if (limit && matches.length >= limit) {
            break;
          }
        }
      }
    }

    res.json({
      query,
      count: matches.length,
      results: matches.map((d) => ({
        name: d.Destination_Name,
        state: d.State,
        region: d.Region,
        category: d.Category,
        attraction: d.Popular_Attraction,
        accessibility: d.Accessibility,
        airport: d.Nearest_Airport,
        railway: d.Nearest_Railway_Station,
      })),
    });

  } catch (error) {
    console.error('Error searching destinations:', error);
    res.status(500).json({ error: 'Failed to search destinations' });
  }
};

// Personalized tourism recommendations using lightweight vector scoring
exports.getPersonalizedDestinations = (req, res) => {
  try {
    const { query = '', signals = {}, limit } = req.body || {};
    const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 12;
    const { terms = [], categories = [], regions = [] } = signals || {};

    const combinedText = [query, ...terms, ...categories, ...regions]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!combinedText) {
      const destinations = loadTravelData();
      const unique = Array.from(
        new Map(destinations.map((d) => [d.Destination_Name, d])).values(),
      );
      return res.json({
        query,
        count: Math.min(unique.length, normalizedLimit),
        results: unique.slice(0, normalizedLimit).map((d) => ({
          name: d.Destination_Name,
          state: d.State,
          region: d.Region,
          category: d.Category,
          attraction: d.Popular_Attraction,
          accessibility: d.Accessibility,
          airport: d.Nearest_Airport,
          railway: d.Nearest_Railway_Station,
        })),
        type: 'fallback',
      });
    }

    const { idf, vectors } = getVectorModel();
    const userVector = buildUserVector(combinedText, idf);

    let candidates = vectors;
    if (query && query.trim().length >= 2) {
      const searchLower = query.toLowerCase();
      const searchIndex = getSearchIndex();
      const allowedNames = new Set();
      searchIndex.forEach((entry) => {
        if (
          entry.nameLower.includes(searchLower) ||
          entry.stateLower.includes(searchLower) ||
          entry.categoryLower.includes(searchLower) ||
          entry.attractionLower.includes(searchLower) ||
          entry.regionLower.includes(searchLower)
        ) {
          allowedNames.add(entry.destination.Destination_Name);
        }
      });
      candidates = vectors.filter((entry) =>
        allowedNames.has(entry.destination.Destination_Name),
      );
    }

    const scored = candidates.map((entry) => ({
      destination: entry.destination,
      score: cosineSimilarity(
        userVector.vector,
        userVector.norm,
        entry.vector,
        entry.norm,
      ),
    }));

    const unique = Array.from(
      new Map(scored
        .sort((a, b) => b.score - a.score)
        .map((item) => [item.destination.Destination_Name, item])
      ).values(),
    );

    const results = unique.slice(0, normalizedLimit).map((item) => ({
      name: item.destination.Destination_Name,
      state: item.destination.State,
      region: item.destination.Region,
      category: item.destination.Category,
      attraction: item.destination.Popular_Attraction,
      accessibility: item.destination.Accessibility,
      airport: item.destination.Nearest_Airport,
      railway: item.destination.Nearest_Railway_Station,
      score: Number(item.score.toFixed(4)),
    }));

    res.json({
      query,
      count: results.length,
      results,
      type: 'personalized',
    });
  } catch (error) {
    console.error('Error getting personalized destinations:', error);
    res.status(500).json({ error: 'Failed to get personalized destinations' });
  }
};

// Get all categories
exports.getCategories = (req, res) => {
  try {
    const destinations = loadTravelData();
    const categories = [...new Set(destinations.map(d => d.Category))];
    
    const categoriesWithCount = categories.map(cat => ({
      category: cat,
      count: destinations.filter(d => d.Category === cat).length,
      examples: destinations
        .filter(d => d.Category === cat)
        .slice(0, 3)
        .map(d => d.Destination_Name)
    }));

    res.json({
      categories: categoriesWithCount,
      total: categories.length
    });

  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};

// Get all regions
exports.getRegions = (req, res) => {
  try {
    const destinations = loadTravelData();
    const regions = [...new Set(destinations.map(d => d.Region))];
    
    const regionsWithCount = regions.map(reg => ({
      region: reg,
      count: destinations.filter(d => d.Region === reg).length,
      states: [...new Set(destinations.filter(d => d.Region === reg).map(d => d.State))]
    }));

    res.json({
      regions: regionsWithCount,
      total: regions.length
    });

  } catch (error) {
    console.error('Error getting regions:', error);
    res.status(500).json({ error: 'Failed to get regions' });
  }
};

// Get random destinations (for suggestions)
exports.getRandomDestinations = (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const destinations = loadTravelData();
    
    const unique = Array.from(
      new Map(destinations.map(d => [d.Destination_Name, d])).values()
    );

    const shuffled = unique.sort(() => 0.5 - Math.random());
    const random = shuffled.slice(0, limit);

    res.json({
      destinations: random.map(d => ({
        name: d.Destination_Name,
        state: d.State,
        category: d.Category,
        attraction: d.Popular_Attraction
      }))
    });

  } catch (error) {
    console.error('Error getting random destinations:', error);
    res.status(500).json({ error: 'Failed to get destinations' });
  }
};
