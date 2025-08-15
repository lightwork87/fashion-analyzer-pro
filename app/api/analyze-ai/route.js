// app/api/analyze-ai/route.js
// EDGE VERSION - Can handle larger requests

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// Use Edge Runtime for better limits
export const runtime = 'edge';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    // Get auth in Edge-compatible way
    const authResult = auth();
    const userId = authResult?.userId;
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Please sign in to continue',
        success: false 
      }, { status: 401 });
    }

    // Parse body
    const body = await request.json();
    const { images } = body || {};

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ 
        error: 'No images provided',
        success: false 
      }, { status: 400 });
    }

    console.log(`Processing ${images.length} images`);

    // For Edge runtime, we'll use a simpler approach
    let credits = 10;
    
    // If Supabase is configured, try to check credits
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Check user
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', userId)
          .single();
          
        if (userData) {
          const total = (userData.credits_total || 0) + (userData.bonus_credits || 0);
          const used = userData.credits_used || 0;
          credits = total - used;
        }
      } catch (err) {
        console.error('Supabase error:', err);
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