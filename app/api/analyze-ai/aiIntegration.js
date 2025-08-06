// aiIntegration.js - Enhanced brand detection
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

// Clean brand name - remove unwanted punctuation
function cleanBrandName(brandName) {
  if (!brandName) return 'Unknown';
  
  // Remove unwanted punctuation and clean up
  let cleaned = brandName
    .replace(/[,!?']/g, '') // Remove commas, exclamation marks, question marks, apostrophes
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  // Handle specific brand exceptions
  const brandExceptions = {
    'YSL': 'Yves Saint Laurent',
    'LV': 'Louis Vuitton',
    'D&G': 'Dolce & Gabbana',
    'CK': 'Calvin Klein',
    'A&F': 'Abercrombie & Fitch',
    'H&M': 'H&M', // Keep as is
    'M&S': 'Marks & Spencer'
  };
  
  // Check if it matches a known abbreviation
  const upperCleaned = cleaned.toUpperCase();
  if (brandExceptions[upperCleaned]) {
    return brandExceptions[upperCleaned];
  }
  
  // Capitalize properly
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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

// Analyze ALL images as ONE fashion item with Claude AI
async function analyzeFashionItemWithClaude(allVisionData, allImages) {
  try {
    // Combine all vision data from all images
    let combinedText = '';
    let allLabels = [];
    let allLogos = [];
    let allColors = [];
    
    allVisionData.forEach((visionData, index) => {
      // Combine text from all images
      const text = visionData?.textAnnotations?.[0]?.description || '';
      if (text) {
        combinedText += `\n\nImage ${index + 1} text: ${text}`;
      }
      
      // Combine labels
      const labels = visionData?.labelAnnotations?.map(l => l.description) || [];
      allLabels.push(...labels);
      
      // Combine logos
      const logos = visionData?.logoAnnotations?.map(l => l.description) || [];
      allLogos.push(...logos);
      
      // Combine colors
      const colors = visionData?.imagePropertiesAnnotation?.dominantColors?.colors?.map(c => {
        const rgb = c.color;
        return `rgb(${rgb.red || 0},${rgb.green || 0},${rgb.blue || 0})`;
      }) || [];
      allColors.push(...colors);
    });
    
    // Remove duplicates
    allLabels = [...new Set(allLabels)];
    allLogos = [...new Set(allLogos)];
    allColors = [...new Set(allColors)].slice(0, 5); // Top 5 colors
    
    const prompt = `You are an expert fashion analyst for eBay reselling. I'm showing you ${allImages.length} images of THE SAME fashion item from different angles. Analyze all images together to provide comprehensive information about this single item.

Combined text from all ${allImages.length} images: ${combinedText}
All detected labels: ${allLabels.join(', ')}
All detected logos: ${allLogos.join(', ')}
Dominant colors: ${allColors.join(', ')}

CRITICAL BRAND DETECTION RULES:
1. Look for brand names on labels, tags, logos, buttons, zippers, and hardware
2. Check neck labels, waist tags, care labels, and brand stamps
3. Common brand indicators:
   - Embroidered logos or text
   - Metal hardware with brand names
   - Distinctive patterns (Burberry check, LV monogram, Gucci stripes)
   - Button/zipper engravings
   - Inside tags and labels
4. If you see abbreviations, expand them:
   - YSL = Yves Saint Laurent
   - LV = Louis Vuitton
   - CK = Calvin Klein
   - D&G = Dolce & Gabbana
5. IMPORTANT: Remove ALL punctuation from brand names (no commas, apostrophes, exclamation marks, question marks)
6. If multiple potential brands are visible, choose the primary/manufacturer brand
7. Look for subtle brand indicators:
   - Signature stitching patterns
   - Specific button styles
   - Hardware shapes
   - Label colors and fonts

IMPORTANT: This is ONE item shown from multiple angles. Analyze all images together to extract:
- Brand name (check all images for brand tags, labels, logos)
- Size (check neck labels, waist tags, size tags in all images)
- Condition (assess from all angles)
- Material (check care labels in any image)
- Measurements if visible
- Any flaws or defects visible in any image

Please provide a SINGLE analysis combining information from ALL images in JSON format:
{
  "brand": {
    "name": "detected brand name with NO punctuation or 'Unknown'",
    "confidence": 0.0 to 1.0,
    "foundInImage": "which image number showed the brand",
    "brandLocation": "where on item (neck label, waist tag, button, etc)"
  },
  "itemType": "specific item type (e.g., 'T-Shirt', 'Jeans', 'Dress')",
  "condition": {
    "score": 1-10 (10 being new with tags),
    "description": "brief condition description",
    "flaws": ["list any flaws seen in any image"]
  },
  "size": "detected size or 'Not Visible'",
  "color": "primary color(s)",
  "material": "detected material or 'Not Specified'",
  "gender": "Men's/Women's/Unisex",
  "estimatedPrice": {
    "min": minimum price in GBP,
    "max": maximum price in GBP
  },
  "keyFeatures": ["list", "of", "notable", "features", "from", "all", "images"],
  "measurements": {
    "chest": "if visible",
    "length": "if visible",
    "shoulders": "if visible"
  },
  "ebayCategory": "most appropriate eBay category"
}

Remember: 
- This is ONE item. If you see different information in different images (like size tags), use the most reliable/clear one.
- NEVER include punctuation in the brand name (no commas, apostrophes, !, ?)
- If you see Roman numerals on minimalist clothing, it's likely OSKA brand
- Look beyond obvious labels - check buttons, zippers, hardware for brand names`;

    // Create content array with all images
    const content = [
      {
        type: 'text',
        text: prompt
      }
    ];
    
    // Add all images to the request
    allImages.forEach((imageBase64, index) => {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: cleanBase64(imageBase64)
        }
      });
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: content
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseContent = data.content[0].text;
    
    // Parse JSON from Claude's response
    try {
      const parsed = JSON.parse(responseContent);
      
      // Clean the brand name before returning
      if (parsed.brand && parsed.brand.name) {
        parsed.brand.name = cleanBrandName(parsed.brand.name);
      }
      
      return parsed;
    } catch (e) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Clean the brand name before returning
        if (parsed.brand && parsed.brand.name) {
          parsed.brand.name = cleanBrandName(parsed.brand.name);
        }
        
        return parsed;
      }
      throw new Error('Could not parse Claude response as JSON');
    }
  } catch (error) {
    console.error('Claude API Error:', error);
    throw error;
  }
}

// Main processing function - MODIFIED to treat all images as ONE item
export async function processBatchImages(imageBase64Array) {
  console.log(`Processing ${imageBase64Array.length} images as ONE item...`);
  
  try {
    // Step 1: Analyze all images with Google Vision first
    console.log('Running Google Vision on all images...');
    const visionPromises = imageBase64Array.map(image => analyzeImageWithVision(image));
    const allVisionData = await Promise.all(visionPromises);
    
    // Step 2: Send ALL images and vision data to Claude for ONE combined analysis
    console.log('Analyzing all images together with Claude AI...');
    const claudeAnalysis = await analyzeFashionItemWithClaude(allVisionData, imageBase64Array);
    
    // Step 3: Generate eBay title (will also clean brand name)
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
    
    // Step 5: Generate description with all details
    const description = generateDetailedDescription(claudeAnalysis, imageBase64Array.length);
    
    // Create single result
    const item = {
      imageCount: imageBase64Array.length,
      brand: claudeAnalysis.brand,
      itemType: claudeAnalysis.itemType,
      condition: claudeAnalysis.condition,
      size: claudeAnalysis.size,
      color: claudeAnalysis.color,
      material: claudeAnalysis.material,
      gender: claudeAnalysis.gender,
      estimatedPrice: claudeAnalysis.estimatedPrice,
      keyFeatures: claudeAnalysis.keyFeatures,
      measurements: claudeAnalysis.measurements || {},
      ebayCategory: claudeAnalysis.ebayCategory,
      ebayTitle: ebayTitle,
      sku: sku,
      description: description,
      timestamp: new Date().toISOString()
    };
    
    // Calculate value
    const avgPrice = (item.estimatedPrice.min + item.estimatedPrice.max) / 2;
    
    return {
      items: [item], // Single item
      summary: {
        totalItems: 1,
        totalValue: Math.round(avgPrice),
        avgItemValue: Math.round(avgPrice),
        totalImages: imageBase64Array.length
      },
      errors: [],
      tokensUsed: 1
    };
    
  } catch (error) {
    console.error('Error processing images:', error);
    return {
      items: [],
      summary: {
        totalItems: 0,
        totalValue: 0,
        avgItemValue: 0,
        totalImages: imageBase64Array.length
      },
      errors: [{
        error: error.message,
        timestamp: new Date().toISOString()
      }],
      tokensUsed: 0
    };
  }
}

// Helper function to generate SKU
function generateSKU(brand, itemType) {
  const brandCode = (brand || 'UNK').substring(0, 3).toUpperCase();
  const itemCode = (itemType || 'ITM').substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${brandCode}-${itemCode}-${timestamp}`;
}

// Enhanced description generator
function generateDetailedDescription(analysis, imageCount) {
  const parts = [];
  
  parts.push(`${analysis.brand.name} ${analysis.itemType}`);
  parts.push(`${imageCount} photos showing all angles`);
  
  if (analysis.size !== 'Not Visible') {
    parts.push(`Size: ${analysis.size}`);
  }
  
  parts.push(`Condition: ${analysis.condition.description} (${analysis.condition.score}/10)`);
  
  if (analysis.condition.flaws && analysis.condition.flaws.length > 0) {
    parts.push(`Note: ${analysis.condition.flaws.join(', ')}`);
  }
  
  if (analysis.material !== 'Not Specified') {
    parts.push(`Material: ${analysis.material}`);
  }
  
  // Add measurements if available
  if (analysis.measurements) {
    const measurements = [];
    if (analysis.measurements.chest) measurements.push(`Chest: ${analysis.measurements.chest}`);
    if (analysis.measurements.length) measurements.push(`Length: ${analysis.measurements.length}`);
    if (analysis.measurements.shoulders) measurements.push(`Shoulders: ${analysis.measurements.shoulders}`);
    if (measurements.length > 0) {
      parts.push(`Measurements: ${measurements.join(', ')}`);
    }
  }
  
  if (analysis.keyFeatures && analysis.keyFeatures.length > 0) {
    parts.push(`Features: ${analysis.keyFeatures.join(', ')}`);
  }
  
  // Add brand location info if available
  if (analysis.brand.brandLocation) {
    parts.push(`Brand verified on: ${analysis.brand.brandLocation}`);
  }
  
  return parts.join('\n');
}