import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { items } = body;
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items data' }, { status: 400 });
    }
    
    // In production, you would create eBay listings here
    // For now, return mock success
    
    const mockListings = items.map((item, index) => ({
      itemId: `MOCK-${Date.now()}-${index}`,
      title: item.ebayTitle,
      status: 'ACTIVE',
      listingUrl: `https://www.ebay.com/itm/mock-${Date.now()}-${index}`,
      price: item.suggestedPrice,
      sku: item.sku
    }));
    
    return NextResponse.json({ 
      success: true,
      listings: mockListings,
      message: `Successfully created ${items.length} listings`
    });
    
  } catch (error) {
    console.error('List item error:', error);
    return NextResponse.json({ error: 'Failed to create listings' }, { status: 500 });
  }
}