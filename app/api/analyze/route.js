// app/api/analyze/route.js
// ENHANCED VERSION WITH BETTER GARMENT & SIZE DETECTION

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ========== HELPER FUNCTIONS ==========

// Fetch image from URL and convert to base64
async function fetchImageAsBase64(imageUrl) {
  try {
    console.log('📥 Fetching image from URL...');
    
    const response = await fetch(imageUrl, {
      headers: { 
        'User-Agent': 'LightLister-AI/1.0'
      },
      signal: AbortSignal.timeout(15000)
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

// Call Google Vision API with enhanced detection
async function analyzeWithGoogleVision(imageBase64) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey || apiKey === 'your_google_cloud_vision_api_key') {
    console.log('⚠️ Google Vision API key not configured - skipping');
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
              { type: 'TEXT_DETECTION', maxResults: 50 },
              { type: 'LABEL_DETECTION', maxResults: 30 },
              { type: 'LOGO_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
              { type: 'IMAGE_PROPERTIES', maxResults: 5 }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Vision API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const result = data.responses?.[0];
    
    if (result) {
      const detectedText = result.textAnnotations?.[0]?.description || '';
      const labels = result.labelAnnotations?.map(l => l.description) || [];
      const logos = result.logoAnnotations?.map(l => l.description) || [];
      const objects = result.localizedObjectAnnotations?.map(o => o.name) || [];
      
      console.log('✅ Vision API detected:', {
        textSnippet: detectedText.substring(0, 100),
        labels: labels.slice(0, 10),
        logos: logos,
        objects: objects.slice(0, 10)
      });
      
      return result;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Google Vision error:', error.message);
    return null;
  }
}

// Enhanced fashion detail extraction
function extractFashionDetails(visionData) {
  const details = {
    allText: '',
    brands: [],
    sizes: [],
    itemTypes: [],
    colors: [],
    materials: [],
    features: [],
    garmentHints: []
  };
  
  if (!visionData) return details;
  
  // Get all detected text
  if (visionData.textAnnotations?.length > 0) {
    details.allText = visionData.textAnnotations[0].description || '';
    console.log('📝 Full text found:', details.allText);
  }
  
  const textUpper = details.allText.toUpperCase();
  const textWords = textUpper.split(/\s+/);
  
  // Comprehensive UK brand list (including streetwear brands like Childish)
  const brandList = [
    'CHILDISH', 'ZARA', 'H&M', 'HM', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK', 
    'TOPSHOP', 'ASOS', 'MARKS & SPENCER', 'M&S', 'MARKS AND SPENCER',
    'UNIQLO', 'GAP', 'MANGO', 'COS', 'RIVER ISLAND', 'NEW LOOK', 
    'BOOHOO', 'MISSGUIDED', 'RALPH LAUREN', 'TOMMY HILFIGER', 
    'CALVIN KLEIN', 'LEVI\'S', 'LEVIS', 'LACOSTE', 'FRED PERRY', 
    'BURBERRY', 'TED BAKER', 'SUPERDRY', 'NORTH FACE', 'PATAGONIA', 
    'COLUMBIA', 'BERGHAUS', 'FILA', 'PUMA', 'REEBOK', 'UMBRO',
    'KAPPA', 'CHAMPION', 'VANS', 'CONVERSE', 'DR MARTENS', 'DOCS',
    'TIMBERLAND', 'CARHARTT', 'DICKIES', 'STONE ISLAND', 'CP COMPANY',
    'ARMANI', 'VERSACE', 'GUCCI', 'PRADA', 'LOUIS VUITTON', 'BALENCIAGA',
    'OFF-WHITE', 'SUPREME', 'PALACE', 'STUSSY', 'OBEY', 'THRASHER',
    'HOLLISTER', 'ABERCROMBIE', 'JACK WILLS', 'JACK & JONES', 'ONLY',
    'WAREHOUSE', 'OASIS', 'KAREN MILLEN', 'COAST', 'PHASE EIGHT',
    'WEEKDAY', 'MONKI', 'STORIES', '& OTHER STORIES', 'ARKET', 'PULL & BEAR',
    'BERSHKA', 'STRADIVARIUS', 'MASSIMO DUTTI', 'ALLSAINTS', 'TK MAXX'
  ];
  
  // Check for brands in text
  for (const brand of brandList) {
    if (textUpper.includes(brand)) {
      details.brands.push(brand);
    }
  }
  
  // Add logo detections as brands
  if (visionData.logoAnnotations) {
    details.brands.push(...visionData.logoAnnotations.map(l => l.description.toUpperCase()));
  }
  
  // Remove duplicates
  details.brands = [...new Set(details.brands)];
  
  // ENHANCED SIZE DETECTION
  // Look for size indicators more carefully
  const sizePatterns = [
    // Standard sizes
    /\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)\b/,
    // With SIZE prefix
    /SIZE[:\s]*([XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL])\b/i,
    // UK numeric sizes
    /UK[:\s]*(\d{1,2})/i,
    /SIZE[:\s]*UK[:\s]*(\d{1,2})/i,
    // EU sizes
    /EUR?[:\s]*(\d{2,3})/i,
    // US sizes
    /US[:\s]*(\d{1,2})/i,
    // Chest/waist measurements
    /(\d{2})["\s]*(CHEST|WAIST)/i,
    // Just numeric sizes
    /SIZE[:\s]*(\d{1,2})\b/i
  ];
  
  for (const pattern of sizePatterns) {
    const matches = textUpper.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      if (match[1]) {
        details.sizes.push(match[1]);
      }
    }
  }
  
  // ENHANCED GARMENT TYPE DETECTION
  const labels = visionData.labelAnnotations?.map(l => l.description.toLowerCase()) || [];
  const objects = visionData.localizedObjectAnnotations?.map(o => o.name.toLowerCase()) || [];
  const allDetections = [...labels, ...objects];
  
  // Garment type keywords with priority scores
  const garmentTypes = {
    // Tops - Long sleeve
    'jumper': ['jumper', 'sweater', 'pullover', 'knit', 'knitwear'],
    'sweatshirt': ['sweatshirt', 'sweat', 'hoodie without hood', 'crew neck'],
    'hoodie': ['hoodie', 'hooded sweatshirt', 'hood'],
    'cardigan': ['cardigan', 'button sweater', 'open front'],
    'fleece': ['fleece', 'polar fleece'],
    
    // Tops - Short sleeve
    't-shirt': ['t-shirt', 'tee', 'tshirt', 'short sleeve shirt'],
    'polo': ['polo', 'polo shirt', 'collar shirt'],
    'vest': ['vest', 'tank top', 'sleeveless'],
    
    // Shirts
    'shirt': ['shirt', 'button up', 'dress shirt', 'oxford'],
    
    // Outerwear
    'jacket': ['jacket', 'coat', 'blazer'],
    'coat': ['coat', 'overcoat', 'trench'],
    'parka': ['parka', 'anorak'],
    
    // Bottoms
    'jeans': ['jeans', 'denim pants', 'denim'],
    'trousers': ['trousers', 'pants', 'chinos'],
    'shorts': ['shorts', 'short pants'],
    'joggers': ['joggers', 'sweatpants', 'track pants'],
    
    // Dresses & Skirts
    'dress': ['dress', 'frock'],
    'skirt': ['skirt', 'mini skirt', 'midi skirt', 'maxi skirt']
  };
  
  // Check for long sleeves vs short sleeves
  const hasLongSleeves = allDetections.some(d => 
    d.includes('long sleeve') || 
    d.includes('long-sleeve') ||
    d.includes('sleeve') && !d.includes('short')
  );
  
  const hasShortSleeves = allDetections.some(d => 
    d.includes('short sleeve') || 
    d.includes('short-sleeve') ||
    d.includes('t-shirt')
  );
  
  // Check for specific garment features
  const hasRibbedCuffs = textUpper.includes('RIBBED') || textUpper.includes('CUFF');
  const hasCrewNeck = textUpper.includes('CREW') || allDetections.some(d => d.includes('crew neck'));
  const hasHood = textUpper.includes('HOOD') || allDetections.some(d => d.includes('hood'));
  
  // Determine garment type based on evidence
  for (const [garmentType, keywords] of Object.entries(garmentTypes)) {
    for (const keyword of keywords) {
      if (allDetections.some(d => d.includes(keyword))) {
        details.itemTypes.push(garmentType.charAt(0).toUpperCase() + garmentType.slice(1));
        details.garmentHints.push(keyword);
      }
    }
  }
  
  // If we have long sleeves but no specific type detected, it's likely a jumper or sweatshirt
  if (hasLongSleeves && details.itemTypes.length === 0) {
    if (hasRibbedCuffs || hasCrewNeck) {
      details.itemTypes.push('Sweatshirt');
      details.garmentHints.push('long sleeve with ribbed details');
    } else {
      details.itemTypes.push('Jumper');
      details.garmentHints.push('long sleeve garment');
    }
  }
  
  // Color detection
  const colors = [
    'Black', 'White', 'Grey', 'Gray', 'Navy', 'Blue', 'Red', 'Green', 
    'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Beige', 'Cream',
    'Burgundy', 'Maroon', 'Khaki', 'Olive', 'Teal', 'Turquoise',
    'Charcoal', 'Stone', 'Sand', 'Tan', 'Wine', 'Forest', 'Mint'
  ];
  
  for (const color of colors) {
    if (allDetections.some(d => d.toLowerCase().includes(color.toLowerCase())) ||
        textUpper.includes(color.toUpperCase())) {
      details.colors.push(color);
    }
  }
  
  // Material detection
  const materials = [
    'Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Denim', 'Leather',
    'Suede', 'Velvet', 'Fleece', 'Nylon', 'Rayon', 'Viscose', 'Cashmere',
    'Merino', 'Acrylic', 'Spandex', 'Elastane', 'Lycra', 'Gore-tex',
    'Jersey', 'French Terry', 'Terry', 'Bamboo', 'Modal', 'Tencel'
  ];
  
  for (const material of materials) {
    if (textUpper.includes(material.toUpperCase()) ||
        allDetections.some(d => d.toLowerCase().includes(material.toLowerCase()))) {
      details.materials.push(material);
    }
  }
  
  console.log('🔍 Extracted fashion details:', {
    brands: details.brands,
    sizes: details.sizes,
    types: details.itemTypes,
    colors: details.colors,
    garmentHints: details.garmentHints
  });
  
  return details;
}

// Generate listing with Claude - ENHANCED PROMPT
async function generateListingWithClaude(fashionDetails, visionData, imageCount) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey || apiKey === 'your_anthropic_api_key') {
    console.error('❌ Claude API key not configured');
    throw new Error('AI service not configured');
  }
  
  try {
    console.log('🤖 Calling Claude API...');
    
    // Build context from vision data
    const visionContext = visionData ? {
      labels: visionData.labelAnnotations?.map(l => l.description) || [],
      objects: visionData.localizedObjectAnnotations?.map(o => o.name) || [],
      logos: visionData.logoAnnotations?.map(l => l.description) || []
    } : null;
    
    // Create enhanced prompt with better garment detection
    const prompt = `You are an expert UK eBay fashion reseller. Analyze this item and create perfect listings.

CRITICAL GARMENT TYPE DETECTION:
- If item has long sleeves and ribbed cuffs/hem: It's likely a JUMPER or SWEATSHIRT (NOT a T-shirt)
- If item has long sleeves without ribbing: Could be a SHIRT or JUMPER
- If item has short sleeves: T-SHIRT or POLO
- If item has a hood: HOODIE
- If item has buttons down front: SHIRT or CARDIGAN
- Crew neck with long sleeves usually = JUMPER or SWEATSHIRT

DETECTED INFORMATION:
- Text found on labels/tags: "${fashionDetails.allText || 'None detected'}"
- Brands detected: ${fashionDetails.brands.length > 0 ? fashionDetails.brands.join(', ') : 'None'}
- Sizes found: ${fashionDetails.sizes.length > 0 ? fashionDetails.sizes.join(', ') : 'None'}
- Garment indicators: ${fashionDetails.garmentHints.join(', ') || 'None'}
- Item types suggested: ${fashionDetails.itemTypes.length > 0 ? fashionDetails.itemTypes.join(', ') : 'Unknown'}
- Colors: ${fashionDetails.colors.length > 0 ? fashionDetails.colors.join(', ') : 'Not specified'}
- Materials: ${fashionDetails.materials.length > 0 ? fashionDetails.materials.join(', ') : 'Not specified'}
${visionContext ? `
- Visual labels detected: ${visionContext.labels.slice(0, 15).join(', ')}
- Objects detected: ${visionContext.objects.join(', ')}
- Logos detected: ${visionContext.logos.join(', ')}` : ''}

CRITICAL TITLE REQUIREMENTS:

1. STRICT TITLE FORMAT (EXACTLY 80 CHARACTERS):
   MUST follow: [Brand] [Gender] [Item] Size [Size] [Colour] [Material] [Keywords]
   
   Example formats:
   - "Childish Mens Jumper Size S Red Cotton Jersey Crew Neck Streetwear Long Sleeve UK"
   - "Nike Womens Hoodie Size M Black Polyester Fleece Lined Sports Gym Training Warm"
   - "Zara Ladies Dress Size 12 Blue Viscose Midi Length Summer Casual Work Office"

2. GARMENT TYPE RULES:
   - Long sleeves + casual = Usually JUMPER or SWEATSHIRT
   - Long sleeves + ribbed = JUMPER or SWEATSHIRT
   - Short sleeves = T-SHIRT
   - Has hood = HOODIE
   - Buttons all way = SHIRT or CARDIGAN
   - NEVER call a jumper/sweatshirt a "T-Shirt"

3. SIZE DETECTION:
   - If multiple sizes found, use the FIRST one
   - If text says "S" use Size S, not Size M
   - Common UK sizes: 6 8 10 12 14 16 (womens), S M L XL (unisex)

4. KEYWORDS:
   - Must be searchable eBay terms
   - Examples: Vintage, Retro, Y2K, Streetwear, Designer, Casual, Smart, Work, Gym
   - Include condition: BNWT, Excellent, VGC (Very Good Condition), Good

5. UK SPELLING:
   - Colour not Color
   - Grey not Gray  
   - Jumper not Sweater
   - Trainers not Sneakers

Return ONLY this JSON structure (no other text):
{
  "brand": "Exact brand detected or Unbranded",
  "item_type": "Specific garment type (Jumper/Sweatshirt/T-Shirt/Hoodie etc)",
  "size": "Exact size detected (S/M/L or numeric)",
  "color": "Main colour with UK spelling",
  "condition_score": 7,
  "condition_text": "Very Good Condition",
  "estimated_value_min": 10,
  "estimated_value_max": 25,
  "ebay_title": "EXACTLY 80 character title following strict format above",
  "vinted_title": "Casual title under 50 chars",
  "description": "Detailed description with measurements if visible",
  "suggested_price": 18,
  "category": "Mens Clothing > Jumpers & Cardigans",
  "material": "Cotton Jersey or detected material",
  "style": "Streetwear/Casual/Smart etc",
  "gender": "Mens/Womens/Unisex",
  "keywords": ["streetwear", "casual", "crew neck", "long sleeve", "uk seller"]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.2, // Lower temperature for more consistent results
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      throw new Error('AI service temporarily unavailable');
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    console.log('📝 Claude raw response received, length:', content.length);
    
    // Parse JSON from response
    let listing;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      listing = JSON.parse(jsonMatch[0]);
      console.log('✅ JSON parsed successfully');
      
    } catch (parseError) {
      console.error('❌ JSON parse failed:', parseError.message);
      throw new Error('Failed to parse AI response');
    }
    
    // Validate and fix the eBay title
    if (!listing.ebay_title || listing.ebay_title.trim().length === 0) {
      console.log('⚠️ Title missing - generating fallback');
      
      const brand = listing.brand || fashionDetails.brands[0] || 'Unbranded';
      const item = listing.item_type || fashionDetails.itemTypes[0] || 'Jumper';
      const size = listing.size || fashionDetails.sizes[0] || 'M';
      const color = listing.color || fashionDetails.colors[0] || 'Black';
      const material = listing.material || 'Cotton';
      
      listing.ebay_title = `${brand} Mens ${item} Size ${size} ${color} ${material} Casual Streetwear UK VGC`;
    }
    
    // Format the title properly
    listing.ebay_title = listing.ebay_title
      .replace(/[.,\-£$]/g, ' ')  // Remove punctuation except &
      .replace(/\s+/g, ' ')        // Remove double spaces
      .trim();
    
    // Ensure exactly 80 characters
    if (listing.ebay_title.length > 80) {
      listing.ebay_title = listing.ebay_title.substring(0, 80).trim();
    } else if (listing.ebay_title.length < 80) {
      // Pad with relevant keywords if too short
      const padding = ['UK', 'Seller', 'Fast', 'Post', 'Quality', 'Genuine', 'Authentic'];
      while (listing.ebay_title.length < 80 && padding.length > 0) {
        const word = padding.shift();
        if (listing.ebay_title.length + word.length + 1 <= 80) {
          listing.ebay_title += ' ' + word;
        }
      }
    }
    
    console.log('✅ Final eBay title:', listing.ebay_title, `(${listing.ebay_title.length} chars)`);
    
    return listing;
    
  } catch (error) {
    console.error('❌ Claude API error:', error.message);
    throw error;
  }
}

// ========== MAIN HANDLER ==========
export async function POST(request) {
  console.log('\n🚀 === NEW ANALYSIS REQUEST ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // 1. Check authentication (with bypass for testing)
    let userId = 'temp-user-' + Date.now();
    
    try {
      const { userId: authUserId } = await auth();
      if (authUserId) {
        userId = authUserId;
      }
    } catch (authError) {
      console.log('⚠️ Auth bypassed for testing');
    }
    
    console.log('User ID:', userId);
    
    // 2. Parse request body
    const contentType = request.headers.get('content-type');
    let imageUrls = [];
    let imageCount = 1;
    
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      imageUrls = body.imageUrls || [];
      imageCount = body.imageCount || imageUrls.length || 1;
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format'
      }, { status: 400 });
    }
    
    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No images provided'
      }, { status: 400 });
    }
    
    console.log(`📸 Processing ${imageUrls.length} images`);
    
    // 3. Main AI analysis pipeline
    let finalListing = null;
    let visionData = null;
    let fashionDetails = null;
    
    try {
      // Fetch and convert first image to base64
      console.log('🔄 Starting analysis pipeline...');
      const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
      
      // Try Google Vision API
      visionData = await analyzeWithGoogleVision(imageBase64);
      
      // Extract fashion details
      fashionDetails = extractFashionDetails(visionData);
      
      // Generate listing with Claude
      finalListing = await generateListingWithClaude(fashionDetails, visionData, imageCount);
      
    } catch (pipelineError) {
      console.error('❌ Pipeline error:', pipelineError.message);
      
      if (pipelineError.message.includes('AI service')) {
        return NextResponse.json({
          success: false,
          error: 'AI service temporarily unavailable. Please try again in a moment.'
        }, { status: 503 });
      }
      
      throw pipelineError;
    }
    
    // 4. Create complete analysis result
    const completeAnalysis = {
      ...finalListing,
      id: `analysis-${Date.now()}`,
      sku: `${(finalListing.brand || 'UNB').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: imageCount,
      image_urls: imageUrls,
      credits_remaining: 49,
      analyzed_at: new Date().toISOString(),
      vision_success: !!visionData,
      brands_detected: fashionDetails?.brands || [],
      sizes_detected: fashionDetails?.sizes || [],
      garment_hints: fashionDetails?.garmentHints || []
    };
    
    // 5. Save to database (optional)
    if (userId && !userId.startsWith('temp-')) {
      try {
        await supabase.from('analyses').insert({
          user_id: userId,
          brand: completeAnalysis.brand,
          item_type: completeAnalysis.item_type,
          size: completeAnalysis.size,
          color: completeAnalysis.color,
          condition_score: completeAnalysis.condition_score,
          estimated_value_min: completeAnalysis.estimated_value_min,
          estimated_value_max: completeAnalysis.estimated_value_max,
          ebay_title: completeAnalysis.ebay_title,
          vinted_title: completeAnalysis.vinted_title,
          description: completeAnalysis.description,
          suggested_price: completeAnalysis.suggested_price,
          category: completeAnalysis.category,
          sku: completeAnalysis.sku,
          images_count: completeAnalysis.images_count,
          metadata: completeAnalysis
        });
        console.log('✅ Analysis saved to database');
      } catch (dbError) {
        console.error('⚠️ Database save failed:', dbError.message);
      }
    }
    
    console.log('✅ Analysis complete!');
    console.log('Title:', completeAnalysis.ebay_title);
    console.log('Brand:', completeAnalysis.brand);
    console.log('Item Type:', completeAnalysis.item_type);
    console.log('Size:', completeAnalysis.size);
    console.log('Price: £' + completeAnalysis.suggested_price);
    
    return NextResponse.json({
      success: true,
      analysis: completeAnalysis
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Analysis failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  const apis = {
    googleVision: !!(process.env.GOOGLE_CLOUD_VISION_API_KEY && 
                     process.env.GOOGLE_CLOUD_VISION_API_KEY !== 'your_google_cloud_vision_api_key'),
    claude: !!(process.env.ANTHROPIC_API_KEY && 
               process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key'),
    supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
                 process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url')
  };
  
  return NextResponse.json({
    status: 'ok',
    message: 'LightLister AI Analysis API v2.1 - Enhanced Detection',
    apis,
    issues: Object.entries(apis)
      .filter(([_, configured]) => !configured)
      .map(([api]) => `${api} not configured`),
    timestamp: new Date().toISOString()
  });
}