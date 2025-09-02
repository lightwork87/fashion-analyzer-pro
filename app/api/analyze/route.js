import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Rest of your existing code...
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}