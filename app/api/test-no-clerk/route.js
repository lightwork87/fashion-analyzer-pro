import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    status: 'API working without Clerk',
    timestamp: new Date().toISOString()
  });
}