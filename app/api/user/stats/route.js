import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock user stats - replace with database queries later
    const userStats = {
      tokensRemaining: 142,
      totalTokens: 150,
      analysesThisMonth: 8,
      subscriptionTier: 'Professional',
      subscriptionPrice: '£35',
      nextBilling: '2025-09-05',
      totalAnalyses: 234,
      avgProcessingTime: '8.4s',
      successRate: '98.2%',
      subscriptionStatus: 'active',
      customerId: 'cus_mock_' + userId,
      subscriptionId: 'sub_mock_' + userId
    };
    
    return NextResponse.json({
      success: true,
      stats: userStats
    });

  } catch (error) {
    console.error('User stats error:', error);
    return NextResponse.json({
      error: 'Failed to load user stats',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await request.json();
    
    console.log(`User ${userId} action: ${action}`, data);
    
    // Mock response - implement actual logic later
    return NextResponse.json({
      success: true,
      message: `Action ${action} completed successfully`
    });

  } catch (error) {
    console.error('User stats update error:', error);
    return NextResponse.json({
      error: 'Failed to update user stats',
      details: error.message
    }, { status: 500 });
  }
}