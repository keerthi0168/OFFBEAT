require("dotenv").config();
const fs = require('fs');
const path = require('path');
const express = require("express");
const cors = require("cors");
const { connectWithMySQL } = require("./config/mysql");
const connectWithDB = require("./config/db");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const cloudinary = require("cloudinary").v2;

// connect with MySQL database
connectWithMySQL();

// connect with MongoDB database
connectWithDB();

// cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// For handling cookies
app.use(cookieParser());

// Initialize cookie-session middleware
app.use(
  cookieSession({
    name: "session",
    maxAge: process.env.COOKIE_TIME * 24 * 60 * 60 * 1000,
    keys: [process.env.SESSION_SECRET],
    secure: true, // Only send over HTTPS
    sameSite: "none", // Allow cross-origin requests
    httpOnly: true, // Makes the cookie accessible only on the server-side
  })
);

// middleware to handle json
app.use(express.json());

// Auth request logger (register/login/google-login/logout/update-user)
app.use((req, res, next) => {
  const authPaths = ['/register', '/login', '/google-login', '/logout', '/update-user'];
  if (authPaths.includes(req.path)) {
    const email = req.body?.email ? ` email=${req.body.email}` : '';
    console.log(`[AUTH] ${req.method} ${req.path}${email}`);
  }
  next();
});

// basic health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// dataset download (Raw Data.zip)
app.get('/datasets/raw-data.zip', (req, res) => {
  const datasetPath = path.join(__dirname, '../indian-tourist-destinations/Raw Data.zip');
  if (!fs.existsSync(datasetPath)) {
    return res.status(404).json({ message: 'Raw Data.zip not found' });
  }
  res.download(datasetPath, 'Raw Data.zip');
});

// favicon handler to avoid noisy 404s
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// use express router
app.use("/", require("./routes"));

const PORT = process.env.PORT || 8001; // Changed from 8000 to 8001

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;