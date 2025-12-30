const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { 
  studentDashboard, 
  adminDashboard, 
  getStudentCount, 
  getFeeTotal 
} = require('../controllers/protectedController');

router.get('/student', authMiddleware(['student', 'admin']), studentDashboard);
router.get('/admin', authMiddleware(['admin']), adminDashboard);

// Stats endpoints
router.get('/students/count', authMiddleware(['admin']), getStudentCount);
router.get('/fees/total', authMiddleware(['admin']), getFeeTotal);

module.exports = router;