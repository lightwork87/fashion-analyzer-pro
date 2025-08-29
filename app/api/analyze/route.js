// app/api/analyze/route.js
// DEBUG VERSION - Log everything Vision API returns

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ========== DEBUG: LOG ALL VISION DATA ==========

function extractAndLogTextFromVision(visionData) {
  const fullText = visionData?.textAnnotations?.[0]?.description || '';
  const textBlocks = visionData?.textAnnotations?.slice(1).map(t => t.description) || [];
  
  console.log('\n🔍 ===== VISION API TEXT EXTRACTION =====');
  console.log('📝 FULL TEXT (first 500 chars):');
  console.log(fullText.substring(0, 500));
  console.log('\n📝 TEXT BLOCKS (individual words detected):');
  textBlocks.forEach((block, index) => {
    console.log(`  ${index}: "${block}"`);
  });
  console.log('\n📝 LINES FROM TEXT:');
  const lines = fullText.split('\n').filter(l => l.trim());
  lines.forEach((line, index) => {
    console.log(`  Line ${index}: "${line}"`);
  });
  console.log('===== END VISION DATA =====\n');
  
  return {
    fullText,
    textBlocks,
    textUpper: fullText.toUpperCase(),
    lines
  };
}

// ========== SIZE DETECTOR WITH LOGGING ==========

function detectSize(textData) {
  const { textUpper, textBlocks, lines } = textData;
  
  console.log('\n🔎 SIZE DETECTION ATTEMPTS:');
  
  // Check each text block
  const validSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  console.log('Checking text blocks for sizes...');
  for (let i = 0; i < textBlocks.length; i++) {
    const block = textBlocks[i].toUpperCase().trim();
    if (validSizes.includes(block)) {
      console.log(`  ✅ FOUND SIZE "${block}" at position ${i}`);
      return block;
    }
    // Log near-misses
    if (block.length <= 3 && block.match(/[SML]/)) {
      console.log(`  ❓ Potential size candidate: "${block}" at position ${i}`);
    }
  }
  
  // Check lines
  console.log('Checking lines for size patterns...');
  for (const line of lines) {
    const lineUpper = line.toUpperCase().trim();
    console.log(`  Checking line: "${lineUpper}"`);
    
    if (validSizes.includes(lineUpper)) {
      console.log(`    ✅ FOUND SIZE AS COMPLETE LINE: ${lineUpper}`);
      return lineUpper;
    }
    
    if (lineUpper.includes('SIZE')) {
      console.log(`    💡 Line contains "SIZE": "${lineUpper}"`);
      // Try to extract size after "SIZE"
      const afterSize = lineUpper.split('SIZE')[1]?.trim();
      if (afterSize) {
        const firstWord = afterSize.split(' ')[0].replace(/[^A-Z0-9]/g, '');
        if (validSizes.includes(firstWord)) {
          console.log(`    ✅ FOUND SIZE AFTER "SIZE": ${firstWord}`);
          return firstWord;
        }
      }
    }
  }
  
  console.log('❌ No size found in any format');
  return 'Check Photos';
}

// ========== OTHER DETECTORS ==========

function detectBrand(textData, logos) {
  const { textUpper, textBlocks } = textData;
  
  const brands = [
    'CHILDISH', 'ZARA', 'H&M', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK',
    'TOPSHOP', 'ASOS', 'RIVER ISLAND', 'UNIQLO', 'GAP', 'MANGO'
  ];
  
  for (const brand of brands) {
    if (textUpper.includes(brand)) {
      console.log(`✅ Brand found: ${brand}`);
      return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
    }
  }
  
  if (logos?.length > 0) {
    console.log(`✅ Brand from logo: ${logos[0]}`);
    return logos[0];
  }
  
  return 'Unbranded';
}

function detectGarmentType(labels, textData) {
  const labelsText = labels.map(l => l.toLowerCase()).join(' ');
  
  console.log('\n🔎 GARMENT DETECTION:');
  console.log('Labels:', labels.slice(0, 10));
  
  const longSleeveIndicators = [
    'long sleeve', 'sweater', 'jumper', 'sweatshirt', 
    'pullover', 'crew neck'
  ];
  
  const hasLongSleeves = longSleeveIndicators.some(indicator => 
    labelsText.includes(indicator)
  );
  
  if (hasLongSleeves) {
    console.log('✅ Long sleeves detected - NOT T-Shirt');
    if (labelsText.includes('hood')) return 'Hoodie';
    if (labelsText.includes('sweat')) return 'Sweatshirt';
    return 'Jumper';
  }
  
  if (labelsText.includes('t-shirt') && !labelsText.includes('long')) {
    console.log('✅ T-Shirt detected');
    return 'T-Shirt';
  }
  
  if (labelsText.includes('jeans')) return 'Jeans';
  if (labelsText.includes('trousers')) return 'Trousers';
  if (labelsText.includes('dress')) return 'Dress';
  
  console.log('⚠️ Defaulting to Jumper');
  return 'Jumper';
}

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
  console.log('\n🚀 === ANALYSIS START (DEBUG MODE) ===');
  
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
    
    // Extract and log all text data
    const textData = extractAndLogTextFromVision(visionData);
    const labels = visionData.labelAnnotations?.map(l => l.description) || [];
    const logos = visionData.logoAnnotations?.map(l => l.description) || [];
    
    const brand = detectBrand(textData, logos);
    const size = detectSize(textData);
    const garmentType = detectGarmentType(labels, textData);
    const material = detectMaterial(textData);
    const color = detectColor(labels);
    
    console.log('\n📊 FINAL RESULTS:');
    console.log('Brand:', brand);
    console.log('Size:', size);
    console.log('Garment:', garmentType);
    console.log('Material:', material);
    console.log('Color:', color);
    
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
    
    // Add keywords
    const keywords = ['VGC', 'UK', 'Genuine'];
    if (garmentType === 'Jumper' || garmentType === 'Sweatshirt') {
      keywords.unshift('Warm');
    }
    if (brand === 'Childish') {
      keywords.unshift('Streetwear');
    }
    
    for (const keyword of keywords) {
      if (title.length + keyword.length + 1 <= 80) {
        title += ' ' + keyword;
      }
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
      description: `${brand} ${garmentType.toLowerCase()}. Size ${size}. ${material}. Very good condition.`,
      category: `Clothing > ${garmentType}s`,
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
    version: '11.0-debug'
  });
}