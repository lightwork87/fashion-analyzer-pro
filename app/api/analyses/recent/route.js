// app/api/analyses/recent/route.js - COMPLETE FIXED FILE
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/app/lib/supabase-server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';



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
    // FIX: Use clerk_user_id column (text type) instead of user_id (uuid type)
    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('clerk_user_id', user.id)  // CHANGED FROM user_id to clerk_user_id
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching analyses:', error);
      // Return empty array instead of throwing error
      return NextResponse.json({ 
        analyses: [],
        message: 'No analyses found'
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