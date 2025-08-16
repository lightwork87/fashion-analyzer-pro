// app/api/user/stats/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return mock stats for now - connect to your database later
  return NextResponse.json({
    totalListings: 156,
    activeListings: 89,
    soldThisMonth: 34,
    revenue: 2847.50,
    avgSalePrice: 83.75,
    views: 3421
  });
}