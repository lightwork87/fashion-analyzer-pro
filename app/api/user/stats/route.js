// app/api/user/stats/route.js - COMPLETE FIXED FILE
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
        totalListings: 0,
        activeListings: 0,
        soldThisMonth: 0,
        revenue: 0,
        avgSalePrice: 0,
        views: 0
      });
    }

    // Get user stats from database
    const { data: statsData, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('clerk_user_id', user.id)
      .single();

    if (error || !statsData) {
      // Return default stats if not found
      return NextResponse.json({
        totalListings: 0,
        activeListings: 0,
        soldThisMonth: 0,
        revenue: 0,
        avgSalePrice: 0,
        views: 0
      });
    }

    return NextResponse.json({
      totalListings: statsData.total_listings || 0,
      activeListings: statsData.active_listings || 0,
      soldThisMonth: statsData.sold_this_month || 0,
      revenue: statsData.revenue || 0,
      avgSalePrice: statsData.avg_sale_price || 0,
      views: statsData.views || 0
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({
      totalListings: 0,
      activeListings: 0,
      soldThisMonth: 0,
      revenue: 0,
      avgSalePrice: 0,
      views: 0,
      error: 'Failed to fetch stats'
    });
  }
}