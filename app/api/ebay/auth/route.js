import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EBAY_ENDPOINTS, EBAY_SCOPES } from '../../../lib/ebay';

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Generate state for security
    const state = Buffer.from(JSON.stringify({
      userId,
      timestamp: Date.now()
    })).toString('base64');
    
    // Build eBay OAuth URL
    const params = new URLSearchParams({
      client_id: process.env.EBAY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: EBAY_ENDPOINTS.redirectUri,
      scope: EBAY_SCOPES.join(' '),
      state: state
    });
    
    const authUrl = `${EBAY_ENDPOINTS.authUrl}?${params.toString()}`;
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('eBay auth error:', error);
    return NextResponse.json({ error: 'Failed to start eBay authentication' }, { status: 500 });
  }
}