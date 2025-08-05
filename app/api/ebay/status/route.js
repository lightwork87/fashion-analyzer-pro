// app/api/ebay/status/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function GET(request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Checking eBay connection status for user:', userId);

    // Check database for stored eBay tokens
    const ebayConnection = await checkEbayConnection(userId);

    console.log('📊 eBay connection status:', {
      connected: ebayConnection.connected,
      username: ebayConnection.username || 'Not available',
      scopesCount: ebayConnection.scopes?.length || 0,
      needsRefresh: ebayConnection.needsRefresh || false
    });

    return NextResponse.json({
      connected: ebayConnection.connected,
      username: ebayConnection.username || null,
      expiresAt: ebayConnection.expiresAt || null,
      needsRefresh: ebayConnection.needsRefresh || false,
      scopes: ebayConnection.scopes || [],
      scopesGranted: ebayConnection.scopes?.length || 0,
      lastUpdated: ebayConnection.lastUpdated || null
    });

  } catch (error) {
    console.error('❌ eBay status check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check eBay status',
      details: error.message 
    }, { status: 500 });
  }
}

async function checkEbayConnection(userId) {
  try {
    // TODO: Replace with real database check
    // This is a mock implementation for development
    
    console.log('💾 Mock checking database for eBay connection...');
    
    // Mock response - in development, no connection exists yet
    return {
      connected: false,
      username: null,
      expiresAt: null,
      needsRefresh: false,
      scopes: [],
      lastUpdated: null
    };
    
    /* Production version would look like:
    
    const connection = await db.ebayConnection.findFirst({
      where: { userId: userId }
    });
    
    if (!connection) {
      return { connected: false };
    }
    
    const now = new Date();
    const expirationTime = new Date(connection.expiresAt);
    const needsRefresh = expirationTime < new Date(now.getTime() + 5 * 60 * 1000); // 5 min buffer
    
    // Verify all required scopes are present
    const requiredScopes = [
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
    ];
    
    const grantedScopes = connection.grantedScopes || [];
    const hasAllScopes = requiredScopes.every(scope => grantedScopes.includes(scope));
    
    return {
      connected: true && hasAllScopes, // Only connected if all scopes are granted
      username: connection.ebayUsername,
      expiresAt: connection.expiresAt,
      needsRefresh: needsRefresh,
      scopes: grantedScopes,
      lastUpdated: connection.updatedAt
    };
    
    */
    
  } catch (error) {
    console.error('❌ Database connection check error:', error);
    return { 
      connected: false, 
      error: error.message 
    };
  }
}