// Simple API Test - save as test-api-simple.js
// Run with: node test-api-simple.js

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('🧪 TESTING API SETUP');
console.log('===================');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ Found' : '❌ Missing');
console.log('GOOGLE_CLOUD_VISION_API_KEY:', process.env.GOOGLE_CLOUD_VISION_API_KEY ? '✅ Found' : '❌ Missing');
console.log('EBAY_CLIENT_ID:', process.env.EBAY_CLIENT_ID ? '✅ Found' : '❌ Missing');
console.log('EBAY_CLIENT_SECRET:', process.env.EBAY_CLIENT_SECRET ? '✅ Found' : '❌ Missing');

// Test with a simple base64 image (1x1 pixel PNG)
const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function testAPI() {
  console.log('\n🧪 Testing analyze-combined API...');
  
  try {
    const response = await fetch('http://localhost:3003/api/analyze-combined', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: [testImage],
        manualOverrides: {}
      }),
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response Success:', data.success);
      
      if (data.success) {
        console.log('✅ Results count:', data.results?.length || 0);
        console.log('✅ System version:', data.metadata?.version);
      } else {
        console.log('❌ API returned error:', data.error);
        console.log('❌ Error details:', data.details);
        console.log('❌ Debug info:', data.debug_info);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ HTTP Error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('💡 Make sure your server is running: npm run dev -- -p 3003');
  }
}

// Only run test if all required env vars are present
if (process.env.ANTHROPIC_API_KEY && process.env.GOOGLE_CLOUD_VISION_API_KEY) {
  console.log('\n🚀 All required environment variables found. Testing API...');
  testAPI();
} else {
  console.log('\n❌ Missing required environment variables. Please check your .env.local file.');
}