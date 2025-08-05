// app/api/ebay/auth/start/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function GET(request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eBay OAuth parameters
    const ebayAppId = process.env.EBAY_CLIENT_ID;
    const redirectUri = process.env.NODE_ENV === 'production' 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/ebay/auth/callback`
      : 'http://localhost:3003/api/ebay/auth/callback';
    
    // ALL REQUIRED eBay SCOPES FOR FULL LISTING FUNCTIONALITY
    const scopes = [
      'https://api.ebay.com/oauth/api_scope/sell.inventory',
      'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.marketing',
      'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.account',
      'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
      'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.analytics.readonly',
      'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly'
    ].join(' ');

    // Generate state parameter for security
    const state = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Build eBay OAuth authorization URL
    const ebayAuthUrl = `https://auth.ebay.com/oauth2/authorize?` +
      `client_id=${ebayAppId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${state}`;

    console.log('🚀 eBay OAuth URL generated for user:', userId);
    console.log('📋 Scopes requested:', scopes.split(' ').length, 'permissions');

    return NextResponse.json({ 
      authUrl: ebayAuthUrl,
      state: state,
      scopes: scopes.split(' '),
      message: 'eBay OAuth URL generated successfully'
    });

  } catch (error) {
    console.error('❌ eBay auth start error:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate eBay authentication',
      details: error.message 
    }, { status: 500 });
  }
}