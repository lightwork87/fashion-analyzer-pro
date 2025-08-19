import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const user = await currentUser();
    return NextResponse.json({ analyses: [] });
  } catch (error) {
    return NextResponse.json({ analyses: [] });
  }
}
