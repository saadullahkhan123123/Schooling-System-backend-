// config/db.js
const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const connectDB = async () => {
  try {
    // Set connection options to handle timeouts better
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
    };

    await mongoose.connect(MONGO_URI, options);
    console.log('✅ MongoDB Connected...');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.warn('⚠️  Server will continue without database connection');
    console.warn('📝 Make sure MongoDB is running or update MONGO_URI in .env file');
    console.warn('📝 For production, ensure MONGO_URI is set in Vercel environment variables');
    return false;
  }
};

// Helper function to check if DB is connected
const isConnected = () => {
  return mongoose.connection.readyState === 1; // 1 = connected
};

module.exports = { connectDB, isConnected }; 