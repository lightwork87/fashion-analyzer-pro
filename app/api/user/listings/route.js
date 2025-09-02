// app/api/user/listings/route.js - COMPLETE FIXED FILE
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
        listings: [],
        message: 'Not authenticated'
      });
    }

    // Get user listings from database
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json({ 
        listings: [],
        error: 'Failed to fetch listings'
      });
    }

    return NextResponse.json({
      listings: listings || []
    });

  } catch (error) {
    console.error('Listings API error:', error);
    return NextResponse.json({ 
      listings: [],
      error: 'Failed to fetch listings'
    });
  }
}