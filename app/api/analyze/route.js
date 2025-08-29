// app/api/analyze/route.js
// FOCUSED FIX: Better color detection for pale/pastel colors

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
    objects: new Set(),
    colors: new Set()
  };
  
  console.log(`📸 Analyzing ${imageUrls.length} images...`);
  
  for (let i = 0; i < Math.min(imageUrls.length, 3); i++) {
    try {
      const imageBase64 = await fetchImageAsBase64(imageUrls[i]);
      const visionData = await analyzeWithGoogleVision(imageBase64);
      
      if (visionData) {
        // Get text
        if (visionData.textAnnotations?.[0]) {
          allTextData.fullText += ' ' + visionData.textAnnotations[0].description;
        }
        
        // Get text blocks
        if (visionData.textAnnotations) {
          visionData.textAnnotations.slice(1).forEach(t => {
            allTextData.textBlocks.push(t.description);
          });
        }
        
        // Get labels - including colors
        if (visionData.labelAnnotations) {
          visionData.labelAnnotations.forEach(l => {
            allTextData.labels.add(l.description);
            
            // Check for color-related labels
            const labelLower = l.description.toLowerCase();
            const colorWords = [
              'pink', 'rose', 'blush', 'salmon', 'coral', 'peach',
              'white', 'cream', 'ivory', 'beige', 'nude',
              'blue', 'navy', 'denim', 'azure', 'cobalt',
              'black', 'charcoal', 'grey', 'gray', 'silver',
              'red', 'burgundy', 'wine', 'maroon', 'crimson',
              'green', 'olive', 'khaki', 'emerald', 'mint',
              'purple', 'violet', 'plum', 'lavender', 'lilac',
              'brown', 'tan', 'camel', 'chocolate', 'taupe',
              'yellow', 'mustard', 'gold', 'lemon',
              'orange', 'rust', 'burnt'
            ];
            
            for (const colorWord of colorWords) {
              if (labelLower.includes(colorWord)) {
                allTextData.colors.add(colorWord);
                console.log(`🎨 Color detected in label: ${colorWord}`);
              }
            }
          });
        }
        
        // Check image properties for dominant colors
        if (visionData.imagePropertiesAnnotation?.dominantColors?.colors) {
          const dominantColors = visionData.imagePropertiesAnnotation.dominantColors.colors;
          console.log('🎨 Dominant colors from Vision API:', dominantColors.slice(0, 3));
          
          // Analyze RGB values to determine actual color
          for (const colorData of dominantColors.slice(0, 3)) {
            if (colorData.color) {
              const { red = 0, green = 0, blue = 0 } = colorData.color;
              const colorName = rgbToColorName(red, green, blue);
              if (colorName) {
                allTextData.colors.add(colorName);
                console.log(`🎨 Color from RGB (${red},${green},${blue}): ${colorName}`);
              }
            }
          }
        }
        
        // Get logos
        if (visionData.logoAnnotations) {
          visionData.logoAnnotations.forEach(l => {
            allTextData.logos.add(l.description);
          });
        }
      }
    } catch (error) {
      console.error(`Error on image ${i + 1}:`, error.message);
    }
  }
  
  return {
    fullText: allTextData.fullText,
    textBlocks: allTextData.textBlocks,
    textUpper: allTextData.fullText.toUpperCase(),
    lines: allTextData.fullText.split('\n').filter(l => l.trim()),
    labels: Array.from(allTextData.labels),
    logos: Array.from(allTextData.logos),
    objects: Array.from(allTextData.objects),
    colors: Array.from(allTextData.colors)
  };
}

// ========== RGB TO COLOR NAME CONVERTER ==========

function rgbToColorName(r, g, b) {
  // Normalize RGB values (0-255)
  const red = Math.round(r);
  const green = Math.round(g);
  const blue = Math.round(b);
  
  // Calculate color properties
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const diff = max - min;
  const sum = red + green + blue;
  const avg = sum / 3;
  
  console.log(`🔍 Analyzing RGB(${red}, ${green}, ${blue}) - Avg: ${avg}, Diff: ${diff}`);
  
  // Check for grayscale (including white)
  if (diff < 30) {
    if (avg > 230) return 'white';
    if (avg > 200) return 'light grey';
    if (avg > 150) return 'grey';
    if (avg > 80) return 'dark grey';
    return 'black';
  }
  
  // Check for pale pink (high values with red slightly higher)
  if (red > 200 && green > 180 && blue > 180 && red > green && red > blue) {
    if (red - green < 30 && red - blue < 40) {
      return 'pink'; // Pale pink/blush
    }
  }
  
  // Check for pink/rose tones
  if (red > green && red > blue) {
    if (red > 200 && green < 180 && blue < 180) return 'pink';
    if (red > 180 && green < 150) return 'rose';
    if (red > 150) return 'coral';
  }
  
  // Check for blue tones
  if (blue > red && blue > green) {
    if (blue > 200) return 'light blue';
    if (blue > 150) return 'blue';
    if (blue > 100 && green < 100 && red < 100) return 'navy';
  }
  
  // Check for green tones
  if (green > red && green > blue) {
    if (green > 200) return 'light green';
    if (green > 150) return 'green';
    if (green > 100 && red > 80) return 'olive';
  }
  
  // Check for yellow/beige tones
  if (red > 200 && green > 200 && blue < 180) {
    if (blue < 150) return 'yellow';
    return 'beige';
  }
  
  // Check for brown tones
  if (red > green && green > blue && red < 180) {
    return 'brown';
  }
  
  // Default for unclear colors
  return null;
}

// ========== ENHANCED COLOR DETECTOR ==========

function detectColor(labels, colors) {
  console.log('\n🎨 COLOR DETECTION');
  console.log('Colors found:', colors);
  console.log('Labels (first 10):', labels.slice(0, 10));
  
  // Priority 1: Check detected colors from RGB analysis
  if (colors.length > 0) {
    // Filter out generic colors if we have specific ones
    const specificColors = colors.filter(c => !['white', 'grey', 'black'].includes(c));
    if (specificColors.length > 0) {
      const color = specificColors[0];
      console.log(`✅ Using specific color: ${color}`);
      return color.charAt(0).toUpperCase() + color.slice(1);
    }
    
    // Use first color found
    const color = colors[0];
    console.log(`✅ Using detected color: ${color}`);
    return color.charAt(0).toUpperCase() + color.slice(1);
  }
  
  // Priority 2: Check labels for color words
  const labelsText = labels.map(l => l.toLowerCase()).join(' ');
  
  const colorMap = [
    { name: 'Pink', keywords: ['pink', 'rose', 'blush', 'salmon'] },
    { name: 'Red', keywords: ['red', 'crimson', 'burgundy', 'scarlet'] },
    { name: 'Blue', keywords: ['blue', 'navy', 'denim', 'azure'] },
    { name: 'Green', keywords: ['green', 'olive', 'khaki', 'emerald'] },
    { name: 'Purple', keywords: ['purple', 'violet', 'plum', 'lavender'] },
    { name: 'Yellow', keywords: ['yellow', 'mustard', 'gold'] },
    { name: 'Orange', keywords: ['orange', 'coral', 'peach'] },
    { name: 'Brown', keywords: ['brown', 'tan', 'beige', 'camel'] },
    { name: 'Grey', keywords: ['grey', 'gray', 'charcoal'] },
    { name: 'Black', keywords: ['black'] },
    { name: 'White', keywords: ['white', 'cream', 'ivory'] }
  ];
  
  for (const { name, keywords } of colorMap) {
    if (keywords.some(keyword => labelsText.includes(keyword))) {
      console.log(`✅ Color from labels: ${name}`);
      return name;
    }
  }
  
  console.log('⚠️ No color detected, using Neutral');
  return 'Neutral';
}

// ========== OTHER DETECTORS (keep existing) ==========

function detectBrand(textData) {
  const { textUpper, textBlocks } = textData;
  
  const brands = ['OSKA', 'CHILDISH', 'ZARA', 'H&M', 'NIKE', 'ADIDAS'];
  
  for (const brand of brands) {
    if (textUpper.includes(brand) || textBlocks.includes(brand)) {
      if (brand === 'OSKA') return 'Oska';
      return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
    }
  }
  
  return 'Unbranded';
}

function detectSize(textData, brand) {
  const { textBlocks } = textData;
  
  if (brand === 'Oska') {
    const oskaRomanSizes = {
      'I': '1',
      'II': '2',
      'III': '3',
      'IV': '4',
      'V': '5'
    };
    
    for (const block of textBlocks) {
      if (oskaRomanSizes[block.trim()]) {
        return oskaRomanSizes[block.trim()];
      }
      // Check for misread II
      if (block === '11' || block === 'll') {
        return '2';
      }
    }
    
    return '2'; // Default for Oska
  }
  
  // Standard sizes
  const validSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
  for (const block of textBlocks) {
    if (validSizes.includes(block.toUpperCase().trim())) {
      return block.toUpperCase().trim();
    }
  }
  
  return 'One Size';
}

function detectGarmentType(labels, brand) {
  const labelsText = labels.map(l => l.toLowerCase()).join(' ');
  
  if (brand === 'Oska') {
    if (labelsText.includes('dress')) return 'Dress';
    if (labelsText.includes('tunic')) return 'Tunic';
    if (labelsText.includes('vest') || labelsText.includes('sleeveless')) return 'Top';
    if (labelsText.includes('trouser')) return 'Trousers';
    return 'Top'; // Default for Oska
  }
  
  // Check garment types
  if (labelsText.includes('vest') || labelsText.includes('tank')) return 'Vest';
  if (labelsText.includes('dress')) return 'Dress';
  if (labelsText.includes('jeans')) return 'Jeans';
  if (labelsText.includes('trouser')) return 'Trousers';
  if (labelsText.includes('hoodie')) return 'Hoodie';
  if (labelsText.includes('sweatshirt')) return 'Sweatshirt';
  if (labelsText.includes('jumper')) return 'Jumper';
  if (labelsText.includes('t-shirt')) return 'T-Shirt';
  if (labelsText.includes('shirt')) return 'Shirt';
  
  if (labelsText.includes('sleeveless')) return 'Top';
  
  return 'Top';
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
            { type: 'LOGO_DETECTION', maxResults: 10 },
            { type: 'IMAGE_PROPERTIES', maxResults: 10 } // Add color detection
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
    
    const combinedData = await analyzeAllImages(imageUrls);
    
    const brand = detectBrand(combinedData);
    const size = detectSize(combinedData, brand);
    const garmentType = detectGarmentType(combinedData.labels, brand);
    const color = detectColor(combinedData.labels, combinedData.colors);
    
    // Material detection
    let material = 'Cotton';
    if (brand === 'Oska') material = 'Linen';
    if (combinedData.textUpper.includes('LINEN')) material = 'Linen';
    if (combinedData.textUpper.includes('COTTON')) material = 'Cotton';
    
    const keywords = getBrandKeywords(brand, garmentType) || ['VGC', 'UK'];
    const suggestedPrice = getSuggestedPrice(brand, 7) || 25;
    
    console.log('\n📊 FINAL:');
    console.log('Brand:', brand);
    console.log('Size:', size);
    console.log('Color:', color);
    
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
    
    for (const keyword of keywords.slice(0, 3)) {
      if (title.length + keyword.length + 1 <= 80) {
        title += ' ' + keyword;
      }
    }
    
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
      condition_score: 7
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