// app/api/analyze/route.js
// FOCUSED FIX: Better size detection

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ========== ENHANCED SIZE DETECTOR ==========

function detectSize(textData) {
  const { textUpper, textBlocks, lines, fullText } = textData;
  
  console.log('🔍 SIZE DETECTION START');
  console.log('Text blocks to check:', textBlocks.slice(0, 20));
  
  // First, check individual text blocks for standalone sizes
  const validSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  for (const block of textBlocks) {
    const blockUpper = block.toUpperCase().trim();
    if (validSizes.includes(blockUpper)) {
      console.log(`✅ SIZE FOUND IN BLOCK: ${blockUpper}`);
      return blockUpper;
    }
  }
  
  // Check each line for size patterns
  for (const line of lines) {
    const lineUpper = line.toUpperCase().trim();
    
    // Direct size patterns
    if (lineUpper === 'S' || lineUpper === 'M' || lineUpper === 'L') {
      console.log(`✅ SIZE FOUND AS LINE: ${lineUpper}`);
      return lineUpper;
    }
    
    // Size with prefix
    if (lineUpper.startsWith('SIZE ')) {
      const sizeValue = lineUpper.replace('SIZE', '').trim();
      if (validSizes.includes(sizeValue)) {
        console.log(`✅ SIZE FOUND WITH PREFIX: ${sizeValue}`);
        return sizeValue;
      }
    }
    
    // Size with colon
    if (lineUpper.includes('SIZE:')) {
      const parts = lineUpper.split('SIZE:');
      if (parts[1]) {
        const sizeValue = parts[1].trim().split(' ')[0];
        if (validSizes.includes(sizeValue)) {
          console.log(`✅ SIZE FOUND WITH COLON: ${sizeValue}`);
          return sizeValue;
        }
      }
    }
  }
  
  // Check full text with patterns
  const patterns = [
    /\bSIZE[\s:]+([XXS|XS|S|M|L|XL|XXL]+)\b/i,
    /\b(XXS|XS|S|M|L|XL|XXL|XXXL)\b(?![A-Z])/,
    /^(S|M|L|XL)$/m  // Size on its own line
  ];
  
  for (const pattern of patterns) {
    const match = textUpper.match(pattern);
    if (match && match[1]) {
      const size = match[1].trim();
      if (validSizes.includes(size)) {
        console.log(`✅ SIZE FOUND BY PATTERN: ${size}`);
        return size;
      }
    }
  }
  
  // Check for numeric sizes
  const numericPattern = /UK\s*(\d{1,2})|SIZE\s*(\d{1,2})|(\d{1,2})\s*UK/i;
  const numMatch = textUpper.match(numericPattern);
  if (numMatch) {
    const size = numMatch[1] || numMatch[2] || numMatch[3];
    console.log(`✅ NUMERIC SIZE FOUND: ${size}`);
    return size;
  }
  
  console.log('❌ No size detected after all checks');
  console.log('Full text sample:', fullText.substring(0, 200));
  
  // Don't default to M - make it clear we couldn't find it
  return 'One Size';
}

// ========== TEXT EXTRACTION ==========

function extractTextFromVision(visionData) {
  const fullText = visionData?.textAnnotations?.[0]?.description || '';
  const textBlocks = visionData?.textAnnotations?.slice(1).map(t => t.description) || [];
  
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
  
  const brands = [
    'CHILDISH', 'ZARA', 'H&M', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK',
    'TOPSHOP', 'ASOS', 'RIVER ISLAND', 'UNIQLO', 'GAP', 'MANGO'
  ];
  
  for (const brand of brands) {
    if (textUpper.includes(brand)) {
      return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
    }
  }
  
  for (const block of textBlocks) {
    const blockUpper = block.toUpperCase();
    if (brands.includes(blockUpper)) {
      return block;
    }
  }
  
  if (logos && logos.length > 0) {
    return logos[0];
  }
  
  return 'Unbranded';
}

// ========== GARMENT DETECTOR ==========

function detectGarmentType(labels, textData) {
  const labelsText = labels.map(l => l.toLowerCase()).join(' ');
  const textLower = textData.fullText.toLowerCase();
  
  // Check for long sleeves - NEVER a T-Shirt
  const longSleeveIndicators = [
    'long sleeve', 'sweater', 'jumper', 'sweatshirt', 
    'pullover', 'crew neck', 'ribbed'
  ];
  
  const hasLongSleeves = longSleeveIndicators.some(indicator => 
    labelsText.includes(indicator) || textLower.includes(indicator)
  );
  
  if (hasLongSleeves) {
    if (labelsText.includes('hood')) return 'Hoodie';
    if (labelsText.includes('sweat')) return 'Sweatshirt';
    return 'Jumper';
  }
  
  // Only T-Shirt if short sleeves
  if (labelsText.includes('t-shirt') && !labelsText.includes('long')) {
    return 'T-Shirt';
  }
  
  // Other garments
  if (labelsText.includes('jeans')) return 'Jeans';
  if (labelsText.includes('trousers')) return 'Trousers';
  if (labelsText.includes('dress')) return 'Dress';
  
  return 'Jumper'; // Safe default
}

// ========== OTHER DETECTORS ==========

function detectMaterial(textData) {
  const { textUpper } = textData;
  
  const materials = ['Cotton', 'Polyester', 'Jersey', 'Fleece', 'Wool'];
  for (const material of materials) {
    if (textUpper.includes(material.toUpperCase())) {
      return material;
    }
  }
  
  return 'Cotton';
}

function detectColor(labels) {
  const labelsText = labels.map(l => l.toLowerCase()).join(' ');
  
  const colors = ['Black', 'White', 'Grey', 'Navy', 'Blue', 'Red', 'Green'];
  for (const color of colors) {
    if (labelsText.includes(color.toLowerCase())) {
      return color;
    }
  }
  
  return 'Multi';
}

function generateKeywords(garmentType, brand, size) {
  const keywords = [];
  
  if (garmentType === 'Jumper' || garmentType === 'Sweatshirt') {
    keywords.push('Crew', 'Neck', 'Warm');
  }
  
  if (brand === 'Childish') {
    keywords.push('Streetwear');
  }
  
  // If we couldn't detect size, add more descriptive keywords
  if (size === 'One Size') {
    keywords.push('Check', 'Photos');
  }
  
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

  if (!response.ok) return null;

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
    
    const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
    const visionData = await analyzeWithGoogleVision(imageBase64);
    
    if (!visionData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Image analysis failed' 
      }, { status: 500 });
    }
    
    const textData = extractTextFromVision(visionData);
    const labels = visionData.labelAnnotations?.map(l => l.description) || [];
    const logos = visionData.logoAnnotations?.map(l => l.description) || [];
    
    const brand = detectBrand(textData, logos);
    const size = detectSize(textData);
    const garmentType = detectGarmentType(labels, textData);
    const material = detectMaterial(textData);
    const color = detectColor(labels);
    const keywords = generateKeywords(garmentType, brand, size);
    
    console.log('\n📊 FINAL DETECTION:');
    console.log('Brand:', brand);
    console.log('Size:', size);
    console.log('Garment:', garmentType);
    
    // Build title
    const titleParts = [
      brand,
      garmentType,
      'Unisex',
      'Size',
      size,
      color,
      material
    ];
    
    let title = titleParts.join(' ');
    
    for (const keyword of keywords) {
      if (title.length + keyword.length + 1 <= 80) {
        title += ' ' + keyword;
      }
      if (title.length >= 80) break;
    }
    
    if (title.length > 80) {
      title = title.substring(0, 80).trim();
    }
    
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
    version: '10.0'
  });
}