// AI Integration for Fashion Analyzer Pro
// Connects to Google Vision API and Claude API for real analysis

import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Google Vision API endpoint
const VISION_API_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`;

// Analyze image with Google Vision API
export async function analyzeImageWithVision(imageBase64) {
  try {
    const requestBody = {
      requests: [{
        image: {
          content: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
        },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 10 },
          { type: 'LABEL_DETECTION', maxResults: 20 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          { type: 'IMAGE_PROPERTIES', maxResults: 5 },
          { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 }
        ]
      }]
    };

    const response = await fetch(VISION_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.responses[0];

    return {
      textAnnotations: result.textAnnotations || [],
      labels: result.labelAnnotations || [],
      objects: result.localizedObjectAnnotations || [],
      colors: result.imagePropertiesAnnotation?.dominantColors?.colors || [],
      safeSearch: result.safeSearchAnnotation || {},
      fullTextAnnotation: result.fullTextAnnotation?.text || ''
    };
  } catch (error) {
    console.error('Google Vision API error:', error);
    throw error;
  }
}

// Analyze fashion item with Claude
export async function analyzeFashionWithClaude(visionData, imageBase64) {
  try {
    // Prepare the analysis prompt
    const prompt = createAnalysisPrompt(visionData);
    
    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1500,
      temperature: 0.3,
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
                data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
              }
            }
          ]
        }
      ]
    });

    // Parse Claude's response
    const analysis = parseClaudeResponse(message.content[0].text);
    return analysis;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

// Create analysis prompt for Claude
function createAnalysisPrompt(visionData) {
  const detectedText = visionData.fullTextAnnotation || '';
  const labels = visionData.labels.map(l => l.description).join(', ');
  const objects = visionData.objects.map(o => o.name).join(', ');
  
  return `You are a professional fashion appraiser analyzing clothing items for eBay resale. 
Analyze this fashion item image and provide detailed information.

Context from image analysis:
- Detected text: ${detectedText}
- Detected labels: ${labels}
- Detected objects: ${objects}

Please analyze and provide the following in JSON format:
{
  "itemType": "specific type (dress, shirt, jacket, etc.)",
  "brand": {
    "name": "detected brand name or null",
    "confidence": 0.0-1.0,
    "evidence": "what indicates this brand"
  },
  "condition": {
    "assessment": "NEW/EXCELLENT/VERY_GOOD/GOOD/FAIR/POOR",
    "score": 0-100,
    "issues": ["list of any defects or wear"],
    "positives": ["positive condition aspects"],
    "evidence": "what you see that indicates condition"
  },
  "measurements": {
    "hasRuler": true/false,
    "detected": {
      "measurement_type": value
    }
  },
  "details": {
    "color": "primary color",
    "secondaryColors": ["other colors"],
    "material": "detected material type",
    "pattern": "pattern type if any",
    "style": "style descriptor",
    "gender": "mens/womens/unisex",
    "estimatedSize": "size estimate",
    "season": "appropriate season",
    "era": "decade if vintage"
  },
  "features": ["notable features", "unique details"],
  "suggestedKeywords": ["relevant", "search", "keywords"],
  "listingTitle": "eBay optimized title under 80 chars",
  "priceEstimate": {
    "low": 0,
    "high": 0,
    "suggested": 0,
    "reasoning": "price justification"
  }
}

Focus on accuracy and detail. If you're unsure about something, indicate lower confidence rather than guessing.`;
}

// Parse Claude's JSON response
function parseClaudeResponse(responseText) {
  try {
    // Extract JSON from response (Claude might add explanatory text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and clean the response
    return {
      itemType: parsed.itemType || 'item',
      brand: {
        name: parsed.brand?.name || null,
        confidence: parsed.brand?.confidence || 0,
        evidence: parsed.brand?.evidence || ''
      },
      condition: {
        assessment: parsed.condition?.assessment || 'GOOD',
        score: parsed.condition?.score || 50,
        issues: parsed.condition?.issues || [],
        positives: parsed.condition?.positives || [],
        evidence: parsed.condition?.evidence || ''
      },
      measurements: parsed.measurements || { hasRuler: false, detected: {} },
      details: {
        color: parsed.details?.color || 'unknown',
        secondaryColors: parsed.details?.secondaryColors || [],
        material: parsed.details?.material || 'unknown',
        pattern: parsed.details?.pattern || null,
        style: parsed.details?.style || null,
        gender: parsed.details?.gender || 'unisex',
        estimatedSize: parsed.details?.estimatedSize || 'M',
        season: parsed.details?.season || 'all-season',
        era: parsed.details?.era || null
      },
      features: parsed.features || [],
      suggestedKeywords: parsed.suggestedKeywords || [],
      listingTitle: parsed.listingTitle || '',
      priceEstimate: parsed.priceEstimate || {
        low: 10,
        high: 50,
        suggested: 25,
        reasoning: 'Based on condition and type'
      }
    };
  } catch (error) {
    console.error('Error parsing Claude response:', error);
    // Return a default structure if parsing fails
    return {
      itemType: 'item',
      brand: { name: null, confidence: 0 },
      condition: { assessment: 'GOOD', score: 50, issues: [], positives: [] },
      measurements: { hasRuler: false, detected: {} },
      details: {
        color: 'unknown',
        secondaryColors: [],
        material: 'unknown',
        gender: 'unisex',
        estimatedSize: 'M'
      },
      features: [],
      suggestedKeywords: [],
      listingTitle: '',
      priceEstimate: { low: 10, high: 50, suggested: 25 }
    };
  }
}

// Detect ruler in image for measurements
export async function detectRulerInImage(visionData) {
  const objects = visionData.objects || [];
  const labels = visionData.labels || [];
  const text = visionData.fullTextAnnotation || '';
  
  // Check for ruler indicators
  const rulerIndicators = [
    'ruler', 'tape measure', 'measuring tape', 'measurement', 
    'inch', 'inches', 'cm', 'centimeter', 'centimetre'
  ];
  
  let rulerDetected = false;
  let confidence = 0;
  let unit = 'inches'; // default
  
  // Check objects
  objects.forEach(obj => {
    if (rulerIndicators.some(indicator => 
      obj.name.toLowerCase().includes(indicator)
    )) {
      rulerDetected = true;
      confidence = Math.max(confidence, obj.score || 0.8);
    }
  });
  
  // Check labels
  labels.forEach(label => {
    if (rulerIndicators.some(indicator => 
      label.description.toLowerCase().includes(indicator)
    )) {
      rulerDetected = true;
      confidence = Math.max(confidence, label.score || 0.7);
    }
  });
  
  // Check text for measurement units
  if (text.toLowerCase().includes('cm') || text.toLowerCase().includes('centimeter')) {
    unit = 'cm';
  }
  
  // Look for measurement numbers in text
  const measurementPattern = /\d+(\.\d+)?[\s]*(cm|inch|inches|")/gi;
  const measurements = text.match(measurementPattern);
  if (measurements && measurements.length > 0) {
    rulerDetected = true;
    confidence = Math.max(confidence, 0.6);
  }
  
  return {
    isPresent: rulerDetected,
    confidence: confidence,
    unit: unit,
    detectedMeasurements: measurements || [],
    boundingBox: objects.find(o => 
      o.name.toLowerCase().includes('ruler')
    )?.boundingPoly || null
  };
}

// Process batch of images
export async function processBatchImages(images, bagNumber, manualOverrides = {}) {
  const results = [];
  
  for (let i = 0; i < images.length; i++) {
    try {
      const imageBase64 = images[i];
      
      // Step 1: Google Vision Analysis
      console.log(`Analyzing image ${i + 1}/${images.length} with Vision API...`);
      const visionData = await analyzeImageWithVision(imageBase64);
      
      // Step 2: Ruler Detection
      const rulerData = await detectRulerInImage(visionData);
      
      // Step 3: Claude Analysis
      console.log(`Analyzing with Claude AI...`);
      const claudeAnalysis = await analyzeFashionWithClaude(visionData, imageBase64);
      
      // Step 4: Apply manual overrides
      if (manualOverrides.size?.[i]) {
        claudeAnalysis.details.estimatedSize = manualOverrides.size[i];
      }
      if (manualOverrides.gender?.[i]) {
        claudeAnalysis.details.gender = manualOverrides.gender[i];
      }
      
      // Step 5: Compile results
      results.push({
        imageIndex: i,
        visionData: visionData,
        rulerDetection: rulerData,
        aiAnalysis: claudeAnalysis,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`Error processing image ${i + 1}:`, error);
      results.push({
        imageIndex: i,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return results;
}

// Validate API keys are present
export function validateAPIConfiguration() {
  const errors = [];
  
  if (!process.env.ANTHROPIC_API_KEY) {
    errors.push('Missing ANTHROPIC_API_KEY environment variable');
  }
  
  if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
    errors.push('Missing GOOGLE_CLOUD_VISION_API_KEY environment variable');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}
