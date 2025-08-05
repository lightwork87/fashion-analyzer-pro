import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock analysis history - replace with database queries later
    const mockHistory = [
      {
        id: 'analysis_001',
        date: '2025-08-05T14:30:00Z',
        brand: 'ZARA',
        category: 'Dress',
        condition: 'EXCELLENT',
        size: 'UK 12',
        estimatedValue: '£25-35',
        bagNumber: 'BAG-142',
        tokensUsed: 1,
        processingTime: '8s',
        hasRulerMeasurements: true,
        ebayTitle: 'ZARA Women\'s Dress Size 12 Excellent Measured Preloved',
        description: 'Beautiful preloved ZARA dress in excellent condition...',
        status: 'completed'
      },
      {
        id: 'analysis_002',
        date: '2025-08-05T13:45:00Z',
        brand: 'H&M',
        category: 'Jacket',
        condition: 'GOOD',
        size: 'UK 10',
        estimatedValue: '£15-22',
        bagNumber: 'BAG-141',
        tokensUsed: 1,
        processingTime: '12s',
        hasRulerMeasurements: false,
        ebayTitle: 'H&M Women\'s Jacket Size 10 Good Condition Preloved',
        description: 'Stylish H&M jacket in good condition...',
        status: 'completed'
      }
    ];

    return NextResponse.json({
      success: true,
      history: mockHistory,
      total: mockHistory.length,
      hasMore: false
    });

  } catch (error) {
    console.error('Analysis history error:', error);
    return NextResponse.json({
      error: 'Failed to load analysis history',
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

    const analysisData = await request.json();
    
    console.log(`Saving analysis for user ${userId}:`, analysisData.id || 'new_analysis');
    
    // Mock save - implement database save later
    return NextResponse.json({
      success: true,
      analysis: {
        id: analysisData.id || `analysis_${Date.now()}`,
        ...analysisData,
        saved: true,
        savedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Save analysis error:', error);
    return NextResponse.json({
      error: 'Failed to save analysis',
      details: error.message
    }, { status: 500 });
  }
}