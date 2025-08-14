import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json({
    totalListings: 0,
    activeListings: 0,
    soldItems: 0,
    revenue: 0,
    avgSalePrice: 0,
    listingsThisWeek: 0
  });
}