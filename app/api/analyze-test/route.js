// app/api/analyze-test/route.js
// SIMPLE TEST VERSION - Minimal code to isolate the issue

import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('Test analyze API called');
  
  try {
    // Just return success with dummy data
    return NextResponse.json({
      success: true,
      analysis: {
        id: 'test-' + Date.now(),
        brand: 'Test Brand',
        item_type: 'Test Item',
        size: 'Medium',
        condition_score: 8,
        estimated_value_min: 20,
        estimated_value_max: 40,
        ebay_title: 'Test Listing - Working!',
        description: 'This is a test. If you see this, the API is working.',
        suggested_price: 30,
        category: 'Test Category',
        sku: 'TEST123',
        images_count: 1,
        credits_remaining: 10
      }
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      error: 'Test API failed',
      details: error.message
    }, { status: 500 });
  }
}