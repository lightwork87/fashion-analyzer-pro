export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { processBatchImages } from './aiIntegration';

console.log('🔴 Route file loaded!');

// Helper function to compress image
async function compressImage(base64String, maxSizeKB = 150) {
  // If we're in Node.js environment, we need to use a different approach
  try {
    // For now, let's just check the size and reduce quality if needed
    const sizeInBytes = (base64String.length * 3) / 4;
    const sizeInKB = sizeInBytes / 1024;
    
    console.log(`Image size: ${sizeInKB.toFixed(2)}KB`);
    
    if (sizeInKB <= maxSizeKB) {
      return base64String;
    }
    
    // For server-side compression, we'll need to resize the image
    // This is a simple approach - in production you'd use sharp or similar
    console.log(`Image too large (${sizeInKB.toFixed(2)}KB), needs compression`);
    
    // For now, we'll just return the original and rely on client-side compression
    return base64String;
  } catch (error) {
    console.error('Error in compression:', error);
    return base64String;
  }
}

export async function POST(request) {
  console.log('🚀 API Route: /api/analyze-ai called');
  
  try {
    // IMPORTANT: Handle FormData, not JSON
    const contentType = request.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      console.error('❌ Invalid content type:', contentType);
      return NextResponse.json({ 
        error: 'Invalid request',
        details: 'Expected multipart/form-data' 
      }, { status: 400 });
    }
    
    const formData = await request.formData();
    const images = [];
    
    // Collect all images from form data
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        console.log(`📸 Processing image: ${value.name}, size: ${(value.size / 1024 / 1024).toFixed(2)} MB`);
        
        // Check file size before processing
        if (value.size > 5 * 1024 * 1024) {
          console.warn(`⚠️ Image ${value.name} is larger than 5MB, will need compression`);
        }
        
        // For very large images, we need to resize them first
        // Let's create a compressed version
        const bytes = await value.arrayBuffer();
        const buffer = Buffer.from(bytes);
        let base64 = buffer.toString('base64');
        
        // Check base64 size
        const base64SizeKB = (base64.length * 3) / 4 / 1024;
        console.log(`Base64 size: ${base64SizeKB.toFixed(2)} KB`);
        
        // If image is too large, we need to handle it differently
        if (base64SizeKB > 4000) { // ~4MB in base64
          console.error(`❌ Image too large for processing: ${base64SizeKB.toFixed(2)} KB`);
          return NextResponse.json({ 
            error: 'Image too large',
            details: `Image must be under 5MB. Your image is ${(value.size / 1024 / 1024).toFixed(2)} MB. Please resize or compress the image before uploading.`,
            suggestions: [
              'Use a photo editor to resize the image to max 2000x2000 pixels',
              'Save as JPEG with 80% quality',
              'Use an online image compressor',
              'Take photos at lower resolution'
            ]
          }, { status: 400 });
        }
        
        images.push(base64);
      }
    }
    
    console.log(`📊 Total images to process: ${images.length}`);
    
    if (images.length === 0) {
      console.error('❌ No images found in request');
      return NextResponse.json({ 
        error: 'No images uploaded',
        details: 'No image files were found in the request' 
      }, { status: 400 });
    }
    
    // Check API keys
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ Missing ANTHROPIC_API_KEY');
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Anthropic API key is not configured' 
      }, { status: 500 });
    }
    
    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      console.error('❌ Missing GOOGLE_CLOUD_VISION_API_KEY');
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Google Vision API key is not configured' 
      }, { status: 500 });
    }
    
    console.log('🔄 Starting AI analysis...');
    console.log('API Keys present:', {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      google: !!process.env.GOOGLE_CLOUD_VISION_API_KEY
    });
    
    // Process images with AI
    const results = await processBatchImages(images);
    
    console.log('✅ Analysis complete');
    console.log('Results:', JSON.stringify(results, null, 2));
    
    // Check if we have actual results
    if (!results) {
      console.error('❌ No results returned from processBatchImages');
      return NextResponse.json({
        items: [],
        summary: {
          totalItems: 0,
          totalValue: 0,
          avgItemValue: 0
        },
        tokensUsed: 1
      });
    }
    
    // If results is an array of errors, handle it
    if (Array.isArray(results) && results.length > 0 && results[0].error) {
      console.error('❌ Errors in results:', results);
      return NextResponse.json({
        items: [],
        summary: {
          totalItems: 0,
          totalValue: 0,
          avgItemValue: 0
        },
        errors: results,
        tokensUsed: 1
      });
    }
    
    // Ensure we have the expected structure
    if (!results.items || results.items.length === 0) {
      console.warn('⚠️ No items detected in analysis');
      return NextResponse.json({
        items: [],
        summary: {
          totalItems: 0,
          totalValue: 0,
          avgItemValue: 0
        },
        tokensUsed: 1
      });
    }
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ API Route Error:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error.message,
      type: error.constructor.name
    }, { status: 500 });
  }
}