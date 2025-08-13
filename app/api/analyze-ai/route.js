export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { processBatchImages } from './aiIntegration';
import { calculateCreditsNeeded } from '../../lib/stripe';
import { supabase, checkUserCredits, useCredits, saveAnalysis } from '../../lib/supabase';

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request) {
  console.log('🚀 API Route: /api/analyze-ai called at', new Date().toISOString());
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  try {
    // Check environment variables first
    const missingVars = [];
    if (!process.env.ANTHROPIC_API_KEY) missingVars.push('ANTHROPIC_API_KEY');
    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) missingVars.push('GOOGLE_CLOUD_VISION_API_KEY');
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
      return NextResponse.json({ 
        error: 'Configuration Error',
        details: `Missing environment variables: ${missingVars.join(', ')}. Please check your Vercel environment settings.`,
        type: 'MISSING_ENV_VARS',
        missing: missingVars
      }, { status: 500, headers: corsHeaders });
    }
    
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ 
        error: 'Authentication Required',
        details: 'Please sign in to analyze images',
        type: 'UNAUTHENTICATED'
      }, { status: 401, headers: corsHeaders });
    }
    
    console.log('👤 Authenticated user ID:', userId);
    
    // Parse form data
    let formData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error('❌ Form data parsing error:', formError);
      return NextResponse.json({ 
        error: 'Invalid Request',
        details: 'Failed to parse form data. Please try again.',
        type: 'FORM_DATA_ERROR'
      }, { status: 400, headers: corsHeaders });
    }
    
    const images = [];
    
    // Collect all images from form data
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        try {
          console.log(`📸 Processing image: ${value.name}, size: ${value.size} bytes`);
          const bytes = await value.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64 = buffer.toString('base64');
          images.push(base64);
        } catch (imageError) {
          console.error('❌ Image processing error:', imageError);
          return NextResponse.json({ 
            error: 'Image Processing Failed',
            details: `Failed to process image ${value.name}. Error: ${imageError.message}`,
            type: 'IMAGE_PROCESSING_ERROR'
          }, { status: 500, headers: corsHeaders });
        }
      }
    }
    
    if (images.length === 0) {
      return NextResponse.json({ 
        error: 'No Images Found',
        details: 'No valid image files were found in the upload',
        type: 'NO_IMAGES'
      }, { status: 400, headers: corsHeaders });
    }
    
    console.log(`📸 Total images to process: ${images.length}`);
    
    // Check user credits
    const creditsNeeded = 1;
    console.log('💳 Checking credits for user:', userId);
    
    let creditCheck;
    try {
      creditCheck = await checkUserCredits(userId, creditsNeeded);
      console.log('💳 Credit check result:', creditCheck);
    } catch (creditError) {
      console.error('❌ Credit check error:', creditError);
      return NextResponse.json({ 
        error: 'Database Error',
        details: 'Failed to check credits. Please try again.',
        type: 'CREDIT_CHECK_ERROR'
      }, { status: 500, headers: corsHeaders });
    }
    
    if (!creditCheck.hasEnoughCredits) {
      return NextResponse.json({ 
        error: 'Insufficient Credits',
        details: `This analysis requires ${creditsNeeded} credit. You have ${creditCheck.creditsAvailable} credits remaining.`,
        type: 'INSUFFICIENT_CREDITS',
        creditsNeeded,
        creditsAvailable: creditCheck.creditsAvailable,
        upgradeUrl: '/pricing'
      }, { status: 403, headers: corsHeaders });
    }
    
    // Process images with AI
    console.log('🔄 Starting AI analysis...');
    let results;
    try {
      results = await processBatchImages(images);
      console.log('✅ AI analysis completed');
    } catch (aiError) {
      console.error('❌ AI processing error:', aiError);
      
      // Specific error handling for different AI services
      if (aiError.message?.includes('Google')) {
        return NextResponse.json({ 
          error: 'Google Vision API Error',
          details: 'Failed to analyze images with Google Vision. Please check your API key and quota.',
          type: 'GOOGLE_API_ERROR'
        }, { status: 500, headers: corsHeaders });
      }
      
      if (aiError.message?.includes('Anthropic') || aiError.message?.includes('Claude')) {
        return NextResponse.json({ 
          error: 'Claude API Error',
          details: 'Failed to process with Claude AI. Please check your Anthropic API key.',
          type: 'ANTHROPIC_API_ERROR'
        }, { status: 500, headers: corsHeaders });
      }
      
      return NextResponse.json({ 
        error: 'AI Processing Failed',
        details: `Failed to analyze images: ${aiError.message}`,
        type: 'AI_PROCESSING_ERROR'
      }, { status: 500, headers: corsHeaders });
    }
    
    // Use credits
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
      // Continue anyway
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
    
    return NextResponse.json(results, { headers: corsHeaders });
    
  } catch (error) {
    console.error('❌ Unexpected API Route Error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Server Error', 
      details: error.message || 'An unexpected error occurred',
      type: 'UNEXPECTED_ERROR',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500, headers: corsHeaders });
  }
}