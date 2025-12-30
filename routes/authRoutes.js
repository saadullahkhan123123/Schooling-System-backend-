const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { register, login } = require('../controllers/authController');
const {
  updateProfile,
  uploadProfileImage,
  sendOTP,
  resetPasswordWithOTP
} = require('../controllers/profileController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.put('/profile', authMiddleware(), updateProfile);
router.post('/profile/image', authMiddleware(), uploadProfileImage);
router.post('/send-otp', authMiddleware(), sendOTP);
router.post('/reset-password-otp', authMiddleware(), resetPasswordWithOTP);

module.exports = router;