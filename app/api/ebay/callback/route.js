import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { EBAY_ENDPOINTS } from '../../../lib/ebay';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ebay_error=${error}`);
    }
    
    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ebay_error=missing_params`);
    }
    
    // Decode and verify state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId } = stateData;
    
    // Exchange code for access token
    const tokenResponse = await fetch(EBAY_ENDPOINTS.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: EBAY_ENDPOINTS.redirectUri
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ebay_error=token_exchange_failed`);
    }
    
    // Store tokens in database
    const { error: dbError } = await supabase
      .from('ebay_tokens')
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ebay_error=database_error`);
    }
    
    // Success! Redirect to dashboard
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ebay_connected=true`);
    
  } catch (error) {
    console.error('eBay callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ebay_error=callback_failed`);
  }
}