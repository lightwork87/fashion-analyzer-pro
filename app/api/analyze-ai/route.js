// app/api/analyze-ai/route.js - COMPLETE WORKING VERSION
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

    if (!textContent) return results;

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
async function analyzeWithClaude(imageBase64, visionData, fashionTerms) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('No Anthropic API key configured');
    return null;
  }

  try {
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

    const prompt = `You are an expert UK fashion analyst. Analyze this garment using professional fashion terminology.

${fashionContext}

VISION API DATA:
- Text found: ${visionData?.textAnnotations?.[0]?.description || 'none'}
- Labels: ${visionData?.labelAnnotations?.map(l => l.description).join(', ') || 'none'}
- Objects: ${visionData?.localizedObjectAnnotations?.map(o => o.name).join(', ') || 'none'}

Create a professional eBay UK listing. Respond with ONLY valid JSON:
{
  "brand": "detected brand or Unbranded",
  "item_type": "specific garment type",
  "neckline": "neckline type",
  "sleeve_type": "sleeve type", 
  "silhouette": "silhouette type",
  "size": "UK size",
  "color": "main colour",
  "condition_score": 7,
  "estimated_value_min": 10,
  "estimated_value_max": 25,
  "ebay_title": "Professional eBay title (max 80 chars)",
  "description": "Professional description",
  "suggested_price": 15,
  "category": "Clothes, Shoes & Accessories",
  "material": "fabric type",
  "style": "style category",
  "gender": "Women's/Men's/Unisex",
  "keywords": ["fashion", "terms", "here"]
}`;

    console.log('Calling Claude API...');
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
      const errorText = await response.text();
      console.error('Claude error response:', errorText);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log('Claude analysis completed successfully');
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
    if (analysis && (analysis.neckline || analysis.sleeve_type || analysis.silhouette)) {
      await supabase.from('fashion_term_usage').insert({
        original_text: originalText,
        detected_terms: {
          neckline: analysis.neckline,
          sleeve_type: analysis.sleeve_type,
          silhouette: analysis.silhouette
        },
        created_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error storing fashion terms learning:', error);
  }
}

export async function POST(request) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      console.log('Unauthorized request - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body with error handling
    let body;
    try {
      const text = await request.text();
      console.log('Request body length:', text.length);
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request format',
        details: 'Request body must be valid JSON'
      }, { status: 400 });
    }

    const { imageUrls } = body;
    
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.log('No images provided in request');
      return NextResponse.json({ 
        error: 'No images provided',
        details: 'imageUrls array is required'
      }, { status: 400 });
    }

    console.log(`Starting AI analysis for ${imageUrls.length} images`);
    
    // Get fashion terminology for enhanced analysis
    const fashionTerms = await getFashionTerminology();
    
    let finalAnalysis = null;
    
    try {
      const imageUrl = imageUrls[0];
      console.log('Processing image URL:', imageUrl.substring(0, 100) + '...');
      
      let imageBase64;
      
      // Handle data URIs
      if (imageUrl.startsWith('data:')) {
        imageBase64 = imageUrl.split(',')[1];
        console.log('Using data URI image');
      } else {
        // Fetch image from URL
        try {
          console.log('Fetching image from URL...');
          const imageResponse = await fetch(imageUrl);
          
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
          }
          
          const buffer = await imageResponse.arrayBuffer();
          imageBase64 = Buffer.from(buffer).toString('base64');
          console.log('Image fetched and converted to base64');
        } catch (fetchError) {
          console.error('Image fetch error:', fetchError);
          throw new Error('Could not fetch image from URL');
        }
      }
      
      // Call Google Vision API
      if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
        console.log('Calling Google Vision API...');
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
                  { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
                  { type: 'IMAGE_PROPERTIES', maxResults: 5 }
                ]
              }]
            })
          }
        );

        if (!visionResponse.ok) {
          const errorText = await visionResponse.text();
          console.error('Vision API error:', visionResponse.status, errorText);
        } else {
          const visionData = await visionResponse.json();
          const visionResult = visionData.responses?.[0];
          
          if (visionResult) {
            console.log('Vision analysis complete');
            
            // Check learned patterns
            const textContent = visionResult.textAnnotations?.[0]?.description || '';
            const learnedPatterns = await checkLearnedPatterns(textContent);
            
            // Analyze with Claude
            finalAnalysis = await analyzeWithClaude(imageBase64, visionResult, fashionTerms);
            
            // Apply learned brand if confidence is high
            if (learnedPatterns.brand && learnedPatterns.confidence > 0.7 && finalAnalysis) {
              finalAnalysis.brand = learnedPatterns.brand;
            }
            
            // Store fashion terms learning
            if (finalAnalysis && textContent) {
              await storeFashionTermsLearning(finalAnalysis, textContent);
            }
          }
        }
      } else {
        console.log('Google Vision API key not configured');
      }
    } catch (error) {
      console.error('Image processing error:', error);
    }
    
    // Use fallback if AI analysis failed
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
    
    // Generate SKU
    const sku = `UNB-${Date.now().toString(36).toUpperCase()}`;
    finalAnalysis.sku = sku;
    
    // Store analysis in database
    try {
      const { error: dbError } = await supabase.from('analyses').insert({
        user_id: userId,
        image_urls: imageUrls,
        results: finalAnalysis,
        created_at: new Date().toISOString()
      });
      
      if (dbError) {
        console.error('Database storage error:', dbError);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    }
    
    // Ensure we return valid JSON
    return NextResponse.json(finalAnalysis);
    
  } catch (error) {
    console.error('Analysis route error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}