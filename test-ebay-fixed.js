// Fixed eBay API Test - save as test-ebay-fixed.js
// Run with: node test-ebay-fixed.js

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('🔍 CHECKING YOUR FIXED EBAY API SETUP');
console.log('====================================');

// Check what's in your .env.local file
console.log('\n📋 Your current eBay settings:');
console.log('CLIENT_ID:', process.env.EBAY_CLIENT_ID);
console.log('CLIENT_SECRET:', process.env.EBAY_CLIENT_SECRET ? 'Found (hidden for security)' : 'Missing');
console.log('ENVIRONMENT:', process.env.EBAY_ENVIRONMENT);

// Test the actual API call
if (process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET) {
  console.log('\n✅ Found eBay credentials, testing authentication...');
  testEBayAPI();
} else {
  console.log('\n❌ Still missing EBAY_CLIENT_ID or EBAY_CLIENT_SECRET');
  console.log('Make sure you updated the variable names in .env.local');
}

async function testEBayAPI() {
  try {
    const credentials = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64');
    
    const authUrl = process.env.EBAY_ENVIRONMENT === 'PRODUCTION' 
      ? 'https://api.ebay.com/identity/v1/oauth2/token'
      : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
    
    console.log(`\n🔑 Testing authentication with ${process.env.EBAY_ENVIRONMENT || 'SANDBOX'} environment...`);
    console.log(`URL: ${authUrl}`);
    
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ SUCCESS! Your eBay API credentials work!');
      const data = await response.json();
      console.log('Access token received:', data.access_token.substring(0, 30) + '...');
      console.log('Token expires in:', data.expires_in, 'seconds');
      
      // Test a simple search
      await testSearch(data.access_token);
      
    } else {
      console.log('❌ AUTHENTICATION FAILED');
      const errorText = await response.text();
      console.log('Error details:', errorText);
      
      if (response.status === 401) {
        console.log('\n💡 Possible causes:');
        console.log('1. Your CLIENT_ID or CLIENT_SECRET is wrong');
        console.log('2. Wrong environment (should match your eBay app setup)');
        console.log('3. Your eBay app needs proper permissions');
        console.log('4. Both DEV_ID and CERT_ID are the same (they should be different)');
      }
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

async function testSearch(accessToken) {
  console.log('\n🔍 Testing search API call...');
  
  try {
    const baseUrl = process.env.EBAY_ENVIRONMENT === 'PRODUCTION' 
      ? 'https://api.ebay.com'
      : 'https://api.sandbox.ebay.com';
      
    const searchUrl = `${baseUrl}/buy/browse/v1/item_summary/search`;
    const params = new URLSearchParams({
      q: 'nike trainers',
      limit: '3',
      filter: 'itemLocationCountry:GB'
    });
    
    const response = await fetch(`${searchUrl}?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country=GB,zip=SW1A1AA'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Search API works!');
      console.log(`Found ${data.total || 0} total items`);
      console.log(`Returned ${data.itemSummaries?.length || 0} items in response`);
      
      if (data.itemSummaries && data.itemSummaries.length > 0) {
        const item = data.itemSummaries[0];
        console.log(`Sample: ${item.title?.substring(0, 50)}...`);
        console.log(`Price: ${item.price?.value} ${item.price?.currency}`);
      }
      
      console.log('\n🎉 EVERYTHING WORKS! Your eBay API is ready to use!');
      
    } else {
      console.log('❌ Search API failed');
      const errorText = await response.text();
      console.log('Search error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Search test error:', error.message);
  }
}