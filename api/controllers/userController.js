const User = require('../models/UserMySQL');
const cloudinary = require('cloudinary').v2;
const cookieToken = require('../utils/cookieToken');
const CustomError = require('../utils/customError');

// Register user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    cookieToken(user, res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error during registration', error: err.message });
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'User not found with this email' });
    }

    const isPasswordValid = await user.isValidatedPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    cookieToken(user, res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error during login', error: err.message });
  }
};

// Google login
exports.googleLogin = async (req, res, next) => {
  try {
    const { name, email, picture } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        name: name || 'Google User',
        email,
        password: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        picture: picture || 'https://res.cloudinary.com/rahul4019/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1695133265/pngwing.com_zi4cre.png',
      });
    }

    cookieToken(user, res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error during google login', error: err.message });
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
