// app/api/analyze/route.js
// COMPLETE VERSION WITH BRAND KNOWLEDGE INTEGRATION

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
  
  // Analyze up to 5 images for better detection
  for (let i = 0; i < Math.min(imageUrls.length, 5); i++) {
    console.log(`Analyzing image ${i + 1}...`);
    
    try {
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
    } catch (error) {
      console.error(`Error analyzing image ${i + 1}:`, error);
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

// ========== BRAND DETECTOR WITH KNOWLEDGE BASE ==========

function detectBrand(textData, logos) {
  const { textUpper, textBlocks } = textData;
  
  // Extended brand list
  const brands = [
    'OSKA', 'CHILDISH', 'ZARA', 'H&M', 'HM', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK',
    'TOPSHOP', 'ASOS', 'RIVER ISLAND', 'UNIQLO', 'GAP', 'MANGO', 'COS',
    'WHISTLES', 'REISS', 'TOAST', 'ME+EM', 'JIGSAW', 'BODEN',
    'MARKS & SPENCER', 'M&S', 'JOHN LEWIS', 'TED BAKER', 'KAREN MILLEN',
    'RALPH LAUREN', 'TOMMY HILFIGER', 'CALVIN KLEIN', 'HUGO BOSS'
  ];
  
  // Check main text
  for (const brand of brands) {
    if (textUpper.includes(brand)) {
      console.log(`✅ Brand found: ${brand}`);
      // Proper case formatting
      if (brand === 'OSKA') return 'Oska';
      if (brand === 'CHILDISH') return 'Childish';
      if (brand === 'H&M' || brand === 'HM') return 'H&M';
      if (brand === 'M&S') return 'M&S';
      return brand.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
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
  
  // Check logos
  if (logos && logos.length > 0) {
    console.log(`✅ Brand from logo: ${logos[0]}`);
    return logos[0];
  }
  
  return 'Unbranded';
}

// ========== SIZE DETECTOR WITH BRAND KNOWLEDGE ==========

function detectSize(textData, brand) {
  const { textUpper, textBlocks, lines } = textData;
  
  console.log('🔍 SIZE DETECTION for brand:', brand);
  
  // Get brand-specific size info
  const brandInfo = getBrandInfo(brand);
  
  if (brandInfo && brandInfo.sizes) {
    // Check for brand-specific size formats
    const brandSizes = Object.keys(brandInfo.sizes);
    
    for (const sizeKey of brandSizes) {
      // Check exact matches in text blocks
      if (textBlocks.includes(sizeKey)) {
        console.log(`✅ Brand-specific size found: ${sizeKey}`);
        return convertBrandSize(brand, sizeKey);
      }
      
      // Check in lines
      for (const line of lines) {
        if (line.trim() === sizeKey || line.includes(`SIZE ${sizeKey}`)) {
          console.log(`✅ Brand-specific size found in line: ${sizeKey}`);
          return convertBrandSize(brand, sizeKey);
        }
      }
    }
  }
  
  // Standard size detection
  const validSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  
  for (const block of textBlocks) {
    const blockUpper = block.toUpperCase().trim();
    if (validSizes.includes(blockUpper)) {
      console.log(`✅ Standard size found: ${blockUpper}`);
      return blockUpper;
    }
  }
  
  // Numeric sizes (UK women's)
  for (const block of textBlocks) {
    if (!isNaN(block)) {
      const num = parseInt(block);
      if (num >= 6 && num <= 24 && num % 2 === 0) {
        console.log(`✅ UK numeric size found: ${num}`);
        return num.toString();
      }
    }
  }
  
  // Size patterns in text
  const sizePatterns = [
    /SIZE[:\s]*([A-Z]{1,3}|\d{1,2})/,
    /\b(XXS|XS|S|M|L|XL|XXL)\b/,
    /UK[:\s]*(\d{1,2})/,
    /EUR[:\s]*(\d{2,3})/
  ];
  
  for (const pattern of sizePatterns) {
    const match = textUpper.match(pattern);
    if (match && match[1]) {
      console.log(`✅ Size found by pattern: ${match[1]}`);
      return match[1];
    }
  }
  
  console.log('❌ No size detected');
  return 'One Size';
}

// ========== GARMENT DETECTOR WITH BRAND KNOWLEDGE ==========

function detectGarmentType(labels, objects, textData, brand) {
  const allLabels = [...labels, ...objects].map(l => l.toLowerCase()).join(' ');
  const textLower = textData.fullText.toLowerCase();
  
  console.log('🔍 GARMENT DETECTION for brand:', brand);
  
  // Get brand-specific garment types
  const brandInfo = getBrandInfo(brand);
  if (brandInfo && brandInfo.garmentTypes) {
    for (const garmentType of brandInfo.garmentTypes) {
      if (allLabels.includes(garmentType.toLowerCase()) || 
          textLower.includes(garmentType.toLowerCase())) {
        console.log(`✅ Brand-specific garment type: ${garmentType}`);
        return garmentType;
      }
    }
  }
  
  // Comprehensive garment detection
  const garmentMap = {
    // Tops - Sleeveless
    'Vest': ['vest', 'tank top', 'sleeveless top'],
    'Top': ['top', 'blouse', 'sleeveless'],
    'Tunic': ['tunic'],
    
    // Tops - Long Sleeve
    'Jumper': ['jumper', 'sweater', 'pullover', 'knitwear'],
    'Sweatshirt': ['sweatshirt', 'crew neck sweat'],
    'Hoodie': ['hoodie', 'hooded'],
    'Cardigan': ['cardigan'],
    
    // Tops - Short Sleeve
    'T-Shirt': ['t-shirt', 'tee', 'tshirt'],
    'Polo': ['polo'],
    
    // Shirts
    'Shirt': ['shirt', 'button up'],
    'Blouse': ['blouse'],
    
    // Dresses & Skirts
    'Dress': ['dress'],
    'Skirt': ['skirt'],
    
    // Bottoms
    'Jeans': ['jeans', 'denim'],
    'Trousers': ['trousers', 'pants'],
    'Shorts': ['shorts'],
    'Joggers': ['joggers', 'sweatpants'],
    
    // Outerwear
    'Jacket': ['jacket'],
    'Coat': ['coat'],
    'Blazer': ['blazer']
  };
  
  // Check for each garment type
  for (const [garment, keywords] of Object.entries(garmentMap)) {
    for (const keyword of keywords) {
      if (allLabels.includes(keyword) || textLower.includes(keyword)) {
        console.log(`✅ Garment detected as ${garment} (matched: ${keyword})`);
        return garment;
      }
    }
  }
  
  // Check sleeve length
  const hasNoSleeves = allLabels.includes('sleeveless') || allLabels.includes('vest');
  const hasLongSleeves = allLabels.includes('long sleeve') || allLabels.includes('sweater');
  
  if (hasNoSleeves) {
    return 'Top';
  }
  
  if (hasLongSleeves) {
    return 'Jumper';
  }
  
  return 'Top';
}

// ========== MATERIAL DETECTOR ==========

function detectMaterial(textData, brand) {
  const { textUpper } = textData;
  
  // Check brand-specific materials
  const brandInfo = getBrandInfo(brand);
  if (brandInfo && brandInfo.materials) {
    for (const material of brandInfo.materials) {
      if (textUpper.includes(material.toUpperCase())) {
        console.log(`✅ Brand-specific material found: ${material}`);
        return material;
      }
    }
  }
  
  // Check for percentage compositions
  const compositionPattern = /(\d{1,3})[%\s]*(COTTON|POLYESTER|LINEN|VISCOSE|WOOL|SILK|ELASTANE|MODAL)/g;
  const matches = textUpper.matchAll(compositionPattern);
  
  for (const match of matches) {
    console.log(`✅ Material composition found: ${match[1]}% ${match[2]}`);
    return match[2].charAt(0) + match[2].slice(1).toLowerCase();
  }
  
  // Check for material words
  const materials = ['Linen', 'Cotton', 'Silk', 'Wool', 'Polyester', 'Viscose', 'Jersey', 'Denim'];
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
  
  const colorMap = {
    'Pink': ['pink', 'rose', 'blush', 'salmon'],
    'Red': ['red', 'crimson', 'burgundy', 'wine'],
    'Blue': ['blue', 'navy', 'denim', 'cobalt'],
    'Green': ['green', 'olive', 'khaki', 'mint'],
    'Black': ['black', 'charcoal'],
    'White': ['white', 'cream', 'ivory'],
    'Grey': ['grey', 'gray', 'silver'],
    'Brown': ['brown', 'tan', 'camel', 'beige'],
    'Purple': ['purple', 'violet', 'plum'],
    'Yellow': ['yellow', 'mustard', 'gold'],
    'Orange': ['orange', 'coral', 'peach']
  };
  
  for (const [color, variants] of Object.entries(colorMap)) {
    if (variants.some(v => labelsText.includes(v))) {
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
  console.log('\n🚀 === ANALYSIS WITH BRAND KNOWLEDGE ===');
  
  try {
    const body = await request.json();
    const { imageUrls = [] } = body;
    
    if (!imageUrls.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'No images provided' 
      }, { status: 400 });
    }
    
    // Analyze ALL images
    const combinedData = await analyzeAllImages(imageUrls);
    
    // Initial detection
    const brand = detectBrand(combinedData, combinedData.logos);
    const size = detectSize(combinedData, brand);
    const garmentType = detectGarmentType(combinedData.labels, combinedData.objects, combinedData, brand);
    const material = detectMaterial(combinedData, brand);
    const color = detectColor(combinedData.labels);
    
    // Get brand-specific information
    const brandInfo = getBrandInfo(brand);
    const conditionScore = 7; // Default, could be detected from images
    
    // Get optimized keywords and price
    const keywords = getBrandKeywords(brand, garmentType);
    const suggestedPrice = getSuggestedPrice(brand, conditionScore);
    
    // Determine gender (brand-specific logic)
    let gender = 'Unisex';
    if (brand === 'Oska' || brand === 'Whistles' || brand === 'Karen Millen') {
      gender = 'Womens';
    } else if (garmentType === 'Dress' || garmentType === 'Skirt' || garmentType === 'Blouse') {
      gender = 'Womens';
    } else if (brand === 'Childish') {
      gender = 'Mens';
    }
    
    console.log('\n📊 FINAL RESULTS:');
    console.log('Brand:', brand);
    console.log('Size:', size);
    console.log('Garment:', garmentType);
    console.log('Material:', material);
    console.log('Color:', color);
    console.log('Keywords:', keywords);
    console.log('Price: £' + suggestedPrice);
    
    // Build title with brand knowledge
    const titleParts = [
      brand,
      garmentType,
      gender,
      'Size',
      size,
      color
    ];
    
    // Add material if detected
    if (material !== 'See Label') {
      titleParts.push(material);
    }
    
    let title = titleParts.join(' ');
    
    // Add keywords intelligently
    const priorityKeywords = keywords.slice(0, 5);
    for (const keyword of priorityKeywords) {
      if (!title.includes(keyword) && title.length + keyword.length + 1 <= 80) {
        title += ' ' + keyword;
      }
    }
    
    // Always try to include condition and location
    if (title.length + 4 <= 80) {
      title += ' VGC';
    }
    if (title.length + 3 <= 80) {
      title += ' UK';
    }
    
    // Ensure exactly 80 chars
    if (title.length > 80) {
      title = title.substring(0, 80).trim();
    }
    
    // Create detailed description
    let description = `${brand} ${garmentType.toLowerCase()} in ${color.toLowerCase()}. `;
    
    if (size !== 'One Size') {
      description += `Size ${size}`;
      if (brandInfo && brandInfo.sizes && brandInfo.sizes[size]) {
        const sizeInfo = brandInfo.sizes[size];
        if (sizeInfo.uk) {
          description += ` (UK ${sizeInfo.uk})`;
        }
      }
      description += '. ';
    }
    
    if (material !== 'See Label') {
      description += `${material} construction. `;
    }
    
    description += 'In very good condition with no visible flaws. ';
    
    if (brandInfo && brand !== 'Unbranded') {
      description += `${brand} is known for quality ${garmentType.toLowerCase()}s. `;
    }
    
    description += 'Please see all photos for details and measurements.';
    
    // Build complete analysis
    const analysis = {
      brand: brand,
      item_type: garmentType,
      gender: gender,
      size: size,
      color: color,
      material: material,
      keywords: keywords,
      ebay_title: title,
      vinted_title: `${brand} ${garmentType} Size ${size}`,
      suggested_price: suggestedPrice,
      estimated_value_min: Math.round(suggestedPrice * 0.8),
      estimated_value_max: Math.round(suggestedPrice * 1.3),
      condition_score: conditionScore,
      condition_text: conditionScore >= 8 ? 'Excellent' : 'Good',
      description: description,
      category: `${gender} Clothing > ${garmentType}s`,
      style: brandInfo ? brandInfo.keywords[0] : 'Casual',
      id: `analysis-${Date.now()}`,
      sku: `${brand.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: imageUrls.length,
      image_urls: imageUrls,
      analyzed_at: new Date().toISOString(),
      brand_knowledge_used: !!brandInfo
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
    version: '13.0',
    features: ['Multi-image analysis', 'Brand knowledge system', 'Smart pricing']
  });
}