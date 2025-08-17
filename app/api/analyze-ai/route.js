// app/api/analyze-ai/route.js
// COMPLETE UPDATED VERSION WITH SINGLETON SUPABASE

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/app/lib/supabase-client';

const supabase = getSupabaseClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Fetch image from URL and convert to base64
async function fetchImageAsBase64(imageUrl) {
  try {
    console.log('📥 Fetching image from:', imageUrl);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch image:', response.status);
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    console.log('✅ Image fetched, size:', Math.round(base64.length / 1024), 'KB');
    return base64;
    
  } catch (error) {
    console.error('❌ Error fetching image:', error.message);
    return null;
  }
}

// Call Google Vision API
async function analyzeWithGoogleVision(imageBase64) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Google Vision API key');
    return null;
  }
  
  try {
    console.log('🔍 Calling Google Vision API...');
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 10 },
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'LOGO_DETECTION', maxResults: 5 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
            ]
          }]
        })
      }
    );

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Google Vision API error:', response.status, responseText);
      return null;
    }

    const data = JSON.parse(responseText);
    const result = data.responses?.[0];
    
    if (result) {
      console.log('✅ Vision API detected:', {
        textFound: !!(result.textAnnotations?.length > 0),
        firstText: result.textAnnotations?.[0]?.description?.substring(0, 100) || 'No text',
        labelsCount: result.labelAnnotations?.length || 0,
        labels: result.labelAnnotations?.slice(0, 5).map(l => l.description) || [],
        logos: result.logoAnnotations?.map(l => l.description) || [],
        objects: result.localizedObjectAnnotations?.slice(0, 5).map(o => o.name) || []
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Google Vision error:', error.message);
    return null;
  }
}

// Extract fashion details from vision data
function extractFashionDetails(visionData) {
  const details = {
    allText: '',
    possibleBrands: [],
    possibleSizes: [],
    itemTypes: [],
    colors: [],
    materials: []
  };
  
  // Get all text
  if (visionData?.textAnnotations?.length > 0) {
    details.allText = visionData.textAnnotations[0].description || '';
    console.log('📝 Text found:', details.allText.substring(0, 200));
  }
  
  // Extract from text
  const textUpper = details.allText.toUpperCase();
  
  // Common UK fashion brands
  const brandList = [
    'ZARA', 'H&M', 'HM', 'H & M', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK', 
    'TOPSHOP', 'ASOS', 'MARKS & SPENCER', 'M&S', 'UNIQLO', 'GAP', 
    'MANGO', 'COS', 'RIVER ISLAND', 'NEW LOOK', 'BOOHOO', 'MISSGUIDED',
    'RALPH LAUREN', 'TOMMY HILFIGER', 'CALVIN KLEIN', 'LEVI\'S', 'LEVIS',
    'LACOSTE', 'FRED PERRY', 'BURBERRY', 'TED BAKER', 'SUPERDRY',
    'NORTH FACE', 'PATAGONIA', 'COLUMBIA', 'BERGHAUS', 'FILA', 'PUMA'
  ];
  
  // Check for brands
  for (const brand of brandList) {
    if (textUpper.includes(brand)) {
      details.possibleBrands.push(brand);
    }
  }
  
  // Check logos
  if (visionData?.logoAnnotations) {
    details.possibleBrands.push(...visionData.logoAnnotations.map(l => l.description.toUpperCase()));
  }
  
  // Size detection
  const sizePatterns = [
    /SIZE:?\s*([XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL])\b/i,
    /UK\s*SIZE:?\s*(\d{1,2})/i,
    /SIZE:?\s*UK\s*(\d{1,2})/i,
    /EUR:?\s*(\d{2,3})/i,
    /\b(XS|S|M|L|XL|XXL)\b/
  ];
  
  for (const pattern of sizePatterns) {
    const match = textUpper.match(pattern);
    if (match) {
      details.possibleSizes.push(match[1]);
    }
  }
  
  // Get item types from labels and objects
  const labels = visionData?.labelAnnotations?.map(l => l.description) || [];
  const objects = visionData?.localizedObjectAnnotations?.map(o => o.name) || [];
  
  const clothingTypes = [
    'Shirt', 'T-shirt', 'Dress', 'Jeans', 'Trousers', 'Jacket', 'Coat',
    'Sweater', 'Jumper', 'Hoodie', 'Blazer', 'Skirt', 'Shorts', 'Top',
    'Blouse', 'Cardigan', 'Vest', 'Suit', 'Pants', 'Sweatshirt'
  ];
  
  const allDetections = [...labels, ...objects];
  for (const item of clothingTypes) {
    if (allDetections.some(d => d.toLowerCase().includes(item.toLowerCase()))) {
      details.itemTypes.push(item);
    }
  }
  
  // Extract colors
  const colorWords = ['Black', 'White', 'Blue', 'Red', 'Green', 'Navy', 'Grey', 'Brown', 'Pink'];
  for (const color of colorWords) {
    if (allDetections.some(d => d.toLowerCase().includes(color.toLowerCase()))) {
      details.colors.push(color);
    }
  }
  
  console.log('🔍 Extracted details:', details);
  return details;
}

// Generate listing with Claude
async function generateListingWithClaude(fashionDetails, visionData, imageCount) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Claude API key');
    return null;
  }
  
  try {
    console.log('🤖 Calling Claude API...');
    
    const labels = visionData?.labelAnnotations?.map(l => l.description).join(', ') || 'none';
    const objects = visionData?.localizedObjectAnnotations?.map(o => o.name).join(', ') || 'none';
    
    const prompt = `You are an expert UK eBay fashion seller. Create a perfect listing based on this item analysis.

DETECTED INFORMATION:
- Text from labels/tags: "${fashionDetails.allText}"
- Possible brands: ${fashionDetails.possibleBrands.join(', ') || 'None detected'}
- Possible sizes: ${fashionDetails.possibleSizes.join(', ') || 'None detected'}
- Visual labels: ${labels}
- Objects detected: ${objects}
- Colors: ${fashionDetails.colors.join(', ') || 'Not detected'}
- Item types: ${fashionDetails.itemTypes.join(', ') || 'Not detected'}

REQUIREMENTS:
1. Create an eBay UK title (MAX 80 characters) format: [Brand] [Gender] [Item Type] [Color] Size [Size] [Condition]
2. If no brand detected, use "Unbranded"
3. Determine specific item type from the analysis
4. Use UK spelling and sizing
5. Price in GBP (£) for UK market

Return ONLY valid JSON:
{
  "brand": "detected brand or Unbranded",
  "item_type": "specific item type",
  "size": "UK size",
  "color": "main colour",
  "condition_score": 7,
  "estimated_value_min": 10,
  "estimated_value_max": 25,
  "ebay_title": "Perfect eBay UK title under 80 chars",
  "description": "Professional description with bullet points",
  "suggested_price": 15,
  "category": "Clothes, Shoes & Accessories",
  "material": "detected material",
  "style": "style type",
  "gender": "Men's/Women's/Unisex",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Claude API error:', response.status, responseText);
      return null;
    }

    const data = JSON.parse(responseText);
    const content = data.content?.[0]?.text || '';
    
    console.log('📝 Claude response received');
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const listing = JSON.parse(jsonMatch[0]);
        console.log('✅ Listing generated:', listing.ebay_title);
        return listing;
      } catch (e) {
        console.error('❌ Failed to parse Claude JSON:', e);
        return null;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Claude API error:', error.message);
    return null;
  }
}

// Main handler
export async function POST(request) {
  console.log('\n🚀 === NEW ANALYSIS REQUEST ===');
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrls = [], imageCount } = body;
    const numImages = imageUrls.length || imageCount || 1;
    
    console.log(`📸 Processing ${numImages} images for user ${userId}`);
    
    // Get or create user
    let { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: `user-${userId}@example.com`,
          credits_total: 50,
          credits_used: 0,
          bonus_credits: 0
        })
        .select()
        .single();
      userData = newUser;
    }

    const creditsAvailable = (userData?.credits_total || 0) - (userData?.credits_used || 0) + (userData?.bonus_credits || 0);
    
    if (creditsAvailable <= 0) {
      return NextResponse.json({ 
        error: 'No credits available',
        credits_remaining: 0 
      }, { status: 402 });
    }

    // Main AI analysis
    let finalListing = null;
    
    if (imageUrls && imageUrls.length > 0) {
      // Fetch and analyze first image
      const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
      
      if (imageBase64) {
        const visionData = await analyzeWithGoogleVision(imageBase64);
        
        if (visionData) {
          const fashionDetails = extractFashionDetails(visionData);
          finalListing = await generateListingWithClaude(fashionDetails, visionData, numImages);
        }
      }
    }
    
    // If AI failed, use fallback
    if (!finalListing) {
      console.log('⚠️ Using fallback listing');
      finalListing = {
        brand: "Unbranded",
        item_type: "Clothing Item",
        size: "See Label",
        color: "Multi",
        condition_score: 7,
        estimated_value_min: 8,
        estimated_value_max: 20,
        ebay_title: "Unbranded Clothing Item - Please See Photos for Details",
        description: `Item as shown in photos.

- Condition: Good pre-owned condition
- Please check all photos for size, brand, and item details

Ships within 1 business day via Royal Mail.`,
        suggested_price: 12,
        category: "Clothes, Shoes & Accessories",
        material: "See label",
        style: "Casual",
        gender: "Unisex",
        keywords: ["clothing", "fashion", "uk"]
      };
    }
    
    // Create complete analysis
    const completeAnalysis = {
      ...finalListing,
      id: `analysis-${Date.now()}`,
      sku: `${(finalListing.brand || 'UNB').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: numImages,
      image_urls: imageUrls,
      credits_remaining: creditsAvailable - 1,
      analyzed_at: new Date().toISOString()
    };
    
    // Save to database
    await supabase.from('analyses').insert({
      user_id: userId,
      brand: completeAnalysis.brand,
      item_type: completeAnalysis.item_type,
      size: completeAnalysis.size,
      condition_score: completeAnalysis.condition_score,
      estimated_value_min: completeAnalysis.estimated_value_min,
      estimated_value_max: completeAnalysis.estimated_value_max,
      ebay_title: completeAnalysis.ebay_title,
      description: completeAnalysis.description,
      suggested_price: completeAnalysis.suggested_price,
      category: completeAnalysis.category,
      sku: completeAnalysis.sku,
      images_count: completeAnalysis.images_count,
      metadata: completeAnalysis
    });
    
    // Update credits
    await supabase
      .from('users')
      .update({ credits_used: (userData?.credits_used || 0) + 1 })
      .eq('clerk_id', userId);
    
    console.log('✅ Analysis complete:', completeAnalysis.ebay_title);
    
    return NextResponse.json({
      success: true,
      analysis: completeAnalysis
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Analysis API v4.0 - UK Edition',
    apis: {
      googleVision: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    },
    timestamp: new Date().toISOString()
  });
}