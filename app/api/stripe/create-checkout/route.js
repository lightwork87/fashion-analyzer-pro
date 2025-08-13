import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { PLANS, CREDIT_PACKS } from '../../../lib/stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(request) {
  try {
    // Get the authenticated user ID
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Get the full user details including email
    const user = await currentUser();
    
    if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    const userEmail = user.emailAddresses[0].emailAddress;

    // Get the request body
    const { priceId, planName } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Determine if this is a subscription based on the price ID
    let mode = 'payment'; // default to one-time payment
    
    // Check if it's the subscription price
    if (priceId === 'price_1RtnkoPeSETpTi7Nw1Voasgc') {
      mode = 'subscription';
    }

    console.log(`Creating checkout session: mode=${mode}, priceId=${priceId}`);

    // Create Stripe checkout session
    const sessionConfig = {
      mode: mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://lightlisterai.co.uk'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://lightlisterai.co.uk'}/pricing?cancelled=true`,
      metadata: {
        userId: userId,
        planName: planName || 'Credits',
      },
      automatic_tax: {
        enabled: true, // This enables Stripe Tax for automatic VAT handling
      },
    };

    // Add subscription-specific settings
    if (mode === 'subscription') {
      sessionConfig.subscription_data = {
        metadata: {
          userId: userId,
          planName: planName,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}