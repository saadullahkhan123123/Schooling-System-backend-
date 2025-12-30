const User = require('../models/User');
const mongoose = require('mongoose');
const { isConnected } = require('../config/db');

exports.studentDashboard = (req, res) => {
  res.json({ message: "Welcome Student" });
};

exports.adminDashboard = (req, res) => {
  res.json({ message: "Welcome Admin" });
};

// Get total student count
exports.getStudentCount = async (req, res) => {
  try {
    // Check if database is connected
    if (!isConnected()) {
      console.error('❌ Database not connected');
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'Database connection not available. Please try again later.'
      });
    }

    // Wait for connection if not ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Database connection timeout'));
        }, 5000);

        mongoose.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });

        mongoose.connection.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }

    const count = await User.countDocuments({ role: 'student' });
    res.json({ count });
  } catch (error) {
    console.error('❌ Get student count error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'MongoServerSelectionError' || error.message.includes('buffering timed out')) {
      return res.status(503).json({ 
        error: 'Database unavailable',
        message: 'Database connection timeout. Please check your MongoDB connection.'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch student count'
    });
  }
};

// Get fee total (delegates to fee controller)
exports.getFeeTotal = async (req, res) => {
  try {
    const Fee = require('../models/Fee');
    const total = await Fee.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$paidFees' }
        }
      }
    ]);

    res.json({ total: total[0]?.total || 0 });
  } catch (error) {
    console.error('❌ Get fee total error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch fee total'
    });
  }
};