// app/api/analyses/[id]/route.js - COMPLETE FILE
import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-client';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Fetch the analysis
    const { data: analysis, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching analysis:', error);
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Analyses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Update the analysis
    const { data: updatedAnalysis, error } = await supabase
      .from('analyses')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating analysis:', error);
      return NextResponse.json({ error: 'Failed to update analysis' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis: updatedAnalysis
    });

  } catch (error) {
    console.error('Analyses API error:', error);
    return NextResponse.json(
      { error: 'Failed to update analysis' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Delete the analysis
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting analysis:', error);
      return NextResponse.json({ error: 'Failed to delete analysis' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Analysis deleted successfully'
    });

  } catch (error) {
    console.error('Analyses API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete analysis' },
      { status: 500 }
    );
  }
}