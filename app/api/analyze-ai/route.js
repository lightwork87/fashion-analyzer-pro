import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../lib/supabase';

// Route segment config for App Router
export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Import AI analysis functions (adjust path if needed)
let analyzeImages;
try {
  const aiModule = require('./aiIntegration');
  analyzeImages = aiModule.analyzeImages || aiModule.default;
} catch (error) {
  console.error('Failed to import AI integration:', error);
}

export async function POST(request) {
  console.log('Analyze AI endpoint called');
  
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      console.log('Unauthorized - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check credits
    const totalCredits = (user.credits_total || 0) + (user.bonus_credits || 0);
    const creditsUsed = user.credits_used || 0;
    const creditsRemaining = totalCredits - creditsUsed;

    console.log(`User ${userId} has ${creditsRemaining} credits remaining`);

    if (creditsRemaining < 1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 403 });
    }

    // Parse form data
    let formData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      console.error('Failed to parse form data:', parseError);
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const images = formData.getAll('images');
    const batchMode = formData.get('batchMode') === 'true';
    const groupIndex = formData.get('groupIndex');
    const suggestedName = formData.get('suggestedName');
    
    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    console.log(`Analyzing ${images.length} images for user ${userId}`);
    console.log(`Batch mode: ${batchMode}, Group index: ${groupIndex}`);

    // Check total size
    let totalSize = 0;
    images.forEach(image => {
      totalSize += image.size;
    });
    
    console.log(`Total upload size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Size limit check (10MB total)
    if (totalSize > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Total file size exceeds 10MB limit' }, { status: 413 });
    }

    // Convert images to base64 for AI analysis
    const base64Images = await Promise.all(
      images.map(async (image, index) => {
        try {
          const buffer = await image.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          console.log(`Image ${index}: ${image.name}, ${(image.size / 1024).toFixed(2)} KB`);
          return `data:${image.type || 'image/jpeg'};base64,${base64}`;
        } catch (err) {
          console.error(`Failed to process image ${index}:`, err);
          return null;
        }
      })
    );

    // Filter out any failed conversions
    const validImages = base64Images.filter(img => img !== null);
    
    if (validImages.length === 0) {
      return NextResponse.json({ error: 'Failed to process images' }, { status: 500 });
    }

    // Analyze with AI
    let analysisResult;
    
    if (analyzeImages && typeof analyzeImages === 'function') {
      console.log('Using AI integration for analysis');
      analysisResult = await analyzeImages(validImages);
    } else {
      console.log('AI integration not available, using fallback');
      // Fallback analysis for testing
      analysisResult = {
        brand: 'Unknown Brand',
        category: 'Fashion Item',
        itemType: 'Clothing',
        size: 'Medium',
        condition: 'Good',
        conditionScore: 7,
        color: 'Multi',
        material: 'Mixed Materials',
        style: 'Casual',
        title: suggestedName || `Fashion Item - ${new Date().toISOString().split('T')[0]}`,
        description: 'Fashion item ready for listing. Please add more details.',
        minPrice: 10,
        maxPrice: 30,
        price: 20,
        sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ebayTitle: suggestedName || 'Fashion Item - Please Update Title',
        tags: ['fashion', 'clothing']
      };
    }

    console.log('Analysis complete:', analysisResult);

    // Deduct credit
    const { error: creditError } = await supabase
      .from('users')
      .update({ credits_used: creditsUsed + 1 })
      .eq('id', user.id);

    if (creditError) {
      console.error('Failed to deduct credit:', creditError);
      // Continue anyway - don't fail the analysis
    }

    // Record credit usage
    const { error: usageError } = await supabase
      .from('credit_usage')
      .insert({
        user_id: user.id,
        credits_used: 1,
        image_count: images.length,
        analysis_type: 'fashion',
        created_at: new Date().toISOString()
      });

    if (usageError) {
      console.error('Failed to record usage:', usageError);
    }

    // Save analysis to database
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        images_count: images.length,
        brand: analysisResult.brand,
        item_type: analysisResult.itemType || analysisResult.category,
        condition_score: analysisResult.conditionScore,
        estimated_value_min: analysisResult.minPrice || analysisResult.price,
        estimated_value_max: analysisResult.maxPrice || analysisResult.price,
        sku: analysisResult.sku,
        ebay_title: analysisResult.title || analysisResult.ebayTitle,
        description: analysisResult.description,
        is_draft: false,
        is_listed: false,
        metadata: analysisResult,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Failed to save analysis:', analysisError);
      // Continue anyway - return the analysis result
    }

    // Return the complete analysis result
    return NextResponse.json({
      id: analysis?.id || `temp-${Date.now()}`,
      ...analysisResult,
      creditsRemaining: creditsRemaining - 1,
      batchMode: batchMode,
      groupIndex: groupIndex
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Handle other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}