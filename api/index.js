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
const isProduction = process.env.NODE_ENV === 'production';

const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultDevOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

const allowedOrigins = new Set([...configuredOrigins, ...defaultDevOrigins]);

const isLocalNetworkOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);

    if (["localhost", "127.0.0.1", "::1"].includes(hostname)) {
      return true;
    }

    if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) {
      return true;
    }

    const match = hostname.match(/^172\.(\d{1,3})\./);
    if (match) {
      const secondOctet = Number(match[1]);
      return secondOctet >= 16 && secondOctet <= 31;
    }

    return false;
  } catch (error) {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || isLocalNetworkOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

// For handling cookies
app.use(cookieParser());

// Initialize cookie-session middleware
app.use(
  cookieSession({
    name: "session",
    maxAge: process.env.COOKIE_TIME * 24 * 60 * 60 * 1000,
    keys: [process.env.SESSION_SECRET],
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
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
app.use(cors(corsOptions));

// use express router
app.use("/", require("./routes"));

const PORT = process.env.PORT || 8001; // Changed from 8000 to 8001

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;