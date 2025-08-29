// app/api/analyze/route.js
// ENHANCED COLOR DETECTION WITH PROPER PALETTE

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

// ========== COMPREHENSIVE COLOR PALETTE ==========

const COLOR_PALETTE = {
  // Pinks
  'Pink': {
    keywords: ['pink', 'rose', 'blush', 'salmon', 'coral', 'peach', 'dusty rose', 'mauve'],
    rgb: { r: [180, 255], g: [150, 220], b: [150, 220] },
    priority: 8
  },
  'Pale Pink': {
    keywords: ['pale pink', 'light pink', 'baby pink', 'powder pink', 'pastel pink'],
    rgb: { r: [220, 255], g: [190, 230], b: [190, 230] },
    priority: 9
  },
  
  // Reds
  'Red': {
    keywords: ['red', 'crimson', 'scarlet', 'cherry', 'ruby'],
    rgb: { r: [180, 255], g: [0, 100], b: [0, 100] },
    priority: 7
  },
  'Burgundy': {
    keywords: ['burgundy', 'wine', 'maroon', 'bordeaux', 'oxblood'],
    rgb: { r: [100, 180], g: [0, 80], b: [0, 80] },
    priority: 7
  },
  
  // Blues
  'Blue': {
    keywords: ['blue', 'azure', 'cobalt', 'royal blue', 'sapphire'],
    rgb: { r: [0, 100], g: [0, 150], b: [150, 255] },
    priority: 6
  },
  'Navy': {
    keywords: ['navy', 'dark blue', 'midnight', 'marine'],
    rgb: { r: [0, 50], g: [0, 50], b: [50, 150] },
    priority: 6
  },
  'Light Blue': {
    keywords: ['light blue', 'sky blue', 'baby blue', 'powder blue', 'pale blue'],
    rgb: { r: [150, 220], g: [180, 230], b: [200, 255] },
    priority: 6
  },
  'Denim': {
    keywords: ['denim', 'jean'],
    rgb: { r: [50, 120], g: [70, 140], b: [100, 180] },
    priority: 3  // Lower priority - often background
  },
  
  // Greens
  'Green': {
    keywords: ['green', 'emerald', 'forest', 'jade'],
    rgb: { r: [0, 100], g: [100, 200], b: [0, 100] },
    priority: 5
  },
  'Olive': {
    keywords: ['olive', 'khaki', 'military', 'army'],
    rgb: { r: [80, 150], g: [80, 150], b: [0, 80] },
    priority: 5
  },
  'Mint': {
    keywords: ['mint', 'sage', 'seafoam', 'pistachio'],
    rgb: { r: [150, 220], g: [200, 255], b: [150, 220] },
    priority: 5
  },
  
  // Purples
  'Purple': {
    keywords: ['purple', 'violet', 'plum', 'amethyst'],
    rgb: { r: [100, 200], g: [0, 100], b: [100, 200] },
    priority: 5
  },
  'Lavender': {
    keywords: ['lavender', 'lilac', 'mauve', 'periwinkle'],
    rgb: { r: [180, 230], g: [150, 200], b: [200, 250] },
    priority: 5
  },
  
  // Neutrals
  'White': {
    keywords: ['white', 'ivory', 'cream', 'off-white', 'eggshell'],
    rgb: { r: [230, 255], g: [230, 255], b: [230, 255] },
    priority: 2  // Lower priority - often background
  },
  'Black': {
    keywords: ['black', 'ebony', 'jet'],
    rgb: { r: [0, 50], g: [0, 50], b: [0, 50] },
    priority: 4
  },
  'Grey': {
    keywords: ['grey', 'gray', 'charcoal', 'slate', 'ash', 'silver'],
    rgb: { r: [100, 200], g: [100, 200], b: [100, 200] },
    priority: 3
  },
  
  // Browns/Beiges
  'Brown': {
    keywords: ['brown', 'chocolate', 'cocoa', 'coffee', 'espresso'],
    rgb: { r: [80, 150], g: [50, 120], b: [20, 80] },
    priority: 4
  },
  'Tan': {
    keywords: ['tan', 'camel', 'taupe', 'sand', 'nude'],
    rgb: { r: [180, 230], g: [150, 200], b: [100, 150] },
    priority: 4
  },
  'Beige': {
    keywords: ['beige', 'stone', 'oatmeal', 'natural', 'ecru'],
    rgb: { r: [200, 240], g: [180, 220], b: [150, 200] },
    priority: 4
  },
  
  // Yellows/Oranges
  'Yellow': {
    keywords: ['yellow', 'gold', 'mustard', 'lemon', 'canary'],
    rgb: { r: [200, 255], g: [180, 255], b: [0, 100] },
    priority: 5
  },
  'Orange': {
    keywords: ['orange', 'rust', 'terracotta', 'burnt orange', 'apricot'],
    rgb: { r: [200, 255], g: [100, 180], b: [0, 100] },
    priority: 5
  }
};

// ========== RGB COLOR ANALYZER ==========

function analyzeRGBColor(r, g, b) {
  console.log(`🎨 Analyzing RGB(${r}, ${g}, ${b})`);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [colorName, colorData] of Object.entries(COLOR_PALETTE)) {
    const { rgb, priority } = colorData;
    
    // Check if RGB values fall within the color's range
    const rMatch = r >= rgb.r[0] && r <= rgb.r[1];
    const gMatch = g >= rgb.g[0] && g <= rgb.g[1];
    const bMatch = b >= rgb.b[0] && b <= rgb.b[1];
    
    if (rMatch && gMatch && bMatch) {
      // Calculate how well it matches (closer to center of range = better)
      const rScore = 1 - Math.abs(r - (rgb.r[0] + rgb.r[1]) / 2) / ((rgb.r[1] - rgb.r[0]) / 2);
      const gScore = 1 - Math.abs(g - (rgb.g[0] + rgb.g[1]) / 2) / ((rgb.g[1] - rgb.g[0]) / 2);
      const bScore = 1 - Math.abs(b - (rgb.b[0] + rgb.b[1]) / 2) / ((rgb.b[1] - rgb.b[0]) / 2);
      
      const score = ((rScore + gScore + bScore) / 3) * priority;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = colorName;
      }
    }
  }
  
  if (bestMatch) {
    console.log(`✅ RGB matched to: ${bestMatch} (score: ${bestScore.toFixed(2)})`);
    return bestMatch;
  }
  
  // Fallback to basic detection
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  if (diff < 30) {
    if ((r + g + b) / 3 > 230) return 'White';
    if ((r + g + b) / 3 > 150) return 'Grey';
    return 'Black';
  }
  
  if (r > g && r > b) return 'Pink';  // Default to pink for reddish tones
  if (b > r && b > g) return 'Blue';
  if (g > r && g > b) return 'Green';
  
  return 'Neutral';
}

// ========== ENHANCED COLOR DETECTOR ==========

function detectColor(labels, visionColors, dominantColors) {
  console.log('\n🎨 === COLOR DETECTION ===');
  console.log('Labels containing colors:', labels.filter(l => 
    l.toLowerCase().match(/pink|blue|white|red|green|black|grey|brown|beige/)
  ));
  
  const colorCandidates = [];
  
  // 1. Check dominant colors from image (if available)
  if (dominantColors && dominantColors.length > 0) {
    for (const colorData of dominantColors.slice(0, 5)) {
      if (colorData.color && colorData.score > 0.1) { // Only consider significant colors
        const { red = 0, green = 0, blue = 0 } = colorData.color;
        const colorName = analyzeRGBColor(
          Math.round(red * 255),
          Math.round(green * 255),
          Math.round(blue * 255)
        );
        
        if (colorName && colorName !== 'White' && colorName !== 'Grey') {
          colorCandidates.push({
            name: colorName,
            score: colorData.score * COLOR_PALETTE[colorName].priority,
            source: 'rgb'
          });
        }
      }
    }
  }
  
  // 2. Check labels for color keywords
  const labelsText = labels.map(l => l.toLowerCase()).join(' ');
  
  for (const [colorName, colorData] of Object.entries(COLOR_PALETTE)) {
    for (const keyword of colorData.keywords) {
      if (labelsText.includes(keyword)) {
        // Skip denim if it's in clothing/garment context
        if (keyword === 'denim' && labelsText.includes('clothing')) {
          continue;
        }
        
        colorCandidates.push({
          name: colorName,
          score: colorData.priority,
          source: 'label'
        });
        break;
      }
    }
  }
  
  // Sort by score and pick the best
  colorCandidates.sort((a, b) => b.score - a.score);
  
  console.log('Color candidates:', colorCandidates.slice(0, 5));
  
  if (colorCandidates.length > 0) {
    // Filter out background colors if we have garment colors
    const garmentColors = colorCandidates.filter(c => 
      !['White', 'Grey', 'Denim'].includes(c.name) || c.source === 'rgb'
    );
    
    if (garmentColors.length > 0) {
      console.log(`✅ Selected color: ${garmentColors[0].name}`);
      return garmentColors[0].name;
    }
    
    console.log(`✅ Selected color: ${colorCandidates[0].name}`);
    return colorCandidates[0].name;
  }
  
  console.log('⚠️ No color detected, defaulting to Neutral');
  return 'Neutral';
}

// ========== ANALYZE IMAGES WITH COLOR FOCUS ==========

async function analyzeAllImages(imageUrls) {
  const allTextData = {
    fullText: '',
    textBlocks: [],
    labels: new Set(),
    logos: new Set(),
    dominantColors: []
  };
  
  console.log(`📸 Analyzing ${imageUrls.length} images...`);
  
  // Prioritize first image for color detection (main product shot)
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
        
        // Get labels
        if (visionData.labelAnnotations) {
          visionData.labelAnnotations.forEach(l => {
            allTextData.labels.add(l.description);
          });
        }
        
        // Get dominant colors from first image mainly
        if (i === 0 && visionData.imagePropertiesAnnotation?.dominantColors?.colors) {
          allTextData.dominantColors = visionData.imagePropertiesAnnotation.dominantColors.colors;
          console.log(`🎨 Image ${i + 1} dominant colors:`, 
            allTextData.dominantColors.slice(0, 3).map(c => ({
              rgb: `(${Math.round((c.color?.red || 0) * 255)}, ${Math.round((c.color?.green || 0) * 255)}, ${Math.round((c.color?.blue || 0) * 255)})`,
              score: c.score?.toFixed(2)
            }))
          );
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
    dominantColors: allTextData.dominantColors
  };
}

// ========== OTHER DETECTORS (keep as is) ==========

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
    const oskaRomanSizes = { 'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5' };
    for (const block of textBlocks) {
      if (oskaRomanSizes[block.trim()]) return oskaRomanSizes[block.trim()];
      if (block === '11' || block === 'll') return '2';
    }
    return '2';
  }
  
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
    return 'Top';
  }
  
  if (labelsText.includes('vest') || labelsText.includes('tank')) return 'Vest';
  if (labelsText.includes('dress')) return 'Dress';
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
            { type: 'IMAGE_PROPERTIES', maxResults: 1 } // Get dominant colors
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
    const color = detectColor(combinedData.labels, [], combinedData.dominantColors);
    
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
    
    const gender = brand === 'Oska' ? 'Womens' : 'Womens';
    
    const titleParts = [brand, garmentType, gender, 'Size', size, color, material];
    let title = titleParts.join(' ');
    
    for (const keyword of keywords.slice(0, 3)) {
      if (title.length + keyword.length + 1 <= 80) {
        title += ' ' + keyword;
      }
    }
    
    if (title.length + 7 <= 80) title += ' VGC UK';
    if (title.length > 80) title = title.substring(0, 80).trim();
    
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
    
    return NextResponse.json({ success: true, analysis });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Analysis failed' }, { status: 500 });
  }
}