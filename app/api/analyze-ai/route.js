// app/api/analyze-ai/route.js
// DEBUG VERSION - Extensive logging to identify issues

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// Log environment setup
console.log('[INIT] Analyze route loading...');
console.log('[INIT] Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
});

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

console.log('[INIT] Supabase client created:', !!supabase);

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate SKU
function generateSKU(brand, itemType) {
  const b = (brand || 'UNK').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const t = (itemType || 'ITM').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const n = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${b}${t}${n}`;
}

// Get basic analysis
function getBasicAnalysis() {
  const analysis = {
    brand: 'Unknown Brand',
    item_type: 'Clothing Item', 
    size: 'Please specify',
    condition_score: 7,
    estimated_value_min: 10,
    estimated_value_max: 30,
    ebay_title: 'Vintage Clothing Item - Good Condition',
    description: 'Pre-owned clothing item in good condition. Please update with specific details.',
    suggested_price: 20,
    category: 'Clothing, Shoes & Accessories'
  };
  
  analysis.sku = generateSKU(analysis.brand, analysis.item_type);
  return analysis;
}

export async function POST(request) {
  console.log('\n=== ANALYZE API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Step 1: Check authentication
    console.log('[STEP 1] Checking authentication...');
    let userId;
    try {
      const authResult = auth();
      userId = authResult?.userId;
      console.log('[AUTH] Result:', { 
        hasAuth: !!authResult, 
        hasUserId: !!userId,
        userIdLength: userId?.length 
      });
    } catch (authError) {
      console.error('[AUTH] Error:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: authError.message,
        success: false 
      }, { status: 401 });
    }

    if (!userId) {
      console.log('[AUTH] No userId found');
      return NextResponse.json({ 
        error: 'Please sign in to continue',
        success: false 
      }, { status: 401 });
    }

    // Step 2: Parse request body
    console.log('[STEP 2] Parsing request body...');
    let body;
    try {
      body = await request.json();
      console.log('[BODY] Parsed successfully:', {
        hasBody: !!body,
        hasImages: !!body?.images,
        imageCount: body?.images?.length || 0
      });
    } catch (parseError) {
      console.error('[BODY] Parse error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request format',
        success: false 
      }, { status: 400 });
    }

    const { images } = body || {};

    if (!images || !Array.isArray(images) || images.length === 0) {
      console.log('[VALIDATION] No images provided');
      return NextResponse.json({ 
        error: 'No images provided',
        success: false 
      }, { status: 400 });
    }

    console.log(`[IMAGES] Processing ${images.length} images`);

    // Step 3: Database operations
    console.log('[STEP 3] Database operations...');
    let credits = 10; // Default credits
    let userRecord = null;

    if (supabase) {
      console.log('[DB] Supabase client available, fetching user...');
      try {
        // Get existing user
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', userId)
          .single();

        console.log('[DB] User fetch result:', {
          hasData: !!existingUser,
          hasError: !!fetchError,
          errorCode: fetchError?.code,
          errorMessage: fetchError?.message
        });

        if (existingUser) {
          userRecord = existingUser;
          const total = (existingUser.credits_total || 0) + (existingUser.bonus_credits || 0);
          const used = existingUser.credits_used || 0;
          credits = total - used;
          console.log('[DB] Existing user found:', {
            id: existingUser.id,
            credits: { total, used, available: credits }
          });
        } else if (fetchError?.code === 'PGRST116') {
          // User not found, create new one
          console.log('[DB] User not found, creating new user...');
          const newUserData = {
            id: generateId(),
            clerk_id: userId,
            credits_total: 10,
            credits_used: 0,
            bonus_credits: 0
          };

          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert(newUserData)
            .select()
            .single();

          console.log('[DB] User creation result:', {
            success: !!newUser,
            hasError: !!createError,
            errorMessage: createError?.message
          });

          if (newUser) {
            userRecord = newUser;
            credits = 10;
          }
        }
      } catch (dbError) {
        console.error('[DB] Database error:', dbError);
        console.log('[DB] Continuing without database...');
      }
    } else {
      console.log('[DB] No Supabase client, using defaults');
    }

    // Step 4: Check credits
    console.log('[STEP 4] Checking credits...');
    console.log('[CREDITS]', { available: credits });
    
    if (credits < 1) {
      console.log('[CREDITS] Insufficient credits');
      return NextResponse.json({ 
        error: 'No credits remaining. Please purchase more credits.',
        success: false,
        credits_remaining: 0
      }, { status: 402 });
    }

    // Step 5: Generate analysis
    console.log('[STEP 5] Generating analysis...');
    const analysis = getBasicAnalysis();
    const analysisId = generateId();
    console.log('[ANALYSIS] Generated:', {
      id: analysisId,
      sku: analysis.sku
    });

    // Step 6: Save to database (optional)
    if (supabase && userRecord) {
      console.log('[STEP 6] Saving to database...');
      try {
        // Save analysis
        const { error: saveError } = await supabase
          .from('analyses')
          .insert({
            id: analysisId,
            user_id: userRecord.id,
            images_count: images.length,
            brand: analysis.brand,
            item_type: analysis.item_type,
            condition_score: analysis.condition_score,
            estimated_value_min: analysis.estimated_value_min,
            estimated_value_max: analysis.estimated_value_max,
            sku: analysis.sku,
            ebay_title: analysis.ebay_title,
            description: analysis.description,
            metadata: {
              size: analysis.size,
              category: analysis.category,
              suggested_price: analysis.suggested_price
            }
          });

        if (saveError) {
          console.error('[DB] Analysis save error:', saveError);
        } else {
          console.log('[DB] Analysis saved successfully');
        }

        // Update credits
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            credits_used: (userRecord.credits_used || 0) + 1 
          })
          .eq('id', userRecord.id);

        if (updateError) {
          console.error('[DB] Credits update error:', updateError);
        } else {
          console.log('[DB] Credits updated successfully');
        }

      } catch (saveErr) {
        console.error('[DB] Save operation error:', saveErr);
      }
    } else {
      console.log('[STEP 6] Skipping database save (no client or user)');
    }

    // Step 7: Return success
    console.log('[STEP 7] Returning success response...');
    const response = {
      success: true,
      analysis: {
        id: analysisId,
        ...analysis,
        images_count: images.length,
        credits_remaining: Math.max(0, credits - 1)
      }
    };

    console.log('[RESPONSE] Success:', {
      analysisId: response.analysis.id,
      creditsRemaining: response.analysis.credits_remaining
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('\n=== UNEXPECTED ERROR ===');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    return NextResponse.json({
      error: 'Server error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      success: false
    }, { status: 500 });
  }
}