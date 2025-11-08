const express = require('express');
const { login, getProfile, updateProfile, updatePassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authentication');

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes - users can only update their own profile
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/profile/password', authenticateToken, updatePassword);

module.exports = router;

