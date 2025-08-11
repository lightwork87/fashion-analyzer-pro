import { GoogleGenerativeAI } from '@google/generative-ai';
import { brandDatabase } from './brandDatabase';
import { analyzeCondition } from './conditionAnalyzer';
import { generateEbayTitle } from './titleGenerator';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_CLOUD_VISION_API_KEY);

// Helper function to convert base64 to Gemini format
function base64ToGenerativePart(base64Image, mimeType = 'image/jpeg') {
  return {
    inlineData: {
      data: base64Image,
      mimeType
    }
  };
}

// Construct the enhanced prompt for eBay-specific analysis
function constructPrompt() {
  return `You are an expert fashion analyst specializing in identifying clothing items for eBay resale. 
  
  Analyze these fashion images and provide detailed information in the following JSON format:

  {
    "itemType": "specific type of clothing (e.g., 'T-Shirt', 'Dress', 'Jeans', 'Blazer')",
    "brand": {
      "name": "brand name if visible (or 'Unknown' if not identifiable)",
      "confidence": "high/medium/low",
      "reasoning": "why you identified this brand"
    },
    "size": "size if visible on tag (or 'Not Visible' if not shown)",
    "color": "primary color(s)",
    "material": "fabric/material if visible on tag (or 'Not Specified')",
    "condition": {
      "score": 1-10 (10 being new with tags),
      "description": "detailed condition description",
      "defects": ["list any visible defects or wear"]
    },
    "gender": "Men/Women/Unisex/Kids (leave empty string if unclear)",
    "department": "Men/Women/Unisex/Kids (leave empty string if unclear)",
    "sizeType": "Regular/Plus/Petite/Big & Tall (leave empty string if unclear)",
    "style": "Casual/Formal/Athletic/Business/Party (leave empty string if unclear)",
    "pattern": "Solid/Striped/Floral/Plaid/Geometric/Abstract (leave empty string if unclear)",
    "sleeveLength": "Short Sleeve/Long Sleeve/3/4 Sleeve/Sleeveless/Cap Sleeve (leave empty string if not applicable)",
    "occasion": "Casual/Business/Formal/Party/Wedding/Athletic (leave empty string if unclear)",
    "season": "All Seasons/Spring/Summer/Fall/Winter (leave empty string if unclear)",
    "theme": "Classic/Modern/Vintage/Designer/Retro (leave empty string if unclear)",
    "features": ["list visible features like pockets, zippers, buttons, collars, hoods, etc"],
    "garmentCare": "care instructions if visible on tag (leave empty string if not visible)",
    "countryOfManufacture": "country if visible on tag (leave empty string if not visible)",
    "measurements": {
      "chest": "measurement if provided",
      "length": "measurement if provided",
      "waist": "measurement if provided",
      "inseam": "measurement if provided"
    },
    "keyFeatures": ["list 3-5 key selling points"],
    "estimatedPrice": {
      "min": suggested minimum price in USD,
      "max": suggested maximum price in USD,
      "reasoning": "brief explanation of pricing"
    }
  }

  IMPORTANT RULES:
  1. Only provide information you can clearly see or identify with confidence
  2. For any field you cannot determine, use an empty string "" not null
  3. Be specific about item types (e.g., "Button-Down Shirt" not just "Shirt")
  4. If brand is unknown but item appears designer/high-end, note this in reasoning
  5. For condition, consider: tags, stains, pilling, fading, tears, missing buttons
  6. Identify all visible text on tags including RN numbers, care symbols
  7. Note any unique identifiers, logos, or distinguishing features
  8. Consider seasonality and current fashion trends for pricing
  
  Return ONLY valid JSON without any markdown formatting or backticks.`;
}

// Process multiple images with AI
async function processWithGemini(base64Images) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Prepare image parts
    const imageParts = base64Images.map(img => base64ToGenerativePart(img));
    
    // Create the prompt
    const prompt = constructPrompt();
    
    // Generate content with all images
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini raw response:', text);
    
    // Clean and parse the response
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const analysis = JSON.parse(cleanedText);
    
    // Ensure all fields exist with proper defaults
    return {
      ...analysis,
      gender: analysis.gender || '',
      department: analysis.department || analysis.gender || '',
      sizeType: analysis.sizeType || '',
      style: analysis.style || '',
      pattern: analysis.pattern || '',
      sleeveLength: analysis.sleeveLength || '',
      occasion: analysis.occasion || '',
      season: analysis.season || 'All Seasons',
      theme: analysis.theme || '',
      features: analysis.features || [],
      garmentCare: analysis.garmentCare || '',
      countryOfManufacture: analysis.countryOfManufacture || '',
      measurements: analysis.measurements || {},
      keyFeatures: analysis.keyFeatures || []
    };
    
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

// Process with Anthropic Claude as fallback
async function processWithAnthropic(base64Images) {
  try {
    const imageMessages = base64Images.map((img, index) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: img
      }
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: constructPrompt()
            },
            ...imageMessages
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.content[0].text;
    
    console.log('Anthropic raw response:', text);
    
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const analysis = JSON.parse(cleanedText);
    
    // Ensure all fields exist with proper defaults
    return {
      ...analysis,
      gender: analysis.gender || '',
      department: analysis.department || analysis.gender || '',
      sizeType: analysis.sizeType || '',
      style: analysis.style || '',
      pattern: analysis.pattern || '',
      sleeveLength: analysis.sleeveLength || '',
      occasion: analysis.occasion || '',
      season: analysis.season || 'All Seasons',
      theme: analysis.theme || '',
      features: analysis.features || [],
      garmentCare: analysis.garmentCare || '',
      countryOfManufacture: analysis.countryOfManufacture || '',
      measurements: analysis.measurements || {},
      keyFeatures: analysis.keyFeatures || []
    };
    
  } catch (error) {
    console.error('Anthropic API error:', error);
    throw error;
  }
}

// Main processing function
export async function processBatchImages(base64Images) {
  console.log(`Processing ${base64Images.length} images with AI...`);
  
  try {
    let aiAnalysis;
    
    // Try Gemini first
    try {
      console.log('Attempting analysis with Gemini...');
      aiAnalysis = await processWithGemini(base64Images);
      console.log('Gemini analysis successful');
    } catch (geminiError) {
      console.log('Gemini failed, falling back to Anthropic:', geminiError.message);
      aiAnalysis = await processWithAnthropic(base64Images);
      console.log('Anthropic analysis successful');
    }
    
    // Enhance with our brand database
    const enhancedBrand = brandDatabase.searchBrand(aiAnalysis.brand.name);
    if (enhancedBrand) {
      aiAnalysis.brand = {
        ...aiAnalysis.brand,
        ...enhancedBrand,
        verified: true
      };
    }
    
    // Generate optimized eBay title
    const ebayTitle = generateEbayTitle({
      brand: aiAnalysis.brand.name,
      itemType: aiAnalysis.itemType,
      size: aiAnalysis.size,
      color: aiAnalysis.color,
      material: aiAnalysis.material,
      style: aiAnalysis.style,
      pattern: aiAnalysis.pattern,
      features: aiAnalysis.keyFeatures
    });
    
    // Generate SKU
    const sku = generateSKU(aiAnalysis);
    
    // Generate comprehensive description
    const description = generateDescription(aiAnalysis);
    
    return {
      success: true,
      items: [{
        ...aiAnalysis,
        ebayTitle,
        sku,
        description,
        imageCount: base64Images.length,
        processedAt: new Date().toISOString()
      }],
      imagesProcessed: base64Images.length
    };
    
  } catch (error) {
    console.error('Processing error:', error);
    return {
      success: false,
      error: error.message,
      items: []
    };
  }
}

// Generate SKU
function generateSKU(analysis) {
  const brand = (analysis.brand?.name || 'UNK').substring(0, 3).toUpperCase();
  const type = (analysis.itemType || 'ITEM').substring(0, 3).toUpperCase();
  const size = (analysis.size || 'NS').replace(/[^A-Z0-9]/g, '').substring(0, 3);
  const timestamp = Date.now().toString().slice(-6);
  
  return `${brand}-${type}-${size}-${timestamp}`;
}

// Generate comprehensive eBay description
function generateDescription(analysis) {
  const sections = [];
  
  // Title section
  sections.push(`${analysis.brand.name !== 'Unknown' ? analysis.brand.name + ' ' : ''}${analysis.itemType}`);
  sections.push('');
  
  // Condition section
  sections.push('CONDITION:');
  sections.push(analysis.condition.description);
  if (analysis.condition.defects && analysis.condition.defects.length > 0) {
    sections.push(`Note: ${analysis.condition.defects.join(', ')}`);
  }
  sections.push('');
  
  // Details section
  sections.push('DETAILS:');
  const details = [];
  
  if (analysis.brand.name !== 'Unknown') details.push(`• Brand: ${analysis.brand.name}`);
  if (analysis.size !== 'Not Visible') details.push(`• Size: ${analysis.size}`);
  if (analysis.sizeType) details.push(`• Size Type: ${analysis.sizeType}`);
  if (analysis.color) details.push(`• Color: ${analysis.color}`);
  if (analysis.material !== 'Not Specified') details.push(`• Material: ${analysis.material}`);
  if (analysis.style) details.push(`• Style: ${analysis.style}`);
  if (analysis.pattern) details.push(`• Pattern: ${analysis.pattern}`);
  if (analysis.sleeveLength) details.push(`• Sleeve Length: ${analysis.sleeveLength}`);
  if (analysis.department) details.push(`• Department: ${analysis.department}`);
  if (analysis.season && analysis.season !== 'All Seasons') details.push(`• Season: ${analysis.season}`);
  if (analysis.occasion) details.push(`• Occasion: ${analysis.occasion}`);
  if (analysis.garmentCare) details.push(`• Care Instructions: ${analysis.garmentCare}`);
  if (analysis.countryOfManufacture) details.push(`• Made in: ${analysis.countryOfManufacture}`);
  
  sections.push(...details);
  sections.push('');
  
  // Features section
  if (analysis.features && analysis.features.length > 0) {
    sections.push('FEATURES:');
    analysis.features.forEach(feature => {
      sections.push(`• ${feature}`);
    });
    sections.push('');
  }
  
  // Measurements section (if available)
  const measurements = Object.entries(analysis.measurements || {});
  if (measurements.length > 0) {
    sections.push('MEASUREMENTS (approximate):');
    measurements.forEach(([key, value]) => {
      if (value) sections.push(`• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
    });
    sections.push('');
  }
  
  // Key features/selling points
  if (analysis.keyFeatures && analysis.keyFeatures.length > 0) {
    sections.push('KEY FEATURES:');
    analysis.keyFeatures.forEach(feature => {
      sections.push(`• ${feature}`);
    });
    sections.push('');
  }
  
  // Shipping note
  sections.push('SHIPPING:');
  sections.push('• Item will be carefully packaged and shipped within 1 business day');
  sections.push('• Please see shipping details above for costs and delivery times');
  sections.push('');
  
  // Returns note
  sections.push('RETURNS:');
  sections.push('• We accept returns within 30 days of delivery');
  sections.push('• Please review our return policy above for full details');
  
  return sections.join('\n');
}