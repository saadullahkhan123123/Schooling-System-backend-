const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getAllFees,
  getFeeByStudent,
  createOrUpdateFee,
  recordPayment,
  getTotalFees
} = require('../controllers/feeController');

// All routes require authentication
router.use(authMiddleware());

// Get all fees (Admin only)
router.get('/', authMiddleware(['admin']), getAllFees);

// Get total fees collected (Admin only)
router.get('/total', authMiddleware(['admin']), getTotalFees);

// Get fee by student ID
router.get('/student/:studentId', getFeeByStudent);

// Create or update fee (Admin only)
router.post('/', authMiddleware(['admin']), createOrUpdateFee);

// Record payment (Admin only)
router.post('/:feeId/payment', authMiddleware(['admin']), recordPayment);

module.exports = router;

