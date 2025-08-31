// app/api/analyze-ai/route.js
// ENHANCED VERSION WITH FASHION TERMINOLOGY

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Get fashion terminology for AI prompts
async function getFashionTerminology() {
  try {
    const { data: terms } = await supabase
      .from('fashion_terms')
      .select('term, category, primary_description, alternative_names')
      .order('category');
    
    if (!terms) return null;
    
    // Organize by category for the AI prompt
    const organized = {};
    terms.forEach(term => {
      if (!organized[term.category]) {
        organized[term.category] = [];
      }
      organized[term.category].push({
        term: term.term,
        description: term.primary_description,
        alternatives: term.alternative_names || []
      });
    });
    
    return organized;
  } catch (error) {
    console.error('Error fetching fashion terms:', error);
    return null;
  }
}

// Check learned patterns before external API calls
async function checkLearnedPatterns(textContent) {
  try {
    const results = {
      brand: null,
      confidence: 0,
      patterns: []
    };

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
        console.log(`Found brand from alias: ${results.brand}`);
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
      results.brand = learned[0].actual_brand;
      results.confidence = learned[0].confidence;
      results.patterns = learned;
      console.log(`Found brand from learning: ${results.brand}`);
    }

    return results;
  } catch (error) {
    console.error('Error checking learned patterns:', error);
    return { brand: null, confidence: 0, patterns: [] };
  }
}

// Enhanced Claude analysis with fashion terminology
async function analyzeWithClaude(imageData, visionData, fashionTerms) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    // Build fashion terminology context
    let fashionContext = '';
    if (fashionTerms) {
      fashionContext = '\nUSE THESE PROFESSIONAL FASHION TERMS:\n';
      Object.entries(fashionTerms).forEach(([category, terms]) => {
        fashionContext += `\n${category.toUpperCase()}:\n`;
        terms.forEach(term => {
          fashionContext += `- ${term.term}: ${term.description}\n`;
        });
      });
    }

    const prompt = `You are an expert UK fashion analyst. Analyze this garment using ONLY professional fashion terminology.

${fashionContext}

VISION API DATA:
- Text found: ${visionData?.textAnnotations?.[0]?.description || 'none'}
- Labels: ${visionData?.labelAnnotations?.map(l => l.description).join(', ') || 'none'}
- Objects: ${visionData?.localizedObjectAnnotations?.map(o => o.name).join(', ') || 'none'}

REQUIREMENTS:
1. Use EXACT fashion terms from the list above
2. Create a professional eBay UK title (max 80 characters)
3. UK sizing and spelling only
4. Price in GBP for UK market

Respond with ONLY valid JSON:
{
  "brand": "detected brand or Unbranded",
  "item_type": "specific garment type using fashion terms",
  "neckline": "exact neckline term from list",
  "sleeve_type": "exact sleeve term from list", 
  "silhouette": "exact silhouette term from list",
  "size": "UK size",
  "color": "main colour",
  "condition_score": 7,
  "estimated_value_min": 10,
  "estimated_value_max": 25,
  "ebay_title": "Professional title using fashion terms",
  "description": "Professional description with proper terminology",
  "suggested_price": 15,
  "category": "Clothes, Shoes & Accessories",
  "material": "fabric type",
  "style": "style category",
  "gender": "Women's/Men's/Unisex",
  "keywords": ["professional", "fashion", "terms"]
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
        max_tokens: 2000,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log('Claude analysis with fashion terms completed');
        return analysis;
      } catch (parseError) {
        console.error('Failed to parse Claude JSON:', parseError);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Claude analysis error:', error);
    return null;
  }
}

// Store detected fashion terms for learning
async function storeFashionTermsLearning(analysis, originalText) {
  try {
    if (analysis.neckline || analysis.sleeve_type || analysis.silhouette) {
      await supabase.from('fashion_term_usage').insert({
        original_text: originalText,
        detected_neckline: analysis.neckline,
        detected_sleeve: analysis.sleeve_type,
        detected_silhouette: analysis.silhouette,
        confidence_score: 0.8,
        created_at: new Date().toISOString()
      });
      console.log('Fashion terms usage stored for learning');
    }
  } catch (error) {
    console.error('Error storing fashion terms learning:', error);
  }
}

// Main analysis handler
export async function POST(request) {
  console.log('\n=== ENHANCED AI ANALYSIS WITH FASHION TERMS ===');
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrls = [], imageCount } = body;
    const numImages = imageUrls.length || imageCount || 1;
    
    console.log(`Processing ${numImages} images for user ${userId}`);
    
    // Load fashion terminology
    console.log('Loading fashion terminology...');
    const fashionTerms = await getFashionTerminology();
    console.log(`Loaded ${fashionTerms ? Object.keys(fashionTerms).length : 0} fashion term categories`);
    
    // Get user and check credits
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

    let finalAnalysis = null;
    
    if (imageUrls && imageUrls.length > 0) {
      // Get first image for analysis
      const imageUrl = imageUrls[0];
      console.log('Fetching image for analysis...');
      
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error('Failed to fetch image');
        
        const buffer = await imageResponse.arrayBuffer();
        const imageBase64 = Buffer.from(buffer).toString('base64');
        
        // Get vision data
        console.log('Analyzing with Google Vision...');
        const visionResponse = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [{
                image: { content: imageBase64 },
                features: [
                  { type: 'TEXT_DETECTION', maxResults: 10 },
                  { type: 'LABEL_DETECTION', maxResults: 20 },
                  { type: 'LOGO_DETECTION', maxResults: 5 },
                  { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
                ]
              }]
            })
          }
        );

        const visionData = await visionResponse.json();
        const visionResult = visionData.responses?.[0];
        
        if (visionResult) {
          console.log('Vision analysis complete');
          
          // Check learned patterns first
          const textContent = visionResult.textAnnotations?.[0]?.description || '';
          const learnedPatterns = await checkLearnedPatterns(textContent);
          
          // Analyze with Claude using fashion terms
          finalAnalysis = await analyzeWithClaude(imageBase64, visionResult, fashionTerms);
          
          // Override brand if learned pattern has higher confidence
          if (learnedPatterns.brand && learnedPatterns.confidence > 0.7) {
            if (finalAnalysis) {
              finalAnalysis.brand = learnedPatterns.brand;
            }
          }
          
          // Store fashion terms learning
          if (finalAnalysis && textContent) {
            await storeFashionTermsLearning(finalAnalysis, textContent);
          }
        }
      } catch (imageError) {
        console.error('Image processing error:', imageError);
      }
    }
    
    // Fallback if AI failed
    if (!finalAnalysis) {
      console.log('Using fallback analysis');
      finalAnalysis = {
        brand: "Unbranded",
        item_type: "Garment",
        neckline: "See photos",
        sleeve_type: "See photos", 
        silhouette: "Classic fit",
        size: "See label",
        color: "Multi",
        condition_score: 7,
        estimated_value_min: 8,
        estimated_value_max: 20,
        ebay_title: "Fashion Item - Please See Photos for Details",
        description: "Item as shown in photos. Please check all photos for size, brand, and condition details.",
        suggested_price: 12,
        category: "Clothes, Shoes & Accessories",
        material: "See label",
        style: "Casual",
        gender: "Unisex",
        keywords: ["clothing", "fashion", "uk"]
      };
    }
    
    // Complete analysis data
    const completeAnalysis = {
      ...finalAnalysis,
      id: `analysis-${Date.now()}`,
      sku: `${(finalAnalysis.brand || 'UNB').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      images_count: numImages,
      image_urls: imageUrls,
      credits_remaining: creditsAvailable - 1,
      analyzed_at: new Date().toISOString(),
      fashion_terms_used: fashionTerms ? true : false
    };
    
    // Save to database
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
      metadata: completeAnalysis
    });
    
    // Update credits
    await supabase
      .from('users')
      .update({ credits_used: (userData?.credits_used || 0) + 1 })
      .eq('clerk_id', userId);
    
    console.log('Enhanced analysis complete:', completeAnalysis.ebay_title);
    
    return NextResponse.json({
      success: true,
      analysis: completeAnalysis
    });
    
  } catch (error) {
    console.error('Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Enhanced AI Analysis API with Fashion Terms',
    fashion_terms_enabled: true,
    timestamp: new Date().toISOString()
  });
}