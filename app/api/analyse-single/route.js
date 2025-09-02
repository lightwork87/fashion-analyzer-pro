import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check content length header to prevent large uploads early
    const contentLength = request.headers.get('content-length');
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    
    if (contentLength && parseInt(contentLength) > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Request too large. Maximum size is 10MB' },
        { status: 413 }
      );
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      );
    }

    const file = formData.get('image');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Image too large. Maximum size is 10MB' },
        { status: 413 }
      );
    }

    // Convert file to base64 for processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // TODO: Add your actual image analysis logic here
    // For now, return a mock response
    return NextResponse.json({
      success: true,
      message: 'Image received for analysis',
      imageSize: file.size,
      imageName: file.name,
      // Add mock analysis data for testing
      analysis: {
        category: 'Fashion Item',
        confidence: 0.95,
        attributes: ['Clothing', 'Wearable']
      }
    });

  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return NextResponse.json({
    message: 'This endpoint only accepts POST requests with image data'
  });
}