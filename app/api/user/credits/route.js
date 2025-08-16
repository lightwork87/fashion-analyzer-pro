// app/api/user/credits/route.js
// COMPLETE FILE - FIXED CREDIT DISPLAY

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
      return NextResponse.json({ 
        total: 0, 
        used: 0,
        bonus: 0,
        available: 0
      });
    }

    // Get user data
    let { data: userData, error } = await supabase
      .from('users')
      .select('credits_total, credits_used, bonus_credits')
      .eq('clerk_id', userId)
      .single();

    // If user doesn't exist, create them
    if (!userData || error) {
      const { data: newUser } = await supabase
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
        
      userData = newUser || { credits_total: 50, credits_used: 0, bonus_credits: 0 };
    }

    // Calculate totals including bonus
    const totalWithBonus = (userData.credits_total || 0) + (userData.bonus_credits || 0);
    const available = totalWithBonus - (userData.credits_used || 0);
    
    return NextResponse.json({
      total: totalWithBonus,
      used: userData.credits_used || 0,
      bonus: userData.bonus_credits || 0,
      available: Math.max(0, available)
    });

  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json({ 
      total: 50, 
      used: 0,
      bonus: 0,
      available: 50
    });
  }
}