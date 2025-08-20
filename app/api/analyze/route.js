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

    // The rest of the code continues...
    // [COPY THE ENTIRE FILE FROM THE ARTIFACT ABOVE]