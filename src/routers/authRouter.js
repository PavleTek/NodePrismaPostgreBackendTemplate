const express = require('express');
const { login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authentication');

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

module.exports = router;

