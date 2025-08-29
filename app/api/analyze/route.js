// app/api/analyze/route.js
// FIXED: Better garment detection and descriptive keywords

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ========== STRICT TITLE BUILDER ==========

function buildPerfectTitle(components) {
  const brand = components.brand || 'Unbranded';
  const item = components.item_type || 'Item';
  const gender = (components.gender || 'Unisex').replace(/['']/g, '');
  const size = components.size || 'One Size';
  const colour = components.color || 'Multi';
  const material = components.material || '';
  
  // Build base title
  let titleParts = [brand, item, gender, 'Size', size, colour];
  
  if (material && material !== 'Unknown') {
    titleParts.push(material);
  }
  
  let title = titleParts.join(' ');
  
  // Add DESCRIPTIVE keywords (not generic ones)
  const descriptiveKeywords = components.keywords || [];
  const usedWords = title.toUpperCase().split(' ');
  
  for (const keyword of descriptiveKeywords) {
    if (!usedWords.includes(keyword.toUpperCase())) {
      const testTitle = title + ' ' + keyword;
      if (testTitle.length <= 80) {
        title = testTitle;
      } else {
        break;
      }
    }
  }
  
  // Pad to 80 if needed
  if (title.length < 80) {
    const padding = ['UK', 'Genuine'];
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
  
  return title;
}

// ========== ENHANCED GARMENT DETECTOR ==========

function detectGarmentType(labels, objects, text) {
  console.log('🔍 Detecting garment from:', {
    labels: labels.slice(0, 10),
    hasText: text.length > 0
  });
  
  const labelsLower = labels.map(l => l.toLowerCase());
  const objectsLower = objects.map(o => o.toLowerCase());
  const allDetections = [...labelsLower, ...objectsLower];
  const textLower = text.toLowerCase();
  
  // CRITICAL: Check if image shows a person wearing it
  const showsPerson = allDetections.some(d => 
    d.includes('person') || 
    d.includes('man') || 
    d.includes('woman') ||
    d.includes('model')
  );
  
  // Check sleeve length indicators
  const longSleeveIndicators = [
    'sweater', 'jumper', 'sweatshirt', 'pullover', 'hoodie',
    'long sleeve', 'crew neck', 'knitwear', 'fleece'
  ];
  
  const shortSleeveIndicators = [
    't-shirt', 'tee', 'short sleeve', 'tshirt'
  ];
  
  // Count evidence
  let longSleeveScore = 0;
  let shortSleeveScore = 0;
  
  for (const indicator of longSleeveIndicators) {
    if (allDetections.some(d => d.includes(indicator))) longSleeveScore++;
    if (textLower.includes(indicator)) longSleeveScore++;
  }
  
  for (const indicator of shortSleeveIndicators) {
    if (allDetections.some(d => d.includes(indicator))) shortSleeveScore++;
    if (textLower.includes(indicator)) shortSleeveScore++;
  }
  
  console.log('Sleeve scores - Long:', longSleeveScore, 'Short:', shortSleeveScore);
  
  // If we see a person and clothing, check proportions
  if (showsPerson && allDetections.some(d => d.includes('clothing') || d.includes('garment'))) {
    // If sleeves extend to wrists/arms covered = long sleeves
    if (allDetections.some(d => d.includes('arm') || d.includes('wrist'))) {
      longSleeveScore += 2;
    }
  }
  
  // Make decision
  if (longSleeveScore > shortSleeveScore) {
    // It's long-sleeved
    if (textLower.includes('hood') || allDetections.some(d => d.includes('hood'))) {
      return 'Hoodie';
    }
    if (textLower.includes('sweat') || allDetections.some(d => d.includes('sweat'))) {
      return 'Sweatshirt';
    }
    return 'Jumper'; // Default for long sleeves
  }
  
  if (shortSleeveScore > 0 && longSleeveScore === 0) {
    return 'T-Shirt';
  }
  
  // Other garment types
  if (allDetections.some(d => d.includes('jeans') || d.includes('denim'))) {
    return 'Jeans';
  }
  if (allDetections.some(d => d.includes('trousers') || d.includes('pants'))) {
    return 'Trousers';
  }
  if (allDetections.some(d => d.includes('dress'))) {
    return 'Dress';
  }
  if (allDetections.some(d => d.includes('shirt')) && !shortSleeveScore) {
    return 'Shirt';
  }
  
  // Default based on what we see most
  if (allDetections.some(d => d.includes('top') || d.includes('clothing'))) {
    return 'Jumper'; // Safer default than T-Shirt
  }
  
  return 'Jumper';
}

// ========== ACCURATE SIZE DETECTOR ==========

function detectSize(text) {
  const textUpper = text.toUpperCase();
  console.log('🔍 Looking for size in text:', textUpper.substring(0, 200));
  
  // Look for explicit size markers
  const sizeMarkers = [
    /\bSIZE:?\s*([A-Z]{1,3})\b/,  // SIZE: S or SIZE S
    /\b(XXS|XS|S|M|L|XL|XXL|XXXL)\b(?![A-Z])/,  // Standalone size letters
    /\bSZ:?\s*([A-Z]{1,3})\b/,  // SZ: S
    /\bUK\s*(\d{1,2})\b/,  // UK 10
    /\bEUR?\s*(\d{2,3})\b/,  // EUR 38
  ];
  
  for (const pattern of sizeMarkers) {
    const match = textUpper.match(pattern);
    if (match && match[1]) {
      const size = match[1];
      // Validate it's a real size
      if (['XXS','XS','S','M','L','XL','XXL','XXXL'].includes(size)) {
        console.log('✅ Size found:', size);
        return size;
      }
      // Check numeric sizes
      if (!isNaN(size) && size >= 6 && size <= 20) {
        console.log('✅ Numeric size found:', size);
        return size;
      }
    }
  }
  
  console.log('⚠️ No size detected');
  return null;
}

// ========== KEYWORD GENERATOR ==========

function generateDescriptiveKeywords(garmentType, labels, text) {
  const keywords = [];
  const labelsLower = labels.map(l => l.toLowerCase());
  const textLower = text.toLowerCase();
  
  // Fit descriptors
  if (labelsLower.some(l => l.includes('oversized')) || textLower.includes('oversized')) {
    keywords.push('Oversized');
  } else if (labelsLower.some(l => l.includes('fitted'))) {
    keywords.push('Fitted');
  } else if (labelsLower.some(l => l.includes('relaxed'))) {
    keywords.push('Relaxed');
  }
  
  // Neckline for tops
  if (garmentType === 'Jumper' || garmentType === 'Sweatshirt') {
    if (textLower.includes('crew') || labelsLower.some(l => l.includes('crew'))) {
      keywords.push('Crew', 'Neck');
    } else if (textLower.includes('v-neck')) {
      keywords.push('V-Neck');
    }
  }
  
  // Material descriptors
  if (textLower.includes('ribbed')) {
    keywords.push('Ribbed');
  }
  if (textLower.includes('fleece') || labelsLower.some(l => l.includes('fleece'))) {
    keywords.push('Fleece');
  }
  
  // Style descriptors
  if (labelsLower.some(l => l.includes('street'))) {
    keywords.push('Streetwear');
  }
  if (labelsLower.some(l => l.includes('vintage'))) {
    keywords.push('Vintage');
  }
  if (labelsLower.some(l => l.includes('retro'))) {
    keywords.push('Retro');
  }
  
  // Condition keywords
  keywords.push('VGC'); // Default to Very Good Condition
  
  // Season
  if (garmentType === 'Jumper' || garmentType === 'Sweatshirt') {
    keywords.push('Warm');
  }
  
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
    console.error('Image fetch failed:', error);
    throw error;
  }
}

async function analyzeWithGoogleVision(imageBase64) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey || apiKey === 'your_google_cloud_vision_api_key') {
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
              { type: 'TEXT_DETECTION', maxResults: 100 },
              { type: 'LABEL_DETECTION', maxResults: 50 },
              { type: 'LOGO_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 50 }
            ]
          }]
        })
      }
    );

    if (!response.ok) return null;
    
    const data = await response.json();
    return data.responses?.[0];
  } catch (error) {
    console.error('Vision API error:', error);
    return null;
  }
}

async function generateListingWithClaude(components) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('AI not configured');
  
  try {
    const prompt = `Given these components, provide additional details for a UK eBay listing:

Item: ${components.item_type}
Size: ${components.size}
Detected text: ${components.text.substring(0, 300)}
Vision labels: ${components.labels.slice(0, 15).join(', ')}

Identify:
1. Brand (from text/logos) or "Unbranded"
2. Main color (UK spelling)
3. Material if visible
4. Gender (Mens/Womens/Unisex - NO apostrophes)
5. Price estimate in GBP

Return ONLY JSON:
{
  "brand": "brand or Unbranded",
  "color": "colour",
  "material": "material or Cotton",
  "gender": "Mens/Womens/Unisex",
  "suggested_price": 15,
  "description": "brief description"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) throw new Error('AI error');
    
    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error('Invalid response');
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Claude error:', error);
    throw error;
  }
}

// ========== MAIN HANDLER ==========

export async function POST(request) {
  console.log('\n🚀 === ANALYSIS REQUEST ===');
  
  try {
    const body = await request.json();
    const { imageUrls = [] } = body;
    
    if (!imageUrls.length) {
      return NextResponse.json({ success: false, error: 'No images' }, { status: 400 });
    }
    
    // Fetch and analyze image
    const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
    const visionData = await analyzeWithGoogleVision(imageBase64);
    
    // Extract data
    const detectedText = visionData?.textAnnotations?.[0]?.description || '';
    const labels = visionData?.labelAnnotations?.map(l => l.description) || [];
    const objects = visionData?.localizedObjectAnnotations?.map(o => o.name) || [];
    const logos = visionData?.logoAnnotations?.map(l => l.description) || [];
    
    // CRITICAL DETECTIONS
    const garmentType = detectGarmentType(labels, objects, detectedText);
    const size = detectSize(detectedText) || 'M'; // Default to M if not found
    const keywords = generateDescriptiveKeywords(garmentType, labels, detectedText);
    
    console.log('✅ Detected:', { garmentType, size, keywords });
    
    // Get additional details from Claude
    const claudeDetails = await generateListingWithClaude({
      item_type: garmentType,
      size: size,
      text: detectedText,
      labels: labels,
      logos: logos
    });
    
    // Build final listing
    const listing = {
      brand: claudeDetails.brand || logos[0] || 'Unbranded',
      item_type: garmentType,
      gender: claudeDetails.gender,
      size: size,
      color: claudeDetails.color,
      material: claudeDetails.material,
      keywords: keywords,
      suggested_price: claudeDetails.suggested_price,
      description: claudeDetails.description,
      condition_score: 7
    };
    
    // Build perfect title
    listing.ebay_title = buildPerfectTitle(listing);
    
    // Create response
    const analysis = {
      ...listing,
      id: `analysis-${Date.now()}`,
      sku: `${listing.brand.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: imageUrls.length,
      image_urls: imageUrls,
      analyzed_at: new Date().toISOString()
    };
    
    console.log('📊 Final:', {
      item: listing.item_type,
      size: listing.size,
      title: listing.ebay_title
    });
    
    return NextResponse.json({ success: true, analysis });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Analysis failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '6.0',
    message: 'Fixed garment detection and descriptive keywords'
  });
}