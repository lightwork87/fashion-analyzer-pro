// app/api/analyze-ai/route.js
// COMPLETE VERSION WITH ADAPTIVE LEARNING SYSTEM

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Check learned patterns before external API calls
async function checkLearnedPatterns(textContent) {
  try {
    const results = {
      brand: null,
      confidence: 0,
      patterns: []
    };

    // Clean and prepare text
    const cleanText = textContent.toUpperCase().trim();
    const words = cleanText.split(/\s+/);
    
    // Check brand aliases first
    for (const word of words) {
      const { data: aliases } = await supabase
        .from('brand_aliases')
        .select('canonical_brand, confidence')
        .ilike('alias', `%${word}%`)
        .order('confidence', { ascending: false })
        .limit(1);

      if (aliases && aliases.length > 0) {
        results.brand = aliases[0].canonical_brand;
        results.confidence = aliases[0].confidence;
        console.log(`✅ Found brand from alias: ${results.brand}`);
        return results;
      }
    }

    // Check learned patterns
    const { data: learned } = await supabase
      .from('brand_learning')
      .select('actual_brand, confidence, times_confirmed')
      .or(words.map(w => `detected_text.ilike.%${w}%`).join(','))
      .order('confidence', { ascending: false })
      .limit(5);

    if (learned && learned.length > 0) {
      // Take the highest confidence match
      const best = learned[0];
      if (best.confidence > 0.6) {
        results.brand = best.actual_brand;
        results.confidence = best.confidence;
        console.log(`✅ Found learned brand: ${results.brand} (confidence: ${results.confidence})`);
        
        // Increment confirmation count
        await supabase
          .from('brand_learning')
          .update({
            times_confirmed: best.times_confirmed + 1,
            updated_at: new Date().toISOString()
          })
          .eq('actual_brand', best.actual_brand);
      }
    }

    // Check keyword patterns
    const { data: keywords } = await supabase
      .from('keyword_patterns')
      .select('associated_brand, associated_type, association_strength')
      .in('keyword', words)
      .order('association_strength', { ascending: false })
      .limit(5);

    if (keywords && keywords.length > 0) {
      results.patterns = keywords;
      if (!results.brand && keywords[0].associated_brand) {
        results.brand = keywords[0].associated_brand;
        results.confidence = keywords[0].association_strength;
      }
    }

    return results;
    
  } catch (error) {
    console.error('Error checking learned patterns:', error);
    return { brand: null, confidence: 0, patterns: [] };
  }
}

// Fetch image from URL and convert to base64
async function fetchImageAsBase64(imageUrl) {
  try {
    console.log('📥 Fetching image from:', imageUrl);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch image:', response.status);
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    console.log('✅ Image fetched, size:', Math.round(base64.length / 1024), 'KB');
    return base64;
    
  } catch (error) {
    console.error('❌ Error fetching image:', error.message);
    return null;
  }
}

// Call Google Vision API
async function analyzeWithGoogleVision(imageBase64) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Google Vision API key');
    return null;
  }
  
  try {
    console.log('🔍 Calling Google Vision API...');
    
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
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'LOGO_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
              { type: 'WEB_DETECTION', maxResults: 10 }
            ]
          }]
        })
      }
    );

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Google Vision API error:', response.status, responseText);
      return null;
    }

    const data = JSON.parse(responseText);
    const result = data.responses?.[0];
    
    if (result) {
      console.log('✅ Vision API detected:', {
        textFound: !!(result.textAnnotations?.length > 0),
        firstText: result.textAnnotations?.[0]?.description?.substring(0, 100) || 'No text',
        labelsCount: result.labelAnnotations?.length || 0,
        labels: result.labelAnnotations?.slice(0, 5).map(l => l.description) || [],
        logos: result.logoAnnotations?.map(l => l.description) || [],
        objects: result.localizedObjectAnnotations?.slice(0, 5).map(o => o.name) || []
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Google Vision error:', error.message);
    return null;
  }
}

// Extract fashion details with learning integration
async function extractFashionDetailsWithLearning(visionData) {
  const details = {
    allText: '',
    possibleBrands: [],
    learnedBrand: null,
    learnedConfidence: 0,
    possibleSizes: [],
    itemTypes: [],
    colors: [],
    materials: []
  };
  
  // Get all text
  if (visionData?.textAnnotations?.length > 0) {
    details.allText = visionData.textAnnotations[0].description || '';
    console.log('📝 Text found:', details.allText.substring(0, 200));
  }
  
  // Check learned patterns FIRST
  const learnedResults = await checkLearnedPatterns(details.allText);
  
  if (learnedResults.brand && learnedResults.confidence > 0.6) {
    details.learnedBrand = learnedResults.brand;
    details.learnedConfidence = learnedResults.confidence;
    details.possibleBrands.push(learnedResults.brand);
    console.log(`🧠 Using learned brand: ${learnedResults.brand} (${Math.round(learnedResults.confidence * 100)}% confidence)`);
  }
  
  // Extract from text
  const textUpper = details.allText.toUpperCase();
  
  // Common UK fashion brands
  const brandList = [
    'ZARA', 'H&M', 'HM', 'H & M', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK', 
    'TOPSHOP', 'ASOS', 'MARKS & SPENCER', 'M&S', 'UNIQLO', 'GAP', 
    'MANGO', 'COS', 'RIVER ISLAND', 'NEW LOOK', 'BOOHOO', 'MISSGUIDED',
    'RALPH LAUREN', 'TOMMY HILFIGER', 'CALVIN KLEIN', 'LEVI\'S', 'LEVIS',
    'LACOSTE', 'FRED PERRY', 'BURBERRY', 'TED BAKER', 'SUPERDRY',
    'NORTH FACE', 'PATAGONIA', 'COLUMBIA', 'BERGHAUS', 'FILA', 'PUMA',
    'PRETTY LITTLE THING', 'PLT', 'SHEIN', 'URBAN OUTFITTERS', 'JACK WILLS',
    'HOLLISTER', 'ABERCROMBIE', 'ALL SAINTS', 'REISS', 'WHISTLES', 'JOHN LEWIS',
    'GEORGE', 'TU', 'F&F', 'MATALAN', 'SPORTS DIRECT', 'JD SPORTS'
  ];
  
  // Check for brands
  for (const brand of brandList) {
    if (textUpper.includes(brand)) {
      if (!details.possibleBrands.includes(brand)) {
        details.possibleBrands.push(brand);
      }
    }
  }
  
  // Check logos
  if (visionData?.logoAnnotations) {
    for (const logo of visionData.logoAnnotations) {
      const logoBrand = logo.description.toUpperCase();
      if (!details.possibleBrands.includes(logoBrand)) {
        details.possibleBrands.push(logoBrand);
      }
    }
  }
  
  // Check web entities for brands
  if (visionData?.webDetection?.webEntities) {
    for (const entity of visionData.webDetection.webEntities) {
      const entityUpper = entity.description?.toUpperCase() || '';
      for (const brand of brandList) {
        if (entityUpper.includes(brand) && !details.possibleBrands.includes(brand)) {
          details.possibleBrands.push(brand);
        }
      }
    }
  }
  
  // Size detection
  const sizePatterns = [
    /SIZE:?\s*([XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL])\b/i,
    /UK\s*SIZE:?\s*(\d{1,2})/i,
    /SIZE:?\s*UK\s*(\d{1,2})/i,
    /EUR:?\s*(\d{2,3})/i,
    /\b([XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL])\b/,
    /UK\s*(\d{1,2})\b/i
  ];
  
  for (const pattern of sizePatterns) {
    const match = textUpper.match(pattern);
    if (match && match[1]) {
      details.possibleSizes.push(match[1]);
    }
  }
  
  // Get item types from labels and objects
  const labels = visionData?.labelAnnotations?.map(l => l.description) || [];
  const objects = visionData?.localizedObjectAnnotations?.map(o => o.name) || [];
  
  const clothingTypes = [
    'Shirt', 'T-shirt', 'Dress', 'Jeans', 'Trousers', 'Jacket', 'Coat',
    'Sweater', 'Jumper', 'Hoodie', 'Blazer', 'Skirt', 'Shorts', 'Top',
    'Blouse', 'Cardigan', 'Vest', 'Suit', 'Pants', 'Sweatshirt', 'Leggings',
    'Joggers', 'Chinos', 'Polo', 'Tank Top', 'Knitwear', 'Parka', 'Windbreaker'
  ];
  
  const allDetections = [...labels, ...objects];
  for (const item of clothingTypes) {
    if (allDetections.some(d => d.toLowerCase().includes(item.toLowerCase()))) {
      details.itemTypes.push(item);
    }
  }
  
  // Apply learned patterns to item types
  if (learnedResults.patterns && learnedResults.patterns.length > 0) {
    for (const pattern of learnedResults.patterns) {
      if (pattern.associated_type && !details.itemTypes.includes(pattern.associated_type)) {
        details.itemTypes.push(pattern.associated_type);
      }
    }
  }
  
  // Extract colors
  const colorWords = ['Black', 'White', 'Blue', 'Red', 'Green', 'Navy', 'Grey', 'Brown', 'Pink', 'Purple', 'Beige'];
  for (const color of colorWords) {
    if (allDetections.some(d => d.toLowerCase().includes(color.toLowerCase()))) {
      details.colors.push(color);
    }
  }
  
  console.log('🔍 Extracted details with learning:', {
    learnedBrand: details.learnedBrand,
    allBrands: details.possibleBrands,
    itemTypes: details.itemTypes
  });
  
  return details;
}

// Generate listing with Claude
async function generateListingWithClaude(fashionDetails, visionData, imageCount) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Claude API key');
    return null;
  }
  
  try {
    console.log('🤖 Calling Claude API...');
    
    const labels = visionData?.labelAnnotations?.map(l => l.description).join(', ') || 'none';
    const objects = visionData?.localizedObjectAnnotations?.map(o => o.name).join(', ') || 'none';
    
    // Prioritize learned brand in prompt
    const brandToUse = fashionDetails.learnedBrand || fashionDetails.possibleBrands[0] || 'Unbranded';
    
    const prompt = `You are an expert UK eBay fashion seller. Create a perfect listing based on this item analysis.

DETECTED INFORMATION:
- Text from labels/tags: "${fashionDetails.allText}"
- AI LEARNED BRAND (HIGH CONFIDENCE): ${fashionDetails.learnedBrand || 'None'}
- Other possible brands: ${fashionDetails.possibleBrands.join(', ') || 'None detected'}
- Possible sizes: ${fashionDetails.possibleSizes.join(', ') || 'None detected'}
- Visual labels: ${labels}
- Objects detected: ${objects}
- Colors: ${fashionDetails.colors.join(', ') || 'Not detected'}
- Item types: ${fashionDetails.itemTypes.join(', ') || 'Not detected'}

IMPORTANT: If there's an AI LEARNED BRAND with high confidence, prioritize using that brand.

REQUIREMENTS:
1. Create an eBay UK title (MAX 80 characters) format: [Brand] [Gender] [Item Type] [Color] Size [Size] [Condition]
2. Use the learned brand if available, otherwise use detected brand or "Unbranded"
3. Determine specific item type from the analysis
4. Use UK spelling and sizing
5. Price in GBP (£) for UK market

Return ONLY valid JSON:
{
  "brand": "${brandToUse}",
  "item_type": "specific item type",
  "size": "UK size",
  "color": "main colour",
  "condition_score": 7,
  "estimated_value_min": 10,
  "estimated_value_max": 25,
  "ebay_title": "Perfect eBay UK title under 80 chars",
  "description": "Professional description with bullet points",
  "suggested_price": 15,
  "category": "Clothes, Shoes & Accessories",
  "material": "detected material",
  "style": "style type",
  "gender": "Men's/Women's/Unisex",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Claude API error:', response.status, responseText);
      return null;
    }

    const data = JSON.parse(responseText);
    const content = data.content?.[0]?.text || '';
    
    console.log('📝 Claude response received');
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const listing = JSON.parse(jsonMatch[0]);
        console.log('✅ Listing generated:', listing.ebay_title);
        return listing;
      } catch (e) {
        console.error('❌ Failed to parse Claude JSON:', e);
        return null;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Claude API error:', error.message);
    return null;
  }
}

// Main handler
export async function POST(request) {
  console.log('\n🚀 === NEW AI ANALYSIS WITH LEARNING ===');
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrls = [], imageCount } = body;
    const numImages = imageUrls.length || imageCount || 1;
    
    console.log(`📸 Processing ${numImages} images for user ${userId}`);
    
    // Get or create user
    let { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: `user-${userId}@example.com`,
          credits_total: 50,
          credits_used: 0,
          bonus_credits: 0
        })
        .select()
        .single();
      userData = newUser;
    }

    const creditsAvailable = (userData?.credits_total || 0) - (userData?.credits_used || 0) + (userData?.bonus_credits || 0);
    
    if (creditsAvailable <= 0) {
      return NextResponse.json({ 
        error: 'No credits available',
        credits_remaining: 0 
      }, { status: 402 });
    }

    // Main AI analysis with learning
    let finalListing = null;
    
    if (imageUrls && imageUrls.length > 0) {
      // Fetch and analyze first image
      const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
      
      if (imageBase64) {
        const visionData = await analyzeWithGoogleVision(imageBase64);
        
        if (visionData) {
          // Use enhanced extraction with learning
          const fashionDetails = await extractFashionDetailsWithLearning(visionData);
          finalListing = await generateListingWithClaude(fashionDetails, visionData, numImages);
          
          // Add learning confidence to listing
          if (finalListing && fashionDetails.learnedBrand) {
            finalListing.ai_confidence = fashionDetails.learnedConfidence;
            finalListing.used_learning = true;
          }
        }
      }
    }
    
    // If AI failed, use fallback
    if (!finalListing) {
      console.log('⚠️ Using fallback listing');
      finalListing = {
        brand: "Unbranded",
        item_type: "Clothing Item",
        size: "See Label",
        color: "Multi",
        condition_score: 7,
        estimated_value_min: 8,
        estimated_value_max: 20,
        ebay_title: "Unbranded Clothing Item - Please See Photos for Details",
        description: `Item as shown in photos.

- Condition: Good pre-owned condition
- Please check all photos for size, brand, and item details

Ships within 1 business day via Royal Mail.`,
        suggested_price: 12,
        category: "Clothes, Shoes & Accessories",
        material: "See label",
        style: "Casual",
        gender: "Unisex",
        keywords: ["clothing", "fashion", "uk"],
        used_learning: false
      };
    }
    
    // Create complete analysis
    const completeAnalysis = {
      ...finalListing,
      id: `analysis-${Date.now()}`,
      sku: `${(finalListing.brand || 'UNB').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: numImages,
      image_urls: imageUrls,
      credits_remaining: creditsAvailable - 1,
      analyzed_at: new Date().toISOString()
    };
    
    // Save to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('analyses')
      .insert({
        user_id: userId,
        brand: completeAnalysis.brand,
        item_type: completeAnalysis.item_type,
        size: completeAnalysis.size || 'Not specified',
        condition_score: completeAnalysis.condition_score,
        estimated_value_min: completeAnalysis.estimated_value_min,
        estimated_value_max: completeAnalysis.estimated_value_max,
        ebay_title: completeAnalysis.ebay_title,
        description: completeAnalysis.description,
        buy_it_now_price: completeAnalysis.suggested_price,
        department: completeAnalysis.gender || 'Unisex',
        style: completeAnalysis.style || 'Casual',
        sku: completeAnalysis.sku,
        images_count: completeAnalysis.images_count,
        metadata: completeAnalysis
      })
      .select()
      .single();
    
    if (saveError) {
      console.error('Save error:', saveError);
    } else {
      completeAnalysis.id = savedAnalysis.id;
    }
    
    // Update credits
    await supabase
      .from('users')
      .update({ credits_used: (userData?.credits_used || 0) + 1 })
      .eq('clerk_id', userId);
    
    console.log('✅ Analysis complete:', completeAnalysis.ebay_title);
    console.log('🧠 Used learning:', completeAnalysis.used_learning || false);
    
    return NextResponse.json({
      success: true,
      analysis: completeAnalysis
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  // Check learning system status
  const { count: learnedBrands } = await supabase
    .from('brand_learning')
    .select('*', { count: 'exact', head: true });
  
  const { count: corrections } = await supabase
    .from('ai_corrections')
    .select('*', { count: 'exact', head: true });
  
  return NextResponse.json({
    status: 'ok',
    message: 'AI Analysis API v5.0 with Learning',
    apis: {
      googleVision: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    },
    learning: {
      learnedPatterns: learnedBrands || 0,
      totalCorrections: corrections || 0
    },
    timestamp: new Date().toISOString()
  });
}