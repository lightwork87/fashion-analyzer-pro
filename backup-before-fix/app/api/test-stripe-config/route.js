import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;
  const hasPublishableKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  // Test if we can initialize Stripe
  let stripeWorks = false;
  let keyType = 'unknown';
  let errorMessage = null;
  let errorType = null;
  
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });
      
      keyType = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST';
      
      // Try to list products to test the connection
      const products = await stripe.products.list({ limit: 1 });
      stripeWorks = true;
    }
  } catch (error) {
    errorMessage = error.message;
    errorType = error.type || 'unknown_error';
    console.error('Stripe test error:', error);
  }
  
  return NextResponse.json({
    hasSecretKey,
    hasPublishableKey,
    secretKeyStart: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
    publishableKeyStart: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 7),
    stripeWorks,
    keyType,
    error: errorMessage,
    errorType,
    timestamp: new Date().toISOString()
  });
}