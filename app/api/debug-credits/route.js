export const dynamic = "force-dynamic";
// app/api/debug-credits/route.js - COMPLETE FIXED VERSION
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Add dynamic export to prevent static generation issues
export const dynamic = 'force-dynamic';

// Initialize Supabase client with proper error handling
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  
  if (!supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    console.log('🔍 Debug Credits Route - Starting...');
    
    // Check authentication
    const { userId } = auth();
    
    if (!userId) {
      console.log('❌ Debug Credits: No authenticated user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ Debug Credits: User authenticated:', userId);

    // Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      clerkSecretKey: !!process.env.CLERK_SECRET_KEY
    };

    console.log('🔧 Environment Variables Check:', envCheck);

    // Initialize Supabase client
    let supabase;
    try {
      supabase = getSupabaseClient();
      console.log('✅ Supabase client initialized successfully');
    } catch (supabaseError) {
      console.error('❌ Supabase client initialization failed:', supabaseError.message);
      return NextResponse.json(
        { 
          error: 'Database configuration error',
          details: supabaseError.message,
          envCheck
        },
        { status: 500 }
      );
    }

    // Try to fetch user data
    let userData = null;
    let userError = null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', userId)
        .single();
      
      userData = data;
      userError = error;
      
      if (error) {
        console.log('⚠️ User fetch error:', error);
      } else {
        console.log('✅ User data fetched:', userData);
      }
    } catch (fetchError) {
      console.error('❌ Database query failed:', fetchError);
      userError = fetchError;
    }

    // Return comprehensive debug information
    return NextResponse.json({
      success: true,
      userId,
      envCheck,
      userData,
      userError: userError ? {
        message: userError.message,
        code: userError.code,
        details: userError.details
      } : null,
      timestamp: new Date().toISOString(),
      message: 'Debug information collected successfully'
    });

  } catch (error) {
    console.error('❌ Debug Credits Route Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}