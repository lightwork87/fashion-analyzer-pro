// app/api/analyze-ai/route.js

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize AI clients
const initializeAIClients = () => {
  return {
    anthropic: process.env.ANTHROPIC_API_KEY ? {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: 'https://api.anthropic.com'
    } : null,
    googleVision: process.env.GOOGLE_CLOUD_VISION_API_KEY ? {
      apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY,
      baseURL: 'https://vision.googleapis.com/v1'
    } : null
  };
};

// Fallback templates for when AI fails
const fallbackTemplates = {
  default: {
    brand: 'Unknown Brand',
    item_type: 'Clothing Item',
    size: 'Please specify',
    condition_score: 7,
    estimated_value_min: 10,
    estimated_value_max: 30,
    ebay_title: 'Vintage Clothing Item - Please Update Details',
    description: 'Item is in good pre-owned condition. Please update this description with specific details about the item including measurements, material, and any flaws.',
    suggested_price: 20,
    category: 'Clothing, Shoes & Accessories'
  },
  shirt: {
    brand: 'Unknown Brand',
    item_type: 'Shirt',
    size: 'Medium',
    condition_score: 7,
    estimated_value_min: 15,
    estimated_value_max: 40,
    ebay_title: 'Vintage Shirt - Size Medium - Good Condition',
    description: 'Pre-owned shirt in good condition. Please add specific details about brand, material, measurements, and any wear.',
    suggested_price: 25,
    category: 'Clothing, Shoes & Accessories > Men\'s Clothing > Shirts'
  },
  dress: {
    brand: 'Unknown Brand',
    item_type: 'Dress',
    size: 'Medium',
    condition_score: 7,
    estimated_value_min: 20,
    estimated_value_max: 60,
    ebay_title: 'Vintage Dress - Size Medium - Good Condition',
    description: 'Pre-owned dress in good condition. Please add specific details about brand, material, measurements, and any wear.',
    suggested_price: 35,
    category: 'Clothing, Shoes & Accessories > Women\'s Clothing > Dresses'
  }
};

// Process images with Google Vision API
async function analyzeWithGoogleVision(imageData, apiKey) {
  try {
    const requests = imageData.map(image => ({
      image: { content: image.split(',')[1] }, // Remove data:image/jpeg;base64, prefix
      features: [
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'TEXT_DETECTION', maxResults: 10 },
        { type: 'LOGO_DETECTION', maxResults: 5 }
      ]
    }));

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests })
      }
    );

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.status}`);
    }

    const data = await response.json();
    return data.responses;
  } catch (error) {
    console.error('Google Vision API error:', error);
    return null;
  }
}

// Process with Claude AI
async function analyzeWithClaude(visionResults, imageCount, apiKey) {
  try {
    const prompt = `You are an expert fashion reseller. Based on these Google Vision API results, provide a detailed analysis for an eBay listing:

Vision Results: ${JSON.stringify(visionResults)}
Number of images: ${imageCount}

Please provide a JSON response with:
{
  "brand": "detected brand or Unknown",
  "item_type": "specific item type",
  "size": "detected size or To Be Confirmed",
  "condition_score": number 1-10,
  "estimated_value_min": number,
  "estimated_value_max": number,
  "ebay_title": "SEO optimized title under 80 chars",
  "description": "detailed description for eBay",
  "suggested_price": number,
  "category": "eBay category path"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not parse Claude response');
  } catch (error) {
    console.error('Claude API error:', error);
    return null;
  }
}

// Main analysis function with fallbacks
async function performAnalysis(images) {
  const aiClients = initializeAIClients();
  let analysisResult = null;

  // Try Google Vision first
  if (aiClients.googleVision) {
    console.log('Attempting Google Vision analysis...');
    const visionResults = await analyzeWithGoogleVision(images, aiClients.googleVision.apiKey);
    
    if (visionResults && aiClients.anthropic) {
      console.log('Attempting Claude analysis...');
      analysisResult = await analyzeWithClaude(visionResults, images.length, aiClients.anthropic.apiKey);
    } else if (visionResults) {
      // Parse Google Vision results directly if Claude is unavailable
      analysisResult = parseGoogleVisionResults(visionResults);
    }
  }

  // If AI analysis failed, use intelligent fallback
  if (!analysisResult) {
    console.log('Using fallback template...');
    analysisResult = selectFallbackTemplate(images);
  }

  // Generate SKU
  analysisResult.sku = generateSKU(analysisResult);
  
  return analysisResult;
}

// Parse Google Vision results when Claude is unavailable
function parseGoogleVisionResults(visionResults) {
  const labels = [];
  const texts = [];
  const logos = [];

  visionResults.forEach(result => {
    if (result.labelAnnotations) {
      labels.push(...result.labelAnnotations.map(l => l.description.toLowerCase()));
    }
    if (result.textAnnotations && result.textAnnotations[0]) {
      texts.push(result.textAnnotations[0].description);
    }
    if (result.logoAnnotations) {
      logos.push(...result.logoAnnotations.map(l => l.description));
    }
  });

  // Detect item type from labels
  let item_type = 'Clothing Item';
  const itemTypes = {
    shirt: ['shirt', 't-shirt', 'blouse', 'top'],
    dress: ['dress', 'gown'],
    pants: ['pants', 'jeans', 'trousers'],
    jacket: ['jacket', 'coat', 'blazer'],
    shoes: ['shoes', 'sneakers', 'boots']
  };

  for (const [type, keywords] of Object.entries(itemTypes)) {
    if (keywords.some(keyword => labels.includes(keyword))) {
      item_type = type.charAt(0).toUpperCase() + type.slice(1);
      break;
    }
  }

  // Detect brand from logos or text
  const brand = logos[0] || detectBrandFromText(texts.join(' ')) || 'Unknown Brand';

  return {
    brand,
    item_type,
    size: detectSizeFromText(texts.join(' ')) || 'Please specify',
    condition_score: 7,
    estimated_value_min: 15,
    estimated_value_max: 50,
    ebay_title: `${brand} ${item_type} - Good Condition`,
    description: `Pre-owned ${brand.toLowerCase()} ${item_type.toLowerCase()} in good condition. ${texts.join(' ').substring(0, 200)}`,
    suggested_price: 30,
    category: 'Clothing, Shoes & Accessories'
  };
}

// Detect brand from text
function detectBrandFromText(text) {
  const commonBrands = [
    'Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour',
    'Zara', 'H&M', 'Gap', 'Levis', 'Tommy Hilfiger',
    'Ralph Lauren', 'Calvin Klein', 'Gucci', 'Prada', 'Versace'
  ];
  
  const upperText = text.toUpperCase();
  for (const brand of commonBrands) {
    if (upperText.includes(brand.toUpperCase())) {
      return brand;
    }
  }
  return null;
}

// Detect size from text
function detectSizeFromText(text) {
  const sizePatterns = [
    /size[:\s]*(xs|s|m|l|xl|xxl|xxxl)/i,
    /\b(xs|s|m|l|xl|xxl|xxxl)\b/i,
    /size[:\s]*(\d+)/i,
    /\b(\d+)\s*(inches|in|cm)\b/i
  ];
  
  for (const pattern of sizePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  return null;
}

// Select appropriate fallback template
function selectFallbackTemplate(images) {
  // For now, return default template
  // In future, could analyze image dimensions or other metadata
  return { ...fallbackTemplates.default };
}

// Generate SKU
function generateSKU(analysis) {
  const brandPrefix = analysis.brand.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const typePrefix = analysis.item_type.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${brandPrefix}${typePrefix}${randomNum}`;
}

// Main API route handler
export async function POST(request) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    console.log(`Processing ${images.length} images for user ${userId}`);

    // Get user data and check credits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      console.error('User lookup error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate available credits
    const totalCredits = (userData.credits_total || 0) + (userData.bonus_credits || 0);
    const availableCredits = totalCredits - (userData.credits_used || 0);

    if (availableCredits < 1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Perform analysis with fallbacks
    const analysisResult = await performAnalysis(images);

    // Save analysis to database
    const analysisId = uuidv4();
    const { error: insertError } = await supabase
      .from('analyses')
      .insert({
        id: analysisId,
        user_id: userData.id,
        images_count: images.length,
        brand: analysisResult.brand,
        item_type: analysisResult.item_type,
        condition_score: analysisResult.condition_score,
        estimated_value_min: analysisResult.estimated_value_min,
        estimated_value_max: analysisResult.estimated_value_max,
        sku: analysisResult.sku,
        ebay_title: analysisResult.ebay_title,
        description: analysisResult.description,
        metadata: {
          size: analysisResult.size,
          category: analysisResult.category,
          suggested_price: analysisResult.suggested_price,
          analysis_method: analysisResult.brand === 'Unknown Brand' ? 'fallback' : 'ai'
        }
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Continue anyway - we have the analysis result
    }

    // Update user credits
    const { error: creditError } = await supabase
      .from('users')
      .update({ credits_used: (userData.credits_used || 0) + 1 })
      .eq('clerk_id', userId);

    if (creditError) {
      console.error('Credit update error:', creditError);
    }

    // Record credit usage
    await supabase.from('credit_usage').insert({
      user_id: userData.id,
      credits_used: 1,
      action: 'analysis',
      analysis_id: analysisId
    });

    // Return successful response
    return NextResponse.json({
      success: true,
      analysis: {
        id: analysisId,
        ...analysisResult,
        images_count: images.length,
        credits_remaining: availableCredits - 1
      }
    });

  } catch (error) {
    console.error('Analysis API error:', error);
    
    // Return a user-friendly error
    return NextResponse.json({
      error: 'Failed to analyze images. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}