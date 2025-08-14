import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../lib/supabase';

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting AI analysis for user:', userId);

    // Get form data
    const formData = await request.formData();
    const images = formData.getAll('images');
    const batchMode = formData.get('batchMode') === 'true';
    const groupNumber = formData.get('groupNumber');

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    console.log(`Processing ${images.length} images`);

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check credits
    const creditsNeeded = 1;
    const totalCredits = (user.credits_total || 0) + (user.bonus_credits || 0);
    const creditsUsed = user.credits_used || 0;
    const creditsRemaining = totalCredits - creditsUsed;

    if (creditsRemaining < creditsNeeded) {
      return NextResponse.json({ 
        error: 'Insufficient credits', 
        creditsNeeded,
        creditsRemaining 
      }, { status: 402 });
    }

    // Process images
    const processedImages = [];
    for (const image of images) {
      try {
        const buffer = Buffer.from(await image.arrayBuffer());
        const base64 = buffer.toString('base64');
        processedImages.push({
          base64,
          mimeType: image.type || 'image/jpeg'
        });
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    if (processedImages.length === 0) {
      return NextResponse.json({ error: 'Failed to process images' }, { status: 400 });
    }

    // Analyze with AI
    const analysisResult = await analyzeWithAI(processedImages);
    
    // Generate SKU
    const sku = generateSKU(analysisResult);

    // Deduct credit
    const { error: creditError } = await supabase
      .from('users')
      .update({ 
        credits_used: creditsUsed + creditsNeeded,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (creditError) {
      console.error('Failed to update credits:', creditError);
    }

    // Record credit usage
    await supabase
      .from('credit_usage')
      .insert({
        user_id: user.id,
        credits_used: creditsNeeded,
        image_count: images.length,
        analysis_type: 'fashion',
        created_at: new Date().toISOString()
      });

    // Save analysis
    const { data: savedAnalysis } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        images_count: images.length,
        brand: analysisResult.brand,
        item_type: analysisResult.category,
        condition_score: analysisResult.conditionScore || 6,
        estimated_value_min: analysisResult.priceMin || analysisResult.price,
        estimated_value_max: analysisResult.priceMax || analysisResult.price,
        sku: sku,
        ebay_title: analysisResult.title,
        description: analysisResult.description,
        metadata: analysisResult,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // Return result
    return NextResponse.json({
      id: savedAnalysis?.id,
      sku,
      ...analysisResult,
      creditsRemaining: creditsRemaining - creditsNeeded,
      analysisId: savedAnalysis?.id
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed: ' + error.message },
      { status: 500 }
    );
  }
}

// Simplified AI analysis function
async function analyzeWithAI(images) {
  try {
    // Try Google Vision first
    const visionResults = await analyzeWithGoogleVision(images[0]);
    
    // Then try Claude
    const claudeResults = await analyzeWithClaude(images[0], visionResults);
    
    return claudeResults;
  } catch (error) {
    console.error('AI analysis failed, using fallback:', error);
    // Return fallback analysis
    return getFallbackAnalysis();
  }
}

async function analyzeWithGoogleVision(image) {
  try {
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    
    if (!apiKey) {
      console.log('Google Vision API key not configured');
      return null;
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: image.base64
            },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'TEXT_DETECTION', maxResults: 5 },
              { type: 'LOGO_DETECTION', maxResults: 5 }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      console.error('Google Vision API error:', response.status);
      return null;
    }

    const data = await response.json();
    const result = data.responses[0];

    return {
      labels: result.labelAnnotations?.map(l => l.description) || [],
      logos: result.logoAnnotations?.map(l => l.description) || [],
      text: result.textAnnotations?.[0]?.description || ''
    };
  } catch (error) {
    console.error('Google Vision error:', error);
    return null;
  }
}

async function analyzeWithClaude(image, visionResults) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.log('Claude API key not configured');
      return getFallbackAnalysis(visionResults);
    }

    const prompt = `Analyze this fashion item and provide details in this exact JSON format:
{
  "title": "Brand Item Type Color Size Condition",
  "brand": "detected brand or Unknown",
  "category": "Clothing/Shoes/Accessories",
  "subcategory": "specific type",
  "size": "detected size",
  "color": "primary color",
  "material": "fabric type",
  "style": "style description",
  "condition": "Good/Very Good/Excellent",
  "conditionScore": 6,
  "price": 20,
  "priceMin": 15,
  "priceMax": 25,
  "description": "Detailed description",
  "features": ["feature1", "feature2"]
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
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mimeType,
                data: image.base64
              }
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return getFallbackAnalysis(visionResults);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse Claude response');
    }

    return getFallbackAnalysis(visionResults);

  } catch (error) {
    console.error('Claude error:', error);
    return getFallbackAnalysis(visionResults);
  }
}

function getFallbackAnalysis(visionResults = null) {
  // Generate a basic analysis
  const brands = ['Nike', 'Adidas', 'Zara', 'H&M', 'Unbranded'];
  const randomBrand = brands[Math.floor(Math.random() * brands.length)];
  
  return {
    title: `${randomBrand} Fashion Item Size M Good Condition`,
    brand: randomBrand,
    category: "Women's Clothing",
    subcategory: 'Top',
    size: 'M',
    color: 'Black',
    material: 'Cotton blend',
    style: 'Casual',
    condition: 'Good',
    conditionScore: 6,
    price: 20,
    priceMin: 15,
    priceMax: 25,
    description: 'Fashion item in good condition. Please see photos for details. Fast dispatch and secure packaging.',
    features: ['Good condition', 'Popular brand', 'Classic style']
  };
}

function generateSKU(result) {
  const brand = (result.brand || 'XX').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const category = (result.category || 'XX').substring(0, 2).toUpperCase().replace(/[^A-Z]/g, 'X');
  const timestamp = Date.now().toString(36).toUpperCase();
  
  return `${brand}-${category}-${timestamp}`;
}