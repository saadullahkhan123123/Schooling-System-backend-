// Quick test script to verify MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');
const { MONGO_URI } = require('./config/env');

console.log('\n🔍 Testing MongoDB Connection...\n');

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set in environment variables!');
  process.exit(1);
}

// Log URI info (without credentials)
const uriParts = MONGO_URI.split('@');
if (uriParts.length > 1) {
  const hostPart = uriParts[1].split('?')[0];
  console.log('📝 Connection Type:', MONGO_URI.includes('mongodb+srv://') ? 'MongoDB Atlas (Cloud)' : 'MongoDB (Local)');
  console.log('📝 Host:', hostPart.split('/')[0]);
  console.log('📝 Database:', hostPart.split('/')[1] || 'default');
}

console.log('\n🔄 Attempting to connect...\n');

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!\n');
    console.log('✅ Connection verified!\n');
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection Failed!\n');
    console.error('Error:', err.message);
    
    if (err.message.includes('ENOTFOUND')) {
      console.error('\n💡 Tip: Check if the hostname is correct');
    } else if (err.message.includes('authentication failed')) {
      console.error('\n💡 Tip: Check your username and password');
    } else if (err.message.includes('timeout')) {
      console.error('\n💡 Tip: Check your network connection and MongoDB Atlas IP whitelist');
    }
    
    process.exit(1);
  });

