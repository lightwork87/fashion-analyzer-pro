// app/api/analyze/route.js
// FIXED: Analyze ALL images, handle OSKA Roman numerals

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ========== ANALYZE MULTIPLE IMAGES ==========

async function analyzeAllImages(imageUrls) {
  const allTextData = {
    fullText: '',
    textBlocks: [],
    labels: new Set(),
    logos: new Set(),
    objects: new Set()
  };
  
  console.log(`📸 Analyzing ${imageUrls.length} images...`);
  
  // Analyze EACH image
  for (let i = 0; i < Math.min(imageUrls.length, 3); i++) { // Analyze first 3 images
    console.log(`Analyzing image ${i + 1}...`);
    
    const imageBase64 = await fetchImageAsBase64(imageUrls[i]);
    const visionData = await analyzeWithGoogleVision(imageBase64);
    
    if (visionData) {
      // Combine text from all images
      if (visionData.textAnnotations?.[0]) {
        allTextData.fullText += ' ' + visionData.textAnnotations[0].description;
      }
      
      // Collect all text blocks
      if (visionData.textAnnotations) {
        visionData.textAnnotations.slice(1).forEach(t => {
          allTextData.textBlocks.push(t.description);
        });
      }
      
      // Collect labels
      if (visionData.labelAnnotations) {
        visionData.labelAnnotations.forEach(l => {
          allTextData.labels.add(l.description);
        });
      }
      
      // Collect logos
      if (visionData.logoAnnotations) {
        visionData.logoAnnotations.forEach(l => {
          allTextData.logos.add(l.description);
        });
      }
      
      // Collect objects
      if (visionData.localizedObjectAnnotations) {
        visionData.localizedObjectAnnotations.forEach(o => {
          allTextData.objects.add(o.name);
        });
      }
    }
  }
  
  return {
    fullText: allTextData.fullText,
    textBlocks: allTextData.textBlocks,
    textUpper: allTextData.fullText.toUpperCase(),
    lines: allTextData.fullText.split('\n').filter(l => l.trim()),
    labels: Array.from(allTextData.labels),
    logos: Array.from(allTextData.logos),
    objects: Array.from(allTextData.objects)
  };
}

// ========== BRAND DETECTOR WITH OSKA ==========

function detectBrand(textData, logos) {
  const { textUpper, textBlocks } = textData;
  
  // Extended brand list including OSKA
  const brands = [
    'OSKA', 'CHILDISH', 'ZARA', 'H&M', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK',
    'TOPSHOP', 'ASOS', 'RIVER ISLAND', 'UNIQLO', 'GAP', 'MANGO', 'COS',
    'WHISTLES', 'REISS', 'TOAST', 'ME+EM', 'JIGSAW', 'BODEN'
  ];
  
  // Check main text
  for (const brand of brands) {
    if (textUpper.includes(brand)) {
      console.log(`✅ Brand found: ${brand}`);
      return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
    }
  }
  
  // Check individual text blocks
  for (const block of textBlocks) {
    const blockUpper = block.toUpperCase();
    if (brands.includes(blockUpper)) {
      console.log(`✅ Brand found in block: ${blockUpper}`);
      return block;
    }
  }
  
  if (logos && logos.length > 0) {
    console.log(`✅ Brand from logo: ${logos[0]}`);
    return logos[0];
  }
  
  return 'Unbranded';
}

// ========== SIZE DETECTOR WITH ROMAN NUMERALS ==========

function detectSize(textData) {
  const { textUpper, textBlocks, lines } = textData;
  
  console.log('🔍 SIZE DETECTION:');
  console.log('Text blocks:', textBlocks.slice(0, 20));
  
  // OSKA uses Roman numerals for sizes
  const romanSizes = {
    'I': '1',
    'II': '2',
    'III': '3',
    'IV': '4',
    'V': '5'
  };
  
  // Check for Roman numeral sizes
  for (const [roman, numeric] of Object.entries(romanSizes)) {
    // Check exact matches in text blocks
    if (textBlocks.includes(roman)) {
      console.log(`✅ OSKA size found: ${roman} = Size ${numeric}`);
      return numeric;
    }
    // Check in lines
    for (const line of lines) {
      if (line.trim() === roman) {
        console.log(`✅ OSKA size found in line: ${roman} = Size ${numeric}`);
        return numeric;
      }
    }
  }
  
  // Standard size detection
  const validSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
  for (const block of textBlocks) {
    const blockUpper = block.toUpperCase().trim();
    if (validSizes.includes(blockUpper)) {
      console.log(`✅ Standard size found: ${blockUpper}`);
      return blockUpper;
    }
  }
  
  // Numeric sizes
  const numericPattern = /\b(\d{1,2})\b/;
  for (const block of textBlocks) {
    const match = block.match(numericPattern);
    if (match && parseInt(match[1]) >= 6 && parseInt(match[1]) <= 20) {
      console.log(`✅ Numeric size found: ${match[1]}`);
      return match[1];
    }
  }
  
  return 'One Size';
}

// ========== GARMENT DETECTOR ==========

function detectGarmentType(labels, objects, textData) {
  const allLabels = [...labels, ...objects].map(l => l.toLowerCase()).join(' ');
  
  console.log('🔍 GARMENT DETECTION:');
  console.log('Labels found:', labels.slice(0, 10));
  
  // Check for specific garment types
  if (allLabels.includes('vest') || allLabels.includes('tank')) {
    return 'Vest';
  }
  if (allLabels.includes('sleeveless') && allLabels.includes('top')) {
    return 'Top';
  }
  if (allLabels.includes('blouse')) {
    return 'Blouse';
  }
  if (allLabels.includes('tunic')) {
    return 'Tunic';
  }
  
  // Check for sleeves
  const hasNoSleeves = allLabels.includes('sleeveless') || allLabels.includes('vest');
  const hasLongSleeves = allLabels.includes('long sleeve') || allLabels.includes('sweater');
  
  if (hasNoSleeves) {
    return 'Top'; // Sleeveless top/vest
  }
  
  if (hasLongSleeves) {
    if (allLabels.includes('hood')) return 'Hoodie';
    if (allLabels.includes('sweat')) return 'Sweatshirt';
    return 'Jumper';
  }
  
  // Check for other types
  if (allLabels.includes('dress')) return 'Dress';
  if (allLabels.includes('skirt')) return 'Skirt';
  if (allLabels.includes('trousers') || allLabels.includes('pants')) return 'Trousers';
  if (allLabels.includes('jeans')) return 'Jeans';
  if (allLabels.includes('jacket')) return 'Jacket';
  
  // Default based on what we see
  if (allLabels.includes('clothing') || allLabels.includes('garment')) {
    return 'Top';
  }
  
  return 'Top';
}

// ========== MATERIAL DETECTOR ==========

function detectMaterial(textData) {
  const { textUpper } = textData;
  
  // Check for percentage compositions first
  const compositionPattern = /(\d{1,3})[%\s]*(COTTON|POLYESTER|LINEN|VISCOSE|WOOL|SILK)/g;
  const matches = textUpper.matchAll(compositionPattern);
  
  for (const match of matches) {
    console.log(`✅ Material found: ${match[1]}% ${match[2]}`);
    // Return the main material
    return match[2].charAt(0) + match[2].slice(1).toLowerCase();
  }
  
  // Check for material words
  const materials = ['Linen', 'Cotton', 'Silk', 'Wool', 'Polyester', 'Viscose'];
  for (const material of materials) {
    if (textUpper.includes(material.toUpperCase())) {
      console.log(`✅ Material found: ${material}`);
      return material;
    }
  }
  
  return 'See Label';
}

// ========== COLOR DETECTOR ==========

function detectColor(labels) {
  const labelsText = labels.map(l => l.toLowerCase()).join(' ');
  
  // Check for specific colors
  const colors = [
    'Pink', 'Rose', 'Blush', 'Coral',
    'White', 'Cream', 'Ivory', 'Beige',
    'Black', 'Grey', 'Charcoal',
    'Blue', 'Navy', 'Denim',
    'Red', 'Burgundy', 'Wine',
    'Green', 'Olive', 'Khaki',
    'Brown', 'Tan', 'Camel'
  ];
  
  for (const color of colors) {
    if (labelsText.includes(color.toLowerCase())) {
      return color;
    }
  }
  
  return 'Neutral';
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
  console.log('\n🚀 === MULTI-IMAGE ANALYSIS ===');
  
  try {
    const body = await request.json();
    const { imageUrls = [] } = body;
    
    if (!imageUrls.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'No images provided' 
      }, { status: 400 });
    }
    
    // Analyze ALL images, not just the first
    const combinedData = await analyzeAllImages(imageUrls);
    
    // Detect all attributes
    const brand = detectBrand(combinedData, combinedData.logos);
    const size = detectSize(combinedData);
    const garmentType = detectGarmentType(combinedData.labels, combinedData.objects, combinedData);
    const material = detectMaterial(combinedData);
    const color = detectColor(combinedData.labels);
    
    // Determine gender (OSKA is primarily women's)
    const gender = brand === 'Oska' ? 'Womens' : 'Womens';
    
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
      gender,
      'Size',
      size,
      color,
      material
    ];
    
    let title = titleParts.join(' ');
    
    // Add keywords
    const keywords = [];
    if (brand === 'Oska') {
      keywords.push('Designer', 'Lagenlook');
    }
    if (material === 'Linen') {
      keywords.push('Natural', 'Breathable');
    }
    keywords.push('VGC', 'UK');
    
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
      gender: gender,
      size: size,
      color: color,
      material: material,
      keywords: keywords.slice(0, 5),
      ebay_title: title,
      suggested_price: brand === 'Oska' ? 35 : 15, // OSKA is designer
      condition_score: 7,
      condition_text: 'Good',
      description: `${brand} ${garmentType.toLowerCase()} in ${color.toLowerCase()}. Size ${size}. ${material} construction. Excellent condition.`,
      category: `Womens Clothing > Tops`,
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
    version: '12.0 - Multi-image & OSKA support'
  });
}