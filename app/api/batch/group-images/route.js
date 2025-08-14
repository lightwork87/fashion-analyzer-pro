import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const images = formData.getAll('images');
    
    console.log(`Received ${images.length} images for grouping`);

    // Simple grouping algorithm - in production this would use AI
    // Group images assuming roughly 4-6 images per item
    const groups = [];
    const imagesPerGroup = 5; // Average images per item
    
    // Create groups
    let currentGroup = [];
    for (let i = 0; i < images.length; i++) {
      currentGroup.push(i);
      
      // Create a new group when we hit the target size or it's the last image
      if (currentGroup.length >= imagesPerGroup || i === images.length - 1) {
        groups.push({
          images: [...currentGroup],
          confidence: 0.95
        });
        currentGroup = [];
      }
      
      // Maximum 25 groups
      if (groups.length >= 25) break;
    }

    console.log(`Created ${groups.length} groups from ${images.length} images`);

    return NextResponse.json({ 
      groups,
      totalImages: images.length,
      totalGroups: groups.length
    });

  } catch (error) {
    console.error('Group images error:', error);
    return NextResponse.json(
      { error: 'Failed to group images: ' + error.message },
      { status: 500 }
    );
  }
}