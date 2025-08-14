export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export async function GET(request) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/sign-in`);
    }
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      console.error('eBay OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=ebay_auth_failed`);
    }
    
    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=no_auth_code`);
    }
    
    // In production, you would exchange the code for tokens here
    // For now, we'll just redirect back with success
    console.log('Auth code received:', code);
    console.log('State:', state);
    
    // Mock successful connection
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?success=ebay_connected`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=callback_failed`);
  }
}