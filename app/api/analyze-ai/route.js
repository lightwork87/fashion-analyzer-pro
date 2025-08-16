// app/api/analyze-ai/route.js
// DEBUG VERSION - FIND WHERE AI IS FAILING

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Test image fetch
async function testImageFetch(imageUrl) {
  const debugInfo = {
    url: imageUrl,
    fetchSuccess: false,
    error: null,
    contentType: null,
    size: 0
  };
  
  try {
    console.log('🔗 Testing image URL:', imageUrl);
    
    const response = await fetch(imageUrl);
    debugInfo.status = response.status;
    debugInfo.statusText = response.statusText;
    
    if (!response.ok) {
      debugInfo.error = `HTTP ${response.status}: ${response.statusText}`;
      return debugInfo;
    }
    
    const buffer = await response.arrayBuffer();
    debugInfo.size = buffer.byteLength;
    debugInfo.contentType = response.headers.get('content-type');
    debugInfo.fetchSuccess = true;
    
    const base64 = Buffer.from(buffer).toString('base64');
    debugInfo.base64Length = base64.length;
    
    console.log('✅ Image fetch successful:', debugInfo);
    return { ...debugInfo, base64 };
    
  } catch (error) {
    debugInfo.error = error.message;
    console.error('❌ Image fetch failed:', debugInfo);
    return debugInfo;
  }
}

// Test Google Vision
async function testGoogleVision(imageBase64) {
  const debugInfo = {
    apiCalled: false,
    responseStatus: null,
    error: null,
    detections: {}
  };
  
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    debugInfo.error = 'No API key';
    return debugInfo;
  }
  
  try {
    console.log('🔍 Testing Google Vision...');
    debugInfo.apiCalled = true;
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 5 },
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'LOGO_DETECTION', maxResults: 5 }
            ]
          }]
        })
      }
    );
    
    debugInfo.responseStatus = response.status;
    const responseText = await response.text();
    
    if (!response.ok) {
      debugInfo.error = responseText;
      console.error('❌ Vision API error:', responseText);
      return debugInfo;
    }
    
    const data = JSON.parse(responseText);
    const result = data.responses?.[0];
    
    if (result) {
      debugInfo.detections = {
        textFound: result.textAnnotations?.length > 0,
        firstText: result.textAnnotations?.[0]?.description?.substring(0, 50) || 'None',
        labelsCount: result.labelAnnotations?.length || 0,
        labels: result.labelAnnotations?.slice(0, 3).map(l => l.description) || [],
        logos: result.logoAnnotations?.map(l => l.description) || []
      };
      
      console.log('✅ Vision API success:', debugInfo.detections);
      return { ...debugInfo, visionData: result };
    }
    
    debugInfo.error = 'No response data';
    return debugInfo;
    
  } catch (error) {
    debugInfo.error = error.message;
    console.error('❌ Vision API exception:', error);
    return debugInfo;
  }
}

// Simple Claude test
async function testClaude(visionData) {
  const debugInfo = {
    apiCalled: false,
    responseStatus: null,
    error: null,
    generatedTitle: null
  };
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    debugInfo.error = 'No API key';
    return debugInfo;
  }
  
  try {
    console.log('🤖 Testing Claude...');
    debugInfo.apiCalled = true;
    
    // Simple prompt for testing
    const prompt = `Based on this vision data, create a simple eBay UK title (max 80 chars):
    
Text found: ${visionData?.textAnnotations?.[0]?.description || 'No text'}
Labels: ${visionData?.labelAnnotations?.map(l => l.description).join(', ') || 'No labels'}

Return only JSON: {"title": "your title here"}`;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 200,
        temperature: 0,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    debugInfo.responseStatus = response.status;
    const responseText = await response.text();
    
    if (!response.ok) {
      debugInfo.error = responseText;
      console.error('❌ Claude error:', responseText);
      return debugInfo;
    }
    
    const data = JSON.parse(responseText);
    const content = data.content?.[0]?.text || '';
    debugInfo.rawResponse = content.substring(0, 100);
    
    const jsonMatch = content.match(/\{.*"title".*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      debugInfo.generatedTitle = parsed.title;
      console.log('✅ Claude generated:', parsed.title);
    }
    
    return debugInfo;
    
  } catch (error) {
    debugInfo.error = error.message;
    console.error('❌ Claude exception:', error);
    return debugInfo;
  }
}

// Main handler with full debugging
export async function POST(request) {
  console.log('\n🚀 === ANALYSIS REQUEST WITH DEBUGGING ===');
  
  const fullDebug = {
    timestamp: new Date().toISOString(),
    step: 'init',
    imageDebug: null,
    visionDebug: null,
    claudeDebug: null
  };
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrls = [] } = body;
    
    console.log('📸 Image URLs received:', imageUrls);
    fullDebug.imageUrlsCount = imageUrls.length;
    
    if (!imageUrls.length) {
      return NextResponse.json({
        error: 'No images provided',
        debug: fullDebug
      }, { status: 400 });
    }
    
    // Check credits (simplified)
    let { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();
      
    if (!userData) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          credits_total: 50,
          credits_used: 0
        })
        .select()
        .single();
      userData = newUser;
    }
    
    // TEST 1: Image Fetch
    fullDebug.step = 'image_fetch';
    const imageDebug = await testImageFetch(imageUrls[0]);
    fullDebug.imageDebug = imageDebug;
    
    if (!imageDebug.fetchSuccess || !imageDebug.base64) {
      console.error('❌ Image fetch failed');
      return NextResponse.json({
        success: false,
        analysis: {
          ebay_title: "Image Fetch Failed - Check Debug Info",
          brand: "Error",
          item_type: "Error",
          debug_info: fullDebug
        }
      });
    }
    
    // TEST 2: Google Vision
    fullDebug.step = 'google_vision';
    const visionDebug = await testGoogleVision(imageDebug.base64);
    fullDebug.visionDebug = visionDebug;
    
    if (!visionDebug.visionData) {
      console.error('❌ Vision API failed');
      return NextResponse.json({
        success: false,
        analysis: {
          ebay_title: "Vision API Failed - Check Debug Info",
          brand: "Error",
          item_type: "Error", 
          debug_info: fullDebug
        }
      });
    }
    
    // TEST 3: Claude
    fullDebug.step = 'claude';
    const claudeDebug = await testClaude(visionDebug.visionData);
    fullDebug.claudeDebug = claudeDebug;
    
    // Create final result
    const analysis = {
      id: `analysis-${Date.now()}`,
      ebay_title: claudeDebug.generatedTitle || "AI Processing Failed - See Debug",
      brand: visionDebug.detections.logos?.[0] || "Unbranded",
      item_type: visionDebug.detections.labels?.[0] || "Item",
      size: "Check Label",
      color: "See Photos",
      condition_score: 7,
      estimated_value_min: 10,
      estimated_value_max: 25,
      suggested_price: 15,
      category: "Clothes, Shoes & Accessories",
      description: `Detected text: ${visionDebug.detections.firstText}
Labels: ${visionDebug.detections.labels?.join(', ')}`,
      sku: `TEST-${Date.now().toString().slice(-6)}`,
      credits_remaining: 49,
      debug_info: fullDebug
    };
    
    // Save to database
    await supabase.from('analyses').insert({
      user_id: userId,
      ebay_title: analysis.ebay_title,
      brand: analysis.brand,
      item_type: analysis.item_type,
      metadata: analysis
    });
    
    console.log('📊 Debug Summary:', {
      imageFetch: imageDebug.fetchSuccess ? '✅' : '❌',
      visionAPI: visionDebug.apiCalled ? '✅' : '❌',
      claudeAPI: claudeDebug.apiCalled ? '✅' : '❌',
      finalTitle: analysis.ebay_title
    });
    
    return NextResponse.json({
      success: true,
      analysis
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    fullDebug.fatalError = error.message;
    
    return NextResponse.json({
      success: false,
      analysis: {
        ebay_title: "System Error - Check Debug Info",
        brand: "Error",
        item_type: "Error",
        debug_info: fullDebug
      }
    });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Analysis API v5.0 - Debug Mode',
    apis: {
      googleVision: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    }
  });
}