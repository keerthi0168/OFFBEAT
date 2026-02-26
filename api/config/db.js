const mongoose = require('mongoose');

const connectWithDB = async () => {
  mongoose.set('strictQuery', false);
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✓ MongoDB connected successfully`);
  } catch (err) {
    console.log(`⚠ MongoDB connection failed - running in demo mode`);
    console.log(`  Error: ${err.message}`);
    console.log(`  Tourism APIs & chatbot will work with static data.`);
  }
};

module.exports = connectWithDB;
