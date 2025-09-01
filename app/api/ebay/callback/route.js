// Add this line to force dynamic rendering
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get user from Clerk
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Get the search params from the request URL
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('eBay authorization error:', error);
      return NextResponse.redirect(new URL('/dashboard/ebay-settings?error=auth_failed', request.url));
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(new URL('/dashboard/ebay-settings?error=no_code', request.url));
    }

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': process.env.EBAY_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(new URL('/dashboard/ebay-settings?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();

    // TODO: Store the token data in your database
    console.log('eBay tokens received:', { 
      access_token: tokenData.access_token ? 'present' : 'missing',
      refresh_token: tokenData.refresh_token ? 'present' : 'missing',
      expires_in: tokenData.expires_in
    });

    // Redirect to success page
    return NextResponse.redirect(new URL('/dashboard/ebay-settings?success=true', request.url));

  } catch (error) {
    console.error('eBay callback error:', error);
    return NextResponse.redirect(new URL('/dashboard/ebay-settings?error=callback_failed', request.url));
  }
}