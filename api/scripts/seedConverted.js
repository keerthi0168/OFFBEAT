require('dotenv').config();
const mongoose = require('mongoose');
const Place = require('../models/Place');
const { places } = require('../data/convertedPlaces');

const seedConvertedPlaces = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      family: 4  // Force IPv4
    });
    console.log('✓ Connected to MongoDB\n');
    
    console.log(`Starting to seed ${places.length} places from converted CSV data...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const placeData of places) {
      try {
        await Place.findOneAndUpdate(
          { title: placeData.title },
          placeData,
          { upsert: true, new: true }
        );
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`✓ Processed ${successCount} places...`);
        }
      } catch (err) {
        errorCount++;
        console.error(`✗ Error seeding "${placeData.title}": ${err.message}`);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Seeding complete!`);
    console.log(`   Success: ${successCount} places`);
    console.log(`   Errors: ${errorCount} places`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedConvertedPlaces();
