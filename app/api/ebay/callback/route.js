import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { EBAY_ENDPOINTS } from '../../../lib/ebay';

export const dynamic = 'force-dynamic';
export async function GET(request) {
  console.log('eBay callback triggered');
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    console.log('Callback params:', { code: !!code, state: !!state, error });
    
    if (error) {
      console.error('eBay OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ebay_error=${error}`);
    }
    
    if (!code || !state) {
      console.error('Missing code or state');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ebay_error=missing_params`);
    }
    
    // Decode and verify state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId } = stateData;
    console.log('User ID from state:', userId);
    
    // Exchange code for access token
    const tokenUrl = 'https://api.ebay.com/identity/v1/oauth2/token';
    const auth = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64');
    
    console.log('Exchanging code for token...');
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://lightlisterai.co.uk/api/ebay/callback'
      })
    });
    
    const tokenData = await tokenResponse.json();
    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ebay_error=token_exchange_failed`);
    }
    
    console.log('Token received, saving to database...');
    
    // First, get the user from Clerk ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();
    
    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ebay_error=user_not_found`);
    }
    
    // Check if ebay_tokens table exists, if not create it
    const { error: tableError } = await supabase
      .from('ebay_tokens')
      .select('count')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      console.log('Creating ebay_tokens table...');
      // Table doesn't exist, create it
      const { error: createError } = await supabase.rpc('create_ebay_tokens_table', {
        sql: `
          CREATE TABLE IF NOT EXISTS ebay_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            access_token TEXT NOT NULL,
            refresh_token TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_ebay_tokens_user_id ON ebay_tokens(user_id);
        `
      });
      
      if (createError) {
        console.error('Failed to create table:', createError);
      }
    }
    
    // Store tokens using user.id (UUID) instead of clerk_id
    const { error: dbError } = await supabase
      .from('ebay_tokens')
      .upsert({
        user_id: user.id, // Use the UUID from users table
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ebay_error=database_error`);
    }
    
    console.log('Success! Redirecting to dashboard...');
    
    // Success! Redirect to dashboard
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ebay_connected=true`);
    
  } catch (error) {
    console.error('eBay callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ebay_error=callback_failed`);
  }
}