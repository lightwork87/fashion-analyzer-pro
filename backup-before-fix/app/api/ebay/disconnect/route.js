import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In production, you would revoke tokens and clear database here
    // For now, we'll just return success
    
    return NextResponse.json({ 
      success: true, 
      message: 'eBay account disconnected successfully' 
    });
    
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: 'Disconnect failed' }, { status: 500 });
  }
}