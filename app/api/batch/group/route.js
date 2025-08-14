import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic to prevent static generation issues
export const dynamic = 'force-dynamic';

// Configure max body size
export const maxDuration = 30; // Max function duration

export async function POST(request) {
  console.log('Batch group API called');
  
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      console.log('Unauthorized - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { images, totalImages } = body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      console.log('No images provided');
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    console.log(`Grouping ${images.length} images into items...`);

    // Simple grouping algorithm
    // Group images by assuming they were uploaded in order
    const groups = [];
    const maxImagesPerGroup = 24; // eBay's max
    const targetGroupCount = Math.min(25, Math.ceil(images.length / 6)); // Aim for ~6 images per group
    const imagesPerGroup = Math.ceil(images.length / targetGroupCount);
    
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
          confidence: 0.7 // Simple grouping confidence
        });
        groupNumber++;
      }
    }

    console.log(`Created ${groups.length} groups from ${images.length} images`);
    console.log('Groups:', groups.map(g => ({
      name: g.suggestedName,
      imageCount: g.indices.length
    })));

    // Return successful response
    return NextResponse.json({ 
      success: true,
      groups: groups,
      totalGroups: groups.length,
      averageImagesPerGroup: Math.round(images.length / groups.length),
      method: 'simple' // We're using simple grouping for now
    });
    
  } catch (error) {
    console.error('Batch grouping error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to group images', 
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