export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { processBatchImages } from './aiIntegration';

console.log('🔴 Route file loaded!');

export async function POST(request) {
  console.log('🚀 API Route: /api/analyze-ai called');
  
  try {
    // Log environment status
    const envStatus = {
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      hasGoogleKey: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
      anthropicKeyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
      googleKeyLength: process.env.GOOGLE_CLOUD_VISION_API_KEY?.length || 0
    };
    console.log('Environment check:', envStatus);
    
    // Check content type
    const contentType = request.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      console.error('❌ Invalid content type:', contentType);
      return NextResponse.json({ 
        error: 'Invalid request',
        details: 'Expected multipart/form-data',
        received: contentType
      }, { status: 400 });
    }
    
    const formData = await request.formData();
    const images = [];
    
    // Collect all images from form data
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        console.log(`📸 Processing image: ${value.name}, size: ${(value.size / 1024 / 1024).toFixed(2)} MB`);
        
        // Check file size
        if (value.size > 5 * 1024 * 1024) {
          console.warn(`⚠️ Image ${value.name} is larger than 5MB`);
          return NextResponse.json({ 
            error: 'Image too large',
            details: `Image must be under 5MB. Your image is ${(value.size / 1024 / 1024).toFixed(2)} MB.`,
            fileName: value.name,
            fileSize: value.size
          }, { status: 400 });
        }
        
        // Convert to base64
        try {
          const bytes = await value.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64 = buffer.toString('base64');
          images.push(base64);
        } catch (bufferError) {
          console.error('Buffer conversion error:', bufferError);
          return NextResponse.json({ 
            error: 'Image processing failed',
            details: 'Failed to convert image to base64',
            fileName: value.name
          }, { status: 500 });
        }
      }
    }
    
    console.log(`📊 Total images to process: ${images.length}`);
    
    if (images.length === 0) {
      return NextResponse.json({ 
        error: 'No images uploaded',
        details: 'No image files were found in the request',
        formDataKeys: Array.from(formData.keys())
      }, { status: 400 });
    }
    
    // Check API keys
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ Missing ANTHROPIC_API_KEY');
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Anthropic API key is not configured in environment variables'
      }, { status: 500 });
    }
    
    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      console.error('❌ Missing GOOGLE_CLOUD_VISION_API_KEY');
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Google Vision API key is not configured in environment variables'
      }, { status: 500 });
    }
    
    console.log('🔄 Starting AI analysis...');
    
    // Process images with AI
    let results;
    try {
      results = await processBatchImages(images);
    } catch (aiError) {
      console.error('❌ AI Processing Error:', aiError);
      return NextResponse.json({ 
        error: 'AI analysis failed',
        details: aiError.message || 'Unknown AI processing error',
        type: 'AI_PROCESSING_ERROR'
      }, { status: 500 });
    }
    
    console.log('✅ Analysis complete');
    
    // Ensure we return a proper response
    if (!results) {
      return NextResponse.json({
        items: [],
        summary: {
          totalItems: 0,
          totalValue: 0,
          avgItemValue: 0
        },
        error: 'No results returned from AI processing',
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
    
    // Ensure proper structure
    if (!results.items || results.items.length === 0) {
      return NextResponse.json({
        items: [],
        summary: {
          totalItems: 0,
          totalValue: 0,
          avgItemValue: 0
        },
        message: 'No items detected in analysis',
        tokensUsed: 1
      });
    }
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ API Route Error:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Stack trace:', error.stack);
    
    // Always return JSON, never plain text
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error.message || 'Unknown error occurred',
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}