import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Mock analysis history
    const history = [
      {
        id: '1',
        bagNumber: 'BAG-001',
        date: '2025-01-08T10:30:00Z',
        itemCount: 5,
        totalValue: 325.50,
        status: 'completed',
        listedCount: 5
      },
      {
        id: '2',
        bagNumber: 'BAG-002',
        date: '2025-01-07T14:15:00Z',
        itemCount: 8,
        totalValue: 567.80,
        status: 'completed',
        listedCount: 7
      },
      {
        id: '3',
        bagNumber: 'VINTAGE-COLLECTION',
        date: '2025-01-06T09:45:00Z',
        itemCount: 3,
        totalValue: 890.00,
        status: 'completed',
        listedCount: 3
      }
    ];
    
    return NextResponse.json({ history });
    
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}