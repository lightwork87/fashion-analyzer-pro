// app/api/test-ai/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 Testing AI APIs...');
  
  const results = {
    googleVision: { working: false, error: null },
    claude: { working: false, error: null }
  };
  
  // Test Google Vision API with a simple base64 image
  const testImageBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A/9k='; // 1x1 pixel JPEG
  
  try {
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      results.googleVision.error = 'API key missing';
    } else {
      console.log('🔍 Testing Google Vision API...');
      
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: testImageBase64 },
              features: [{ type: 'LABEL_DETECTION', maxResults: 1 }]
            }]
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        results.googleVision.working = true;
        console.log('✅ Google Vision API working');
      } else {
        const errorText = await response.text();
        results.googleVision.error = `HTTP ${response.status}: ${errorText}`;
        console.log('❌ Google Vision API failed:', results.googleVision.error);
      }
    }
  } catch (error) {
    results.googleVision.error = error.message;
    console.log('❌ Google Vision API error:', error.message);
  }
  
  // Test Claude API
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      results.claude.error = 'API key missing';
    } else {
      console.log('🤖 Testing Claude API...');
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Say "test"' }]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        results.claude.working = true;
        console.log('✅ Claude API working');
      } else {
        const errorText = await response.text();
        results.claude.error = `HTTP ${response.status}: ${errorText}`;
        console.log('❌ Claude API failed:', results.claude.error);
      }
    }
  } catch (error) {
    results.claude.error = error.message;
    console.log('❌ Claude API error:', error.message);
  }
  
  return NextResponse.json(results);
}