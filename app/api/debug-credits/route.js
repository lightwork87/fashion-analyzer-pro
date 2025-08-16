// app/api/debug-credits/route.js
// Debug endpoint to check credit status

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' });
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    // If user doesn't exist, create them with free credits
    if (!userData || userError) {
      console.log('Creating new user with 50 credits');
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: `user-${userId}@example.com`,
          credits_total: 50,
          credits_used: 0,
          bonus_credits: 0,
          subscription_status: 'trial'
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ 
          error: 'Failed to create user', 
          details: createError 
        });
      }

      return NextResponse.json({
        message: 'User created with 50 free credits',
        user: newUser,
        credits_available: 50
      });
    }

    // Calculate available credits
    const creditsAvailable = (userData.credits_total || 0) - (userData.credits_used || 0) + (userData.bonus_credits || 0);

    return NextResponse.json({
      userId,
      userData,
      credits_available: creditsAvailable,
      breakdown: {
        total: userData.credits_total || 0,
        used: userData.credits_used || 0,
        bonus: userData.bonus_credits || 0
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
}