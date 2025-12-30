const User = require('../models/User');
const mongoose = require('mongoose');
const { isConnected, waitForConnection, ensureConnection } = require('../config/db');

exports.studentDashboard = (req, res) => {
  res.json({ message: "Welcome Student" });
};

exports.adminDashboard = (req, res) => {
  res.json({ message: "Welcome Admin" });
};

// Get total student count
exports.getStudentCount = async (req, res) => {
  try {
    // Attempt to ensure connection (will reconnect if needed)
    const connected = await ensureConnection();
    
    if (!connected) {
      const { MONGO_URI } = require('../config/env');
      const hasMongoURI = !!MONGO_URI;
      const mongoURIType = MONGO_URI ? (MONGO_URI.includes('mongodb+srv://') ? 'Atlas' : MONGO_URI.includes('localhost') ? 'Local' : 'Custom') : 'Not Set';
      
      console.error('❌ Database connection failed (state:', mongoose.connection.readyState, ')');
      console.error('📝 MONGO_URI configured:', hasMongoURI, 'Type:', mongoURIType);
      
      return res.status(503).json({ 
        error: 'Database unavailable',
        message: hasMongoURI 
          ? 'Database connection not available. Please check your MongoDB connection string and ensure MongoDB is accessible. For production, use MongoDB Atlas (cloud).'
          : 'MONGO_URI environment variable is not set. Please configure MongoDB connection in your environment variables.',
        diagnostic: {
          uriConfigured: hasMongoURI,
          uriType: mongoURIType,
          connectionState: mongoose.connection.readyState
        }
      });
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
        message: 'Database connection timeout. Please check your MongoDB connection string and ensure MongoDB is accessible. For production, use MongoDB Atlas (cloud).'
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