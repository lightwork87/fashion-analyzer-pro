// app/api/analyze-single/route.js - COMPLETE FIXED FILE FOR VERCEL
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// ✅ FIXED: Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to convert image to base64
async function imageToBase64(file) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

// Helper function to analyze with Google Vision API
async function analyzeWithGoogleVision(base64Image) {
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: base64Image
            },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 10 },
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'LOGO_DETECTION', maxResults: 5 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Google Vision API request failed');
    }

    const data = await response.json();
    return data.responses[0];
  } catch (error) {
    console.error('Google Vision API error:', error);
    return null;
  }
}

// Helper function to analyze with Claude AI
async function analyzeWithClaude(images, visionData) {
  try {
    const imageContents = await Promise.all(
      images.map(async (image) => {
        const base64 = await imageToBase64(image);
        return {
          type: "image",
          source: {
            type: "base64",
            media_type: image.type || "image/jpeg",
            data: base64
          }
        };
      })
    );

    const visionContext = visionData ? `
      Google Vision detected:
      - Text/Labels: ${visionData.textAnnotations?.map(t => t.description).join(', ') || 'none'}
      - Logos: ${visionData.logoAnnotations?.map(l => l.description).join(', ') || 'none'}
      - Objects: ${visionData.localizedObjectAnnotations?.map(o => o.name).join(', ') || 'none'}
    ` : '';

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
        messages: [{
          role: 'user',
          content: [
            ...imageContents,
            {
              type: 'text',
              text: `You are an expert fashion analyst specializing in UK resale markets (eBay UK and Vinted).
              
              ${visionContext}
              
              Analyze these clothing images and provide:
              
              1. eBay UK Title (EXACTLY 80 characters, UK spelling):
              - Format: [Brand] [Item Type] [Gender/Age] Size [Size] [Color] [Material] [Key Feature]
              - Use "Ladies" not "Women's", "Gents" not "Men's"
              - Include "BNWT" if new with tags
              
              2. Vinted Title (casual, under 50 chars):
              - Friendly and appealing to younger buyers
              
              3. Description (professional, mention all visible details):
              - Start with item overview
              - List measurements if visible
              - Describe condition accurately
              - Note any flaws
              - End with positive selling point
              
              4. Suggested Price in GBP (based on UK market):
              - Research typical UK resale prices
              - Consider brand, condition, and demand
              
              5. Extract these details:
              - Brand (check labels carefully)
              - Size (UK sizing)
              - Color/Colour (UK spelling)
              - Condition (New with tags/Excellent/Good/Fair)
              - Material (from care labels)
              - Category (be specific)
              - Style keywords (trendy terms)
              
              Return as JSON with keys: ebayTitle, vintedTitle, description, suggestedPrice, brand, size, color, condition, material, category, keywords`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error('Claude API request failed');
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Try to parse JSON from Claude's response
    try {
      // Extract JSON if wrapped in markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      // Return a structured fallback
      return {
        ebayTitle: 'Fashion Item - Please Review and Edit Title',
        vintedTitle: 'Lovely Fashion Item',
        description: content,
        suggestedPrice: 19.99,
        brand: 'Unknown',
        size: 'One Size',
        color: 'Multicolor',
        condition: 'Good',
        material: 'Mixed',
        category: 'Fashion',
        keywords: ['fashion', 'clothing', 'style']
      };
    }
  } catch (error) {
    console.error('Claude analysis error:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    // Check authentication
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Check user credits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits_total, credits_used, bonus_credits')
      .eq('clerk_user_id', user.id)
      .single();

    if (userError || !userData) {
      // Create user if doesn't exist
      await supabase.from('users').insert([{
        clerk_user_id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        credits_total: 0,
        credits_used: 0,
        bonus_credits: 50
      }]);
    }

    const availableCredits = userData 
      ? (userData.credits_total + userData.bonus_credits) - userData.credits_used
      : 50;

    if (availableCredits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits to continue.' },
        { status: 402 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const images = formData.getAll('images');

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    // Validate images
    const maxSize = 10 * 1024 * 1024; // 10MB
    for (const image of images) {
      if (!image.type.startsWith('image/')) {
        return NextResponse.json(
          { error: `Invalid file type: ${image.name}` },
          { status: 400 }
        );
      }
      if (image.size > maxSize) {
        return NextResponse.json(
          { error: `File too large: ${image.name} (max 10MB)` },
          { status: 400 }
        );
      }
    }

    // Analyze with Google Vision (optional - only if API key exists)
    let visionData = null;
    if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      try {
        const firstImageBase64 = await imageToBase64(images[0]);
        visionData = await analyzeWithGoogleVision(firstImageBase64);
      } catch (error) {
        console.error('Google Vision analysis failed:', error);
        // Continue without Vision data
      }
    }

    // Analyze with Claude
    const analysisResult = await analyzeWithClaude(images, visionData);

    // Save analysis to database
    const { error: saveError } = await supabase
      .from('analyses')
      .insert([{
        user_id: user.id,
        ebay_title: analysisResult.ebayTitle,
        vinted_title: analysisResult.vintedTitle,
        description: analysisResult.description,
        suggested_price: analysisResult.suggestedPrice,
        brand: analysisResult.brand,
        size: analysisResult.size,
        color: analysisResult.color,
        condition: analysisResult.condition,
        material: analysisResult.material,
        category: analysisResult.category,
        keywords: analysisResult.keywords,
        image_count: images.length,
        created_at: new Date().toISOString()
      }]);

    if (saveError) {
      console.error('Error saving analysis:', saveError);
    }

    // Update user credits
    await supabase
      .from('users')
      .update({ 
        credits_used: (userData?.credits_used || 0) + 1 
      })
      .eq('clerk_user_id', user.id);

    // Return successful response
    return NextResponse.json({
      success: true,
      ...analysisResult,
      creditsRemaining: availableCredits - 1
    });

  } catch (error) {
    console.error('API route error:', error);
    
    // Check for specific error types
    if (error.message?.includes('Claude API')) {
      return NextResponse.json(
        { error: 'AI analysis service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze images. Please try again.' },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}