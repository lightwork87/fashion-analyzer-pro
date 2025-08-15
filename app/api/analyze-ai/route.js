// app/api/analyze-ai/route.js
// CLEAN VERSION - No const reassignment errors

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

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
  try {
    // Check auth
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ 
        error: 'Please sign in',
        success: false 
      }, { status: 401 });
    }

    // Get images
    const body = await request.json();
    const { images } = body;

    if (!images || images.length === 0) {
      return NextResponse.json({ 
        error: 'No images provided',
        success: false 
      }, { status: 400 });
    }

    // Default values
    let credits = 10;
    let userRecord = null;

    // Try to get user from database if Supabase is available
    if (supabase) {
      try {
        // Get existing user
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', userId)
          .single();

        if (existingUser) {
          userRecord = existingUser;
          const total = (existingUser.credits_total || 0) + (existingUser.bonus_credits || 0);
          const used = existingUser.credits_used || 0;
          credits = total - used;
        } else {
          // Create new user
          const newUserData = {
            id: generateId(),
            clerk_id: userId,
            credits_total: 10,
            credits_used: 0,
            bonus_credits: 0
          };

          const { data: newUser } = await supabase
            .from('users')
            .insert(newUserData)
            .select()
            .single();

          if (newUser) {
            userRecord = newUser;
            credits = 10;
          }
        }
      } catch (err) {
        console.error('Database error:', err);
        // Continue without database
      }
    }

    // Check credits
    if (credits < 1) {
      return NextResponse.json({ 
        error: 'No credits remaining',
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
        await supabase.from('analyses').insert({
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

        // Update credits
        await supabase
          .from('users')
          .update({ 
            credits_used: (userRecord.credits_used || 0) + 1 
          })
          .eq('id', userRecord.id);

      } catch (err) {
        console.error('Save error:', err);
        // Continue anyway
      }
    }

    // Return success
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
    console.error('Error:', error);
    return NextResponse.json({
      error: 'Server error',
      success: false
    }, { status: 500 });
  }
}