import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { priceId, email, mode = 'subscription' } = body;
    
    console.log('=== Stripe Checkout Debug ===');
    console.log('Request body:', body);
    console.log('Price ID:', priceId);
    console.log('Email:', email);
    console.log('Mode:', mode);
    console.log('Stripe key exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Stripe key prefix:', process.env.STRIPE_SECRET_KEY?.substring(0, 7));
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to .env.local' },
        { status: 500 }
      );
    }
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is missing' },
        { status: 400 }
      );
    }
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is missing' },
        { status: 400 }
      );
    }

    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      console.error('Invalid price ID format:', priceId);
      return NextResponse.json(
        { error: `Invalid price ID format. Expected "price_xxx" but got "${priceId}". You may be using a product ID instead of a price ID.` },
        { status: 400 }
      );
    }

    console.log('Creating Stripe checkout session...');

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      customer_email: email,
    });

    console.log('Session created successfully:', session.id);

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('=== Stripe Error Details ===');
    console.error('Error type:', error.type);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error param:', error.param);
    console.error('Full error:', error);
    
    // Check for specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      if (error.param === 'line_items[0][price]') {
        return NextResponse.json(
          { 
            error: 'Invalid price ID',
            details: 'The price ID does not exist or belongs to a different Stripe account/mode. Make sure you are using TEST price IDs with TEST API keys.',
            priceId: error.raw?.param
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error.message,
        type: error.type,
        code: error.code
      },
      { status: 500 }
    );
  }
}