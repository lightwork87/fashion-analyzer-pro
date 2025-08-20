import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// For App Router, use these exports instead of config
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get('image');
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Check file size (10MB max)
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Max 10MB allowed.' }, { status: 413 });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Check if we have Google Vision API key
    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY || process.env.GOOGLE_CLOUD_VISION_API_KEY === 'your_google_vision_api_key') {
      console.log('Google Vision API key not configured, using test mode');
      // Return test data
      return NextResponse.json({
        success: true,
        analysis: {
          title: "Fashion Item - Test Mode",
          description: "AI Analysis is in test mode. Add your Google Vision API key to enable real analysis. This item appears to be a fashion piece ready for listing.",
          SUGGESTED_PRICE_GBP: "19.99",
          category: "Clothing",
          condition: "Good",
          tags: ["fashion", "clothing", "style", "apparel", "outfit"],
          brand: "Unknown",
          size: "Medium",
          material: "Cotton blend",
          STYLE_NOTES: "Versatile piece suitable for casual or smart casual occasions",
          visionData: {
            labels: [
              { description: "Clothing", score: 0.95 },
              { description: "Fashion", score: 0.92 }
            ],
            colors: [
              { rgb: "66,135,245", score: 0.8 },
              { rgb: "255,255,255", score: 0.6 }
            ],
            hasText: false,
            detectedObjects: ["clothing item"]
          },
          timestamp: new Date().toISOString(),
          creditsUsed: 0,
          testMode: true
        }
      });
    }

    // Step 1: Google Vision API Analysis
    console.log('Calling Google Vision API...');
    
    let visionData;
    try {
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: base64Image },
              features: [
                { type: 'LABEL_DETECTION', maxResults: 10 },
                { type: 'TEXT_DETECTION' },
                { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
                { type: 'IMAGE_PROPERTIES' }
              ]
            }]
          })
        }
      );

      // Check if response is JSON
      const contentType = visionResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await visionResponse.text();
        console.error('Vision API returned non-JSON response:', text);
        throw new Error('Vision API returned invalid response');
      }

      visionData = await visionResponse.json();
      
      // Check for API errors
      if (visionData.error) {
        console.error('Vision API error:', visionData.error);
        
        // If API key is invalid, return test mode
        if (visionData.error.code === 403 || visionData.error.status === 'PERMISSION_DENIED' || visionData.error.message?.includes('API key')) {
          return NextResponse.json({
            success: true,
            analysis: {
              title: "Fashion Item - API Key Invalid",
              description: "Your Google Vision API key appears to be invalid. Please check your API key configuration. Using test mode for now.",
              SUGGESTED_PRICE_GBP: "19.99",
              category: "Clothing",
              condition: "Good",
              tags: ["fashion", "clothing", "test"],
              visionData: {
                labels: [],
                colors: [],
                hasText: false,
                detectedObjects: []
              },
              timestamp: new Date().toISOString(),
              creditsUsed: 0,
              testMode: true,
              error: "Invalid API key"
            }
          });
        }
        
        throw new Error(visionData.error.message || 'Vision API error');
      }

      if (!visionResponse.ok) {
        throw new Error(`Vision API HTTP error: ${visionResponse.status}`);
      }

    } catch (visionError) {
      console.error('Vision API call failed:', visionError);
      
      // Return fallback test data on any Vision API error
      return NextResponse.json({
        success: true,
        analysis: {
          title: "Fashion Item - Vision Error",
          description: "Vision API encountered an error. Using fallback analysis. Please check your API configuration.",
          SUGGESTED_PRICE_GBP: "19.99",
          category: "Clothing",
          condition: "Good",
          tags: ["fashion", "clothing", "style"],
          visionData: {
            labels: [],
            colors: [],
            hasText: false,
            detectedObjects: []
          },
          timestamp: new Date().toISOString(),
          creditsUsed: 0,
          testMode: true,
          error: visionError.message
        }
      });
    }

    // Extract relevant data from Vision response
    const labels = visionData.responses?.[0]?.labelAnnotations || [];
    const text = visionData.responses?.[0]?.textAnnotations?.[0]?.description || '';
    const colors = visionData.responses?.[0]?.imagePropertiesAnnotation?.dominantColors?.colors || [];
    const objects = visionData.responses?.[0]?.localizedObjectAnnotations || [];

    console.log('Vision analysis complete. Labels found:', labels.length);

    // Step 2: Claude AI Analysis (only if we have vision data and API key)
    let aiAnalysis = {
      title: labels[0]?.description || 'Fashion Item',
      description: `${labels[0]?.description || 'Fashion item'} detected. ${labels.slice(1, 3).map(l => l.description).join(', ')} characteristics visible.`,
      SUGGESTED_PRICE_GBP: '19.99',
      category: 'Clothing',
      condition: 'Good',
      tags: labels.slice(0, 5).map(l => l.description),
      brand: text.match(/nike|adidas|zara|h&m|gap|uniqlo|gucci|prada/i)?.[0] || 'Unbranded',
      material: labels.find(l => l.description.toLowerCase().includes('cotton') || l.description.toLowerCase().includes('wool') || l.description.toLowerCase().includes('polyester'))?.description || 'Mixed materials'
    };

    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key' && labels.length > 0) {
      console.log('Calling Claude AI for enhanced analysis...');
      
      const claudePrompt = `You are an expert fashion reseller assistant. Analyze this clothing item based on the following data:

Labels detected: ${labels.map(l => l.description).join(', ')}
Text found: ${text || 'none'}
Main colors: ${colors.slice(0, 3).map(c => `rgb(${c.color?.red || 0},${c.color?.green || 0},${c.color?.blue || 0})`).join(', ')}
Objects detected: ${objects.map(o => o.name).join(', ') || 'none'}

Generate the following for UK eBay and Vinted listings. Return ONLY valid JSON with these exact keys:

{
  "title": "max 80 chars, include brand if detected, size, color, style",
  "description": "detailed description for reselling",
  "category": "most appropriate eBay category",
  "SUGGESTED_PRICE_GBP": "price as number string like 19.99",
  "tags": ["array", "of", "5-10", "keywords"],
  "condition": "New or Like New or Good or Fair",
  "brand": "brand name or Unbranded",
  "size": "size or One Size",
  "material": "material type",
  "STYLE_NOTES": "fashion styling suggestions"
}`;

      try {
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: claudePrompt
            }]
          })
        });

        if (claudeResponse.ok) {
          const claudeData = await claudeResponse.json();
          
          if (claudeData.content?.[0]?.text) {
            try {
              const claudeText = claudeData.content[0].text;
              // Clean the response in case it has markdown
              const cleanedText = claudeText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const parsedAnalysis = JSON.parse(cleanedText);
              aiAnalysis = { ...aiAnalysis, ...parsedAnalysis };
              console.log('Claude analysis complete');
            } catch (parseError) {
              console.error('Failed to parse Claude response:', parseError);
              // Keep the Vision-only analysis
            }
          }
        } else {
          console.error('Claude API returned status:', claudeResponse.status);
        }
      } catch (claudeError) {
        console.error('Claude API error:', claudeError);
        // Continue with Vision-only analysis
      }
    }

    // Combine all analysis
    const result = {
      success: true,
      analysis: {
        ...aiAnalysis,
        visionData: {
          labels: labels.slice(0, 5).map(l => ({
            description: l.description,
            score: l.score
          })),
          colors: colors.slice(0, 3).map(c => ({
            rgb: `${c.color?.red || 0},${c.color?.green || 0},${c.color?.blue || 0}`,
            score: c.score || 0
          })),
          hasText: !!text,
          detectedObjects: objects.map(o => o.name)
        },
        timestamp: new Date().toISOString(),
        creditsUsed: 1,
        testMode: false
      }
    };

    console.log('Analysis complete, returning results');
    return NextResponse.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Return a proper error response
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        details: error.message,
        success: false 
      },
      { status: 500 }
    );
  }
}