// app/api/analyses/recent/route.js - COMPLETE FIXED FILE
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ 
        analyses: [],
        message: 'Not authenticated'
      });
    }

    // Get recent analyses from database
    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching analyses:', error);
      return NextResponse.json({ 
        analyses: [],
        error: 'Failed to fetch analyses'
      });
    }

    return NextResponse.json({
      analyses: analyses || []
    });

  } catch (error) {
    console.error('Recent analyses API error:', error);
    return NextResponse.json({ 
      analyses: [],
      error: 'Failed to fetch recent analyses'
    });
  }
}