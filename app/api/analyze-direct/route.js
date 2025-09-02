import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { image, fileName, fileSize } = await request.json();

    // Validate base64 size (should be under 3MB after compression)
    const base64Size = (image.length * 3) / 4; // Approximate size
    if (base64Size > 3 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Please use a smaller image.' },
        { status: 413 }
      );
    }

    // Initialize Supabase
    const supabase = getSupabaseClient();
    
    // Create analysis record
    const analysisId = `analysis_${userId}_${Date.now()}`;
    
    if (supabase) {
      // Save to database
      await supabase.from('analyses').insert({
        id: analysisId,
        user_id: userId,
        file_name: fileName,
        file_size: fileSize,
        status: 'processing',
        created_at: new Date().toISOString()
      });
    }

    // TODO: Add actual AI analysis here
    // For now, return mock data
    const mockAnalysis = {
      brand: 'Nike',
      category: 'Footwear',
      condition: 'Good',
      estimatedPrice: { min: 45, max: 75 },
      description: 'Athletic sneakers in good condition',
      tags: ['shoes', 'athletic', 'nike']
    };

    // Update analysis with results
    if (supabase) {
      await supabase.from('analyses')
        .update({
          status: 'completed',
          results: mockAnalysis
        })
        .eq('id', analysisId);
    }

    return NextResponse.json({
      success: true,
      analysisId,
      results: mockAnalysis
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error.message },
      { status: 500 }
    );
  }
}