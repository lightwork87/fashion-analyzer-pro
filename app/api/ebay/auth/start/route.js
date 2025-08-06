import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const clientId = process.env.EBAY_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/ebay/auth/callback`;
    const scope = process.env.EBAY_OAUTH_SCOPES || 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory';
    
    // eBay OAuth URL
    const authUrl = `https://auth.ebay.com/oauth2/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${user.id}`;
    
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    console.error('OAuth start error:', error);
    return NextResponse.json({ error: 'OAuth initialization failed' }, { status: 500 });
  }
}