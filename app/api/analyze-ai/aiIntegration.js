// aiIntegration.js - Enhanced size detection
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

// Standardize size format
function standardizeSize(sizeInfo) {
  if (!sizeInfo || !sizeInfo.detectedSize || sizeInfo.detectedSize === 'Not Visible') {
    return sizeInfo;
  }
  
  let size = sizeInfo.detectedSize.toUpperCase().trim();
  
  // Common size standardizations
  const sizeMap = {
    'EXTRA SMALL': 'XS',
    'XSMALL': 'XS',
    'X-SMALL': 'XS',
    'SMALL': 'S',
    'MEDIUM': 'M',
    'MED': 'M',
    'LARGE': 'L',
    'LRG': 'L',
    'LGE': 'L',
    'EXTRA LARGE': 'XL',
    'XLARGE': 'XL',
    'X-LARGE': 'XL',
    'XX-LARGE': 'XXL',
    'XXLARGE': 'XXL',
    '2XL': 'XXL',
    '3XL': 'XXXL',
    '4XL': 'XXXXL'
  };
  
  // Check if it's a word size that needs conversion
  for (const [key, value] of Object.entries(sizeMap)) {
    if (size.includes(key)) {
      size = size.replace(key, value);
    }
  }
  
  // Format multi-system sizes (e.g., "M/38/10")
  if (sizeInfo.sizeSystem && sizeInfo.sizeSystem !== 'Standard') {
    size = `${size} (${sizeInfo.sizeSystem})`;
  }
  
  return {
    ...sizeInfo,
    detectedSize: size
  };
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

CRITICAL SIZE DETECTION RULES:
1. Look for size tags in ALL typical locations:
   - Neck labels (back of neck)
   - Side seam tags
   - Waistband tags (for bottoms)
   - Care label tags
   - Separate size tags
2. Understand different sizing systems:
   - Letter sizes: XS, S, M, L, XL, XXL, XXXL
   - UK sizes: 6, 8, 10, 12, 14, 16, 18, 20
   - US sizes: 0, 2, 4, 6, 8, 10, 12, 14
   - EU sizes: 34, 36, 38, 40, 42, 44, 46, 48
   - IT sizes: 38, 40, 42, 44, 46, 48, 50
   - FR sizes: 34, 36, 38, 40, 42, 44
   - Men's chest: 34", 36", 38", 40", 42", 44"
   - Men's waist: 28", 30", 32", 34", 36", 38"
3. If you see multiple sizing systems on one tag (e.g., "M/38/10"), report all
4. Look for size indicators in text like:
   - "Size M", "Taille 38", "Taglia 42", "Größe 40"
   - Chest/bust measurements
   - Length indicators (Regular, Long, Short)
5. If you see a ruler or tape measure in any image:
   - Note which measurements are visible
   - Record the actual measurements shown
   - This indicates seller provides exact measurements
6. Common size locations by item type:
   - Shirts/tops: Back neck label
   - Pants/jeans: Back waistband
   - Dresses: Side seam or back neck
   - Outerwear: Inside left chest
   - Shoes: Inside tongue or insole

IMPORTANT: This is ONE item shown from multiple angles. Analyze all images together to extract:
- Brand name (check all images for brand tags, labels, logos)
- Size (check ALL possible locations across all images)
- Condition (assess from all angles)
- Material (check care labels in any image)
- Measurements if ruler/tape measure visible
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
  "sizeInfo": {
    "detectedSize": "primary size (e.g., 'M', '38', '10')",
    "sizeSystem": "UK/US/EU/IT/Letter or 'Multi' if multiple shown",
    "allSizes": "if multiple systems shown (e.g., 'M/38/10')",
    "sizeLocation": "where size was found (neck label, waist tag, etc)",
    "foundInImage": "which image number showed the size"
  },
  "color": "primary color(s)",
  "material": "detected material or 'Not Specified'",
  "gender": "Men's/Women's/Unisex",
  "estimatedPrice": {
    "min": minimum price in GBP,
    "max": maximum price in GBP
  },
  "keyFeatures": ["list", "of", "notable", "features", "from", "all", "images"],
  "measurements": {
    "chest": "if visible with ruler/tape",
    "length": "if visible with ruler/tape",
    "shoulders": "if visible with ruler/tape",
    "waist": "if visible with ruler/tape",
    "inseam": "if visible with ruler/tape",
    "hasRuler": true/false
  },
  "ebayCategory": "most appropriate eBay category"
}

Remember: 
- This is ONE item. Use the clearest size tag if multiple images show size
- NEVER include punctuation in the brand name
- If measurements are shown with ruler/tape measure, note exact measurements
- Report the most complete size information available across all images`;

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
      
      // Handle old format for backward compatibility
      if (parsed.size && !parsed.sizeInfo) {
        parsed.sizeInfo = {
          detectedSize: parsed.size,
          sizeSystem: 'Standard',
          allSizes: parsed.size,
          sizeLocation: 'Not specified',
          foundInImage: 'Not specified'
        };
      }
      
      // Standardize the size format
      if (parsed.sizeInfo) {
        parsed.sizeInfo = standardizeSize(parsed.sizeInfo);
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
        
        // Handle old format for backward compatibility
        if (parsed.size && !parsed.sizeInfo) {
          parsed.sizeInfo = {
            detectedSize: parsed.size,
            sizeSystem: 'Standard',
            allSizes: parsed.size,
            sizeLocation: 'Not specified',
            foundInImage: 'Not specified'
          };
        }
        
        // Standardize the size format
        if (parsed.sizeInfo) {
          parsed.sizeInfo = standardizeSize(parsed.sizeInfo);
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
    
    // Extract size from new format
    const size = claudeAnalysis.sizeInfo?.detectedSize || claudeAnalysis.size || 'Not Visible';
    
    // Step 3: Generate eBay title (will also clean brand name)
    const ebayTitle = generateEbayTitle({
      brand: claudeAnalysis.brand.name,
      itemType: claudeAnalysis.itemType,
      size: size,
      color: claudeAnalysis.color,
      gender: claudeAnalysis.gender,
      keyFeatures: claudeAnalysis.keyFeatures
    });
    
    // Step 4: Generate SKU
    const sku = generateSKU(claudeAnalysis.brand.name, claudeAnalysis.itemType);
    
    // Step 5: Generate description with all details
    const description = generateDetailedDescription(claudeAnalysis, imageBase64Array.length);
    
    // Apply measurement-based pricing boost
    let priceBoost = 1;
    if (claudeAnalysis.measurements && claudeAnalysis.measurements.hasRuler) {
      priceBoost = 1.35; // 35% boost for items with measurements
      console.log('Applying 35% price boost for measured item');
    }
    
    // Create single result
    const item = {
      imageCount: imageBase64Array.length,
      brand: claudeAnalysis.brand,
      itemType: claudeAnalysis.itemType,
      condition: claudeAnalysis.condition,
      size: size, // Keep simple size for compatibility
      sizeInfo: claudeAnalysis.sizeInfo, // New detailed size info
      color: claudeAnalysis.color,
      material: claudeAnalysis.material,
      gender: claudeAnalysis.gender,
      estimatedPrice: {
        min: Math.round(claudeAnalysis.estimatedPrice.min * priceBoost),
        max: Math.round(claudeAnalysis.estimatedPrice.max * priceBoost)
      },
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
  
  // Enhanced size information
  if (analysis.sizeInfo && analysis.sizeInfo.detectedSize !== 'Not Visible') {
    if (analysis.sizeInfo.allSizes && analysis.sizeInfo.allSizes !== analysis.sizeInfo.detectedSize) {
      parts.push(`Size: ${analysis.sizeInfo.allSizes}`);
    } else {
      parts.push(`Size: ${analysis.sizeInfo.detectedSize}`);
    }
    
    if (analysis.sizeInfo.sizeLocation && analysis.sizeInfo.sizeLocation !== 'Not specified') {
      parts.push(`Size tag location: ${analysis.sizeInfo.sizeLocation}`);
    }
  } else if (analysis.size && analysis.size !== 'Not Visible') {
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
    if (analysis.measurements.waist) measurements.push(`Waist: ${analysis.measurements.waist}`);
    if (analysis.measurements.inseam) measurements.push(`Inseam: ${analysis.measurements.inseam}`);
    
    if (measurements.length > 0) {
      parts.push(`Measurements: ${measurements.join(', ')}`);
      if (analysis.measurements.hasRuler) {
        parts.push(`Exact measurements provided with ruler`);
      }
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