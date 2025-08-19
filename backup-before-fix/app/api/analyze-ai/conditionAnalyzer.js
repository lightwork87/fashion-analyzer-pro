export async function analyzeCondition(images, condition) {
  return { condition: condition || 'Good', score: 6, confidence: 0.7, details: '' };
}