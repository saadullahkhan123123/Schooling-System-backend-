// Helper script to generate correct MongoDB URI with URL-encoded password
console.log('\n🔧 MongoDB URI Fix Helper\n');

const username = 'wasi';
const password = 'saadullah123!';  // Your password with special characters
const cluster = 'cluster0.60u4pme.mongodb.net';
const database = 'schooling_system';  // Change this to your database name

// Manual encoding for MongoDB connection strings
// Special characters that need encoding: ! @ # $ % & * + / = ? 
const encodedPassword = password
  .replace(/!/g, '%21')
  .replace(/@/g, '%40')
  .replace(/#/g, '%23')
  .replace(/\$/g, '%24')
  .replace(/%/g, '%25')
  .replace(/&/g, '%26')
  .replace(/\*/g, '%2A')
  .replace(/\+/g, '%2B')
  .replace(/\//g, '%2F')
  .replace(/=/g, '%3D')
  .replace(/\?/g, '%3F');

// Build the correct URI
const correctURI = `mongodb+srv://${username}:${encodedPassword}@${cluster}/${database}`;

console.log('✅ Corrected MONGO_URI:\n');
console.log(`MONGO_URI=${correctURI}\n`);
console.log('📝 Copy this line to your .env file (replace the existing MONGO_URI line)\n');
console.log('📝 Password encoding:\n');
console.log(`   Original: ${password}`);
console.log(`   Encoded:  ${encodedPassword} (! → %21)\n`);
console.log('⚠️  Important: The password is now URL-encoded to handle special characters\n');

