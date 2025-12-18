const express = require('express');
const { authenticateToken, authenticateRoles } = require('../middleware/authentication');
const mantenedorController = require('../controllers/mantenedorController');

const router = express.Router();

// Public endpoint to get version (for cache invalidation)
router.get('/mantenedores/version', authenticateToken, mantenedorController.getVersion);

// Get all mantenedores (grouped by type)
router.get('/mantenedores', authenticateToken, mantenedorController.getAll);

// Get available types
router.get('/mantenedores/types', authenticateToken, mantenedorController.getTypes);

// Get mantenedores by type
router.get('/mantenedores/type/:type', authenticateToken, mantenedorController.getByType);

// Get a single mantenedor by id
router.get('/mantenedores/:id', authenticateToken, mantenedorController.getById);

// Create a new mantenedor (admin only)
router.post('/mantenedores', authenticateToken, authenticateRoles(['admin']), mantenedorController.create);

// Update an existing mantenedor (admin only)
router.put('/mantenedores/:id', authenticateToken, authenticateRoles(['admin']), mantenedorController.update);

// Delete a mantenedor (admin only)
router.delete('/mantenedores/:id', authenticateToken, authenticateRoles(['admin']), mantenedorController.remove);

module.exports = router;

