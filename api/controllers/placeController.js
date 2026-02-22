const mongoose = require('mongoose');
const Place = require('../models/Place');

const fallbackPlaces = [
  {
    _id: 'demo-spiti',
    title: 'Spiti Valley Mountain Homestay',
    address: 'Spiti Valley, Himachal Pradesh',
    photos: [
      'https://images.unsplash.com/photo-1500534314209-a26db0f5f6f1?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'High-altitude homestay with local hosts and stunning valley views.',
    perks: ['WiFi', 'Heater', 'Local meals', 'Mountain view'],
    extraInfo: 'Perfect for stargazing and quiet retreats.',
    maxGuests: 4,
    price: 2200,
  },
  {
    _id: 'demo-hampi',
    title: 'Heritage Courtyard Stay',
    address: 'Hampi, Karnataka',
    photos: [
      'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Stay near UNESCO ruins with guided heritage walks.',
    perks: ['WiFi', 'Breakfast', 'Bicycle rental'],
    extraInfo: 'Local guide available on request.',
    maxGuests: 3,
    price: 1800,
  },
  {
    _id: 'demo-ziro',
    title: 'Ziro Valley Eco Lodge',
    address: 'Ziro Valley, Arunachal Pradesh',
    photos: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Eco-friendly lodge surrounded by rice fields and pine forests.',
    perks: ['WiFi', 'Local cuisine', 'Nature trails'],
    extraInfo: 'Cultural experiences with Apatani community.',
    maxGuests: 4,
    price: 2400,
  },
  {
    _id: 'demo-gokarna',
    title: 'Gokarna Beach Hut',
    address: 'Gokarna, Karnataka',
    photos: [
      'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Simple beach hut steps from the sea with sunset views.',
    perks: ['Beach access', 'Cafe nearby', 'WiFi'],
    extraInfo: 'Ideal for relaxed coastal stays.',
    maxGuests: 2,
    price: 1400,
  },
  {
    _id: 'demo-munnar',
    title: 'Tea Estate View Villa',
    address: 'Munnar, Kerala',
    photos: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Hilltop villa overlooking tea gardens and misty trails.',
    perks: ['WiFi', 'Breakfast', 'Parking'],
    extraInfo: 'Guided tea estate tour available.',
    maxGuests: 5,
    price: 2600,
  },
  {
    _id: 'demo-tawang',
    title: 'Monastery View Cottage',
    address: 'Tawang, Arunachal Pradesh',
    photos: [
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Cozy cottage with views of the mountains and monastery.',
    perks: ['Heater', 'Local meals', 'WiFi'],
    extraInfo: 'Best visited in spring and autumn.',
    maxGuests: 3,
    price: 2100,
  },
];

const isMongoConnected = () => mongoose.connection?.readyState === 1;

// Adds a place in the DB
exports.addPlace = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        message: 'MongoDB unavailable. Unable to add place right now.',
      });
    }
    const userData = req.user;
    const {
      title,
      address,
      addedPhotos,
      description,
      perks,
      extraInfo,
      maxGuests,
      price,
    } = req.body;
    const place = await Place.create({
      owner: userData.id,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      maxGuests,
      price,
    });
    res.status(200).json({
      place,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err,
    });
  }
};

// Returns user specific places
exports.userPlaces = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(200).json([]);
    }
    const userData = req.user;
    const id = userData.id;
    res.status(200).json(await Place.find({ owner: id }));
  } catch (err) {
    res.status(500).json({
      message: 'Internal serever error',
    });
  }
};

// Updates a place
exports.updatePlace = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        message: 'MongoDB unavailable. Unable to update place right now.',
      });
    }
    const userData = req.user;
    const userId = userData.id;
    const {
      id,
      title,
      address,
      addedPhotos,
      description,
      perks,
      extraInfo,
      maxGuests,
      price,
    } = req.body;

    const place = await Place.findById(id);
    if (userId === place.owner.toString()) {
      place.set({
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        maxGuests,
        price,
      });
      await place.save();
      res.status(200).json({
        message: 'place updated!',
      });
    }
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err,
    });
  }
};

// Returns all the places in DB
exports.getPlaces = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(200).json({
        places: fallbackPlaces,
        fallback: true,
      });
    }
    const places = await Place.find();
    res.status(200).json({
      places,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// Returns single place, based on passed place id
exports.singlePlace = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isMongoConnected()) {
      const place = fallbackPlaces.find((item) => item._id === id);
      if (!place) {
        return res.status(400).json({
          message: 'Place not found',
        });
      }
      return res.status(200).json({ place });
    }
    const place = await Place.findById(id);
    if (!place) {
      return res.status(400).json({
        message: 'Place not found',
      });
    }
    res.status(200).json({
      place,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal serever error',
    });
  }
};

// Search Places in the DB
exports.searchPlaces = async (req, res) => {
  try {
    const searchword = req.params.key;

    if (!isMongoConnected()) {
      const matches = fallbackPlaces.filter((place) =>
        place.address.toLowerCase().includes(searchword.toLowerCase()),
      );
      return res.status(200).json(matches);
    }

    if (searchword === '') return res.status(200).json(await Place.find())

    const searchMatches = await Place.find({ address: { $regex: searchword, $options: "i" } })

    res.status(200).json(searchMatches);
  } catch (err) {
    console.log(err)
    res.status(500).json({
      message: 'Internal serever error 1',
    });
  }
}

// Seed demo places
exports.seedPlaces = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(200).json({
        seeded: false,
        fallback: true,
        message: 'MongoDB unavailable. Serving fallback data.',
      });
    }
    const existingCount = await Place.countDocuments();
    if (existingCount > 0) {
      return res.status(200).json({
        seeded: false,
        message: 'Places already exist',
      });
    }

    const demoPlaces = [
      {
        title: 'Spiti Valley Mountain Homestay',
        address: 'Spiti Valley, Himachal Pradesh',
        photos: [
          'https://images.unsplash.com/photo-1500534314209-a26db0f5f6f1?auto=format&fit=crop&w=1200&q=80',
        ],
        description: 'High-altitude homestay with local hosts and stunning valley views.',
        perks: ['WiFi', 'Heater', 'Local meals', 'Mountain view'],
        extraInfo: 'Perfect for stargazing and quiet retreats.',
        maxGuests: 4,
        price: 2200,
      },
      {
        title: 'Heritage Courtyard Stay',
        address: 'Hampi, Karnataka',
        photos: [
          'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=1200&q=80',
        ],
        description: 'Stay near UNESCO ruins with guided heritage walks.',
        perks: ['WiFi', 'Breakfast', 'Bicycle rental'],
        extraInfo: 'Local guide available on request.',
        maxGuests: 3,
        price: 1800,
      },
      {
        title: 'Ziro Valley Eco Lodge',
        address: 'Ziro Valley, Arunachal Pradesh',
        photos: [
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        ],
        description: 'Eco-friendly lodge surrounded by rice fields and pine forests.',
        perks: ['WiFi', 'Local cuisine', 'Nature trails'],
        extraInfo: 'Cultural experiences with Apatani community.',
        maxGuests: 4,
        price: 2400,
      },
      {
        title: 'Gokarna Beach Hut',
        address: 'Gokarna, Karnataka',
        photos: [
          'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80',
        ],
        description: 'Simple beach hut steps from the sea with sunset views.',
        perks: ['Beach access', 'Cafe nearby', 'WiFi'],
        extraInfo: 'Ideal for relaxed coastal stays.',
        maxGuests: 2,
        price: 1400,
      },
      {
        title: 'Tea Estate View Villa',
        address: 'Munnar, Kerala',
        photos: [
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
        ],
        description: 'Hilltop villa overlooking tea gardens and misty trails.',
        perks: ['WiFi', 'Breakfast', 'Parking'],
        extraInfo: 'Guided tea estate tour available.',
        maxGuests: 5,
        price: 2600,
      },
      {
        title: 'Monastery View Cottage',
        address: 'Tawang, Arunachal Pradesh',
        photos: [
          'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80',
        ],
        description: 'Cozy cottage with views of the mountains and monastery.',
        perks: ['Heater', 'Local meals', 'WiFi'],
        extraInfo: 'Best visited in spring and autumn.',
        maxGuests: 3,
        price: 2100,
      },
    ];

    const created = await Place.insertMany(demoPlaces);
    res.status(201).json({
      seeded: true,
      count: created.length,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error while seeding',
      error: err,
    });
  }
};