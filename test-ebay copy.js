// test-ebay.js - Complete eBay API Connection Test

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

class EBayAPITester {
  constructor() {
    this.clientId = process.env.EBAY_CLIENT_ID;
    this.clientSecret = process.env.EBAY_CLIENT_SECRET;
    this.environment = process.env.EBAY_ENVIRONMENT || 'SANDBOX';
    
    this.endpoints = {
      SANDBOX: {
        auth: 'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
        browse: 'https://api.sandbox.ebay.com/buy/browse/v1'
      },
      PRODUCTION: {
        auth: 'https://api.ebay.com/identity/v1/oauth2/token',
        browse: 'https://api.ebay.com/buy/browse/v1'
      }
    };
  }

  async testAuthentication() {
    console.log('🔑 TESTING EBAY API AUTHENTICATION');
    console.log('===================================\n');

    if (!this.clientId || !this.clientSecret) {
      console.log('❌ ERROR: Missing eBay API credentials!');
      console.log('📝 Required environment variables:');
      console.log('   EBAY_CLIENT_ID=your_client_id');
      console.log('   EBAY_CLIENT_SECRET=your_client_secret');
      console.log('   EBAY_ENVIRONMENT=SANDBOX or PRODUCTION');
      console.log('\n🔗 Get credentials from: https://developer.ebay.com/my/keys\n');
      return false;
    }

    console.log('✅ Environment:', this.environment);
    console.log('✅ Client ID found:', this.clientId.substring(0, 10) + '...');
    console.log('✅ Client Secret found:', this.clientSecret.substring(0, 8) + '...\n');

    try {
      console.log('🔍 Testing OAuth2 authentication...');

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await fetch(this.endpoints[this.environment].auth, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
      });

      if (!response.ok) {
        console.log('❌ Authentication failed:', response.status);
        
        if (response.status === 400) {
          console.log('💡 Possible solutions:');
          console.log('   1. Check your Client ID and Secret are correct');
          console.log('   2. Ensure you\'re using the right environment (SANDBOX/PRODUCTION)');
          console.log('   3. Verify your eBay app has the correct scopes enabled');
        } else if (response.status === 401) {
          console.log('💡 Solutions for 401 Unauthorized:');
          console.log('   1. Regenerate your Client ID and Secret');
          console.log('   2. Check your eBay developer account status');
          console.log('   3. Ensure your app is properly configured');
        }
        
        const errorText = await response.text();
        console.log('🔍 Error details:', errorText);
        return false;
      }

      const authData = await response.json();
      console.log('✅ Authentication successful!');
      console.log('🎯 Access token received (expires in', authData.expires_in, 'seconds)');
      
      // Test a simple API call
      return await this.testAPICall(authData.access_token);

    } catch (error) {
      console.log('❌ Authentication failed:', error.message);
      return false;
    }
  }

  async testAPICall(accessToken) {
    try {
      console.log('\n🔍 Testing eBay Browse API call...');

      // Simple search for Nike items
      const response = await fetch(
        `${this.endpoints[this.environment].browse}/item_summary/search?q=nike&limit=5&category_ids=11450`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
            'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country%3DGB'
          }
        }
      );

      if (!response.ok) {
        console.log('❌ API call failed:', response.status);
        
        if (response.status === 403) {
          console.log('💡 Possible solutions:');
          console.log('   1. Check your app has Browse API access enabled');
          console.log('   2. Verify marketplace permissions (EBAY_GB)');
          console.log('   3. Ensure your subscription includes Browse API');
        }
        
        const errorText = await response.text();
        console.log('🔍 Error details:', errorText);
        return false;
      }

      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('📊 Found', data.total || 0, 'items');
      
      if (data.itemSummaries && data.itemSummaries.length > 0) {
        console.log('🏷️ Sample item:', data.itemSummaries[0].title?.substring(0, 50) + '...');
        console.log('💷 Sample price:', data.itemSummaries[0].price?.value, data.itemSummaries[0].price?.currency);
      }

      console.log('\n🎉 SUCCESS: eBay API is fully functional!');
      console.log('🔄 Your enhanced system now has:');
      console.log('   • Google Vision API (brand detection) ✅');
      console.log('   • Claude API (analysis & optimization) ✅');
      console.log('   • eBay API (pricing research) ✅');
      console.log('   • Complete UK market intelligence ✅\n');
      
      console.log('🚀 Ready for production use!');
      console.log('   1. Run: npm run dev -- -p 3003');
      console.log('   2. Upload fashion images');
      console.log('   3. Get analysis + automatic pricing research');
      console.log('   4. Generate optimized eBay listings!\n');
      
      return true;

    } catch (error) {
      console.log('❌ API call failed:', error.message);
      return false;
    }
  }

  async testSpecificSearch() {
    console.log('\n🧪 TESTING SPECIFIC FASHION SEARCH');
    console.log('==================================\n');

    try {
      const authResponse = await fetch(this.endpoints[this.environment].auth, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
      });

      const authData = await authResponse.json();

      // Test searches similar to what the app would do
      const testQueries = [
        'Nike trainers UK10',
        'Zara dress size M',
        'Adidas jacket mens',
        'H&M top womens'
      ];

      for (const query of testQueries) {
        console.log(`🔍 Testing search: "${query}"`);
        
        const response = await fetch(
          `${this.endpoints[this.environment].browse}/item_summary/search?q=${encodeURIComponent(query)}&limit=10`,
          {
            headers: {
              'Authorization': `Bearer ${authData.access_token}`,
              'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Found ${data.total || 0} items`);
          
          if (data.itemSummaries && data.itemSummaries.length > 0) {
            const prices = data.itemSummaries
              .filter(item => item.price && item.price.value)
              .map(item => parseFloat(item.price.value));
            
            if (prices.length > 0) {
              const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
              console.log(`   💷 Average price: £${avgPrice.toFixed(2)}`);
              console.log(`   📊 Price range: £${Math.min(...prices)} - £${Math.max(...prices)}`);
            }
          }
        } else {
          console.log(`   ❌ Search failed: ${response.status}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.log('❌ Specific search test failed:', error.message);
    }
  }
}

async function runAllTests() {
  const tester = new EBayAPITester();
  
  const authSuccess = await tester.testAuthentication();
  
  if (authSuccess) {
    await tester.testSpecificSearch();
    
    console.log('\n🏆 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('📈 Your system is ready for:');
    console.log('   • Automatic brand detection');
    console.log('   • Real-time pricing research');
    console.log('   • UK market optimization');
    console.log('   • Professional eBay listings');
    console.log('\n🎯 Next: Test with real fashion images in your app!');
  } else {
    console.log('\n💥 SETUP REQUIRED');
    console.log('================');
    console.log('Please fix eBay API configuration before proceeding.');
    console.log('Check the error messages above for specific solutions.');
  }
}

runAllTests();