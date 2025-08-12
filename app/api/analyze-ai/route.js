export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Add body size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
// ... rest of your imports

export async function POST(request) {
  console.log('🚀 API Route: /api/analyze-ai called');
  
  try {
    // Add request size check
    const contentLength = request.headers.get('content-length');
    console.log('Request size:', contentLength, 'bytes');
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { processBatchImages } from './aiIntegration';
import { calculateCreditsNeeded } from '../../lib/stripe';
import { supabase, checkUserCredits, useCredits, saveAnalysis } from '../../lib/supabase';

export async function POST(request) {
  console.log('🚀 API Route: /api/analyze-ai called');
  
  try {
    // Get the authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ 
        error: 'Authentication Required',
        details: 'Please sign in to analyze images',
        type: 'UNAUTHENTICATED'
      }, { status: 401 });
    }
    
    console.log('👤 Authenticated user ID:', userId);
    
    // Check if API keys exist
    if (!process.env.ANTHROPIC_API_KEY || !process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      console.error('❌ Missing API keys');
      return NextResponse.json({ 
        error: 'Configuration Error',
        details: 'API keys are not configured.',
        type: 'MISSING_API_KEY'
      }, { status: 500 });
    }
    
    // Parse form data
    const formData = await request.formData();
    const images = [];
    
    // Collect all images from form data
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        try {
          const bytes = await value.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64 = buffer.toString('base64');
          images.push(base64);
        } catch (bufferError) {
          console.error('Buffer conversion error:', bufferError);
          return NextResponse.json({ 
            error: 'Image Processing Failed',
            details: `Failed to process image ${value.name}`
          }, { status: 500 });
        }
      }
    }
    
    if (images.length === 0) {
      return NextResponse.json({ 
        error: 'No Images Found',
        details: 'No valid image files were found in the upload'
      }, { status: 400 });
    }
    
    // Check user credits from database
    const creditsNeeded = 1;
    console.log('💳 Checking credits for user:', userId);
    const creditCheck = await checkUserCredits(userId, creditsNeeded);
    
    if (!creditCheck.hasEnoughCredits) {
      return NextResponse.json({ 
        error: 'Insufficient Credits',
        details: `This analysis requires ${creditsNeeded} credit. You have ${creditCheck.creditsAvailable} credits remaining.`,
        type: 'INSUFFICIENT_CREDITS',
        creditsNeeded,
        creditsAvailable: creditCheck.creditsAvailable,
        upgradeUrl: '/pricing'
      }, { status: 403 });
    }
    
    // Process images with AI
    console.log('🔄 Starting AI analysis...');
    const results = await processBatchImages(images);
    console.log('✅ AI analysis completed');
    
    // Use credits - Fixed section
    console.log('💳 Deducting credits...');
    try {
      const creditResult = await useCredits(userId, creditsNeeded, images.length);
      
      if (!creditResult.success) {
        console.error('Failed to deduct credits:', creditResult.error);
        // Continue anyway - don't fail the whole request
      } else {
        console.log('✅ Credits deducted successfully');
      }
    } catch (creditError) {
      console.error('Credit deduction error:', creditError);
      // Continue anyway - don't fail the whole request
    }
    
    // Save analysis
    try {
      if (results.items && results.items.length > 0) {
        await saveAnalysis(userId, results.items[0]);
      }
    } catch (saveError) {
      console.error('Failed to save analysis:', saveError);
      // Continue anyway
    }
    
    // Get updated credit info
    const updatedCreditCheck = await checkUserCredits(userId);
    
    // Add credit info to results
    results.creditInfo = {
      creditsUsed: creditsNeeded,
      creditsRemaining: updatedCreditCheck.creditsAvailable || 0,
      totalCredits: updatedCreditCheck.totalCredits || 0,
      subscription: 'free'
    };
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ API Route Error:', error);
    return NextResponse.json({ 
      error: 'Server Error', 
      details: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}