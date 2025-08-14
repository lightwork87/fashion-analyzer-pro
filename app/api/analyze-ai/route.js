import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { analyzeImages } from './aiIntegration';
import { supabase } from '../../lib/supabase';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check credits
    const totalCredits = (user.credits_total || 0) + (user.bonus_credits || 0);
    const creditsUsed = user.credits_used || 0;
    const creditsRemaining = totalCredits - creditsUsed;

    if (creditsRemaining < 1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 403 });
    }

    const formData = await request.formData();
    const images = formData.getAll('images');
    
    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    console.log(`Analyzing ${images.length} images for user ${userId}`);

    // Convert images to base64 for AI analysis
    const base64Images = await Promise.all(
      images.map(async (image) => {
        const buffer = await image.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:${image.type};base64,${base64}`;
      })
    );

    // Analyze with AI
    const analysisResult = await analyzeImages(base64Images);

    // Deduct credit
    const { error: creditError } = await supabase
      .from('users')
      .update({ credits_used: creditsUsed + 1 })
      .eq('id', user.id);

    if (creditError) {
      console.error('Failed to deduct credit:', creditError);
    }

    // Save analysis to database
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        images_count: images.length,
        brand: analysisResult.brand,
        item_type: analysisResult.category,
        condition_score: analysisResult.conditionScore,
        estimated_value_min: analysisResult.minPrice,
        estimated_value_max: analysisResult.maxPrice,
        sku: analysisResult.sku,
        ebay_title: analysisResult.title,
        description: analysisResult.description,
        metadata: analysisResult
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Failed to save analysis:', analysisError);
    }

    return NextResponse.json({
      id: analysis?.id,
      ...analysisResult,
      creditsRemaining: creditsRemaining - 1
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error.message },
      { status: 500 }
    );
  }
}