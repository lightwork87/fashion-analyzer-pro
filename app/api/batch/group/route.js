import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic to prevent static generation issues
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request) {
  console.log('[Batch Group API] Request received');
  
  try {
    // Check authentication
    const authResult = await auth();
    console.log('[Batch Group API] Auth result:', authResult);
    
    const { userId } = authResult;
    
    if (!userId) {
      console.log('[Batch Group API] Unauthorized - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Batch Group API] User authenticated:', userId);

    // Parse request body
    let body;
    try {
      const text = await request.text();
      console.log('[Batch Group API] Request body length:', text.length);
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('[Batch Group API] Failed to parse request body:', parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { images, totalImages } = body;
    
    console.log('[Batch Group API] Received data:', {
      imagesCount: images?.length,
      totalImages: totalImages,
      firstImageSample: images?.[0] ? {
        index: images[0].index,
        thumbnailLength: images[0].thumbnail?.length,
        name: images[0].name
      } : null
    });
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      console.log('[Batch Group API] No images provided');
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    console.log(`[Batch Group API] Grouping ${images.length} images into items...`);

    // Simple grouping algorithm
    const groups = [];
    const maxImagesPerGroup = 24;
    const targetGroupCount = Math.min(25, Math.ceil(images.length / 6));
    const imagesPerGroup = Math.ceil(images.length / targetGroupCount);
    
    console.log('[Batch Group API] Grouping strategy:', {
      targetGroupCount,
      imagesPerGroup,
      maxImagesPerGroup
    });
    
    let currentIndex = 0;
    let groupNumber = 1;
    
    while (currentIndex < images.length && groups.length < 25) {
      const groupSize = Math.min(
        imagesPerGroup,
        maxImagesPerGroup,
        images.length - currentIndex
      );
      
      const groupIndices = [];
      for (let i = 0; i < groupSize && currentIndex < images.length; i++) {
        groupIndices.push(currentIndex);
        currentIndex++;
      }
      
      if (groupIndices.length > 0) {
        groups.push({
          indices: groupIndices,
          suggestedName: `Item ${groupNumber}`,
          confidence: 0.7
        });
        groupNumber++;
      }
    }

    console.log(`[Batch Group API] Created ${groups.length} groups`);
    console.log('[Batch Group API] Groups detail:', groups.map(g => ({
      name: g.suggestedName,
      imageCount: g.indices.length,
      indices: g.indices
    })));

    const response = { 
      success: true,
      groups: groups,
      totalGroups: groups.length,
      averageImagesPerGroup: Math.round(images.length / groups.length),
      method: 'simple'
    };

    console.log('[Batch Group API] Sending response');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[Batch Group API] Error:', error);
    console.error('[Batch Group API] Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to group images', 
        details: error.message,
        type: error.name
      },
      { status: 500 }
    );
  }
}

// Handle other methods
export async function GET() {
  console.log('[Batch Group API] GET request received (not allowed)');
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}