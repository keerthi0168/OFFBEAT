const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/user');

const {
  addPlace,
  getPlaces,
  updatePlace,
  singlePlace,
  userPlaces,
  searchPlaces,
  seedPlaces
} = require('../controllers/placeController');

router.route('/').get(getPlaces);

// Protected routes (user must be logged in)
router.route('/add-places').post(isLoggedIn, addPlace);
router.route('/user-places').get(isLoggedIn, userPlaces);
router.route('/update-place').put(isLoggedIn, updatePlace);

// Not Protected routed but sequence should not be interfered with above routes
router.route('/seed').post(seedPlaces);
router.route('/search/:key').get(searchPlaces)
router.route('/:id').get(singlePlace);


module.exports = router;
