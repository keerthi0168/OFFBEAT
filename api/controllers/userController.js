const User = require('../models/UserMySQL');
const Place = require('../models/Place');
const Booking = require('../models/Booking');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieToken = require('../utils/cookieToken');
const CustomError = require('../utils/customError');

const demoUsers = new Map();

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const getSafeUser = (user) => {
  if (!user) return null;
  const plain = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete plain.password;
  return plain;
};

const sendAuthResponse = (user, res) => {
  if (user && typeof user.getJwtToken === 'function') {
    return cookieToken(user, res);
  }

  const jwtSecret = process.env.JWT_SECRET || 'temporary-jwt-secret-change-me';
  const jwtExpiry = process.env.JWT_EXPIRY || '7d';
  const cookieTimeDays = Number(process.env.COOKIE_TIME) || 7;
  const isProduction = process.env.NODE_ENV === 'production';

  const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: jwtExpiry });

  return res
    .status(200)
    .cookie('token', token, {
      expires: new Date(Date.now() + cookieTimeDays * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    })
    .json({
      success: true,
      token,
      user: getSafeUser(user),
    });
};

const isMongoConnected = () => {
  try {
    return Boolean(Place?.db?.readyState === 1);
  } catch (error) {
    return false;
  }
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };

  delete plain.password;

  return {
    ...plain,
    email_verified: Boolean(plain.email_verified),
    phone_verified: Boolean(plain.phone_verified),
    id_verified: Boolean(plain.id_verified),
  };
};

const parseSavedPlaces = (user) => {
  const saved = user?.preferences?.savedPlaces;
  if (!Array.isArray(saved)) return [];
  return saved;
};

// Register user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
    });

    sendAuthResponse(user, res);
  } catch (err) {
    try {
      const { name, email, password } = req.body;
      const normalizedEmail = normalizeEmail(email);

      if (!name || !normalizedEmail || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
      }

      if (demoUsers.has(normalizedEmail)) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const demoUser = {
        id: `demo-${Date.now()}`,
        name,
        email: normalizedEmail,
        password: hashedPassword,
        picture:
          'https://res.cloudinary.com/rahul4019/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1695133265/pngwing.com_zi4cre.png',
        preferences: {
          terms: [],
          categories: [],
          regions: [],
          updatedAt: null,
        },
      };

      demoUsers.set(normalizedEmail, demoUser);
      return sendAuthResponse(demoUser, res);
    } catch (fallbackErr) {
      console.error('Registration error:', err);
      console.error('Registration fallback error:', fallbackErr);
      return res.status(500).json({ message: 'Error during registration', error: err?.message || 'unknown_error' });
    }
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'User not found with this email' });
    }

    const isPasswordValid = await user.isValidatedPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    sendAuthResponse(user, res);
  } catch (err) {
    try {
      const { email, password } = req.body;
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
      }

      const demoUser = demoUsers.get(normalizedEmail);
      if (!demoUser) {
        return res.status(401).json({
          message: 'User not identified. Please create an account.',
          code: 'USER_NOT_IDENTIFIED',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, demoUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Password is incorrect' });
      }

      return sendAuthResponse(demoUser, res);
    } catch (fallbackErr) {
      console.error('Login error:', err);
      console.error('Login fallback error:', fallbackErr);
      return res.status(500).json({ message: 'Error during login', error: err?.message || 'unknown_error' });
    }
  }
};

// Google login
exports.googleLogin = async (req, res, next) => {
  try {
    const { name, email, picture } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    let user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        name: name || 'Google User',
        email: normalizedEmail,
        password: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        picture: picture || 'https://res.cloudinary.com/rahul4019/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1695133265/pngwing.com_zi4cre.png',
      });
    }

    sendAuthResponse(user, res);
  } catch (err) {
    try {
      const { name, email, picture } = req.body;
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail) {
        return res.status(400).json({ message: 'Email is required' });
      }

      let demoUser = demoUsers.get(normalizedEmail);
      if (!demoUser) {
        demoUser = {
          id: `demo-${Date.now()}`,
          name: name || 'Google User',
          email: normalizedEmail,
          password: await bcrypt.hash(Math.random().toString(36), 10),
          picture:
            picture ||
            'https://res.cloudinary.com/rahul4019/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1695133265/pngwing.com_zi4cre.png',
          preferences: {
            terms: [],
            categories: [],
            regions: [],
            updatedAt: null,
          },
        };
        demoUsers.set(normalizedEmail, demoUser);
      }

      return sendAuthResponse(demoUser, res);
    } catch (fallbackErr) {
      console.error('Google login error:', err);
      console.error('Google login fallback error:', fallbackErr);
      return res.status(500).json({ message: 'Error during google login', error: err?.message || 'unknown_error' });
    }
  }
};

// Upload user picture
exports.uploadPicture = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    res.status(200).json({
      url,
      message: 'Picture uploaded successfully',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error uploading picture', error: err.message });
  }
};

// Update user details
exports.updateUserDetails = async (req, res, next) => {
  try {
    const userData = req.user;
    const { name, picture } = req.body;

    if (!userData) {
      return res.status(401).json({ message: 'You are not authorized to access this page!' });
    }

    const user = await User.findByPk(userData.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) {
      user.name = name;
    }

    if (picture) {
      user.picture = picture;
    }

    await user.save();

    res.status(200).json({
      success: true,
      user,
      message: 'User details updated successfully',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error updating user details', error: err.message });
  }
};

// Logout user
exports.logout = async (req, res, next) => {
  try {
    res.clearCookie('token');
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error during logout', error: err.message });
  }
};

// Current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const safeUser = sanitizeUser(req.user);
    const metrics = {
      messages_received:
        Number.isFinite(Number(req.user?.messages_received))
          ? Number(req.user.messages_received)
          : null,
      responses_sent:
        Number.isFinite(Number(req.user?.responses_sent))
          ? Number(req.user.responses_sent)
          : null,
      avg_response_time_minutes:
        Number.isFinite(Number(req.user?.avg_response_time_minutes))
          ? Number(req.user.avg_response_time_minutes)
          : null,
    };

    return res.status(200).json({ success: true, user: safeUser, metrics });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load profile', error: error.message });
  }
};

// Current user listings
exports.getCurrentUserListings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!isMongoConnected()) {
      return res.status(200).json({ success: true, listings: [] });
    }

    const listings = await Place.find({ owner: req.user.id });
    return res.status(200).json({ success: true, listings: Array.isArray(listings) ? listings : [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load listings', error: error.message });
  }
};

// Current user bookings (host + guest context)
exports.getCurrentUserBookings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!isMongoConnected()) {
      return res.status(200).json({ success: true, hostBookings: [], guestBookings: [], bookings: [] });
    }

    const listings = await Place.find({ owner: req.user.id }).select('_id');
    const listingIds = listings.map((item) => item?._id).filter(Boolean);

    const [hostBookings, guestBookings] = await Promise.all([
      listingIds.length ? Booking.find({ place: { $in: listingIds } }).populate('place') : Promise.resolve([]),
      Booking.find({ user: req.user.id }).populate('place'),
    ]);

    return res.status(200).json({
      success: true,
      hostBookings: Array.isArray(hostBookings) ? hostBookings : [],
      guestBookings: Array.isArray(guestBookings) ? guestBookings : [],
      bookings: Array.isArray(hostBookings) ? hostBookings : [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load bookings', error: error.message });
  }
};

// Current user reviews (if present on booking docs)
exports.getCurrentUserReviews = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!isMongoConnected()) {
      return res.status(200).json({ success: true, reviews: [] });
    }

    const listings = await Place.find({ owner: req.user.id }).select('_id');
    const listingIds = listings.map((item) => item?._id).filter(Boolean);

    if (!listingIds.length) {
      return res.status(200).json({ success: true, reviews: [] });
    }

    const hostBookings = await Booking.find({ place: { $in: listingIds } }).populate('place');

    const reviews = hostBookings
      .map((booking) => {
        const rating = booking?.rating ?? booking?.review?.rating;
        const comment = booking?.review?.comment ?? booking?.comment;
        if (rating === undefined && !comment) return null;

        return {
          id: booking?._id,
          rating: Number.isFinite(Number(rating)) ? Number(rating) : null,
          comment: comment || '',
          reviewer: booking?.name || 'Guest',
          date: booking?.createdAt || booking?.updatedAt || new Date().toISOString(),
          place: booking?.place || null,
        };
      })
      .filter(Boolean);

    return res.status(200).json({ success: true, reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load reviews', error: error.message });
  }
};

// Current user saved places / wishlist
exports.getCurrentUserSaved = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const saved = parseSavedPlaces(req.user);
    return res.status(200).json({ success: true, saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load saved places', error: error.message });
  }
};
