// app/api/analyze/route.js
// VERSION WITH BRAND LEARNING SYSTEM

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ========== BRAND LEARNING SYSTEM ==========

// Get brands from database
async function getDatabaseBrands() {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('brand_name, display_name, confidence_score')
      .order('confidence_score', { ascending: false });
    
    if (error) {
      console.error('Error fetching brands:', error);
      return [];
    }
    
    return data.map(b => b.brand_name.toUpperCase());
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}

// Add or update brand in database
async function learnBrand(brandName, source = 'vision_api', analysisId = null, userId = null) {
  try {
    const normalizedBrand = brandName.toUpperCase().trim();
    
    // Check if brand exists
    const { data: existing, error: fetchError } = await supabase
      .from('brands')
      .select('id, confidence_score, total_detections')
      .eq('brand_name', normalizedBrand)
      .single();
    
    if (existing) {
      // Update existing brand
      await supabase
        .from('brands')
        .update({
          confidence_score: existing.confidence_score + 1,
          total_detections: existing.total_detections + 1,
          last_detected: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      console.log(`📈 Brand confidence increased: ${normalizedBrand} (score: ${existing.confidence_score + 1})`);
    } else {
      // Add new brand
      await supabase
        .from('brands')
        .insert({
          brand_name: normalizedBrand,
          display_name: brandName,
          confidence_score: 1,
          total_detections: 1
        });
      
      console.log(`🆕 New brand learned: ${normalizedBrand}`);
    }
    
    // Log detection
    await supabase
      .from('brand_detections')
      .insert({
        analysis_id: analysisId,
        brand_name: normalizedBrand,
        detection_source: source,
        user_id: userId
      });
    
  } catch (error) {
    console.error('Error learning brand:', error);
  }
}

// ========== HELPER FUNCTIONS ==========

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
    return data.responses?.[0] || null;
    
  } catch (error) {
    console.error('❌ Google Vision error:', error.message);
    return null;
  }
}

// Enhanced fashion detail extraction with brand learning
async function extractFashionDetails(visionData, analysisId, userId) {
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
  
  // Get brands from database
  const databaseBrands = await getDatabaseBrands();
  console.log(`📚 Loaded ${databaseBrands.length} brands from database`);
  
  // Core brand list (fallback)
  const coreBrands = [
    'CHILDISH', 'ZARA', 'H&M', 'HM', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK', 
    'TOPSHOP', 'ASOS', 'MARKS & SPENCER', 'M&S', 'UNIQLO', 'GAP', 
    'MANGO', 'COS', 'RIVER ISLAND', 'NEW LOOK', 'BOOHOO', 'MISSGUIDED',
    'RALPH LAUREN', 'TOMMY HILFIGER', 'CALVIN KLEIN', 'LEVI\'S', 'LEVIS',
    'LACOSTE', 'FRED PERRY', 'BURBERRY', 'TED BAKER', 'SUPERDRY'
  ];
  
  // Combine database brands with core brands
  const allBrands = [...new Set([...databaseBrands, ...coreBrands])];
  
  // Check for brands in text
  for (const brand of allBrands) {
    if (textUpper.includes(brand)) {
      details.brands.push(brand);
      // Learn this brand detection
      await learnBrand(brand, 'text_extraction', analysisId, userId);
    }
  }
  
  // Check for potential new brands from logos
  if (visionData.logoAnnotations) {
    for (const logo of visionData.logoAnnotations) {
      const logoBrand = logo.description.toUpperCase();
      details.brands.push(logoBrand);
      
      // Learn this potential new brand
      await learnBrand(logoBrand, 'logo_detection', analysisId, userId);
      console.log(`🔍 Potential new brand from logo: ${logoBrand}`);
    }
  }
  
  // Check for potential brands in capitalized words (heuristic)
  const capitalizedWords = details.allText.match(/\b[A-Z][A-Za-z]+\b/g) || [];
  for (const word of capitalizedWords) {
    // Check if it looks like a brand (not common words)
    const commonWords = ['Size', 'Small', 'Medium', 'Large', 'Cotton', 'Polyester', 'Made', 'China', 'Vietnam'];
    if (!commonWords.includes(word) && word.length > 3) {
      // This could be a brand - mark for review
      console.log(`❓ Potential brand candidate: ${word}`);
      // Don't auto-learn these, but log them for manual review
    }
  }
  
  // Remove duplicates
  details.brands = [...new Set(details.brands)];
  
  // Size detection
  const sizePatterns = [
    /\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)\b/,
    /SIZE[:\s]*([XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL])\b/i,
    /UK[:\s]*(\d{1,2})/i,
    /SIZE[:\s]*UK[:\s]*(\d{1,2})/i,
    /EUR?[:\s]*(\d{2,3})/i,
    /US[:\s]*(\d{1,2})/i,
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
  
  // Garment type detection
  const labels = visionData.labelAnnotations?.map(l => l.description.toLowerCase()) || [];
  const objects = visionData.localizedObjectAnnotations?.map(o => o.name.toLowerCase()) || [];
  const allDetections = [...labels, ...objects];
  
  // Check for garment indicators
  const hasLongSleeves = allDetections.some(d => 
    d.includes('long sleeve') || 
    d.includes('long-sleeve') ||
    d.includes('sleeve') && !d.includes('short')
  );
  
  const hasRibbedCuffs = textUpper.includes('RIBBED') || textUpper.includes('CUFF');
  const hasCrewNeck = textUpper.includes('CREW') || allDetections.some(d => d.includes('crew neck'));
  
  // Determine garment type
  if (hasLongSleeves && (hasRibbedCuffs || hasCrewNeck)) {
    details.itemTypes.push('Sweatshirt', 'Jumper');
    details.garmentHints.push('long sleeve with ribbed details');
  }
  
  // Color detection
  const colors = [
    'Black', 'White', 'Grey', 'Navy', 'Blue', 'Red', 'Green', 
    'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Beige', 'Cream'
  ];
  
  for (const color of colors) {
    if (allDetections.some(d => d.toLowerCase().includes(color.toLowerCase())) ||
        textUpper.includes(color.toUpperCase())) {
      details.colors.push(color);
    }
  }
  
  // Material detection
  const materials = [
    'Cotton', 'Polyester', 'Jersey', 'Fleece', 'Wool', 'Nylon'
  ];
  
  for (const material of materials) {
    if (textUpper.includes(material.toUpperCase()) ||
        allDetections.some(d => d.toLowerCase().includes(material.toLowerCase()))) {
      details.materials.push(material);
    }
  }
  
  console.log('🔍 Extracted details with learned brands:', {
    brands: details.brands,
    sizes: details.sizes,
    types: details.itemTypes,
    colors: details.colors
  });
  
  return details;
}

// Generate listing with Claude
async function generateListingWithClaude(fashionDetails, visionData, imageCount) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey || apiKey === 'your_anthropic_api_key') {
    console.error('❌ Claude API key not configured');
    throw new Error('AI service not configured');
  }
  
  try {
    console.log('🤖 Calling Claude API...');
    
    const visionContext = visionData ? {
      labels: visionData.labelAnnotations?.map(l => l.description) || [],
      objects: visionData.localizedObjectAnnotations?.map(o => o.name) || [],
      logos: visionData.logoAnnotations?.map(l => l.description) || []
    } : null;
    
    const prompt = `You are an expert UK eBay fashion reseller. Analyze this item and create perfect listings.

CRITICAL GARMENT TYPE DETECTION:
- Long sleeves with ribbed cuffs/hem = JUMPER or SWEATSHIRT (NOT T-shirt)
- Short sleeves = T-SHIRT
- Hood = HOODIE
- Buttons down front = SHIRT or CARDIGAN

DETECTED INFORMATION:
- Text found: "${fashionDetails.allText || 'None'}"
- Brands: ${fashionDetails.brands.length > 0 ? fashionDetails.brands.join(', ') : 'None'}
- Sizes: ${fashionDetails.sizes.length > 0 ? fashionDetails.sizes.join(', ') : 'None'}
- Garment hints: ${fashionDetails.garmentHints.join(', ') || 'None'}
- Colors: ${fashionDetails.colors.join(', ') || 'Not specified'}
- Materials: ${fashionDetails.materials.join(', ') || 'Not specified'}
${visionContext ? `
- Visual labels: ${visionContext.labels.slice(0, 15).join(', ')}
- Objects: ${visionContext.objects.join(', ')}
- Logos: ${visionContext.logos.join(', ')}` : ''}

CRITICAL TITLE FORMAT (EXACTLY 80 CHARACTERS):
MUST follow: [Brand] [Gender] [Item] Size [Size] [Colour] [Material] [Keywords]

Examples:
- "Childish Mens Jumper Size S Red Cotton Jersey Crew Neck Streetwear Long Sleeve UK"
- "Nike Womens Hoodie Size M Black Polyester Fleece Sports Gym Training Warm Running"

RULES:
1. If long sleeves detected, use JUMPER or SWEATSHIRT (never T-Shirt)
2. Use FIRST size found if multiple detected
3. UK spelling always (Colour, Grey, Jumper)
4. Keywords must be eBay searchable terms

Return ONLY this JSON:
{
  "brand": "Exact brand or Unbranded",
  "item_type": "Jumper/Sweatshirt/T-Shirt/Hoodie etc",
  "size": "Exact size detected",
  "color": "Colour with UK spelling",
  "condition_score": 7,
  "condition_text": "Very Good Condition",
  "estimated_value_min": 10,
  "estimated_value_max": 25,
  "ebay_title": "EXACTLY 80 character title",
  "vinted_title": "Casual title under 50 chars",
  "description": "Detailed description",
  "suggested_price": 18,
  "category": "Mens Clothing > Jumpers & Cardigans",
  "material": "Cotton Jersey or detected",
  "style": "Streetwear/Casual",
  "gender": "Mens/Womens/Unisex",
  "keywords": ["streetwear", "casual", "uk"]
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
      throw new Error('AI service temporarily unavailable');
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
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
    
    // Format title
    listing.ebay_title = listing.ebay_title
      .replace(/[.,\-£$]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Ensure exactly 80 characters
    if (listing.ebay_title.length > 80) {
      listing.ebay_title = listing.ebay_title.substring(0, 80).trim();
    } else if (listing.ebay_title.length < 80) {
      const padding = ['UK', 'Seller', 'Fast', 'Post'];
      while (listing.ebay_title.length < 80 && padding.length > 0) {
        const word = padding.shift();
        if (listing.ebay_title.length + word.length + 1 <= 80) {
          listing.ebay_title += ' ' + word;
        }
      }
    }
    
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
    // 1. Check authentication
    let userId = 'temp-user-' + Date.now();
    
    try {
      const { userId: authUserId } = await auth();
      if (authUserId) {
        userId = authUserId;
      }
    } catch (authError) {
      console.log('⚠️ Auth bypassed for testing');
    }
    
    // 2. Parse request
    const body = await request.json();
    const { imageUrls = [], imageCount = 1 } = body;
    
    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No images provided'
      }, { status: 400 });
    }
    
    console.log(`📸 Processing ${imageUrls.length} images`);
    
    // 3. Generate analysis ID
    const analysisId = `analysis-${Date.now()}`;
    
    // 4. Main AI pipeline
    let finalListing = null;
    
    try {
      const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
      const visionData = await analyzeWithGoogleVision(imageBase64);
      
      // Extract details with brand learning
      const fashionDetails = await extractFashionDetails(visionData, analysisId, userId);
      
      finalListing = await generateListingWithClaude(fashionDetails, visionData, imageCount);
      
      // Learn the final brand from Claude's analysis
      if (finalListing.brand && finalListing.brand !== 'Unbranded') {
        await learnBrand(finalListing.brand, 'claude_analysis', analysisId, userId);
      }
      
    } catch (pipelineError) {
      console.error('❌ Pipeline error:', pipelineError.message);
      throw pipelineError;
    }
    
    // 5. Create complete analysis
    const completeAnalysis = {
      ...finalListing,
      id: analysisId,
      sku: `${(finalListing.brand || 'UNB').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: imageCount,
      image_urls: imageUrls,
      credits_remaining: 49,
      analyzed_at: new Date().toISOString()
    };
    
    // 6. Save to database
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
      } catch (dbError) {
        console.error('⚠️ Database save failed:', dbError.message);
      }
    }
    
    console.log('✅ Analysis complete with brand learning!');
    
    return NextResponse.json({
      success: true,
      analysis: completeAnalysis
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Analysis failed. Please try again.'
    }, { status: 500 });
  }
}

// GET endpoint for health check
export async function GET() {
  // Get brand count from database
  let brandCount = 0;
  try {
    const { count } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });
    brandCount = count || 0;
  } catch (error) {
    console.error('Error counting brands:', error);
  }
  
  return NextResponse.json({
    status: 'ok',
    message: 'LightLister AI v2.2 - With Brand Learning',
    brandsInDatabase: brandCount,
    apis: {
      googleVision: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    },
    timestamp: new Date().toISOString()
  });
}