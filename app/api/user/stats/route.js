// app/api/user/stats/route.js - NEW FILE
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/app/lib/supabase-client';

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits_total, credits_used, bonus_credits')
      .eq('clerk_id', user.id)
      .single();

    if (userError) {
      // If user doesn't exist, create them with bonus credits
      if (userError.code === 'PGRST116') {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            clerk_id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
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
          itemsAnalyzed: 0
        });
      }
      
      throw userError;
    }

    // Count analyses
    const { count: analysisCount } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const creditsAvailable = (userData.credits_total + userData.bonus_credits) - userData.credits_used;

    return NextResponse.json({
      creditsAvailable,
      creditsTotal: userData.credits_total,
      creditsUsed: userData.credits_used,
      itemsAnalyzed: analysisCount || 0
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}