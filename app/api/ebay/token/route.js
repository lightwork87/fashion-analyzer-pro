import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { code } = await request.json();
    
    // eBay OAuth token exchange
    // In production, store these securely
    const CLIENT_ID = process.env.EBAY_CLIENT_ID;
    const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
    const REDIRECT_URI = 'https://lightlisterai.co.uk/api/ebay/callback';

    const tokenResponse = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      })
    });

    const tokenData = await tokenResponse.json();

    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      username: 'eBay User' // You can fetch actual username with another API call
    });
  } catch (error) {
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
  }
}