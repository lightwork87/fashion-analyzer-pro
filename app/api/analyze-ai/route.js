// app/api/analyze-ai/route.js
// OPTIMIZED VERSION - Handles request size limits

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// Configure route to handle larger requests (up to 4.5MB)
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

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
  console.log('Analyze API called at:', new Date().toISOString());
  
  try {
    // Check auth
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ 
        error: 'Please sign in to continue',
        success: false 
      }, { status: 401 });
    }

    // Parse body with size check
    let body;
    try {
      const contentLength = request.headers.get('content-length');
      console.log('Request size:', contentLength, 'bytes');
      
      if (contentLength && parseInt(contentLength) > 4.5 * 1024 * 1024) {
        return NextResponse.json({ 
          error: 'Request too large. Please use fewer or smaller images.',
          success: false 
        }, { status: 413 });
      }
      
      body = await request.json();
    } catch (parseError) {
      console.error('Body parse error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request format',
        success: false 
      }, { status: 400 });
    }

    const { images } = body || {};

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ 
        error: 'No images provided',
        success: false 
      }, { status: 400 });
    }

    console.log(`Processing ${images.length} images for user ${userId}`);

    // Default values
    let credits = 10;
    let userRecord = null;

    // Try to get user from database
    if (supabase) {
      try {
        // Get existing user
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', userId)
          .single();

        if (existingUser) {
          userRecord = existingUser;
          const total = (existingUser.credits_total || 0) + (existingUser.bonus_credits || 0);
          const used = existingUser.credits_used || 0;
          credits = total - used;
          console.log('User found, credits available:', credits);
        } else if (fetchError?.code === 'PGRST116') {
          // Create new user
          console.log('Creating new user...');
          const newUserData = {
            id: generateId(),
            clerk_id: userId,
            credits_total: 10,
            credits_used: 0,
            bonus_credits: 0,
            created_at: new Date().toISOString()
          };

          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert(newUserData)
            .select()
            .single();

          if (newUser) {
            userRecord = newUser;
            credits = 10;
            console.log('New user created successfully');
          } else {
            console.error('Failed to create user:', createError);
          }
        }
      } catch (err) {
        console.error('Database error:', err);
      }
    }

    // Check credits
    if (credits < 1) {
      return NextResponse.json({ 
        error: 'No credits remaining. Please purchase more credits.',
        success: false,
        credits_remaining: 0
      }, { status: 402 });
    }

    // Generate analysis
    const analysis = getBasicAnalysis();
    const analysisId = generateId();

    // Save to database if possible
    if (supabase && userRecord) {
      try {
        // Save analysis
        const { error: saveError } = await supabase.from('analyses').insert({
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
            suggested_price: analysis.suggested_price,
            created_at: new Date().toISOString()
          }
        });

        if (saveError) {
          console.error('Analysis save error:', saveError);
        }

        // Update credits
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            credits_used: (userRecord.credits_used || 0) + 1 
          })
          .eq('id', userRecord.id);

        if (updateError) {
          console.error('Credits update error:', updateError);
        }

        // Log credit usage
        await supabase.from('credit_usage').insert({
          user_id: userRecord.id,
          credits_used: 1,
          action: 'analysis',
          analysis_id: analysisId,
          created_at: new Date().toISOString()
        });

      } catch (err) {
        console.error('Database operation error:', err);
      }
    }

    // Return success
    console.log('Analysis complete:', analysisId);
    return NextResponse.json({
      success: true,
      analysis: {
        id: analysisId,
        ...analysis,
        images_count: images.length,
        credits_remaining: Math.max(0, credits - 1)
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      error: 'An error occurred while processing your request',
      success: false
    }, { status: 500 });
  }
}