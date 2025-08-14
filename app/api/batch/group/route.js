import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Helper function to call Claude API
async function analyzeImagesWithAI(thumbnails) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are analyzing fashion item photos for an eBay listing tool. Group these ${thumbnails.length} thumbnail images into separate items. Each item can have multiple photos (front, back, label, etc).

Rules:
1. Group photos that show the same item from different angles
2. Maximum 24 photos per item
3. Look for visual similarities: color, pattern, style
4. Return JSON only with this format:
{
  "groups": [
    {
      "indices": [0, 1, 2],
      "suggestedName": "Blue Floral Dress",
      "confidence": 0.95
    }
  ]
}

Analyze these images and group them appropriately.`
            },
            ...thumbnails.slice(0, 50).map((img, idx) => ({
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: img.thumbnail.split(',')[1]
              }
            }))
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('AI analysis failed');
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse the JSON response
    const result = JSON.parse(content);
    return result.groups;
    
  } catch (error) {
    console.error('AI grouping error:', error);
    // Fall back to simple grouping
    return null;
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { images, totalImages } = await request.json();
    
    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    console.log(`Grouping ${images.length} images into items...`);

    let groups = [];

    // Try AI grouping first
    if (process.env.ANTHROPIC_API_KEY) {
      groups = await analyzeImagesWithAI(images);
    }

    // Fall back to simple grouping if AI fails
    if (!groups || groups.length === 0) {
      console.log('Using simple grouping algorithm...');
      
      const imagesPerItem = Math.max(1, Math.min(24, Math.ceil(images.length / 25)));
      
      for (let i = 0; i < images.length; i += imagesPerItem) {
        const groupIndices = [];
        for (let j = i; j < Math.min(i + imagesPerItem, images.length); j++) {
          groupIndices.push(j);
        }
        
        groups.push({
          indices: groupIndices,
          suggestedName: `Item ${groups.length + 1}`,
          confidence: 0.5
        });
      }
    }

    console.log(`Created ${groups.length} groups from ${images.length} images`);

    return NextResponse.json({ 
      groups,
      totalGroups: groups.length,
      averageImagesPerGroup: Math.round(images.length / groups.length),
      method: groups[0]?.confidence > 0.5 ? 'ai' : 'simple'
    });
    
  } catch (error) {
    console.error('Batch grouping error:', error);
    return NextResponse.json(
      { error: 'Failed to group images' },
      { status: 500 }
    );
  }
}