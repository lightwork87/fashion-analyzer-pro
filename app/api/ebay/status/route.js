export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Mock user statistics
    const stats = {
      userId: user.id,
      totalAnalyses: 47,
      totalListings: 128,
      successfulSales: 89,
      totalRevenue: 4567.89,
      averagePrice: 51.32,
      tokensUsed: 94,
      tokensRemaining: 56,
      subscriptionTier: 'professional',
      memberSince: '2024-10-15',
      lastActivity: new Date().toISOString()
    };
    
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}