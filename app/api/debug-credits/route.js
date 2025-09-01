import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { currentUser } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const user = await currentUser();
    const userId = user?.id;
    
    console.log('Debug - Clerk User ID:', userId);

    if (!userId) {
      return NextResponse.json({
        error: 'No userId from Clerk',
        userId: userId,
        hasUser: !!user
      });
    }

    // Try to find user in Supabase
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    console.log('Debug - Supabase user:', dbUser);
    console.log('Debug - Supabase error:', error);

    return NextResponse.json({
      clerk_user_id: userId,
      found_user: dbUser,
      supabase_error: error,
      credits_remaining: dbUser?.credits_remaining || 0,
      credits_total: dbUser?.credits_total || 0,
      credits_used: dbUser?.credits_used || 0
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Debug error',
      details: error.message
    });
  }
}