const fs = require('fs');
const path = require('path');

// Get manifest of available datasets
exports.getManifest = async (req, res) => {
  try {
    const manifestPath = path.join(
      __dirname,
      '../..',
      'client/public/assets/raw-dataset/manifest.json'
    );

    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      return res.status(200).json({
        success: true,
        manifest,
      });
    }

    // Fallback manifest if file doesn't exist
    const categories = ['Beach', 'Garden', 'Hill Station', 'National park', 'Temple'];
    const manifest = {
      version: '1.0',
      categories,
      totalImages: categories.reduce((acc) => acc + 20, 0),
    };

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
    const categories = ['Beach', 'Garden', 'Hill Station', 'National park', 'Temple'];

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
