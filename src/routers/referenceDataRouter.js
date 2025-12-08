const express = require('express');
const {
  getCountries,
  getCurrencies,
  getLanguages,
  updateCountryImportant,
  updateCurrencyImportant,
  updateLanguageImportant
} = require('../controllers/referenceDataController');
const { authenticateToken, authenticateRoles } = require('../middleware/authentication');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authenticateRoles(['admin']));

// Get routes
router.get('/countries', getCountries);
router.get('/currencies', getCurrencies);
router.get('/languages', getLanguages);

// Update important flag routes
router.put('/countries/:id/important', updateCountryImportant);
router.put('/currencies/:id/important', updateCurrencyImportant);
router.put('/languages/:id/important', updateLanguageImportant);

module.exports = router;

