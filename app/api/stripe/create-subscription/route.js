// app/api/stripe/create-subscription/route.js
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0].emailAddress;

    // For LightLister Pro subscription
    const priceId = 'price_1RtnkoPeSETpTi7Nw1Voasgc'; // Your subscription price ID

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/credits?cancelled=true`,
      metadata: {
        userId: userId,
        email: userEmail,
        planName: 'LightLister Pro'
      },
      subscription_data: {
        metadata: {
          userId: userId,
          email: userEmail
        }
      }
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}