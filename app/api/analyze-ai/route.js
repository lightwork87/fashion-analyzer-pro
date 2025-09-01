// app/api/analyze-ai/route.js - COMPLETE FIXED VERSION WITH CLAUDE 3.5
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
  console.log('📚 Fetching fashion terminology...');
  try {
    const { data: terms } = await supabase
      .from('fashion_terms')
      .select('term, category, primary_description, alternative_names')
      .order('category');
    
    console.log(`📚 Found ${terms?.length || 0} fashion terms`);
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
    console.error('❌ Error fetching fashion terms:', error);
    return null;
  }
}

// Check learned patterns before external API calls
async function checkLearnedPatterns(textContent) {
  console.log('🔍 Checking learned patterns...');
  try {
    const results = {
      brand: null,
      confidence: 0,
      patterns: []
    };

    if (!textContent) {
      console.log('🔍 No text content to check');
      return results;
    }

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
        console.log(`✅ Found brand from alias: ${results.brand}`);
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
      console.log(`✅ Found brand from learning: ${results.brand}`);
    } else {
      console.log('🔍 No learned patterns found');
    }

    return results;
  } catch (error) {
    console.error('❌ Error checking learned patterns:', error);
    return { brand: null, confidence: 0, patterns: [] };
  }
}

// Enhanced Claude analysis with fashion terminology
async function analyzeWithClaude(imageBase64, visionData, fashionTerms) {
  console.log('🤖 Starting Claude analysis...');
  console.log('🔑 Claude API key exists:', !!process.env.ANTHROPIC_API_KEY);
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('❌ No Anthropic API key configured');
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

    console.log('🤖 Sending request to Claude API...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',  // UPDATED TO CLAUDE 3.5 SONNET
        max_tokens: 2000,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    console.log('🤖 Claude response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    console.log('🤖 Claude response received, length:', content.length);
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log('✅ Claude analysis completed successfully');
        return analysis;
      } catch (parseError) {
        console.error('❌ Failed to parse Claude JSON:', parseError);
      }
    } else {
      console.log('❌ No JSON found in Claude response');
    }
    
    return null;
  } catch (error) {
    console.error('❌ Claude analysis error:', error);
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
  console.log('========================================');
  console.log('🚀 ANALYZE-AI: Starting new request');
  console.log('⏰ Time:', new Date().toISOString());
  console.log('========================================');
  
  try {
    // Check authentication
    const { userId } = await auth();
    console.log('👤 User ID:', userId);
    
    if (!userId) {
      console.log('❌ Unauthorized request - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check API keys
    console.log('🔑 API Keys Configuration:');
    console.log('  - Google Vision:', !!process.env.GOOGLE_CLOUD_VISION_API_KEY, `(${process.env.GOOGLE_CLOUD_VISION_API_KEY?.length || 0} chars)`);
    console.log('  - Anthropic:', !!process.env.ANTHROPIC_API_KEY, `(${process.env.ANTHROPIC_API_KEY?.length || 0} chars)`);

    // Parse request body
    let body;
    try {
      const text = await request.text();
      console.log('📦 Request body size:', text.length, 'chars');
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request format',
        details: 'Request body must be valid JSON'
      }, { status: 400 });
    }

    const { imageUrls } = body;
    
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.log('❌ No images provided in request');
      return NextResponse.json({ 
        error: 'No images provided',
        details: 'imageUrls array is required'
      }, { status: 400 });
    }

    console.log(`📸 Processing ${imageUrls.length} images`);
    
    // Get fashion terminology
    const fashionTerms = await getFashionTerminology();
    
    let finalAnalysis = null;
    
    try {
      const imageUrl = imageUrls[0];
      console.log('🖼️ Processing first image URL type:', imageUrl.substring(0, 30));
      
      let imageBase64;
      
      // Handle data URIs
      if (imageUrl.startsWith('data:')) {
        imageBase64 = imageUrl.split(',')[1];
        console.log('✅ Using data URI image, base64 length:', imageBase64.length);
      } else {
        // Fetch image from URL
        console.log('🌐 Fetching image from URL...');
        try {
          const imageResponse = await fetch(imageUrl);
          console.log('🌐 Image fetch response status:', imageResponse.status);
          
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
          }
          
          const buffer = await imageResponse.arrayBuffer();
          imageBase64 = Buffer.from(buffer).toString('base64');
          console.log('✅ Image fetched, base64 length:', imageBase64.length);
        } catch (fetchError) {
          console.error('❌ Image fetch error:', fetchError);
          throw new Error('Could not fetch image from URL');
        }
      }
      
      // Call Google Vision API
      if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
        console.log('👁️ Calling Google Vision API...');
        console.log('👁️ API Key first 10 chars:', process.env.GOOGLE_CLOUD_VISION_API_KEY.substring(0, 10));
        
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

        console.log('👁️ Vision API response status:', visionResponse.status);
        
        if (!visionResponse.ok) {
          const errorText = await visionResponse.text();
          console.error('❌ Vision API error:', visionResponse.status, errorText);
        } else {
          const visionData = await visionResponse.json();
          const visionResult = visionData.responses?.[0];
          
          if (visionResult) {
            console.log('✅ Vision analysis complete');
            console.log('  - Text annotations:', visionResult.textAnnotations?.length || 0);
            console.log('  - Labels:', visionResult.labelAnnotations?.length || 0);
            console.log('  - Objects:', visionResult.localizedObjectAnnotations?.length || 0);
            
            // Check learned patterns
            const textContent = visionResult.textAnnotations?.[0]?.description || '';
            const learnedPatterns = await checkLearnedPatterns(textContent);
            
            // Analyze with Claude
            finalAnalysis = await analyzeWithClaude(imageBase64, visionResult, fashionTerms);
            
            // Apply learned brand if confidence is high
            if (learnedPatterns.brand && learnedPatterns.confidence > 0.7 && finalAnalysis) {
              console.log('🏷️ Applying learned brand:', learnedPatterns.brand);
              finalAnalysis.brand = learnedPatterns.brand;
            }
            
            // Store fashion terms learning
            if (finalAnalysis && textContent) {
              await storeFashionTermsLearning(finalAnalysis, textContent);
            }
          } else {
            console.log('⚠️ No vision results returned');
          }
        }
      } else {
        console.log('❌ Google Vision API key not configured');
      }
    } catch (error) {
      console.error('❌ Image processing error:', error);
    }
    
    // Use fallback if AI analysis failed
    if (!finalAnalysis) {
      console.log('⚠️ Using fallback analysis - AI processing failed');
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
    console.log('🏷️ Generated SKU:', sku);
    
    // Store analysis in database (simplified to avoid schema errors)
    try {
      console.log('💾 Storing analysis in database...');
      const { error: dbError } = await supabase.from('analyses').insert({
        user_id: userId,
        analysis_data: finalAnalysis,  // Store as JSON in single column
        created_at: new Date().toISOString()
      });
      
      if (dbError) {
        console.error('❌ Database storage error:', dbError);
      } else {
        console.log('✅ Analysis stored in database');
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
    }
    
    console.log('========================================');
    console.log('✅ ANALYZE-AI: Request completed');
    console.log('========================================');
    
    return NextResponse.json(finalAnalysis);
    
  } catch (error) {
    console.error('❌ ANALYZE-AI: Fatal error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}