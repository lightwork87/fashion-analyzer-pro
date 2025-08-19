import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = cookies();
    const accessToken = cookieStore.get('ebay_access_token');

    if (!accessToken) {
      return NextResponse.json({ error: 'eBay not connected' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, price, category, condition, images } = body;

    // Create eBay listing using Trading API
    const listingPayload = {
      Item: {
        Title: title,
        Description: description,
        PrimaryCategory: { CategoryID: category },
        StartPrice: price,
        ConditionID: condition === 'New' ? 1000 : condition === 'Like New' ? 3000 : 3000,
        Country: 'GB',
        Currency: 'GBP',
        DispatchTimeMax: 3,
        ListingDuration: 'Days_7',
        ListingType: 'FixedPriceItem',
        PaymentMethods: 'PayPal',
        PictureDetails: {
          PictureURL: images || []
        },
        PostalCode: 'NP44',
        Quantity: 1,
        ReturnPolicy: {
          ReturnsAcceptedOption: 'ReturnsAccepted',
          RefundOption: 'MoneyBack',
          ReturnsWithinOption: 'Days_30',
          ShippingCostPaidByOption: 'Buyer'
        },
        ShippingDetails: {
          ShippingType: 'Flat',
          ShippingServiceOptions: {
            ShippingServicePriority: 1,
            ShippingService: 'UK_RoyalMailSecondClassStandard',
            ShippingServiceCost: 3.99
          }
        },
        Site: 'UK'
      }
    };

    // Call eBay API
    const response = await fetch('https://api.ebay.com/ws/api.dll', {
      method: 'POST',
      headers: {
        'X-EBAY-API-CALL-NAME': 'AddFixedPriceItem',
        'X-EBAY-API-SITEID': '3', // UK site
        'X-EBAY-API-COMPATIBILITY-LEVEL': '1157',
        'Content-Type': 'text/xml',
        'X-EBAY-API-IAF-TOKEN': accessToken.value
      },
      body: `<?xml version="1.0" encoding="utf-8"?>
        <AddFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          ${JSON.stringify(listingPayload.Item)}
        </AddFixedPriceItemRequest>`
    });

    const result = await response.text();
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to list item' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Item listed successfully',
      ebayResponse: result 
    });

  } catch (error) {
    console.error('eBay listing error:', error);
    return NextResponse.json(
      { error: 'Failed to list item', details: error.message },
      { status: 500 }
    );
  }
}