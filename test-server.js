// Server Test - save as test-server.js
// Run with: node test-server.js

async function testServer() {
  console.log('🧪 TESTING SERVER CONNECTION');
  console.log('============================');
  
  try {
    console.log('🔍 Testing if server is running...');
    
    const response = await fetch('http://localhost:3003/', {
      method: 'GET'
    });
    
    console.log('📡 Server response status:', response.status);
    console.log('📡 Server response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ Server is running and responding');
      
      // Now test the API endpoint
      console.log('\n🧪 Testing API endpoint...');
      
      const apiResponse = await fetch('http://localhost:3003/api/analyze-combined', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: ['test-image-data'],
          manualOverrides: {}
        }),
      });
      
      console.log('📡 API response status:', apiResponse.status);
      console.log('📡 API content-type:', apiResponse.headers.get('content-type'));
      
      if (apiResponse.ok) {
        try {
          const data = await apiResponse.json();
          console.log('✅ API responding with JSON:', data.success ? 'SUCCESS' : 'ERROR');
          console.log('📊 Response keys:', Object.keys(data));
        } catch (jsonError) {
          const text = await apiResponse.text();
          console.log('❌ API returned non-JSON:', text.substring(0, 200));
        }
      } else {
        const errorText = await apiResponse.text();
        console.log('❌ API error:', errorText);
      }
      
    } else {
      console.log('❌ Server not responding properly');
    }
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('💡 Make sure server is running: npm run dev -- -p 3003');
  }
}

testServer();