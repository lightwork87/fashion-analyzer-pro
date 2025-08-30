// app/api/beta-signup/route.js
// FIXED VERSION WITH EXPLICIT SCHEMA REFERENCE

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Debug: Log environment variables (remove in production)
console.log('Supabase URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('URL:', supabaseUrl);
  console.error('Key exists:', !!supabaseKey);
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false
  }
});

export async function POST(request) {
  console.log('=== Beta Signup POST Request ===');
  
  try {
    const body = await request.json();
    console.log('Email:', body.email);
    
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Test connection with a simple query
    console.log('Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('beta_signups')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      console.error('Error code:', testError.code);
      console.error('Error message:', testError.message);
      console.error('Error details:', testError.details);
      console.error('Error hint:', testError.hint);
      
      return NextResponse.json({
        error: 'Cannot connect to database',
        details: testError.message,
        code: testError.code,
        hint: 'Check Supabase environment variables'
      }, { status: 500 });
    }
    
    console.log('✅ Connection successful');
    
    // Check for existing email
    const { data: existing } = await supabase
      .from('beta_signups')
      .select('email')
      .eq('email', body.email.toLowerCase())
      .maybeSingle();
    
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }
    
    // Insert new signup
    const { data, error } = await supabase
      .from('beta_signups')
      .insert([{
        email: body.email.toLowerCase(),
        name: body.name || null,
        business_type: 'individual',
        monthly_items: '0-25',
        platforms: ['eBay UK', 'Vinted'],
        experience_level: 'beginner',
        status: 'pending'
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Insert error:', error);
      return NextResponse.json({
        error: 'Failed to save signup',
        details: error.message
      }, { status: 500 });
    }
    
    console.log('✅ Signup successful:', data.email);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully signed up!',
      email: data.email
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  // Test endpoint
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  let dbStatus = 'unknown';
  let rowCount = 0;
  
  if (hasUrl && hasKey) {
    try {
      const { count, error } = await supabase
        .from('beta_signups')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        dbStatus = `Error: ${error.message}`;
      } else {
        dbStatus = 'Connected';
        rowCount = count || 0;
      }
    } catch (e) {
      dbStatus = `Exception: ${e.message}`;
    }
  } else {
    dbStatus = 'Missing credentials';
  }
  
  return NextResponse.json({
    status: 'Beta Signup API',
    environment: {
      hasSupabaseUrl: hasUrl,
      hasSupabaseKey: hasKey,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
    },
    database: {
      status: dbStatus,
      signups: rowCount
    }
  });
}