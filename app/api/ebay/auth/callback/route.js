// app/api/ebay/auth/callback/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function GET(request) {
  try {
    const { userId } = auth();
    const { searchParams } = new URL(request.url);
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('❌ eBay OAuth error:', error);
      return NextResponse.redirect(
        new URL('/?ebay_error=' + encodeURIComponent(error), request.url)
      );
    }

    if (!code || !state) {
      console.error('❌ Missing OAuth parameters');
      return NextResponse.redirect(
        new URL('/?ebay_error=missing_parameters', request.url)
      );
    }

    // Verify state parameter matches user
    const stateUserId = state.split('_')[0];
    if (stateUserId !== userId) {
      console.error('❌ State mismatch - possible CSRF attack');
      return NextResponse.redirect(
        new URL('/?ebay_error=invalid_state', request.url)
      );
    }

    console.log('🔄 Exchanging OAuth code for access token...');

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (tokenResponse.error) {
      console.error('❌ Token exchange error:', tokenResponse.error);
      return NextResponse.redirect(
        new URL('/?ebay_error=token_exchange_failed&details=' + encodeURIComponent(tokenResponse.error), request.url)
      );
    }

    // Store tokens in database 
    // TODO: Replace with real database storage
    await storeEbayTokens(userId, tokenResponse);
    
    console.log('✅ eBay OAuth successful for user:', userId);
    console.log('⏰ Token expires in:', tokenResponse.expires_in, 'seconds');
    console.log('🔑 All scopes granted:', tokenResponse.scope);

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      new URL('/?ebay_connected=true', request.url)
    );

  } catch (error) {
    console.error('❌ eBay callback error:', error);
    return NextResponse.redirect(
      new URL('/?ebay_error=callback_failed&details=' + encodeURIComponent(error.message), request.url)
    );
  }
}

async function exchangeCodeForToken(code) {
  try {
    const ebayAppId = process.env.EBAY_CLIENT_ID;
    const ebayAppSecret = process.env.EBAY_CLIENT_SECRET;
    const redirectUri = process.env.NODE_ENV === 'production' 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/ebay/auth/callback`
      : 'http://localhost:3003/api/ebay/auth/callback';

    const credentials = Buffer.from(`${ebayAppId}:${ebayAppSecret}`).toString('base64');
    
    const tokenUrl = process.env.EBAY_ENVIRONMENT === 'PRODUCTION'
      ? 'https://api.ebay.com/identity/v1/oauth2/token'
      : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';

    console.log('🌐 Making token request to:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Token exchange failed:', data);
      return { error: data.error_description || data.error || 'Token exchange failed' };
    }

    console.log('✅ Token exchange successful');
    console.log('📋 Granted scopes:', data.scope);

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope
    };

  } catch (error) {
    console.error('❌ Token exchange error:', error);
    return { error: error.message };
  }
}

async function storeEbayTokens(userId, tokenData) {
  try {
    // TODO: Replace with real database storage
    // This is a mock implementation for development
    
    const tokenInfo = {
      userId: userId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
      grantedScopes: tokenData.scope.split(' '),
      createdAt: new Date()
    };

    console.log('💾 Mock storing eBay tokens for user:', userId);
    console.log('🔑 Access token preview:', tokenData.access_token.substring(0, 10) + '...');
    console.log('📅 Expires at:', tokenInfo.expiresAt);
    console.log('📋 Granted scopes:', tokenInfo.grantedScopes.length);

    // In production, this would be:
    /*
    await db.ebayConnection.upsert({
      where: { userId: userId },
      create: {
        userId: userId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
        grantedScopes: tokenData.scope.split(' '),
        createdAt: new Date()
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
        grantedScopes: tokenData.scope.split(' '),
        updatedAt: new Date()
      }
    });
    */

    return { success: true };

  } catch (error) {
    console.error('❌ Error storing tokens:', error);
    return { success: false, error: error.message };
  }
}