// app/api/user/recent-analyses/route.js - NEW FILE
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/app/lib/supabase-client';

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    
    // Get recent analyses
    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('id, brand, item_type, size, suggested_price, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching analyses:', error);
      throw error;
    }

    return NextResponse.json({
      analyses: analyses || []
    });

  } catch (error) {
    console.error('Recent analyses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}