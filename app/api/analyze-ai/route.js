// app/api/analyze-ai/route.js
// REAL AI ANALYSIS WITH GOOGLE VISION + CLAUDE

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Fetch image as base64 from URL
async function fetchImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return base64;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

// Call Google Vision API
async function analyzeWithGoogleVision(imageBase64) {
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 50 },
              { type: 'LABEL_DETECTION', maxResults: 50 },
              { type: 'LOGO_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 50 }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      console.error('Google Vision error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.responses?.[0] || null;
  } catch (error) {
    console.error('Google Vision error:', error);
    return null;
  }
}

// Call Claude for perfect title generation
async function generateListingWithClaude(visionData, imageCount) {
  try {
    // Extract detected information
    const detectedText = visionData?.textAnnotations?.[0]?.description || '';
    const labels = visionData?.labelAnnotations?.map(l => l.description) || [];
    const logos = visionData?.logoAnnotations?.map(l => l.description) || [];
    const objects = visionData?.localizedObjectAnnotations?.map(o => o.name) || [];

    const prompt = `You are an expert eBay fashion reseller. Analyze this clothing item and create a perfect listing.

Detected Information:
- Text found: ${detectedText}
- Visual elements: ${labels.join(', ')}
- Brands/Logos: ${logos.join(', ')}
- Objects: ${objects.join(', ')}
- Number of photos: ${imageCount}

Create a professional eBay listing with:
1. Perfect SEO-optimized title (max 80 chars) with brand, type, size, color, key features
2. Accurate brand identification (remove all punctuation)
3. Realistic resale value for pre-owned items

Return ONLY valid JSON:
{
  "brand": "exact brand name no punctuation",
  "item_type": "specific type",
  "size": "detected size",
  "color": "main color",
  "condition_score": 7,
  "estimated_value_min": 20,
  "estimated_value_max": 40,
  "ebay_title": "Brand Item Type Size Color - Key Feature",
  "description": "professional description",
  "suggested_price": 30,
  "category": "Clothing, Shoes & Accessories",
  "material": "detected material",
  "style": "style",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      console.error('Claude error:', await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    // Extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Claude error:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrls = [] } = body;
    
    if (!imageUrls.length) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    console.log(`Analyzing ${imageUrls.length} images from URLs`);

    // Check user credits
    const { data: userData } = await supabase
      .from('users')
      .select('credits_total, credits_used')
      .eq('clerk_id', userId)
      .single();

    const creditsAvailable = (userData?.credits_total || 50) - (userData?.credits_used || 0);
    
    if (creditsAvailable <= 0) {
      return NextResponse.json({ 
        error: 'No credits available',
        credits_remaining: 0 
      }, { status: 402 });
    }

    // Analyze first image
    let analysis = null;
    
    // Fetch and analyze first image
    const firstImageBase64 = await fetchImageAsBase64(imageUrls[0]);
    
    if (firstImageBase64) {
      console.log('Running AI analysis...');
      const visionData = await analyzeWithGoogleVision(firstImageBase64);
      
      if (visionData) {
        analysis = await generateListingWithClaude(visionData, imageUrls.length);
      }
    }

    // Fallback if AI fails
    if (!analysis) {
      analysis = {
        brand: 'Unknown Brand',
        item_type: 'Clothing Item',
        size: 'Please Check Label',
        color: 'Multi',
        condition_score: 7,
        estimated_value_min: 15,
        estimated_value_max: 35,
        ebay_title: 'Designer Clothing Item - Check Photos for Details',
        description: 'Item shown in photos. Please review all images for condition and details.',
        suggested_price: 25,
        category: 'Clothing, Shoes & Accessories',
        material: 'See label',
        style: 'Fashion',
        keywords: ['clothing', 'fashion', 'designer']
      };
    }

    // Complete the analysis
    const completeAnalysis = {
      ...analysis,
      id: `analysis-${Date.now()}`,
      sku: `${analysis.brand.substring(0, 3).toUpperCase()}-${Date.now()}`,
      images_count: imageUrls.length,
      image_urls: imageUrls,
      credits_remaining: creditsAvailable - 1
    };

    // Save to database
    await supabase.from('analyses').insert({
      user_id: userId,
      ...completeAnalysis
    });

    // Update credits
    await supabase
      .from('users')
      .update({ credits_used: (userData?.credits_used || 0) + 1 })
      .eq('clerk_id', userId);

    return NextResponse.json({
      success: true,
      analysis: completeAnalysis
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Analysis failed'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Analysis API v2.0',
    timestamp: new Date().toISOString()
  });
}