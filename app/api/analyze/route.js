// app/api/analyze/route.js
// VERSION WITH BRAND AND KEYWORD LEARNING SYSTEMS

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ========== KEYWORD LEARNING SYSTEM ==========

// Get best keywords for an item type/brand combo
async function getLearnedKeywords(itemType, brand, category) {
  try {
    // Get keywords that work well for this specific combo
    const { data: specificKeywords } = await supabase
      .from('keyword_patterns')
      .select('keyword, confidence_score')
      .or(`item_type.eq.${itemType},brand.eq.${brand},category.eq.${category}`)
      .gte('confidence_score', 0.6)
      .order('confidence_score', { ascending: false })
      .limit(20);
    
    // Get general high-performing keywords
    const { data: generalKeywords } = await supabase
      .from('keyword_patterns')
      .select('keyword, confidence_score')
      .is('item_type', null)
      .gte('confidence_score', 0.7)
      .order('confidence_score', { ascending: false })
      .limit(10);
    
    const allKeywords = [
      ...(specificKeywords || []),
      ...(generalKeywords || [])
    ];
    
    // Remove duplicates and return top keywords
    const uniqueKeywords = [...new Map(allKeywords.map(k => [k.keyword, k])).values()];
    
    console.log(`📚 Found ${uniqueKeywords.length} learned keywords for ${itemType}/${brand}`);
    return uniqueKeywords.slice(0, 10).map(k => k.keyword);
    
  } catch (error) {
    console.error('Error fetching learned keywords:', error);
    return [];
  }
}

// Learn from keyword corrections
async function learnFromKeywordCorrection(analysisId, itemType, brand, original, corrected, userId) {
  try {
    const removed = original.filter(k => !corrected.includes(k));
    const added = corrected.filter(k => !original.includes(k));
    
    // Record the correction
    await supabase
      .from('keyword_corrections')
      .insert({
        analysis_id: analysisId,
        item_type: itemType,
        brand: brand,
        original_keywords: original,
        corrected_keywords: corrected,
        removed_keywords: removed,
        added_keywords: added,
        user_id: userId
      });
    
    // Decrease confidence for removed keywords
    for (const keyword of removed) {
      const { data: existing } = await supabase
        .from('keyword_patterns')
        .select('*')
        .eq('keyword', keyword)
        .eq('item_type', itemType)
        .single();
      
      if (existing) {
        const newConfidence = Math.max(0, existing.confidence_score - 0.1);
        await supabase
          .from('keyword_patterns')
          .update({ 
            confidence_score: newConfidence,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        console.log(`📉 Decreased confidence for "${keyword}" to ${newConfidence}`);
      }
    }
    
    // Increase confidence for added keywords
    for (const keyword of added) {
      const { data: existing } = await supabase
        .from('keyword_patterns')
        .select('*')
        .eq('keyword', keyword)
        .eq('item_type', itemType)
        .single();
      
      if (existing) {
        const newConfidence = Math.min(1, existing.confidence_score + 0.15);
        await supabase
          .from('keyword_patterns')
          .update({ 
            confidence_score: newConfidence,
            usage_count: existing.usage_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        console.log(`📈 Increased confidence for "${keyword}" to ${newConfidence}`);
      } else {
        // New keyword learned from manual edit
        await supabase
          .from('keyword_patterns')
          .insert({
            keyword: keyword,
            item_type: itemType,
            brand: brand,
            confidence_score: 0.7, // Start with good confidence since human added it
            source: 'manual_edit'
          });
        
        console.log(`🆕 Learned new keyword from edit: "${keyword}" for ${itemType}`);
      }
    }
    
  } catch (error) {
    console.error('Error learning from keyword correction:', error);
  }
}

// ========== BRAND LEARNING SYSTEM (from before) ==========

async function getDatabaseBrands() {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('brand_name, display_name, confidence_score')
      .order('confidence_score', { ascending: false });
    
    if (error) {
      console.error('Error fetching brands:', error);
      return [];
    }
    
    return data.map(b => b.brand_name.toUpperCase());
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}

async function learnBrand(brandName, source = 'vision_api', analysisId = null, userId = null) {
  try {
    const normalizedBrand = brandName.toUpperCase().trim();
    
    const { data: existing } = await supabase
      .from('brands')
      .select('id, confidence_score, total_detections')
      .eq('brand_name', normalizedBrand)
      .single();
    
    if (existing) {
      await supabase
        .from('brands')
        .update({
          confidence_score: existing.confidence_score + 1,
          total_detections: existing.total_detections + 1,
          last_detected: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('brands')
        .insert({
          brand_name: normalizedBrand,
          display_name: brandName,
          confidence_score: 1,
          total_detections: 1
        });
      
      console.log(`🆕 New brand learned: ${normalizedBrand}`);
    }
    
    await supabase
      .from('brand_detections')
      .insert({
        analysis_id: analysisId,
        brand_name: normalizedBrand,
        detection_source: source,
        user_id: userId
      });
    
  } catch (error) {
    console.error('Error learning brand:', error);
  }
}

// ========== HELPER FUNCTIONS ==========

async function fetchImageAsBase64(imageUrl) {
  try {
    console.log('📥 Fetching image from URL...');
    
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'LightLister-AI/1.0' },
      signal: AbortSignal.timeout(15000)
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

async function analyzeWithGoogleVision(imageBase64) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey || apiKey === 'your_google_cloud_vision_api_key') {
    console.log('⚠️ Google Vision API key not configured');
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
              { type: 'TEXT_DETECTION', maxResults: 50 },
              { type: 'LABEL_DETECTION', maxResults: 30 },
              { type: 'LOGO_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 20 }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Vision API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.responses?.[0] || null;
    
  } catch (error) {
    console.error('❌ Google Vision error:', error.message);
    return null;
  }
}

async function extractFashionDetails(visionData, analysisId, userId) {
  const details = {
    allText: '',
    brands: [],
    sizes: [],
    itemTypes: [],
    colors: [],
    materials: [],
    features: [],
    garmentHints: []
  };
  
  if (!visionData) return details;
  
  if (visionData.textAnnotations?.length > 0) {
    details.allText = visionData.textAnnotations[0].description || '';
  }
  
  const textUpper = details.allText.toUpperCase();
  
  // Get brands from database
  const databaseBrands = await getDatabaseBrands();
  
  const coreBrands = [
    'CHILDISH', 'ZARA', 'H&M', 'NIKE', 'ADIDAS', 'NEXT', 'PRIMARK'
  ];
  
  const allBrands = [...new Set([...databaseBrands, ...coreBrands])];
  
  // Check for brands
  for (const brand of allBrands) {
    if (textUpper.includes(brand)) {
      details.brands.push(brand);
      await learnBrand(brand, 'text_extraction', analysisId, userId);
    }
  }
  
  // Logo detection
  if (visionData.logoAnnotations) {
    for (const logo of visionData.logoAnnotations) {
      const logoBrand = logo.description.toUpperCase();
      details.brands.push(logoBrand);
      await learnBrand(logoBrand, 'logo_detection', analysisId, userId);
    }
  }
  
  details.brands = [...new Set(details.brands)];
  
  // Size detection
  const sizePatterns = [
    /\b(XXS|XS|S|M|L|XL|XXL|XXXL)\b/,
    /SIZE[:\s]*([XXS|XS|S|M|L|XL|XXL])\b/i,
    /UK[:\s]*(\d{1,2})/i
  ];
  
  for (const pattern of sizePatterns) {
    const matches = textUpper.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      if (match[1]) details.sizes.push(match[1]);
    }
  }
  
  // Garment type detection
  const labels = visionData.labelAnnotations?.map(l => l.description.toLowerCase()) || [];
  const objects = visionData.localizedObjectAnnotations?.map(o => o.name.toLowerCase()) || [];
  const allDetections = [...labels, ...objects];
  
  const hasLongSleeves = allDetections.some(d => 
    d.includes('long sleeve') || 
    (d.includes('sleeve') && !d.includes('short'))
  );
  
  const hasRibbedCuffs = textUpper.includes('RIBBED') || textUpper.includes('CUFF');
  
  if (hasLongSleeves && hasRibbedCuffs) {
    details.itemTypes.push('Sweatshirt', 'Jumper');
    details.garmentHints.push('long sleeve with ribbed details');
  }
  
  // Colors
  const colors = ['Black', 'White', 'Grey', 'Navy', 'Blue', 'Red', 'Green'];
  for (const color of colors) {
    if (allDetections.some(d => d.toLowerCase().includes(color.toLowerCase())) ||
        textUpper.includes(color.toUpperCase())) {
      details.colors.push(color);
    }
  }
  
  // Materials
  const materials = ['Cotton', 'Polyester', 'Jersey', 'Fleece'];
  for (const material of materials) {
    if (textUpper.includes(material.toUpperCase()) ||
        allDetections.some(d => d.toLowerCase().includes(material.toLowerCase()))) {
      details.materials.push(material);
    }
  }
  
  return details;
}

// Enhanced Claude prompt with keyword learning
async function generateListingWithClaude(fashionDetails, visionData, learnedKeywords) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey || apiKey === 'your_anthropic_api_key') {
    console.error('❌ Claude API key not configured');
    throw new Error('AI service not configured');
  }
  
  try {
    console.log('🤖 Calling Claude API with learned keywords...');
    
    const visionContext = visionData ? {
      labels: visionData.labelAnnotations?.map(l => l.description) || [],
      objects: visionData.localizedObjectAnnotations?.map(o => o.name) || []
    } : null;
    
    const prompt = `You are an expert UK eBay fashion reseller. Create perfect listings using learned keyword patterns.

DETECTED INFORMATION:
- Text: "${fashionDetails.allText || 'None'}"
- Brands: ${fashionDetails.brands.join(', ') || 'None'}
- Sizes: ${fashionDetails.sizes.join(', ') || 'None'}
- Garment hints: ${fashionDetails.garmentHints.join(', ') || 'None'}
- Colors: ${fashionDetails.colors.join(', ') || 'Not specified'}
- Materials: ${fashionDetails.materials.join(', ') || 'Not specified'}
${visionContext ? `
- Visual labels: ${visionContext.labels.slice(0, 15).join(', ')}
- Objects: ${visionContext.objects.join(', ')}` : ''}

PROVEN HIGH-PERFORMING KEYWORDS FOR THIS TYPE:
${learnedKeywords.length > 0 ? learnedKeywords.join(', ') : 'vintage, vgc, uk, fast post, genuine'}

KEYWORD SELECTION RULES:
1. Prioritize the proven keywords above if they fit
2. Add condition keywords: BNWT, VGC, Excellent, Good
3. Add style keywords: Vintage, Y2K, Retro, Modern, Classic
4. Add occasion keywords: Casual, Smart, Work, Gym, Festival
5. Add trending keywords: Streetwear, Oversized, Sustainable
6. ALWAYS include: UK (we're UK sellers)

TITLE FORMAT (EXACTLY 80 CHARACTERS):
[Brand] [Gender] [Item] Size [Size] [Colour] [Material] [Keyword1] [Keyword2] UK

Return ONLY this JSON:
{
  "brand": "Exact brand or Unbranded",
  "item_type": "Specific item type",
  "size": "Exact size",
  "color": "UK spelling",
  "condition_score": 7,
  "condition_text": "Very Good Condition",
  "estimated_value_min": 10,
  "estimated_value_max": 25,
  "ebay_title": "EXACTLY 80 character title",
  "vinted_title": "Casual title under 50 chars",
  "description": "Detailed description",
  "suggested_price": 18,
  "category": "Category > Subcategory",
  "material": "Material",
  "style": "Style",
  "gender": "Gender",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}

IMPORTANT: The keywords array should contain 6-8 highly relevant, searchable eBay terms.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.2,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error('AI service temporarily unavailable');
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }
    
    const listing = JSON.parse(jsonMatch[0]);
    
    // Format title to exactly 80 chars
    listing.ebay_title = listing.ebay_title
      .replace(/[.,\-£$]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (listing.ebay_title.length > 80) {
      listing.ebay_title = listing.ebay_title.substring(0, 80).trim();
    } else if (listing.ebay_title.length < 80) {
      const padding = ['UK', 'Fast', 'Post'];
      while (listing.ebay_title.length < 80 && padding.length > 0) {
        const word = padding.shift();
        if (listing.ebay_title.length + word.length + 1 <= 80) {
          listing.ebay_title += ' ' + word;
        }
      }
    }
    
    return listing;
    
  } catch (error) {
    console.error('❌ Claude API error:', error.message);
    throw error;
  }
}

// ========== MAIN HANDLER ==========
export async function POST(request) {
  console.log('\n🚀 === ANALYSIS WITH KEYWORD LEARNING ===');
  
  try {
    // 1. Auth check
    let userId = 'temp-user-' + Date.now();
    try {
      const { userId: authUserId } = await auth();
      if (authUserId) userId = authUserId;
    } catch (authError) {
      console.log('⚠️ Auth bypassed');
    }
    
    // 2. Parse request
    const body = await request.json();
    const { 
      imageUrls = [], 
      imageCount = 1,
      correctedKeywords = null, // If user is correcting keywords
      originalAnalysisId = null // ID of analysis being corrected
    } = body;
    
    // Handle keyword correction learning
    if (correctedKeywords && originalAnalysisId) {
      const { itemType, brand, original, corrected } = correctedKeywords;
      await learnFromKeywordCorrection(
        originalAnalysisId,
        itemType,
        brand,
        original,
        corrected,
        userId
      );
      
      return NextResponse.json({
        success: true,
        message: 'Keywords learned successfully'
      });
    }
    
    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No images provided'
      }, { status: 400 });
    }
    
    const analysisId = `analysis-${Date.now()}`;
    
    // 3. AI Pipeline
    let finalListing = null;
    
    try {
      const imageBase64 = await fetchImageAsBase64(imageUrls[0]);
      const visionData = await analyzeWithGoogleVision(imageBase64);
      const fashionDetails = await extractFashionDetails(visionData, analysisId, userId);
      
      // Get learned keywords for this item type
      const itemType = fashionDetails.itemTypes[0] || 'clothing';
      const brand = fashionDetails.brands[0] || 'unbranded';
      const learnedKeywords = await getLearnedKeywords(itemType, brand, 'mens clothing');
      
      console.log(`🎯 Using learned keywords: ${learnedKeywords.join(', ')}`);
      
      finalListing = await generateListingWithClaude(fashionDetails, visionData, learnedKeywords);
      
      // Learn brands from final analysis
      if (finalListing.brand && finalListing.brand !== 'Unbranded') {
        await learnBrand(finalListing.brand, 'claude_analysis', analysisId, userId);
      }
      
      // Store initial keywords for learning
      if (finalListing.keywords && Array.isArray(finalListing.keywords)) {
        for (const keyword of finalListing.keywords) {
          const { data: existing } = await supabase
            .from('keyword_patterns')
            .select('*')
            .eq('keyword', keyword)
            .eq('item_type', finalListing.item_type)
            .single();
          
          if (!existing) {
            await supabase
              .from('keyword_patterns')
              .insert({
                keyword: keyword,
                item_type: finalListing.item_type,
                brand: finalListing.brand,
                confidence_score: 0.5,
                source: 'ai_generated'
              });
          }
        }
      }
      
    } catch (pipelineError) {
      console.error('❌ Pipeline error:', pipelineError.message);
      throw pipelineError;
    }
    
    // 4. Complete analysis
    const completeAnalysis = {
      ...finalListing,
      id: analysisId,
      sku: `${(finalListing.brand || 'UNB').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: imageCount,
      image_urls: imageUrls,
      credits_remaining: 49,
      analyzed_at: new Date().toISOString(),
      can_edit_keywords: true // Flag to show keyword edit UI
    };
    
    // 5. Save to database
    if (userId && !userId.startsWith('temp-')) {
      try {
        await supabase.from('analyses').insert({
          user_id: userId,
          brand: completeAnalysis.brand,
          item_type: completeAnalysis.item_type,
          size: completeAnalysis.size,
          color: completeAnalysis.color,
          condition_score: completeAnalysis.condition_score,
          ebay_title: completeAnalysis.ebay_title,
          keywords: completeAnalysis.keywords,
          suggested_price: completeAnalysis.suggested_price,
          category: completeAnalysis.category,
          sku: completeAnalysis.sku,
          metadata: completeAnalysis
        });
      } catch (dbError) {
        console.error('⚠️ Database save failed:', dbError.message);
      }
    }
    
    console.log('✅ Analysis complete with keyword learning!');
    console.log('Keywords:', completeAnalysis.keywords);
    
    return NextResponse.json({
      success: true,
      analysis: completeAnalysis
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Analysis failed. Please try again.'
    }, { status: 500 });
  }
}

// Endpoint to handle keyword corrections
export async function PATCH(request) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    
    const {
      analysisId,
      itemType,
      brand,
      originalKeywords,
      correctedKeywords
    } = body;
    
    await learnFromKeywordCorrection(
      analysisId,
      itemType,
      brand,
      originalKeywords,
      correctedKeywords,
      userId || 'anonymous'
    );
    
    return NextResponse.json({
      success: true,
      message: 'Keywords updated and learned'
    });
    
  } catch (error) {
    console.error('Error in keyword correction:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update keywords'
    }, { status: 500 });
  }
}

// Health check
export async function GET() {
  let brandCount = 0;
  let keywordCount = 0;
  
  try {
    const { count: brands } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });
    brandCount = brands || 0;
    
    const { count: keywords } = await supabase
      .from('keyword_patterns')
      .select('*', { count: 'exact', head: true });
    keywordCount = keywords || 0;
  } catch (error) {
    console.error('Error counting:', error);
  }
  
  return NextResponse.json({
    status: 'ok',
    message: 'LightLister AI v3.0 - With Brand & Keyword Learning',
    learning: {
      brandsInDatabase: brandCount,
      keywordsInDatabase: keywordCount
    },
    apis: {
      googleVision: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    },
    timestamp: new Date().toISOString()
  });
}