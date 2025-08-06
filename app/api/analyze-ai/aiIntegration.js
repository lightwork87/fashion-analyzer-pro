// aiIntegration.js - Fixed with correct Claude model name
import { getBrandInfo, findBrandInText, brandDatabase } from './brandDatabase';
import { analyzeCondition } from './conditionAnalyzer';
import { generateEbayTitle } from './titleGenerator';

// Helper function to clean base64 string
function cleanBase64(base64String) {
  if (typeof base64String !== 'string') {
    return '';
  }
  return base64String.replace(/^data:image\/[a-z]+;base64,/, '');
}

// Analyze image with Google Vision API
async function analyzeImageWithVision(imageBase64) {
  try {
    const cleanedBase64 = cleanBase64(imageBase64);
    
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
              content: cleanedBase64
            },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 10 },
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'LOGO_DETECTION', maxResults: 5 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
              { type: 'IMAGE_PROPERTIES', maxResults: 1 }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vision API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.responses[0];
  } catch (error) {
    console.error('Vision API Error:', error);
    throw error;
  }
}

// Analyze fashion item with Claude AI
async function analyzeFashionWithClaude(visionData, imageBase64) {
  try {
    const cleanedBase64 = cleanBase64(imageBase64);
    
    // Extract text and labels from Vision API results
    const extractedText = visionData?.textAnnotations?.[0]?.description || '';
    const labels = visionData?.labelAnnotations?.map(l => l.description) || [];
    const logos = visionData?.logoAnnotations?.map(l => l.description) || [];
    
    const prompt = `You are an expert fashion analyst for eBay reselling. Analyze this fashion item image and provide detailed information.

Extracted text from image: ${extractedText}
Detected labels: ${labels.join(', ')}
Detected logos: ${logos.join(', ')}

Please analyze and provide the following in JSON format:
{
  "brand": {
    "name": "detected brand name or 'Unknown'",
    "confidence": 0.0 to 1.0
  },
  "itemType": "specific item type (e.g., 'T-Shirt', 'Jeans', 'Dress')",
  "condition": {
    "score": 1-10 (10 being new with tags),
    "description": "brief condition description"
  },
  "size": "detected size or 'Not Visible'",
  "color": "primary color",
  "material": "detected material or 'Not Specified'",
  "gender": "Men's/Women's/Unisex",
  "estimatedPrice": {
    "min": minimum price in GBP,
    "max": maximum price in GBP
  },
  "keyFeatures": ["list", "of", "notable", "features"],
  "ebayCategory": "most appropriate eBay category"
}

Be accurate and conservative with pricing. If you see Roman numerals, it's likely the OSKA brand.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',  // FIXED: Correct model name
        max_tokens: 4000,
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
                  data: cleanedBase64
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse JSON from Claude's response
    try {
      return JSON.parse(content);
    } catch (e) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Could not parse Claude response as JSON');
    }
  } catch (error) {
    console.error('Claude API Error:', error);
    throw error;
  }
}

// Process a single image
async function processSingleImage(imageBase64, index) {
  try {
    console.log(`Processing image ${index + 1}...`);
    
    // Step 1: Google Vision API
    const visionData = await analyzeImageWithVision(imageBase64);
    
    // Step 2: Claude AI Analysis
    const claudeAnalysis = await analyzeFashionWithClaude(visionData, imageBase64);
    
    // Step 3: Generate eBay title
    const ebayTitle = generateEbayTitle({
      brand: claudeAnalysis.brand.name,
      itemType: claudeAnalysis.itemType,
      size: claudeAnalysis.size,
      color: claudeAnalysis.color,
      gender: claudeAnalysis.gender,
      keyFeatures: claudeAnalysis.keyFeatures
    });
    
    // Step 4: Generate SKU
    const sku = generateSKU(claudeAnalysis.brand.name, claudeAnalysis.itemType);
    
    // Step 5: Format final result
    return {
      imageIndex: index,
      brand: claudeAnalysis.brand,
      itemType: claudeAnalysis.itemType,
      condition: claudeAnalysis.condition,
      size: claudeAnalysis.size,
      color: claudeAnalysis.color,
      material: claudeAnalysis.material,
      gender: claudeAnalysis.gender,
      estimatedPrice: claudeAnalysis.estimatedPrice,
      keyFeatures: claudeAnalysis.keyFeatures,
      ebayCategory: claudeAnalysis.ebayCategory,
      ebayTitle: ebayTitle,
      sku: sku,
      description: generateDescription(claudeAnalysis),
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`Error processing image ${index}:`, error);
    return {
      imageIndex: index,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Main processing function - OPTIMIZED FOR SPEED
export async function processBatchImages(imageBase64Array) {
  console.log(`Processing ${imageBase64Array.length} images in parallel...`);
  
  // Process images in batches to avoid overwhelming the APIs
  const batchSize = 3; // Process 3 images at a time
  const results = [];
  
  for (let i = 0; i < imageBase64Array.length; i += batchSize) {
    const batch = imageBase64Array.slice(i, i + batchSize);
    const batchPromises = batch.map((image, batchIndex) => 
      processSingleImage(image, i + batchIndex)
    );
    
    // Process batch in parallel
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    console.log(`Completed batch: ${Math.min(i + batchSize, imageBase64Array.length)}/${imageBase64Array.length}`);
  }
  
  // Calculate summary
  const successfulItems = results.filter(r => !r.error);
  const totalValue = successfulItems.reduce((sum, item) => 
    sum + ((item.estimatedPrice?.min || 0) + (item.estimatedPrice?.max || 0)) / 2, 0
  );
  
  return {
    items: successfulItems,
    summary: {
      totalItems: successfulItems.length,
      totalValue: Math.round(totalValue),
      avgItemValue: successfulItems.length > 0 ? Math.round(totalValue / successfulItems.length) : 0
    },
    errors: results.filter(r => r.error),
    tokensUsed: results.length
  };
}

// Helper function to generate SKU
function generateSKU(brand, itemType) {
  const brandCode = (brand || 'UNK').substring(0, 3).toUpperCase();
  const itemCode = (itemType || 'ITM').substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${brandCode}-${itemCode}-${timestamp}`;
}

// Helper function to generate description
function generateDescription(analysis) {
  const parts = [];
  
  parts.push(`${analysis.brand.name} ${analysis.itemType}`);
  
  if (analysis.size !== 'Not Visible') {
    parts.push(`Size: ${analysis.size}`);
  }
  
  parts.push(`Condition: ${analysis.condition.description} (${analysis.condition.score}/10)`);
  
  if (analysis.material !== 'Not Specified') {
    parts.push(`Material: ${analysis.material}`);
  }
  
  if (analysis.keyFeatures.length > 0) {
    parts.push(`Features: ${analysis.keyFeatures.join(', ')}`);
  }
  
  return parts.join('\n');
}