// Enhanced Condition Analyzer for Fashion Items
// Provides detailed condition scoring and eBay condition codes

const CONDITION_LEVELS = {
  NEW: {
    score: 100,
    ebayCode: '1000',
    title: 'New with tags',
    description: 'Brand new with original tags attached. Never worn or used.',
    keywords: ['new', 'tags', 'unworn', 'mint', 'pristine', 'brand new', 'NWT'],
    priceMultiplier: 1.0
  },
  NEW_WITHOUT_TAGS: {
    score: 95,
    ebayCode: '1500',
    title: 'New without tags',
    description: 'Brand new but tags have been removed. Never worn or used.',
    keywords: ['new without tags', 'NWOT', 'unworn', 'no tags', 'tagless'],
    priceMultiplier: 0.9
  },
  EXCELLENT: {
    score: 85,
    ebayCode: '3000',
    title: 'Pre-owned - Excellent',
    description: 'Item has been worn but shows minimal signs of wear. No visible flaws, stains, or damage.',
    keywords: ['excellent', 'like new', 'barely worn', 'minimal wear', 'EUC', 'pristine'],
    priceMultiplier: 0.75
  },
  VERY_GOOD: {
    score: 70,
    ebayCode: '3000',
    title: 'Pre-owned - Very Good',
    description: 'Item shows light signs of wear but no major flaws. May have minor pilling or slight fading.',
    keywords: ['very good', 'light wear', 'gently used', 'minor wear', 'VGC', 'gentle'],
    priceMultiplier: 0.6
  },
  GOOD: {
    score: 50,
    ebayCode: '3000',
    title: 'Pre-owned - Good',
    description: 'Item shows moderate signs of wear. May have some pilling, fading, or minor stains.',
    keywords: ['good', 'moderate wear', 'used', 'worn', 'pre-owned', 'decent'],
    priceMultiplier: 0.45
  },
  FAIR: {
    score: 30,
    ebayCode: '3000',
    title: 'Pre-owned - Fair',
    description: 'Item shows significant wear with noticeable flaws. May have stains, pilling, or minor damage.',
    keywords: ['fair', 'heavy wear', 'well worn', 'significant wear', 'flaws', 'worn'],
    priceMultiplier: 0.3
  },
  POOR: {
    score: 10,
    ebayCode: '7000',
    title: 'For parts or not working',
    description: 'Item has major flaws or damage. Suitable for repair, upcycling, or parts only.',
    keywords: ['poor', 'damaged', 'needs repair', 'major flaws', 'parts only', 'as-is'],
    priceMultiplier: 0.15
  }
};

// Defect keywords that indicate condition issues
const DEFECT_KEYWORDS = {
  major: {
    keywords: ['hole', 'tear', 'rip', 'broken', 'cracked', 'split', 'missing', 'severe'],
    impact: -40
  },
  moderate: {
    keywords: ['stain', 'discolor', 'fade', 'pill', 'worn', 'frayed', 'stretched'],
    impact: -20
  },
  minor: {
    keywords: ['small', 'tiny', 'slight', 'minor', 'light', 'minimal', 'barely'],
    impact: -10
  },
  positive: {
    keywords: ['clean', 'fresh', 'perfect', 'flawless', 'pristine', 'immaculate'],
    impact: +10
  }
};

// Material-specific wear patterns
const MATERIAL_WEAR_PATTERNS = {
  leather: {
    good: ['supple', 'soft', 'conditioned', 'patina'],
    bad: ['cracked', 'dry', 'peeling', 'scuffed']
  },
  denim: {
    good: ['intact', 'sturdy', 'solid'],
    bad: ['threadbare', 'holes', 'frayed', 'worn through']
  },
  silk: {
    good: ['lustrous', 'smooth', 'shiny'],
    bad: ['snags', 'pulls', 'water marks', 'dull']
  },
  wool: {
    good: ['soft', 'intact', 'clean'],
    bad: ['pilled', 'felted', 'moth holes', 'matted']
  },
  cotton: {
    good: ['crisp', 'clean', 'bright'],
    bad: ['thin', 'worn', 'faded', 'pilled']
  }
};

// Analyze condition based on visual inspection and description
export function analyzeCondition(analysisData) {
  const {
    description = '',
    visualAnalysis = {},
    detectedDefects = [],
    material = '',
    age = 'unknown'
  } = analysisData;

  let conditionScore = 70; // Start with VERY_GOOD as baseline
  let detectedIssues = [];
  let positiveFactors = [];

  // Check for new items
  if (hasNewIndicators(description, visualAnalysis)) {
    return {
      condition: visualAnalysis.tags ? 'NEW' : 'NEW_WITHOUT_TAGS',
      score: visualAnalysis.tags ? 100 : 95,
      confidence: 0.95,
      description: CONDITION_LEVELS[visualAnalysis.tags ? 'NEW' : 'NEW_WITHOUT_TAGS'].description,
      issues: [],
      positives: ['Brand new item', 'Never worn'],
      ebayCode: CONDITION_LEVELS[visualAnalysis.tags ? 'NEW' : 'NEW_WITHOUT_TAGS'].ebayCode
    };
  }

  // Analyze description for condition keywords
  const descAnalysis = analyzeDescription(description);
  conditionScore += descAnalysis.scoreAdjustment;
  detectedIssues = [...detectedIssues, ...descAnalysis.issues];
  positiveFactors = [...positiveFactors, ...descAnalysis.positives];

  // Check for specific defects
  detectedDefects.forEach(defect => {
    const defectImpact = getDefectImpact(defect);
    conditionScore += defectImpact.score;
    if (defectImpact.issue) detectedIssues.push(defectImpact.issue);
  });

  // Material-specific analysis
  if (material) {
    const materialAnalysis = analyzeMaterialCondition(material, description);
    conditionScore += materialAnalysis.scoreAdjustment;
    detectedIssues = [...detectedIssues, ...materialAnalysis.issues];
    positiveFactors = [...positiveFactors, ...materialAnalysis.positives];
  }

  // Ensure score is within bounds
  conditionScore = Math.max(10, Math.min(100, conditionScore));

  // Determine condition level
  const condition = getConditionFromScore(conditionScore);
  const conditionData = CONDITION_LEVELS[condition];

  // Calculate confidence based on amount of data
  const confidence = calculateConfidence(description, visualAnalysis, detectedDefects);

  return {
    condition: condition,
    score: conditionScore,
    confidence: confidence,
    description: generateDetailedDescription(condition, detectedIssues, positiveFactors),
    issues: detectedIssues,
    positives: positiveFactors,
    ebayCode: conditionData.ebayCode,
    priceMultiplier: conditionData.priceMultiplier
  };
}

// Check for indicators of new items
function hasNewIndicators(description, visualAnalysis) {
  const newKeywords = ['new', 'unworn', 'tags', 'NWT', 'NWOT', 'mint', 'pristine'];
  const descLower = description.toLowerCase();
  
  const hasNewKeywords = newKeywords.some(keyword => descLower.includes(keyword));
  const hasTagsVisible = visualAnalysis.tags === true;
  const noWearDetected = visualAnalysis.wearLevel === 'none';
  
  return (hasNewKeywords && noWearDetected) || hasTagsVisible;
}

// Analyze text description for condition indicators
function analyzeDescription(description) {
  const descLower = description.toLowerCase();
  let scoreAdjustment = 0;
  const issues = [];
  const positives = [];

  // Check for defect keywords
  Object.entries(DEFECT_KEYWORDS).forEach(([severity, data]) => {
    data.keywords.forEach(keyword => {
      if (descLower.includes(keyword)) {
        scoreAdjustment += data.impact;
        if (severity === 'positive') {
          positives.push(`${keyword} condition noted`);
        } else if (severity !== 'minor') {
          issues.push(`${severity} issue: ${keyword}`);
        }
      }
    });
  });

  return { scoreAdjustment, issues, positives };
}

// Get impact score for specific defects
function getDefectImpact(defect) {
  const defectScores = {
    'hole': { score: -30, issue: 'Hole detected' },
    'stain': { score: -20, issue: 'Stain present' },
    'pilling': { score: -15, issue: 'Pilling observed' },
    'fading': { score: -15, issue: 'Color fading' },
    'missing_button': { score: -10, issue: 'Missing button' },
    'loose_thread': { score: -5, issue: 'Loose threads' },
    'wrinkled': { score: -5, issue: 'Wrinkled (may need steaming)' }
  };

  return defectScores[defect] || { score: -10, issue: `${defect} detected` };
}

// Analyze material-specific condition
function analyzeMaterialCondition(material, description) {
  const materialLower = material.toLowerCase();
  const descLower = description.toLowerCase();
  const patterns = MATERIAL_WEAR_PATTERNS[materialLower];
  
  if (!patterns) return { scoreAdjustment: 0, issues: [], positives: [] };
  
  let scoreAdjustment = 0;
  const issues = [];
  const positives = [];
  
  // Check positive indicators
  patterns.good.forEach(indicator => {
    if (descLower.includes(indicator)) {
      scoreAdjustment += 5;
      positives.push(`${material} in ${indicator} condition`);
    }
  });
  
  // Check negative indicators
  patterns.bad.forEach(indicator => {
    if (descLower.includes(indicator)) {
      scoreAdjustment -= 15;
      issues.push(`${material} shows ${indicator}`);
    }
  });
  
  return { scoreAdjustment, issues, positives };
}

// Convert score to condition level
function getConditionFromScore(score) {
  if (score >= 95) return 'NEW_WITHOUT_TAGS';
  if (score >= 80) return 'EXCELLENT';
  if (score >= 65) return 'VERY_GOOD';
  if (score >= 45) return 'GOOD';
  if (score >= 25) return 'FAIR';
  return 'POOR';
}

// Calculate confidence in the assessment
function calculateConfidence(description, visualAnalysis, detectedDefects) {
  let dataPoints = 0;
  let confidence = 0.5; // Base confidence
  
  if (description && description.length > 20) dataPoints++;
  if (visualAnalysis && Object.keys(visualAnalysis).length > 0) dataPoints++;
  if (detectedDefects && detectedDefects.length > 0) dataPoints++;
  
  // More data points increase confidence
  confidence += (dataPoints * 0.15);
  
  // Cap at 0.95 as we're never 100% certain
  return Math.min(0.95, confidence);
}

// Generate detailed description for the listing
function generateDetailedDescription(condition, issues, positives) {
  const baseDescription = CONDITION_LEVELS[condition].description;
  
  let details = [baseDescription];
  
  if (positives.length > 0) {
    details.push(`Positive aspects: ${positives.join(', ')}.`);
  }
  
  if (issues.length > 0) {
    details.push(`Please note: ${issues.join(', ')}.`);
  }
  
  // Add care message for lower conditions
  if (['FAIR', 'POOR'].includes(condition)) {
    details.push('Please review all photos carefully before purchasing.');
  }
  
  return details.join(' ');
}

// Get eBay condition code
export function getEbayConditionCode(condition) {
  return CONDITION_LEVELS[condition]?.ebayCode || '3000';
}

// Get price multiplier based on condition
export function getConditionPriceMultiplier(condition) {
  return CONDITION_LEVELS[condition]?.priceMultiplier || 0.5;
}

// Validate condition assessment with multiple data points
export function validateConditionAssessment(primaryAssessment, secondaryData) {
  // This would cross-reference multiple AI assessments
  // For now, return the primary assessment
  return primaryAssessment;
}