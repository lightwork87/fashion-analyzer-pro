// app/api/user/billing/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/app/lib/supabase-server';



export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({
        credits: 10, // Default free credits
        subscription: 'free',
        nextBillingDate: null,
        creditHistory: []
      });
    }

    // Calculate available credits
    const creditsAvailable = (user.credits_total || 0) - (user.credits_used || 0) + (user.bonus_credits || 0);

    // Get credit history
    const { data: history } = await supabase
      .from('credit_usage')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Format credit history
    const creditHistory = [];
    
    // Add usage
    if (history) {
      history.forEach(item => {
        creditHistory.push({
          id: item.id,
          date: item.created_at,
          description: `Analysis - ${item.image_count} photos`,
          type: 'usage',
          credits: item.credits_used,
          amount: null
        });
      });
    }

    // Add purchases
    if (transactions) {
      transactions.forEach(item => {
        creditHistory.push({
          id: item.id,
          date: item.created_at,
          description: item.product_name,
          type: 'purchase',
          credits: item.credits_purchased,
          amount: item.amount,
          invoice: item.stripe_session_id
        });
      });
    }

    // Sort by date
    creditHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({
      credits: creditsAvailable,
      subscription: user.subscription_status === 'active' ? 'pro' : 'free',
      nextBillingDate: user.subscription_end_date,
      creditHistory: creditHistory
    });

  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json({
      credits: 0,
      subscription: 'free',
      nextBillingDate: null,
      creditHistory: []
    });
  }
}