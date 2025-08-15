// app/api/analyze-ai/route.js
// CLEAN VERSION - NO EXTERNAL DEPENDENCIES EXCEPT ESSENTIAL ONES

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Generate unique ID without any external packages
function generateUniqueId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

// Generate SKU
function generateSKU(brand, itemType) {
  const brandPrefix = (brand || 'UNK').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const typePrefix = (itemType || 'ITM').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${brandPrefix}${typePrefix}${randomNum}`;
}

// Simple fallback analysis when AI is not available
function getFallbackAnalysis() {
  const analysis = {
    brand: 'Unknown Brand',
    item_type: 'Clothing Item',
    size: 'Please specify',
    condition_score: 7,
    estimated_value_min: 10,
    estimated_value_max: 30,
    ebay_title: 'Vintage Clothing Item - Good Condition',
    description: 'Pre-owned clothing item in good condition. Please update this description with specific details including brand, size, measurements, material composition, and any flaws or wear.',
    suggested_price: 20,
    category: 'Clothing, Shoes & Accessories'
  };
  
  analysis.sku = generateSKU(analysis.brand, analysis.item_type);
  return analysis;
}

// Basic AI analysis using fetch
async function performBasicAnalysis(images) {
  // For now, let's use the fallback
  // This ensures the application works even without AI
  console.log(`Analyzing ${images.length} images...`);
  
  // In the future, add AI calls here
  // For now, return structured fallback data
  return getFallbackAnalysis();
}

// Main POST handler
export async function POST(request) {
  console.log('Analyze API called');
  
  try {
    // 1. Check authentication
    const { userId } = auth();
    if (!userId) {
      console.log('Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { images } = body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      console.log('No images provided');
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    console.log(`Processing ${images.length} images for user ${userId}`);

    // 3. Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Check credits
    const totalCredits = (userData.credits_total || 0) + (userData.bonus_credits || 0);
    const usedCredits = userData.credits_used || 0;
    const availableCredits = totalCredits - usedCredits;

    console.log(`User credits: ${availableCredits} available (${totalCredits} total, ${usedCredits} used)`);

    if (availableCredits < 1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // 5. Perform analysis
    const analysisResult = await performBasicAnalysis(images);
    const analysisId = generateUniqueId();

    // 6. Save to database
    const analysisData = {
      id: analysisId,
      user_id: userData.id,
      images_count: images.length,
      brand: analysisResult.brand,
      item_type: analysisResult.item_type,
      condition_score: analysisResult.condition_score,
      estimated_value_min: analysisResult.estimated_value_min,
      estimated_value_max: analysisResult.estimated_value_max,
      sku: analysisResult.sku,
      ebay_title: analysisResult.ebay_title,
      description: analysisResult.description,
      metadata: {
        size: analysisResult.size,
        category: analysisResult.category,
        suggested_price: analysisResult.suggested_price,
        analysis_method: 'fallback',
        created_at: new Date().toISOString()
      }
    };

    const { error: insertError } = await supabase
      .from('analyses')
      .insert(analysisData);

    if (insertError) {
      console.error('Failed to save analysis:', insertError);
      // Don't fail the request, continue with the analysis
    }

    // 7. Update credits
    const newCreditsUsed = usedCredits + 1;
    const { error: creditError } = await supabase
      .from('users')
      .update({ credits_used: newCreditsUsed })
      .eq('clerk_id', userId);

    if (creditError) {
      console.error('Failed to update credits:', creditError);
    }

    // 8. Log credit usage
    await supabase.from('credit_usage').insert({
      user_id: userData.id,
      credits_used: 1,
      action: 'analysis',
      analysis_id: analysisId,
      created_at: new Date().toISOString()
    });

    // 9. Return success response
    const response = {
      success: true,
      analysis: {
        id: analysisId,
        ...analysisResult,
        images_count: images.length,
        credits_remaining: availableCredits - 1
      }
    };

    console.log('Analysis complete:', response.analysis.id);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in analyze API:', error);
    return NextResponse.json({
      error: 'Failed to analyze images',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}