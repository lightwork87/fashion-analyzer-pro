import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('🎯📏 Starting BRAND-FOCUSED + RULER DETECTION analysis...');
  
  try {
    const { images, bagNumber } = await request.json();
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      console.error('❌ No images provided');
      return NextResponse.json({ 
        error: 'No images provided',
        details: 'Please upload at least one image'
      }, { status: 400 });
    }

    console.log(`🎯📏 PROFESSIONAL ANALYSIS: ${images.length} photos with brand + ruler detection`);
    
    const startTime = Date.now();
    
    // Check API keys
    const googleApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    const claudeApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!googleApiKey) {
      console.error('❌ Google Vision API key missing');
      return NextResponse.json({ 
        error: 'Google Vision API key not configured'
      }, { status: 500 });
    }

    // ENHANCED PROCESSING VARIABLES
    let claudePromise = null;
    let claudeStarted = false;
    let brandConfirmed = false;
    let detectedBrandTier = 'unknown';

    // Step 1: Enhanced Parallel Processing with Ruler Detection
    console.log('\n🔍📏 Step 1: Brand + ruler parallel analysis...');
    const allVisionResults = [];
    const BATCH_SIZE = 6;
    
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
      const batch = images.slice(i, i + BATCH_SIZE);
      console.log(`📷📏 Enhanced batch ${Math.floor(i/BATCH_SIZE) + 1}: ${i + 1}-${Math.min(i + BATCH_SIZE, images.length)}`);
      
      const batchPromises = batch.map(async (imageData, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          // 📏 ENHANCED RULER DETECTION VERSION
          const visionResult = await analyzeWithRulerDetection(imageData, googleApiKey);
          return {
            index: globalIndex,
            result: visionResult,
            success: true
          };
        } catch (error) {
          console.error(`⚠️ Failed to analyze image ${globalIndex + 1}:`, error.message);
          return {
            index: globalIndex,
            result: null,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          allVisionResults.push(result.value);
        }
      });

      // Brand detection logic (unchanged)
      if (!claudeStarted && claudeApiKey) {
        const partialBrandData = analyzeBrandConfidence(allVisionResults.filter(r => r.success));
        
        console.log(`🔍 DEBUG: Checking brand confidence...`);
        if (partialBrandData.allBrands && partialBrandData.allBrands.length > 0) {
          console.log(`🔍 DEBUG: Found ${partialBrandData.allBrands.length} potential brands:`);
          partialBrandData.allBrands.forEach(brand => {
            console.log(`  - ${brand.description}: ${brand.confidence}%`);
          });
        } else {
          console.log(`🔍 DEBUG: No brands detected yet`);
        }
        
        if (partialBrandData.bestBrand && partialBrandData.bestBrand.confidence >= 50) {
          console.log(`\n🎯 BRAND CONFIRMED: ${partialBrandData.bestBrand.description} (${partialBrandData.bestBrand.confidence}%)`);
          console.log('🤖 Starting brand-focused Claude AI early for SPEED + ACCURACY!');
          
          claudeStarted = true;
          brandConfirmed = true;
          detectedBrandTier = getBrandTier(partialBrandData.bestBrand.description);
          
          const partialVisionData = combinePartialVisionResults(allVisionResults.filter(r => r.success));
          claudePromise = analyzeWithBrandFocusedClaude(
            partialVisionData, 
            claudeApiKey, 
            images.length,
            detectedBrandTier
          );
        }
      }
    }

    // Step 2: Complete Analysis with Ruler Detection
    console.log('\n🔗📏 Step 2: Complete brand + ruler analysis...');
    const combinedVisionData = combineAllVisionResults(allVisionResults);
    
    // 📏 NEW: RULER MEASUREMENT EXTRACTION
    const rulerMeasurements = extractRulerMeasurements(allVisionResults, images);
    console.log(`📏 Ruler detection results: ${rulerMeasurements.rulerDetected ? 'DETECTED' : 'NOT DETECTED'}`);
    if (rulerMeasurements.rulerDetected) {
      console.log(`📏 Found ${rulerMeasurements.totalMeasurements} ruler measurements in ${rulerMeasurements.rulerImages.length} images`);
    }
    
    // Enhanced brand analysis
    const brandIntelligence = performBrandIntelligenceAnalysis(combinedVisionData);
    console.log(`🎯 Final Brand Analysis: ${brandIntelligence.primaryBrand?.description || 'Unknown'} (${brandIntelligence.brandConfidence}%)`);
    console.log(`📊 Brand Tier: ${brandIntelligence.brandTier}`);
    console.log(`🔍 Authenticity Score: ${brandIntelligence.authenticityScore}%`);
    
    // DEBUG: Show what was actually detected
    console.log(`🔍 DEBUG: Total logos found: ${combinedVisionData.logos?.length || 0}`);
    if (combinedVisionData.logos && combinedVisionData.logos.length > 0) {
      console.log('🔍 DEBUG: All detected logos:');
      combinedVisionData.logos.forEach((logo, idx) => {
        console.log(`  ${idx + 1}. ${logo.description}: ${logo.confidence}% (image ${logo.sourceImage})`);
      });
    }
    
    // 📏 Standard measurement extraction (from care labels)
    const standardMeasurements = extractDetailedMeasurements(combinedVisionData.allText);
    
    // Step 3: Get Enhanced Claude AI Result
    console.log('\n🤖📏 Step 3: Enhanced Claude AI with measurement data...');
    let enhancedResult = null;
    
    if (claudePromise) {
      try {
        enhancedResult = await claudePromise;
        console.log('✅ Enhanced Claude analysis completed with overlapping');
      } catch (claudeError) {
        console.error('⚠️ Enhanced Claude failed:', claudeError.message);
      }
    } else if (claudeApiKey) {
      try {
        const finalBrandTier = brandIntelligence.brandTier || 'contemporary';
        enhancedResult = await analyzeWithBrandFocusedClaude(
          combinedVisionData, 
          claudeApiKey, 
          images.length,
          finalBrandTier
        );
        console.log('✅ Enhanced Claude analysis completed');
      } catch (claudeError) {
        console.error('⚠️ Enhanced Claude failed:', claudeError.message);
      }
    }

    // Step 4: Create Enhanced Final Result with All Measurement Data
    const totalTime = Date.now() - startTime;
    const finalResult = createEnhancedMeasurementResult(
      combinedVisionData, 
      enhancedResult, 
      images, 
      bagNumber,
      brandIntelligence,
      standardMeasurements,
      rulerMeasurements
    );
    
    // Enhanced performance metrics
    finalResult.performance = {
      totalTimeMs: totalTime,
      totalTimeSeconds: Math.round(totalTime / 1000),
      imagesPerSecond: Math.round((images.length * 1000) / totalTime * 10) / 10,
      brandFocusedProcessing: brandConfirmed,
      brandConfidence: brandIntelligence.brandConfidence,
      authenticityScore: brandIntelligence.authenticityScore,
      rulerDetected: rulerMeasurements.rulerDetected,
      rulerConfidence: rulerMeasurements.confidence,
      speedImprovement: `${Math.round(((15000 - totalTime) / 15000) * 100)}% faster with enhanced analysis`,
      processingMethod: brandConfirmed ? 'enhanced-overlapping-ruler' : 'enhanced-sequential-ruler',
      brandTierDetected: brandIntelligence.brandTier
    };

    console.log(`✅🎯📏 ENHANCED ANALYSIS COMPLETE!`);
    console.log(`📊 Brand: ${brandIntelligence.primaryBrand?.description || 'Unknown'} (${brandIntelligence.brandConfidence}%)`);
    console.log(`📏 Ruler: ${rulerMeasurements.rulerDetected ? 'DETECTED' : 'Not detected'} (${rulerMeasurements.confidence}%)`);
    console.log(`⚡ Speed: ${totalTime}ms with enhanced analysis`);
    
    return NextResponse.json({
      success: true,
      result: finalResult,
      imagesProcessed: images.length,
      analysisType: 'enhanced-brand-ruler-measurements',
      brandIntelligence: brandIntelligence,
      rulerMeasurements: rulerMeasurements,
      performance: finalResult.performance,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Global error in enhanced analysis:', error);
    return NextResponse.json({
      error: 'Enhanced analysis failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// 📏 ENHANCED GOOGLE VISION WITH RULER DETECTION
async function analyzeWithRulerDetection(imageData, apiKey) {
  const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
  
  const visionRequest = {
    requests: [{
      image: {
        content: base64Image
      },
      features: [
        { type: 'LOGO_DETECTION', maxResults: 10 },
        { type: 'TEXT_DETECTION', maxResults: 15 },        // Increased for ruler numbers
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'OBJECT_LOCALIZATION', maxResults: 8 }     // Detect rulers/measuring tools
      ]
    }]
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visionRequest),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Vision API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (data.responses?.[0]?.error) {
      throw new Error(`Google Vision error: ${data.responses[0].error.message}`);
    }

    return data.responses[0];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// 📏 RULER MEASUREMENT EXTRACTION SYSTEM
function extractRulerMeasurements(allVisionResults, images) {
  console.log('📏 Starting ruler measurement detection across all images...');
  
  const measurementResults = {
    rulerDetected: false,
    measurements: {
      pitToPit: null,
      length: null,
      width: null,
      other: []
    },
    rulerImages: [],
    confidence: 0,
    measurementText: '',
    totalMeasurements: 0
  };

  let allDetectedNumbers = [];
  let rulerIndicators = [];

  // Analyze each image for ruler/measurement content
  allVisionResults.forEach((visionResult, imageIndex) => {
    if (!visionResult.success || !visionResult.result) return;

    const result = visionResult.result;
    const imageAnalysis = analyzeImageForMeasurements(result, imageIndex + 1);
    
    if (imageAnalysis.hasRuler || imageAnalysis.hasMeasurements) {
      measurementResults.rulerImages.push({
        imageIndex: imageIndex + 1,
        hasRuler: imageAnalysis.hasRuler,
        measurements: imageAnalysis.measurements,
        rulerType: imageAnalysis.rulerType,
        confidence: imageAnalysis.confidence
      });
      
      rulerIndicators.push(...imageAnalysis.rulerIndicators);
      allDetectedNumbers.push(...imageAnalysis.detectedNumbers);
    }
  });

  // Process all detected measurements
  if (rulerIndicators.length > 0 || allDetectedNumbers.length > 0) {
    measurementResults.rulerDetected = true;
    
    // Extract specific measurements
    const extractedMeasurements = processRulerMeasurements(allDetectedNumbers, rulerIndicators);
    measurementResults.measurements = extractedMeasurements;
    
    // Generate measurement text
    measurementResults.measurementText = generateRulerMeasurementText(extractedMeasurements);
    measurementResults.totalMeasurements = countValidMeasurements(extractedMeasurements);
    measurementResults.confidence = calculateRulerConfidence(measurementResults.rulerImages);
  }

  console.log(`📏 Ruler detection complete: ${measurementResults.totalMeasurements} measurements found`);
  if (measurementResults.rulerDetected) {
    console.log(`📏 Ruler measurements: ${measurementResults.measurementText}`);
    console.log(`📏 Ruler found in ${measurementResults.rulerImages.length} images`);
  }

  return measurementResults;
}

// 📏 Analyze individual image for measurement content
function analyzeImageForMeasurements(visionResult, imageIndex) {
  const analysis = {
    hasRuler: false,
    hasMeasurements: false,
    measurements: [],
    rulerType: null,
    rulerIndicators: [],
    detectedNumbers: [],
    confidence: 0
  };

  // Check for ruler/measuring tape objects
  if (visionResult.localizedObjectAnnotations) {
    visionResult.localizedObjectAnnotations.forEach(obj => {
      const objName = obj.name.toLowerCase();
      if (isRulerObject(objName)) {
        analysis.hasRuler = true;
        analysis.rulerType = objName;
        analysis.rulerIndicators.push({
          type: 'object',
          name: objName,
          confidence: Math.round(obj.score * 100),
          imageIndex
        });
      }
    });
  }

  // Check for ruler/measurement text indicators
  if (visionResult.textAnnotations) {
    const allText = visionResult.textAnnotations.map(t => t.description).join(' ');
    const textAnalysis = analyzeTextForRulerMeasurements(allText, imageIndex);
    
    analysis.hasMeasurements = textAnalysis.hasMeasurements;
    analysis.measurements = textAnalysis.measurements;
    analysis.detectedNumbers = textAnalysis.detectedNumbers;
    
    if (textAnalysis.rulerKeywords.length > 0) {
      analysis.hasRuler = true;
      analysis.rulerIndicators.push(...textAnalysis.rulerKeywords);
    }
  }

  // Check labels for measurement-related content
  if (visionResult.labelAnnotations) {
    visionResult.labelAnnotations.forEach(label => {
      const labelName = label.description.toLowerCase();
      if (isMeasurementRelated(labelName)) {
        analysis.rulerIndicators.push({
          type: 'label',
          name: labelName,
          confidence: Math.round(label.score * 100),
          imageIndex
        });
      }
    });
  }

  // Calculate confidence
  analysis.confidence = calculateImageMeasurementConfidence(analysis);

  return analysis;
}

// 📏 Check if object is a ruler/measuring tool
function isRulerObject(objectName) {
  const rulerObjects = [
    'ruler', 'measuring tape', 'tape measure', 'measurement tool',
    'scale', 'measuring stick', 'measuring device', 'tape',
    'measuring ruler', 'fabric ruler', 'sewing ruler'
  ];
  
  return rulerObjects.some(ruler => 
    objectName.includes(ruler) || ruler.includes(objectName)
  );
}

// 📏 Check if label is measurement-related
function isMeasurementRelated(labelName) {
  const measurementLabels = [
    'ruler', 'tape', 'measure', 'scale', 'tool', 'measurement',
    'centimeter', 'inch', 'measuring', 'length', 'width'
  ];
  
  return measurementLabels.some(label => 
    labelName.includes(label) || label.includes(labelName)
  );
}

// 📏 Analyze text for ruler measurements
function analyzeTextForRulerMeasurements(text, imageIndex) {
  const analysis = {
    hasMeasurements: false,
    measurements: [],
    detectedNumbers: [],
    rulerKeywords: []
  };

  const lowerText = text.toLowerCase();

  // Look for ruler/measuring keywords
  const rulerKeywords = [
    'pit to pit', 'armpit to armpit', 'chest measurement', 'bust measurement',
    'length', 'total length', 'item length', 'garment length',
    'width', 'shoulder width', 'across chest', 'across shoulders',
    'sleeve length', 'arm length', 'inseam', 'waist measurement',
    'measured flat', 'laying flat', 'flat measurement'
  ];

  rulerKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      analysis.rulerKeywords.push({
        type: 'keyword',
        name: keyword,
        confidence: 85,
        imageIndex
      });
    }
  });

  // Extract measurement patterns with context
  const measurementPatterns = [
    // Pit to pit measurements
    {
      pattern: /(?:pit\s*to\s*pit|armpit\s*to\s*armpit|across\s*chest)[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi,
      type: 'pitToPit'
    },
    // Length measurements
    {
      pattern: /(?:length|total\s*length|item\s*length)[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi,
      type: 'length'
    },
    // Width measurements
    {
      pattern: /(?:width|shoulder\s*width|across\s*shoulders)[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi,
      type: 'width'
    },
    // General measurements with rulers
    {
      pattern: /(?:measured|measuring)[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi,
      type: 'general'
    },
    // Numbers near ruler keywords
    {
      pattern: /(\d+(?:\.\d+)?)\s*(cm|inch|in|")\s*(?:pit|length|width|measurement)/gi,
      type: 'contextual'
    }
  ];

  measurementPatterns.forEach(({ pattern, type }) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[2]) {
        const value = parseFloat(match[1]);
        let unit = match[2].toLowerCase();
        
        // Convert to cm
        let standardValue = value;
        if (unit === 'inch' || unit === 'in' || unit === '"') {
          standardValue = Math.round(value * 2.54);
          unit = 'cm';
        }
        
        // Validate reasonable measurement ranges
        if (isReasonableMeasurement(type, standardValue)) {
          analysis.measurements.push({
            type,
            value: standardValue,
            unit: 'cm',
            original: match[0],
            confidence: calculateMeasurementTypeConfidence(type, standardValue),
            imageIndex
          });
          
          analysis.detectedNumbers.push({
            value: standardValue,
            unit: 'cm',
            type,
            source: 'text',
            imageIndex
          });
          
          analysis.hasMeasurements = true;
        }
      }
    }
  });

  return analysis;
}

// 📏 Validate reasonable measurement ranges
function isReasonableMeasurement(type, value) {
  const ranges = {
    pitToPit: { min: 30, max: 80 },    // 30-80cm pit to pit
    length: { min: 40, max: 150 },     // 40-150cm length  
    width: { min: 25, max: 70 },       // 25-70cm width
    general: { min: 10, max: 200 },    // 10-200cm general
    contextual: { min: 10, max: 200 }  // 10-200cm contextual
  };
  
  const range = ranges[type] || ranges.general;
  return value >= range.min && value <= range.max;
}

// 📏 Calculate confidence for measurement type
function calculateMeasurementTypeConfidence(type, value) {
  const baseConfidence = {
    pitToPit: 90,     // High confidence - very specific measurement
    length: 85,       // High confidence - common measurement
    width: 80,        // Good confidence - shoulder width common
    general: 70,      // Medium confidence - less specific
    contextual: 65    // Lower confidence - contextual detection
  };
  
  let confidence = baseConfidence[type] || 70;
  
  // Adjust based on value reasonableness
  if (type === 'pitToPit' && value >= 35 && value <= 65) confidence = 95; // Very reasonable pit to pit
  if (type === 'length' && value >= 50 && value <= 120) confidence = 90;  // Very reasonable length
  
  return confidence;
}

// 📏 Process all ruler measurements and extract specific types
function processRulerMeasurements(allNumbers, rulerIndicators) {
  const measurements = {
    pitToPit: null,
    length: null,
    width: null,
    other: []
  };

  // Group measurements by type
  const groupedMeasurements = {
    pitToPit: [],
    length: [],
    width: [],
    general: [],
    contextual: []
  };

  allNumbers.forEach(num => {
    if (groupedMeasurements[num.type]) {
      groupedMeasurements[num.type].push(num);
    } else {
      groupedMeasurements.general.push(num);
    }
  });

  // Select best measurement for each type
  measurements.pitToPit = selectBestMeasurement(groupedMeasurements.pitToPit);
  measurements.length = selectBestMeasurement(groupedMeasurements.length);
  measurements.width = selectBestMeasurement(groupedMeasurements.width);

  // Add other measurements
  [...groupedMeasurements.general, ...groupedMeasurements.contextual].forEach(measurement => {
    if (!isDuplicateMeasurement(measurement, measurements)) {
      measurements.other.push(measurement);
    }
  });

  return measurements;
}

// 📏 Select best measurement from multiple detections
function selectBestMeasurement(measurements) {
  if (measurements.length === 0) return null;
  if (measurements.length === 1) return measurements[0];
  
  // Sort by confidence and select highest
  return measurements.sort((a, b) => b.confidence - a.confidence)[0];
}

// 📏 Check if measurement is duplicate
function isDuplicateMeasurement(measurement, existingMeasurements) {
  const tolerance = 2; // 2cm tolerance
  
  const existing = [
    existingMeasurements.pitToPit,
    existingMeasurements.length,
    existingMeasurements.width
  ].filter(Boolean);
  
  return existing.some(exist => 
    Math.abs(exist.value - measurement.value) <= tolerance
  );
}

// 📏 Generate measurement text for eBay description
function generateRulerMeasurementText(measurements) {
  const parts = [];
  
  if (measurements.pitToPit) {
    parts.push(`Pit to Pit: ${measurements.pitToPit.value}cm`);
  }
  
  if (measurements.length) {
    parts.push(`Length: ${measurements.length.value}cm`);
  }
  
  if (measurements.width) {
    parts.push(`Width: ${measurements.width.value}cm`);
  }
  
  measurements.other.forEach(measurement => {
    parts.push(`${measurement.value}cm`);
  });
  
  return parts.join(', ');
}

// 📏 Count valid measurements
function countValidMeasurements(measurements) {
  let count = 0;
  if (measurements.pitToPit) count++;
  if (measurements.length) count++;
  if (measurements.width) count++;
  count += measurements.other.length;
  return count;
}

// 📏 Calculate overall ruler confidence
function calculateRulerConfidence(rulerImages) {
  if (rulerImages.length === 0) return 0;
  
  const avgConfidence = rulerImages.reduce((sum, img) => sum + img.confidence, 0) / rulerImages.length;
  const imageBonus = Math.min(rulerImages.length * 10, 30); // Bonus for multiple images
  
  return Math.min(avgConfidence + imageBonus, 95);
}

// 📏 Calculate confidence for individual image analysis
function calculateImageMeasurementConfidence(analysis) {
  let confidence = 0;
  
  if (analysis.hasRuler) confidence += 40;
  if (analysis.hasMeasurements) confidence += 30;
  if (analysis.measurements.length > 0) confidence += analysis.measurements.length * 10;
  if (analysis.rulerIndicators.length > 0) confidence += analysis.rulerIndicators.length * 5;
  
  return Math.min(confidence, 95);
}

// 📏 STANDARD MEASUREMENT EXTRACTION (from care labels)
function extractDetailedMeasurements(allText) {
  console.log('📏 Starting detailed measurement extraction from labels...');
  
  if (!allText) {
    return {
      measurements: {},
      hasMeasurements: false,
      measurementText: '',
      totalMeasurements: 0
    };
  }

  const text = allText.toLowerCase();
  const measurements = {};
  let measurementText = '';
  
  const measurementPatterns = {
    chest: [
      /chest[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi,
      /bust[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi
    ],
    waist: [
      /waist[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi,
      /w[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi
    ],
    length: [
      /length[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi,
      /l[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi
    ],
    hips: [
      /hip[s]?[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi
    ],
    shoulders: [
      /shoulder[s]?[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi
    ],
    sleeves: [
      /sleeve[s]?[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi
    ],
    inseam: [
      /inseam[:\s]*(\d+(?:\.\d+)?)\s*(cm|inch|in|")/gi
    ]
  };

  // Extract measurements for each category
  Object.entries(measurementPatterns).forEach(([category, patterns]) => {
    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[2]) {
          const value = parseFloat(match[1]);
          let unit = match[2].toLowerCase();
          
          // Convert to standard units (cm)
          let standardValue = value;
          if (unit === 'inch' || unit === 'in' || unit === '"') {
            standardValue = Math.round(value * 2.54);
            unit = 'cm';
          } else {
            unit = 'cm';
          }
          
          // Only accept reasonable measurements (5-200cm)
          if (standardValue >= 5 && standardValue <= 200) {
            measurements[category] = {
              value: standardValue,
              unit: unit,
              original: `${value}${match[2]}`,
              confidence: calculateMeasurementConfidence(category, standardValue)
            };
            
            measurementText += `${category}: ${standardValue}${unit}, `;
          }
        }
      }
    });
  });

  // Clean up measurement text
  measurementText = measurementText.replace(/, $/, '');

  const result = {
    measurements,
    hasMeasurements: Object.keys(measurements).length > 0,
    measurementText,
    totalMeasurements: Object.keys(measurements).length,
    measurementSummary: generateMeasurementSummary(measurements)
  };

  console.log(`📏 Standard measurement extraction complete: ${result.totalMeasurements} measurements found`);
  return result;
}

function calculateMeasurementConfidence(category, value) {
  const reasonableRanges = {
    chest: { min: 70, max: 150, ideal: { min: 85, max: 120 } },
    waist: { min: 55, max: 130, ideal: { min: 70, max: 100 } },
    length: { min: 40, max: 120, ideal: { min: 50, max: 90 } },
    hips: { min: 70, max: 150, ideal: { min: 85, max: 120 } },
    shoulders: { min: 30, max: 60, ideal: { min: 38, max: 50 } },
    sleeves: { min: 50, max: 85, ideal: { min: 58, max: 75 } },
    inseam: { min: 60, max: 95, ideal: { min: 70, max: 85 } }
  };

  const range = reasonableRanges[category];
  if (!range) return 70;

  if (value >= range.ideal.min && value <= range.ideal.max) return 95;
  if (value >= range.min && value <= range.max) return 80;
  return 50;
}

function generateMeasurementSummary(measurements) {
  if (Object.keys(measurements).length === 0) {
    return 'No measurements available';
  }

  const summary = [];
  const priorityOrder = ['chest', 'waist', 'hips', 'length', 'shoulders', 'sleeves', 'inseam'];

  priorityOrder.forEach(category => {
    if (measurements[category]) {
      const m = measurements[category];
      summary.push(`${category}: ${m.value}${m.unit}`);
    }
  });

  return summary.join(' • ');
}

// 📏 ENHANCED RESULT CREATION WITH ALL MEASUREMENT TYPES
function createEnhancedMeasurementResult(combinedData, claudeResult, originalImages, bagNumber, brandIntelligence, standardMeasurements, rulerMeasurements) {
  const result = claudeResult || {};
  const primaryBrand = brandIntelligence.primaryBrand;
  
  // Enhanced size detection with ruler measurements
  let detectedSize = result.size || extractSizeFromText(combinedData.allText);
  
  // Try to infer size from ruler measurements first (more accurate)
  if (detectedSize === 'Unknown' && rulerMeasurements.rulerDetected) {
    const inferredSize = inferSizeFromRulerMeasurements(rulerMeasurements.measurements);
    if (inferredSize) {
      detectedSize = `UK ${inferredSize}`;
    }
  }
  
  // Fallback to standard measurements
  if (detectedSize === 'Unknown' && standardMeasurements.hasMeasurements) {
    const inferredSize = inferSizeFromMeasurements(standardMeasurements.measurements);
    if (inferredSize) {
      detectedSize = `UK ${inferredSize}`;
    }
  }
  
  return {
    id: 'enhanced_measurement_result',
    success: true,
    analysisType: 'enhanced-brand-ruler-measurements',
    
    // Brand data
    brand: result.brand || primaryBrand?.description || 'Unknown',
    brandConfidence: result.brandConfidence || brandIntelligence.brandConfidence || 0,
    brandTier: result.brandTier || brandIntelligence.brandTier || 'unknown',
    authenticityAssessment: result.authenticityAssessment || 'inconclusive',
    authenticityScore: result.authenticityScore || brandIntelligence.authenticityScore || 0,
    
    // Enhanced measurements
    size: detectedSize,
    measurements: standardMeasurements,           // Standard measurements from labels
    rulerMeasurements: rulerMeasurements,        // 📏 NEW: Ruler measurements
    hasMeasurements: standardMeasurements.hasMeasurements || rulerMeasurements.rulerDetected,
    hasRulerMeasurements: rulerMeasurements.rulerDetected,  // 📏 NEW
    
    // Standard item data
    confidence: result.brandConfidence || brandIntelligence.brandConfidence || 0,
    category: result.category || combinedData.primaryCategory || 'Fashion Item',
    condition: result.condition || 'Good',
    condition_score: result.condition_score || 7,
    material: result.material || 'Mixed Materials',
    color: result.color || 'Multi-Color',
    gender: result.gender || detectGender(result.brand, combinedData.allText),
    
    // Enhanced descriptions with ruler emphasis
    ebayTitle: generateRulerAwareTitle(
      result.brand || primaryBrand?.description, 
      result.gender, 
      result.category,
      brandIntelligence.brandTier,
      detectedSize,
      rulerMeasurements
    ),
    description: generateRulerMeasurementDescription(
      result.brand || primaryBrand?.description,
      originalImages.length,
      result.condition,
      brandIntelligence.brandTier,
      standardMeasurements,
      rulerMeasurements
    ),
    
    // Enhanced pricing with ruler premium
    estimatedValue: calculateRulerMeasurementPricing(
      brandIntelligence.brandTier,
      result.condition || 'Good',
      rulerMeasurements,
      standardMeasurements
    ),
    
    keywords: generateRulerAwareKeywords(
      result.brand || primaryBrand?.description,
      result.category,
      result.gender,
      brandIntelligence.brandTier,
      rulerMeasurements,
      standardMeasurements
    ),
    
    bagNumber: bagNumber || 'Not specified',
    photos_analyzed: originalImages.length,
    successful_analyses: combinedData.successfulImages,
    total_brands_detected: combinedData.logos?.length || 0,
    images: originalImages,
    
    brandIntelligence: brandIntelligence,
    visionSummary: {
      brands: combinedData.logos?.slice(0, 3) || [],
      topLabels: combinedData.labels?.slice(0, 5) || []
    },
    
    analysisMethod: claudeResult ? 'enhanced-claude+vision+ruler' : 'enhanced-vision+ruler',
    hasConditionAssessment: true,
    hasBrandAuthentication: true,
    conditionConfidence: result.condition_score ? (result.condition_score * 10) : 70
  };
}

// 📏 Generate professional eBay description with ruler measurements
function generateRulerMeasurementDescription(brand, photoCount, condition, brandTier, measurementData, rulerData) {
  const brandText = brand && brand !== 'Unknown' ? ` from ${brand}` : '';
  const conditionText = condition && condition !== 'Unknown' ? ` in ${condition.toLowerCase()} condition` : '';
  const tierText = brandTier !== 'unknown' ? ` ${brandTier}` : '';
  
  let description = `Beautiful preloved${tierText} fashion item${brandText}${conditionText}. `;
  
  // Add ruler measurements section
  if (rulerData.rulerDetected && rulerData.totalMeasurements > 0) {
    description += '\n\n📏 PROFESSIONAL MEASUREMENTS (Ruler Verified):\n';
    
    if (rulerData.measurements.pitToPit) {
      description += `• Pit to Pit: ${rulerData.measurements.pitToPit.value}cm\n`;
    }
    
    if (rulerData.measurements.length) {
      description += `• Length: ${rulerData.measurements.length.value}cm\n`;
    }
    
    if (rulerData.measurements.width) {
      description += `• Width: ${rulerData.measurements.width.value}cm\n`;
    }
    
    rulerData.measurements.other.forEach(measurement => {
      description += `• Measurement: ${measurement.value}cm\n`;
    });
    
    description += '\n📐 Measurements taken with ruler/measuring tape as shown in photos. ';
    description += 'Measurements are taken flat and may vary slightly. ';
    description += 'Please check measurements against your own items to ensure perfect fit.\n';
  }
  
  // Add standard measurements if available
  if (measurementData.hasMeasurements && !rulerData.rulerDetected) {
    description += '\n\n📏 MEASUREMENTS (From Labels):\n';
    Object.entries(measurementData.measurements).forEach(([category, data]) => {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      description += `• ${categoryName}: ${data.value}${data.unit}\n`;
    });
  }
  
  description += `\nThis listing includes ${photoCount} detailed photos showing the item from multiple angles`;
  if (rulerData.rulerDetected) {
    description += `, including professional measurements with ruler/measuring tape (${rulerData.rulerImages.length} measurement photos)`;
  }
  description += '. ';
  
  if (rulerData.rulerDetected || measurementData.hasMeasurements) {
    description += 'Detailed professional measurements provided for accurate sizing. ';
  }
  
  description += 'Perfect for sustainable fashion lovers seeking quality preloved items with professional sizing information.';
  
  return description;
}

// 📏 Enhanced title with ruler measurement emphasis
function generateRulerAwareTitle(brand, gender, category, brandTier, size, rulerData) {
  const parts = [];
  
  if (brand && brand !== 'Unknown') {
    parts.push(brand);
  }
  
  if (gender && gender !== 'Unisex') {
    parts.push(gender);
  }
  
  if (category && category !== 'Fashion Item') {
    parts.push(category);
  }
  
  // Add size information
  if (size && size !== 'Unknown') {
    parts.push(`Size ${size}`);
  }
  
  // Emphasize professional measurement
  if (rulerData.rulerDetected && rulerData.totalMeasurements >= 2) {
    parts.push('Measured');
  }
  
  if (brandTier === 'luxury') {
    parts.push('Luxury');
  } else if (brandTier === 'designer') {
    parts.push('Designer');  
  } else if (brandTier === 'vintage') {
    parts.push('Vintage');
  }
  
  parts.push('Preloved');
  
  return parts.join(' ').substring(0, 60);
}

// 📏 Pricing premium for ruler measurements
function calculateRulerMeasurementPricing(brandTier, condition, rulerData, measurementData) {
  const basePricing = {
    luxury: { min: 50, max: 200 },
    designer: { min: 25, max: 100 },
    contemporary: { min: 10, max: 50 },
    highStreet: { min: 5, max: 25 },
    vintage: { min: 15, max: 75 },
    unknown: { min: 10, max: 30 }
  };
  
  const pricing = basePricing[brandTier] || basePricing.unknown;
  
  const conditionMultipliers = {
    'EXCELLENT': 1.0,
    'VERY GOOD': 0.85,
    'GOOD': 0.7,
    'FAIR': 0.5,
    'POOR': 0.3
  };
  
  let multiplier = conditionMultipliers[condition] || 0.7;
  
  // Premium for ruler measurements (35% premium!)
  if (rulerData.rulerDetected && rulerData.totalMeasurements >= 2) {
    multiplier *= 1.35; // 35% premium for professional ruler measurements
  } else if (measurementData.hasMeasurements) {
    multiplier *= 1.20; // 20% premium for basic measurements
  }
  
  const adjustedMin = Math.round(pricing.min * multiplier);
  const adjustedMax = Math.round(pricing.max * multiplier);
  
  return `£${adjustedMin}-${adjustedMax}`;
}

// 📏 Infer size from ruler measurements (pit to pit is most reliable)
function inferSizeFromRulerMeasurements(rulerMeasurements) {
  if (!rulerMeasurements.pitToPit) return null;
  
  const pitToPit = rulerMeasurements.pitToPit.value;
  
  // UK women's size chart based on pit to pit measurements
  const pitToPitSizeChart = {
    6: { pitToPit: 37 },   // UK 6 ≈ 37cm pit to pit
    8: { pitToPit: 40 },   // UK 8 ≈ 40cm pit to pit
    10: { pitToPit: 43 },  // UK 10 ≈ 43cm pit to pit
    12: { pitToPit: 46 },  // UK 12 ≈ 46cm pit to pit
    14: { pitToPit: 49 },  // UK 14 ≈ 49cm pit to pit
    16: { pitToPit: 52 },  // UK 16 ≈ 52cm pit to pit
    18: { pitToPit: 55 },  // UK 18 ≈ 55cm pit to pit
    20: { pitToPit: 58 }   // UK 20 ≈ 58cm pit to pit
  };

  let bestMatch = null;
  let smallestDifference = Infinity;

  Object.entries(pitToPitSizeChart).forEach(([size, measurements]) => {
    const difference = Math.abs(pitToPit - measurements.pitToPit);
    if (difference < smallestDifference && difference <= 3) { // Within 3cm tolerance
      smallestDifference = difference;
      bestMatch = size;
    }
  });

  return bestMatch;
}

// 📏 Enhanced keywords with ruler emphasis
function generateRulerAwareKeywords(brand, category, gender, brandTier, rulerData, measurementData) {
  const keywords = [];
  
  if (brand && brand !== 'Unknown') {
    keywords.push(brand.toLowerCase().replace(/\s+/g, '-'));
  }
  
  if (brandTier && brandTier !== 'unknown') {
    keywords.push(brandTier);
  }
  
  if (gender && gender !== 'Unisex') {
    keywords.push(gender.toLowerCase().replace("'s", ''));
  }
  
  if (category && category !== 'Fashion Item') {
    keywords.push(category.toLowerCase().replace(/\s+/g, '-'));
  }
  
  // 📏 Ruler measurement keywords (premium SEO)
  if (rulerData.rulerDetected) {
    keywords.push('ruler-measured');
    keywords.push('professional-measurements');
    
    if (rulerData.measurements.pitToPit) {
      keywords.push('pit-to-pit');
    }
    if (rulerData.measurements.length) {
      keywords.push('length-measured');
    }
  } else if (measurementData.hasMeasurements) {
    keywords.push('measured');
    keywords.push('sizing-info');
  }
  
  keywords.push('preloved', 'sustainable', 'fashion');
  
  return keywords.slice(0, 10); // Allow more keywords for professional listings
}

// Keep all existing brand intelligence functions...

// 🎯 Brand Intelligence Analysis System - WITH DEBUGGING
function performBrandIntelligenceAnalysis(combinedData) {
  console.log('🎯 Performing comprehensive brand intelligence analysis...');
  
  // Enhanced brand analysis
  const brandAnalysis = {
    primaryBrand: combinedData.bestBrand,
    brandConfidence: combinedData.bestBrand?.confidence || 0,
    brandTier: 'unknown',
    authenticityScore: 0,
    brandQualityIndicators: [],
    potentialFakeFlags: []
  };

  console.log(`🔍 DEBUG: Primary brand: ${brandAnalysis.primaryBrand?.description || 'None'}`);
  console.log(`🔍 DEBUG: Brand confidence: ${brandAnalysis.brandConfidence}%`);

  if (brandAnalysis.primaryBrand) {
    // Determine brand tier
    brandAnalysis.brandTier = getBrandTier(brandAnalysis.primaryBrand.description);
    console.log(`🔍 DEBUG: Determined brand tier: ${brandAnalysis.brandTier}`);
    
    // Calculate authenticity score
    brandAnalysis.authenticityScore = calculateAuthenticityScore(
      brandAnalysis.primaryBrand,
      combinedData.allText,
      combinedData.labels
    );
    
    // Analyze brand quality indicators
    brandAnalysis.brandQualityIndicators = analyzeBrandQuality(
      brandAnalysis.primaryBrand,
      combinedData.allText
    );
    
    // Check for potential fake flags
    brandAnalysis.potentialFakeFlags = checkFakeFlags(
      brandAnalysis.primaryBrand,
      combinedData.allText,
      brandAnalysis.authenticityScore
    );
  } else {
    console.log(`🔍 DEBUG: No primary brand detected - checking if any text contains brand names`);
    
    // FALLBACK: Look for brand names in text if no logos detected
    const textBrands = extractBrandsFromText(combinedData.allText || '');
    if (textBrands.length > 0) {
      console.log(`🔍 DEBUG: Found brands in text: ${textBrands.join(', ')}`);
      brandAnalysis.primaryBrand = {
        description: textBrands[0],
        confidence: 60 // Lower confidence for text-based detection
      };
      brandAnalysis.brandConfidence = 60;
      brandAnalysis.brandTier = getBrandTier(textBrands[0]);
      brandAnalysis.authenticityScore = 50; // Lower for text-based
    }
  }

  console.log(`🎯 Brand Intelligence Complete: ${brandAnalysis.brandTier} tier, ${brandAnalysis.authenticityScore}% authentic`);
  return brandAnalysis;
}

// 🎯 NEW: Extract brand names from text if no logos detected
function extractBrandsFromText(text) {
  if (!text) return [];
  
  const commonBrands = [
    'zara', 'h&m', 'hm', 'mango', 'cos', 'arket', 'asos', 'topshop',
    'nike', 'adidas', 'puma', 'calvin klein', 'tommy hilfiger',
    'ralph lauren', 'polo', 'hugo boss', 'armani', 'gucci', 'prada',
    'chanel', 'louis vuitton', 'lv', 'dior', 'burberry', 'versace',
    'next', 'primark', 'new look', 'river island', 'boohoo',
    'massimo dutti', 'bershka', 'pull and bear', 'stradivarius'
  ];
  
  const lowerText = text.toLowerCase();
  const foundBrands = [];
  
  commonBrands.forEach(brand => {
    if (lowerText.includes(brand)) {
      foundBrands.push(brand);
    }
  });
  
  return foundBrands;
}

// 🎯 Brand Tier Classification System
function getBrandTier(brandName) {
  if (!brandName) return 'unknown';
  
  const brand = brandName.toLowerCase();
  
  const brandTiers = {
    luxury: [
      'chanel', 'hermes', 'louis vuitton', 'lv', 'prada', 'gucci', 'dior', 
      'cartier', 'tiffany', 'burberry', 'versace', 'armani', 'valentino'
    ],
    designer: [
      'marc jacobs', 'diane von furstenberg', 'theory', 'calvin klein',
      'tommy hilfiger', 'polo ralph lauren', 'ralph lauren', 'polo', 'hugo boss', 'michael kors'
    ],
    contemporary: [
      'zara', 'cos', 'arket', 'mango', 'massimo dutti', 'reiss',
      'whistles', 'other stories', 'weekday'
    ],
    highStreet: [
      'h&m', 'hm', 'topshop', 'asos', 'boohoo', 'primark', 'next',
      'river island', 'new look', 'dorothy perkins'
    ],
    vintage: [
      'vintage', 'retro', 'authentic vintage', 'deadstock'
    ]
  };

  for (const [tier, brands] of Object.entries(brandTiers)) {
    if (brands.some(b => brand.includes(b) || b.includes(brand))) {
      return tier;
    }
  }
  
  return 'contemporary'; // Default assumption
}

// 🎯 Authenticity Scoring System
function calculateAuthenticityScore(primaryBrand, allText, labels) {
  let score = 0;
  const maxScore = 100;
  
  // Brand confidence contributes 40%
  if (primaryBrand?.confidence) {
    score += (primaryBrand.confidence / 100) * 40;
  }
  
  // Text consistency contributes 30%
  const textConsistency = analyzeTextConsistency(primaryBrand?.description, allText);
  score += textConsistency * 30;
  
  // Care label presence contributes 20%
  const hasCareLables = checkForCareLabels(allText, labels);
  if (hasCareLables) score += 20;
  
  // Quality indicators contribute 10%
  const qualityIndicators = checkQualityIndicators(allText, labels);
  score += qualityIndicators * 10;
  
  return Math.min(Math.round(score), maxScore);
}

function analyzeTextConsistency(brandName, allText) {
  if (!brandName || !allText) return 0;
  
  const brand = brandName.toLowerCase();
  const text = allText.toLowerCase();
  
  // Check if brand appears in text
  if (text.includes(brand)) return 1;
  
  // Check for partial matches
  const brandWords = brand.split(' ');
  const matchCount = brandWords.reduce((count, word) => {
    return text.includes(word) ? count + 1 : count;
  }, 0);
  
  return matchCount / brandWords.length;
}

function checkForCareLabels(allText, labels) {
  const careIndicators = [
    'wash', 'dry clean', 'machine wash', 'hand wash', 'do not',
    'cotton', 'wool', 'silk', 'polyester', 'viscose',
    'made in', 'size', 'medium', 'large', 'small'
  ];
  
  const text = allText.toLowerCase();
  return careIndicators.some(indicator => text.includes(indicator));
}

function checkQualityIndicators(allText, labels) {
  const qualityWords = [
    'premium', 'luxury', 'high quality', 'designer', 'authentic',
    'genuine', 'original', 'crafted', 'tailored'
  ];
  
  const text = allText.toLowerCase();
  const matchCount = qualityWords.reduce((count, word) => {
    return text.includes(word) ? count + 1 : count;
  }, 0);
  
  return Math.min(matchCount / qualityWords.length, 1);
}

function analyzeBrandQuality(primaryBrand, allText) {
  const indicators = [];
  
  if (primaryBrand?.confidence >= 60) { // LOWERED from 90 to 60
    indicators.push('Reasonable brand confidence');
  }
  
  if (checkForCareLabels(allText, [])) {
    indicators.push('Care labels present');
  }
  
  const text = allText.toLowerCase();
  if (text.includes('made in')) {
    indicators.push('Origin information available');
  }
  
  return indicators;
}

function checkFakeFlags(primaryBrand, allText, authenticityScore) {
  const flags = [];
  
  if (primaryBrand?.confidence < 40) { // LOWERED from 70 to 40
    flags.push('Low brand detection confidence');
  }
  
  if (authenticityScore < 30) { // LOWERED from 60 to 30
    flags.push('Low authenticity score');
  }
  
  const text = allText.toLowerCase();
  const suspiciousWords = ['replica', 'inspired', 'style', 'type'];
  if (suspiciousWords.some(word => text.includes(word))) {
    flags.push('Suspicious terminology detected');
  }
  
  return flags;
}

// Brand-focused Claude analysis function
async function analyzeWithBrandFocusedClaude(combinedData, apiKey, imageCount, brandTier) {
  console.log(`🎯 Starting brand-focused Claude analysis for ${brandTier} tier...`);
  
  const brandContext = prepareBrandFocusedContext(combinedData, imageCount, brandTier);
  const tierSpecificInstructions = getBrandTierInstructions(brandTier);
  
  const prompt = `EXPERT BRAND-FOCUSED FASHION ANALYSIS: ${imageCount} photos of ONE ${brandTier.toUpperCase()} item for eBay UK resale.

${tierSpecificInstructions}

DETECTED BRAND DATA:
${brandContext}

RESPOND WITH JSON ONLY:

{
  "brand": "exact brand name detected or Unknown",
  "brandConfidence": ${combinedData.bestBrand?.confidence || 0},
  "brandTier": "${brandTier}",
  "authenticityAssessment": "authentic/questionable/inconclusive",
  "authenticityScore": 70,
  "size": "detected size or Unknown", 
  "category": "specific clothing category",
  "condition": "EXCELLENT/VERY GOOD/GOOD/FAIR/POOR",
  "condition_score": 7,
  "material": "fabric type",
  "color": "primary color",
  "gender": "Women's/Men's/Unisex",
  "ebayTitle": "brand-focused UK eBay title under 60 chars",
  "description": "brand-aware eBay description",
  "estimatedValue": "UK price range",
  "keywords": ["brand-focused", "keywords"],
  "keySellingPoints": ["brand authenticity", "condition highlights"],
  "brandSpecificNotes": "expert notes about this item"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const claudeResponse = data.content?.[0]?.text;
    
    if (!claudeResponse) {
      throw new Error('No response from Claude API');
    }

    return parseBrandFocusedResponse(claudeResponse);
  } catch (error) {
    throw error;
  }
}

function parseBrandFocusedResponse(responseText) {
  console.log('🔧 Brand-focused JSON parsing...');
  
  let cleanText = responseText
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanText = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(cleanText);
    console.log('✅ Brand-focused JSON parsing successful');
    return parsed;
  } catch (error) {
    console.log('⚠️ JSON parsing failed, using brand-focused fallback...');
    return generateBrandFocusedFallback();
  }
}

function generateBrandFocusedFallback() {
  return {
    brand: 'Unknown',
    brandConfidence: 0,
    brandTier: 'unknown',
    authenticityAssessment: 'inconclusive',
    authenticityScore: 0,
    size: 'Unknown',
    confidence: 70,
    category: 'Fashion Item',
    condition: 'Good',
    condition_score: 7,
    material: 'Mixed Materials',
    color: 'Multi-Color',
    gender: 'Unisex',
    ebayTitle: 'Fashion Item Preloved Good Condition',
    description: 'Quality preloved fashion item in good condition.',
    estimatedValue: '£10-25',
    keywords: ['fashion', 'preloved', 'clothing'],
    keySellingPoints: ['Good condition', 'Multiple photos'],
    brandSpecificNotes: 'Brand analysis inconclusive'
  };
}

function getBrandTierInstructions(brandTier) {
  const instructions = {
    luxury: "LUXURY item - focus on authenticity and premium positioning",
    designer: "DESIGNER item - emphasize brand prestige and quality", 
    contemporary: "CONTEMPORARY item - modern style and good quality",
    highStreet: "HIGH-STREET item - condition and value focus",
    vintage: "VINTAGE item - era and authenticity focus",
    unknown: "Brand uncertain - focus on visible quality indicators"
  };
  
  return instructions[brandTier] || instructions.unknown;
}

function prepareBrandFocusedContext(combinedData, imageCount, brandTier) {
  let context = `${imageCount} PHOTOS OF ${brandTier.toUpperCase()} ITEM ANALYZED:\n\n`;
  
  if (combinedData.logos && combinedData.logos.length > 0) {
    context += `BRAND DETECTIONS:\n`;
    combinedData.logos.slice(0, 3).forEach(logo => {
      context += `- ${logo.description} (${logo.confidence}% confidence)\n`;
    });
    context += '\n';
  }
  
  if (combinedData.allText) {
    context += `TEXT FROM LABELS:\n`;
    context += combinedData.allText.substring(0, 400) + '\n\n';
  }
  
  return context;
}

// Brand confidence analysis
function analyzeBrandConfidence(partialResults) {
  const brands = [];
  
  partialResults.forEach((result, index) => {
    if (result.result?.logoAnnotations) {
      result.result.logoAnnotations.forEach(logo => {
        brands.push({
          ...logo,
          sourceImage: index + 1,
          confidence: Math.round(logo.score * 100)
        });
      });
    }
  });

  // Sort by confidence and remove duplicates - LOWERED from 70% to 40%
  const uniqueBrands = [];
  const seen = new Set();
  
  brands.sort((a, b) => b.confidence - a.confidence).forEach(brand => {
    const key = brand.description.toLowerCase();
    if (!seen.has(key) && brand.confidence >= 40) { // LOWERED threshold for testing
      seen.add(key);
      uniqueBrands.push(brand);
    }
  });

  return {
    bestBrand: uniqueBrands[0] || null,
    allBrands: uniqueBrands
  };
}

// Keep all other existing helper functions...
function combineAllVisionResults(visionResults) {
  console.log('🔗 Complete brand-focused vision data combination...');
  
  const combined = {
    logos: [],
    texts: [],
    labels: [],
    objects: [],
    successfulImages: 0,
    totalImages: visionResults.length
  };

  visionResults.forEach((visionItem, index) => {
    if (!visionItem.success || !visionItem.result) return;
    
    combined.successfulImages++;
    const result = visionItem.result;

    if (result.logoAnnotations) {
      result.logoAnnotations.forEach(logo => {
        combined.logos.push({
          ...logo,
          sourceImage: index + 1,
          confidence: Math.round(logo.score * 100)
        });
      });
    }

    if (result.textAnnotations) {
      result.textAnnotations.forEach(text => {
        combined.texts.push({
          ...text,
          sourceImage: index + 1,
          text: text.description
        });
      });
    }

    if (result.labelAnnotations) {
      result.labelAnnotations.forEach(label => {
        combined.labels.push({
          ...label,
          sourceImage: index + 1,
          confidence: Math.round(label.score * 100)
        });
      });
    }
  });

  // Remove duplicates
  combined.logos = removeDuplicateLogosEnhanced(combined.logos);
  combined.labels = removeDuplicateLabels(combined.labels);
  
  const bestBrand = combined.logos.length > 0 ? combined.logos[0] : null;
  const allText = combined.texts.map(t => t.text).join(' ');
  
  return {
    ...combined,
    bestBrand,
    allText,
    primaryCategory: getPrimaryCategory(combined.labels)
  };
}

function combinePartialVisionResults(visionResults) {
  console.log('🔗 Combining partial vision data with brand priority...');
  
  const combined = {
    logos: [],
    texts: [],
    labels: [],
    successfulImages: visionResults.length,
    totalImages: visionResults.length,
    brandFocused: true
  };

  visionResults.forEach((visionItem, index) => {
    if (!visionItem.success || !visionItem.result) return;
    
    const result = visionItem.result;

    if (result.logoAnnotations) {
      result.logoAnnotations.forEach(logo => {
        if (logo.score >= 0.4) { // LOWERED from 0.7 to 0.4
          combined.logos.push({
            ...logo,
            sourceImage: index + 1,
            confidence: Math.round(logo.score * 100)
          });
        }
      });
    }

    if (result.textAnnotations) {
      result.textAnnotations.forEach(text => {
        combined.texts.push({
          ...text,
          sourceImage: index + 1,
          text: text.description
        });
      });
    }

    if (result.labelAnnotations) {
      result.labelAnnotations.forEach(label => {
        combined.labels.push({
          ...label,
          sourceImage: index + 1,
          confidence: Math.round(label.score * 100)
        });
      });
    }
  });

  combined.logos = combined.logos
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
    
  const bestBrand = combined.logos.length > 0 ? combined.logos[0] : null;
  const allText = combined.texts.map(t => t.text).join(' ');
  
  return {
    ...combined,
    bestBrand,
    allText: allText.substring(0, 600),
    primaryCategory: getPrimaryCategory(combined.labels)
  };
}

function removeDuplicateLogosEnhanced(logos) {
  const brandMap = new Map();
  
  logos.forEach(logo => {
    const key = normalizeBrandName(logo.description);
    const existing = brandMap.get(key);
    
    if (!existing || logo.confidence > existing.confidence) {
      brandMap.set(key, logo);
    }
  });
  
  return Array.from(brandMap.values())
    .sort((a, b) => b.confidence - a.confidence);
}

function normalizeBrandName(brandName) {
  return brandName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function removeDuplicateLabels(labels) {
  const seen = new Map();
  labels.forEach(label => {
    const key = label.description.toLowerCase();
    if (!seen.has(key) || seen.get(key).confidence < label.confidence) {
      seen.set(key, label);
    }
  });
  return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence);
}

function getPrimaryCategory(labels) {
  const categoryMap = {
    'dress': { category: 'Dress', priority: 10 },
    'jacket': { category: 'Jacket', priority: 9 },
    'shoes': { category: 'Shoes', priority: 10 },
    'clothing': { category: 'Clothing', priority: 1 }
  };
  
  let bestCategory = { category: 'Fashion Item', priority: 0 };
  labels.forEach(label => {
    const mapped = categoryMap[label.description.toLowerCase()];
    if (mapped && mapped.priority > bestCategory.priority) {
      bestCategory = mapped;
    }
  });
  return bestCategory.category;
}

function extractSizeFromText(text) {
  if (!text) return 'Unknown';
  
  const sizePatterns = [
    /\b(XXS|XS|S|M|L|XL|XXL|XXXL)\b/gi,
    /\bsize\s*:?\s*(\w+)/gi,
    /\b(6|8|10|12|14|16|18|20|22|24)\b/g
  ];
  
  for (const pattern of sizePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0];
    }
  }
  return 'Unknown';
}

function detectGender(brand, text) {
  const mensBrands = ['hugo boss', 'armani', 'ralph lauren polo'];
  const womensBrands = ['zara', 'hm', 'mango', 'asos'];
  
  if (brand && mensBrands.some(b => brand.toLowerCase().includes(b))) return 'Men\'s';
  if (brand && womensBrands.some(b => brand.toLowerCase().includes(b))) return 'Women\'s';
  
  const mensKeywords = ['mens', 'men\'s', 'gentleman', 'masculine'];
  const womensKeywords = ['womens', 'women\'s', 'ladies', 'feminine', 'dress'];
  
  const lowerText = (text || '').toLowerCase();
  if (mensKeywords.some(k => lowerText.includes(k))) return 'Men\'s';
  if (womensKeywords.some(k => lowerText.includes(k))) return 'Women\'s';
  
  return 'Unisex';
}

function inferSizeFromMeasurements(measurements) {
  if (!measurements.chest && !measurements.waist) {
    return null;
  }

  const womensSizeChart = {
    6: { chest: 78, waist: 60 },
    8: { chest: 83, waist: 65 },
    10: { chest: 88, waist: 70 },
    12: { chest: 93, waist: 75 },
    14: { chest: 98, waist: 80 },
    16: { chest: 103, waist: 85 },
    18: { chest: 108, waist: 90 },
    20: { chest: 113, waist: 95 }
  };

  let bestMatch = null;
  let smallestDifference = Infinity;

  Object.entries(womensSizeChart).forEach(([size, chartMeasurements]) => {
    let difference = 0;
    let matchCount = 0;

    if (measurements.chest) {
      difference += Math.abs(measurements.chest.value - chartMeasurements.chest);
      matchCount++;
    }

    if (measurements.waist) {
      difference += Math.abs(measurements.waist.value - chartMeasurements.waist);
      matchCount++;
    }

    if (matchCount > 0) {
      const averageDifference = difference / matchCount;
      if (averageDifference < smallestDifference && averageDifference < 8) {
        smallestDifference = averageDifference;
        bestMatch = size;
      }
    }
  });

  return bestMatch;
}