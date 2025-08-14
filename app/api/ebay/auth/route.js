import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EBAY_ENDPOINTS, EBAY_SCOPES } from '../../../lib/ebay';

export const dynamic = 'force-dynamic';
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
    
    // Build eBay OAuth URL with correct parameters
    const params = new URLSearchParams({
      client_id: process.env.EBAY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: 'https://lightlisterai.co.uk/api/ebay/callback', // Hard-code this for now
      scope: EBAY_SCOPES.join(' '),
      state: state,
      prompt: 'login' // This forces the OAuth flow
    });
    
    // Use the correct OAuth endpoint
    const authUrl = `https://auth.ebay.com/oauth2/authorize?${params.toString()}`;
    
    console.log('OAuth URL:', authUrl); // For debugging
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('eBay auth error:', error);
    return NextResponse.json({ error: 'Failed to start eBay authentication' }, { status: 500 });
  }
}