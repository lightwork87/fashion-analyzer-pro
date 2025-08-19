import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=no_code', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.EBAY_REDIRECT_URI || 'https://lightlisterai.co.uk/api/ebay/callback'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('eBay token error:', tokenData);
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=token_exchange_failed', request.url)
      );
    }

    // Store tokens in your database (Supabase)
    // For now, we'll store in cookies (temporary solution)
    const response = NextResponse.redirect(
      new URL('/dashboard/settings?success=ebay_connected', request.url)
    );

    // Set secure HTTP-only cookies for tokens
    response.cookies.set('ebay_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: tokenData.expires_in
    });

    if (tokenData.refresh_token) {
      response.cookies.set('ebay_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 180 * 24 * 60 * 60 // 180 days
      });
    }

    return response;

  } catch (error) {
    console.error('eBay callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=callback_failed', request.url)
    );
  }
}