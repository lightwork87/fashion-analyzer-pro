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

    // Step 1: Google Vision API Analysis
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

    const visionData = await visionResponse.json();
    
    // Check if we have a valid API key
    if (visionData.error?.code === 403 || visionData.error?.status === 'PERMISSION_DENIED') {
      console.error('Google Vision API key invalid or missing');
      // Fallback to mock data for testing
      return NextResponse.json({
        success: true,
        analysis: {
          title: "Fashion Item - AI Analysis Pending",
          description: "This is a test response. Please configure your Google Vision API key to enable AI analysis.",
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
          testMode: true
        }
      });
    }

    if (!visionResponse.ok) {
      console.error('Vision API error:', visionData);
      return NextResponse.json({ error: 'Vision API failed', details: visionData }, { status: 500 });
    }

    // Extract relevant data from Vision response
    const labels = visionData.responses?.[0]?.labelAnnotations || [];
    const text = visionData.responses?.[0]?.textAnnotations?.[0]?.description || '';
    const colors = visionData.responses?.[0]?.imagePropertiesAnnotation?.dominantColors?.colors || [];
    const objects = visionData.responses?.[0]?.localizedObjectAnnotations || [];

    // Step 2: Claude AI Analysis (only if we have vision data)
    let aiAnalysis = {
      title: labels[0]?.description || 'Fashion Item',
      description: 'Item detected',
      SUGGESTED_PRICE_GBP: '19.99',
      category: 'Clothing',
      condition: 'Good',
      tags: labels.slice(0, 5).map(l => l.description)
    };

    if (process.env.ANTHROPIC_API_KEY && labels.length > 0) {
      const claudePrompt = `You are an expert fashion reseller assistant. Analyze this clothing item based on the following data:

Labels detected: ${labels.map(l => l.description).join(', ')}
Text found: ${text}
Main colors: ${colors.slice(0, 3).map(c => `rgb(${c.color.red},${c.color.green},${c.color.blue})`).join(', ')}
Objects detected: ${objects.map(o => o.name).join(', ')}

Generate the following for UK eBay and Vinted listings:

1. title (max 80 chars, include brand if detected, size, color, style)
2. description (detailed, highlight condition, measurements if visible, material, style tips)
3. category (most appropriate eBay category)
4. SUGGESTED_PRICE_GBP (based on typical resale values)
5. tags (5-10 relevant keywords as array)
6. condition (New/Like New/Good/Fair based on visual analysis)
7. brand (if identifiable)
8. size (if visible)
9. material (if identifiable)
10. STYLE_NOTES (fashion styling suggestions)

Format as JSON.`;

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
          try {
            const claudeText = claudeData.content[0].text;
            // Clean the response in case it has markdown
            const cleanedText = claudeText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            aiAnalysis = JSON.parse(cleanedText);
          } catch (e) {
            console.error('Failed to parse Claude response:', e);
          }
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
          labels: labels.slice(0, 5),
          colors: colors.slice(0, 3).map(c => ({
            rgb: `${c.color.red || 0},${c.color.green || 0},${c.color.blue || 0}`,
            score: c.score || 0
          })),
          hasText: !!text,
          detectedObjects: objects.map(o => o.name)
        },
        timestamp: new Date().toISOString(),
        creditsUsed: 1
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error.message },
      { status: 500 }
    );
  }
}