// app/api/user/credits/route.js - COMPLETE FIXED FILE
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ 
        available: 0, 
        total: 0,
        message: 'Not authenticated' 
      });
    }

    // Get user credits from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('credits_total, credits_used, bonus_credits')
      .eq('clerk_user_id', user.id)
      .single();

    if (error || !userData) {
      // If user doesn't exist, create them with starter credits
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          clerk_user_id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          credits_total: 0,
          credits_used: 0,
          bonus_credits: 50
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ 
          available: 50, 
          total: 50,
          message: 'Default credits' 
        });
      }

      return NextResponse.json({
        available: 50,
        total: 50,
        message: 'New user credits'
      });
    }

    const available = (userData.credits_total + userData.bonus_credits) - userData.credits_used;

    return NextResponse.json({
      available: available || 0,
      total: userData.credits_total || 0,
      bonus: userData.bonus_credits || 0,
      used: userData.credits_used || 0
    });

  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json({ 
      available: 0, 
      total: 0,
      error: 'Failed to fetch credits' 
    });
  }
}