// app/api/analyze/route.js
// VERSION WITH STRICT TITLE FORMATTING ENFORCED

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ========== TITLE FORMATTER ==========

function formatEbayTitle(components) {
  const {
    brand = 'Unbranded',
    item_type = 'Item',
    gender = 'Unisex',
    size = 'One Size',
    color = 'Multi',
    material = '',
    keywords = []
  } = components;
  
  // Build base title in EXACT order
  let titleParts = [
    brand,
    item_type,
    gender.replace("'s", "s"), // Mens not Men's
    'Size',
    size,
    color,
    material
  ].filter(Boolean); // Remove empty values
  
  let baseTitle = titleParts.join(' ');
  
  // Add keywords until we hit 80 chars
  const relevantKeywords = [...keywords];
  let finalTitle = baseTitle;
  
  for (const keyword of relevantKeywords) {
    const testTitle = finalTitle + ' ' + keyword;
    if (testTitle.length <= 80) {
      finalTitle = testTitle;
    } else {
      break;
    }
  }
  
  // If still under 80, add padding
  if (finalTitle.length < 80) {
    const padding = ['UK', 'Seller', 'Fast', 'Post', 'Genuine'];
    for (const word of padding) {
      if (finalTitle.length + word.length + 1 <= 80) {
        finalTitle += ' ' + word;
      }
    }
  }
  
  // Ensure exactly 80 chars
  if (finalTitle.length > 80) {
    finalTitle = finalTitle.substring(0, 80).trim();
  }
  
  return finalTitle;
}

// ========== HELPER FUNCTIONS ==========

async function fetchImageAsBase64(imageUrl) {
  try {
    console.log('📥 Fetching image from URL...');
    
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'LightLister-AI/1.0' },
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
    console.log('⚠️ Google Vision API key not configured');
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
              { type: 'OBJECT_LOCALIZATION', maxResults: 20 }
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

async function extractFashionDetails(visionData) {
  const details = {
    allText: '',
    brands: [],
    sizes: [],
    itemTypes: [],
    colors: [],
    materials: [],
    garmentHints: []
  };
  
  if (!visionData) return details;
  
  if (visionData.textAnnotations?.length > 0) {
    details.allText = visionData.textAnnotations[0].description || '';
    console.log('📝 Text detected:', details.allText.substring(0, 200));
  }
  
  const textUpper = details.allText.toUpperCase();
  
  // Brand detection
  const brands = [
    'CHILDISH', 'ZARA', 'H&M', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK',
    'TOPSHOP', 'ASOS', 'RIVER ISLAND', 'UNIQLO', 'GAP', 'MANGO'
  ];
  
  for (const brand of brands) {
    if (textUpper.includes(brand)) {
      details.brands.push(brand);
    }
  }
  
  // Logo detection
  if (visionData.logoAnnotations) {
    for (const logo of visionData.logoAnnotations) {
      details.brands.push(logo.description.toUpperCase());
    }
  }
  
  details.brands = [...new Set(details.brands)];
  
  // Size detection - be more aggressive
  const sizePatterns = [
    /\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL)\b/,
    /SIZE[:\s]*([XXS|XS|S|M|L|XL|XXL])\b/i,
    /\b(\d{1,2})\b/, // Numeric sizes
    /UK[:\s]*(\d{1,2})/i
  ];
  
  for (const pattern of sizePatterns) {
    const match = textUpper.match(pattern);
    if (match && match[1]) {
      details.sizes.push(match[1]);
      break; // Take first size found
    }
  }
  
  // Garment type detection from vision labels
  const labels = visionData.labelAnnotations?.map(l => l.description.toLowerCase()) || [];
  const objects = visionData.localizedObjectAnnotations?.map(o => o.name.toLowerCase()) || [];
  const allDetections = [...labels, ...objects];
  
  // Check for specific garment features
  const hasLongSleeves = allDetections.some(d => 
    d.includes('long sleeve') || 
    d.includes('sweater') ||
    d.includes('jumper') ||
    d.includes('sweatshirt')
  );
  
  const hasShortSleeves = allDetections.some(d => 
    d.includes('short sleeve') || 
    d.includes('t-shirt') ||
    d.includes('tee')
  );
  
  const hasHood = allDetections.some(d => d.includes('hood'));
  const hasCollar = allDetections.some(d => d.includes('collar') || d.includes('shirt'));
  
  // Determine garment type based on evidence
  if (hasLongSleeves && !hasCollar) {
    if (hasHood) {
      details.itemTypes.push('Hoodie');
    } else if (textUpper.includes('SWEAT') || allDetections.some(d => d.includes('sweat'))) {
      details.itemTypes.push('Sweatshirt');
    } else {
      details.itemTypes.push('Jumper');
    }
    details.garmentHints.push('long sleeves detected');
  } else if (hasShortSleeves) {
    details.itemTypes.push('T-Shirt');
    details.garmentHints.push('short sleeves detected');
  } else if (hasCollar) {
    details.itemTypes.push('Shirt');
  }
  
  // Check for specific clothing items in labels
  const garmentKeywords = {
    'jumper': ['jumper', 'sweater', 'pullover', 'knit'],
    'sweatshirt': ['sweatshirt', 'sweat', 'crew neck'],
    'hoodie': ['hoodie', 'hooded'],
    't-shirt': ['t-shirt', 'tee', 'tshirt'],
    'shirt': ['shirt', 'button', 'collar'],
    'jacket': ['jacket', 'coat', 'blazer'],
    'jeans': ['jeans', 'denim'],
    'trousers': ['trousers', 'pants', 'chinos'],
    'dress': ['dress'],
    'skirt': ['skirt']
  };
  
  for (const [type, keywords] of Object.entries(garmentKeywords)) {
    if (keywords.some(kw => allDetections.some(d => d.includes(kw)))) {
      details.itemTypes.push(type.charAt(0).toUpperCase() + type.slice(1));
    }
  }
  
  // Remove duplicates and prioritize
  details.itemTypes = [...new Set(details.itemTypes)];
  
  // Color detection
  const colors = ['Black', 'White', 'Grey', 'Navy', 'Blue', 'Red', 'Green', 'Pink', 'Brown'];
  for (const color of colors) {
    if (allDetections.some(d => d.includes(color.toLowerCase())) ||
        textUpper.includes(color.toUpperCase())) {
      details.colors.push(color);
    }
  }
  
  // Material detection
  const materials = ['Cotton', 'Polyester', 'Jersey', 'Fleece', 'Wool', 'Denim', 'Nylon'];
  for (const material of materials) {
    if (textUpper.includes(material.toUpperCase()) ||
        allDetections.some(d => d.includes(material.toLowerCase()))) {
      details.materials.push(material);
    }
  }
  
  console.log('🔍 Extracted details:', {
    brands: details.brands,
    sizes: details.sizes,
    types: details.itemTypes,
    colors: details.colors,
    hints: details.garmentHints
  });
  
  return details;
}

async function generateListingWithClaude(fashionDetails, visionData) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey || apiKey === 'your_anthropic_api_key') {
    console.error('❌ Claude API key not configured');
    throw new Error('AI service not configured');
  }
  
  try {
    console.log('🤖 Calling Claude API...');
    
    const visionContext = visionData ? {
      labels: visionData.labelAnnotations?.map(l => l.description) || [],
      objects: visionData.localizedObjectAnnotations?.map(o => o.name) || []
    } : null;
    
    const prompt = `You are an expert UK eBay fashion reseller. Analyze this item and provide ONLY the components needed.

DETECTED INFORMATION:
- Text found: "${fashionDetails.allText || 'None'}"
- Brands detected: ${fashionDetails.brands.join(', ') || 'None'}
- Sizes found: ${fashionDetails.sizes.join(', ') || 'None'}
- Garment hints: ${fashionDetails.garmentHints.join(', ') || 'None'}
- Item types suggested: ${fashionDetails.itemTypes.join(', ') || 'None'}
- Colors: ${fashionDetails.colors.join(', ') || 'None'}
- Materials: ${fashionDetails.materials.join(', ') || 'None'}
${visionContext ? `
- Vision labels: ${visionContext.labels.slice(0, 20).join(', ')}
- Objects: ${visionContext.objects.join(', ')}` : ''}

CRITICAL RULES FOR GARMENT TYPE:
- If long sleeves detected and no collar: It's a JUMPER or SWEATSHIRT (NEVER T-Shirt)
- If short sleeves: It's a T-SHIRT
- If has hood: It's a HOODIE
- If has collar and buttons: It's a SHIRT
- Jumper = UK term for sweater/pullover

SIZE DETECTION:
- Use the FIRST size found: ${fashionDetails.sizes[0] || 'Not found'}
- If no size found, estimate based on garment type

GENDER DETECTION:
- Look for: Mens, Womens, Ladies, Girls, Boys, Unisex
- Default to Mens for streetwear brands
- Use garment style as hint (fitted = Womens, boxy = Mens)

Return ONLY this JSON (I will format the title myself):
{
  "brand": "Exact brand detected or Unbranded",
  "item_type": "Jumper/Sweatshirt/T-Shirt/Hoodie/Shirt/Jeans/Dress etc (ONE word only)",
  "gender": "Mens/Womens/Boys/Girls/Unisex (NO apostrophes)",
  "size": "S/M/L/XL or numeric",
  "color": "Main colour with UK spelling",
  "material": "Cotton/Polyester/Jersey etc or blank if unknown",
  "keywords": ["streetwear", "vintage", "casual", "vgc", "excellent", "bnwt", "y2k", "retro"],
  "condition_score": 7,
  "suggested_price": 18,
  "category": "Mens Clothing > Jumpers & Cardigans",
  "description": "Detailed description"
}

IMPORTANT: 
- item_type must be ONE word (Jumper not "Long Sleeve Jumper")
- gender must have NO apostrophes (Mens not Men's)
- keywords should be relevant eBay search terms`;

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
        temperature: 0.1, // Very low for consistency
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error('AI service temporarily unavailable');
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }
    
    const listing = JSON.parse(jsonMatch[0]);
    
    // Clean up the components
    listing.brand = listing.brand || 'Unbranded';
    listing.item_type = listing.item_type || 'Item';
    listing.gender = (listing.gender || 'Unisex').replace("'s", "s"); // Remove apostrophes
    listing.size = listing.size || fashionDetails.sizes[0] || 'One Size';
    listing.color = listing.color || fashionDetails.colors[0] || 'Multi';
    listing.material = listing.material || fashionDetails.materials[0] || '';
    listing.keywords = listing.keywords || ['genuine', 'uk', 'seller'];
    
    // Build the title using our strict formatter
    listing.ebay_title = formatEbayTitle({
      brand: listing.brand,
      item_type: listing.item_type,
      gender: listing.gender,
      size: listing.size,
      color: listing.color,
      material: listing.material,
      keywords: listing.keywords
    });
    
    console.log('✅ Title built:', listing.ebay_title, `(${listing.ebay_title.length} chars)`);
    
    return listing;
    
  } catch (error) {
    console.error('❌ Claude API error:', error.message);
    throw error;
  }
}

// ========== MAIN HANDLER ==========
export async function POST(request) {
  console.log('\n🚀 === ANALYSIS WITH STRICT TITLE FORMAT ===');
  
  try {
    let userId = 'temp-user-' + Date.now();
    try {
      const { userId: authUserId } = await auth();
      if (authUserId) userId = authUserId;
    } catch (authError) {
      console.log('⚠️ Auth bypassed');
    }
    
    const body = await request.json();
    const { imageUrls = [], imageCount = 1 } = body;
    
    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No images provided'
      }, { status: 400 });
    }
    
    const analysisId = `analysis-${Date.now()}`;
    
    // Main pipeline
    let finalListing = null;
    
    try {
      const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
      const visionData = await analyzeWithGoogleVision(imageBase64);
      const fashionDetails = await extractFashionDetails(visionData);
      
      finalListing = await generateListingWithClaude(fashionDetails, visionData);
      
      // Double-check title format
      if (!finalListing.ebay_title || finalListing.ebay_title.length !== 80) {
        console.log('⚠️ Title not exactly 80 chars, reformatting...');
        finalListing.ebay_title = formatEbayTitle({
          brand: finalListing.brand,
          item_type: finalListing.item_type,
          gender: finalListing.gender,
          size: finalListing.size,
          color: finalListing.color,
          material: finalListing.material,
          keywords: finalListing.keywords
        });
      }
      
    } catch (pipelineError) {
      console.error('❌ Pipeline error:', pipelineError.message);
      throw pipelineError;
    }
    
    const completeAnalysis = {
      ...finalListing,
      id: analysisId,
      sku: `${(finalListing.brand || 'UNB').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: imageCount,
      image_urls: imageUrls,
      credits_remaining: 49,
      analyzed_at: new Date().toISOString()
    };
    
    console.log('✅ Final title structure:');
    console.log(`   Brand: ${finalListing.brand}`);
    console.log(`   Item: ${finalListing.item_type}`);
    console.log(`   Gender: ${finalListing.gender}`);
    console.log(`   Size: ${finalListing.size}`);
    console.log(`   Colour: ${finalListing.color}`);
    console.log(`   Material: ${finalListing.material}`);
    console.log(`   Title: ${finalListing.ebay_title}`);
    
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

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'LightLister AI v4.0 - Strict Title Format',
    titleFormat: 'Brand Item Gender Size [size] Colour Material [keywords to 80 chars]',
    timestamp: new Date().toISOString()
  });
}