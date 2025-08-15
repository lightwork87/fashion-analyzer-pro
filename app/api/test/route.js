// app/api/test/route.js
// Simple test route to verify setup

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const tests = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {}
  };

  // Test 1: Clerk Authentication
  try {
    const { userId } = auth();
    tests.tests.clerk = {
      status: 'success',
      hasUserId: !!userId,
      userIdPreview: userId ? userId.substring(0, 10) + '...' : null
    };
  } catch (error) {
    tests.tests.clerk = {
      status: 'error',
      message: error.message
    };
  }

  // Test 2: Environment Variables
  tests.tests.environment = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrlValid: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') || false
  };

  // Test 3: Supabase Connection
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Try a simple query
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      tests.tests.supabase = {
        status: error ? 'error' : 'success',
        canConnect: !error,
        error: error?.message || null
      };
    } catch (error) {
      tests.tests.supabase = {
        status: 'error',
        message: error.message
      };
    }
  } else {
    tests.tests.supabase = {
      status: 'not configured',
      message: 'Missing Supabase credentials'
    };
  }

  return NextResponse.json(tests);
}