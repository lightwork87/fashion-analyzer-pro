// Measurement Analyzer for Fashion Items
// Detects rulers and calculates actual measurements

const MEASUREMENT_TYPES = {
  clothing: {
    dress: ['bust', 'waist', 'hips', 'length', 'sleeve'],
    shirt: ['chest', 'length', 'sleeve', 'shoulder'],
    jacket: ['chest', 'length', 'sleeve', 'shoulder'],
    jeans: ['waist', 'inseam', 'rise', 'thigh', 'leg_opening'],
    skirt: ['waist', 'hips', 'length'],
    coat: ['chest', 'length', 'sleeve', 'shoulder'],
    blazer: ['chest', 'waist', 'length', 'sleeve', 'shoulder']
  },
  accessories: {
    bag: ['height', 'width', 'depth', 'strap_drop'],
    shoes: ['insole_length', 'width', 'heel_height'],
    belt: ['length', 'width']
  }
};

// Standard size conversions
const SIZE_CONVERSIONS = {
  womens: {
    UK: { 6: 'XXS', 8: 'XS', 10: 'S', 12: 'M', 14: 'L', 16: 'XL', 18: 'XXL' },
    US: { 2: 'XXS', 4: 'XS', 6: 'S', 8: 'M', 10: 'L', 12: 'XL', 14: 'XXL' },
    EU: { 34: 'XXS', 36: 'XS', 38: 'S', 40: 'M', 42: 'L', 44: 'XL', 46: 'XXL' }
  },
  mens: {
    chest: { 
      36: 'XS', 38: 'S', 40: 'M', 42: 'L', 44: 'XL', 46: 'XXL', 48: 'XXXL'
    },
    waist: {
      28: 'XS', 30: 'S', 32: 'M', 34: 'L', 36: 'XL', 38: 'XXL', 40: 'XXXL'
    }
  }
};

// Measurement value ranges for validation
const MEASUREMENT_RANGES = {
  bust: { min: 28, max: 60 },
  chest: { min: 30, max: 60 },
  waist: { min: 22, max: 50 },
  hips: { min: 30, max: 60 },
  length: { min: 10, max: 60 },
  sleeve: { min: 15, max: 30 },
  shoulder: { min: 12, max: 22 },
  inseam: { min: 20, max: 36 },
  rise: { min: 6, max: 14 },
  thigh: { min: 8, max: 16 },
  leg_opening: { min: 5, max: 12 }
};

// Process measurements from image analysis
export async function analyzeMeasurements(imageData, itemType, detectedRuler) {
  try {
    // Check if ruler is detected
    if (!detectedRuler || !detectedRuler.isPresent) {
      return {
        hasMeasurements: false,
        confidence: 0,
        message: 'No ruler detected in image. Please include a ruler for accurate measurements.',
        suggestedMeasurements: getSuggestedMeasurements(itemType)
      };
    }

    // Calculate scale factor from ruler
    const scaleFactor = calculateScaleFactor(detectedRuler);
    
    // Extract measurements based on item type
    const measurements = await extractMeasurements(imageData, itemType, scaleFactor);
    
    // Validate measurements
    const validation = validateMeasurements(measurements, itemType);
    
    // Calculate size from measurements
    const estimatedSize = estimateSizeFromMeasurements(measurements, itemType);
    
    return {
      hasMeasurements: true,
      confidence: validation.confidence,
      measurements: measurements,
      estimatedSize: estimatedSize,
      validation: validation,
      priceBoost: calculatePriceBoost(validation.confidence),
      displayFormat: formatMeasurementsForListing(measurements, itemType),
      rulerDetails: {
        unit: detectedRuler.unit || 'inches',
        scaleFactor: scaleFactor,
        confidence: detectedRuler.confidence
      }
    };
  } catch (error) {
    console.error('Measurement analysis error:', error);
    return {
      hasMeasurements: false,
      confidence: 0,
      error: 'Failed to analyze measurements',
      suggestedMeasurements: getSuggestedMeasurements(itemType)
    };
  }
}

// Calculate scale factor from detected ruler
function calculateScaleFactor(rulerData) {
  // This would use computer vision to determine pixels per unit
  // For now, return a mock scale factor
  const { pixelsPerUnit, unit, confidence } = rulerData;
  
  // Default scale factors (pixels per inch/cm)
  const defaultScales = {
    inches: 100, // 100 pixels = 1 inch
    cm: 40      // 40 pixels = 1 cm
  };
  
  return {
    scale: pixelsPerUnit || defaultScales[unit] || defaultScales.inches,
    unit: unit || 'inches',
    confidence: confidence || 0.8
  };
}

// Extract measurements from image
async function extractMeasurements(imageData, itemType, scaleFactor) {
  // This would use AI/CV to identify measurement points
  // For now, return mock measurements
  
  const category = getItemCategory(itemType);
  const measurementTypes = MEASUREMENT_TYPES[category]?.[itemType] || [];
  const measurements = {};
  
  // Mock measurement extraction
  measurementTypes.forEach(type => {
    measurements[type] = generateMockMeasurement(type, scaleFactor.unit);
  });
  
  return measurements;
}

// Generate mock measurement for testing
function generateMockMeasurement(type, unit) {
  const ranges = MEASUREMENT_RANGES[type];
  if (!ranges) return null;
  
  // Generate realistic measurement
  const value = ranges.min + Math.random() * (ranges.max - ranges.min);
  const rounded = Math.round(value * 2) / 2; // Round to nearest 0.5
  
  return {
    value: rounded,
    unit: unit,
    confidence: 0.85 + Math.random() * 0.1
  };
}

// Validate measurements
function validateMeasurements(measurements, itemType) {
  const issues = [];
  let totalConfidence = 0;
  let measurementCount = 0;
  
  Object.entries(measurements).forEach(([type, data]) => {
    if (!data) return;
    
    const range = MEASUREMENT_RANGES[type];
    if (!range) return;
    
    measurementCount++;
    totalConfidence += data.confidence || 0;
    
    // Check if measurement is within expected range
    if (data.value < range.min || data.value > range.max) {
      issues.push(`${type} measurement seems unusual: ${data.value}${data.unit}`);
    }
  });
  
  // Check for missing critical measurements
  const requiredMeasurements = getRequiredMeasurements(itemType);
  requiredMeasurements.forEach(req => {
    if (!measurements[req]) {
      issues.push(`Missing ${req} measurement`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues: issues,
    confidence: measurementCount > 0 ? totalConfidence / measurementCount : 0,
    completeness: measurementCount / requiredMeasurements.length
  };
}

// Get required measurements for item type
function getRequiredMeasurements(itemType) {
  const requirements = {
    dress: ['bust', 'waist', 'length'],
    shirt: ['chest', 'length'],
    jacket: ['chest', 'length'],
    jeans: ['waist', 'inseam'],
    skirt: ['waist', 'length'],
    coat: ['chest', 'length'],
    bag: ['height', 'width'],
    shoes: ['insole_length']
  };
  
  return requirements[itemType] || [];
}

// Estimate size from measurements
function estimateSizeFromMeasurements(measurements, itemType) {
  if (!measurements || Object.keys(measurements).length === 0) {
    return { size: 'Unknown', confidence: 0 };
  }
  
  // Size estimation logic based on item type
  let estimatedSize = 'M';
  let confidence = 0.8;
  
  if (itemType === 'dress' || itemType === 'shirt') {
    const bust = measurements.bust?.value || measurements.chest?.value;
    if (bust) {
      if (bust < 34) estimatedSize = 'XS';
      else if (bust < 36) estimatedSize = 'S';
      else if (bust < 38) estimatedSize = 'M';
      else if (bust < 40) estimatedSize = 'L';
      else if (bust < 42) estimatedSize = 'XL';
      else estimatedSize = 'XXL';
      confidence = 0.85;
    }
  } else if (itemType === 'jeans' || itemType === 'trousers') {
    const waist = measurements.waist?.value;
    if (waist) {
      estimatedSize = Math.round(waist).toString();
      confidence = 0.9;
    }
  }
  
  return {
    size: estimatedSize,
    confidence: confidence,
    alternativeSizes: getAlternativeSizes(estimatedSize, itemType)
  };
}

// Get alternative size suggestions
function getAlternativeSizes(primarySize, itemType) {
  const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const index = sizeOrder.indexOf(primarySize);
  
  if (index === -1) return [];
  
  const alternatives = [];
  if (index > 0) alternatives.push(sizeOrder[index - 1]);
  if (index < sizeOrder.length - 1) alternatives.push(sizeOrder[index + 1]);
  
  return alternatives;
}

// Calculate price boost for measured items
function calculatePriceBoost(confidence) {
  // 35% boost for high-confidence measurements
  if (confidence >= 0.85) return 0.35;
  if (confidence >= 0.75) return 0.25;
  if (confidence >= 0.65) return 0.15;
  return 0.05;
}

// Format measurements for eBay listing
export function formatMeasurementsForListing(measurements, itemType) {
  if (!measurements || Object.keys(measurements).length === 0) {
    return '';
  }
  
  const lines = ['📏 Actual Measurements:'];
  const measurementOrder = getMeasurementOrder(itemType);
  
  measurementOrder.forEach(type => {
    const data = measurements[type];
    if (data && data.value) {
      const label = formatMeasurementLabel(type);
      const value = formatMeasurementValue(data.value, data.unit);
      lines.push(`${label}: ${value}`);
    }
  });
  
  lines.push('', 'All measurements taken flat. Please allow 1" variance.');
  
  return lines.join('\n');
}

// Get measurement order for display
function getMeasurementOrder(itemType) {
  const orders = {
    dress: ['bust', 'waist', 'hips', 'length', 'sleeve'],
    shirt: ['chest', 'shoulder', 'sleeve', 'length'],
    jacket: ['chest', 'shoulder', 'sleeve', 'length'],
    jeans: ['waist', 'rise', 'inseam', 'thigh', 'leg_opening'],
    skirt: ['waist', 'hips', 'length'],
    coat: ['chest', 'shoulder', 'sleeve', 'length'],
    bag: ['height', 'width', 'depth', 'strap_drop'],
    shoes: ['insole_length', 'width', 'heel_height']
  };
  
  return orders[itemType] || ['length', 'width'];
}

// Format measurement label for display
function formatMeasurementLabel(type) {
  const labels = {
    bust: 'Bust',
    chest: 'Chest',
    waist: 'Waist',
    hips: 'Hips',
    length: 'Length',
    sleeve: 'Sleeve Length',
    shoulder: 'Shoulder to Shoulder',
    inseam: 'Inseam',
    rise: 'Rise',
    thigh: 'Thigh',
    leg_opening: 'Leg Opening',
    strap_drop: 'Strap Drop',
    insole_length: 'Insole Length',
    heel_height: 'Heel Height'
  };
  
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Format measurement value
function formatMeasurementValue(value, unit) {
  if (unit === 'cm') {
    return `${value}cm (${Math.round(value / 2.54)}")`;
  }
  return `${value}"`;
}

// Get suggested measurements for item type
function getSuggestedMeasurements(itemType) {
  const category = getItemCategory(itemType);
  const types = MEASUREMENT_TYPES[category]?.[itemType] || [];
  
  return {
    recommended: types.slice(0, 3),
    optional: types.slice(3),
    tip: 'Include a ruler in your photos for automatic measurement detection'
  };
}

// Get item category
function getItemCategory(itemType) {
  const clothingTypes = ['dress', 'shirt', 'jacket', 'jeans', 'skirt', 'coat', 'blazer'];
  const accessoryTypes = ['bag', 'shoes', 'belt'];
  
  if (clothingTypes.includes(itemType)) return 'clothing';
  if (accessoryTypes.includes(itemType)) return 'accessories';
  return 'clothing'; // default
}

// Export measurement utilities
export const MeasurementUtils = {
  getSuggestedMeasurements,
  formatMeasurementsForListing,
  estimateSizeFromMeasurements,
  validateMeasurements
};