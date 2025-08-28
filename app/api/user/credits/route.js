// app/api/user/credits/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // User doesn't exist, create with starter credits
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: `user-${userId}@lightlisterai.co.uk`,
          credits_total: 50, // Starter credits
          credits_used: 0,
          bonus_credits: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      
      user = newUser;
    } else if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const available = (user.credits_total || 0) - (user.credits_used || 0) + (user.bonus_credits || 0);
    
    return NextResponse.json({
      available: Math.max(0, available),
      total: user.credits_total || 0,
      used: user.credits_used || 0,
      bonus: user.bonus_credits || 0
    });

  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      available: 0,
      total: 0,
      used: 0,
      bonus: 0
    }, { status: 500 });
  }
}