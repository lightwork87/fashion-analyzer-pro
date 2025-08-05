// Simple eBay API Test - save as test-ebay-simple.js
// Run with: node test-ebay-simple.js

const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

console.log('🔍 CHECKING YOUR EBAY API SETUP');
console.log('===============================');

// Check what's in your .env.local file
console.log('\n📋 Your current eBay settings:');
console.log('CLIENT_ID:', process.env.EBAY_CLIENT_ID);
console.log('CLIENT_SECRET:', process.env.EBAY_CLIENT_SECRET ? 'Found (hidden for security)' : 'Missing');
console.log('ENVIRONMENT:', process.env.EBAY_ENVIRONMENT);

// Check if they're still placeholder values
if (process.env.EBAY_CLIENT_ID === 'your_ebay_client_id_here') {
  console.log('\n❌ PROBLEM FOUND!');
  console.log('Your CLIENT_ID is still the placeholder value from the handoff document.');
  console.log('');
  console.log('🚀 TO FIX THIS:');
  console.log('1. Go to: https://developer.ebay.com/');
  console.log('2. Click "Register" to create a developer account');
  console.log('3. Once logged in, go to "Application Keys"');
  console.log('4. Create a new "Keyset" for your app');
  console.log('5. Copy the "App ID" and "Cert ID"');
  console.log('6. Update your .env.local file with real values');
  console.log('');
  console.log('Example of what to change in .env.local:');
  console.log('From: EBAY_CLIENT_ID=your_ebay_client_id_here');
  console.log('To:   EBAY_CLIENT_ID=YourRealAppId');
  
} else if (process.env.EBAY_CLIENT_SECRET === 'your_ebay_client_secret_here') {
  console.log('\n❌ PROBLEM FOUND!');
  console.log('Your CLIENT_SECRET is still the placeholder value.');
  console.log('You need to replace it with the real "Cert ID" from eBay developer portal.');
  
} else if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET) {
  console.log('\n❌ PROBLEM FOUND!');
  console.log('eBay credentials are missing from your .env.local file');
  
} else {
  console.log('\n✅ Your credentials look like real values (not placeholders)');
  console.log('The 401 error might be due to:');
  console.log('1. Wrong environment (SANDBOX vs PRODUCTION)');
  console.log('2. App permissions not set correctly');
  console.log('3. Invalid credentials');
  console.log('');
  console.log('Try running the full system again to see if it works now.');
}

console.log('\n🎯 NEXT STEPS:');
console.log('1. Fix any issues found above');
console.log('2. Test your system: npm run dev -- -p 3003');
console.log('3. Upload images and check if eBay pricing works');