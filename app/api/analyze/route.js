// app/api/analyze/route.js
// DEBUG VERSION - Log everything and add manual fallbacks

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { 
  getBrandInfo, 
  convertBrandSize, 
  getBrandKeywords, 
  getSuggestedPrice 
} from '../../lib/brand-knowledge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ========== ANALYZE WITH DETAILED LOGGING ==========

async function analyzeAllImages(imageUrls) {
  const allTextData = {
    fullText: '',
    textBlocks: [],
    labels: new Set(),
    logos: new Set(),
    objects: new Set(),
    debugInfo: {
      allTextFound: [],
      sizeCandidates: [],
      colorCandidates: []
    }
  };
  
  console.log(`\n📸 === ANALYZING ${imageUrls.length} IMAGES ===`);
  
  // Analyze first 3 images
  for (let i = 0; i < Math.min(imageUrls.length, 3); i++) {
    console.log(`\n🔍 Image ${i + 1}:`);
    
    try {
      const imageBase64 = await fetchImageAsBase64(imageUrls[i]);
      const visionData = await analyzeWithGoogleVision(imageBase64);
      
      if (visionData) {
        // Log ALL text found
        if (visionData.textAnnotations?.[0]) {
          const text = visionData.textAnnotations[0].description;
          console.log('📝 FULL TEXT:', text.substring(0, 200));
          allTextData.fullText += ' ' + text;
          allTextData.debugInfo.allTextFound.push(text);
        }
        
        // Log ALL text blocks
        if (visionData.textAnnotations) {
          const blocks = visionData.textAnnotations.slice(1, 20).map(t => t.description);
          console.log('📦 TEXT BLOCKS:', blocks);
          blocks.forEach(block => {
            allTextData.textBlocks.push(block);
            
            // Look for size candidates
            if (block.match(/^[IVXLSM0-9]+$/)) {
              allTextData.debugInfo.sizeCandidates.push(block);
            }
          });
        }
        
        // Log labels (for color and garment type)
        if (visionData.labelAnnotations) {
          const topLabels = visionData.labelAnnotations.slice(0, 10).map(l => l.description);
          console.log('🏷️ LABELS:', topLabels);
          visionData.labelAnnotations.forEach(l => {
            allTextData.labels.add(l.description);
            
            // Look for color candidates
            if (l.description.toLowerCase().match(/pink|blue|white|red|green|black|grey/)) {
              allTextData.debugInfo.colorCandidates.push(l.description);
            }
          });
        }
      }
    } catch (error) {
      console.error(`Error on image ${i + 1}:`, error.message);
    }
  }
  
  console.log('\n📊 DEBUG INFO:');
  console.log('Size candidates:', allTextData.debugInfo.sizeCandidates);
  console.log('Color candidates:', allTextData.debugInfo.colorCandidates);
  
  return {
    fullText: allTextData.fullText,
    textBlocks: allTextData.textBlocks,
    textUpper: allTextData.fullText.toUpperCase(),
    lines: allTextData.fullText.split('\n').filter(l => l.trim()),
    labels: Array.from(allTextData.labels),
    logos: Array.from(allTextData.logos),
    objects: Array.from(allTextData.objects),
    debugInfo: allTextData.debugInfo
  };
}

// ========== SIZE DETECTOR WITH OSKA FIX ==========

function detectSize(textData, brand) {
  const { textBlocks, debugInfo } = textData;
  
  console.log('\n🔍 SIZE DETECTION for', brand);
  console.log('Size candidates from images:', debugInfo.sizeCandidates);
  
  // OSKA SPECIFIC - Roman numerals
  if (brand === 'Oska') {
    const oskaRomanSizes = {
      'I': '1',
      'II': '2', 
      'III': '3',
      'IV': '4',
      'V': '5'
    };
    
    // Check size candidates first
    for (const candidate of debugInfo.sizeCandidates) {
      if (oskaRomanSizes[candidate]) {
        console.log(`✅ OSKA Roman size found: ${candidate} = Size ${oskaRomanSizes[candidate]}`);
        return oskaRomanSizes[candidate];
      }
    }
    
    // Check all text blocks
    for (const block of textBlocks) {
      const blockTrim = block.trim();
      if (oskaRomanSizes[blockTrim]) {
        console.log(`✅ OSKA Roman size found in blocks: ${blockTrim} = Size ${oskaRomanSizes[blockTrim]}`);
        return oskaRomanSizes[blockTrim];
      }
      
      // Check for "11" being misread as "II"
      if (block === '11' || block === 'll') {
        console.log('✅ Found "11" or "ll" - likely OSKA Size 2');
        return '2';
      }
    }
    
    // OSKA default
    console.log('⚠️ OSKA size not detected, defaulting to Size 2');
    return '2';
  }
  
  // Standard sizes
  const validSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
  for (const block of textBlocks) {
    const blockUpper = block.toUpperCase().trim();
    if (validSizes.includes(blockUpper)) {
      console.log(`✅ Standard size found: ${blockUpper}`);
      return blockUpper;
    }
  }
  
  // Numeric sizes - but NOT 24+ (that's too large for UK sizing)
  for (const block of textBlocks) {
    if (!isNaN(block)) {
      const num = parseInt(block);
      if (num >= 6 && num <= 20 && num % 2 === 0) {
        console.log(`✅ UK size found: ${num}`);
        return num.toString();
      }
    }
  }
  
  console.log('❌ No valid size found');
  return 'One Size';
}

// ========== COLOR DETECTOR FIX ==========

function detectColor(labels, debugInfo) {
  console.log('\n🔍 COLOR DETECTION');
  console.log('Color candidates:', debugInfo.colorCandidates);
  
  const labelsText = labels.map(l => l.toLowerCase()).join(' ');
  
  // Check debug candidates first
  if (debugInfo.colorCandidates.length > 0) {
    const firstColor = debugInfo.colorCandidates[0];
    console.log(`✅ Using color from candidates: ${firstColor}`);
    return firstColor.charAt(0).toUpperCase() + firstColor.slice(1);
  }
  
  // Color detection with priority
  const colorPriority = [
    { color: 'Pink', keywords: ['pink', 'rose', 'blush', 'salmon', 'coral'] },
    { color: 'Blue', keywords: ['blue', 'navy', 'denim', 'cobalt', 'azure'] },
    { color: 'White', keywords: ['white', 'cream', 'ivory', 'off-white'] },
    { color: 'Black', keywords: ['black', 'charcoal', 'ebony'] },
    { color: 'Grey', keywords: ['grey', 'gray', 'silver', 'ash'] },
    { color: 'Red', keywords: ['red', 'crimson', 'burgundy', 'maroon'] },
    { color: 'Green', keywords: ['green', 'olive', 'khaki', 'emerald'] },
    { color: 'Brown', keywords: ['brown', 'tan', 'beige', 'camel', 'taupe'] }
  ];
  
  for (const { color, keywords } of colorPriority) {
    if (keywords.some(keyword => labelsText.includes(keyword))) {
      console.log(`✅ Color detected: ${color}`);
      return color;
    }
  }
  
  console.log('⚠️ No color detected, defaulting to Neutral');
  return 'Neutral';
}

// ========== GARMENT DETECTOR ==========

function detectGarmentType(labels, brand) {
  const labelsText = labels.map(l => l.toLowerCase()).join(' ');
  
  console.log('\n🔍 GARMENT DETECTION');
  console.log('Labels:', labels.slice(0, 10));
  
  // OSKA specific garments
  if (brand === 'Oska') {
    if (labelsText.includes('dress')) return 'Dress';
    if (labelsText.includes('tunic')) return 'Tunic';
    if (labelsText.includes('vest') || labelsText.includes('sleeveless')) return 'Top';
    if (labelsText.includes('trouser') || labelsText.includes('pant')) return 'Trousers';
    if (labelsText.includes('jacket')) return 'Jacket';
    if (labelsText.includes('shirt')) return 'Shirt';
    
    // OSKA default to Top for sleeveless items
    console.log('⚠️ OSKA garment defaulting to Top');
    return 'Top';
  }
  
  // Check for specific garments
  if (labelsText.includes('vest') || labelsText.includes('tank')) return 'Vest';
  if (labelsText.includes('dress')) return 'Dress';
  if (labelsText.includes('jeans')) return 'Jeans';
  if (labelsText.includes('trouser') || labelsText.includes('pant')) return 'Trousers';
  if (labelsText.includes('skirt')) return 'Skirt';
  if (labelsText.includes('hoodie')) return 'Hoodie';
  if (labelsText.includes('sweatshirt')) return 'Sweatshirt';
  if (labelsText.includes('jumper') || labelsText.includes('sweater')) return 'Jumper';
  if (labelsText.includes('t-shirt') || labelsText.includes('tee')) return 'T-Shirt';
  if (labelsText.includes('shirt')) return 'Shirt';
  if (labelsText.includes('jacket')) return 'Jacket';
  if (labelsText.includes('coat')) return 'Coat';
  
  // Check sleeves
  if (labelsText.includes('sleeveless')) return 'Top';
  if (labelsText.includes('long sleeve')) return 'Jumper';
  
  return 'Top';
}

// ========== BRAND DETECTOR ==========

function detectBrand(textData) {
  const { textUpper, textBlocks } = textData;
  
  // Priority brands to check
  const brands = ['OSKA', 'CHILDISH', 'ZARA', 'H&M', 'NIKE', 'ADIDAS'];
  
  for (const brand of brands) {
    if (textUpper.includes(brand) || textBlocks.includes(brand)) {
      console.log(`✅ Brand detected: ${brand}`);
      if (brand === 'OSKA') return 'Oska';
      return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
    }
  }
  
  return 'Unbranded';
}

// ========== HELPER FUNCTIONS ==========

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
  
  if (!apiKey) return null;
  
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
            { type: 'LOGO_DETECTION', maxResults: 10 }
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
  console.log('\n🚀 === ANALYSIS START (DEBUG) ===');
  
  try {
    const body = await request.json();
    const { imageUrls = [] } = body;
    
    if (!imageUrls.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'No images provided' 
      }, { status: 400 });
    }
    
    // Analyze images with debug info
    const combinedData = await analyzeAllImages(imageUrls);
    
    // Detect attributes
    const brand = detectBrand(combinedData);
    const size = detectSize(combinedData, brand);
    const garmentType = detectGarmentType(combinedData.labels, brand);
    const color = detectColor(combinedData.labels, combinedData.debugInfo);
    
    // Material - for OSKA, default to Linen if not detected
    let material = 'Cotton';
    if (brand === 'Oska') {
      material = 'Linen'; // OSKA commonly uses linen
    }
    if (combinedData.textUpper.includes('LINEN')) material = 'Linen';
    if (combinedData.textUpper.includes('COTTON')) material = 'Cotton';
    if (combinedData.textUpper.includes('WOOL')) material = 'Wool';
    
    // Get brand knowledge
    const keywords = getBrandKeywords(brand, garmentType) || ['VGC', 'UK'];
    const suggestedPrice = getSuggestedPrice(brand, 7) || 25;
    
    console.log('\n📊 === FINAL RESULTS ===');
    console.log('Brand:', brand);
    console.log('Garment:', garmentType);
    console.log('Size:', size);
    console.log('Color:', color);
    console.log('Material:', material);
    
    // Build title
    const gender = brand === 'Oska' ? 'Womens' : 'Womens';
    
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
    for (const keyword of keywords.slice(0, 3)) {
      if (title.length + keyword.length + 1 <= 80) {
        title += ' ' + keyword;
      }
    }
    
    // Always add condition and location
    if (title.length + 7 <= 80) {
      title += ' VGC UK';
    }
    
    if (title.length > 80) {
      title = title.substring(0, 80).trim();
    }
    
    const analysis = {
      brand,
      item_type: garmentType,
      gender,
      size,
      color,
      material,
      keywords: keywords.slice(0, 5),
      ebay_title: title,
      suggested_price: suggestedPrice,
      condition_score: 7,
      debug_info: {
        text_found: combinedData.debugInfo.allTextFound[0]?.substring(0, 100),
        size_candidates: combinedData.debugInfo.sizeCandidates,
        color_candidates: combinedData.debugInfo.colorCandidates
      }
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