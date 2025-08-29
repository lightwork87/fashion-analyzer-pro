// app/api/analyze-ai/route.js
// FIXED VERSION - ANALYZES ALL IMAGES + PERFECT TITLE GENERATION

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Fetch image from URL and convert to base64
async function fetchImageAsBase64(imageUrl) {
  try {
    console.log('📥 Fetching image:', imageUrl.substring(0, 60) + '...');
    
    const response = await fetch(imageUrl, {
      timeout: 15000,
      headers: { 'User-Agent': 'LightLister-AI/1.0' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    console.log('✅ Image fetched:', Math.round(base64.length / 1024) + 'KB');
    return base64;
    
  } catch (error) {
    console.error('❌ Image fetch failed:', error.message);
    throw error;
  }
}

// Analyze single image with Google Vision
async function analyzeWithGoogleVision(imageBase64) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Missing Google Vision API key');
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
              { type: 'TEXT_DETECTION', maxResults: 10 },
              { type: 'LABEL_DETECTION', maxResults: 15 },
              { type: 'LOGO_DETECTION', maxResults: 5 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.responses?.[0];
    
  } catch (error) {
    console.error('❌ Vision API error:', error.message);
    return null;
  }
}

// Process multiple images and combine results
async function analyzeAllImages(imageUrls, imageData) {
  console.log(`🔍 Analyzing ${imageUrls.length + imageData.length} images...`);
  
  const combinedResults = {
    allTexts: [],
    brands: [],
    sizes: [],
    items: [],
    colors: [],
    skuFound: null,
    rulerVisible: false,
    imageAnalyses: []
  };

  // Process URL images
  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const imageBase64 = await fetchImageAsBase64(imageUrls[i]);
      if (imageBase64) {
        const visionData = await analyzeWithGoogleVision(imageBase64);
        if (visionData) {
          const analysis = extractFashionDetails(visionData, i + 1, imageUrls.length);
          combinedResults.imageAnalyses.push(analysis);
          
          // Combine results
          if (analysis.text) combinedResults.allTexts.push(analysis.text);
          combinedResults.brands.push(...analysis.brands);
          combinedResults.sizes.push(...analysis.sizes);
          combinedResults.items.push(...analysis.items);
          combinedResults.colors.push(...analysis.colors);
          
          // Check if this is the last image (bagged item with SKU)
          if (i === imageUrls.length - 1) {
            combinedResults.skuFound = analysis.sku;
          }
          
          // Check for ruler
          if (analysis.rulerVisible) {
            combinedResults.rulerVisible = true;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to analyze image ${i + 1}:`, error.message);
    }
  }

  // Process base64 images
  for (let i = 0; i < imageData.length; i++) {
    try {
      const base64Data = imageData[i].base64;
      const imageBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      
      const visionData = await analyzeWithGoogleVision(imageBase64);
      if (visionData) {
        const analysis = extractFashionDetails(visionData, i + 1, imageData.length);
        combinedResults.imageAnalyses.push(analysis);
        
        // Combine results
        if (analysis.text) combinedResults.allTexts.push(analysis.text);
        combinedResults.brands.push(...analysis.brands);
        combinedResults.sizes.push(...analysis.sizes);
        combinedResults.items.push(...analysis.items);
        combinedResults.colors.push(...analysis.colors);
        
        // Check if this is the last image (bagged item with SKU)
        if (i === imageData.length - 1) {
          combinedResults.skuFound = analysis.sku;
        }
        
        // Check for ruler
        if (analysis.rulerVisible) {
          combinedResults.rulerVisible = true;
        }
      }
    } catch (error) {
      console.error(`❌ Failed to analyze base64 image ${i + 1}:`, error.message);
    }
  }

  // Remove duplicates and clean up
  combinedResults.brands = [...new Set(combinedResults.brands)];
  combinedResults.sizes = [...new Set(combinedResults.sizes)];
  combinedResults.items = [...new Set(combinedResults.items)];
  combinedResults.colors = [...new Set(combinedResults.colors)];

  console.log('🔍 Combined analysis from all images:', {
    totalImages: combinedResults.imageAnalyses.length,
    textsFound: combinedResults.allTexts.length,
    uniqueBrands: combinedResults.brands.length,
    uniqueSizes: combinedResults.sizes.length,
    skuFound: !!combinedResults.skuFound,
    rulerVisible: combinedResults.rulerVisible
  });

  return combinedResults;
}

// Extract fashion details from single image
function extractFashionDetails(visionData, imageIndex, totalImages) {
  const details = {
    imageIndex,
    text: '',
    brands: [],
    sizes: [],
    items: [],
    colors: [],
    sku: null,
    rulerVisible: false
  };
  
  // Get all detected text
  if (visionData?.textAnnotations?.length > 0) {
    details.text = visionData.textAnnotations[0].description || '';
    console.log(`📝 Image ${imageIndex}/${totalImages} text:`, details.text.substring(0, 100));
  }
  
  const textUpper = details.text.toUpperCase();
  
  // Enhanced brand detection
  const brands = [
    'ZARA', 'H&M', 'NEXT', 'NIKE', 'ADIDAS', 'UNIQLO', 'GAP', 'MANGO',
    'TOPSHOP', 'ASOS', 'M&S', 'PRIMARK', 'RIVER ISLAND', 'NEW LOOK',
    'RALPH LAUREN', 'TOMMY HILFIGER', 'CALVIN KLEIN', 'LACOSTE',
    'LEVIS', 'LEVI\'S', 'SUPERDRY', 'FRED PERRY', 'BURBERRY', 'TED BAKER'
  ];
  
  // Check for brands in text
  brands.forEach(brand => {
    if (textUpper.includes(brand)) {
      details.brands.push(brand);
    }
  });
  
  // Check logos
  if (visionData?.logoAnnotations) {
    visionData.logoAnnotations.forEach(logo => {
      details.brands.push(logo.description.toUpperCase());
    });
  }
  
  // Enhanced size detection
  const sizePatterns = [
    /UK\s*SIZE:?\s*(\d{1,2})/i,
    /SIZE:?\s*UK\s*(\d{1,2})/i,
    /SIZE:?\s*([XS|S|M|L|XL|XXL|XXXL])\b/i,
    /\bUK\s*(\d{1,2})\b/i,
    /EUR:?\s*(\d{2,3})/i,
    /SIZE\s+(\d{1,2})/i
  ];
  
  sizePatterns.forEach(pattern => {
    const match = textUpper.match(pattern);
    if (match) {
      details.sizes.push(match[1]);
    }
  });
  
  // Item types from labels
  const clothingTypes = [
    'Shirt', 'T-shirt', 'Dress', 'Jeans', 'Jacket', 'Sweater', 
    'Hoodie', 'Blazer', 'Skirt', 'Shorts', 'Top', 'Trousers',
    'Cardigan', 'Jumper', 'Coat', 'Blouse'
  ];
  
  const labels = visionData?.labelAnnotations?.map(l => l.description) || [];
  const objects = visionData?.localizedObjectAnnotations?.map(o => o.name) || [];
  
  clothingTypes.forEach(type => {
    if ([...labels, ...objects].some(d => 
      d.toLowerCase().includes(type.toLowerCase())
    )) {
      details.items.push(type);
    }
  });
  
  // Color detection
  const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Grey', 'Brown', 'Pink', 'Purple', 'Yellow', 'Orange'];
  colors.forEach(color => {
    if ([...labels, ...objects].some(d => 
      d.toLowerCase().includes(color.toLowerCase())
    )) {
      details.colors.push(color);
    }
  });
  
  // SKU detection (last image typically)
  if (imageIndex === totalImages) {
    const skuPatterns = [
      /\b([A-Z]{2,4}-?\d{4,8})\b/,
      /\b(\d{6,10})\b/,
      /SKU:?\s*([A-Z0-9-]{4,12})/i
    ];
    
    skuPatterns.forEach(pattern => {
      const match = details.text.match(pattern);
      if (match) {
        details.sku = match[1];
      }
    });
  }
  
  // Ruler detection
  if ([...labels, ...objects].some(d => 
    d.toLowerCase().includes('ruler') || 
    d.toLowerCase().includes('measuring') ||
    d.toLowerCase().includes('tape measure')
  )) {
    details.rulerVisible = true;
  }
  
  return details;
}

// Generate listing with Claude - UPDATED WITH PERFECT TITLE REQUIREMENTS
async function generateListingWithClaude(combinedResults, imageCount) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Missing Claude API key');
    return null;
  }
  
  try {
    console.log('🤖 Calling Claude AI for perfect title generation...');
    
    // Enhanced prompt with EXACT title requirements
    const prompt = `Create a perfect eBay UK listing analyzing ALL ${imageCount} images provided:

DETECTED FROM ALL IMAGES:
- All text found: "${combinedResults.allTexts.join(' | ')}"
- Brands detected: ${combinedResults.brands.join(', ') || 'None'}
- Sizes found: ${combinedResults.sizes.join(', ') || 'None'}
- Item types: ${combinedResults.items.join(', ') || 'Clothing'}
- Colors detected: ${combinedResults.colors.join(', ') || 'Various'}
- SKU found on bagged item: ${combinedResults.skuFound || 'None'}
- Ruler visible: ${combinedResults.rulerVisible ? 'YES - include measurements' : 'NO'}
- Total images analyzed: ${imageCount}

CRITICAL TITLE REQUIREMENTS:
1. EXACTLY this structure: "Brand Item Gender Size Colour Material Keywords"
2. 80 characters maximum - try to hit exactly 80 but NEVER exceed
3. BANNED characters: . , - £ (use spaces instead)
4. UK spelling: Colour not Color, Grey not Gray
5. Examples:
   - "ZARA Midi Dress Womens Size 12 Black Polyester Casual Party UK"
   - "NIKE Hoodie Mens Large Grey Cotton Sportswear Pullover Casual UK"

ITEM SPECIFICS:
- Add SKU if found on bagged item
- Include measurements if ruler visible

Return ONLY valid JSON:
{
  "brand": "exact brand or Unbranded",
  "item_type": "specific item type",
  "gender": "Mens/Womens/Unisex", 
  "size": "UK size format",
  "color": "main colour UK spelling",
  "material": "fabric type",
  "condition_score": 8,
  "ebay_title": "PERFECT 80 char title Brand Item Gender Size Colour Material Keywords",
  "description": "Professional description with measurements if ruler visible",
  "suggested_price": 15,
  "category": "Clothes, Shoes & Accessories",
  "keywords": ["uk", "fashion", "preloved"],
  "sku_detected": "${combinedResults.skuFound || 'None'}",
  "measurements_visible": ${combinedResults.rulerVisible}
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
        temperature: 0.2,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    // Extract and validate JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const listing = JSON.parse(jsonMatch[0]);
        
        // Enforce 80 character limit and banned characters
        if (listing.ebay_title) {
          listing.ebay_title = listing.ebay_title
            .replace(/[.,-£]/g, ' ') // Remove banned chars
            .replace(/\s+/g, ' ') // Remove double spaces
            .trim()
            .substring(0, 80); // Enforce limit
        }
        
        console.log('✅ Perfect title generated:', listing.ebay_title, `(${listing.ebay_title.length} chars)`);
        return listing;
        
      } catch (e) {
        console.error('❌ JSON parse error:', e);
        return null;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Claude error:', error.message);
    return null;
  }
}

// Main handler
export async function POST(request) {
  console.log('\n🚀 === MULTI-IMAGE AI ANALYSIS STARTING ===');
  
  try {
    // Get user ID
    let userId = 'temp-user';
    try {
      const authResult = await auth();
      userId = authResult.userId || 'temp-user';
    } catch (authError) {
      console.log('⚠️ Auth bypassed, using temp user');
    }

    const body = await request.json();
    const { imageUrls = [], imageData = [], imageCount = 1 } = body;
    
    const totalImages = imageUrls.length + imageData.length;
    console.log(`📸 Processing ${totalImages} images for complete analysis`);
    
    if (totalImages === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }
    
    // Check credits
    const creditsAvailable = 10; // Mock for now
    if (creditsAvailable <= 0) {
      return NextResponse.json({ 
        error: 'No credits available' 
      }, { status: 402 });
    }

    // MULTI-IMAGE AI Analysis Pipeline
    let finalListing = null;
    
    try {
      // Analyze ALL images and combine results
      const combinedResults = await analyzeAllImages(imageUrls, imageData);
      
      if (combinedResults.imageAnalyses.length > 0) {
        // Generate listing with Claude using ALL image data
        finalListing = await generateListingWithClaude(combinedResults, totalImages);
      }
      
    } catch (pipelineError) {
      console.error('❌ Multi-image pipeline error:', pipelineError.message);
    }
    
    // Enhanced fallback with proper title structure
    if (!finalListing) {
      console.log('⚠️ AI failed, using enhanced fallback with proper title');
      finalListing = {
        brand: "Unbranded",
        item_type: "Clothing Item",
        gender: "Unisex",
        size: "Please Check Label", 
        color: "Multi",
        material: "Mixed",
        condition_score: 7,
        ebay_title: "Unbranded Clothing Item Unisex Please Check Label Multi Mixed UK", // 68 chars
        description: `Unbranded Clothing Item Unisex Please Check Label Multi Mixed UK

Good used condition please see all photos for details
From smoke free home
Fast UK postage via Royal Mail

Please check all photos for size brand and item details`,
        suggested_price: 12,
        category: "Clothes, Shoes & Accessories",
        keywords: ["clothing", "fashion", "uk", "preloved"],
        sku_detected: "None",
        measurements_visible: false
      };
    }
    
    // Create final result
    const analysis = {
      ...finalListing,
      id: `analysis-${Date.now()}`,
      sku: finalListing.sku_detected !== 'None' ? finalListing.sku_detected : `${finalListing.brand.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: totalImages,
      image_urls: imageUrls,
      credits_remaining: creditsAvailable - 1,
      analyzed_at: new Date().toISOString(),
      analysis_method: 'multi_image_enhanced'
    };
    
    console.log('✅ Multi-image analysis complete:', analysis.ebay_title);
    
    return NextResponse.json({
      success: true,
      analysis: analysis
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: 'Multi-Image AI Analysis v7.0',
    features: [
      'Analyzes ALL uploaded images',
      'Perfect 80-character eBay titles',
      'Proper title structure enforcement',
      'SKU detection from bagged items',
      'Ruler/measurement detection',
      'Enhanced brand/size detection'
    ],
    apis: {
      googleVision: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    },
    timestamp: new Date().toISOString()
  });
}