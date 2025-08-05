import { NextResponse } from 'next/server';

// Increase the body size limit for Next.js
export const runtime = 'edge'; // Use edge runtime for larger payloads
export const maxDuration = 60; // Allow up to 60 seconds for processing

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request) {
  console.log('=== ANALYSIS ENDPOINT HIT ===');
  
  try {
    // Check content length
    const contentLength = request.headers.get('content-length');
    console.log('Request size:', contentLength, 'bytes');
    
    // Parse the request body with error handling
    let body;
    try {
      body = await request.json();
      console.log('Body parsed successfully');
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError.message },
        { status: 400 }
      );
    }
    
    const { images, bagNumber } = body;
    
    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: 'No images provided or invalid format' },
        { status: 400 }
      );
    }
    
    console.log(`Processing ${images.length} images for bag ${bagNumber || 'unknown'}`);
    
    // Log image sizes for debugging
    images.forEach((img, index) => {
      const sizeInKB = (img.length * 0.75) / 1024; // Approximate size for base64
      console.log(`Image ${index + 1}: ~${sizeInKB.toFixed(2)} KB`);
    });
    
    // Currently returning mock data for testing
    const mockResults = {
      success: true,
      items: images.map((img, index) => ({
        id: `item-${Date.now()}-${index}`,
        title: `Fashion Item ${index + 1}`,
        ebayTitle: `Designer Fashion Item - Excellent Condition - Size M/L - Fast Shipping`,
        description: `Premium fashion item in excellent condition. This stylish piece features high-quality materials and craftsmanship. Perfect for any wardrobe.

Key Features:
- Excellent condition with minimal wear
- Authentic designer piece
- Versatile styling options
- High-quality materials
- Well-maintained and clean`,
        condition: 'EXCELLENT',
        conditionDescription: 'Item shows minimal signs of wear, excellent overall condition',
        suggestedPrice: 45 + Math.floor(Math.random() * 100),
        priceRange: {
          min: 35,
          max: 125,
          average: 75
        },
        brand: 'Premium Brand',
        size: 'M/L',
        color: 'Multi',
        material: 'Premium Fabric',
        category: 'Fashion',
        measurements: {
          detected: false,
          values: null
        },
        keywords: ['designer', 'fashion', 'premium', 'excellent condition', 'authentic'],
        confidenceScore: 0.85 + Math.random() * 0.15,
        imageUrl: img.substring(0, 50) + '...', // Truncated for mock
        aiInsights: {
          brandConfidence: 0.9,
          conditionScore: 8.5,
          marketDemand: 'HIGH',
          listingQuality: 'EXCELLENT'
        }
      })),
      totalEstimatedValue: images.length * 75,
      tokensUsed: images.length * 2,
      processingTime: 2.5,
      bagNumber: bagNumber || `BAG-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
    console.log('=== ANALYSIS COMPLETE ===');
    console.log(`Returning ${mockResults.items.length} analyzed items`);
    
    return NextResponse.json(mockResults);
    
  } catch (error) {
    console.error('=== ANALYSIS ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        message: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}