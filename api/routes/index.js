const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import controllers
const userController = require('../controllers/userController');
const placeController = require('../controllers/placeController');
const bookingController = require('../controllers/bookingController');
const analyticsController = require('../controllers/analyticsController');
const uploadController = require('../controllers/uploadController');
const { isLoggedIn } = require('../middlewares/user');

// Configure multer for file uploads
const upload = multer({ dest: '/tmp' });

// User routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/google-login', userController.googleLogin);
router.post('/upload-picture', userController.uploadPicture);
router.put('/update-user', isLoggedIn, userController.updateUserDetails);
router.get('/logout', userController.logout);

// Place routes
router.post('/add-place', isLoggedIn, placeController.addPlace);
router.get('/user-places', isLoggedIn, placeController.userPlaces);
router.put('/update-place', isLoggedIn, placeController.updatePlace);
router.get('/places', placeController.getPlaces);
router.get('/places/search/:key', placeController.searchPlaces);
router.get('/search/:key', placeController.searchPlaces);
router.get('/places/:id', placeController.singlePlace);

// Booking routes
router.post('/create-booking', isLoggedIn, bookingController.createBookings);
router.get('/get-bookings', isLoggedIn, bookingController.getBookings);

// Analytics routes
router.post('/analytics/track', analyticsController.trackEvent);
router.get('/analytics/summary', analyticsController.getSummary);

// Upload routes
router.post('/upload', upload.array('photos'), uploadController.uploadPhoto);
router.post('/upload-by-link', uploadController.uploadByLink);


module.exports = router;