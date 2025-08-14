export async function analyzeCondition(images, aiDetectedCondition) {
  // Condition mapping
  const conditions = {
    'new': { 
      name: 'New with tags', 
      score: 10, 
      keywords: ['tags', 'unworn', 'brand new', 'sealed']
    },
    'new_no_tags': { 
      name: 'New without tags', 
      score: 9, 
      keywords: ['new', 'never worn', 'pristine']
    },
    'excellent': { 
      name: 'Excellent', 
      score: 8, 
      keywords: ['excellent', 'like new', 'barely worn']
    },
    'very_good': { 
      name: 'Very Good', 
      score: 7, 
      keywords: ['very good', 'great', 'minimal wear']
    },
    'good': { 
      name: 'Good', 
      score: 6, 
      keywords: ['good', 'worn', 'used']
    },
    'fair': { 
      name: 'Fair', 
      score: 4, 
      keywords: ['fair', 'wear', 'marks', 'fading']
    },
    'poor': { 
      name: 'Poor', 
      score: 2, 
      keywords: ['poor', 'damaged', 'stained', 'torn']
    }
  };

  // Start with AI's assessment
  let detectedCondition = 'good';
  let conditionScore = 6;
  let confidence = 0.7;
  let details = [];

  // Check AI's condition against our conditions
  const aiConditionLower = (aiDetectedCondition || '').toLowerCase();
  
  for (const [key, condition] of Object.entries(conditions)) {
    if (condition.keywords.some(keyword => aiConditionLower.includes(keyword))) {
      detectedCondition = key;
      conditionScore = condition.score;
      confidence = 0.85;
      break;
    }
  }

  // Generate condition details based on score
  if (conditionScore >= 9) {
    details.push('Item appears unworn or in pristine condition');
  } else if (conditionScore >= 7) {
    details.push('Minimal signs of wear');
    details.push('No significant flaws noted');
  } else if (conditionScore >= 5) {
    details.push('Normal wear consistent with gentle use');
    details.push('Please see photos for full condition');
  } else {
    details.push('Visible wear present');
    details.push('Please review all photos carefully');
  }

  return {
    condition: conditions[detectedCondition].name,
    score: conditionScore,
    confidence: confidence,
    details: details.join('. ')
  };
}