const fs = require('fs');
const path = require('path');

// Load the Indian travel dataset
const loadTravelData = () => {
  const jsonPath = path.join(__dirname, '../data/indian_travel_dataset.json');
  const data = fs.readFileSync(jsonPath, 'utf-8');
  const destinations = data.trim().split('\n').map(line => JSON.parse(line));
  return destinations;
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
    
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const destinations = loadTravelData();
    const searchLower = query.toLowerCase();
    
    const results = destinations.filter(d => 
      d.Destination_Name.toLowerCase().includes(searchLower) ||
      d.State.toLowerCase().includes(searchLower) ||
      d.Category.toLowerCase().includes(searchLower) ||
      d.Popular_Attraction.toLowerCase().includes(searchLower)
    );

    const unique = Array.from(
      new Map(results.map(d => [d.Destination_Name, d])).values()
    );

    res.json({
      query,
      count: unique.length,
      results: unique.map(d => ({
        name: d.Destination_Name,
        state: d.State,
        region: d.Region,
        category: d.Category,
        attraction: d.Popular_Attraction,
        accessibility: d.Accessibility,
        airport: d.Nearest_Airport,
        railway: d.Nearest_Railway_Station
      }))
    });

  } catch (error) {
    console.error('Error searching destinations:', error);
    res.status(500).json({ error: 'Failed to search destinations' });
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
