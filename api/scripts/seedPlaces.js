require('dotenv').config();
const mongoose = require('mongoose');
const Place = require('../models/Place');
const { places } = require('../data/indiaTourismData');

const seedPlaces = async () => {
  try {
    if (!process.env.DB_URL) {
      throw new Error('DB_URL is not set in environment variables.');
    }

    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const operations = places.map((place) => ({
      updateOne: {
        filter: { title: place.title, address: place.address },
        update: { $setOnInsert: place },
        upsert: true,
      },
    }));

    const result = await Place.bulkWrite(operations, { ordered: false });
    console.log('Seed complete:', result);
  } catch (error) {
    console.error('Seed failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

seedPlaces();
