const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
    required: false,
  },
  title: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  photos: [{ type: String }],
  description: {
    type: String,
  },
  perks: [{ type: String }],
  extraInfo: {
    type: String,
  },
  maxGuests: {
    type: Number,
  },
  price: {
    type: Number,
  },
  state: {
    type: String,
  },
  region: {
    type: String,
  },
  subRegion: {
    type: String,
  },
  category: {
    type: String,
  },
  placeType: {
    type: String,
  },
  popularity: {
    type: String,
    enum: ['Very Low', 'Low', 'Low-Medium', 'Medium', 'High'],
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
  },
  bestSeason: [{ type: String }],
  budgetRange: {
    type: String,
  },
  budgetTier: {
    type: String,
    enum: ['low', 'mid', 'high'],
  },
  activities: [{ type: String }],
  direction: {
    type: String,
    enum: ['North', 'South', 'East', 'West', 'Central'],
  },
  regionType: {
    type: String,
  },
  placeId: {
    type: String,
    unique: true,
    sparse: true,
  },
  district: {
    type: String,
  },
  tourismType: {
    type: String,
  },
  altitudeM: {
    type: Number,
  },
  budgetMin: {
    type: Number,
  },
  budgetMax: {
    type: Number,
  },
  images: [{ type: String }],
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  popularityScore: {
    type: Number,
    min: 1,
    max: 4,
  },
  crowdLevel: {
    type: String,
  },
  accessibilityScore: {
    type: Number,
    min: 1,
    max: 10,
  },
  wildlifeScore: {
    type: Number,
    min: 1,
    max: 10,
  },
  birdSpeciesCount: {
    type: Number,
    min: 0,
  },
  ecoSensitivity: {
    type: Number,
    min: 1,
    max: 10,
  },
  waterBodyType: {
    type: String,
  },
  activityTypes: [{ type: String }],
  transportAccess: {
    type: String,
  },
  ecoScore: {
    type: Number,
    min: 1,
    max: 10,
  },
  familyFriendly: {
    type: Boolean,
    default: false,
  },
  categoryScore: {
    type: Number,
    min: 1,
    max: 5,
  },
});

const Place = mongoose.model("Place", placeSchema);

module.exports = Place;
