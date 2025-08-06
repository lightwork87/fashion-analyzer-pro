export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { processBatchImages } from './aiIntegration';

export async function POST(request) {
  console.log('🚀 API Route: /api/analyze-ai called');
  
  try {
    // Check if API keys exist
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ Missing ANTHROPIC_API_KEY');
      return NextResponse.json({ 
        error: 'Configuration Error',
        details: 'Anthropic API key is not configured. Please check Vercel environment variables.',
        type: 'MISSING_API_KEY'
      }, { status: 500 });
    }
    
    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      console.error('❌ Missing GOOGLE_CLOUD_VISION_API_KEY');
      return NextResponse.json({ 
        error: 'Configuration Error',
        details: 'Google Vision API key is not configured. Please check Vercel environment variables.',
        type: 'MISSING_API_KEY'
      }, { status: 500 });
    }
    
    // Parse form data
    const formData = await request.formData();
    const images = [];
    
    // Collect all images from form data
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        console.log(`📸 Processing image: ${value.name}, size: ${(value.size / 1024).toFixed(2)} KB`);
        
        // Convert to base64
        try {
          const bytes = await value.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64 = buffer.toString('base64');
          images.push(base64);
        } catch (bufferError) {
          console.error('Buffer conversion error:', bufferError);
          return NextResponse.json({ 
            error: 'Image Processing Failed',
            details: `Failed to process image ${value.name}`,
            errorMessage: bufferError.message
          }, { status: 500 });
        }
      }
    }
    
    console.log(`📊 Total images to process: ${images.length}`);
    
    if (images.length === 0) {
      return NextResponse.json({ 
        error: 'No Images Found',
        details: 'No valid image files were found in the upload'
      }, { status: 400 });
    }
    
    // Warn about large batches
    if (images.length > 10) {
      console.warn(`⚠️ Large batch detected: ${images.length} images. This may take a while...`);
    }
    
    // For very large batches, consider limiting
    if (images.length > 15) {
      return NextResponse.json({ 
        error: 'Too Many Images',
        details: `Please upload 15 or fewer images at once. You uploaded ${images.length} images.`,
        suggestion: 'For better performance, we recommend 5-10 images per batch.'
      }, { status: 400 });
    }
    
    console.log('🔄 Starting AI analysis...');
    
    // Process images with AI
    try {
      const results = await processBatchImages(images);
      console.log('✅ AI analysis completed successfully');
      
      return NextResponse.json(results);
    } catch (aiError) {
      console.error('❌ AI Processing Error:', aiError);
      
      return NextResponse.json({ 
        error: 'AI Analysis Failed',
        details: aiError.message || 'Unknown AI processing error',
        type: 'AI_PROCESSING_ERROR'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Unexpected API Route Error:', error);
    
    return NextResponse.json({ 
      error: 'Server Error', 
      details: error.message || 'An unexpected error occurred',
      type: error.constructor.name
    }, { status: 500 });
  }
}