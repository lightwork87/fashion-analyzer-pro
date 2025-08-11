export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs';
import { processBatchImages } from './aiIntegration';
import { calculateCreditsNeeded } from '../../lib/stripe';
import { checkUserCredits, useCredits, saveAnalysis } from '../../lib/supabase';

export async function POST(request) {
  console.log('🚀 API Route: /api/analyze-ai called');
  
  try {
    // Get the current user from Clerk
    const user = await currentUser();
    
    if (!user) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ 
        error: 'Authentication Required',
        details: 'Please sign in to analyze images',
        type: 'UNAUTHENTICATED'
      }, { status: 401 });
    }
    
    console.log('👤 Authenticated user:', user.id);
    
    // Check if API keys exist
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ Missing ANTHROPIC_API_KEY');
      return NextResponse.json({ 
        error: 'Configuration Error',
        details: 'Anthropic API key is not configured.',
        type: 'MISSING_API_KEY'
      }, { status: 500 });
    }
    
    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      console.error('❌ Missing GOOGLE_CLOUD_VISION_API_KEY');
      return NextResponse.json({ 
        error: 'Configuration Error',
        details: 'Google Vision API key is not configured.',
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
    
    // Check user credits from database
    const creditsNeeded = 1; // Always 1 credit per listing
    console.log('💳 Checking user credits...');
    const creditCheck = await checkUserCredits(user.id, creditsNeeded);
    
    console.log('💳 Credit check result:', {
      hasEnoughCredits: creditCheck.hasEnoughCredits,
      creditsAvailable: creditCheck.creditsAvailable,
      creditsNeeded: creditsNeeded
    });
    
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
      
      // Use credits - THIS IS THE IMPORTANT PART
      console.log('💳 Deducting credits...');
      const creditResult = await useCredits(user.id, creditsNeeded, images.length);
      
      if (!creditResult.success) {
        console.error('❌ Failed to deduct credits:', creditResult.error);
        // Continue anyway - we don't want to fail the analysis if credit deduction fails
      } else {
        console.log('✅ Credits deducted successfully');
      }
      
      // Save analysis to database
      if (results.items && results.items.length > 0) {
        console.log('💾 Saving analysis to database...');
        const saveResult = await saveAnalysis(user.id, results.items[0]);
        if (!saveResult.success) {
          console.error('❌ Failed to save analysis:', saveResult.error);
        } else {
          console.log('✅ Analysis saved successfully');
        }
      }
      
      // Get updated credit info
      console.log('💳 Getting updated credit info...');
      const updatedCreditCheck = await checkUserCredits(user.id);
      
      // Add credit info to results
      results.creditInfo = {
        creditsUsed: creditsNeeded,
        creditsRemaining: updatedCreditCheck.creditsAvailable,
        totalCredits: updatedCreditCheck.totalCredits,
        subscription: 'free' // We'll update this when we implement subscriptions
      };
      
      console.log('📤 Returning results with credit info:', results.creditInfo);
      
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