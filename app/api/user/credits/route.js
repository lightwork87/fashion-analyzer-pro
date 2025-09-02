import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Initialize Supabase with error checking
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  });
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function GET(request) {
  try {
    // Get auth from Clerk
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - No user ID found' },
        { status: 401 }
      );
    }

    // Check if Supabase is configured
    if (!supabase) {
      console.error('Supabase client not initialized');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    // Get or create user in database
    let { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    // If user doesn't exist, create them
    if (fetchError || !user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            clerk_id: userId,
            credits_remaining: 5, // Start with 5 free credits
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user record' },
          { status: 500 }
        );
      }

      user = newUser;
    }

    return NextResponse.json({
      credits: user.credits_remaining || 0,
      userId: user.clerk_id,
      created: user.created_at
    });

  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const { credits } = await request.json();

    // Update user credits
    const { data, error } = await supabase
      .from('users')
      .update({ credits_remaining: credits })
      .eq('clerk_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating credits:', error);
      return NextResponse.json(
        { error: 'Failed to update credits' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      credits: data.credits_remaining
    });

  } catch (error) {
    console.error('Credits update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}