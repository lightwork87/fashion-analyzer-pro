import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { imageDataUri, visionResults } = await request.json();

    // Check user credits using existing system
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has credits remaining
    if (user.credits_remaining <= 0) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Analyze with Claude
    let claudeAnalysis;
    try {
      claudeAnalysis = await analyzeWithClaude(visionResults, imageDataUri);
    } catch (error) {
      console.error('Claude API error:', error);
      // Fallback to generic response if Claude fails
      claudeAnalysis = {
        title: "Unbranded Fashion Item",
        description: "Quality fashion item in good condition",
        brand: "Unbranded",
        condition: "Good",
        category: "Fashion",
        price_range: "£5-15",
        keywords: ["fashion", "clothing", "style"]
      };
    }

    // Deduct 1 credit using existing system
    const newCreditsUsed = user.credits_used + 1;
    const newCreditsRemaining = user.credits_remaining - 1;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits_used: newCreditsUsed,
        credits_remaining: newCreditsRemaining
      })
      .eq('clerk_id', userId);

    if (updateError) {
      console.error('Error updating credits:', updateError);
    }

    // Save analysis to database
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert([
        {
          clerk_id: userId,
          analysis_data: {
            vision_results: visionResults,
            claude_analysis: claudeAnalysis,
            image_data_uri: imageDataUri
          },
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (analysisError) {
      console.error('Error saving analysis:', analysisError);
    }

    return NextResponse.json({
      success: true,
      analysis: claudeAnalysis,
      credits_remaining: newCreditsRemaining,
      credits_used: newCreditsUsed
    });

  } catch (error) {
    console.error('Error in AI analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeWithClaude(visionResults, imageDataUri) {
  const prompt = `Analyze this fashion item and provide a detailed eBay listing:

Vision API Results: ${JSON.stringify(visionResults)}

Please provide:
- Professional eBay title
- Detailed description
- Brand (if identifiable, otherwise "Unbranded")
- Condition assessment
- Category
- Price range suggestion
- SEO keywords

Format as JSON object.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageDataUri.split(',')[1]
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content[0].text;
  
  try {
    return JSON.parse(content);
  } catch {
    // If JSON parsing fails, return structured fallback
    return {
      title: "Fashion Item - AI Analysis",
      description: content,
      brand: "Unbranded",
      condition: "Good",
      category: "Fashion",
      price_range: "£5-15",
      keywords: ["fashion", "clothing"]
    };
  }
}