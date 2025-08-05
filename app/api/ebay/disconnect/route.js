// app/api/ebay/disconnect/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function POST(request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔌 Disconnecting eBay account for user:', userId);

    // Remove eBay connection from database
    const disconnectResult = await disconnectEbayAccount(userId);

    if (disconnectResult.success) {
      console.log('✅ eBay account disconnected successfully');
      
      return NextResponse.json({ 
        success: true,
        message: 'eBay account disconnected successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Failed to disconnect eBay account:', disconnectResult.error);
      
      return NextResponse.json({ 
        error: 'Failed to disconnect eBay account',
        details: disconnectResult.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ eBay disconnect error:', error);
    return NextResponse.json({ 
      error: 'Failed to disconnect eBay account',
      details: error.message 
    }, { status: 500 });
  }
}

async function disconnectEbayAccount(userId) {
  try {
    // TODO: Replace with real database operation
    // This is a mock implementation for development
    
    console.log('💾 Mock removing eBay connection from database...');
    console.log('🗑️ Cleaning up tokens and user data...');
    
    // Mock successful disconnection
    return { success: true };
    
    /* Production version would look like:
    
    // Get connection details before deletion (for logging)
    const connection = await db.ebayConnection.findFirst({
      where: { userId: userId }
    });
    
    if (connection) {
      console.log('🔑 Revoking eBay access token...');
      
      // Optional: Revoke the token with eBay (best practice)
      try {
        await revokeEbayToken(connection.accessToken);
      } catch (revokeError) {
        console.warn('⚠️ Failed to revoke token with eBay:', revokeError.message);
        // Continue with local deletion even if revocation fails
      }
      
      // Delete from database
      await db.ebayConnection.deleteMany({
        where: { userId: userId }
      });
      
      console.log('✅ eBay connection removed from database');
    } else {
      console.log('ℹ️ No eBay connection found for user');
    }
    
    return { success: true };
    
    */
    
  } catch (error) {
    console.error('❌ Database disconnect error:', error);
    return { success: false, error: error.message };
  }
}

async function revokeEbayToken(accessToken) {
  try {
    const ebayAppId = process.env.EBAY_CLIENT_ID;
    const ebayAppSecret = process.env.EBAY_CLIENT_SECRET;
    
    const credentials = Buffer.from(`${ebayAppId}:${ebayAppSecret}`).toString('base64');
    
    const revokeUrl = process.env.EBAY_ENVIRONMENT === 'PRODUCTION'
      ? 'https://api.ebay.com/identity/v1/oauth2/revoke'
      : 'https://api.sandbox.ebay.com/identity/v1/oauth2/revoke';

    const response = await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        token: accessToken
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Token revocation failed');
    }

    console.log('✅ eBay token revoked successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ Token revocation error:', error);
    throw error;
  }
}