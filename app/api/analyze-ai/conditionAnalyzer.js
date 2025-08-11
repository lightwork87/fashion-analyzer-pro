export function analyzeCondition(description) {
  // This function is referenced but not used in the current code
  // Adding it to prevent future errors
  const conditionKeywords = {
    excellent: ['pristine', 'perfect', 'mint', 'flawless', 'immaculate'],
    good: ['good', 'great', 'minor wear', 'light use'],
    fair: ['fair', 'moderate wear', 'some signs of use'],
    poor: ['poor', 'heavy wear', 'damaged', 'stained']
  };
  
  return {
    score: 7,
    category: 'good',
    description: description || 'Good condition'
  };
}