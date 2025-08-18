// app/api/user/listings/route.js - NEW FILE
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs';
import { createClient } from '@/app/lib/supabase-client';

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    
    // Get all user listings
    const { data: listings, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }

    return NextResponse.json({
      listings: listings || []
    });

  } catch (error) {
    console.error('Listings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}