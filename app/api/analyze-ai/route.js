// app/api/analyze-ai/route.js
// COMPLETE AI ANALYSIS API WITH ENHANCED ERROR HANDLING

import { NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server'; // TEMPORARY: Commented out while Clerk SSL is pending
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Fetch image from URL and convert to base64 (handles both Supabase and blob URLs)
async function fetchImageAsBase64(imageUrl, retries = 3) {
  try {
    console.log(`📥 Processing image URL:`, imageUrl.substring(0, 50) + '...');
    
    // Handle blob URLs (fallback storage)
    if (imageUrl.startsWith('blob:')) {
      console.log('📄 Processing blob URL...');
      
      // For blob URLs, we need to fetch from the client side
      // Since this is server-side, we'll need the image data passed differently
      throw new Error('Blob URLs must be processed client-side. Please use Supabase storage.');
    }
    
    // Handle regular URLs (Supabase, etc.)
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📥 Fetching image (attempt ${attempt}/${retries})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(imageUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'LightLister-AI/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.startsWith('image/')) {
          throw new Error(`Invalid content type: ${contentType}`);
        }
        
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        
        console.log(`✅ Image fetched: ${Math.round(base64.length / 1024)}KB`);
        return { base64, contentType };
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    
  } catch (error) {
    console.error('❌ Image fetch failed:', error.message);
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

// Call Google Vision API with enhanced error handling
async function analyzeWithGoogleVision(imageBase64, contentType = 'image/jpeg') {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Missing Google Vision API key');
    return null;
  }
  
  try {
    console.log('🔍 Calling Google Vision API...');
    
    const requestBody = {
      requests: [{
        image: { content: imageBase64 },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 10 },
          { type: 'LABEL_DETECTION', maxResults: 20 },
          { type: 'LOGO_DETECTION', maxResults: 10 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 15 },
          { type: 'IMAGE_PROPERTIES', maxResults: 5 }
        ],
        imageContext: {
          textDetectionParams: {
            enableTextDetectionConfidenceScore: true
          }
        }
      }]
    };
    
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
      console.error('❌ Google Vision API error:', response.status, responseText);
      
      // Handle specific error cases
      if (response.status === 429) {
        throw new Error('Google Vision API quota exceeded');
      } else if (response.status === 403) {
        throw new Error('Google Vision API access denied - check API key');
      } else {
        throw new Error(`Google Vision API error: ${response.status}`);
      }
    }

    const data = JSON.parse(responseText);
    const result = data.responses?.[0];
    
    if (result?.error) {
      console.error('❌ Vision API returned error:', result.error);
      return null;
    }
    
    if (result) {
      console.log('✅ Vision API analysis complete:', {
        textDetections: result.textAnnotations?.length || 0,
        firstText: result.textAnnotations?.[0]?.description?.substring(0, 100) || 'No text found',
        labels: result.labelAnnotations?.length || 0,
        topLabels: result.labelAnnotations?.slice(0, 5).map(l => `${l.description} (${Math.round(l.score * 100)}%)`).join(', ') || 'None',
        logos: result.logoAnnotations?.length || 0,
        logoNames: result.logoAnnotations?.map(l => l.description).join(', ') || 'None',
        objects: result.localizedObjectAnnotations?.length || 0,
        topObjects: result.localizedObjectAnnotations?.slice(0, 5).map(o => o.name).join(', ') || 'None',
        dominantColors: result.imagePropertiesAnnotation?.dominantColors?.colors?.slice(0, 3).map(c => 
          `RGB(${Math.round(c.color.red || 0)},${Math.round(c.color.green || 0)},${Math.round(c.color.blue || 0)})`
        ).join(', ') || 'None'
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Google Vision error:', error.message);
    return null;
  }
}

// Enhanced fashion details extraction
function extractFashionDetails(visionData) {
  const details = {
    allText: '',
    possibleBrands: [],
    possibleSizes: [],
    itemTypes: [],
    colors: [],
    materials: [],
    confidence: 0
  };
  
  // Get all text with confidence
  if (visionData?.textAnnotations?.length > 0) {
    details.allText = visionData.textAnnotations[0].description || '';
    console.log('📝 Detected text:', details.allText.substring(0, 300));
  }
  
  const textUpper = details.allText.toUpperCase();
  
  // Enhanced UK fashion brands list
  const brandList = [
    // High Street
    'ZARA', 'H&M', 'HM', 'H & M', 'NEXT', 'PRIMARK', 'TOPSHOP', 'ASOS', 
    'MARKS & SPENCER', 'M&S', 'UNIQLO', 'GAP', 'MANGO', 'COS', 
    'RIVER ISLAND', 'NEW LOOK', 'BOOHOO', 'MISSGUIDED', 'PRETTY LITTLE THING',
    
    // Sports/Activewear
    'NIKE', 'ADIDAS', 'PUMA', 'REEBOK', 'UNDER ARMOUR', 'FILA', 'KAPPA',
    'THE NORTH FACE', 'PATAGONIA', 'COLUMBIA', 'BERGHAUS', 'REGATTA',
    
    // Premium/Designer
    'RALPH LAUREN', 'POLO RALPH LAUREN', 'TOMMY HILFIGER', 'CALVIN KLEIN', 
    'LACOSTE', 'FRED PERRY', 'BURBERRY', 'TED BAKER', 'SUPERDRY',
    'HUGO BOSS', 'ARMANI', 'VERSACE', 'GUCCI', 'PRADA',
    
    // Denim
    'LEVI\'S', 'LEVIS', 'WRANGLER', 'LEE', 'DIESEL', 'G-STAR', 'REPLAY',
    
    // Other Popular
    'MONSOON', 'PHASE EIGHT', 'WAREHOUSE', 'OASIS', 'KAREN MILLEN',
    'FRENCH CONNECTION', 'FCUK', 'WHISTLES', 'REISS', 'ALL SAINTS'
  ];
  
  // Check for brands in text
  let brandConfidence = 0;
  for (const brand of brandList) {
    if (textUpper.includes(brand)) {
      details.possibleBrands.push(brand);
      brandConfidence += 0.8;
    }
  }
  
  // Check logos with confidence
  if (visionData?.logoAnnotations) {
    for (const logo of visionData.logoAnnotations) {
      const logoName = logo.description.toUpperCase();
      details.possibleBrands.push(logoName);
      brandConfidence += logo.score || 0.5;
      console.log(`🏷️ Logo detected: ${logoName} (confidence: ${Math.round((logo.score || 0) * 100)}%)`);
    }
  }
  
  // Enhanced size detection with UK focus
  const sizePatterns = [
    /UK\s*SIZE:?\s*(\d{1,2})/i,
    /SIZE:?\s*UK\s*(\d{1,2})/i,
    /SIZE:?\s*([XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL])\b/i,
    /\bUK\s*(\d{1,2})\b/i,
    /\bEUR:?\s*(\d{2,3})/i,
    /\b(XS|S|M|L|XL|XXL|XXXL)\b/,
    /SIZE\s+(\d{1,2})/i,
    /(\d{1,2})\s*UK/i
  ];
  
  let sizeConfidence = 0;
  for (const pattern of sizePatterns) {
    const match = textUpper.match(pattern);
    if (match) {
      details.possibleSizes.push(match[1]);
      sizeConfidence += 0.7;
    }
  }
  
  // Item type detection from labels and objects
  const clothingTypes = [
    'Shirt', 'T-shirt', 'Tee', 'Dress', 'Jeans', 'Trousers', 'Pants', 
    'Jacket', 'Coat', 'Sweater', 'Jumper', 'Hoodie', 'Sweatshirt',
    'Blazer', 'Skirt', 'Shorts', 'Top', 'Blouse', 'Cardigan', 
    'Vest', 'Suit', 'Tracksuit', 'Joggers', 'Leggings'
  ];
  
  const labels = visionData?.labelAnnotations?.map(l => l.description) || [];
  const objects = visionData?.localizedObjectAnnotations?.map(o => o.name) || [];
  const allDetections = [...labels, ...objects];
  
  let itemConfidence = 0;
  for (const item of clothingTypes) {
    if (allDetections.some(d => d.toLowerCase().includes(item.toLowerCase()))) {
      details.itemTypes.push(item);
      itemConfidence += 0.6;
    }
  }
  
  // Color detection from dominant colors and labels
  const colorMap = {
    'Black': ['black', 'noir', 'schwarz'],
    'White': ['white', 'blanc', 'weiss', 'cream', 'ivory'],
    'Blue': ['blue', 'bleu', 'blau', 'navy', 'denim'],
    'Red': ['red', 'rouge', 'rot', 'crimson', 'burgundy'],
    'Green': ['green', 'vert', 'grün', 'olive', 'khaki'],
    'Grey': ['grey', 'gray', 'gris', 'grau', 'silver'],
    'Brown': ['brown', 'brun', 'braun', 'tan', 'beige'],
    'Pink': ['pink', 'rose', 'rosa', 'magenta'],
    'Purple': ['purple', 'violet', 'lila'],
    'Yellow': ['yellow', 'jaune', 'gelb', 'gold'],
    'Orange': ['orange', 'coral']
  };
  
  // Check dominant colors
  if (visionData?.imagePropertiesAnnotation?.dominantColors?.colors) {
    const dominantColors = visionData.imagePropertiesAnnotation.dominantColors.colors.slice(0, 3);
    for (const colorInfo of dominantColors) {
      const { red = 0, green = 0, blue = 0 } = colorInfo.color;
      const colorName = getColorName(red, green, blue);
      if (colorName && !details.colors.includes(colorName)) {
        details.colors.push(colorName);
      }
    }
  }
  
  // Check labels for colors
  for (const [colorName, variations] of Object.entries(colorMap)) {
    if (variations.some(variation => 
      allDetections.some(d => d.toLowerCase().includes(variation))
    )) {
      if (!details.colors.includes(colorName)) {
        details.colors.push(colorName);
      }
    }
  }
  
  // Material detection
  const materials = ['Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Denim', 'Leather', 'Cashmere'];
  for (const material of materials) {
    if (textUpper.includes(material.toUpperCase())) {
      details.materials.push(material);
    }
  }
  
  // Calculate overall confidence
  details.confidence = Math.min(1.0, (brandConfidence + sizeConfidence + itemConfidence) / 3);
  
  console.log('🔍 Extracted fashion details:', {
    brands: details.possibleBrands,
    sizes: details.possibleSizes,
    items: details.itemTypes,
    colors: details.colors,
    materials: details.materials,
    confidence: Math.round(details.confidence * 100) + '%'
  });
  
  return details;
}

// Helper function to determine color name from RGB
function getColorName(r, g, b) {
  const colors = [
    { name: 'Black', r: 0, g: 0, b: 0, threshold: 50 },
    { name: 'White', r: 255, g: 255, b: 255, threshold: 50 },
    { name: 'Red', r: 255, g: 0, b: 0, threshold: 100 },
    { name: 'Blue', r: 0, g: 0, b: 255, threshold: 100 },
    { name: 'Green', r: 0, g: 255, b: 0, threshold: 100 },
    { name: 'Yellow', r: 255, g: 255, b: 0, threshold: 100 },
    { name: 'Purple', r: 128, g: 0, b: 128, threshold: 100 },
    { name: 'Orange', r: 255, g: 165, b: 0, threshold: 100 },
    { name: 'Pink', r: 255, g: 192, b: 203, threshold: 100 },
    { name: 'Brown', r: 165, g: 42, b: 42, threshold: 100 },
    { name: 'Grey', r: 128, g: 128, b: 128, threshold: 80 }
  ];
  
  for (const color of colors) {
    const distance = Math.sqrt(
      Math.pow(r - color.r, 2) + 
      Math.pow(g - color.g, 2) + 
      Math.pow(b - color.b, 2)
    );
    if (distance < color.threshold) {
      return color.name;
    }
  }
  
  return null;
}

// Generate listing with Claude AI - Enhanced prompting
async function generateListingWithClaude(fashionDetails, visionData, imageCount) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Missing Anthropic API key');
    return null;
  }
  
  try {
    console.log('🤖 Calling Claude API for listing generation...');
    
    const labels = visionData?.labelAnnotations?.slice(0, 10).map(l => 
      `${l.description} (${Math.round(l.score * 100)}%)`
    ).join(', ') || 'none detected';
    
    const objects = visionData?.localizedObjectAnnotations?.slice(0, 8).map(o => 
      `${o.name} (${Math.round(o.score * 100)}%)`
    ).join(', ') || 'none detected';
    
    const prompt = `You are an expert UK eBay fashion seller specializing in creating perfect listings for resellers. Analyze this fashion item and create a professional listing.

DETECTED INFORMATION FROM AI ANALYSIS:
- Text from clothing labels/tags: "${fashionDetails.allText.substring(0, 500)}"
- Detected brands: ${fashionDetails.possibleBrands.join(', ') || 'None detected'}
- Possible sizes: ${fashionDetails.possibleSizes.join(', ') || 'None detected'}  
- Visual object labels: ${labels}
- Detected objects: ${objects}
- Dominant colors: ${fashionDetails.colors.join(', ') || 'Not specified'}
- Item types identified: ${fashionDetails.itemTypes.join(', ') || 'Generic clothing'}
- Materials detected: ${fashionDetails.materials.join(', ') || 'Not specified'}
- Analysis confidence: ${Math.round(fashionDetails.confidence * 100)}%
- Number of photos: ${imageCount}

REQUIREMENTS FOR UK EBAY LISTING:
1. Create eBay UK title (MAX 80 characters) in format: [Brand] [Gender] [Item Type] [Key Feature] Size [Size]
2. If NO brand clearly detected, use "Unbranded" 
3. Use UK spelling (colour not color, grey not gray)
4. Price in GBP (£) for UK market - research current eBay sold listings
5. Use UK sizing (8, 10, 12, 14 etc for women's clothing)
6. Professional reseller tone - detailed but concise

PRICING GUIDELINES:
- High street brands (Zara, H&M, Next): £8-25
- Premium brands (Ralph Lauren, Tommy): £15-45  
- Designer/luxury brands: £25-80+
- Sportswear (Nike, Adidas): £12-35
- Unbranded items: £5-15

Return ONLY this valid JSON structure:
{
  "brand": "detected brand name or 'Unbranded'",
  "item_type": "specific clothing type (e.g. 'Midi Dress', 'Slim Fit Jeans')",
  "size": "UK size (e.g. '12', 'Medium', 'L')",
  "color": "main colour in British English",
  "condition_score": 8,
  "estimated_value_min": 12,
  "estimated_value_max": 28,
  "ebay_title": "Perfect 80-character eBay UK title",
  "description": "Professional bullet-point description focusing on brand, condition, measurements if known, and selling points",
  "suggested_price": 18,
  "category": "Clothes, Shoes & Accessories > Women's Clothing > Dresses",
  "material": "fabric/material if detected",
  "style": "clothing style (e.g. Casual, Smart, Vintage)",
  "gender": "Men's/Women's/Unisex",
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
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.2,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    console.log('📝 Claude response received, parsing JSON...');
    
    // Extract JSON from Claude response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const listing = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (!listing.ebay_title || !listing.brand || !listing.suggested_price) {
          throw new Error('Missing required fields in Claude response');
        }
        
        // Ensure title is under 80 characters
        if (listing.ebay_title.length > 80) {
          listing.ebay_title = listing.ebay_title.substring(0, 77) + '...';
        }
        
        console.log('✅ Claude listing generated successfully:', {
          title: listing.ebay_title,
          brand: listing.brand,
          price: `£${listing.suggested_price}`,
          confidence: fashionDetails.confidence
        });
        
        return listing;
        
      } catch (parseError) {
        console.error('❌ Failed to parse Claude JSON response:', parseError);
        console.log('Raw Claude response:', content);
        return null;
      }
    } else {
      console.error('❌ No JSON found in Claude response');
      console.log('Raw Claude response:', content);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Claude API error:', error.message);
    return null;
  }
}

// Main API handler
export async function POST(request) {
  console.log('\n🚀 === NEW AI ANALYSIS REQUEST ===');
  const startTime = Date.now();
  
  try {
    // TEMPORARY: Bypass auth while Clerk SSL is pending
    const userId = 'temp-user-' + Date.now();
    
    /* Original auth code - restore when Clerk SSL is ready
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    */

    const body = await request.json();
    const { imageUrls = [], imageData = [], imageCount } = body;
    const numImages = imageUrls.length + imageData.length || imageCount || 1;
    
    console.log(`📸 Processing ${numImages} images for user ${userId}:`, {
      urls: imageUrls.length,
      base64: imageData.length
    });
    
    if (!imageUrls.length && !imageData.length) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }
    
    console.log(`📸 Processing ${numImages} images for user ${userId}:`, {
      urls: imageUrls.length,
      base64: imageData.length,
      firstUrl: imageUrls[0] ? imageUrls[0].substring(0, 50) + '...' : 'none'
    });
    
    // TEMPORARY: Mock user data while Clerk/DB is bypassed
    const userData = {
      credits_total: 50,
      credits_used: 0,
      bonus_credits: 0
    };
    const creditsAvailable = 10; // Mock credits
    
    /* Original database code - restore when Clerk SSL is ready
    // Get or create user
    let { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      console.log('👤 Creating new user account...');
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: `user-${userId}@lightlisterai.co.uk`,
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
        error: 'No credits available. Please purchase more credits to continue.',
        credits_remaining: 0 
      }, { status: 402 });
    }
    */

    console.log(`💳 User has ${creditsAvailable} credits available`);

    // AI Analysis Pipeline
    let finalListing = null;
    let analysisMetadata = {
      pipeline_steps: [],
      errors: [],
      processing_time: 0
    };
    
    try {
      let imageBase64, contentType;
      
      // Get image data (prefer URLs, fallback to base64)
      if (imageUrls.length > 0) {
        console.log('📥 Step 1: Fetching image from URL...');
        analysisMetadata.pipeline_steps.push('fetch_url');
        const imageResult = await fetchImageAsBase64(imageUrls[0]);
        imageBase64 = imageResult.base64;
        contentType = imageResult.contentType;
        console.log('✅ Image fetched successfully, base64 length:', imageBase64.length);
      } else if (imageData.length > 0) {
        console.log('📄 Step 1: Using provided base64 data...');
        analysisMetadata.pipeline_steps.push('use_base64');
        const base64Data = imageData[0].base64;
        imageBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        contentType = 'image/jpeg';
        console.log('✅ Base64 data prepared, length:', imageBase64.length);
      } else {
        throw new Error('No image data provided');
      }
      
      if (imageBase64) {
        console.log('🔍 Step 2: Calling Google Vision API...');
        analysisMetadata.pipeline_steps.push('vision_api');
        const visionData = await analyzeWithGoogleVision(imageBase64, contentType);
        
        if (visionData) {
          console.log('✅ Vision API successful, extracting fashion details...');
          analysisMetadata.pipeline_steps.push('extract_details');
          const fashionDetails = extractFashionDetails(visionData);
          
          console.log('🤖 Step 4: Calling Claude for listing generation...');
          analysisMetadata.pipeline_steps.push('claude_generation');
          finalListing = await generateListingWithClaude(fashionDetails, visionData, numImages);
          
          if (finalListing) {
            console.log('✅ Claude generation successful!');
            analysisMetadata.pipeline_steps.push('success');
            finalListing.analysis_confidence = fashionDetails.confidence;
            finalListing.detection_metadata = {
              text_found: !!fashionDetails.allText,
              brands_detected: fashionDetails.possibleBrands.length,
              sizes_detected: fashionDetails.possibleSizes.length,
              items_detected: fashionDetails.itemTypes.length
            };
          } else {
            console.log('❌ Claude generation failed');
          }
        } else {
          console.log('❌ Vision API failed');
        }
      } else {
        console.log('❌ No image data available for analysis');
      }
    } catch (pipelineError) {
      console.error('❌ AI Pipeline error:', pipelineError.message);
      analysisMetadata.errors.push(pipelineError.message);
    }
    
    // Fallback if AI analysis failed
    if (!finalListing) {
      console.log('⚠️ AI analysis failed, using enhanced fallback...');
      analysisMetadata.pipeline_steps.push('fallback');
      
      finalListing = {
        brand: "Unbranded",
        item_type: "Clothing Item", 
        size: "Please Check Label",
        color: "Multi",
        condition_score: 7,
        estimated_value_min: 8,
        estimated_value_max: 20,
        ebay_title: "Unbranded Clothing Item - Please See Photos for Size & Brand Details",
        description: `Pre-owned clothing item as shown in photos.

• Condition: Good used condition  
• Please check all photos for size labels, brand tags, and item details
• Measurements and fabric details visible in images
• From smoke-free home
• Fast UK postage via Royal Mail

Please see photos for exact condition and details.`,
        suggested_price: 12,
        category: "Clothes, Shoes & Accessories",
        material: "See Label",
        style: "Casual",
        gender: "Unisex", 
        keywords: ["clothing", "fashion", "preloved", "uk", "ebay"],
        analysis_confidence: 0.1,
        detection_metadata: {
          text_found: false,
          brands_detected: 0,
          sizes_detected: 0,
          items_detected: 0
        }
      };
    }
    
    // Create complete analysis result
    analysisMetadata.processing_time = Date.now() - startTime;
    
    const completeAnalysis = {
      ...finalListing,
      id: `analysis-${Date.now()}-${userId.slice(-6)}`,
      sku: `${(finalListing.brand || 'UNB').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: numImages,
      image_urls: imageUrls,
      credits_remaining: creditsAvailable - 1, // Mock: 9 remaining
      analyzed_at: new Date().toISOString(),
      processing_metadata: analysisMetadata
    };
    
    // TEMPORARY: Skip database operations while testing
    console.log('💾 Skipping database save (temporary bypass)');
    
    /* Original database save code - restore when Clerk SSL is ready
    // Save to database
    try {
      await supabase.from('analyses').insert({
        id: completeAnalysis.id,
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
      
      console.log('💾 Analysis saved to database');
    } catch (dbError) {
      console.error('❌ Database save error:', dbError.message);
      // Continue anyway - don't fail the request
    }
    
    // Update user credits
    try {
      await supabase
        .from('users')
        .update({ credits_used: (userData?.credits_used || 0) + 1 })
        .eq('clerk_id', userId);
        
      console.log(`💳 Credit deducted, ${creditsAvailable - 1} remaining`);
    } catch (creditError) {
      console.error('❌ Credit update error:', creditError.message);
    }
    */
    
    console.log(`✅ Analysis complete in ${analysisMetadata.processing_time}ms: ${completeAnalysis.ebay_title}`);
    
    return NextResponse.json({
      success: true,
      analysis: completeAnalysis,
      processing_time_ms: analysisMetadata.processing_time,
      pipeline_success: analysisMetadata.pipeline_steps.includes('success')
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Fatal error after ${processingTime}ms:`, error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      processing_time_ms: processingTime
    }, { status: 500 });
  }
}

// Health check endpoint (no auth required)
export async function GET() {
  try {
    // Test API connections
    const apiStatus = {
      googleVision: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    };
    
    // Test Supabase connection
    let dbConnected = false;
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      dbConnected = !error;
    } catch (e) {
      dbConnected = false;
    }
    
    return NextResponse.json({
      status: 'healthy',
      version: '5.0 - Enhanced AI Analysis',
      api_connections: apiStatus,
      database_connected: dbConnected,
      features: [
        'Google Vision API integration',
        'Claude AI listing generation',
        'Enhanced brand detection',
        'UK-focused sizing',
        'Color analysis',
        'Confidence scoring',
        'Fallback system'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}