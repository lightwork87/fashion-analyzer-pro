// app/api/analyze-ai/route.js
// COMPLETE VERSION WITH FULL DEBUGGING TO FIND TITLE ISSUE

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Fetch image from URL and convert to base64
async function fetchImageAsBase64(imageUrl) {
  try {
    console.log('📥 Fetching image:', imageUrl.substring(0, 60) + '...');
    
    const response = await fetch(imageUrl, {
      timeout: 15000,
      headers: { 'User-Agent': 'LightLister-AI/1.0' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    console.log('✅ Image fetched:', Math.round(base64.length / 1024) + 'KB');
    return base64;
    
  } catch (error) {
    console.error('❌ Image fetch failed:', error.message);
    throw error;
  }
}

// Call Google Vision API
async function analyzeWithGoogleVision(imageBase64) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Missing Google Vision API key');
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
    'NORTH FACE', 'PATAGONIA', 'COLUMBIA', 'BERGHAUS', 'FILA', 'PUMA',
    'CHILDISH', 'CHILDRENS'
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

// Generate listing with Claude - WITH FULL DEBUGGING
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

CRITICAL TITLE REQUIREMENTS:
1. Structure: "Brand Item Gender Size Colour Material Keywords"
2. MAX 80 characters - try to hit exactly 80 but NEVER exceed
3. Remove these characters: . , - £ (use spaces instead)
4. UK spelling (Colour not Color, Grey not Gray)

Return ONLY valid JSON:
{
  "brand": "detected brand or Unbranded",
  "item_type": "specific item type",
  "size": "UK size",
  "color": "main colour",
  "condition_score": 7,
  "estimated_value_min": 10,
  "estimated_value_max": 25,
  "ebay_title": "Perfect eBay UK title under 80 chars following structure",
  "description": "Professional description",
  "suggested_price": 15,
  "category": "Clothes, Shoes & Accessories",
  "material": "detected material",
  "style": "style type",
  "gender": "Men's/Women's/Unisex",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    console.log('📝 Claude prompt sent:', prompt.substring(0, 300) + '...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
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
    
    // FULL DEBUGGING - Let's see exactly what Claude returns
    console.log('🔍 DEBUG - Raw Claude response:', content);
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    console.log('🔍 DEBUG - JSON match found:', !!jsonMatch);
    
    if (jsonMatch) {
      console.log('🔍 DEBUG - Raw JSON string:', jsonMatch[0]);
      
      try {
        const listing = JSON.parse(jsonMatch[0]);
        console.log('🔍 DEBUG - Parsed listing object:', listing);
        console.log('🔍 DEBUG - ebay_title field exists:', 'ebay_title' in listing);
        console.log('🔍 DEBUG - ebay_title value:', listing.ebay_title);
        console.log('🔍 DEBUG - ebay_title type:', typeof listing.ebay_title);
        console.log('🔍 DEBUG - ebay_title length:', listing.ebay_title ? listing.ebay_title.length : 'N/A');
        
        // CRITICAL FIX: Generate title if missing or empty
        if (!listing.ebay_title || listing.ebay_title.trim().length === 0) {
          console.log('🔧 TITLE IS MISSING OR EMPTY - Generating fallback title...');
          
          const brand = listing.brand || 'Unbranded';
          const item = listing.item_type || 'T-Shirt';
          const gender = listing.gender?.replace("'s", "s") || 'Unisex';
          const size = listing.size || 'M';
          const color = listing.color || 'Red';
          const material = listing.material || 'Cotton';
          
          // Build title following structure: "Brand Item Gender Size Colour Material Keywords"
          listing.ebay_title = `${brand} ${item} ${gender} Size ${size} ${color} ${material} UK eBay`;
          console.log('🔧 Generated fallback title:', listing.ebay_title);
        } else {
          console.log('✅ Title exists in Claude response:', listing.ebay_title);
        }
        
        // Apply title formatting fixes
        if (listing.ebay_title) {
          const originalTitle = listing.ebay_title;
          listing.ebay_title = listing.ebay_title
            .replace(/[.,-£]/g, ' ') // Remove banned characters
            .replace(/\s+/g, ' ') // Remove double spaces
            .trim(); // Remove leading/trailing spaces
            
          // Enforce 80 character limit
          if (listing.ebay_title.length > 80) {
            listing.ebay_title = listing.ebay_title.substring(0, 80).trim();
          }
          
          console.log('🔧 Title formatting applied:');
          console.log('   Original:', originalTitle);
          console.log('   Formatted:', listing.ebay_title);
          console.log('   Length:', listing.ebay_title.length);
        }
        
        console.log('✅ Final title generated:', listing.ebay_title, `(${listing.ebay_title?.length || 0} chars)`);
        return listing;
        
      } catch (parseError) {
        console.error('❌ Failed to parse Claude JSON:', parseError);
        console.log('🔍 DEBUG - Parse error details:', parseError.message);
        console.log('🔍 DEBUG - Attempting to parse:', jsonMatch[0]);
        return null;
      }
    } else {
      console.error('❌ No JSON found in Claude response');
      console.log('🔍 DEBUG - Full response content:', content);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Claude API error:', error.message);
    console.log('🔍 DEBUG - Error details:', error);
    return null;
  }
}

// Main handler
export async function POST(request) {
  console.log('\n🚀 === AI ANALYSIS REQUEST ===');
  
  try {
    // Get user ID
    let userId = 'temp-user';
    try {
      const authResult = await auth();
      userId = authResult.userId || 'temp-user';
    } catch (authError) {
      console.log('⚠️ Auth bypassed, using temp user');
    }

    const body = await request.json();
    const { imageUrls = [], imageData = [], imageCount } = body;
    const numImages = imageUrls.length + imageData.length || imageCount || 1;
    
    console.log(`📸 Processing ${numImages} images for user ${userId}`);
    
    // Main AI analysis
    let finalListing = null;
    
    if (imageUrls && imageUrls.length > 0) {
      console.log('🔄 Starting AI pipeline...');
      
      // Fetch and analyze first image
      const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
      
      if (imageBase64) {
        console.log('✅ Image fetched, calling Vision API...');
        const visionData = await analyzeWithGoogleVision(imageBase64);
        
        if (visionData) {
          console.log('✅ Vision API complete, extracting fashion details...');
          const fashionDetails = extractFashionDetails(visionData);
          
          console.log('✅ Fashion details extracted, calling Claude...');
          finalListing = await generateListingWithClaude(fashionDetails, visionData, numImages);
          
          console.log('🔍 DEBUG - Final listing from Claude:', finalListing);
          console.log('🔍 DEBUG - Final listing title:', finalListing?.ebay_title);
        } else {
          console.log('❌ Vision API failed');
        }
      } else {
        console.log('❌ Image fetch failed');
      }
    } else {
      console.log('❌ No image URLs provided');
    }
    
    // If AI failed, return error instead of fallback
    if (!finalListing) {
      console.log('❌ AI analysis failed completely');
      return NextResponse.json({
        success: false,
        error: 'AI analysis failed - please try again'
      }, { status: 500 });
    }
    
    // Create complete analysis
    const completeAnalysis = {
      ...finalListing,
      id: `analysis-${Date.now()}`,
      sku: `${(finalListing.brand || 'UNB').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: numImages,
      image_urls: imageUrls,
      credits_remaining: 9,
      analyzed_at: new Date().toISOString()
    };
    
    console.log('🔍 DEBUG - Complete analysis object:', completeAnalysis);
    console.log('🔍 DEBUG - Analysis title field:', completeAnalysis.ebay_title);
    console.log('✅ Analysis complete:', completeAnalysis.ebay_title || 'NO TITLE FOUND');
    
    return NextResponse.json({
      success: true,
      analysis: completeAnalysis
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    console.log('🔍 DEBUG - Fatal error details:', error.stack);
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
    message: 'AI Analysis API - Debug Version with Full Logging',
    apis: {
      googleVision: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    },
    timestamp: new Date().toISOString()
  });
}