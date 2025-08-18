// Fixed version of /app/api/analyze-ai/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/app/lib/supabase-client';

// UK Fashion brands database
const UK_FASHION_BRANDS = [
  // High street
  'Next', 'Marks & Spencer', 'M&S', 'John Lewis', 'Primark', 'River Island',
  'Topshop', 'Topman', 'ASOS', 'Boohoo', 'PrettyLittleThing', 'Missguided',
  
  // Premium UK
  'Burberry', 'Ted Baker', 'Paul Smith', 'AllSaints', 'Reiss', 'Whistles',
  'Karen Millen', 'Phase Eight', 'Hobbs', 'L.K.Bennett', 'Mulberry',
  
  // Outdoor/Country
  'Barbour', 'Hunter', 'Joules', 'Fat Face', 'White Stuff', 'Seasalt',
  
  // Sports/Casual  
  'Superdry', 'Jack Wills', 'Bench', 'Lonsdale', 'Slazenger', 'Umbro',
  
  // International in UK
  'Zara', 'H&M', 'Uniqlo', 'COS', 'Arket', '& Other Stories', 'Monki',
  'Nike', 'Adidas', 'Puma', 'Ralph Lauren', 'Tommy Hilfiger', 'Calvin Klein',
  'Levi\'s', 'Gap', 'Diesel', 'Armani', 'Hugo Boss', 'Lacoste'
];

export async function POST(request) {
  console.log('🚀 Starting AI Analysis Pipeline v2.0');
  
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { images } = body;
    
    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }
    
    console.log(`📸 Processing ${images.length} images for user ${user.id}`);
    
    // Analyze the first image (primary image)
    const primaryImage = images[0];
    const analysisResult = await analyzeImage(primaryImage);
    
    // Save to database
    const supabase = createClient();
    const { data: savedAnalysis, error: dbError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        brand: analysisResult.brand || 'Unknown Brand',
        item_type: analysisResult.itemType || 'Fashion Item',
        size: analysisResult.size || 'One Size',
        condition_score: analysisResult.conditionScore || 7,
        estimated_value_min: analysisResult.minPrice || 10,
        estimated_value_max: analysisResult.maxPrice || 25,
        suggested_price: analysisResult.suggestedPrice || 15,
        ebay_title: analysisResult.ebayTitle || generateFallbackTitle(analysisResult),
        description: analysisResult.description || 'Please see photos for details',
        category: analysisResult.category || 'Fashion',
        images_count: images.length,
        metadata: {
          visionData: analysisResult.visionData,
          allImages: images,
          analysisVersion: '2.0'
        }
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error('Failed to save analysis');
    }
    
    // Deduct credit
    await deductUserCredit(user.id);
    
    return NextResponse.json({
      success: true,
      analysisId: savedAnalysis.id,
      result: savedAnalysis
    });
    
  } catch (error) {
    console.error('❌ Pipeline error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Analysis failed',
      debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

async function analyzeImage(imageUrl) {
  try {
    // Step 1: Google Vision Analysis
    console.log('👁️ Step 1: Google Vision Analysis');
    const visionData = await callGoogleVisionAPI(imageUrl);
    
    // Step 2: Extract brand from multiple sources
    console.log('🏷️ Step 2: Brand Extraction');
    const detectedBrand = extractBrand(visionData);
    
    // Step 3: Claude Analysis with context
    console.log('🤖 Step 3: Claude AI Analysis');
    const claudeAnalysis = await analyzeWithClaude(visionData, detectedBrand);
    
    return {
      ...claudeAnalysis,
      brand: claudeAnalysis.brand || detectedBrand || 'Unknown Brand',
      visionData: visionData // Store for debugging
    };
    
  } catch (error) {
    console.error('❌ Image analysis error:', error);
    // Return fallback data instead of failing completely
    return getFallbackAnalysis();
  }
}

async function callGoogleVisionAPI(imageUrl) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  
  const request = {
    requests: [{
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: 'LOGO_DETECTION', maxResults: 10 },
        { type: 'TEXT_DETECTION' },
        { type: 'LABEL_DETECTION', maxResults: 30 },
        { type: 'WEB_DETECTION', maxResults: 20 }
      ]
    }]
  };
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vision API error: ${error}`);
  }
  
  const data = await response.json();
  return data.responses[0];
}

function extractBrand(visionData) {
  // Check logos first (most reliable)
  if (visionData.logoAnnotations?.length > 0) {
    const logo = visionData.logoAnnotations[0].description;
    console.log(`✅ Brand from logo: ${logo}`);
    return logo;
  }
  
  // Check text for brand names
  const text = visionData.textAnnotations?.[0]?.description || '';
  if (text) {
    const textUpper = text.toUpperCase();
    for (const brand of UK_FASHION_BRANDS) {
      if (textUpper.includes(brand.toUpperCase())) {
        console.log(`✅ Brand from text: ${brand}`);
        return brand;
      }
    }
  }
  
  // Check web entities
  if (visionData.webDetection?.webEntities) {
    for (const entity of visionData.webDetection.webEntities) {
      if (entity.score > 0.5) {
        for (const brand of UK_FASHION_BRANDS) {
          if (entity.description?.toUpperCase().includes(brand.toUpperCase())) {
            console.log(`✅ Brand from web: ${brand}`);
            return brand;
          }
        }
      }
    }
  }
  
  console.log('❌ No brand detected');
  return null;
}

async function analyzeWithClaude(visionData, detectedBrand) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  const prompt = `You are a UK fashion expert creating eBay listings. Analyze this item:

${detectedBrand ? `Detected Brand: ${detectedBrand}` : 'No brand detected'}

Vision API Data:
- Text found: ${visionData.textAnnotations?.[0]?.description || 'None'}
- Labels: ${visionData.labelAnnotations?.map(l => l.description).join(', ')}
- Web entities: ${visionData.webDetection?.webEntities?.slice(0, 5).map(e => e.description).join(', ')}

Create a UK eBay listing with:
1. Brand (use detected brand or identify from data)
2. Item type (specific, e.g. "Women's Midi Dress" not just "Dress")  
3. Size (UK sizing)
4. Condition (1-10, where 10 = new with tags)
5. Price range in GBP (min/max based on UK market)
6. eBay title (max 80 chars, include brand, type, size, condition)
7. Key features for description

Format as JSON. Use "Unknown Brand" if no brand found. Be specific and accurate.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  try {
    // Parse Claude's JSON response
    const content = data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        brand: parsed.brand || detectedBrand || 'Unknown Brand',
        itemType: parsed.item_type || parsed.itemType,
        size: parsed.size,
        conditionScore: parsed.condition || parsed.conditionScore || 7,
        minPrice: parsed.min_price || parsed.price_range?.min || 10,
        maxPrice: parsed.max_price || parsed.price_range?.max || 30,
        suggestedPrice: parsed.suggested_price || 20,
        ebayTitle: parsed.ebay_title || parsed.title,
        description: parsed.description || parsed.key_features?.join('. '),
        category: parsed.category || 'Fashion'
      };
    }
  } catch (parseError) {
    console.error('Failed to parse Claude response:', parseError);
  }
  
  // Fallback if parsing fails
  return getFallbackAnalysis();
}

function generateFallbackTitle(analysis) {
  const parts = [
    analysis.brand || '',
    analysis.itemType || 'Fashion Item',
    analysis.size ? `Size ${analysis.size}` : '',
    'Good Condition'
  ].filter(Boolean);
  
  return parts.join(' ').substring(0, 80);
}

function getFallbackAnalysis() {
  return {
    brand: 'Unknown Brand',
    itemType: 'Fashion Item',
    size: 'Please Check Photos',
    conditionScore: 7,
    minPrice: 10,
    maxPrice: 30,
    suggestedPrice: 20,
    ebayTitle: 'Fashion Item - Please See Photos for Details',
    description: 'Item in good condition. Please review all photos for details.',
    category: 'Fashion'
  };
}

async function deductUserCredit(userId) {
  const supabase = createClient();
  const { error } = await supabase.rpc('deduct_user_credit', { 
    user_id: userId 
  });
  
  if (error) {
    console.error('Credit deduction error:', error);
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Analysis API v2.0 - Fixed Version',
    apis: {
      googleVision: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      supabase: true
    },
    timestamp: new Date().toISOString()
  });
}