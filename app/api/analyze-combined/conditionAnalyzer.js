// Condition analysis system
const conditionIndicators = {
  NEW: {
    keywords: ['new', 'unworn', 'tags', 'bnwt', 'nwt', 'brand new', 'sealed', 'unopened'],
    visual: ['tags visible', 'packaging', 'pristine', 'no wear'],
    confidence: 0.95
  },
  EXCELLENT: {
    keywords: ['excellent', 'mint', 'pristine', 'like new', 'barely worn', 'near perfect'],
    visual: ['minimal wear', 'no damage', 'clean', 'well maintained'],
    confidence: 0.85
  },
  VERY_GOOD: {
    keywords: ['very good', 'great', 'light wear', 'gently used', 'well kept'],
    visual: ['slight wear', 'minor signs', 'good shape'],
    confidence: 0.75
  },
  GOOD: {
    keywords: ['good', 'used', 'worn', 'pre-loved', 'some wear'],
    visual: ['visible wear', 'some fading', 'minor issues'],
    confidence: 0.65
  },
  FAIR: {
    keywords: ['fair', 'worn', 'vintage', 'distressed', 'flaws', 'damage'],
    visual: ['heavy wear', 'stains', 'holes', 'repairs needed'],
    confidence: 0.55
  }
};

// Analyze condition from various inputs
export function analyzeCondition(data) {
  const { 
    description = '', 
    visualAnalysis = {},
    userInput = ''
  } = data;
  
  let scores = {
    NEW: 0,
    EXCELLENT: 0,
    VERY_GOOD: 0,
    GOOD: 0,
    FAIR: 0
  };
  
  // Combine all text for analysis
  const allText = `${description} ${userInput}`.toLowerCase();
  
  // Check for condition keywords
  for (const [condition, indicators] of Object.entries(conditionIndicators)) {
    for (const keyword of indicators.keywords) {
      if (allText.includes(keyword)) {
        scores[condition] += 0.3;
      }
    }
  }
  
  // Add visual analysis if available
  if (visualAnalysis.condition) {
    const visualCondition = visualAnalysis.condition.toUpperCase();
    if (scores[visualCondition] !== undefined) {
      scores[visualCondition] += 0.5;
    }
  }
  
  // Determine best condition
  let bestCondition = 'GOOD'; // Default
  let highestScore = 0;
  
  for (const [condition, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCondition = condition;
    }
  }
  
  // Generate condition description
  const conditionDescription = generateConditionDescription(bestCondition, allText);
  
  return {
    condition: bestCondition,
    confidence: Math.min(highestScore, 1),
    description: conditionDescription,
    scores
  };
}

// Generate detailed condition description
function generateConditionDescription(condition, context) {
  const templates = {
    NEW: "Brand new with tags attached. Never worn or used. In original packaging.",
    EXCELLENT: "In excellent condition with minimal signs of wear. Very well maintained.",
    VERY_GOOD: "Very good condition with light wear consistent with gentle use.",
    GOOD: "Good used condition with some signs of wear but no major flaws.",
    FAIR: "Fair condition with visible wear and some flaws. Still wearable."
  };
  
  let description = templates[condition];
  
  // Add specific details from context
  if (context.includes('stain')) {
    description += " Note: Minor staining present.";
  }
  if (context.includes('hole') || context.includes('tear')) {
    description += " Note: Small repair needed.";
  }
  if (context.includes('fading')) {
    description += " Some color fading from wear.";
  }
  
  return description;
}

// Get eBay condition code
export function getEbayConditionCode(condition) {
  const conditionMap = {
    'NEW': 1000, // New with tags
    'EXCELLENT': 3000, // Pre-owned excellent
    'VERY_GOOD': 3000, // Pre-owned very good
    'GOOD': 3000, // Pre-owned good
    'FAIR': 3000 // Pre-owned acceptable
  };
  
  return conditionMap[condition] || 3000;
}