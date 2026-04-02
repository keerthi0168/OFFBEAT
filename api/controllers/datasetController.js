const fs = require('fs');
const path = require('path');

let manifestCache = null;

const readJsonIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.places)) return parsed.places;
    return [];
  } catch (error) {
    return [];
  }
};

const slugify = (value) =>
  String(value || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toCategoryName = (place) => {
  const tourism = String(place.tourism_type || '').trim();
  if (tourism) return tourism;
  return String(place.region_type || 'Nature').trim();
};

const extFromUrl = (url) => {
  const clean = String(url || '').split('?')[0].split('#')[0];
  const ext = path.extname(clean).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return ext;
  return '.jpg';
};

const buildManifestFromPlaces = () => {
  if (manifestCache) return manifestCache;

  const hiddenStatesPath = path.join(__dirname, '../..', 'dataset/hidden_places_states.json');
  const hiddenTerritoriesPath = path.join(__dirname, '../..', 'dataset/hidden_places_territories.json');
  const offbeatPath = path.join(__dirname, '../..', 'offbeat_places.json');

  const states = readJsonIfExists(hiddenStatesPath);
  const territories = readJsonIfExists(hiddenTerritoriesPath);
  const fallback = readJsonIfExists(offbeatPath);

  const places = [...states, ...territories];
  const sourceRaw = places.length ? places : fallback;
  const uniqueByKey = new Map();
  sourceRaw.forEach((place) => {
    const key = String(place.id || `${place.name || ''}|${place.state || ''}`);
    if (!uniqueByKey.has(key)) {
      uniqueByKey.set(key, place);
    }
  });
  const source = [...uniqueByKey.values()];

  if (!source.length) {
    manifestCache = {
      version: '1.1',
      generatedAt: new Date().toISOString(),
      totalImages: 0,
      categories: [],
    };
    return manifestCache;
  }

  const categoryMap = new Map();

  source.forEach((place, idx) => {
    const category = toCategoryName(place);
    const slug = slugify(category);
    const placeId = slugify(place.id || place.name || `${idx + 1}`);
    const images = Array.isArray(place.images) ? place.images.filter(Boolean) : [];

    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, {
        category,
        slug,
        count: 0,
        files: [],
      });
    }

    const entry = categoryMap.get(slug);
    entry.count += 1;

    images.slice(0, 2).forEach((url, imageIndex) => {
      const ext = extFromUrl(url);
      const fileName = `${placeId}-${imageIndex + 1}${ext}`;
      const localRelativePath = `assets/raw-dataset/${slug}/${fileName}`;
      const localAbsolutePath = path.join(__dirname, '../..', 'client/public', localRelativePath);

      entry.files.push({
        name: fileName,
        url: fs.existsSync(localAbsolutePath) ? `/${localRelativePath}` : url,
      });
    });
  });

  const categories = [...categoryMap.values()]
    .map((entry) => ({
      ...entry,
      files: entry.files.slice(0, 20),
    }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

  const totalImages = categories.reduce((sum, c) => sum + c.files.length, 0);

  manifestCache = {
    version: '1.1',
    generatedAt: new Date().toISOString(),
    totalImages,
    categories,
  };

  return manifestCache;
};

// Get manifest of available datasets
exports.getManifest = async (req, res) => {
  try {
    const manifest = buildManifestFromPlaces();

    res.status(200).json({
      success: true,
      manifest,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Error fetching manifest',
      error: err.message,
    });
  }
};

// Get all categories in dataset
exports.getCategories = async (req, res) => {
  try {
    const manifest = buildManifestFromPlaces();
    const categories = manifest.categories.map((c) => c.category);

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Error fetching categories',
      error: err.message,
    });
  }
};

// Get images in a specific category
exports.getCategoryImages = async (req, res) => {
  try {
    const { category } = req.params;

    const manifest = buildManifestFromPlaces();
    const match = manifest.categories.find(
      (entry) =>
        entry.slug === slugify(category) ||
        String(entry.category).toLowerCase() === String(category).toLowerCase(),
    );

    if (match) {
      return res.status(200).json({
        success: true,
        category: match.category,
        count: match.files.length,
        images: match.files,
      });
    }

    // List files from the category folder
    const categoryPath = path.join(
      __dirname,
      '../..',
      `client/public/assets/raw-dataset/${category}`
    );

    if (!fs.existsSync(categoryPath)) {
      return res.status(404).json({
        message: `Category "${category}" not found`,
        success: false,
      });
    }

    let images = [];
    try {
      images = fs
        .readdirSync(categoryPath)
        .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map((file) => ({
          name: file,
          url: `/assets/raw-dataset/${category}/${file}`,
        }));
    } catch (err) {
      console.log('Error reading category images:', err);
    }

    res.status(200).json({
      success: true,
      category,
      count: images.length,
      images,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Error fetching category images',
      error: err.message,
    });
  }
};
