// app/api/analyze/route.js
// FIXED: Properly process Vision API text and detect garment type

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ========== TEXT EXTRACTION FROM VISION ==========

function extractTextFromVision(visionData) {
  // Get ALL text from the image
  const fullText = visionData?.textAnnotations?.[0]?.description || '';
  
  // Also get individual text blocks for better parsing
  const textBlocks = visionData?.textAnnotations?.slice(1).map(t => t.description) || [];
  
  console.log('📝 Full text extracted:', fullText.length, 'characters');
  console.log('📝 Text blocks:', textBlocks.slice(0, 10));
  
  return {
    fullText,
    textBlocks,
    textUpper: fullText.toUpperCase(),
    lines: fullText.split('\n').filter(l => l.trim())
  };
}

// ========== BRAND DETECTOR ==========

function detectBrand(textData, logos) {
  const { textUpper, textBlocks } = textData;
  
  // Known brands - add more as needed
  const brands = [
    'CHILDISH', 'ZARA', 'H&M', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK',
    'TOPSHOP', 'ASOS', 'RIVER ISLAND', 'UNIQLO', 'GAP', 'MANGO'
  ];
  
  // Check main text
  for (const brand of brands) {
    if (textUpper.includes(brand)) {
      console.log(`✅ Brand found: ${brand}`);
      return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
    }
  }
  
  // Check text blocks (individual words detected)
  for (const block of textBlocks) {
    const blockUpper = block.toUpperCase();
    if (brands.includes(blockUpper)) {
      console.log(`✅ Brand found in block: ${blockUpper}`);
      return block;
    }
  }
  
  // Check logos
  if (logos && logos.length > 0) {
    console.log(`✅ Brand from logo: ${logos[0]}`);
    return logos[0];
  }
  
  return 'Unbranded';
}

// ========== SIZE DETECTOR ==========

function detectSize(textData) {
  const { textUpper, textBlocks, lines } = textData;
  
  // Look for size in various formats
  const sizePatterns = [
    /SIZE[:\s]*([XS|S|M|L|XL|XXL])\b/,
    /\b(XS|S|M|L|XL|XXL)\b(?![A-Z])/,  // Size letter not part of word
    /SIZE[:\s]*(\d{1,2})/,
    /UK[:\s]*(\d{1,2})/
  ];
  
  // Check each line for size
  for (const line of lines) {
    const lineUpper = line.toUpperCase();
    for (const pattern of sizePatterns) {
      const match = lineUpper.match(pattern);
      if (match && match[1]) {
        console.log(`✅ Size found: ${match[1]} in line: "${line}"`);
        return match[1];
      }
    }
  }
  
  // Check text blocks for standalone size indicators
  const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  for (const block of textBlocks) {
    if (validSizes.includes(block.toUpperCase())) {
      console.log(`✅ Size found in block: ${block}`);
      return block.toUpperCase();
    }
  }
  
  console.log('❌ No size found, defaulting to M');
  return 'M';
}

// ========== GARMENT TYPE DETECTOR ==========

function detectGarmentType(labels, textData) {
  const labelsText = labels.map(l => l.toLowerCase()).join(' ');
  const { fullText } = textData;
  const textLower = fullText.toLowerCase();
  
  console.log('🔍 Checking garment type from labels:', labels.slice(0, 5));
  
  // CRITICAL RULES:
  // 1. If we see "long sleeve" or related terms, it's NEVER a T-Shirt
  const longSleeveIndicators = [
    'long sleeve', 'long-sleeve', 'longsleeve',
    'sweater', 'jumper', 'sweatshirt', 'pullover',
    'crew neck', 'ribbed', 'fleece'
  ];
  
  const hasLongSleeves = longSleeveIndicators.some(indicator => 
    labelsText.includes(indicator) || textLower.includes(indicator)
  );
  
  if (hasLongSleeves) {
    console.log('✅ Long sleeves detected - NOT a T-Shirt');
    
    // Determine specific type
    if (labelsText.includes('hood') || textLower.includes('hood')) {
      return 'Hoodie';
    }
    if (labelsText.includes('sweat') || textLower.includes('sweat')) {
      return 'Sweatshirt';
    }
    // Default for long sleeves
    return 'Jumper';
  }
  
  // 2. Only call it T-Shirt if we have evidence of SHORT sleeves
  const shortSleeveIndicators = ['t-shirt', 'tee', 'short sleeve'];
  const hasShortSleeves = shortSleeveIndicators.some(indicator => 
    labelsText.includes(indicator) && !labelsText.includes('long')
  );
  
  if (hasShortSleeves) {
    console.log('✅ Short sleeves detected - T-Shirt');
    return 'T-Shirt';
  }
  
  // 3. Check for other garment types
  if (labelsText.includes('jeans') || labelsText.includes('denim')) return 'Jeans';
  if (labelsText.includes('trousers') || labelsText.includes('pants')) return 'Trousers';
  if (labelsText.includes('dress')) return 'Dress';
  if (labelsText.includes('skirt')) return 'Skirt';
  if (labelsText.includes('jacket')) return 'Jacket';
  if (labelsText.includes('coat')) return 'Coat';
  
  // 4. Default to Jumper if unclear (safer than T-Shirt)
  console.log('⚠️ Garment unclear, defaulting to Jumper (not T-Shirt)');
  return 'Jumper';
}

// ========== MATERIAL DETECTOR ==========

function detectMaterial(textData) {
  const { textUpper, lines } = textData;
  
  // Look for percentage compositions
  const compositionPattern = /(\d{1,3})[%\s]*(COTTON|POLYESTER|VISCOSE|ELASTANE|WOOL|NYLON)/g;
  const matches = textUpper.matchAll(compositionPattern);
  
  for (const match of matches) {
    console.log(`✅ Material found: ${match[1]}% ${match[2]}`);
    return match[2].charAt(0) + match[2].slice(1).toLowerCase();
  }
  
  // Look for material mentions
  const materials = ['Cotton', 'Polyester', 'Jersey', 'Fleece', 'Wool', 'Denim'];
  for (const material of materials) {
    if (textUpper.includes(material.toUpperCase())) {
      console.log(`✅ Material found: ${material}`);
      return material;
    }
  }
  
  return 'Cotton'; // Default
}

// ========== COLOR DETECTOR ==========

function detectColor(labels) {
  const labelsText = labels.map(l => l.toLowerCase()).join(' ');
  
  const colors = [
    'Black', 'White', 'Grey', 'Navy', 'Blue', 'Red', 'Green',
    'Pink', 'Purple', 'Orange', 'Yellow', 'Brown', 'Beige'
  ];
  
  for (const color of colors) {
    if (labelsText.includes(color.toLowerCase())) {
      return color;
    }
  }
  
  return 'Multi';
}

// ========== KEYWORD GENERATOR ==========

function generateKeywords(garmentType, brand) {
  const keywords = [];
  
  // Garment-specific keywords
  if (garmentType === 'Jumper' || garmentType === 'Sweatshirt') {
    keywords.push('Crew', 'Neck', 'Warm');
  }
  
  // Brand-specific keywords
  if (brand === 'Childish') {
    keywords.push('Streetwear');
  }
  
  // Always add these
  keywords.push('VGC', 'UK', 'Genuine', 'Fast', 'Post');
  
  return keywords;
}

// ========== MAIN FUNCTIONS ==========

async function fetchImageAsBase64(imageUrl) {
  const response = await fetch(imageUrl, {
    headers: { 'User-Agent': 'LightLister-AI/1.0' },
    signal: AbortSignal.timeout(15000)
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

async function analyzeWithGoogleVision(imageBase64) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey || apiKey === 'your_google_cloud_vision_api_key') {
    console.log('⚠️ Vision API not configured');
    return null;
  }
  
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: imageBase64 },
          features: [
            { type: 'TEXT_DETECTION', maxResults: 100 },
            { type: 'LABEL_DETECTION', maxResults: 50 },
            { type: 'LOGO_DETECTION', maxResults: 10 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 30 }
          ]
        }]
      })
    }
  );

  if (!response.ok) {
    console.error('Vision API failed');
    return null;
  }

  const data = await response.json();
  return data.responses?.[0];
}

// ========== MAIN HANDLER ==========

export async function POST(request) {
  console.log('\n🚀 === ANALYSIS START ===');
  
  try {
    const body = await request.json();
    const { imageUrls = [] } = body;
    
    if (!imageUrls.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'No images provided' 
      }, { status: 400 });
    }
    
    // Analyze with Vision API
    const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
    const visionData = await analyzeWithGoogleVision(imageBase64);
    
    if (!visionData) {
      console.error('Vision API returned no data');
      return NextResponse.json({ 
        success: false, 
        error: 'Image analysis failed' 
      }, { status: 500 });
    }
    
    // Extract structured text data
    const textData = extractTextFromVision(visionData);
    const labels = visionData.labelAnnotations?.map(l => l.description) || [];
    const logos = visionData.logoAnnotations?.map(l => l.description) || [];
    
    // Run detection
    const brand = detectBrand(textData, logos);
    const size = detectSize(textData);
    const garmentType = detectGarmentType(labels, textData);
    const material = detectMaterial(textData);
    const color = detectColor(labels);
    const keywords = generateKeywords(garmentType, brand);
    
    console.log('\n📊 DETECTION RESULTS:');
    console.log('Brand:', brand);
    console.log('Size:', size);
    console.log('Garment:', garmentType);
    console.log('Material:', material);
    console.log('Color:', color);
    
    // Build title - EXACT FORMAT
    const titleParts = [
      brand,
      garmentType,
      'Unisex', // or detect gender
      'Size',
      size,
      color,
      material
    ];
    
    let title = titleParts.join(' ');
    
    // Add keywords to reach 80 chars
    for (const keyword of keywords) {
      if (title.length + keyword.length + 1 <= 80) {
        title += ' ' + keyword;
      }
      if (title.length >= 80) break;
    }
    
    // Ensure exactly 80 chars
    if (title.length > 80) {
      title = title.substring(0, 80).trim();
    }
    
    console.log('Title:', title);
    console.log('Length:', title.length);
    
    // Create response
    const analysis = {
      brand: brand,
      item_type: garmentType,
      gender: 'Unisex',
      size: size,
      color: color,
      material: material,
      keywords: keywords.slice(0, 5),
      ebay_title: title,
      suggested_price: 15,
      condition_score: 7,
      condition_text: 'Good',
      description: `${brand} ${garmentType.toLowerCase()} in ${color.toLowerCase()}. Size ${size}. ${material} construction. In very good condition.`,
      category: `Unisex Clothing > ${garmentType}s`,
      id: `analysis-${Date.now()}`,
      sku: `${brand.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: imageUrls.length,
      image_urls: imageUrls,
      analyzed_at: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      analysis
    });
    
  } catch (error) {
    console.error('Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Analysis failed'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '9.0'
  });
}