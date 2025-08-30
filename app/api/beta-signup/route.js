// app/api/beta-signup/route.js
// WORKING VERSION WITH PROPER SUPABASE CONNECTION

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export async function POST(request) {
  console.log('=== Beta Signup Request ===');
  
  try {
    // Parse request body
    const body = await request.json();
    console.log('Received data for:', body.email);
    
    // Validate email
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    const email = body.email.toLowerCase().trim();
    
    // First, test if we can connect to the table
    console.log('Testing database connection...');
    const { error: testError } = await supabase
      .from('beta_signups')
      .select('count(*)', { count: 'exact', head: true });
    
    if (testError) {
      console.error('Database test failed:', testError);
      return NextResponse.json(
        { 
          error: 'Database configuration error. Table may not exist.',
          details: testError.message,
          hint: 'Please run the SQL setup script in Supabase'
        },
        { status: 500 }
      );
    }
    
    // Check if email already exists
    console.log('Checking if email exists...');
    const { data: existing, error: checkError } = await supabase
      .from('beta_signups')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    
    if (checkError) {
      console.error('Check error:', checkError);
      // Continue anyway - might be a permissions issue
    }
    
    if (existing) {
      console.log('Email already registered');
      return NextResponse.json(
        { error: 'This email is already registered for beta access' },
        { status: 400 }
      );
    }
    
    // Prepare data with all fields
    const signupData = {
      email: email,
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
    
    console.log('Inserting signup data...');
    
    // Insert the signup
    const { data, error: insertError } = await supabase
      .from('beta_signups')
      .insert([signupData])
      .select()
      .single();
    
    if (insertError) {
      console.error('Insert error:', insertError);
      
      // Detailed error messages
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'This email is already registered' },
          { status: 400 }
        );
      }
      
      if (insertError.code === '42P01') {
        return NextResponse.json(
          { 
            error: 'Database table does not exist',
            hint: 'Please run the SQL setup in Supabase'
          },
          { status: 500 }
        );
      }
      
      if (insertError.code === '42703') {
        return NextResponse.json(
          { 
            error: 'Database column missing',
            details: insertError.message,
            hint: 'Please run the updated SQL schema'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to save signup',
          details: insertError.message
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Signup successful:', data.email);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully signed up for beta access!',
      email: data.email
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Server error occurred',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Check Supabase connection
    const { count, error } = await supabase
      .from('beta_signups')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Database not configured',
        error: error.message,
        solution: 'Run the SQL setup script in Supabase'
      });
    }
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Beta signup API is working',
      signups_count: count || 0,
      database: 'connected'
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    });
  }
}