// app/api/analyze/route.js
// CONSOLIDATED AND FIXED AI ANALYSIS API

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
      signal: AbortSignal.timeout(15000) // Proper timeout implementation
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
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'LOGO_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
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
      // Log what we found
      const detectedText = result.textAnnotations?.[0]?.description || '';
      const labels = result.labelAnnotations?.map(l => l.description) || [];
      const logos = result.logoAnnotations?.map(l => l.description) || [];
      const objects = result.localizedObjectAnnotations?.map(o => o.name) || [];
      
      console.log('✅ Vision API detected:', {
        textLength: detectedText.length,
        labels: labels.slice(0, 5),
        logos: logos,
        objects: objects.slice(0, 5)
      });
      
      return result;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Google Vision error:', error.message);
    return null;
  }
}

// Extract fashion details from vision data
function extractFashionDetails(visionData) {
  const details = {
    allText: '',
    brands: [],
    sizes: [],
    itemTypes: [],
    colors: [],
    materials: [],
    features: []
  };
  
  if (!visionData) return details;
  
  // Get all detected text
  if (visionData.textAnnotations?.length > 0) {
    details.allText = visionData.textAnnotations[0].description || '';
    console.log('📝 Text extracted:', details.allText.substring(0, 200));
  }
  
  const textUpper = details.allText.toUpperCase();
  const textWords = textUpper.split(/\s+/);
  
  // Extended UK brand list
  const brandList = [
    'ZARA', 'H&M', 'HM', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK', 
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
    'WHISTLES', 'REISS', 'HOBBS', 'JIGSAW', 'BODEN', 'WHITE STUFF',
    'FAT FACE', 'JOULES', 'SEASALT', 'CREW CLOTHING', 'HENRI LLOYD'
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
  
  // Enhanced size detection
  const sizePatterns = [
    /SIZE:?\s*([XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL])\b/i,
    /\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)\b/,
    /UK\s*SIZE:?\s*(\d{1,2})/i,
    /SIZE:?\s*UK\s*(\d{1,2})/i,
    /SIZE\s*(\d{1,2})/i,
    /EUR:?\s*(\d{2,3})/i,
    /US:?\s*(\d{1,2})/i,
    /\b(\d{2})[/-](\d{2})\b/ // For sizes like 32/32
  ];
  
  for (const pattern of sizePatterns) {
    const matches = textUpper.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      if (match[1]) details.sizes.push(match[1]);
    }
  }
  
  // Get clothing types from Vision API
  const labels = visionData.labelAnnotations?.map(l => l.description.toLowerCase()) || [];
  const objects = visionData.localizedObjectAnnotations?.map(o => o.name.toLowerCase()) || [];
  const allDetections = [...labels, ...objects];
  
  // Clothing type keywords
  const clothingTypes = [
    'shirt', 't-shirt', 'tee', 'polo', 'dress', 'jeans', 'trousers', 
    'pants', 'jacket', 'coat', 'sweater', 'jumper', 'hoodie', 'sweatshirt',
    'blazer', 'suit', 'skirt', 'shorts', 'top', 'blouse', 'cardigan', 
    'vest', 'waistcoat', 'leggings', 'joggers', 'tracksuit', 'windbreaker',
    'parka', 'anorak', 'fleece', 'pullover', 'tank top', 'camisole',
    'dungarees', 'overalls', 'romper', 'playsuit', 'bikini', 'swimsuit'
  ];
  
  for (const type of clothingTypes) {
    if (allDetections.some(d => d.includes(type))) {
      details.itemTypes.push(type.charAt(0).toUpperCase() + type.slice(1));
    }
  }
  
  // Color detection
  const colors = [
    'Black', 'White', 'Grey', 'Gray', 'Navy', 'Blue', 'Red', 'Green', 
    'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Beige', 'Cream',
    'Burgundy', 'Maroon', 'Khaki', 'Olive', 'Teal', 'Turquoise'
  ];
  
  for (const color of colors) {
    if (allDetections.some(d => d.toLowerCase().includes(color.toLowerCase()))) {
      details.colors.push(color);
    }
  }
  
  // Material detection
  const materials = [
    'Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Denim', 'Leather',
    'Suede', 'Velvet', 'Fleece', 'Nylon', 'Rayon', 'Viscose', 'Cashmere',
    'Merino', 'Acrylic', 'Spandex', 'Elastane', 'Lycra', 'Gore-tex'
  ];
  
  for (const material of materials) {
    if (textUpper.includes(material.toUpperCase())) {
      details.materials.push(material);
    }
  }
  
  console.log('🔍 Extracted fashion details:', {
    brands: details.brands.length,
    sizes: details.sizes.length,
    types: details.itemTypes.length,
    colors: details.colors.length
  });
  
  return details;
}

// Generate listing with Claude - FIXED VERSION
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
    
    // Create detailed prompt
    const prompt = `You are an expert UK eBay and Vinted fashion reseller. Analyze this item and create perfect listings.

DETECTED INFORMATION:
- Text found on labels/tags: "${fashionDetails.allText || 'None detected'}"
- Brands detected: ${fashionDetails.brands.length > 0 ? fashionDetails.brands.join(', ') : 'None'}
- Sizes found: ${fashionDetails.sizes.length > 0 ? fashionDetails.sizes.join(', ') : 'None'}
- Item types: ${fashionDetails.itemTypes.length > 0 ? fashionDetails.itemTypes.join(', ') : 'Clothing item'}
- Colors: ${fashionDetails.colors.length > 0 ? fashionDetails.colors.join(', ') : 'Not specified'}
- Materials: ${fashionDetails.materials.length > 0 ? fashionDetails.materials.join(', ') : 'Not specified'}
${visionContext ? `
- Visual labels: ${visionContext.labels.slice(0, 10).join(', ')}
- Objects detected: ${visionContext.objects.join(', ')}
- Logos detected: ${visionContext.logos.join(', ')}` : ''}

CRITICAL REQUIREMENTS:

1. CREATE AN EBAY UK TITLE (EXACTLY 80 CHARACTERS):
   - Use format: [Brand] [Gender] [Item] [Feature] Size [Size] [Colour] [Material] [Condition]
   - Use UK spelling: Colour not Color, Grey not Gray, Jumper not Sweater
   - If no brand detected, use the most likely brand or "Unbranded"
   - MUST be exactly 80 characters (pad with descriptive words if needed)
   - Remove punctuation except &
   - Example: "Nike Mens Running T Shirt Athletic Performance Size L Black Polyester VGC"

2. DETERMINE ACCURATE DETAILS:
   - If brand not detected, make educated guess based on style or use "Unbranded"
   - If size not clear, use most common size (M for mens, 12 for womens)
   - Use specific item type (not just "clothing")
   - Estimate realistic UK resale price in GBP

3. CONDITION SCORING (1-10):
   - 10: New with tags (BNWT)
   - 9: New without tags (BNWOT)
   - 8: Excellent/Like new
   - 7: Very good condition (VGC)
   - 6: Good condition
   - 5: Fair/Acceptable
   - Below 5: Poor

Return ONLY this JSON structure (no other text):
{
  "brand": "Detected or estimated brand",
  "item_type": "Specific item type like T-Shirt, Jeans, Dress",
  "size": "UK size",
  "color": "Main colour using UK spelling",
  "condition_score": 7,
  "condition_text": "Very Good Condition",
  "estimated_value_min": 10,
  "estimated_value_max": 25,
  "ebay_title": "EXACTLY 80 character title following the format above",
  "vinted_title": "Casual title under 50 chars for younger audience",
  "description": "Professional multi-paragraph description with measurements if visible",
  "suggested_price": 18,
  "category": "Specific category like Mens Clothing > Shirts > Casual Shirts",
  "material": "Primary material",
  "style": "Style descriptor like Casual, Formal, Vintage",
  "gender": "Mens/Womens/Unisex/Boys/Girls",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Using latest model
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for consistency
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
      // Find JSON in response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      listing = JSON.parse(jsonMatch[0]);
      console.log('✅ JSON parsed successfully');
      
    } catch (parseError) {
      console.error('❌ JSON parse failed:', parseError.message);
      console.log('Raw content:', content.substring(0, 500));
      throw new Error('Failed to parse AI response');
    }
    
    // CRITICAL: Validate and fix the eBay title
    if (!listing.ebay_title || listing.ebay_title.trim().length === 0) {
      console.log('⚠️ Title missing - generating fallback');
      
      const brand = listing.brand || fashionDetails.brands[0] || 'Unbranded';
      const item = listing.item_type || fashionDetails.itemTypes[0] || 'Clothing Item';
      const size = listing.size || fashionDetails.sizes[0] || 'M';
      const color = listing.color || fashionDetails.colors[0] || 'Black';
      const condition = listing.condition_score >= 8 ? 'Excellent' : 'Good';
      
      listing.ebay_title = `${brand} ${item} Size ${size} ${color} ${condition} Condition UK Fashion`.substring(0, 80);
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
      const padding = ['UK', 'Fashion', 'Quality', 'Genuine', 'Authentic', 'Style', 'Trendy', 'Designer'];
      while (listing.ebay_title.length < 80 && padding.length > 0) {
        const word = padding.shift();
        if (listing.ebay_title.length + word.length + 1 <= 80) {
          listing.ebay_title += ' ' + word;
        }
      }
    }
    
    console.log('✅ Final eBay title:', listing.ebay_title, `(${listing.ebay_title.length} chars)`);
    
    // Add fallback values for any missing fields
    listing.brand = listing.brand || 'Unbranded';
    listing.item_type = listing.item_type || 'Fashion Item';
    listing.size = listing.size || 'One Size';
    listing.color = listing.color || 'Multi';
    listing.condition_score = listing.condition_score || 7;
    listing.suggested_price = listing.suggested_price || 15;
    listing.category = listing.category || 'Clothes, Shoes & Accessories';
    listing.gender = listing.gender || 'Unisex';
    listing.keywords = listing.keywords || ['fashion', 'uk', 'style'];
    
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
    let userEmail = 'test@example.com';
    
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
      
      // Return user-friendly error
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
      credits_remaining: 49, // Mock for now
      analyzed_at: new Date().toISOString(),
      vision_success: !!visionData,
      brands_detected: fashionDetails?.brands || []
    };
    
    // 5. Save to database (optional - only if user is authenticated)
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
        // Continue anyway - don't fail the request
      }
    }
    
    console.log('✅ Analysis complete!');
    console.log('Title:', completeAnalysis.ebay_title);
    console.log('Brand:', completeAnalysis.brand);
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
    message: 'LightLister AI Analysis API v2.0',
    apis,
    issues: Object.entries(apis)
      .filter(([_, configured]) => !configured)
      .map(([api]) => `${api} not configured`),
    timestamp: new Date().toISOString()
  });
}