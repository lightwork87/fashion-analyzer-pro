import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    // Try different ways to get user info
    const { userId } = auth();
    const user = await currentUser();
    
    return NextResponse.json({
      auth_userId: userId,
      currentUser_id: user?.id || null,
      currentUser_email: user?.emailAddresses?.[0]?.emailAddress || null,
      has_user: !!user,
      env_check: {
        has_clerk_secret: !!process.env.CLERK_SECRET_KEY,
        clerk_secret_starts_with: process.env.CLERK_SECRET_KEY?.substring(0, 8) || 'missing',
        has_publishable_key: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        publishable_key_starts_with: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 8) || 'missing'
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Clerk debug failed',
      message: error.message,
      stack: error.stack
    });
  }
}