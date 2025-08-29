// app/api/beta-signup/route.js
// ENHANCED VERSION WITH DETAILED ERROR LOGGING

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client - use anon key if service role not available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request) {
  console.log('📥 Beta signup request received');
  
  try {
    // Parse request body
    const body = await request.json();
    console.log('📝 Received data:', { 
      email: body.email, 
      name: body.name,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey
    });
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Test database connection first
    try {
      const { error: pingError } = await supabase
        .from('beta_signups')
        .select('count')
        .limit(1);
      
      if (pingError) {
        console.error('❌ Database connection test failed:', pingError);
        
        // If table doesn't exist, try to help
        if (pingError.message?.includes('relation') || pingError.message?.includes('does not exist')) {
          return NextResponse.json(
            { 
              error: 'Database not configured. Please run the setup SQL in Supabase.',
              details: 'Table beta_signups does not exist',
              setupRequired: true
            },
            { status: 500 }
          );
        }
      } else {
        console.log('✅ Database connection successful');
      }
    } catch (connError) {
      console.error('❌ Connection test error:', connError);
    }
    
    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('beta_signups')
      .select('email')
      .eq('email', body.email.toLowerCase())
      .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found
    
    if (checkError && !checkError.message?.includes('no rows')) {
      console.error('❌ Error checking existing email:', checkError);
      return NextResponse.json(
        { 
          error: 'Database error while checking email',
          details: checkError.message 
        },
        { status: 500 }
      );
    }
    
    if (existing) {
      console.log('⚠️ Email already registered:', body.email);
      return NextResponse.json(
        { 
          error: 'This email is already registered for beta access',
          alreadyRegistered: true 
        },
        { status: 400 }
      );
    }
    
    // Prepare data for insertion with safe defaults
    const signupData = {
      email: body.email.toLowerCase().trim(),
      name: body.name?.trim() || null,
      business_type: body.business_type || 'individual',
      monthly_items: body.monthly_items || '0-25',
      platforms: Array.isArray(body.platforms) ? body.platforms : [],
      experience_level: body.experience_level || 'beginner',
      biggest_challenge: body.biggest_challenge?.trim() || null,
      features_interested: Array.isArray(body.features_interested) ? body.features_interested : [],
      referral_source: body.referral_source || 'direct',
      additional_notes: body.additional_notes?.trim() || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('💾 Attempting to insert:', {
      email: signupData.email,
      business_type: signupData.business_type
    });
    
    // Insert the beta signup
    const { data, error } = await supabase
      .from('beta_signups')
      .insert([signupData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Insert error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Specific error handling
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        return NextResponse.json(
          { error: 'This email is already registered' },
          { status: 400 }
        );
      }
      
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found. Please contact support.',
            setupRequired: true,
            details: 'Run the database setup SQL in Supabase'
          },
          { status: 500 }
        );
      }
      
      if (error.code === '42703' || error.message?.includes('column')) {
        return NextResponse.json(
          { 
            error: 'Database schema error. Please contact support.',
            details: `Missing column: ${error.message}`,
            setupRequired: true
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to process signup',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Beta signup successful:', data.email);
    
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
        details: error.message,
        type: error.constructor.name
      },
      { status: 500 }
    );
  }
}

// Test endpoint to check if everything is configured
export async function GET(request) {
  try {
    // Check environment variables
    const config = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'
    };
    
    // Test database connection
    let dbStatus = 'unknown';
    let tableExists = false;
    let columnInfo = [];
    
    try {
      // Check if table exists and get column info
      const { data: columns, error: schemaError } = await supabase
        .rpc('get_table_info', { table_name: 'beta_signups' })
        .single();
      
      if (!schemaError && columns) {
        tableExists = true;
        columnInfo = columns;
        dbStatus = 'connected';
      } else {
        // Try a simpler query
        const { count, error: countError } = await supabase
          .from('beta_signups')
          .select('*', { count: 'exact', head: true });
        
        if (!countError) {
          tableExists = true;
          dbStatus = 'connected';
        } else {
          dbStatus = 'error: ' + countError.message;
        }
      }
    } catch (dbError) {
      dbStatus = 'error: ' + dbError.message;
    }
    
    return NextResponse.json({
      status: 'Beta Signup API Health Check',
      config,
      database: {
        status: dbStatus,
        tableExists,
        columnInfo
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
}