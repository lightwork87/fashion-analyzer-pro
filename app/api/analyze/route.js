// app/api/analyze/route.js
// FIXED VERSION - STRICT TITLE ENFORCEMENT & BETTER DETECTION

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
  // Clean and validate components
  const brand = components.brand || 'Unbranded';
  const item = components.item_type || 'Item';
  const gender = (components.gender || 'Unisex').replace(/['']/g, ''); // Remove ALL apostrophes
  const size = components.size || 'One Size';
  const colour = components.color || 'Multi';
  const material = components.material || '';
  
  // Start with mandatory structure
  let titleParts = [
    brand,
    item,
    gender,
    'Size',
    size,
    colour
  ];
  
  // Add material if we have it
  if (material && material !== 'Unknown') {
    titleParts.push(material);
  }
  
  // Join base parts
  let title = titleParts.join(' ');
  
  // Keywords to add (avoid duplicates)
  const usedWords = title.toUpperCase().split(' ');
  const availableKeywords = [
    'Streetwear', 'Casual', 'Vintage', 'Y2K', 'Retro', 'Urban',
    'VGC', 'Excellent', 'BNWT', 'Genuine', 'Authentic',
    'UK', 'Fast', 'Post', 'Seller'
  ];
  
  // Add keywords without duplicating
  for (const keyword of availableKeywords) {
    if (!usedWords.includes(keyword.toUpperCase())) {
      const testTitle = title + ' ' + keyword;
      if (testTitle.length <= 80) {
        title = testTitle;
      } else {
        break;
      }
    }
  }
  
  // Ensure exactly 80 characters
  if (title.length > 80) {
    title = title.substring(0, 80).trim();
  }
  
  // Pad if needed
  while (title.length < 80) {
    const padding = ['UK', 'Fast', 'Post'];
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
  
  return title;
}

// ========== GARMENT TYPE DETECTOR ==========

function detectGarmentType(visionLabels, detectedText) {
  const labels = visionLabels.map(l => l.toLowerCase());
  const textLower = detectedText.toLowerCase();
  
  // Priority detection rules
  if (labels.some(l => l.includes('hoodie')) || textLower.includes('hood')) {
    return 'Hoodie';
  }
  
  // Check for long/short sleeves
  const hasLongSleeves = labels.some(l => 
    l.includes('long sleeve') || 
    l.includes('sweater') || 
    l.includes('jumper') ||
    l.includes('sweatshirt') ||
    l.includes('pullover')
  );
  
  const hasShortSleeves = labels.some(l => 
    l.includes('short sleeve') || 
    l.includes('t-shirt') ||
    l.includes('tee')
  ) && !hasLongSleeves; // Only if NOT long sleeves
  
  // If we see crew neck, ribbed, or sweat fabric - it's likely a jumper/sweatshirt
  if (textLower.includes('crew') || textLower.includes('ribbed') || textLower.includes('fleece')) {
    return 'Jumper';
  }
  
  // Determine based on sleeves
  if (hasLongSleeves) {
    // Long sleeves = Jumper or Sweatshirt, NEVER T-Shirt
    if (textLower.includes('sweat') || labels.some(l => l.includes('sweat'))) {
      return 'Sweatshirt';
    }
    return 'Jumper';
  }
  
  if (hasShortSleeves) {
    return 'T-Shirt';
  }
  
  // Check for other garment types
  if (labels.some(l => l.includes('shirt')) && !hasShortSleeves) {
    return 'Shirt';
  }
  
  if (labels.some(l => l.includes('jacket'))) {
    return 'Jacket';
  }
  
  if (labels.some(l => l.includes('jeans') || l.includes('denim'))) {
    return 'Jeans';
  }
  
  if (labels.some(l => l.includes('trousers') || l.includes('pants'))) {
    return 'Trousers';
  }
  
  if (labels.some(l => l.includes('dress'))) {
    return 'Dress';
  }
  
  // Default to Jumper if unclear (better than T-Shirt for long items)
  return 'Jumper';
}

// ========== SIZE DETECTOR ==========

function detectSize(text) {
  const textUpper = text.toUpperCase();
  
  // Priority patterns - look for explicit size mentions
  const patterns = [
    /SIZE:\s*([XXS|XS|S|M|L|XL|XXL])\b/,
    /SIZE\s+([XXS|XS|S|M|L|XL|XXL])\b/,
    /\b(XXS|XS|S|M|L|XL|XXL)\b(?!\w)/, // Size letters not part of words
    /UK\s*(\d{1,2})\b/,
    /SIZE\s*(\d{1,2})\b/
  ];
  
  for (const pattern of patterns) {
    const match = textUpper.match(pattern);
    if (match && match[1]) {
      // Validate it's a real size
      const validSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
      const numericSizes = ['6', '8', '10', '12', '14', '16', '18', '20'];
      
      if (validSizes.includes(match[1]) || numericSizes.includes(match[1])) {
        return match[1];
      }
    }
  }
  
  // If no size found, return null (will use default)
  return null;
}

// ========== HELPER FUNCTIONS ==========

async function fetchImageAsBase64(imageUrl) {
  try {
    console.log('📥 Fetching image...');
    
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'LightLister-AI/1.0' },
      signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    console.log('✅ Image ready');
    return base64;
    
  } catch (error) {
    console.error('❌ Image fetch failed:', error.message);
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
    console.log('🔍 Analyzing image...');
    
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
      console.error('❌ Vision API error');
      return null;
    }

    const data = await response.json();
    const result = data.responses?.[0];
    
    if (result) {
      console.log('✅ Vision complete');
      console.log('Labels found:', result.labelAnnotations?.slice(0, 10).map(l => l.description));
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Vision error:', error.message);
    return null;
  }
}

async function generateListingWithClaude(visionData, detectedText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('AI not configured');
  }
  
  try {
    console.log('🤖 Generating listing...');
    
    // Extract key info from vision
    const labels = visionData?.labelAnnotations?.map(l => l.description) || [];
    const logos = visionData?.logoAnnotations?.map(l => l.description) || [];
    const objects = visionData?.localizedObjectAnnotations?.map(o => o.name) || [];
    
    // Detect garment type BEFORE sending to Claude
    const garmentType = detectGarmentType(labels, detectedText);
    console.log('📍 Garment type detected:', garmentType);
    
    // Detect size BEFORE sending to Claude
    const detectedSize = detectSize(detectedText);
    console.log('📍 Size detected:', detectedSize || 'Not found');
    
    const prompt = `Analyze this fashion item and provide ONLY the required components.

VISION DETECTION:
- Text found: "${detectedText.substring(0, 500)}"
- Labels: ${labels.slice(0, 20).join(', ')}
- Logos: ${logos.join(', ') || 'None'}
- Objects: ${objects.slice(0, 10).join(', ')}

ALREADY DETECTED:
- Garment type: ${garmentType}
- Size: ${detectedSize || 'Not found - estimate based on garment'}

YOUR TASK:
1. Identify the brand (from logos or text)
2. Confirm or correct the garment type: ${garmentType}
3. Use size: ${detectedSize || 'estimate S/M/L'}
4. Identify main color (UK spelling)
5. Identify material if visible
6. Determine gender (Mens/Womens/Unisex - NO apostrophes)

Return ONLY this JSON:
{
  "brand": "Brand name or Unbranded",
  "item_type": "${garmentType}",
  "gender": "Mens/Womens/Unisex",
  "size": "${detectedSize || 'M'}",
  "color": "Colour with UK spelling",
  "material": "Material or Unknown",
  "condition_score": 7,
  "suggested_price": 15,
  "description": "Brief description"
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
        max_tokens: 1000,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error('AI service error');
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response');
    }
    
    const listing = JSON.parse(jsonMatch[0]);
    
    // Override with our detected values
    listing.item_type = garmentType; // Use our detection
    if (detectedSize) {
      listing.size = detectedSize; // Use our size detection
    }
    
    // Clean gender field
    listing.gender = (listing.gender || 'Unisex').replace(/['']/g, '');
    
    // Build the perfect title
    listing.ebay_title = buildPerfectTitle(listing);
    
    console.log('✅ Title generated:', listing.ebay_title);
    
    return listing;
    
  } catch (error) {
    console.error('❌ Claude error:', error.message);
    throw error;
  }
}

// ========== MAIN HANDLER ==========

export async function POST(request) {
  console.log('\n🚀 === ANALYSIS REQUEST ===');
  
  try {
    let userId = 'temp-user-' + Date.now();
    try {
      const { userId: authUserId } = await auth();
      if (authUserId) userId = authUserId;
    } catch (authError) {
      console.log('Auth bypassed');
    }
    
    const body = await request.json();
    const { imageUrls = [] } = body;
    
    if (!imageUrls.length) {
      return NextResponse.json({
        success: false,
        error: 'No images provided'
      }, { status: 400 });
    }
    
    // Process image
    const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
    const visionData = await analyzeWithGoogleVision(imageBase64);
    
    // Extract text
    const detectedText = visionData?.textAnnotations?.[0]?.description || '';
    console.log('📝 Text detected:', detectedText.substring(0, 200));
    
    // Generate listing
    const listing = await generateListingWithClaude(visionData, detectedText);
    
    // Create response
    const analysis = {
      ...listing,
      id: `analysis-${Date.now()}`,
      sku: `${(listing.brand || 'UNB').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: imageUrls.length,
      image_urls: imageUrls,
      credits_remaining: 49,
      analyzed_at: new Date().toISOString()
    };
    
    console.log('\n📊 FINAL RESULT:');
    console.log('Brand:', listing.brand);
    console.log('Item:', listing.item_type);
    console.log('Size:', listing.size);
    console.log('Title:', listing.ebay_title);
    console.log('Length:', listing.ebay_title.length);
    
    return NextResponse.json({
      success: true,
      analysis
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Analysis failed'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '5.0',
    format: 'Brand Item Gender Size [size] Colour Material [keywords]'
  });
}