// app/api/analyze-combined/sku-label-recognition.js
// SKU Label Recognition and Text Extraction System

export class SKULabelRecognizer {
  constructor() {
    this.labelPatterns = {
      // Brand indicators on labels
      brandPatterns: {
        'oska': [/oska/i, /roman numeral/i, /I{1,3}|IV|V/],
        'chanel': [/chanel/i, /\bcc\b/i, /paris/i],
        'gucci': [/gucci/i, /italy/i, /made in italy/i],
        'prada': [/prada/i, /milano/i, /made in italy/i],
        'louis vuitton': [/louis vuitton/i, /\blv\b/i, /france/i],
        'burberry': [/burberry/i, /london/i, /england/i],
        'cos': [/\bcos\b/i, /h&m/i],
        'ganni': [/ganni/i, /denmark/i],
        'acne studios': [/acne studios/i, /acne/i, /sweden/i],
        'whistles': [/whistles/i, /london/i],
        'reiss': [/reiss/i, /london/i],
        'zara': [/zara/i, /inditex/i, /spain/i],
        'mango': [/mango/i, /spain/i],
        'h&m': [/h&m/i, /hennes/i, /mauritz/i],
        'uniqlo': [/uniqlo/i, /japan/i],
        'carhartt': [/carhartt/i, /wip/i, /usa/i, /detroit/i],
        'dickies': [/dickies/i, /usa/i]
      },

      // Size patterns
      sizePatterns: {
        roman: /\b([IVX]{1,4})\b/g,
        european: /\b(3[0-9]|4[0-8])\b/g,
        uk: /\b(6|8|10|12|14|16|18|20)\b/g,
        us: /\b(XS|S|M|L|XL|XXL|2XL|3XL)\b/gi,
        numeric: /\bSize:?\s*(\d+)\b/gi
      },

      // Material composition patterns
      materialPatterns: {
        cotton: /(\d+)%?\s*cotton/gi,
        polyester: /(\d+)%?\s*polyester/gi,
        wool: /(\d+)%?\s*wool/gi,
        linen: /(\d+)%?\s*linen/gi,
        silk: /(\d+)%?\s*silk/gi,
        cashmere: /(\d+)%?\s*cashmere/gi,
        viscose: /(\d+)%?\s*viscose/gi,
        modal: /(\d+)%?\s*modal/gi,
        elastane: /(\d+)%?\s*elastane/gi,
        spandex: /(\d+)%?\s*spandex/gi,
        nylon: /(\d+)%?\s*nylon/gi,
        acrylic: /(\d+)%?\s*acrylic/gi
      },

      // Care instruction patterns
      carePatterns: {
        machine_wash: /machine wash/gi,
        hand_wash: /hand wash/gi,
        dry_clean: /dry clean/gi,
        do_not_wash: /do not wash/gi,
        cold_wash: /30°?c?|cold/gi,
        warm_wash: /40°?c?|warm/gi,
        hot_wash: /60°?c?|hot/gi,
        tumble_dry: /tumble dry/gi,
        hang_dry: /hang dry|line dry/gi,
        iron_low: /iron low|cool iron/gi,
        iron_medium: /iron medium|warm iron/gi,
        iron_high: /iron high|hot iron/gi,
        no_iron: /do not iron/gi,
        no_bleach: /do not bleach/gi
      },

      // Country of origin patterns
      countryPatterns: {
        'made_in_italy': /made in italy/gi,
        'made_in_france': /made in france/gi,
        'made_in_uk': /made in (uk|england|britain)/gi,
        'made_in_germany': /made in germany/gi,
        'made_in_spain': /made in spain/gi,
        'made_in_portugal': /made in portugal/gi,
        'made_in_turkey': /made in turkey/gi,
        'made_in_china': /made in china/gi,
        'made_in_bangladesh': /made in bangladesh/gi,
        'made_in_vietnam': /made in vietnam/gi
      },

      // Style/SKU number patterns
      skuPatterns: {
        style_number: /style:?\s*([A-Z0-9\-]+)/gi,
        item_number: /item:?\s*([A-Z0-9\-]+)/gi,
        sku: /sku:?\s*([A-Z0-9\-]+)/gi,
        model: /model:?\s*([A-Z0-9\-]+)/gi,
        product_code: /product code:?\s*([A-Z0-9\-]+)/gi
      }
    };

    this.labelIndicators = [
      'care label', 'size tag', 'brand label', 'washing instructions',
      'composition', 'fabric content', 'made in', 'size:', 'style:',
      'material:', '%', 'machine wash', 'dry clean', '°c'
    ];
  }

  // Detect if an image likely contains a label
  detectLabelImage(imageDescription, imageIndex, totalImages) {
    const description = imageDescription.toLowerCase();
    
    // Check for label indicators
    const hasLabelIndicators = this.labelIndicators.some(indicator => 
      description.includes(indicator)
    );

    // Last image is often a label
    const isLastImage = imageIndex === totalImages - 1;

    // Check for text-heavy content
    const hasTextIndicators = /tag|label|text|writing|print/.test(description);

    return {
      isLikelyLabel: hasLabelIndicators || (isLastImage && hasTextIndicators),
      confidence: hasLabelIndicators ? 0.9 : 
                 isLastImage ? 0.7 : 
                 hasTextIndicators ? 0.5 : 0.1,
      indicators: hasLabelIndicators ? ['label_keywords'] : 
                 isLastImage ? ['last_image'] : 
                 hasTextIndicators ? ['text_content'] : []
    };
  }

  // Extract structured data from label text
  extractLabelData(labelText) {
    const result = {
      brand: null,
      brandConfidence: 0,
      sizes: [],
      materials: {},
      careInstructions: [],
      countryOfOrigin: null,
      skuNumbers: {},
      rawText: labelText,
      extractionConfidence: 'low'
    };

    const text = labelText.toLowerCase();

    // Extract brand information
    for (const [brand, patterns] of Object.entries(this.labelPatterns.brandPatterns)) {
      const matches = patterns.filter(pattern => pattern.test(text));
      if (matches.length > 0) {
        const confidence = matches.length / patterns.length;
        if (confidence > result.brandConfidence) {
          result.brand = brand.toUpperCase();
          result.brandConfidence = confidence;
        }
      }
    }

    // Extract sizes
    for (const [sizeType, pattern] of Object.entries(this.labelPatterns.sizePatterns)) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        result.sizes.push({
          type: sizeType,
          values: matches.map(match => match[1] || match[0]).slice(0, 3)
        });
      }
    }

    // Extract material composition
    for (const [material, pattern] of Object.entries(this.labelPatterns.materialPatterns)) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        const percentages = matches.map(match => parseInt(match[1]) || 0);
        result.materials[material] = Math.max(...percentages);
      }
    }

    // Extract care instructions
    for (const [careType, pattern] of Object.entries(this.labelPatterns.carePatterns)) {
      if (pattern.test(text)) {
        result.careInstructions.push(careType.replace('_', ' '));
      }
    }

    // Extract country of origin
    for (const [country, pattern] of Object.entries(this.labelPatterns.countryPatterns)) {
      if (pattern.test(text)) {
        result.countryOfOrigin = country.replace('made_in_', '').replace('_', ' ');
        break;
      }
    }

    // Extract SKU/style numbers
    for (const [skuType, pattern] of Object.entries(this.labelPatterns.skuPatterns)) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        result.skuNumbers[skuType] = matches.map(match => match[1]).slice(0, 2);
      }
    }

    // Determine extraction confidence
    const dataPoints = [
      result.brand ? 1 : 0,
      result.sizes.length > 0 ? 1 : 0,
      Object.keys(result.materials).length > 0 ? 1 : 0,
      result.careInstructions.length > 0 ? 1 : 0,
      result.countryOfOrigin ? 1 : 0,
      Object.keys(result.skuNumbers).length > 0 ? 1 : 0
    ].reduce((sum, val) => sum + val, 0);

    result.extractionConfidence = dataPoints >= 4 ? 'high' : 
                                 dataPoints >= 2 ? 'medium' : 'low';

    return result;
  }

  // Generate enhanced prompt for label analysis
  generateLabelAnalysisPrompt(hasLabelImage, labelData) {
    if (!hasLabelImage) return '';

    return `
🏷️ SKU LABEL ANALYSIS ENHANCEMENT:

📋 LABEL DETECTION STATUS: Label image detected - perform detailed text extraction

🔍 PRIORITY LABEL EXTRACTION TASKS:
1. BRAND NAME: Look for exact brand text on labels/tags
2. SIZE INFORMATION: Extract all size indicators (Roman numerals = OSKA!)
3. MATERIAL COMPOSITION: Read fabric percentages (Cotton 95%, Elastane 5%)
4. CARE INSTRUCTIONS: Extract washing/care symbols and text
5. COUNTRY OF ORIGIN: Look for "Made in [Country]"
6. STYLE/SKU NUMBERS: Extract any product codes or style numbers

${labelData ? `
📊 PRE-EXTRACTED LABEL DATA:
${labelData.brand ? `• BRAND DETECTED: ${labelData.brand} (${Math.round(labelData.brandConfidence * 100)}% confidence)` : ''}
${labelData.sizes.length > 0 ? `• SIZES FOUND: ${labelData.sizes.map(s => `${s.type}: ${s.values.join(', ')}`).join(' | ')}` : ''}
${Object.keys(labelData.materials).length > 0 ? `• MATERIALS: ${Object.entries(labelData.materials).map(([mat, pct]) => `${mat} ${pct}%`).join(', ')}` : ''}
${labelData.countryOfOrigin ? `• ORIGIN: ${labelData.countryOfOrigin}` : ''}
${labelData.careInstructions.length > 0 ? `• CARE: ${labelData.careInstructions.join(', ')}` : ''}
` : ''}

⚠️ CRITICAL: Use label information as HIGHEST PRIORITY for brand identification and sizing!

🎯 LABEL READING INSTRUCTIONS:
- Read ALL visible text on labels, tags, and care instructions
- Roman numerals (I, II, III, IV, V) = 99% OSKA brand confidence
- Extract exact brand names from label text
- Note fabric composition percentages
- Record style numbers or SKU codes
- Identify country of manufacture`;
  }

  // Enhance existing brand detection with label data
  enhanceBrandDetectionWithLabel(existingBrandClues, labelData) {
    if (!labelData || !labelData.brand) return existingBrandClues;

    // Label data takes priority - very high confidence
    const enhancedClues = { ...existingBrandClues };

    // Add or upgrade brand detection
    const labelBrand = {
      brand: labelData.brand,
      confidence: 0.95 + (labelData.brandConfidence * 0.05), // Very high confidence from labels
      source: 'label_extraction',
      indicators: ['sku_label', 'brand_text'],
      tier: this.getBrandTierFromLabel(labelData.brand),
      rawScore: 0.98
    };

    // Add to detected brands or replace if higher confidence
    enhancedClues.detectedBrands = enhancedClues.detectedBrands || [];
    const existingBrandIndex = enhancedClues.detectedBrands.findIndex(
      b => b.brand.toLowerCase() === labelData.brand.toLowerCase()
    );

    if (existingBrandIndex >= 0) {
      enhancedClues.detectedBrands[existingBrandIndex] = labelBrand;
    } else {
      enhancedClues.detectedBrands.unshift(labelBrand);
    }

    // Update primary brand
    enhancedClues.primaryBrand = labelBrand;
    enhancedClues.confidence = 'high';

    // Add label-specific information
    enhancedClues.labelData = labelData;

    return enhancedClues;
  }

  getBrandTierFromLabel(brand) {
    const luxuryBrands = ['chanel', 'gucci', 'prada', 'louis vuitton', 'burberry'];
    const premiumBrands = ['oska', 'cos', 'ganni', 'acne studios', 'whistles', 'reiss'];
    const midRangeBrands = ['zara', 'mango'];
    
    const brandLower = brand.toLowerCase();
    
    if (luxuryBrands.includes(brandLower)) return 'luxury';
    if (premiumBrands.includes(brandLower)) return 'premium';
    if (midRangeBrands.includes(brandLower)) return 'mid-range';
    return 'high-street';
  }
}

// Main function to process images with SKU label recognition
export async function processImagesWithSKURecognition(images, basePrompt) {
  console.log('🏷️ Starting SKU Label Recognition analysis...');
  
  const skuRecognizer = new SKULabelRecognizer();
  let labelImageIndex = -1;
  let labelData = null;
  let hasLabelImage = false;

  // Detect potential label images
  const imageAnalysis = images.map((img, index) => {
    const description = img.description || img.name || '';
    return {
      index,
      ...skuRecognizer.detectLabelImage(description, index, images.length),
      description
    };
  });

  // Find the most likely label image
  const sortedByLabelConfidence = imageAnalysis
    .filter(img => img.isLikelyLabel)
    .sort((a, b) => b.confidence - a.confidence);

  if (sortedByLabelConfidence.length > 0) {
    labelImageIndex = sortedByLabelConfidence[0].index;
    hasLabelImage = true;
    console.log(`🏷️ Label image detected at index ${labelImageIndex} (confidence: ${Math.round(sortedByLabelConfidence[0].confidence * 100)}%)`);
  }

  // If last image exists and no clear label detected, treat last as potential label
  if (!hasLabelImage && images.length > 0) {
    labelImageIndex = images.length - 1;
    hasLabelImage = true;
    console.log(`🏷️ Treating last image (index ${labelImageIndex}) as potential label`);
  }

  // Generate enhanced prompt with label instructions
  const labelPromptEnhancement = skuRecognizer.generateLabelAnalysisPrompt(hasLabelImage, labelData);
  
  const enhancedPrompt = `${basePrompt}

${labelPromptEnhancement}

${hasLabelImage ? `
🎯 SPECIAL ATTENTION: Image ${labelImageIndex + 1} is likely a SKU/care label
- Perform detailed text extraction on this image
- Use any text found to override brand detection with high confidence
- Extract size, material, and care information
- Roman numerals on labels = OSKA brand (99% confidence)
` : ''}`;

  return {
    enhancedPrompt,
    hasLabelImage,
    labelImageIndex,
    labelData,
    skuRecognizer,
    imageAnalysis,
    enhancementType: 'sku_label_recognition'
  };
}

// Function to post-process Claude response with label data
export function enhanceResultWithLabelData(claudeResult, labelAnalysis) {
  if (!labelAnalysis.hasLabelImage) return claudeResult;

  // Extract any label data from Claude's response
  const responseText = claudeResult.raw_response || claudeResult.description || '';
  
  if (labelAnalysis.skuRecognizer && responseText) {
    const extractedLabelData = labelAnalysis.skuRecognizer.extractLabelData(responseText);
    
    if (extractedLabelData.brand) {
      console.log(`🏷️ Label brand extracted: ${extractedLabelData.brand}`);
      
      // Override brand with label data (highest confidence)
      claudeResult.brand = extractedLabelData.brand;
      claudeResult.brand_source = 'sku_label';
      claudeResult.confidence = 'high';
      
      // Add label information
      claudeResult.label_data = extractedLabelData;
      
      // Update title with correct brand
      if (claudeResult.title) {
        claudeResult.title = claudeResult.title.replace(/^[A-Z\s&]+/, extractedLabelData.brand);
      }
    }
  }

  return claudeResult;
}

console.log('✅ SKU Label Recognition System loaded successfully');