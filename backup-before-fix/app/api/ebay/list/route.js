import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../../lib/supabase';
import { EBAY_ENDPOINTS, convertToEbayListing } from '../../../lib/ebay';

async function getValidToken(userId) {
  // Get stored tokens
  const { data: tokenData, error } = await supabase
    .from('ebay_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !tokenData) {
    throw new Error('No eBay connection found');
  }
  
  // Check if token is expired
  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();
  
  if (expiresAt <= now) {
    // Refresh the token
    const refreshResponse = await fetch(EBAY_ENDPOINTS.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token
      })
    });
    
    const newTokenData = await refreshResponse.json();
    
    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh eBay token');
    }
    
    // Update stored tokens
    await supabase
      .from('ebay_tokens')
      .update({
        access_token: newTokenData.access_token,
        expires_at: new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    return newTokenData.access_token;
  }
  
  return tokenData.access_token;
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const listing = await request.json();
    
    // Get valid eBay token
    const accessToken = await getValidToken(userId);
    
    // Convert to eBay format
    const ebayListing = convertToEbayListing(listing);
    
    // Create inventory item first
    const inventoryResponse = await fetch(
      `${EBAY_ENDPOINTS.apiUrl}/sell/inventory/v1/inventory_item/${listing.sku}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Language': 'en-GB'
        },
        body: JSON.stringify(ebayListing)
      }
    );
    
    if (!inventoryResponse.ok) {
      const error = await inventoryResponse.json();
      console.error('eBay inventory error:', error);
      return NextResponse.json({ 
        error: 'Failed to create eBay inventory item',
        details: error
      }, { status: 400 });
    }
    
    // Create offer (actual listing)
    const offerData = {
      sku: listing.sku,
      marketplaceId: 'EBAY_GB',
      format: 'FIXED_PRICE',
      listingDescription: ebayListing.product.description,
      listingPolicies: ebayListing.listingPolicies,
      pricingSummary: ebayListing.pricingSummary,
      quantityLimitPerBuyer: 1,
      includeCatalogProductDetails: false
    };
    
    const offerResponse = await fetch(
      `${EBAY_ENDPOINTS.apiUrl}/sell/inventory/v1/offer`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Language': 'en-GB'
        },
        body: JSON.stringify(offerData)
      }
    );
    
    const offerResult = await offerResponse.json();
    
    if (!offerResponse.ok) {
      console.error('eBay offer error:', offerResult);
      return NextResponse.json({ 
        error: 'Failed to create eBay offer',
        details: offerResult
      }, { status: 400 });
    }
    
    // Publish the offer
    const publishResponse = await fetch(
      `${EBAY_ENDPOINTS.apiUrl}/sell/inventory/v1/offer/${offerResult.offerId}/publish`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const publishResult = await publishResponse.json();
    
    if (!publishResponse.ok) {
      console.error('eBay publish error:', publishResult);
      return NextResponse.json({ 
        error: 'Failed to publish eBay listing',
        details: publishResult
      }, { status: 400 });
    }
    
    // Save listing ID to database
    await supabase
      .from('listings')
      .insert({
        user_id: userId,
        platform: 'ebay',
        listing_id: publishResult.listingId,
        sku: listing.sku,
        title: listing.title,
        price: listing.price,
        status: 'active',
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      success: true,
      listingId: publishResult.listingId,
      listingUrl: `https://www.ebay.co.uk/itm/${publishResult.listingId}`
    });
    
  } catch (error) {
    console.error('eBay listing error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create eBay listing'
    }, { status: 500 });
  }
}