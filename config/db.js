// config/db.js
const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

// Log MONGO_URI (without credentials) for debugging
const logMongoURI = () => {
  if (!MONGO_URI) {
    console.warn('⚠️  MONGO_URI is not set!');
    return;
  }
  // Hide credentials but show connection type
  const uriParts = MONGO_URI.split('@');
  if (uriParts.length > 1) {
    const hostPart = uriParts[1];
    console.log('📝 MongoDB URI:', `mongodb://***@${hostPart}`);
  } else {
    console.log('📝 MongoDB URI:', MONGO_URI.replace(/\/\/.*@/, '//***@'));
  }
};

const connectDB = async (retries = 3) => {
  // Log connection attempt
  console.log('🔄 Attempting to connect to MongoDB...');
  logMongoURI();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Set connection options to handle timeouts better
      const options = {
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        connectTimeoutMS: 10000, // 10 seconds to establish connection
        maxPoolSize: 10, // Maintain up to 10 socket connections
        minPoolSize: 2, // Maintain at least 2 socket connections
        bufferCommands: false, // Disable mongoose buffering
        bufferMaxEntries: 0, // Disable mongoose buffering
      };

      // If already connected, return true
      if (mongoose.connection.readyState === 1) {
        console.log('✅ MongoDB already connected');
        return true;
      }

      // Connect to MongoDB
      await mongoose.connect(MONGO_URI, options);
      console.log('✅ MongoDB Connected Successfully!');
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected - attempting to reconnect...');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (mongoose.connection.readyState === 0) {
            connectDB(1).catch(err => {
              console.error('❌ Reconnection failed:', err.message);
            });
          }
        }, 5000);
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });

      return true;
    } catch (err) {
      console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, err.message);
      
      if (attempt < retries) {
        const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
        console.log(`⏳ Retrying in ${waitTime/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error('❌ All database connection attempts failed');
        console.warn('⚠️  Server will continue without database connection');
        console.warn('📝 Make sure MongoDB is running or update MONGO_URI in .env file');
        console.warn('📝 For production (Vercel), ensure MONGO_URI is set in environment variables');
        console.warn('📝 Use MongoDB Atlas (cloud) for production, not localhost');
        
        // Log helpful error details
        if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
          console.error('💡 Error: Cannot resolve MongoDB hostname. Check your MONGO_URI.');
        } else if (err.message.includes('authentication failed')) {
          console.error('💡 Error: Authentication failed. Check your MongoDB username and password.');
        } else if (err.message.includes('timeout')) {
          console.error('💡 Error: Connection timeout. Check your network and MongoDB server status.');
        }
        
        return false;
      }
    }
  }
  
  return false;
};

// Helper function to check if DB is connected or connecting
const isConnected = () => {
  const state = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  // Allow both connected (1) and connecting (2) states
  return state === 1 || state === 2;
};

// Helper to ensure connection - attempts reconnect if needed
const ensureConnection = async () => {
  const state = mongoose.connection.readyState;
  
  // Already connected
  if (state === 1) {
    return true;
  }
  
  // Currently connecting, wait for it
  if (state === 2) {
    try {
      await waitForConnection(10000);
      return true;
    } catch (err) {
      console.error('❌ Failed to wait for connection:', err.message);
      return false;
    }
  }
  
  // Disconnected - attempt to reconnect
  if (state === 0) {
    console.log('🔄 Database disconnected, attempting to reconnect...');
    try {
      const connected = await connectDB(1); // Single retry
      return connected;
    } catch (err) {
      console.error('❌ Reconnection attempt failed:', err.message);
      return false;
    }
  }
  
  return false;
};

// Helper to wait for connection if connecting
const waitForConnection = async (timeout = 5000) => {
  if (mongoose.connection.readyState === 1) {
    return true; // Already connected
  }
  
  if (mongoose.connection.readyState === 2) {
    // Currently connecting, wait for it
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeout);

      mongoose.connection.once('connected', () => {
        clearTimeout(timer);
        resolve(true);
      });

      mongoose.connection.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
  
  return false; // Not connected and not connecting
};

module.exports = { connectDB, isConnected, waitForConnection, ensureConnection }; 