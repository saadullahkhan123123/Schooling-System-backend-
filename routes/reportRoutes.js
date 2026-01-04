const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createOrUpdateReport,
  getAllReports,
  getReportById,
  deleteReport
} = require('../controllers/reportController');

// All routes require authentication
router.use(authMiddleware());

// Get all reports (filtered by role)
router.get('/', getAllReports);

// Get report by ID
router.get('/:id', getReportById);

// Create or update monthly report (Teacher/Admin only)
router.post('/', authMiddleware(['admin', 'teacher']), createOrUpdateReport);

// Delete report (Admin only)
router.delete('/:id', authMiddleware(['admin']), deleteReport);

module.exports = router;

