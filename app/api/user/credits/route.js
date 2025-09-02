import { auth } from '@clerk/nextjs/server'; // CORRECT IMPORT
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Safe Supabase initialization
let supabase = null;
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.error('Supabase initialization error:', error);
}

export async function GET(request) {
  try {
    // Get auth - this now works with middleware
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    if (!supabase) {
      console.error('Supabase not configured');
      // Return default credits if DB not configured
      return NextResponse.json({
        credits: 5,
        userId: userId,
        message: 'Using default credits (DB not configured)'
      });
    }

    // Get or create user
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // User doesn't exist, create them
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          clerk_id: userId,
          credits_remaining: 5,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error('Create user error:', createError);
        return NextResponse.json({
          credits: 5,
          userId: userId,
          message: 'Using default credits'
        });
      }

      user = newUser;
    }

    return NextResponse.json({
      credits: user?.credits_remaining || 0,
      userId: userId
    });

  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}