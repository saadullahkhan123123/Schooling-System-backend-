const User = require('../models/User');
const mongoose = require('mongoose');
const { generateToken } = require('../services/authService');
const { isConnected, waitForConnection, ensureConnection } = require('../config/db');

exports.register = async (req, res) => {
  try {
    console.log('📝 Register request received:', req.body);
    const { username, password, email, role, class: className } = req.body;
    
    // Input validation
    if (!username || !password || !email) {
      return res.status(400).json({ 
        error: 'Username, password, and email are required',
        message: 'Username, password, and email are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long',
        message: 'Password must be at least 6 characters long'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address',
        message: 'Please provide a valid email address'
      });
    }

    // Validate role
    const validRoles = ['admin', 'teacher', 'student'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        message: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    // Attempt to ensure connection (will reconnect if needed)
    const connected = await ensureConnection();
    
    if (!connected) {
      const { MONGO_URI } = require('../config/env');
      const hasMongoURI = !!MONGO_URI;
      const mongoURIType = MONGO_URI ? (MONGO_URI.includes('mongodb+srv://') ? 'Atlas' : MONGO_URI.includes('localhost') ? 'Local' : 'Custom') : 'Not Set';
      
      console.error('❌ Database connection failed during registration (state:', mongoose.connection.readyState, ')');
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

    // Prevent multiple admin registration - only one admin allowed
    if (role === 'admin') {
      try {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount >= 1) {
          return res.status(403).json({
            error: 'Admin registration not allowed',
            message: 'Only one admin is allowed in the system. Admin registration is disabled.'
          });
        }
      } catch (dbError) {
        console.error('❌ Error checking admin count:', dbError);
        if (dbError.name === 'MongoServerSelectionError' || dbError.message.includes('buffering timed out')) {
          return res.status(503).json({ 
            error: 'Database unavailable',
            message: 'Database connection timeout. Please check your MongoDB connection.'
          });
        }
        throw dbError;
      }
    }

    // Validate class field for students
    if (role === 'student') {
      if (!className) {
        return res.status(400).json({
          error: 'Class is required',
          message: 'Class is required for student registration'
        });
      }
    }

    console.log('👤 Creating user...');
    const userData = { 
      username, 
      password, 
      email, 
      role: role || 'student' 
    };
    
    // Add class for students
    if (role === 'student' && className) {
      userData.class = className;
    }
    
    const user = new User(userData);
    console.log('💾 Saving user to database...');
    await user.save();
    console.log('✅ User saved successfully');
    
    res.status(201).json({ 
      message: "User registered successfully",
      user: user.getProfile()
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        error: `${field} already exists`,
        message: `This ${field} is already registered. Please use a different ${field}.`
      });
    }
    res.status(400).json({ 
      error: err.message,
      message: err.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    console.log('🔐 Login request received:', req.body);
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required',
        message: 'Username and password are required'
      });
    }

    // Attempt to ensure connection (will reconnect if needed)
    const connected = await ensureConnection();
    
    if (!connected) {
      const { MONGO_URI } = require('../config/env');
      const hasMongoURI = !!MONGO_URI;
      const mongoURIType = MONGO_URI ? (MONGO_URI.includes('mongodb+srv://') ? 'Atlas' : MONGO_URI.includes('localhost') ? 'Local' : 'Custom') : 'Not Set';
      
      console.error('❌ Database connection failed during login (state:', mongoose.connection.readyState, ')');
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

    console.log('👤 Finding user...');
    let user;
    try {
      user = await User.findOne({ username });
    } catch (dbError) {
      console.error('❌ Database error during login:', dbError);
      if (dbError.name === 'MongoServerSelectionError' || dbError.message.includes('buffering timed out')) {
        return res.status(503).json({ 
          error: 'Database unavailable',
          message: 'Database connection timeout. Please check your MongoDB connection.'
        });
      }
      throw dbError;
    }
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ 
        error: "Invalid credentials",
        message: "Invalid username or password"
      });
    }

    console.log('🔑 Comparing password...');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ 
        error: "Invalid credentials",
        message: "Invalid username or password"
      });
    }

    console.log('✅ Password matched, generating token...');
    const token = generateToken(user);
    console.log('✅ Login successful');
    
    res.json({ 
      message: "Login successful",
      token,
      user: user.getProfile()
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred during login. Please try again.'
    });
  }
};