// app/api/analyses/[id]/route.js
// API TO FETCH SINGLE ANALYSIS - UPDATED WITH SINGLETON

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/app/lib/supabase-client';

const supabase = getSupabaseClient();

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // If it's a temporary ID (starts with "analysis-"), extract from metadata
    if (id.startsWith('analysis-')) {
      const timestamp = id.replace('analysis-', '');
      
      // Try to find by SKU pattern or created_at
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Find the matching analysis by checking metadata or SKU
      const analysis = data?.find(a => 
        a.sku?.includes(timestamp.slice(-6)) || 
        a.metadata?.id === id
      );

      if (analysis) {
        return NextResponse.json({ 
          success: true, 
          analysis: {
            ...analysis.metadata,
            ...analysis,
            id: analysis.id
          }
        });
      }
    } else {
      // Direct database ID lookup
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data) {
        return NextResponse.json({ 
          success: true, 
          analysis: {
            ...data.metadata,
            ...data,
            id: data.id
          }
        });
      }
    }

    return NextResponse.json({ 
      error: 'Analysis not found' 
    }, { status: 404 });

  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analysis' 
    }, { status: 500 });
  }
}