// app/api/ebay/list-item/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function POST(request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listingData = await request.json();

    // Validate required fields
    if (!listingData.title || !listingData.description || !listingData.images) {
      return NextResponse.json({ 
        error: 'Missing required listing data',
        required: ['title', 'description', 'images']
      }, { status: 400 });
    }

    console.log('🛍️ Creating eBay listing for user:', userId);
    console.log('📝 Title:', listingData.title);
    console.log('📸 Images:', listingData.images.length);

    // Get user's eBay access token
    const connection = await getEbayConnection(userId);
    
    if (!connection || !connection.accessToken) {
      return NextResponse.json({ 
        error: 'eBay account not connected',
        needsConnection: true
      }, { status: 400 });
    }

    // Check if token needs refresh
    if (connection.needsRefresh) {
      console.log('🔄 Access token needs refresh...');
      const refreshResult = await refreshAccessToken(connection.refreshToken);
      if (refreshResult.error) {
        return NextResponse.json({ 
          error: 'Failed to refresh eBay token - please reconnect',
          needsReconnection: true
        }, { status: 400 });
      }
      connection.accessToken = refreshResult.access_token;
    }

    // Create eBay listing using all our granted scopes
    const listingResult = await createEbayListing(connection.accessToken, listingData);
    
    if (listingResult.error) {
      console.error('❌ eBay listing creation failed:', listingResult.error);
      return NextResponse.json({ 
        error: 'Failed to create eBay listing: ' + listingResult.error,
        details: listingResult.details
      }, { status: 400 });
    }

    // Save listing to database for tracking
    await saveListingRecord(userId, listingResult, listingData);

    console.log('✅ eBay listing created successfully!');
    console.log('🔗 eBay URL:', listingResult.ebayUrl);

    return NextResponse.json({ 
      success: true,
      listingId: listingResult.listingId,
      ebayUrl: listingResult.ebayUrl,
      sku: listingResult.sku,
      message: 'Item listed successfully on eBay!',
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ eBay listing error:', error);
    return NextResponse.json({ 
      error: 'Failed to create eBay listing',
      details: error.message 
    }, { status: 500 });
  }
}

async function getEbayConnection(userId) {
  // TODO: Replace with real database query
  return null; // Mock - no connection during development
  
  /* Production version would check database and return:
  {
    accessToken: 'token_here',
    refreshToken: 'refresh_token_here', 
    needsRefresh: false,
    grantedScopes: ['all', 'the', 'scopes']
  }
  */
}

async function createEbayListing(accessToken, listingData) {
  try {
    const baseUrl = process.env.EBAY_ENVIRONMENT === 'PRODUCTION'
      ? 'https://api.ebay.com'
      : 'https://api.sandbox.ebay.com';

    console.log('🖼️ Step 1: Uploading images to eBay...');

    // Step 1: Upload images first (requires sell.inventory scope)
    const imageUrls = await uploadImagesToEbay(accessToken, listingData.images);
    if (imageUrls.error) {
      return { error: 'Image upload failed: ' + imageUrls.error };
    }

    console.log('✅ Images uploaded successfully:', imageUrls.urls.length, 'images');

    // Step 2: Create inventory item (requires sell.inventory scope)
    console.log('📦 Step 2: Creating inventory item...');
    
    const sku = `FA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const inventoryPayload = {
      availability: {
        shipToLocationAvailability: {
          quantity: 1
        }
      },
      condition: mapConditionToEbay(listingData.condition),
      product: {
        title: listingData.title,
        description: formatDescription(listingData.description, listingData.analysis),
        imageUrls: imageUrls.urls,
        aspects: buildItemAspects(listingData.analysis)
      }
    };

    const inventoryResponse = await fetch(`${baseUrl}/sell/inventory/v1/inventory_item/${sku}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB' // UK marketplace
      },
      body: JSON.stringify(inventoryPayload)
    });

    if (!inventoryResponse.ok) {
      const error = await inventoryResponse.json();
      return { error: error.errors?.[0]?.message || 'Inventory creation failed' };
    }

    console.log('✅ Inventory item created with SKU:', sku);

    // Step 3: Create offer (requires sell.inventory scope)
    console.log('💰 Step 3: Creating pricing offer...');
    
    const offerPayload = {
      sku: sku,
      marketplaceId: 'EBAY_GB',
      format: 'FIXED_PRICE',
      pricingSummary: {
        price: {
          value: listingData.startingPrice || listingData.suggestedPrice || '9.99',
          currency: 'GBP'
        }
      },
      listingDuration: listingData.duration || 'GTC',
      categoryId: getCategoryId(listingData.analysis),
      listingPolicies: {
        paymentPolicyId: await getPaymentPolicyId(accessToken),
        returnPolicyId: await getReturnPolicyId(accessToken),
        shippingPolicyId: await getShippingPolicyId(accessToken, listingData.shippingCost)
      }
    };

    const offerResponse = await fetch(`${baseUrl}/sell/inventory/v1/offer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB'
      },
      body: JSON.stringify(offerPayload)
    });

    if (!offerResponse.ok) {
      const error = await offerResponse.json();
      return { error: error.errors?.[0]?.message || 'Offer creation failed' };
    }

    const offerData = await offerResponse.json();
    console.log('✅ Offer created with ID:', offerData.offerId);

    // Step 4: Publish the listing (requires sell.inventory scope)
    console.log('🚀 Step 4: Publishing listing to eBay...');
    
    const publishResponse = await fetch(`${baseUrl}/sell/inventory/v1/offer/${offerData.offerId}/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB'
      }
    });

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      return { error: error.errors?.[0]?.message || 'Publishing failed' };
    }

    const publishData = await publishResponse.json();
    console.log('✅ Listing published successfully!');

    return {
      listingId: publishData.listingId,
      sku: sku,
      offerId: offerData.offerId,
      ebayUrl: `https://www.ebay.co.uk/itm/${publishData.listingId}`,
      success: true
    };

  } catch (error) {
    console.error('❌ Create listing error:', error);
    return { error: error.message, details: error.stack };
  }
}

async function uploadImagesToEbay(accessToken, images) {
  try {
    const uploadedUrls = [];
    const baseUrl = process.env.EBAY_ENVIRONMENT === 'PRODUCTION'
      ? 'https://api.ebay.com'
      : 'https://api.sandbox.ebay.com';
    
    for (let i = 0; i < Math.min(images.length, 12); i++) { // eBay allows max 12 images
      const image = images[i];
      
      console.log(`📸 Uploading image ${i + 1}/${images.length}...`);
      
      // Convert base64 to blob if needed
      let imageBlob;
      if (image.src.startsWith('data:')) {
        const response = await fetch(image.src);
        imageBlob = await response.blob();
      } else {
        imageBlob = await fetch(image.src).then(r => r.blob());
      }
      
      const formData = new FormData();
      formData.append('image', imageBlob, image.name || `image_${i + 1}.jpg`);
      
      const response = await fetch(`${baseUrl}/sell/inventory/v1/inventory_item/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        return { error: error.errors?.[0]?.message || `Image ${i + 1} upload failed` };
      }

      const result = await response.json();
      uploadedUrls.push(result.imageUrl);
      
      console.log(`✅ Image ${i + 1} uploaded successfully`);
    }

    return { urls: uploadedUrls };

  } catch (error) {
    console.error('❌ Image upload error:', error);
    return { error: error.message };
  }
}

function formatDescription(description, analysis) {
  let formattedDesc = `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">`;
  
  formattedDesc += `<h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px;">Item Description</h2>`;
  formattedDesc += `<p style="font-size: 16px; margin-bottom: 20px;">${description}</p>`;
  
  if (analysis) {
    formattedDesc += `<h3 style="color: #2c5aa0; margin-top: 25px;">Professional Analysis Details</h3>`;
    
    if (analysis.brand) {
      formattedDesc += `<p><strong>🏷️ Brand:</strong> ${analysis.brand}</p>`;
    }
    
    if (analysis.condition) {
      formattedDesc += `<p><strong>⭐ Condition:</strong> ${analysis.condition}</p>`;
    }
    
    if (analysis.measurements) {
      formattedDesc += `<h4 style="color: #2c5aa0; margin-top: 20px;">📏 Measurements</h4>`;
      formattedDesc += `<table style="border-collapse: collapse; width: 100%; margin-bottom: 15px;">`;
      Object.entries(analysis.measurements).forEach(([key, value]) => {
        formattedDesc += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${key}:</td><td style="border: 1px solid #ddd; padding: 8px;">${value}</td></tr>`;
      });
      formattedDesc += `</table>`;
    }
  }
  
  formattedDesc += `<div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #2c5aa0;">`;
  formattedDesc += `<p style="margin: 0; font-style: italic; color: #666;">✨ <strong>Professionally analyzed and listed with Fashion Analyzer Pro</strong></p>`;
  formattedDesc += `<p style="margin: 0; font-size: 14px; color: #888;">Advanced AI analysis • Professional photography • Accurate measurements • Expert condition assessment</p>`;
  formattedDesc += `</div>`;
  formattedDesc += `</div>`;
  
  return formattedDesc;
}

function buildItemAspects(analysis) {
  const aspects = {};
  
  if (analysis?.brand && analysis.brand !== 'Unknown') {
    aspects.Brand = [analysis.brand];
  }
  
  if (analysis?.size) {
    aspects.Size = [analysis.size];
  }
  
  if (analysis?.color) {
    aspects.Color = [analysis.color];
  }
  
  if (analysis?.material && !analysis.material.toLowerCase().includes('synthetic')) {
    aspects.Material = [analysis.material];
  }
  
  if (analysis?.gender) {
    aspects.Department = [analysis.gender === 'women' ? 'Women' : 'Men'];
  }
  
  return aspects;
}

function mapConditionToEbay(condition) {
  const conditionMap = {
    'EXCELLENT': 'NEW_WITH_TAGS',
    'VERY GOOD': 'NEW_WITHOUT_TAGS', 
    'GOOD': 'USED_EXCELLENT',
    'FAIR': 'USED_GOOD',
    'POOR': 'USED_ACCEPTABLE'
  };
  
  return conditionMap[condition] || 'USED_GOOD';
}

function getCategoryId(analysis) {
  // Smart category selection based on analysis
  if (analysis?.gender === 'men') {
    return '1059'; // Men's Clothing
  } else if (analysis?.itemType?.toLowerCase().includes('shoe')) {
    return '15709'; // Women's Shoes
  } else if (analysis?.itemType?.toLowerCase().includes('bag')) {
    return '169291'; // Women's Bags & Handbags
  } else {
    return '15724'; // Women's Clothing - default
  }
}

async function getPaymentPolicyId(accessToken) {
  // TODO: Create or retrieve payment policy
  // For now, return a placeholder that eBay will handle
  return 'default';
}

async function getReturnPolicyId(accessToken) {
  // TODO: Create or retrieve return policy
  return 'default';
}

async function getShippingPolicyId(accessToken, shippingCost) {
  // TODO: Create or retrieve shipping policy
  return 'default';
}

async function saveListingRecord(userId, listingResult, listingData) {
  try {
    // TODO: Replace with real database save
    console.log('💾 Mock saving listing record...');
    console.log('👤 User:', userId);
    console.log('🆔 Listing ID:', listingResult.listingId);
    console.log('🔗 eBay URL:', listingResult.ebayUrl);
    
    /* Production version would save to database:
    
    await db.ebayListing.create({
      data: {
        userId: userId,
        listingId: listingResult.listingId,
        sku: listingResult.sku,
        offerId: listingResult.offerId,
        ebayUrl: listingResult.ebayUrl,
        title: listingData.title,
        startingPrice: parseFloat(listingData.startingPrice || listingData.suggestedPrice || '9.99'),
        condition: listingData.condition,
        status: 'active',
        createdAt: new Date()
      }
    });
    
    */
    
  } catch (error) {
    console.error('❌ Error saving listing record:', error);
    // Don't fail the listing creation if database save fails
  }
}