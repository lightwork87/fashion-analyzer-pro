// app/api/analyze-ai/route.js
// COMPLETE WORKING AI ANALYSIS WITH REAL IMAGE DETECTION

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Helper to clean text
function cleanText(text) {
  return text?.replace(/[\n\r]+/g, ' ').trim() || '';
}

// Fetch image from URL and convert to base64
async function fetchImageAsBase64(imageUrl) {
  try {
    console.log('Fetching image from:', imageUrl);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    console.log('Image converted to base64, size:', Math.round(base64.length / 1024), 'KB');
    
    return base64;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

// Call Google Vision API
async function analyzeWithGoogleVision(imageBase64) {
  try {
    console.log('Calling Google Vision API...');
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
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
              { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
              { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Vision API error:', error);
      return null;
    }

    const data = await response.json();
    const result = data.responses?.[0];
    
    if (result) {
      console.log('Vision API detected:', {
        text: result.textAnnotations?.length || 0,
        labels: result.labelAnnotations?.length || 0,
        logos: result.logoAnnotations?.length || 0,
        objects: result.localizedObjectAnnotations?.length || 0
      });
    }
    
    return result || null;
  } catch (error) {
    console.error('Google Vision error:', error);
    return null;
  }
}

// Extract fashion-specific information from Vision API results
function extractFashionInfo(visionData) {
  const info = {
    detectedText: '',
    brands: [],
    sizes: [],
    colors: [],
    materials: [],
    itemTypes: [],
    labels: [],
    objects: []
  };

  // Extract all text
  if (visionData?.textAnnotations?.length > 0) {
    info.detectedText = cleanText(visionData.textAnnotations[0].description);
  }

  // Extract logos/brands
  if (visionData?.logoAnnotations) {
    info.brands = visionData.logoAnnotations.map(logo => logo.description);
  }

  // Extract labels
  if (visionData?.labelAnnotations) {
    info.labels = visionData.labelAnnotations
      .filter(label => label.score > 0.7)
      .map(label => label.description);
  }

  // Extract objects
  if (visionData?.localizedObjectAnnotations) {
    info.objects = visionData.localizedObjectAnnotations
      .filter(obj => obj.score > 0.7)
      .map(obj => obj.name);
  }

  // Parse text for specific information
  const textUpper = info.detectedText.toUpperCase();
  
  // Common UK sizes
  const sizePatterns = [
    /SIZE[\s:]*([XXS|XS|S|M|L|XL|XXL|XXXL])\b/i,
    /SIZE[\s:]*(\d{1,2})\b/,
    /UK[\s:]*(\d{1,2})/,
    /EUR[\s:]*(\d{2,3})/,
    /(\d{1,2})[\s]*UK/
  ];
  
  for (const pattern of sizePatterns) {
    const match = textUpper.match(pattern);
    if (match) {
      info.sizes.push(match[1]);
    }
  }

  // Common fashion brands
  const brandKeywords = ['NIKE', 'ADIDAS', 'ZARA', 'H&M', 'UNIQLO', 'GAP', 'NEXT', 'PRIMARK', 
                        'TOPSHOP', 'ASOS', 'BOOHOO', 'MARKS & SPENCER', 'M&S', 'JOHN LEWIS',
                        'TED BAKER', 'BURBERRY', 'RALPH LAUREN', 'TOMMY HILFIGER', 'COS',
                        'MANGO', 'RIVER ISLAND', 'NEW LOOK', 'MISSGUIDED'];
  
  for (const brand of brandKeywords) {
    if (textUpper.includes(brand)) {
      info.brands.push(brand);
    }
  }

  // Extract colors from labels
  const colorKeywords = ['Black', 'White', 'Navy', 'Blue', 'Red', 'Green', 'Grey', 'Gray', 
                        'Brown', 'Beige', 'Pink', 'Purple', 'Yellow', 'Orange'];
  
  info.colors = info.labels.filter(label => 
    colorKeywords.some(color => label.toLowerCase().includes(color.toLowerCase()))
  );

  // Extract materials
  const materialKeywords = ['Cotton', 'Polyester', 'Wool', 'Leather', 'Denim', 'Silk', 
                           'Linen', 'Viscose', 'Nylon', 'Cashmere'];
  
  info.materials = info.labels.filter(label =>
    materialKeywords.some(material => label.toLowerCase().includes(material.toLowerCase()))
  );

  return info;
}

// Generate listing with Claude
async function generateListingWithClaude(fashionInfo, imageCount) {
  try {
    console.log('Calling Claude API with fashion info:', fashionInfo);

    const prompt = `You are an expert UK eBay fashion reseller. Create a perfect listing based on this information:

DETECTED INFORMATION:
- Text found on labels/tags: ${fashionInfo.detectedText}
- Detected brands: ${fashionInfo.brands.join(', ') || 'None detected'}
- Detected sizes: ${fashionInfo.sizes.join(', ') || 'None detected'}
- Visual labels: ${fashionInfo.labels.join(', ')}
- Objects detected: ${fashionInfo.objects.join(', ')}
- Colors detected: ${fashionInfo.colors.join(', ') || 'Not specified'}
- Materials detected: ${fashionInfo.materials.join(', ') || 'Not specified'}
- Number of photos: ${imageCount}

REQUIREMENTS:
1. Create a perfect eBay UK title (max 80 chars) following this format:
   [Brand] [Gender] [Item Type] [Key Feature] Size [Size] [Condition]
   
2. If no brand detected, check the labels and text carefully - look for any brand names
3. Price in GBP (£) appropriate for UK market
4. Use UK spelling (colour not color, etc.)
5. Condition score 1-10 (10 = new with tags, 7-8 = excellent used, 5-6 = good used)

Return ONLY a valid JSON object with these fields:
{
  "brand": "exact brand name (no punctuation)",
  "item_type": "specific item type",
  "size": "UK size",
  "color": "main colour",
  "condition_score": 7,
  "estimated_value_min": 15,
  "estimated_value_max": 35,
  "ebay_title": "Perfect eBay UK title under 80 chars",
  "description": "Detailed eBay description with bullet points",
  "suggested_price": 25,
  "category": "eBay UK category",
  "material": "detected material",
  "style": "style description",
  "gender": "Men's/Women's/Unisex/Kids",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
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

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    console.log('Claude response:', content);
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Parsed Claude response:', parsed);
        return parsed;
      } catch (e) {
        console.error('Failed to parse Claude JSON:', e);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Claude API error:', error);
    return null;
  }
}

// Main API handler
export async function POST(request) {
  console.log('🎯 AI Analysis API called');
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrls = [], imageCount } = body;
    
    // Handle both imageUrls and imageCount
    const numImages = imageUrls.length || imageCount || 1;
    
    console.log(`📸 Processing ${numImages} images for user ${userId}`);

    // Check user credits
    let { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      // Create user with free credits
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: `user-${userId}@example.com`,
          credits_total: 50,
          credits_used: 0,
          bonus_credits: 0,
          subscription_status: 'trial'
        })
        .select()
        .single();
      
      userData = newUser || { credits_total: 50, credits_used: 0 };
    }

    const creditsAvailable = (userData?.credits_total || 0) 
      - (userData?.credits_used || 0) 
      + (userData?.bonus_credits || 0);

    if (creditsAvailable <= 0) {
      return NextResponse.json({ 
        error: 'No credits available',
        credits_remaining: 0 
      }, { status: 402 });
    }

    // Analyze images with AI
    let analysis = null;
    let fashionInfo = null;
    
    if (imageUrls && imageUrls.length > 0) {
      // Use the first image for primary analysis
      const primaryImageUrl = imageUrls[0];
      console.log('🔍 Analyzing primary image:', primaryImageUrl);
      
      // Fetch and convert image
      const imageBase64 = await fetchImageAsBase64(primaryImageUrl);
      
      if (imageBase64) {
        // Call Google Vision
        const visionData = await analyzeWithGoogleVision(imageBase64);
        
        if (visionData) {
          // Extract fashion information
          fashionInfo = extractFashionInfo(visionData);
          console.log('📊 Extracted fashion info:', fashionInfo);
          
          // Generate listing with Claude
          analysis = await generateListingWithClaude(fashionInfo, numImages);
        }
      }
    }

    // If AI analysis failed, use smart fallback
    if (!analysis) {
      console.log('⚠️ AI analysis failed, using smart fallback');
      
      analysis = {
        brand: fashionInfo?.brands[0] || 'Unbranded',
        item_type: fashionInfo?.objects[0] || 'Clothing Item',
        size: fashionInfo?.sizes[0] || 'Please Check Label',
        color: fashionInfo?.colors[0] || 'Multi',
        condition_score: 7,
        estimated_value_min: 10,
        estimated_value_max: 30,
        ebay_title: 'Fashion Item - Please Check Photos for Details',
        description: `Item as shown in photos.

- Brand: ${fashionInfo?.brands[0] || 'See photos'}
- Size: ${fashionInfo?.sizes[0] || 'Please check label'}
- Condition: Good pre-owned condition

Please review all photos carefully for item details, measurements, and condition.

Ships within 1 business day via Royal Mail.`,
        suggested_price: 20,
        category: 'Clothes, Shoes & Accessories',
        material: fashionInfo?.materials[0] || 'See label',
        style: 'Fashion',
        gender: 'Unisex',
        keywords: ['fashion', 'clothing', 'uk']
      };
    }

    // Create complete analysis
    const completeAnalysis = {
      ...analysis,
      id: `analysis-${Date.now()}`,
      sku: `${(analysis.brand || 'UNB').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: numImages,
      image_urls: imageUrls,
      credits_remaining: creditsAvailable - 1,
      analyzed_at: new Date().toISOString(),
      vision_data: fashionInfo // Include raw vision data for debugging
    };

    // Save to database
    try {
      await supabase.from('analyses').insert({
        user_id: userId,
        brand: completeAnalysis.brand,
        item_type: completeAnalysis.item_type,
        size: completeAnalysis.size,
        condition_score: completeAnalysis.condition_score,
        estimated_value_min: completeAnalysis.estimated_value_min,
        estimated_value_max: completeAnalysis.estimated_value_max,
        ebay_title: completeAnalysis.ebay_title,
        description: completeAnalysis.description,
        suggested_price: completeAnalysis.suggested_price,
        category: completeAnalysis.category,
        sku: completeAnalysis.sku,
        images_count: completeAnalysis.images_count,
        metadata: {
          color: completeAnalysis.color,
          material: completeAnalysis.material,
          style: completeAnalysis.style,
          keywords: completeAnalysis.keywords,
          gender: completeAnalysis.gender,
          image_urls: completeAnalysis.image_urls,
          vision_data: fashionInfo
        }
      });

      // Update credits
      await supabase
        .from('users')
        .update({ credits_used: (userData?.credits_used || 0) + 1 })
        .eq('clerk_id', userId);
        
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    console.log('✅ Analysis complete:', completeAnalysis.ebay_title);

    return NextResponse.json({
      success: true,
      analysis: completeAnalysis
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Analysis failed',
      message: error.message
    }, { status: 500 });
  }
}

// Health check
export async function GET() {
  const hasGoogleKey = !!process.env.GOOGLE_CLOUD_VISION_API_KEY;
  const hasClaudeKey = !!process.env.ANTHROPIC_API_KEY;
  
  return NextResponse.json({
    status: 'ok',
    message: 'AI Analysis API v3.0 - UK Edition',
    timestamp: new Date().toISOString(),
    apis: {
      googleVision: hasGoogleKey ? 'configured' : 'missing',
      claude: hasClaudeKey ? 'configured' : 'missing'
    }
  });
}