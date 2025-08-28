// app/api/user/credits/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return mock credits data while Supabase/Clerk issues are resolved
    return NextResponse.json({
      available: 10,
      total: 10,
      used: 0,
      bonus: 0
    });
  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch credits',
      available: 10, // Fallback
      total: 10,
      used: 0,
      bonus: 0
    }, { status: 500 });
  }
}