// Initialize default admin user
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { connectDB } = require('../config/db');
const { MONGO_URI } = require('../config/env');

const ADMIN_CREDENTIALS = {
  username: 'wasiahmed',
  email: 'muhammadsaadullah093@gmail.com',
  password: 'wasi.123.saad',
  role: 'admin'
};

async function initAdmin() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    console.log('🔍 Checking for existing admin...');
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin already exists:', existingAdmin.username);
      console.log('📝 If you want to reset the admin password, delete the existing admin first.');
      process.exit(0);
    }
    
    console.log('👤 Creating default admin user...');
    const admin = new User(ADMIN_CREDENTIALS);
    await admin.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('📝 Credentials:');
    console.log('   Username:', ADMIN_CREDENTIALS.username);
    console.log('   Email:', ADMIN_CREDENTIALS.email);
    console.log('   Password:', ADMIN_CREDENTIALS.password);
    console.log('   Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Username or email already exists');
    }
    process.exit(1);
  }
}

initAdmin();

