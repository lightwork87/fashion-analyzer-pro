export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('credits_remaining, subscription_status, subscription_credits')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: 'Database error' }, { status: 500 });
    }

    return Response.json({ 
      credits: userData?.credits_remaining || 0,
      subscriptionStatus: userData?.subscription_status,
      subscriptionCredits: userData?.subscription_credits || 0,
      userId: userId
    });
    
  } catch (error) {
    console.error('User credits error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, amount } = await request.json();

    if (action === 'deduct' && amount) {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          credits_remaining: supabase.raw(`credits_remaining - ${amount}`)
        })
        .eq('clerk_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Credit deduction error:', error);
        return Response.json({ error: 'Failed to deduct credits' }, { status: 500 });
      }

      return Response.json({ 
        success: true,
        remainingCredits: data.credits_remaining
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Credit update error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}