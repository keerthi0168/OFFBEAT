const mongoose = require('mongoose');

const toBool = (value, defaultValue = false) => {
  if (typeof value === 'undefined') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const connectWithDB = async () => {
  const isMongoEnabled = toBool(process.env.MONGO_ENABLED, true);

  if (!isMongoEnabled) {
    console.log('ℹ MongoDB disabled via MONGO_ENABLED=false. Running without Mongo-backed features.');
    return;
  }

  mongoose.set('strictQuery', false);

  const connectOptions = {
    family: 4,
    serverSelectionTimeoutMS: 5000,
  };

  const primaryUri = process.env.DB_URL || 'mongodb://127.0.0.1:27017/myownspace';
  const fallbackUri = primaryUri.includes('localhost')
    ? primaryUri.replace('localhost', '127.0.0.1')
    : null;

  const connectionUris = [primaryUri, fallbackUri].filter(
    (uri, index, list) => uri && list.indexOf(uri) === index
  );

  for (const uri of connectionUris) {
    try {
      await mongoose.connect(uri, connectOptions);
      console.log(`✓ MongoDB connected successfully (${uri})`);
      return;
    } catch (err) {
      console.log(`MongoDB connection attempt failed (${uri}): ${err.message}`);
      if (mongoose.connection.readyState !== 0) {
        try {
          await mongoose.disconnect();
        } catch (disconnectErr) {
          // no-op: best effort cleanup before retrying next URI
        }
      }
    }
  }

  console.log(`⚠ MongoDB connection failed - running in demo mode`);
  console.log(`  Tourism APIs & chatbot will work with static data.`);
};

module.exports = connectWithDB;
