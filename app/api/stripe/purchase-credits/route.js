// app/api/stripe/purchase-credits/route.js
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Map pack IDs to Stripe price IDs
const PACK_PRICE_IDS = {
  'pack-10': 'price_1Rve6qPeSETpTi7NWc1VcSF4', // Starter Pack
  'pack-50': 'price_1Rve84PeSETpTi7NSnMTnoya', // Growth Pack
  'pack-150': 'price_1RtnmLPeSETpTi7NEuhiAx41'  // Pro Pack
};

export async function POST(request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packId } = await request.json();
    const priceId = PACK_PRICE_IDS[packId];
    
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });
    }

    // Check if user has subscription for members-only packs
    if (packId === 'pack-10') {
      const { data: dbUser } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('clerk_id', userId)
        .single();
      
      if (dbUser?.subscription_status !== 'active') {
        return NextResponse.json({ 
          error: 'Subscription required for this pack' 
        }, { status: 403 });
      }
    }

    const userEmail = user.emailAddresses[0].emailAddress;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/credits?cancelled=true`,
      metadata: {
        userId: userId,
        email: userEmail,
        packId: packId
      }
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Purchase credits error:', error);
    return NextResponse.json(
      { error: 'Failed to purchase credits' },
      { status: 500 }
    );
  }
}