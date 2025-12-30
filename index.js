const express = require('express');
const cors = require('cors');
const { connectDB, isConnected } = require('./config/db');
const { PORT } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const feeRoutes = require('./routes/feeRoutes');
require('dotenv').config({ silent: true });

const app = express();

/* ✅ Correct CORS Configuration */
/* ✅ Complete CORS Configuration */
const allowedOrigins = [
  // Development origins
  'http://localhost:5173',      // Vite default
  'http://127.0.0.1:5173',      // Vite alternative
  'http://localhost:3000',      // Backend itself
  'http://127.0.0.1:3000',      // Backend alternative
  'http://localhost:3001',      // Create React App
  'http://127.0.0.1:3001',      // CRA alternative
  'http://localhost:5174',      // Vite alternate port
  'http://127.0.0.1:5174',      // Vite alternate
  'http://localhost:4173',      // Vite preview
  'http://127.0.0.1:4173',      // Vite preview alternative
  // Production origins
  'https://schooling-rosy.vercel.app',
  'https://schooling-system-backend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Log all incoming origins for debugging
    console.log('🌐 Incoming request from origin:', origin);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Allowed by CORS:', origin);
      return callback(null, true);
    }
    
    // Allow all Vercel subdomains (for production)
    if (origin && (origin.includes('vercel.app') || origin.includes('vercel.com'))) {
      console.log('✅ Allowed Vercel origin:', origin);
      return callback(null, true);
    }
    
    // Block if not allowed
    console.log('❌ Blocked by CORS:', origin);
    console.log('📋 Allowed origins:', allowedOrigins);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));


/* ✅ Body Parsers */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ✅ Serve uploaded files */
app.use('/uploads', express.static('uploads'));

/* ✅ Health check */
app.get('/health', (req, res) => {
  const dbStatus = isConnected() ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

/* ✅ Root route */
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Server is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      attendance: '/api/attendance',
      protected: '/api',
      health: '/health'
    },
    documentation: 'Add /api-docs for Swagger documentation'
  });
});

/* ✅ Routes */
app.use('/auth', authRoutes);
app.use('/auth', passwordRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api', protectedRoutes);

/* ✅ 404 Handler */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestedUrl: req.originalUrl,
    availableEndpoints: {
      auth: ['POST /auth/register', 'POST /auth/login', 'POST /auth/forgot-password'],
      attendance: ['POST /api/attendance/mark', 'GET /api/attendance/student/:id'],
      protected: ['GET /api/student', 'GET /api/admin']
    }
  });
});

/* ✅ Error Handling */
app.use((err, req, res, next) => {
  console.error('❌ Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // CORS error handling
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Request not allowed from this origin',
      allowedOrigins
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate Entry',
      message: 'This record already exists',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'Please provide a valid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: 'Please login again'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

/* ✅ Start Server */
connectDB()
  .then((dbConnected) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 Server Started Successfully!');
      console.log('='.repeat(50));
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📧 Auth API: http://localhost:${PORT}/auth`);
      console.log(`📊 Attendance API: http://localhost:${PORT}/api/attendance`);
      console.log(`🛡️ Protected API: http://localhost:${PORT}/api`);
      console.log(`❤️ Health Check: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));

      if (!dbConnected) {
        console.warn('⚠️  Database not connected - running in limited mode');
      } else {
        console.log('✅ Database connected successfully');
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server gracefully...');
      server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.log('💡 Solutions:');
        console.log('   1. Kill process: npx kill-port 3000');
        console.log('   2. Use different port: set PORT=3001');
        console.log('   3. Find process: netstat -ano | findstr :3000');
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('\n❌ Failed to start server:');
    console.error('Error:', err.message);
    console.log('💡 Check:');
    console.log('   - MongoDB connection string');
    console.log('   - Environment variables');
    console.log('   - Database server status');
    process.exit(1);
  });

module.exports = app; // For testing
