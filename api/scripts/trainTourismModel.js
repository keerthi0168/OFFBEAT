const fs = require('fs');
const path = require('path');

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'over', 'near',
  'area', 'place', 'visit', 'trip', 'tour', 'tourism', 'travel', 'india',
  'famous', 'known', 'popular', 'best', 'top', 'city', 'state', 'region',
]);

const tokenize = (text = '') => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
};

const loadTravelData = () => {
  const jsonPath = path.join(__dirname, '../data/indian_travel_dataset.json');
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  return raw
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
};

const buildModel = () => {
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
      name: destination.Destination_Name,
      vector,
      norm: Math.sqrt(norm),
    };
  });

  return { idf, vectors };
};

const saveModel = () => {
  const model = buildModel();
  const outputPath = path.join(__dirname, '../data/tourism_model.json');
  fs.writeFileSync(outputPath, JSON.stringify(model));
  console.log(`✓ Model saved to ${outputPath}`);
};

saveModel();
