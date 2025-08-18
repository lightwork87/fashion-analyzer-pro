// app/api/user/credits/route.js - FIXED VERSION
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'; // Correct import for App Router!
import { createClient } from '@/app/lib/supabase-client';

export async function GET() {
  try {
    // Get the userId from auth() instead of currentUser()
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    
    // Get user data from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('credits_total, credits_used, bonus_credits')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user credits:', error);
      
      // If user doesn't exist, create them with bonus credits
      if (error.code === 'PGRST116') {
        // Get user details from Clerk if needed
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            clerk_id: userId,
            credits_total: 50, // Beta bonus
            credits_used: 0,
            bonus_credits: 50
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return NextResponse.json({
          creditsAvailable: 50,
          creditsTotal: 50,
          creditsUsed: 0,
          bonusCredits: 50
        });
      }
      
      throw error;
    }

    const creditsAvailable = (userData.credits_total + userData.bonus_credits) - userData.credits_used;

    return NextResponse.json({
      creditsAvailable,
      creditsTotal: userData.credits_total,
      creditsUsed: userData.credits_used,
      bonusCredits: userData.bonus_credits
    });

  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}