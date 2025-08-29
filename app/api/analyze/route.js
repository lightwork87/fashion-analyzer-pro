// app/api/analyze/route.js
// COMPREHENSIVE LABEL READING FOR ALL CLOTHING TYPES

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ========== COMPREHENSIVE LABEL PARSER ==========

function parseAllLabels(text) {
  const result = {
    brand: null,
    size: null,
    material: null,
    madeIn: null,
    careInstructions: [],
    allText: text
  };
  
  const textUpper = text.toUpperCase();
  const lines = text.split('\n');
  
  console.log('📝 Parsing text with', lines.length, 'lines');
  
  // BRAND DETECTION - Check every line
  const knownBrands = [
    'CHILDISH', 'ZARA', 'H&M', 'H & M', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK',
    'TOPSHOP', 'ASOS', 'RIVER ISLAND', 'UNIQLO', 'GAP', 'MANGO', 'COS',
    'WEEKDAY', 'MONKI', 'ARKET', 'PULL & BEAR', 'PULL&BEAR', 'BERSHKA',
    'STRADIVARIUS', 'MASSIMO DUTTI', 'RALPH LAUREN', 'TOMMY HILFIGER',
    'CALVIN KLEIN', 'HUGO BOSS', 'ARMANI', 'VERSACE', 'GUCCI', 'PRADA',
    'BURBERRY', 'BALENCIAGA', 'OFF-WHITE', 'SUPREME', 'PALACE', 'STONE ISLAND'
  ];
  
  // Check each line for brands
  for (const line of lines) {
    const lineUpper = line.toUpperCase();
    for (const brand of knownBrands) {
      if (lineUpper.includes(brand)) {
        result.brand = brand;
        console.log('✅ Brand found:', brand);
        break;
      }
    }
    if (result.brand) break;
  }
  
  // SIZE DETECTION - Multiple patterns
  const sizePatterns = [
    /SIZE[:\s]*([A-Z]{1,4}|\d{1,2})/,
    /\b(XXS|XS|S|M|L|XL|XXL|XXXL)\b/,
    /UK[:\s]*(\d{1,2})/,
    /EUR[:\s]*(\d{2,3})/,
    /US[:\s]*(\d{1,2})/,
    /\b(\d{2})[\/\-](\d{2})\b/, // 32/32 format
    /CHEST[:\s]*(\d{2,3})/,
    /WAIST[:\s]*(\d{2,3})/
  ];
  
  for (const pattern of sizePatterns) {
    const match = textUpper.match(pattern);
    if (match) {
      result.size = match[1];
      console.log('✅ Size found:', result.size);
      break;
    }
  }
  
  // MATERIAL DETECTION - From composition and care labels
  const materialPatterns = [
    /(\d{1,3})[%\s]*(COTTON|POLYESTER|VISCOSE|ELASTANE|WOOL|NYLON|SILK|LINEN|ACRYLIC|MODAL|RAYON)/g,
    /COTTON|POLYESTER|JERSEY|FLEECE|DENIM|WOOL|CASHMERE|SILK|LINEN/g
  ];
  
  const materials = [];
  for (const pattern of materialPatterns) {
    const matches = textUpper.matchAll(pattern);
    for (const match of matches) {
      if (match[2]) {
        materials.push(`${match[1]}% ${match[2]}`);
      } else if (match[0]) {
        materials.push(match[0]);
      }
    }
  }
  
  if (materials.length > 0) {
    result.material = materials[0].charAt(0) + materials[0].slice(1).toLowerCase();
    console.log('✅ Material found:', result.material);
  }
  
  // CARE INSTRUCTIONS - These help identify material
  const carePatterns = [
    /MACHINE WASH/i,
    /HAND WASH/i,
    /DRY CLEAN/i,
    /DO NOT BLEACH/i,
    /TUMBLE DRY/i,
    /IRON/i,
    /\d{2,3}[°C]/
  ];
  
  for (const pattern of carePatterns) {
    if (pattern.test(text)) {
      result.careInstructions.push(pattern.source);
    }
  }
  
  // MADE IN detection
  const madeInMatch = textUpper.match(/MADE IN ([A-Z\s]+)/);
  if (madeInMatch) {
    result.madeIn = madeInMatch[1];
    console.log('✅ Made in:', result.madeIn);
  }
  
  return result;
}

// ========== GARMENT TYPE DETECTOR FOR ALL CLOTHING ==========

function detectGarmentType(labels, objects, parsedText) {
  const combined = [...labels, ...objects].map(l => l.toLowerCase()).join(' ');
  const textLower = parsedText.allText.toLowerCase();
  
  // Comprehensive garment detection
  const garmentMap = {
    // Tops - Long Sleeve
    'Jumper': ['jumper', 'sweater', 'pullover', 'knitwear'],
    'Sweatshirt': ['sweatshirt', 'sweat shirt', 'crew neck sweat'],
    'Hoodie': ['hoodie', 'hooded', 'hood'],
    'Cardigan': ['cardigan', 'cardi'],
    
    // Tops - Short Sleeve
    'T-Shirt': ['t-shirt', 'tee', 'tshirt'],
    'Polo': ['polo'],
    'Vest': ['vest', 'tank top'],
    
    // Shirts
    'Shirt': ['shirt', 'blouse'],
    
    // Dresses & Skirts
    'Dress': ['dress'],
    'Skirt': ['skirt'],
    
    // Bottoms
    'Jeans': ['jeans', 'denim pant', 'denim trouser'],
    'Trousers': ['trousers', 'pants', 'chinos', 'slacks'],
    'Shorts': ['shorts'],
    'Joggers': ['joggers', 'sweatpants', 'track pants'],
    'Leggings': ['leggings', 'tights'],
    
    // Outerwear
    'Jacket': ['jacket'],
    'Coat': ['coat', 'overcoat'],
    'Blazer': ['blazer'],
    'Parka': ['parka'],
    'Windbreaker': ['windbreaker', 'windcheater'],
    
    // Other
    'Suit': ['suit'],
    'Tracksuit': ['tracksuit', 'track suit'],
    'Romper': ['romper', 'playsuit', 'jumpsuit']
  };
  
  // Check for each garment type
  for (const [garment, keywords] of Object.entries(garmentMap)) {
    for (const keyword of keywords) {
      if (combined.includes(keyword) || textLower.includes(keyword)) {
        console.log(`✅ Garment detected as ${garment} (matched: ${keyword})`);
        return garment;
      }
    }
  }
  
  // Check sleeve length as fallback
  if (combined.includes('long sleeve')) {
    return 'Jumper';
  }
  if (combined.includes('short sleeve')) {
    return 'T-Shirt';
  }
  
  // Default based on what we see
  if (combined.includes('clothing') || combined.includes('garment')) {
    return 'Item';
  }
  
  return 'Item';
}

// ========== GENDER DETECTOR ==========

function detectGender(labels, parsedText) {
  const combined = labels.join(' ').toLowerCase() + ' ' + parsedText.allText.toLowerCase();
  
  // Gender indicators
  if (combined.includes("women") || combined.includes("ladies") || combined.includes("girl")) {
    return 'Womens';
  }
  if (combined.includes("men") || combined.includes("gents") || combined.includes("boy")) {
    return 'Mens';
  }
  if (combined.includes("unisex")) {
    return 'Unisex';
  }
  
  // Size can indicate gender
  const size = parsedText.size;
  if (size && !isNaN(size)) {
    const numSize = parseInt(size);
    if (numSize >= 6 && numSize <= 20 && numSize % 2 === 0) {
      return 'Womens'; // UK women's sizes
    }
  }
  
  return 'Unisex';
}

// ========== COLOR DETECTOR ==========

function detectColor(labels, objects) {
  const combined = [...labels, ...objects].map(l => l.toLowerCase()).join(' ');
  
  const colors = [
    'Black', 'White', 'Grey', 'Navy', 'Blue', 'Red', 'Green', 
    'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Beige', 
    'Cream', 'Burgundy', 'Maroon', 'Khaki', 'Olive', 'Teal',
    'Charcoal', 'Stone', 'Sand', 'Tan', 'Wine', 'Multi'
  ];
  
  for (const color of colors) {
    if (combined.includes(color.toLowerCase())) {
      return color;
    }
  }
  
  return 'Multi';
}

// ========== KEYWORD GENERATOR ==========

function generateKeywords(garmentType, brand, material, labels) {
  const keywords = [];
  const labelsLower = labels.map(l => l.toLowerCase()).join(' ');
  
  // Fit keywords
  if (labelsLower.includes('oversized')) keywords.push('Oversized');
  if (labelsLower.includes('slim')) keywords.push('Slim', 'Fit');
  if (labelsLower.includes('relaxed')) keywords.push('Relaxed');
  if (labelsLower.includes('regular')) keywords.push('Regular', 'Fit');
  
  // Garment-specific keywords
  if (garmentType === 'Jumper' || garmentType === 'Sweatshirt') {
    if (labelsLower.includes('crew')) keywords.push('Crew', 'Neck');
    if (labelsLower.includes('v-neck')) keywords.push('V-Neck');
    if (material?.includes('Fleece')) keywords.push('Warm');
  }
  
  if (garmentType === 'Jeans') {
    if (labelsLower.includes('skinny')) keywords.push('Skinny');
    if (labelsLower.includes('straight')) keywords.push('Straight');
    if (labelsLower.includes('bootcut')) keywords.push('Bootcut');
  }
  
  // Style keywords
  if (labelsLower.includes('vintage')) keywords.push('Vintage');
  if (labelsLower.includes('retro')) keywords.push('Retro');
  if (brand === 'CHILDISH' || labelsLower.includes('street')) keywords.push('Streetwear');
  
  // Condition
  keywords.push('VGC');
  
  // Location
  keywords.push('UK');
  
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
  console.log('\n🚀 === COMPREHENSIVE ANALYSIS ===');
  
  try {
    const body = await request.json();
    const { imageUrls = [] } = body;
    
    if (!imageUrls.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'No images provided' 
      }, { status: 400 });
    }
    
    // Get Vision API data
    const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
    const visionData = await analyzeWithGoogleVision(imageBase64);
    
    // Extract all data
    const rawText = visionData?.textAnnotations?.[0]?.description || '';
    const labels = visionData?.labelAnnotations?.map(l => l.description) || [];
    const objects = visionData?.localizedObjectAnnotations?.map(o => o.name) || [];
    const logos = visionData?.logoAnnotations?.map(l => l.description) || [];
    
    console.log('📸 Vision detected:');
    console.log('- Text length:', rawText.length);
    console.log('- Labels:', labels.slice(0, 5));
    console.log('- Logos:', logos);
    
    // Parse all label text
    const parsedText = parseAllLabels(rawText);
    
    // Add logo brands if not found in text
    if (!parsedText.brand && logos.length > 0) {
      parsedText.brand = logos[0];
    }
    
    // Detect everything
    const garmentType = detectGarmentType(labels, objects, parsedText);
    const gender = detectGender(labels, parsedText);
    const color = detectColor(labels, objects);
    const keywords = generateKeywords(garmentType, parsedText.brand, parsedText.material, labels);
    
    // Use parsed data
    const brand = parsedText.brand || 'Unbranded';
    const size = parsedText.size || 'One Size';
    const material = parsedText.material || 'See Label';
    
    console.log('\n📊 FINAL DETECTION:');
    console.log('Brand:', brand);
    console.log('Garment:', garmentType);
    console.log('Gender:', gender);
    console.log('Size:', size);
    console.log('Color:', color);
    console.log('Material:', material);
    
    // Build title
    const titleParts = [
      brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase(),
      garmentType,
      gender,
      'Size',
      size,
      color
    ];
    
    if (material !== 'See Label') {
      titleParts.push(material.split(' ')[0]); // Just first word of material
    }
    
    let title = titleParts.join(' ');
    
    // Add keywords
    for (const keyword of keywords) {
      if (title.length + keyword.length + 1 <= 80) {
        title += ' ' + keyword;
      }
    }
    
    // Pad to 80
    while (title.length < 80) {
      const padding = ['Genuine', 'Fast', 'Post'];
      let added = false;
      for (const word of padding) {
        if (!title.includes(word) && title.length + word.length + 1 <= 80) {
          title += ' ' + word;
          added = true;
          break;
        }
      }
      if (!added) break;
    }
    
    if (title.length > 80) {
      title = title.substring(0, 80).trim();
    }
    
    // Create response
    const analysis = {
      brand: brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase(),
      item_type: garmentType,
      gender: gender,
      size: size,
      color: color,
      material: material,
      made_in: parsedText.madeIn,
      keywords: keywords,
      ebay_title: title,
      suggested_price: garmentType === 'Jeans' ? 20 : 15,
      condition_score: 7,
      condition_text: 'Very Good Condition',
      description: `${brand} ${garmentType.toLowerCase()} in ${color.toLowerCase()}. Size ${size}. ${material} construction. ${parsedText.madeIn ? `Made in ${parsedText.madeIn}.` : ''} In very good condition.`,
      category: `${gender} Clothing > ${garmentType}s`,
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
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Analysis failed'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '8.0',
    message: 'Comprehensive label reading for all clothing types'
  });
}