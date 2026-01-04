const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createResult,
  getAllResults,
  getResultById,
  updateResult,
  deleteResult
} = require('../controllers/resultController');

// All routes require authentication
router.use(authMiddleware());

// Get all results (filtered by role)
router.get('/', getAllResults);

// Get result by ID
router.get('/:id', getResultById);

// Create result (Teacher/Admin only)
router.post('/', authMiddleware(['admin', 'teacher']), createResult);

// Update result (Teacher/Admin only)
router.put('/:id', authMiddleware(['admin', 'teacher']), updateResult);

// Delete result (Admin only)
router.delete('/:id', authMiddleware(['admin']), deleteResult);

module.exports = router;

