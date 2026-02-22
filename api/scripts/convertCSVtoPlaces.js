const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const results = [];
const perksMap = {
  wifi: 'wifi',
  tv: 'tv',
  parking: 'parking',
  'air conditioning': 'air conditioning',
  kitchen: 'kitchen',
  pets: 'pets allowed',
  entrance: 'private entrance',
  pool: 'pool',
  gym: 'gym',
  elevator: 'elevator',
  security: '24/7 security',
  garden: 'garden',
  balcony: 'balcony',
};

// Helper to extract perks from amenities or features
function extractPerks(amenitiesStr, featuresStr) {
  const perks = [];
  const combined = `${amenitiesStr || ''} ${featuresStr || ''}`.toLowerCase();
  
  Object.keys(perksMap).forEach((key) => {
    if (combined.includes(key)) {
      perks.push(perksMap[key]);
    }
  });
  
  // Always include at least 3 default perks if none found
  if (perks.length === 0) {
    return ['wifi', 'parking', 'tv'];
  }
  
  return perks.slice(0, 6); // Max 6 perks
}

// Helper to clean and format text
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
    .substring(0, 500); // Limit length
}

// Helper to generate placeholder image URLs
function generateImageUrls(city, propertyType, count = 3) {
  const baseImages = [
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  ];
  return baseImages.slice(0, count);
}

// Process Airbnb India Top 500
function processAirbnbCSV(filePath) {
  return new Promise((resolve, reject) => {
    const places = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const price = parseInt(row['pricing/rate/amount']) || 2000;
          const name = cleanText(row.name || 'Comfortable Stay');
          const address = cleanText(row.address || 'India');
          const guests = parseInt(row.numberOfGuests) || 2;
          const roomType = row.roomType || 'Entire place';
          
          places.push({
            title: name.substring(0, 100),
            address: address,
            photos: generateImageUrls(address, roomType),
            description: `${roomType} in ${address.split(',')[0]}. Perfect for ${guests} guests seeking comfort and convenience.`,
            extraInfo: `This property offers ${roomType.toLowerCase()} with modern amenities and easy access to local attractions.`,
            perks: ['wifi', 'kitchen', 'tv'],
            maxGuests: guests,
            price: Math.floor(price * 0.012), // Convert to INR approximation
          });
        } catch (e) {
          // Skip malformed rows
        }
      })
      .on('end', () => resolve(places))
      .on('error', reject);
  });
}

// Process city-specific CSVs (Mumbai, Kolkata, Hyderabad, Gurgaon)
function processCityCSV(filePath, cityName) {
  return new Promise((resolve, reject) => {
    const places = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const price = parseFloat(row.PRICE || row.MIN_PRICE || 0);
          if (price === 0) return;
          
          const bedrooms = parseInt(row.BEDROOM_NUM) || 2;
          const area = row.AREA || row.SUPER_AREA || '1000 sq.ft.';
          const propertyType = row.PROPERTY_TYPE || 'Apartment';
          const locality = row.LOCALITY_NAME || row.BUILDING_NAME || cityName;
          const description = cleanText(row.DESCRIPTION || row.PROP_HEADING || '');
          const amenities = row.AMENITIES || row.FEATURES || '';
          
          const title = `${bedrooms} BHK ${propertyType} in ${locality}`;
          const address = `${locality}, ${cityName}, India`;
          
          let pricePerNight = price;
          // Convert lakh/crore to monthly rent estimate, then to per night
          if (price > 100000) {
            pricePerNight = Math.floor((price * 0.0006) / 30); // 0.06% of price per month, divided by 30
          } else if (price > 10000) {
            pricePerNight = Math.floor(price / 30); // Assume monthly rent
          }
          
          // Ensure reasonable range
          if (pricePerNight < 500) pricePerNight = Math.floor(Math.random() * 2000) + 1500;
          if (pricePerNight > 50000) pricePerNight = Math.floor(Math.random() * 5000) + 3000;
          
          places.push({
            title: title.substring(0, 100),
            address: address,
            photos: generateImageUrls(cityName, propertyType),
            description: description.substring(0, 300) || `Beautiful ${bedrooms} bedroom ${propertyType.toLowerCase()} spanning ${area}. Located in the heart of ${locality}, offering modern living with excellent connectivity.`,
            extraInfo: `This ${propertyType.toLowerCase()} features ${area} of space with premium amenities. Perfect for families or professionals seeking quality accommodation in ${cityName}.`,
            perks: extractPerks(amenities, row.FEATURES),
            maxGuests: bedrooms * 2,
            price: pricePerNight,
          });
        } catch (e) {
          // Skip malformed rows
        }
      })
      .on('end', () => resolve(places))
      .on('error', reject);
  });
}

async function convertAll() {
  console.log('Starting CSV conversion...\n');
  
  const rootDir = path.join(__dirname, '../../');
  const allPlaces = [];
  
  try {
    // Process Airbnb dataset
    console.log('Processing Airbnb India Top 500...');
    const airbnbPlaces = await processAirbnbCSV(path.join(rootDir, 'Airbnb_India_Top_500.csv'));
    allPlaces.push(...airbnbPlaces.slice(0, 100)); // Take top 100
    console.log(`✓ Added ${airbnbPlaces.length} places from Airbnb dataset\n`);
    
    // Process city datasets
    const cityFiles = [
      { file: 'mumbai.csv', city: 'Mumbai' },
      { file: 'kolkata.csv', city: 'Kolkata' },
      { file: 'hyderabad.csv', city: 'Hyderabad' },
      { file: 'gurgaon_10k.csv', city: 'Gurgaon' },
    ];
    
    for (const { file, city } of cityFiles) {
      console.log(`Processing ${city}...`);
      const cityPlaces = await processCityCSV(path.join(rootDir, file), city);
      allPlaces.push(...cityPlaces.slice(0, 50)); // Take top 50 from each city
      console.log(`✓ Added ${cityPlaces.length} places from ${city} dataset\n`);
    }
    
    // Write to output file
    const outputPath = path.join(__dirname, '../data/convertedPlaces.js');
    const outputContent = `const places = ${JSON.stringify(allPlaces, null, 2)};\n\nmodule.exports = { places };`;
    
    fs.writeFileSync(outputPath, outputContent, 'utf8');
    console.log(`\n✅ Successfully converted ${allPlaces.length} places!`);
    console.log(`📁 Output saved to: ${outputPath}`);
    console.log('\nYou can now seed the database with: npm run seed:converted');
    
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    process.exit(1);
  }
}

convertAll();
