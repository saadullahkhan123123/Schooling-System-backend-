const User = require('../models/User');
const mongoose = require('mongoose');
const { isConnected, waitForConnection } = require('../config/db');

exports.studentDashboard = (req, res) => {
  res.json({ message: "Welcome Student" });
};

exports.adminDashboard = (req, res) => {
  res.json({ message: "Welcome Admin" });
};

// Get total student count
exports.getStudentCount = async (req, res) => {
  try {
    // Check if database is connected or connecting
    if (!isConnected()) {
      console.error('❌ Database not connected (state:', mongoose.connection.readyState, ')');
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'Database connection not available. Please check your MongoDB connection and try again later.'
      });
    }

    // Wait for connection if currently connecting
    if (mongoose.connection.readyState === 2) {
      try {
        await waitForConnection(5000);
      } catch (waitError) {
        console.error('❌ Failed to wait for connection:', waitError.message);
        return res.status(503).json({ 
          error: 'Database unavailable',
          message: 'Database connection timeout. Please try again later.'
        });
      }
    }

    // Ensure we're actually connected before querying
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database unavailable',
        message: 'Database is not ready. Please try again later.'
      });
    }

    const count = await User.countDocuments({ role: 'student' });
    res.json({ count });
  } catch (error) {
    console.error('❌ Get student count error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'MongoServerSelectionError' || 
        error.message.includes('buffering timed out') ||
        error.message.includes('connection timeout')) {
      return res.status(503).json({ 
        error: 'Database unavailable',
        message: 'Database connection timeout. Please check your MongoDB connection string and ensure MongoDB is accessible.'
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