export async function identifyBrand(brand) {
  return { brand: brand || 'Unknown', tier: 'unknown', confidence: 0.5 };
}