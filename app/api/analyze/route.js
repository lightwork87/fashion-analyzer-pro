// app/api/analyze/route.js
// COMPLETE REWRITE WITH PROPER DETECTION

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ========== CORE DETECTION FUNCTIONS ==========

function detectBrand(text, logos) {
  const textUpper = text.toUpperCase();
  
  // Known brands to look for
  const brands = [
    'CHILDISH', 'ZARA', 'H&M', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK',
    'TOPSHOP', 'ASOS', 'RIVER ISLAND', 'UNIQLO', 'GAP', 'MANGO',
    'COS', 'WEEKDAY', 'MONKI', 'ARKET', 'PULL & BEAR', 'BERSHKA'
  ];
  
  // Check text for brands
  for (const brand of brands) {
    if (textUpper.includes(brand)) {
      console.log(`✅ Brand found in text: ${brand}`);
      return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
    }
  }
  
  // Check logos
  if (logos && logos.length > 0) {
    console.log(`✅ Brand found in logo: ${logos[0]}`);
    return logos[0];
  }
  
  console.log('❌ No brand detected');
  return 'Unbranded';
}

function detectSize(text) {
  const textUpper = text.toUpperCase();
  
  // Try multiple patterns
  const patterns = [
    /SIZE:\s*([XS|S|M|L|XL|XXL])\b/,
    /SIZE\s+([XS|S|M|L|XL|XXL])\b/,
    /\b(XS|S|M|L|XL|XXL)\b(?!\w)/,
    /SZ:\s*([XS|S|M|L|XL])\b/
  ];
  
  for (const pattern of patterns) {
    const match = textUpper.match(pattern);
    if (match && match[1]) {
      // Make sure it's a valid size
      if (['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(match[1])) {
        console.log(`✅ Size detected: ${match[1]}`);
        return match[1];
      }
    }
  }
  
  console.log('❌ No size detected, defaulting to M');
  return 'M';
}

function detectGarmentType(labels, text) {
  const labelsLower = labels.map(l => l.toLowerCase()).join(' ');
  const textLower = text.toLowerCase();
  const combined = labelsLower + ' ' + textLower;
  
  console.log('🔍 Analyzing for garment type...');
  
  // RULE 1: If we see "long sleeve" anywhere, it's NOT a T-Shirt
  if (combined.includes('long sleeve') || combined.includes('long-sleeve')) {
    console.log('✅ Long sleeves detected - NOT a T-Shirt');
    
    if (combined.includes('hood')) return 'Hoodie';
    if (combined.includes('sweat')) return 'Sweatshirt';
    return 'Jumper'; // Default for long sleeves
  }
  
  // RULE 2: Check for specific garment mentions
  if (combined.includes('jumper')) return 'Jumper';
  if (combined.includes('sweater')) return 'Jumper';
  if (combined.includes('sweatshirt')) return 'Sweatshirt';
  if (combined.includes('hoodie')) return 'Hoodie';
  
  // RULE 3: Only call it T-Shirt if we're SURE it's short-sleeved
  if (combined.includes('t-shirt') || combined.includes('tee')) {
    // Double check it's not long-sleeved
    if (!combined.includes('long')) {
      return 'T-Shirt';
    }
  }
  
  // RULE 4: Check sleeve indicators
  if (combined.includes('crew neck') || combined.includes('ribbed')) {
    return 'Jumper';
  }
  
  // Default to Jumper if unsure (safer than T-Shirt)
  console.log('⚠️ Garment type unclear, defaulting to Jumper');
  return 'Jumper';
}

function detectColor(labels, text) {
  const combined = (labels.join(' ') + ' ' + text).toLowerCase();
  
  const colors = {
    'Red': ['red', 'crimson', 'scarlet'],
    'Blue': ['blue', 'navy', 'azure'],
    'Black': ['black', 'charcoal'],
    'White': ['white', 'cream'],
    'Grey': ['grey', 'gray'],
    'Green': ['green', 'olive'],
    'Pink': ['pink', 'rose'],
    'Brown': ['brown', 'tan', 'beige']
  };
  
  for (const [color, variants] of Object.entries(colors)) {
    if (variants.some(v => combined.includes(v))) {
      return color;
    }
  }
  
  return 'Multi';
}

function detectMaterial(text) {
  const textLower = text.toLowerCase();
  
  const materials = [
    'Cotton', 'Polyester', 'Jersey', 'Fleece', 'Wool', 
    'Denim', 'Nylon', 'Viscose', 'Silk', 'Linen'
  ];
  
  for (const material of materials) {
    if (textLower.includes(material.toLowerCase())) {
      return material;
    }
  }
  
  // Default materials based on garment
  return 'Cotton';
}

function generateKeywords(garmentType, brand, labels) {
  const keywords = [];
  const labelsLower = labels.map(l => l.toLowerCase()).join(' ');
  
  // Fit descriptors
  if (labelsLower.includes('oversized') || labelsLower.includes('loose')) {
    keywords.push('Oversized');
  }
  if (labelsLower.includes('fitted') || labelsLower.includes('slim')) {
    keywords.push('Fitted');
  }
  
  // Garment-specific
  if (garmentType === 'Jumper' || garmentType === 'Sweatshirt') {
    if (labelsLower.includes('crew')) {
      keywords.push('Crew', 'Neck');
    }
    keywords.push('Warm');
  }
  
  // Style keywords based on brand
  if (brand === 'Childish' || labelsLower.includes('street')) {
    keywords.push('Streetwear');
  }
  
  // Condition
  keywords.push('VGC');
  
  // Always add UK
  keywords.push('UK');
  
  return keywords;
}

// ========== MAIN FUNCTIONS ==========

async function fetchImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'LightLister-AI/1.0' },
      signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error) {
    throw error;
  }
}

async function analyzeWithGoogleVision(imageBase64) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey || apiKey === 'your_google_cloud_vision_api_key') {
    console.log('⚠️ Vision API not configured');
    return null;
  }
  
  try {
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
    const result = data.responses?.[0];
    
    // Log what we got
    if (result) {
      console.log('📸 Vision Results:');
      console.log('- Text:', result.textAnnotations?.[0]?.description?.substring(0, 100) || 'None');
      console.log('- Labels:', result.labelAnnotations?.slice(0, 5).map(l => l.description) || []);
      console.log('- Logos:', result.logoAnnotations?.map(l => l.description) || []);
    }
    
    return result;
  } catch (error) {
    console.error('Vision error:', error);
    return null;
  }
}

// ========== MAIN HANDLER ==========

export async function POST(request) {
  console.log('\n🚀 === NEW ANALYSIS ===');
  
  try {
    const body = await request.json();
    const { imageUrls = [] } = body;
    
    if (!imageUrls.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'No images provided' 
      }, { status: 400 });
    }
    
    // Step 1: Get image and analyze with Vision
    const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
    const visionData = await analyzeWithGoogleVision(imageBase64);
    
    // Step 2: Extract all the data we need
    const text = visionData?.textAnnotations?.[0]?.description || '';
    const labels = visionData?.labelAnnotations?.map(l => l.description) || [];
    const logos = visionData?.logoAnnotations?.map(l => l.description) || [];
    
    // Step 3: Run our detection functions
    const brand = detectBrand(text, logos);
    const size = detectSize(text);
    const garmentType = detectGarmentType(labels, text);
    const color = detectColor(labels, text);
    const material = detectMaterial(text);
    const keywords = generateKeywords(garmentType, brand, labels);
    
    console.log('\n📊 DETECTION RESULTS:');
    console.log('Brand:', brand);
    console.log('Garment:', garmentType);
    console.log('Size:', size);
    console.log('Color:', color);
    console.log('Material:', material);
    console.log('Keywords:', keywords);
    
    // Step 4: Build the title
    const titleParts = [
      brand,
      garmentType,
      'Mens', // Default gender
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
    }
    
    // Pad to 80 if needed
    if (title.length < 80) {
      const padding = ['Genuine', 'Fast', 'Post'];
      for (const word of padding) {
        if (title.length + word.length + 1 <= 80) {
          title += ' ' + word;
        }
      }
    }
    
    // Ensure exactly 80
    if (title.length > 80) {
      title = title.substring(0, 80).trim();
    }
    
    console.log('Title:', title);
    console.log('Length:', title.length);
    
    // Step 5: Create response
    const analysis = {
      brand: brand,
      item_type: garmentType,
      gender: 'Mens',
      size: size,
      color: color,
      material: material,
      keywords: keywords,
      ebay_title: title,
      suggested_price: 15,
      condition_score: 7,
      condition_text: 'Very Good Condition',
      description: `${color} ${garmentType.toLowerCase()} from ${brand}. Size ${size}. ${material} construction. In very good condition.`,
      category: `Mens Clothing > ${garmentType}s`,
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
    version: '7.0',
    message: 'Complete rewrite with proper detection'
  });
}