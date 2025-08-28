import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    env: {
      hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      keyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 7),
      hasSecretKey: !!process.env.CLERK_SECRET_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
}