// app/api/analyze-ai/route.js
// FIXED VERSION WITH BETTER AI AND DEBUGGING

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Test if APIs are configured
function checkAPIConfig() {
  const config = {
    googleVision: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
    claude: !!process.env.ANTHROPIC_API_KEY,
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
  };
  
  console.log('🔑 API Configuration:', config);
  
  if (!config.googleVision) {
    console.error('❌ Missing GOOGLE_CLOUD_VISION_API_KEY');
  }
  if (!config.claude) {
    console.error('❌ Missing ANTHROPIC_API_KEY');
  }
  
  return config;
}

// Fetch image from URL
async function fetchImageAsBase64(imageUrl) {
  try {
    console.log('📥 Fetching image from:', imageUrl);
    
    // If it's a Supabase URL, it should be publicly accessible
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch image:', response.status, response.statusText);
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

// Call Google Vision API with better error handling
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
    
    if (!result) {
      console.error('❌ No response from Vision API');
      return null;
    }
    
    // Log what was detected
    console.log('✅ Vision API detected:', {
      hasText: !!(result.textAnnotations?.length > 0),
      textFound: result.textAnnotations?.[0]?.description?.substring(0, 100) || 'No text',
      labelsCount: result.labelAnnotations?.length || 0,
      labels: result.labelAnnotations?.slice(0, 5).map(l => l.description) || [],
      logos: result.logoAnnotations?.map(l => l.description) || [],
      objects: result.localizedObjectAnnotations?.slice(0, 5).map(o => o.name) || []
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Google Vision error:', error.message);
    return null;
  }
}

// Parse vision data to extract fashion info
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
    console.log('📝 All text found:', details.allText);
  }
  
  // Extract from text
  const textUpper = details.allText.toUpperCase();
  const textWords = textUpper.split(/\s+/);
  
  // Common UK fashion brands
  const brandList = [
    'ZARA', 'H&M', 'HM', 'H & M', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK', 
    'TOPSHOP', 'ASOS', 'MARKS & SPENCER', 'M&S', 'UNIQLO', 'GAP', 
    'MANGO', 'COS', 'RIVER ISLAND', 'NEW LOOK', 'BOOHOO', 'MISSGUIDED',
    'RALPH LAUREN', 'TOMMY HILFIGER', 'CALVIN KLEIN', 'LEVI\'S', 'LEVIS',
    'LACOSTE', 'FRED PERRY', 'BURBERRY', 'TED BAKER', 'SUPERDRY',
    'NORTH FACE', 'PATAGONIA', 'COLUMBIA', 'BERGHAUS', 'FILA', 'PUMA',
    'REEBOK', 'NEW BALANCE', 'UNDER ARMOUR', 'CHAMPION', 'VANS', 'CONVERSE'
  ];
  
  // Check for brands in text
  for (const brand of brandList) {
    if (textUpper.includes(brand)) {
      details.possibleBrands.push(brand);
    }
  }
  
  // Check logos
  if (visionData?.logoAnnotations) {
    details.possibleBrands.push(...visionData.logoAnnotations.map(l => l.description.toUpperCase()));
  }
  
  // Size detection - UK specific
  const sizePatterns = [
    /SIZE:?\s*([XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL])\b/i,
    /UK\s*SIZE:?\s*(\d{1,2})/i,
    /UK:?\s*(\d{1,2})/i,
    /SIZE:?\s*UK\s*(\d{1,2})/i,
    /EUR:?\s*(\d{2,3})/i,
    /\b(6|8|10|12|14|16|18|20|22|24)\s*UK\b/i,
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
  
  // Common clothing items
  const clothingTypes = [
    'Shirt', 'T-shirt', 'Dress', 'Jeans', 'Trousers', 'Jacket', 'Coat',
    'Sweater', 'Jumper', 'Hoodie', 'Blazer', 'Skirt', 'Shorts', 'Top',
    'Blouse', 'Cardigan', 'Vest', 'Suit', 'Pants', 'Sweatshirt',
    'Polo shirt', 'Tank top', 'Leggings', 'Joggers', 'Tracksuit'
  ];
  
  // Find clothing items in labels/objects
  const allDetections = [...labels, ...objects];
  for (const item of clothingTypes) {
    if (allDetections.some(d => d.toLowerCase().includes(item.toLowerCase()))) {
      details.itemTypes.push(item);
    }
  }
  
  // Extract colors
  const colorWords = ['Black', 'White', 'Blue', 'Red', 'Green', 'Navy', 'Grey', 
                     'Brown', 'Pink', 'Purple', 'Yellow', 'Orange', 'Beige'];
  
  for (const color of colorWords) {
    if (allDetections.some(d => d.toLowerCase().includes(color.toLowerCase()))) {
      details.colors.push(color);
    }
  }
  
  console.log('🔍 Extracted details:', details);
  
  return details;
}

// Generate listing with Claude - UK specific
async function generatePerfectListing(fashionDetails, visionData, imageCount) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Claude API key');
    return null;
  }
  
  try {
    console.log('🤖 Calling Claude with fashion details...');
    
    // Get all labels and objects for context
    const labels = visionData?.labelAnnotations?.map(l => l.description).join(', ') || 'none';
    const objects = visionData?.localizedObjectAnnotations?.map(o => o.name).join(', ') || 'none';
    
    const prompt = `You are an expert UK eBay fashion seller. Analyze this item and create a perfect listing.

ITEM DETAILS FROM IMAGE ANALYSIS:
- Text found on item/labels: "${fashionDetails.allText}"
- Detected brands: ${fashionDetails.possibleBrands.join(', ') || 'None detected'}
- Detected sizes: ${fashionDetails.possibleSizes.join(', ') || 'None detected'}
- Visual labels detected: ${labels}
- Objects detected: ${objects}
- Colors found: ${fashionDetails.colors.join(', ') || 'Not detected'}
- Possible item types: ${fashionDetails.itemTypes.join(', ') || 'Not detected'}
- Number of photos: ${imageCount}

IMPORTANT RULES:
1. Create a perfect eBay UK title (MAXIMUM 80 characters) using this format:
   [Brand] [Gender] [Item Type] [Color] [Key Feature] Size [Size] [Condition]
   Example: "Nike Men's Running T-Shirt Black Dri-Fit Size L Excellent Condition"

2. Determine the EXACT item type from the visual analysis. Never use generic terms like "Fashion Item"

3. If no brand is clearly detected, use "Unbranded" not "Unknown"

4. Use UK sizing and spelling (colour, jumper not sweater, trousers not pants)

5. Price in GBP (£) based on UK second-hand market

6. For condition: 10=New with tags, 9=New without tags, 7-8=Excellent used, 5-6=Good used

Return ONLY this JSON (no other text):
{
  "brand": "detected brand or Unbranded",
  "item_type": "specific item type (e.g., T-Shirt, Dress, Jeans)",
  "size": "UK size or size detected",
  "color": "main colour",
  "condition_score": 7,
  "estimated_value_min": 10,
  "estimated_value_max": 25,
  "ebay_title": "Your perfect title under 80 chars",
  "description": "Professional eBay description",
  "suggested_price": 15,
  "category": "Clothes, Shoes & Accessories > [Subcategory]",
  "material": "detected or common material",
  "style": "style (Casual, Formal, Sportswear, etc)",
  "gender": "Men's/Women's/Unisex/Kids'",
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
        temperature: 0.2, // Lower temperature for more consistent output
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
    
    console.log('📝 Claude raw response:', content);
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in Claude response');
      return null;
    }
    
    try {
      const listing = JSON.parse(jsonMatch[0]);
      console.log('✅ Generated listing:', listing);
      return listing;
    } catch (e) {
      console.error('❌ Failed to parse Claude JSON:', e);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Claude API error:', error.message);
    return null;
  }
}

// Main handler
export async function POST(request) {
  console.log('\n🚀 === NEW ANALYSIS REQUEST ===');
  
  // Check API configuration
  const apiConfig = checkAPIConfig();
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrls = [], imageCount } = body;
    const numImages = imageUrls.length || imageCount || 1;
    
    console.log(`📸 Analyzing ${numImages} images for user ${userId}`);
    
    // Get user credits
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

    // MAIN AI ANALYSIS
    let finalListing = null;
    let debugInfo = { step: 'starting' };
    
    if (imageUrls && imageUrls.length > 0 && apiConfig.googleVision && apiConfig.claude) {
      console.log('🎯 Starting AI analysis with image:', imageUrls[0]);
      
      // Step 1: Fetch image
      debugInfo.step = 'fetching_image';
      const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
      
      if (imageBase64) {
        // Step 2: Google Vision
        debugInfo.step = 'google_vision';
        const visionData = await analyzeWithGoogleVision(imageBase64);
        
        if (visionData) {
          debugInfo.visionSuccess = true;
          
          // Step 3: Extract fashion details
          debugInfo.step = 'extracting_details';
          const fashionDetails = extractFashionDetails(visionData);
          debugInfo.extractedBrands = fashionDetails.possibleBrands;
          debugInfo.extractedSizes = fashionDetails.possibleSizes;
          
          // Step 4: Generate with Claude
          debugInfo.step = 'claude_generation';
          finalListing = await generatePerfectListing(fashionDetails, visionData, numImages);
          
          if (finalListing) {
            debugInfo.claudeSuccess = true;
          }
        }
      }
    }
    
    // If AI failed, create smart fallback
    if (!finalListing) {
      console.log('⚠️ AI failed at step:', debugInfo.step);
      console.log('📋 Debug info:', debugInfo);
      
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
        keywords: ["clothing", "fashion", "uk"],
        debug_info: debugInfo // Include debug info to see what went wrong
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
    console.log('📊 Final result:', {
      brand: completeAnalysis.brand,
      type: completeAnalysis.item_type,
      title: completeAnalysis.ebay_title
    });
    
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

export async function GET() {
  const config = checkAPIConfig();
  
  return NextResponse.json({
    status: 'ok',
    message: 'AI Analysis API v4.0 - UK Edition',
    apis: config,
    timestamp: new Date().toISOString()
  });
}