// app/api/analyze-ai/route.js
// ENHANCED VERSION WITH DETAILED DEBUGGING

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/app/lib/supabase-client';

const supabase = getSupabaseClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Test API keys on startup
console.log('🔑 API Keys Status:', {
  googleVision: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
  googleVisionLength: process.env.GOOGLE_CLOUD_VISION_API_KEY?.length || 0,
  claude: !!process.env.ANTHROPIC_API_KEY,
  claudeLength: process.env.ANTHROPIC_API_KEY?.length || 0
});

// Fetch image from URL and convert to base64
async function fetchImageAsBase64(imageUrl) {
  try {
    console.log('📥 Fetching image from:', imageUrl);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'LightListerAI/1.0'
      }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch image:', response.status, response.statusText);
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    console.log('✅ Image fetched successfully, size:', Math.round(base64.length / 1024), 'KB');
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
    console.error('❌ CRITICAL: No Google Vision API key found in environment variables');
    return null;
  }
  
  console.log('🔍 Google Vision API Key present, length:', apiKey.length);
  
  try {
    console.log('🔍 Calling Google Vision API...');
    
    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    const requestBody = {
      requests: [{
        image: { content: imageBase64 },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 10 },
          { type: 'LABEL_DETECTION', maxResults: 20 },
          { type: 'LOGO_DETECTION', maxResults: 5 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
        ]
      }]
    };
    
    console.log('📤 Sending request to Google Vision...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('📥 Google Vision response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Google Vision API error:', response.status);
      console.error('❌ Error details:', responseText);
      
      // Check for common errors
      if (responseText.includes('API key not valid')) {
        console.error('❌ CRITICAL: Google Vision API key is invalid!');
      }
      if (responseText.includes('PERMISSION_DENIED')) {
        console.error('❌ CRITICAL: Google Vision API not enabled for this project!');
      }
      
      return null;
    }

    const data = JSON.parse(responseText);
    const result = data.responses?.[0];
    
    if (result?.error) {
      console.error('❌ Google Vision returned error:', result.error);
      return null;
    }
    
    if (result) {
      console.log('✅ Vision API Success! Results:', {
        hasText: !!(result.textAnnotations?.length > 0),
        textCount: result.textAnnotations?.length || 0,
        firstText: result.textAnnotations?.[0]?.description?.substring(0, 100) || 'No text',
        labelsCount: result.labelAnnotations?.length || 0,
        labels: result.labelAnnotations?.slice(0, 5).map(l => l.description) || [],
        logosCount: result.logoAnnotations?.length || 0,
        logos: result.logoAnnotations?.map(l => l.description) || [],
        objectsCount: result.localizedObjectAnnotations?.length || 0,
        objects: result.localizedObjectAnnotations?.slice(0, 5).map(o => o.name) || []
      });
    } else {
      console.log('⚠️ No results from Vision API');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Google Vision fatal error:', error.message);
    console.error('Full error:', error);
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
    console.log('📝 Full text detected:', details.allText);
  } else {
    console.log('⚠️ No text detected in image');
  }
  
  // Extract from text
  const textUpper = details.allText.toUpperCase();
  
  // Common UK fashion brands (expanded list)
  const brandList = [
    'ZARA', 'H&M', 'HM', 'H & M', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK', 
    'TOPSHOP', 'ASOS', 'MARKS & SPENCER', 'M&S', 'UNIQLO', 'GAP', 
    'MANGO', 'COS', 'RIVER ISLAND', 'NEW LOOK', 'BOOHOO', 'MISSGUIDED',
    'RALPH LAUREN', 'TOMMY HILFIGER', 'CALVIN KLEIN', 'LEVI\'S', 'LEVIS',
    'LACOSTE', 'FRED PERRY', 'BURBERRY', 'TED BAKER', 'SUPERDRY',
    'NORTH FACE', 'PATAGONIA', 'COLUMBIA', 'BERGHAUS', 'FILA', 'PUMA',
    'REEBOK', 'CONVERSE', 'VANS', 'CHAMPION', 'UMBRO', 'KAPPA'
  ];
  
  // Check for brands in text
  console.log('🔍 Checking for brands in text...');
  for (const brand of brandList) {
    if (textUpper.includes(brand)) {
      details.possibleBrands.push(brand);
      console.log('✅ Found brand in text:', brand);
    }
  }
  
  // Check logos
  if (visionData?.logoAnnotations) {
    console.log('🔍 Logos detected:', visionData.logoAnnotations.map(l => l.description));
    details.possibleBrands.push(...visionData.logoAnnotations.map(l => l.description.toUpperCase()));
  }
  
  // Size detection with more patterns
  const sizePatterns = [
    /SIZE:?\s*([XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL])\b/i,
    /\b([XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL])\b/,
    /UK\s*SIZE:?\s*(\d{1,2})/i,
    /SIZE:?\s*UK\s*(\d{1,2})/i,
    /EUR:?\s*(\d{2,3})/i,
    /US:?\s*(\d{1,2})/i,
    /\b(\d{1,2})\s*UK\b/i
  ];
  
  console.log('🔍 Checking for sizes...');
  for (const pattern of sizePatterns) {
    const match = textUpper.match(pattern);
    if (match) {
      details.possibleSizes.push(match[1]);
      console.log('✅ Found size:', match[1]);
    }
  }
  
  // Get item types from labels and objects
  const labels = visionData?.labelAnnotations?.map(l => l.description) || [];
  const objects = visionData?.localizedObjectAnnotations?.map(o => o.name) || [];
  
  console.log('🔍 Labels from image:', labels.slice(0, 10));
  console.log('🔍 Objects detected:', objects);
  
  const clothingTypes = [
    'Shirt', 'T-shirt', 'Dress', 'Jeans', 'Trousers', 'Jacket', 'Coat',
    'Sweater', 'Jumper', 'Hoodie', 'Blazer', 'Skirt', 'Shorts', 'Top',
    'Blouse', 'Cardigan', 'Vest', 'Suit', 'Pants', 'Sweatshirt',
    'Polo', 'Tank top', 'Leggings', 'Joggers', 'Tracksuit', 'Windbreaker'
  ];
  
  const allDetections = [...labels, ...objects];
  for (const item of clothingTypes) {
    if (allDetections.some(d => d.toLowerCase().includes(item.toLowerCase()))) {
      details.itemTypes.push(item);
      console.log('✅ Found item type:', item);
    }
  }
  
  // Extract colors
  const colorWords = ['Black', 'White', 'Blue', 'Red', 'Green', 'Navy', 'Grey', 'Brown', 'Pink', 'Beige', 'Purple', 'Yellow', 'Orange'];
  for (const color of colorWords) {
    if (allDetections.some(d => d.toLowerCase().includes(color.toLowerCase()))) {
      details.colors.push(color);
    }
  }
  
  console.log('📊 Final extracted details:', {
    brandsFound: details.possibleBrands.length,
    sizesFound: details.possibleSizes.length,
    itemTypesFound: details.itemTypes.length,
    colorsFound: details.colors.length
  });
  
  return details;
}

// Generate listing with Claude
async function generateListingWithClaude(fashionDetails, visionData, imageCount) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ CRITICAL: No Claude API key found in environment variables');
    return null;
  }
  
  console.log('🤖 Claude API Key present, length:', apiKey.length);
  
  try {
    console.log('🤖 Preparing Claude request...');
    
    const labels = visionData?.labelAnnotations?.map(l => l.description).join(', ') || 'none';
    const objects = visionData?.localizedObjectAnnotations?.map(o => o.name).join(', ') || 'none';
    
    const prompt = `You are an expert UK eBay fashion seller. Create a perfect listing based on this item analysis.

DETECTED INFORMATION:
- Text from labels/tags: "${fashionDetails.allText || 'No text detected'}"
- Possible brands detected: ${fashionDetails.possibleBrands.length > 0 ? fashionDetails.possibleBrands.join(', ') : 'None'}
- Possible sizes detected: ${fashionDetails.possibleSizes.length > 0 ? fashionDetails.possibleSizes.join(', ') : 'None'}
- Visual labels: ${labels}
- Objects detected: ${objects}
- Colors detected: ${fashionDetails.colors.length > 0 ? fashionDetails.colors.join(', ') : 'None'}
- Item types detected: ${fashionDetails.itemTypes.length > 0 ? fashionDetails.itemTypes.join(', ') : 'None'}

IMPORTANT: Based on the detected information above, create a specific listing. If you can identify the brand from the text or logos, use it. If you can identify the item type from the labels/objects, use the specific type.

Return ONLY valid JSON with realistic values based on what was detected:
{
  "brand": "detected brand or Unbranded",
  "item_type": "specific item type detected",
  "size": "detected size or See Label",
  "color": "main colour detected",
  "condition_score": 7,
  "estimated_value_min": 10,
  "estimated_value_max": 25,
  "ebay_title": "Create specific title based on detected info",
  "description": "Professional description mentioning detected details",
  "suggested_price": 15,
  "category": "Clothes, Shoes & Accessories",
  "material": "detected material or Not specified",
  "style": "style type",
  "gender": "Men's/Women's/Unisex based on item",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    console.log('📤 Sending request to Claude...');
    
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
    console.log('📥 Claude response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Claude API error:', response.status);
      console.error('❌ Error details:', responseText);
      
      if (responseText.includes('invalid_api_key')) {
        console.error('❌ CRITICAL: Claude API key is invalid!');
      }
      
      return null;
    }

    const data = JSON.parse(responseText);
    const content = data.content?.[0]?.text || '';
    
    console.log('✅ Claude response received, length:', content.length);
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const listing = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed listing:', {
          brand: listing.brand,
          item: listing.item_type,
          title: listing.ebay_title
        });
        return listing;
      } catch (e) {
        console.error('❌ Failed to parse Claude JSON:', e);
        console.error('Raw JSON string:', jsonMatch[0]);
        return null;
      }
    } else {
      console.error('❌ No JSON found in Claude response');
      console.error('Full response:', content);
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Claude API fatal error:', error.message);
    console.error('Full error:', error);
    return null;
  }
}

// Main handler
export async function POST(request) {
  console.log('\n🚀 === NEW ANALYSIS REQUEST ===');
  console.log('📅 Time:', new Date().toISOString());
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrls = [], imageCount } = body;
    const numImages = imageUrls.length || imageCount || 1;
    
    console.log(`📸 Processing ${numImages} images for user ${userId}`);
    console.log('🖼️ Image URLs:', imageUrls);
    
    // Get or create user
    let { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      console.log('👤 Creating new user...');
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
    console.log('💳 Credits available:', creditsAvailable);
    
    if (creditsAvailable <= 0) {
      console.log('❌ No credits available');
      return NextResponse.json({ 
        error: 'No credits available',
        credits_remaining: 0 
      }, { status: 402 });
    }

    // Main AI analysis
    let finalListing = null;
    let visionSuccess = false;
    let claudeSuccess = false;
    
    if (imageUrls && imageUrls.length > 0) {
      console.log('🎯 Starting AI analysis pipeline...');
      
      // Step 1: Fetch image
      const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
      
      if (imageBase64) {
        // Step 2: Google Vision
        const visionData = await analyzeWithGoogleVision(imageBase64);
        
        if (visionData) {
          visionSuccess = true;
          // Step 3: Extract details
          const fashionDetails = extractFashionDetails(visionData);
          
          // Step 4: Claude AI
          finalListing = await generateListingWithClaude(fashionDetails, visionData, numImages);
          if (finalListing) {
            claudeSuccess = true;
          }
        }
      }
    }
    
    console.log('🔍 Pipeline results:', {
      visionSuccess,
      claudeSuccess,
      hasListing: !!finalListing
    });
    
    // If AI failed, use fallback
    if (!finalListing) {
      console.log('⚠️ AI pipeline failed, using fallback listing');
      console.log('❌ Failure points:', {
        imageUrls: imageUrls?.length || 0,
        visionAPI: visionSuccess,
        claudeAPI: claudeSuccess
      });
      
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
      analyzed_at: new Date().toISOString(),
      ai_status: {
        vision: visionSuccess,
        claude: claudeSuccess
      }
    };
    
    // Save to database
    const { error: dbError } = await supabase.from('analyses').insert({
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
    
    if (dbError) {
      console.error('❌ Database error:', dbError);
    }
    
    // Update credits
    await supabase
      .from('users')
      .update({ credits_used: (userData?.credits_used || 0) + 1 })
      .eq('clerk_id', userId);
    
    console.log('✅ Analysis complete:', {
      title: completeAnalysis.ebay_title,
      aiSuccess: visionSuccess && claudeSuccess
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

// Health check endpoint
export async function GET() {
  const googleVisionKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  
  return NextResponse.json({
    status: 'ok',
    message: 'AI Analysis API v5.0 - Enhanced Debugging',
    apis: {
      googleVision: !!googleVisionKey,
      googleVisionKeyLength: googleVisionKey?.length || 0,
      claude: !!claudeKey,
      claudeKeyLength: claudeKey?.length || 0,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    },
    timestamp: new Date().toISOString()
  });
}