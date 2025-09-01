// app/api/ebay/callback/route.js - COMPLETE FIXED VERSION
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Add dynamic export to prevent static generation issues
export const dynamic = 'force-dynamic';

// Initialize Supabase client with proper error handling
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Exchange authorization code for access token
async function exchangeCodeForToken(code) {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const redirectUri = process.env.EBAY_REDIRECT_URI;
  
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('eBay API configuration is missing');
  }

  const tokenUrl = process.env.EBAY_SANDBOX === 'true' 
    ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
    : 'https://api.ebay.com/identity/v1/oauth2/token';

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`eBay token exchange failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function GET(request) {
  try {
    console.log('🔄 eBay OAuth Callback - Processing...');
    
    // Check authentication
    const { userId } = auth();
    
    if (!userId) {
      console.log('❌ eBay Callback: User not authenticated');
      return NextResponse.redirect(new URL('/sign-in?error=auth_required', request.url));
    }

    // Get authorization code from URL params
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('🔍 Callback params:', { code: !!code, error, state });

    // Handle authorization errors
    if (error) {
      console.log('❌ eBay authorization error:', error);
      const errorMessage = searchParams.get('error_description') || 'Authorization failed';
      return NextResponse.redirect(
        new URL(`/dashboard/ebay-settings?error=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }

    // Validate authorization code
    if (!code) {
      console.log('❌ No authorization code received');
      return NextResponse.redirect(
        new URL('/dashboard/ebay-settings?error=no_code', request.url)
      );
    }

    // Exchange code for access token
    let tokenData;
    try {
      tokenData = await exchangeCodeForToken(code);
      console.log('✅ Token exchange successful');
    } catch (tokenError) {
      console.error('❌ Token exchange failed:', tokenError.message);
      return NextResponse.redirect(
        new URL(`/dashboard/ebay-settings?error=${encodeURIComponent('Token exchange failed')}`, request.url)
      );
    }

    // Initialize Supabase and save token data
    try {
      const supabase = getSupabaseClient();
      
      const { error: saveError } = await supabase
        .from('ebay_tokens')
        .upsert({
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          expires_in: tokenData.expires_in,
          expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
          scope: tokenData.scope,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (saveError) {
        console.error('❌ Failed to save eBay token:', saveError);
        return NextResponse.redirect(
          new URL('/dashboard/ebay-settings?error=save_failed', request.url)
        );
      }

      console.log('✅ eBay token saved successfully');
      
      // Redirect to success page
      return NextResponse.redirect(
        new URL('/dashboard/ebay-settings?success=connected', request.url)
      );

    } catch (dbError) {
      console.error('❌ Database error:', dbError.message);
      return NextResponse.redirect(
        new URL('/dashboard/ebay-settings?error=database_error', request.url)
      );
    }

  } catch (error) {
    console.error('❌ eBay Callback Error:', error);
    
    return NextResponse.redirect(
      new URL('/dashboard/ebay-settings?error=callback_error', request.url)
    );
  }
}