// app/api/beta-signup/route.js
// FIXED VERSION WITH PROPER GET/POST HANDLING

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// POST - Handle signup submissions
export async function POST(request) {
  console.log('📥 Beta signup POST request received');
  
  try {
    const body = await request.json();
    console.log('📝 Signup data received:', { email: body.email });
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const { data: existing } = await supabase
      .from('beta_signups')
      .select('email')
      .eq('email', body.email.toLowerCase())
      .maybeSingle();
    
    if (existing) {
      return NextResponse.json(
        { error: 'This email is already registered for beta access' },
        { status: 400 }
      );
    }
    
    // Prepare signup data
    const signupData = {
      email: body.email.toLowerCase().trim(),
      name: body.name || null,
      business_type: body.business_type || 'individual',
      monthly_items: body.monthly_items || '0-25',
      platforms: body.platforms || [],
      experience_level: body.experience_level || 'beginner',
      biggest_challenge: body.biggest_challenge || null,
      features_interested: body.features_interested || [],
      referral_source: body.referral_source || 'direct',
      additional_notes: body.additional_notes || null,
      status: 'pending'
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from('beta_signups')
      .insert([signupData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      
      // Check if it's a missing table/column error
      if (error.message?.includes('column') || error.message?.includes('relation')) {
        return NextResponse.json(
          { 
            error: 'Database configuration error. Please contact support.',
            setupRequired: true 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to process signup. Please try again.' },
        { status: 500 }
      );
    }
    
    console.log('✅ Signup successful:', data.email);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully signed up for beta access!',
      data: {
        email: data.email,
        name: data.name
      }
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

// GET - Health check only (not for form submissions)
export async function GET(request) {
  // This is just a health check endpoint
  return NextResponse.json({
    status: 'ok',
    message: 'Beta Signup API is running',
    method: 'Use POST to submit signups',
    timestamp: new Date().toISOString()
  });
}