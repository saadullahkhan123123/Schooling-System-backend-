const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createUpdate,
  getAllUpdates,
  getUpdateById,
  updateUpdate,
  deleteUpdate
} = require('../controllers/updateController');

// All routes require authentication
router.use(authMiddleware());

// Get all updates (all authenticated users)
router.get('/', getAllUpdates);

// Get update by ID (all authenticated users)
router.get('/:id', getUpdateById);

// Create update (Admin/Teacher only)
router.post('/', authMiddleware(['admin', 'teacher']), createUpdate);

// Update update (Admin/Teacher only)
router.put('/:id', authMiddleware(['admin', 'teacher']), updateUpdate);

// Delete update (Admin/Teacher only)
router.delete('/:id', authMiddleware(['admin', 'teacher']), deleteUpdate);

module.exports = router;

