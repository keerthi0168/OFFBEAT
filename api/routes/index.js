const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import controllers
const userController = require('../controllers/userController');
const placeController = require('../controllers/placeController');
const bookingController = require('../controllers/bookingController');
const analyticsController = require('../controllers/analyticsController');
const uploadController = require('../controllers/uploadController');
const chatbotController = require('../controllers/chatbotController');
const recommendationController = require('../controllers/recommendationController');
const tourismController = require('../controllers/tourismController');
const datasetController = require('../controllers/datasetController');
const mlHealthController = require('../controllers/mlHealthController');
const { getModel } = require('../utils/mlModel');
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
router.get('/users/me', isLoggedIn, userController.getCurrentUser);
router.get('/users/me/listings', isLoggedIn, userController.getCurrentUserListings);
router.get('/users/me/bookings', isLoggedIn, userController.getCurrentUserBookings);
router.get('/users/me/reviews', isLoggedIn, userController.getCurrentUserReviews);
router.get('/users/me/saved', isLoggedIn, userController.getCurrentUserSaved);

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

// AI/ML routes - Chatbot
router.post('/chatbot/chat', chatbotController.chat);
router.post('/chatbot/train', chatbotController.train);
router.get('/chatbot/stats', chatbotController.getStats);
router.post('/chatbot/clear-context', chatbotController.clearContext);

// AI/ML routes - Recommendations
router.get('/recommendations/similar/:id', recommendationController.getSimilarProperties);
router.get('/recommendations/personalized', recommendationController.getPersonalizedRecommendations);
router.get('/recommendations/trending', recommendationController.getTrending);
router.post('/recommendations/track', recommendationController.trackInteraction);
router.get('/ml/health', mlHealthController.getMlHealth);
router.post('/recommend', (req, res) => {
	try {
		const model = getModel();
		const recommendations = model.getRecommendations(req.body || {}, 5);

		return res.status(200).json({
			success: true,
			count: recommendations.length,
			recommendations,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: 'Failed to generate recommendations',
			error: error.message,
		});
	}
});

// Tourism Information routes
router.get('/tourism/destination/:name', tourismController.getDestinationInfo);
router.get('/tourism/category/:category', tourismController.getDestinationsByCategory);
router.get('/tourism/region/:region', tourismController.getDestinationsByRegion);
router.get('/tourism/search', tourismController.searchDestinations);
router.get('/tourism/suggest', tourismController.getPrefixSuggestions);
router.post('/tourism/personalized', tourismController.getPersonalizedDestinations);
router.get('/tourism/categories', tourismController.getCategories);
router.get('/tourism/regions', tourismController.getRegions);
router.get('/tourism/random', tourismController.getRandomDestinations);
router.get('/tourism/all', tourismController.getAllDestinations);

// Dataset/Raw Data routes
router.get('/dataset/manifest', datasetController.getManifest);
router.get('/dataset/categories', datasetController.getCategories);
router.get('/dataset/category/:category', datasetController.getCategoryImages);

module.exports = router;