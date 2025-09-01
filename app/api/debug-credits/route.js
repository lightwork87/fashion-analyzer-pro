import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const { userId } = auth();
    
    console.log('Debug - Clerk User ID:', userId);

    if (!userId) {
      return NextResponse.json({
        error: 'No userId from Clerk',
        userId: userId
      });
    }

    // Try to find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    console.log('Debug - Supabase user:', user);
    console.log('Debug - Supabase error:', error);

    // Also check all users to see what clerk_ids exist
    const { data: allUsers } = await supabase
      .from('users')
      .select('clerk_id, email, credits_remaining')
      .limit(10);

    return NextResponse.json({
      clerk_user_id: userId,
      found_user: user,
      supabase_error: error,
      all_users_sample: allUsers,
      credits_remaining: user?.credits_remaining || 0
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Debug error',
      details: error.message
    });
  }
}