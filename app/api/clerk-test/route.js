import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to get auth status - this will ping Clerk
    const { userId } = await auth();
    
    return NextResponse.json({ 
      status: 'Clerk connected',
      userId: userId || 'No user',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'Clerk test',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}