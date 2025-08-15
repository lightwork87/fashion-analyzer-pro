// app/api/analyze-ai/route.js
// SIMPLIFIED VERSION - For debugging

import { NextResponse } from 'next/server';

// Simple ID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Simple SKU generator
function generateSKU() {
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `ITEM${random}`;
}

export async function POST(request) {
  console.log('Analyze API called at:', new Date().toISOString());
  
  try {
    // Parse body
    let body;
    try {
      body = await request.json();
      console.log('Body parsed, image count:', body.images?.length);
    } catch (e) {
      console.error('Body parse error:', e);
      return NextResponse.json({ 
        error: 'Invalid request format',
        success: false 
      }, { status: 400 });
    }

    const { images } = body || {};

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ 
        error: 'No images provided',
        success: false 
      }, { status: 400 });
    }

    // Generate basic analysis
    const analysisId = generateId();
    const sku = generateSKU();
    
    const analysis = {
      id: analysisId,
      brand: 'Unknown Brand',
      item_type: 'Clothing Item',
      size: 'Please specify',
      condition_score: 7,
      estimated_value_min: 10,
      estimated_value_max: 30,
      ebay_title: 'Vintage Clothing Item - Good Condition',
      description: 'Pre-owned clothing item in good condition. Please update this description with specific details.',
      suggested_price: 20,
      category: 'Clothing, Shoes & Accessories',
      sku: sku,
      images_count: images.length,
      credits_remaining: 10
    };

    console.log('Returning analysis:', analysisId);

    // Return success
    return NextResponse.json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      error: 'Server error: ' + error.message,
      success: false
    }, { status: 500 });
  }
}

// Also handle GET for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Analyze API is running',
    timestamp: new Date().toISOString()
  });
}