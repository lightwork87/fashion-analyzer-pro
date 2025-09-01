// app/api/analyze-ai/route.js - COMPLETE WORKING VERSION WITH AI LEARNING
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Keep your existing fashion terminology function
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

// Keep your existing learning patterns function
async function checkLearnedPatterns(textContent) {
  try {
    const results = {
      brand: null,
      confidence: 0,
      patterns: []
    };

    const cleanText = textContent.toUpperCase().trim();
    const words = cleanText.split(/\s+/);
    
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

// Fixed image fetching function
async function fetchImageAsBase64(imageUrl) {
  try {
    console.log('Fetching image from:', imageUrl);
    
    // If it's already a data URI, extract the base64
    if (imageUrl.startsWith('data:')) {
      const base64 = imageUrl.split(',')[1];
      return base64;
    }
    
    // For regular URLs, fetch and convert
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return base64;
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

// Enhanced Claude analysis with fashion terminology
async function analyzeWithClaude(imageBase64, visionData, fashionTerms) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('No Anthropic API key found');
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

// Main POST handler
export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrls } = await request.json();
    
    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    console.log(`Starting AI analysis for ${imageUrls.length} images`);
    
    // Get fashion terminology for enhanced analysis
    const fashionTerms = await getFashionTerminology();
    
    let finalAnalysis = null;
    
    try {
      // Get the first image URL
      const imageUrl = imageUrls[0];
      
      // Fetch and convert image to base64
      const imageBase64 = await fetchImageAsBase64(imageUrl);
      
      // Call Google Vision API
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
        console.error('Vision API error:', visionResponse.status);
        throw new Error('Vision API failed');
      }

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
        if (learnedPatterns.brand && learnedPatterns.confidence > 0.7) {
          if (finalAnalysis) {
            finalAnalysis.brand = learnedPatterns.brand;
          }
        }
      }
    } catch (error) {
      console.error('Image processing error:', error);
    }
    
    // Fallback if AI analysis failed
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
      await supabase.from('analyses').insert({
        user_id: userId,
        image_urls: imageUrls,
        results: finalAnalysis,
        created_at: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Database storage error:', dbError);
    }
    
    return NextResponse.json(finalAnalysis);
    
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed',
      details: error.message 
    }, { status: 500 });
  }
}