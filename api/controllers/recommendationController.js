const Place = require('../models/Place');

// Calculate similarity between two properties
const calculatePropertySimilarity = (prop1, prop2) => {
  let score = 0;

  // Location match (highest weight)
  if (prop1.address?.toLowerCase().includes(prop2.address?.toLowerCase().split(',')[0] || '')) {
    score += 40;
  }

  // Price range similarity
  const priceDiff = Math.abs((prop1.price || 0) - (prop2.price || 0));
  if (priceDiff < 1000) score += 20;
  else if (priceDiff < 3000) score += 10;

  // Perks/amenities overlap
  const perks1 = new Set(prop1.perks || []);
  const perks2 = new Set(prop2.perks || []);
  const commonPerks = [...perks1].filter(p => perks2.has(p));
  score += (commonPerks.length / Math.max(perks1.size, 1)) * 20;

  // Guest capacity similarity
  if (prop1.maxGuests === prop2.maxGuests) score += 10;
  else if (Math.abs((prop1.maxGuests || 0) - (prop2.maxGuests || 0)) <= 2) score += 5;

  // Type match
  if (prop1.type === prop2.type) score += 10;

  return score;
};

// Get similar properties
exports.getSimilarProperties = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 6;

    const currentProperty = await Place.findById(id);
    if (!currentProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Get all properties except current one
    const allProperties = await Place.find({ 
      _id: { $ne: id } 
    }).limit(100);

    // Calculate similarity scores
    const scoredProperties = allProperties.map(prop => ({
      property: prop,
      similarity: calculatePropertySimilarity(currentProperty, prop)
    }));

    // Sort by similarity and get top matches
    const similar = scoredProperties
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.property);

    res.json({ 
      similar,
      count: similar.length,
      basedOn: {
        location: currentProperty.address?.split(',')[0],
        priceRange: currentProperty.price,
        type: currentProperty.type
      }
    });

  } catch (error) {
    console.error('Error getting similar properties:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};

// Personalized recommendations based on user history
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      // Return popular properties for non-logged users
      const popular = await Place.find()
        .sort({ rating: -1 })
        .limit(12);
      
      return res.json({ 
        recommendations: popular,
        type: 'popular',
        message: 'Log in to get personalized recommendations!'
      });
    }

    // Get user's booking history
    const Booking = require('../models/Booking');
    const userBookings = await Booking.find({ user: userId })
      .populate('place')
      .sort({ createdAt: -1 })
      .limit(5);

    if (userBookings.length === 0) {
      // New user - show trending properties
      const trending = await Place.find()
        .sort({ createdAt: -1 })
        .limit(12);
      
      return res.json({
        recommendations: trending,
        type: 'trending',
        message: 'New properties you might like!'
      });
    }

    // Analyze user preferences
    const preferences = {
      locations: {},
      priceRange: { min: Infinity, max: 0 },
      perks: {},
      types: {},
      guestCount: []
    };

    userBookings.forEach(booking => {
      const place = booking.place;
      if (!place) return;

      // Track location preferences
      const city = place.address?.split(',')[0];
      if (city) {
        preferences.locations[city] = (preferences.locations[city] || 0) + 1;
      }

      // Track price range
      if (place.price) {
        preferences.priceRange.min = Math.min(preferences.priceRange.min, place.price);
        preferences.priceRange.max = Math.max(preferences.priceRange.max, place.price);
      }

      // Track perk preferences
      (place.perks || []).forEach(perk => {
        preferences.perks[perk] = (preferences.perks[perk] || 0) + 1;
      });

      // Track type preferences
      if (place.type) {
        preferences.types[place.type] = (preferences.types[place.type] || 0) + 1;
      }

      // Track guest count
      if (booking.numberOfGuests) {
        preferences.guestCount.push(booking.numberOfGuests);
      }
    });

    // Build query for recommendations
    const query = {};
    
    // Prefer similar locations
    const topLocations = Object.entries(preferences.locations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([loc]) => loc);

    if (topLocations.length > 0) {
      query.address = { $regex: topLocations.join('|'), $options: 'i' };
    }

    // Prefer similar price range (with 30% buffer)
    if (preferences.priceRange.min !== Infinity) {
      const buffer = 0.3;
      query.price = {
        $gte: preferences.priceRange.min * (1 - buffer),
        $lte: preferences.priceRange.max * (1 + buffer)
      };
    }

    // Get recommendations
    let recommendations = await Place.find(query).limit(20);

    // If not enough, broaden search
    if (recommendations.length < 8) {
      recommendations = await Place.find({
        $or: [
          { address: { $regex: topLocations.join('|'), $options: 'i' } },
          { perks: { $in: Object.keys(preferences.perks) } }
        ]
      }).limit(12);
    }

    // Exclude already booked properties
    const bookedIds = userBookings.map(b => b.place?._id?.toString()).filter(Boolean);
    recommendations = recommendations.filter(
      rec => !bookedIds.includes(rec._id.toString())
    );

    res.json({
      recommendations,
      type: 'personalized',
      basedOn: {
        recentBookings: userBookings.length,
        preferredLocations: topLocations,
        priceRange: preferences.priceRange.min !== Infinity ? preferences.priceRange : null,
        favoriteAmenities: Object.entries(preferences.perks)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([perk]) => perk)
      }
    });

  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};

// Track user interactions for better recommendations
exports.trackInteraction = async (req, res) => {
  try {
    const { placeId, action } = req.body; // action: view, favorite, search
    const userId = req.user?.id;

    // Store in analytics (will be used for ML later)
    const analyticsController = require('./analyticsController');
    
    analyticsController.trackEvent({
      body: {
        type: `user_${action}`,
        payload: { placeId, userId },
        sessionId: req.sessionID || 'anonymous',
        timestamp: new Date().toISOString()
      }
    }, { status: () => ({ json: () => {} }) });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
};

// Get trending properties based on views and bookings
exports.getTrending = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;

    // Get properties with recent activity
    const trending = await Place.aggregate([
      { $sample: { size: 100 } }, // Random sample for demo
      { $limit: limit }
    ]);

    res.json({
      trending,
      count: trending.length,
      type: 'trending'
    });

  } catch (error) {
    console.error('Error getting trending properties:', error);
    res.status(500).json({ error: 'Failed to get trending properties' });
  }
};
