// app/api/user/grant-credits/route.js
// Grant starter credits to new users

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists and their current credits
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
          credits_total: 10, // Starter credits
          credits_used: 0,
          bonus_credits: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Welcome! You\'ve been granted 10 starter credits.',
        credits_granted: 10,
        total_credits: 10
      });
      
    } else if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // User exists - check if they need more credits
    const currentCredits = (user.credits_total || 0) - (user.credits_used || 0) + (user.bonus_credits || 0);
    
    if (currentCredits <= 0) {
      // Grant 5 bonus credits
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          bonus_credits: (user.bonus_credits || 0) + 5
        })
        .eq('clerk_id', userId);

      if (updateError) {
        console.error('Error updating user credits:', updateError);
        return NextResponse.json({ error: 'Failed to grant credits' }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'You\'ve been granted 5 bonus credits!',
        credits_granted: 5,
        total_credits: currentCredits + 5
      });
    }
    
    return NextResponse.json({
      success: false,
      message: `You already have ${currentCredits} credits available.`,
      credits_granted: 0,
      total_credits: currentCredits
    });

  } catch (error) {
    console.error('Grant credits error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}