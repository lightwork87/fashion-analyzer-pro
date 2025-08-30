// app/api/ai-learning/route.js
// API for handling AI learning and corrections

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Save user correction and update learning
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      analysisId, 
      fieldCorrected, 
      originalValue, 
      correctedValue,
      additionalContext 
    } = body;

    console.log('📝 Saving AI correction:', {
      field: fieldCorrected,
      original: originalValue,
      corrected: correctedValue
    });

    // Save the correction
    const { data: correction, error: correctionError } = await supabase
      .from('ai_corrections')
      .insert({
        analysis_id: analysisId,
        user_id: userId,
        field_corrected: fieldCorrected,
        original_value: originalValue,
        corrected_value: correctedValue,
        correction_metadata: additionalContext || {}
      })
      .select()
      .single();

    if (correctionError) {
      console.error('Error saving correction:', correctionError);
      return NextResponse.json({ error: 'Failed to save correction' }, { status: 500 });
    }

    // Apply learning immediately for brand corrections
    if (fieldCorrected === 'brand') {
      // Check if this pattern exists
      const { data: existing } = await supabase
        .from('brand_learning')
        .select('*')
        .eq('detected_text', originalValue)
        .eq('actual_brand', correctedValue)
        .single();

      if (existing) {
        // Update confidence and count
        await supabase
          .from('brand_learning')
          .update({
            times_confirmed: existing.times_confirmed + 1,
            confidence: Math.min(0.95, existing.confidence + 0.05),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Create new learning entry
        await supabase
          .from('brand_learning')
          .insert({
            detected_text: originalValue,
            actual_brand: correctedValue,
            confidence: 0.7,
            times_confirmed: 1
          });
      }

      console.log('✅ Brand learning updated');
    }

    // Update the original analysis
    const updateData = {};
    updateData[fieldCorrected] = correctedValue;
    
    await supabase
      .from('analyses')
      .update(updateData)
      .eq('id', analysisId);

    return NextResponse.json({
      success: true,
      message: 'Correction saved and learning updated',
      correction
    });

  } catch (error) {
    console.error('Error in AI learning:', error);
    return NextResponse.json(
      { error: 'Failed to process learning' },
      { status: 500 }
    );
  }
}

// Get learning statistics
export async function GET() {
  try {
    const { count: brandPatterns } = await supabase
      .from('brand_learning')
      .select('*', { count: 'exact', head: true });

    const { count: corrections } = await supabase
      .from('ai_corrections')
      .select('*', { count: 'exact', head: true });

    const { data: topBrands } = await supabase
      .from('brand_learning')
      .select('actual_brand, times_confirmed')
      .order('times_confirmed', { ascending: false })
      .limit(10);

    return NextResponse.json({
      stats: {
        totalPatterns: brandPatterns || 0,
        totalCorrections: corrections || 0,
        topBrands: topBrands || []
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}