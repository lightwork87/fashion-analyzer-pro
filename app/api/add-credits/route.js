import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { clerk_user_id, credits_to_add } = await request.json();
    
    if (!clerk_user_id || !credits_to_add) {
      return NextResponse.json(
        { error: 'Missing clerk_user_id or credits_to_add' },
        { status: 400 }
      );
    }

    // First check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerk_user_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      return NextResponse.json(
        { error: 'Database error fetching user' },
        { status: 500 }
      );
    }

    let result;
    if (existingUser) {
      // User exists, update credits
      const newCredits = (existingUser.credits || 0) + credits_to_add;
      const { data, error } = await supabase
        .from('users')
        .update({ credits: newCredits })
        .eq('clerk_user_id', clerk_user_id)
        .select();
      
      result = data;
      if (error) throw error;
    } else {
      // User doesn't exist, create new user with credits
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            clerk_user_id,
            credits: credits_to_add,
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      result = data;
      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Added ${credits_to_add} credits successfully`,
      user: result[0],
      total_credits: result[0].credits
    });

  } catch (error) {
    console.error('Error adding credits:', error);
    return NextResponse.json(
      { error: 'Failed to add credits', details: error.message },
      { status: 500 }
    );
  }
}

// GET method to check current credits
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clerk_user_id = searchParams.get('clerk_user_id');

    if (!clerk_user_id) {
      return NextResponse.json(
        { error: 'Missing clerk_user_id parameter' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerk_user_id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'User not found or database error' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
      credits: data.credits || 0
    });

  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}