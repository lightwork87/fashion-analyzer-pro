// app/api/analyze-ai/route.js
// ENHANCED VERSION WITH COMPREHENSIVE DEBUGGING

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Enhanced logging helper
function logStep(step, data, isError = false) {
  const timestamp = new Date().toISOString();
  const prefix = isError ? '❌' : '✅';
  console.log(`[${timestamp}] ${prefix} ${step}:`, JSON.stringify(data, null, 2));
  return { step, data, timestamp, isError };
}

// Test image accessibility
async function testImageAccess(imageUrl) {
  try {
    logStep('Testing image URL accessibility', { url: imageUrl });
    
    const response = await fetch(imageUrl, { method: 'HEAD' });
    
    if (!response.ok) {
      logStep('Image not accessible', { 
        status: response.status, 
        statusText: response.statusText 
      }, true);
      return false;
    }
    
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    logStep('Image accessible', { 
      contentType, 
      sizeKB: Math.round(parseInt(contentLength) / 1024) 
    });
    
    return true;
  } catch (error) {
    logStep('Image access test failed', { error: error.message }, true);
    return false;
  }
}

// Fetch image with retry logic
async function fetchImageAsBase64(imageUrl, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logStep(`Fetching image (attempt ${attempt}/${retries})`, { url: imageUrl });
      
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      
      logStep('Image fetched successfully', { 
        sizeKB: Math.round(base64.length / 1024),
        attempt 
      });
      
      return base64;
      
    } catch (error) {
      logStep(`Fetch attempt ${attempt} failed`, { error: error.message }, true);
      
      if (attempt === retries) {
        return null;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return null;
}

// Enhanced Google Vision API call
async function analyzeWithGoogleVision(imageBase64) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey) {
    logStep('Google Vision API key missing', {}, true);
    return null;
  }
  
  logStep('Google Vision API key present', { 
    keyPrefix: apiKey.substring(0, 10) + '...' 
  });
  
  try {
    const requestBody = {
      requests: [{
        image: { content: imageBase64 },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 10 },
          { type: 'LABEL_DETECTION', maxResults: 20 },
          { type: 'LOGO_DETECTION', maxResults: 10 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          { type: 'WEB_DETECTION', maxResults: 10 }
        ]
      }]
    };
    
    logStep('Calling Google Vision API', { 
      features: requestBody.requests[0].features.map(f => f.type) 
    });
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    const responseText = await response.text();
    
    if (!response.ok) {
      logStep('Google Vision API error', { 
        status: response.status,
        response: responseText.substring(0, 500)
      }, true);
      return null;
    }

    const data = JSON.parse(responseText);
    const result = data.responses?.[0];
    
    if (result?.error) {
      logStep('Vision API returned error', result.error, true);
      return null;
    }
    
    // Log detailed results
    const analysisResults = {
      textFound: !!(result?.textAnnotations?.length > 0),
      fullText: result?.textAnnotations?.[0]?.description || 'No text detected',
      labelsCount: result?.labelAnnotations?.length || 0,
      topLabels: result?.labelAnnotations?.slice(0, 5).map(l => ({
        description: l.description,
        score: l.score
      })) || [],
      logosFound: result?.logoAnnotations?.map(l => ({
        description: l.description,
        score: l.score
      })) || [],
      objectsFound: result?.localizedObjectAnnotations?.slice(0, 5).map(o => ({
        name: o.name,
        score: o.score
      })) || [],
      webEntities: result?.webDetection?.webEntities?.slice(0, 5).map(e => ({
        description: e.description,
        score: e.score
      })) || []
    };
    
    logStep('Vision API analysis complete', analysisResults);
    
    return result;
    
  } catch (error) {
    logStep('Google Vision API exception', { 
      error: error.message,
      stack: error.stack 
    }, true);
    return null;
  }
}

// Enhanced fashion detail extraction
function extractFashionDetails(visionData) {
  const details = {
    allText: '',
    possibleBrands: [],
    possibleSizes: [],
    itemTypes: [],
    colors: [],
    materials: [],
    webDetectedBrands: []
  };
  
  // Get all text
  if (visionData?.textAnnotations?.length > 0) {
    details.allText = visionData.textAnnotations[0].description || '';
  }
  
  const textUpper = details.allText.toUpperCase();
  
  // Comprehensive UK fashion brand list
  const brandList = [
    // High Street
    'ZARA', 'H&M', 'HM', 'H & M', 'NEXT', 'PRIMARK', 'TOPSHOP', 'TOPMAN',
    'ASOS', 'MARKS & SPENCER', 'M&S', 'UNIQLO', 'GAP', 'MANGO', 'COS',
    'RIVER ISLAND', 'NEW LOOK', 'BOOHOO', 'MISSGUIDED', 'PRETTY LITTLE THING',
    
    // Sports
    'NIKE', 'ADIDAS', 'PUMA', 'REEBOK', 'UNDER ARMOUR', 'NEW BALANCE',
    'ASICS', 'FILA', 'CHAMPION', 'KAPPA', 'UMBRO', 'ELLESSE',
    
    // Designer/Premium
    'RALPH LAUREN', 'TOMMY HILFIGER', 'CALVIN KLEIN', 'HUGO BOSS', 'BOSS',
    'LACOSTE', 'FRED PERRY', 'PAUL SMITH', 'TED BAKER', 'ARMANI',
    'VERSACE', 'GUCCI', 'PRADA', 'BURBERRY', 'BALENCIAGA', 'DIOR',
    
    // Denim
    'LEVI\'S', 'LEVIS', 'WRANGLER', 'LEE', 'DIESEL', 'G-STAR', 'GSTAR',
    
    // Outdoor
    'NORTH FACE', 'THE NORTH FACE', 'PATAGONIA', 'COLUMBIA', 'BERGHAUS',
    'JACK WOLFSKIN', 'REGATTA', 'CRAGHOPPERS', 'BARBOUR', 'SUPERDRY'
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
  
  // Check web entities for brands
  if (visionData?.webDetection?.webEntities) {
    for (const entity of visionData.webDetection.webEntities) {
      const entityUpper = entity.description?.toUpperCase() || '';
      for (const brand of brandList) {
        if (entityUpper.includes(brand)) {
          details.webDetectedBrands.push(brand);
        }
      }
    }
  }
  
  // Enhanced size detection for UK
  const sizePatterns = [
    /SIZE:?\s*([XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL])\b/i,
    /\b([XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL])\b/,
    /UK\s*SIZE:?\s*(\d{1,2})/i,
    /SIZE:?\s*UK\s*(\d{1,2})/i,
    /UK\s*(\d{1,2})\b/i,
    /EUR:?\s*(\d{2,3})/i,
    /US:?\s*(\d{1,2})/i,
    /\b(\d{1,2})[\/\-](\d{1,2})\b/  // Size ranges like 14/16
  ];
  
  for (const pattern of sizePatterns) {
    const matches = textUpper.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        details.possibleSizes.push(match[1]);
      }
    }
  }
  
  // Item type detection
  const labels = visionData?.labelAnnotations?.map(l => l.description) || [];
  const objects = visionData?.localizedObjectAnnotations?.map(o => o.name) || [];
  const webEntities = visionData?.webDetection?.webEntities?.map(e => e.description) || [];
  
  const clothingTypes = [
    'Shirt', 'T-shirt', 'Polo', 'Dress', 'Jeans', 'Trousers', 'Pants',
    'Jacket', 'Coat', 'Blazer', 'Suit', 'Sweater', 'Jumper', 'Hoodie',
    'Sweatshirt', 'Cardigan', 'Vest', 'Waistcoat', 'Skirt', 'Shorts',
    'Top', 'Blouse', 'Knitwear', 'Pullover', 'Fleece', 'Tracksuit',
    'Leggings', 'Joggers', 'Chinos', 'Cargo', 'Denim', 'Parka', 'Windbreaker'
  ];
  
  const allDetections = [...labels, ...objects, ...webEntities];
  for (const item of clothingTypes) {
    if (allDetections.some(d => d?.toLowerCase().includes(item.toLowerCase()))) {
      details.itemTypes.push(item);
    }
  }
  
  // Color detection
  const colorWords = [
    'Black', 'White', 'Blue', 'Navy', 'Red', 'Green', 'Grey', 'Gray',
    'Brown', 'Pink', 'Purple', 'Orange', 'Yellow', 'Beige', 'Cream',
    'Khaki', 'Burgundy', 'Maroon', 'Teal', 'Turquoise', 'Olive'
  ];
  
  for (const color of colorWords) {
    if (allDetections.some(d => d?.toLowerCase().includes(color.toLowerCase()))) {
      details.colors.push(color);
    }
  }
  
  // Material detection
  const materials = [
    'Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Denim', 'Leather',
    'Suede', 'Velvet', 'Fleece', 'Nylon', 'Spandex', 'Elastane', 'Viscose',
    'Rayon', 'Cashmere', 'Merino', 'Gore-tex', 'Canvas'
  ];
  
  for (const material of materials) {
    if (textUpper.includes(material.toUpperCase())) {
      details.materials.push(material);
    }
  }
  
  logStep('Fashion details extracted', details);
  
  return details;
}

// Enhanced Claude listing generation
async function generateListingWithClaude(fashionDetails, visionData, imageCount) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    logStep('Claude API key missing', {}, true);
    return null;
  }
  
  logStep('Claude API key present', { 
    keyPrefix: apiKey.substring(0, 10) + '...' 
  });
  
  try {
    const labels = visionData?.labelAnnotations?.map(l => `${l.description} (${Math.round(l.score * 100)}%)`)?.join(', ') || 'none';
    const objects = visionData?.localizedObjectAnnotations?.map(o => `${o.name} (${Math.round(o.score * 100)}%)`)?.join(', ') || 'none';
    const webEntities = visionData?.webDetection?.webEntities?.slice(0, 10).map(e => e.description)?.join(', ') || 'none';
    
    const prompt = `You are an expert UK eBay and Vinted fashion seller. Analyze this item and create a perfect listing.

VISION API DETECTION RESULTS:
- Full text from item: "${fashionDetails.allText}"
- Detected brands: ${[...new Set([...fashionDetails.possibleBrands, ...fashionDetails.webDetectedBrands])].join(', ') || 'None'}
- Detected sizes: ${fashionDetails.possibleSizes.join(', ') || 'None'}
- Visual labels: ${labels}
- Objects detected: ${objects}
- Web entities: ${webEntities}
- Colors detected: ${fashionDetails.colors.join(', ') || 'None'}
- Item types detected: ${fashionDetails.itemTypes.join(', ') || 'None'}
- Materials detected: ${fashionDetails.materials.join(', ') || 'None'}
- Number of photos: ${imageCount}

CRITICAL REQUIREMENTS:
1. ALWAYS identify the specific item type (never just "Clothing Item")
2. Use detected brand if found, otherwise "Unbranded" is acceptable
3. Create eBay UK title (MAX 80 chars): [Brand] [Gender] [Item Type] [Color] Size [Size] [Condition/Feature]
4. Be specific - if it's a shirt, say shirt. If it's jeans, say jeans.
5. Use UK spelling (colour, centre, etc.)
6. Price in GBP (£) for UK market
7. If you can't determine exact details, make educated guesses based on the visual analysis

Generate a complete listing. Return ONLY valid JSON:
{
  "brand": "exact brand or Unbranded",
  "item_type": "specific item type (e.g., T-Shirt, Jeans, Hoodie)",
  "size": "UK size or best guess",
  "color": "main colour",
  "condition_score": 7,
  "estimated_value_min": 10,
  "estimated_value_max": 30,
  "ebay_title": "Complete eBay UK title under 80 chars",
  "description": "Professional multi-paragraph description with key features",
  "suggested_price": 18,
  "category": "specific category",
  "material": "detected or likely material",
  "style": "casual/formal/sports/etc",
  "gender": "Men's/Women's/Unisex",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

    logStep('Sending prompt to Claude', { promptLength: prompt.length });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      logStep('Claude API error', { 
        status: response.status,
        response: responseText.substring(0, 500)
      }, true);
      return null;
    }

    const data = JSON.parse(responseText);
    const content = data.content?.[0]?.text || '';
    
    logStep('Claude response received', { 
      responseLength: content.length,
      preview: content.substring(0, 200)
    });
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const listing = JSON.parse(jsonMatch[0]);
        logStep('Listing generated successfully', listing);
        return listing;
      } catch (e) {
        logStep('Failed to parse Claude JSON', { error: e.message }, true);
        return null;
      }
    }
    
    logStep('No JSON found in Claude response', {}, true);
    return null;
    
  } catch (error) {
    logStep('Claude API exception', { 
      error: error.message,
      stack: error.stack 
    }, true);
    return null;
  }
}

// Main handler with comprehensive error handling
export async function POST(request) {
  const debugLog = [];
  
  try {
    debugLog.push(logStep('=== NEW ANALYSIS REQUEST STARTED ===', { 
      timestamp: new Date().toISOString() 
    }));
    
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        debugLog 
      }, { status: 401 });
    }
    
    debugLog.push(logStep('User authenticated', { userId }));
    
    // Parse request
    const body = await request.json();
    const { imageUrls = [], imageCount } = body;
    const numImages = imageUrls.length || imageCount || 1;
    
    debugLog.push(logStep('Request parsed', { 
      imageCount: numImages,
      firstImageUrl: imageUrls[0] 
    }));
    
    // Get user credits
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      debugLog.push(logStep('Database error', { error: userError }, true));
      throw new Error('Database error');
    }

    if (!userData) {
      debugLog.push(logStep('Creating new user', { userId }));
      
      const { data: newUser, error: insertError } = await supabase
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
        
      if (insertError) {
        debugLog.push(logStep('Failed to create user', { error: insertError }, true));
        throw new Error('Failed to create user');
      }
      
      userData = newUser;
    }

    const creditsAvailable = (userData?.credits_total || 0) - (userData?.credits_used || 0) + (userData?.bonus_credits || 0);
    
    debugLog.push(logStep('Credits checked', { 
      available: creditsAvailable,
      total: userData?.credits_total,
      used: userData?.credits_used 
    }));
    
    if (creditsAvailable <= 0) {
      return NextResponse.json({ 
        error: 'No credits available',
        credits_remaining: 0,
        debugLog
      }, { status: 402 });
    }

    // Main AI analysis
    let finalListing = null;
    let visionData = null;
    let fashionDetails = null;
    
    if (imageUrls && imageUrls.length > 0) {
      // Test image accessibility
      const isAccessible = await testImageAccess(imageUrls[0]);
      debugLog.push(logStep('Image accessibility test', { 
        url: imageUrls[0],
        accessible: isAccessible 
      }));
      
      if (!isAccessible) {
        debugLog.push(logStep('Image not accessible, check Supabase storage settings', {}, true));
      }
      
      // Fetch and convert image
      const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
      
      if (imageBase64) {
        debugLog.push(logStep('Image converted to base64', { 
          sizeKB: Math.round(imageBase64.length / 1024) 
        }));
        
        // Analyze with Google Vision
        visionData = await analyzeWithGoogleVision(imageBase64);
        
        if (visionData) {
          debugLog.push(logStep('Vision API analysis complete', { 
            hasText: !!(visionData.textAnnotations?.length > 0),
            labelCount: visionData.labelAnnotations?.length || 0
          }));
          
          // Extract fashion details
          fashionDetails = extractFashionDetails(visionData);
          debugLog.push(logStep('Fashion details extracted', { 
            brandsFound: fashionDetails.possibleBrands.length,
            sizesFound: fashionDetails.possibleSizes.length 
          }));
          
          // Generate listing with Claude
          finalListing = await generateListingWithClaude(fashionDetails, visionData, numImages);
        } else {
          debugLog.push(logStep('Vision API failed', {}, true));
        }
      } else {
        debugLog.push(logStep('Image fetch/conversion failed', {}, true));
      }
    }
    
    // If AI failed, use enhanced fallback
    if (!finalListing) {
      debugLog.push(logStep('Using fallback listing', { 
        reason: 'AI analysis failed' 
      }, true));
      
      // Try to use any detected info for better fallback
      const detectedBrand = fashionDetails?.possibleBrands?.[0] || 
                           fashionDetails?.webDetectedBrands?.[0] || 
                           'Unbranded';
      const detectedType = fashionDetails?.itemTypes?.[0] || 'Fashion Item';
      const detectedSize = fashionDetails?.possibleSizes?.[0] || 'See Photos';
      const detectedColor = fashionDetails?.colors?.[0] || 'Multi';
      
      finalListing = {
        brand: detectedBrand,
        item_type: detectedType,
        size: detectedSize,
        color: detectedColor,
        condition_score: 7,
        estimated_value_min: 8,
        estimated_value_max: 25,
        ebay_title: `${detectedBrand} ${detectedType} - Size ${detectedSize} - Good Condition`,
        description: `${detectedType} from ${detectedBrand}.

- Brand: ${detectedBrand}
- Size: ${detectedSize}
- Colour: ${detectedColor}
- Condition: Good pre-owned condition (7/10)
- Please check all ${numImages} photos for full details

Item will be dispatched within 1 business day via Royal Mail.
Any questions? Please don't hesitate to ask!`,
        suggested_price: 15,
        category: "Clothes, Shoes & Accessories",
        material: fashionDetails?.materials?.[0] || "See label",
        style: "Casual",
        gender: "Unisex",
        keywords: ["fashion", "clothing", "uk", detectedBrand.toLowerCase(), detectedType.toLowerCase()]
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
      debug_info: {
        vision_success: !!visionData,
        brands_detected: fashionDetails?.possibleBrands?.length || 0,
        text_detected: !!(fashionDetails?.allText?.length > 0)
      }
    };
    
    debugLog.push(logStep('Analysis complete', { 
      title: completeAnalysis.ebay_title,
      brand: completeAnalysis.brand 
    }));
    
    // Save to database
    const { error: saveError } = await supabase.from('analyses').insert({
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
    
    if (saveError) {
      debugLog.push(logStep('Failed to save analysis', { error: saveError }, true));
    }
    
    // Update credits
    await supabase
      .from('users')
      .update({ credits_used: (userData?.credits_used || 0) + 1 })
      .eq('clerk_id', userId);
    
    debugLog.push(logStep('=== ANALYSIS COMPLETE ===', { 
      success: true 
    }));
    
    return NextResponse.json({
      success: true,
      analysis: completeAnalysis,
      debugLog: process.env.NODE_ENV === 'development' ? debugLog : undefined
    });
    
  } catch (error) {
    debugLog.push(logStep('Fatal error', { 
      error: error.message,
      stack: error.stack 
    }, true));
    
    console.error('Analysis failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      debugLog: process.env.NODE_ENV === 'development' ? debugLog : undefined
    }, { status: 500 });
  }
}

// Enhanced health check endpoint
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    version: '5.0',
    environment: process.env.NODE_ENV,
    apis: {
      googleVision: {
        configured: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
        keyLength: process.env.GOOGLE_CLOUD_VISION_API_KEY?.length || 0
      },
      claude: {
        configured: !!process.env.ANTHROPIC_API_KEY,
        keyLength: process.env.ANTHROPIC_API_KEY?.length || 0
      },
      supabase: {
        configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    }
  };
  
  // Test Supabase connection
  try {
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    checks.apis.supabase.connected = true;
    checks.apis.supabase.userCount = count;
  } catch (error) {
    checks.apis.supabase.connected = false;
    checks.apis.supabase.error = error.message;
  }
  
  return NextResponse.json(checks);
}