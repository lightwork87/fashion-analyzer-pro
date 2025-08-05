// app/api/ebay/refresh/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function POST(request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Refreshing eBay access token for user:', userId);

    // Get stored refresh token
    const connection = await getEbayConnection(userId);
    
    if (!connection || !connection.refreshToken) {
      console.error('❌ No eBay connection or refresh token found');
      return NextResponse.json({ 
        error: 'No eBay connection found',
        needsReconnection: true
      }, { status: 404 });
    }

    console.log('🔑 Found refresh token, exchanging for new access token...');

    // Refresh the access token
    const refreshResult = await refreshAccessToken(connection.refreshToken);
    
    if (refreshResult.error) {
      console.error('❌ Token refresh failed:', refreshResult.error);
      
      // If refresh token is invalid, user needs to reconnect
      if (refreshResult.error.includes('invalid_grant') || refreshResult.error.includes('expired')) {
        return NextResponse.json({ 
          error: 'Refresh token expired - please reconnect eBay account',
          needsReconnection: true,
          details: refreshResult.error
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to refresh token: ' + refreshResult.error,
        details: refreshResult.error
      }, { status: 400 });
    }

    // Update stored tokens
    await updateEbayTokens(userId, refreshResult);

    console.log('✅ eBay token refreshed successfully');
    console.log('⏰ New token expires in:', refreshResult.expires_in, 'seconds');

    return NextResponse.json({ 
      success: true,
      expiresIn: refreshResult.expires_in,
      newExpiresAt: new Date(Date.now() + (refreshResult.expires_in * 1000)),
      refreshedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ eBay token refresh error:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh eBay token',
      details: error.message 
    }, { status: 500 });
  }
}

async function getEbayConnection(userId) {
  try {
    // TODO: Replace with real database query
    // This is a mock implementation for development
    
    console.log('💾 Mock checking database for refresh token...');
    
    return null; // No connection found for now
    
    /* Production version would look like:
    
    const connection = await db.ebayConnection.findFirst({
      where: { userId: userId }
    });
    
    if (!connection) {
      return null;
    }
    
    return {
      refreshToken: connection.refreshToken,
      accessToken: connection.accessToken,
      expiresAt: connection.expiresAt,
      grantedScopes: connection.grantedScopes
    };
    
    */
    
  } catch (error) {
    console.error('❌ Database query error:', error);
    return null;
  }
}

async function refreshAccessToken(refreshToken) {
  try {
    const ebayAppId = process.env.EBAY_CLIENT_ID;
    const ebayAppSecret = process.env.EBAY_CLIENT_SECRET;
    
    const credentials = Buffer.from(`${ebayAppId}:${ebayAppSecret}`).toString('base64');
    
    const tokenUrl = process.env.EBAY_ENVIRONMENT === 'PRODUCTION'
      ? 'https://api.ebay.com/identity/v1/oauth2/token'
      : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';

    console.log('🌐 Making refresh request to:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Token refresh failed:', data);
      return { error: data.error_description || data.error || 'Token refresh failed' };
    }

    console.log('✅ Token refresh successful');
    console.log('📋 Maintained scopes:', data.scope || 'All previous scopes');

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Some responses don't include new refresh token
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope
    };

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return { error: error.message };
  }
}

async function updateEbayTokens(userId, tokenData) {
  try {
    // TODO: Replace with real database update
    // This is a mock implementation for development
    
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    console.log('💾 Mock updating eBay tokens in database...');
    console.log('🔑 New access token preview:', tokenData.access_token.substring(0, 10) + '...');
    console.log('📅 New expiration:', expiresAt);
    
    /* Production version would look like:
    
    await db.ebayConnection.update({
      where: { userId: userId },
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: expiresAt,
        grantedScopes: tokenData.scope ? tokenData.scope.split(' ') : undefined,
        updatedAt: new Date()
      }
    });
    
    */
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Database update error:', error);
    throw error;
  }
}