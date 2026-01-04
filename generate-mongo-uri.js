// Generate correct MongoDB URI with new password
console.log('\n🔧 MongoDB URI Generator\n');

const username = 'wasi';
const password = 'saadullah123!@21';  // New password
const cluster = 'cluster0.60u4pme.mongodb.net';
const database = 'schooling_system';  // Change if your database name is different

// Manual URL encoding for MongoDB connection strings
// MongoDB is strict about special characters in passwords
const encodedPassword = password
  .replace(/%/g, '%25')  // Must encode % first
  .replace(/!/g, '%21')
  .replace(/@/g, '%40')
  .replace(/#/g, '%23')
  .replace(/\$/g, '%24')
  .replace(/&/g, '%26')
  .replace(/\*/g, '%2A')
  .replace(/\+/g, '%2B')
  .replace(/\//g, '%2F')
  .replace(/=/g, '%3D')
  .replace(/\?/g, '%3F');

// Build the correct URI
const correctURI = `mongodb+srv://${username}:${encodedPassword}@${cluster}/${database}`;

console.log('✅ Corrected MONGO_URI for your .env file:\n');
console.log('─'.repeat(60));
console.log(`MONGO_URI=${correctURI}`);
console.log('─'.repeat(60));
console.log('\n📝 Password encoding details:\n');
console.log(`   Original: ${password}`);
console.log(`   Encoded:  ${encodedPassword}`);
console.log(`   Changes:  ! → %21, @ → %40\n`);
console.log('⚠️  Copy the MONGO_URI line above to your .env file\n');
console.log('📁 File location: wasi schooling backend/Schooling-System-back-end/.env\n');
console.log('🔄 After updating, restart your server\n');

