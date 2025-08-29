// app/api/beta-signup/route.js
// COMPLETE BETA SIGNUP API WITH ERROR HANDLING

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request) {
  console.log('📥 Beta signup request received');
  
  try {
    const body = await request.json();
    console.log('📝 Signup data:', { email: body.email, name: body.name });
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('beta_signups')
      .select('email')
      .eq('email', body.email.toLowerCase())
      .single();
    
    if (existing) {
      console.log('⚠️ Email already registered:', body.email);
      return NextResponse.json(
        { error: 'This email is already registered for beta access' },
        { status: 400 }
      );
    }
    
    // Prepare data for insertion
    const signupData = {
      email: body.email.toLowerCase(),
      name: body.name || null,
      business_type: body.business_type || 'individual', // Default value
      monthly_items: body.monthly_items || 0,
      platforms: body.platforms || [],
      experience_level: body.experience_level || 'beginner',
      biggest_challenge: body.biggest_challenge || null,
      features_interested: body.features_interested || [],
      referral_source: body.referral_source || 'direct',
      additional_notes: body.additional_notes || null,
      status: 'pending'
    };
    
    console.log('💾 Inserting signup data:', signupData);
    
    // Insert the beta signup
    const { data, error } = await supabase
      .from('beta_signups')
      .insert([signupData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      
      // Provide specific error messages
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This email is already registered' },
          { status: 400 }
        );
      }
      
      if (error.message?.includes('business_type')) {
        return NextResponse.json(
          { 
            error: 'Database schema error. Please contact support.',
            details: 'Missing business_type column in database'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to process signup',
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Beta signup successful:', data.email);
    
    // Send confirmation email (optional - add your email service here)
    // await sendWelcomeEmail(data.email, data.name);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully signed up for beta access!',
      data: {
        email: data.email,
        name: data.name,
        status: data.status
      }
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check signup status
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
      { status: 400 }
    );
  }
  
  try {
    const { data, error } = await supabase
      .from('beta_signups')
      .select('email, status, created_at')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      );
    }
    
    return NextResponse.json({
      exists: true,
      status: data.status,
      signedUpAt: data.created_at
    });
    
  } catch (error) {
    console.error('Error checking signup:', error);
    return NextResponse.json(
      { error: 'Failed to check signup status' },
      { status: 500 }
    );
  }
}