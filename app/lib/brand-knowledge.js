// Brand-specific knowledge base
export const brandKnowledge = {
  'OSKA': {
    sizes: {
      'I': { uk: '8-10', label: '1' },
      'II': { uk: '12-14', label: '2' },
      'III': { uk: '16-18', label: '3' },
      'IV': { uk: '20-22', label: '4' },
      'V': { uk: '24-26', label: '5' }
    },
    keywords: ['Designer', 'Lagenlook', 'German', 'Artisan', 'Oversized', 'Asymmetric'],
    priceRange: { min: 25, max: 85 },
    materials: ['Linen', 'Cotton', 'Wool', 'Viscose'],
    garmentTypes: ['Tunic', 'Dress', 'Top', 'Trousers', 'Jacket']
  },
  
  'CHILDISH': {
    sizes: {
      'S': { uk: '8-10', chest: '34-36' },
      'M': { uk: '12-14', chest: '38-40' },
      'L': { uk: '16-18', chest: '42-44' }
    },
    keywords: ['Streetwear', 'Urban', 'Skate', 'Graphic', 'Limited'],
    priceRange: { min: 15, max: 35 },
    materials: ['Cotton', 'Jersey', 'Fleece'],
    garmentTypes: ['T-Shirt', 'Hoodie', 'Sweatshirt', 'Joggers']
  },
  
  'ZARA': {
    sizes: {
      'XS': { uk: '6', eu: '34' },
      'S': { uk: '8', eu: '36' },
      'M': { uk: '10', eu: '38' },
      'L': { uk: '12', eu: '40' },
      'XL': { uk: '14', eu: '42' }
    },
    keywords: ['Fast Fashion', 'Trendy', 'Current Season', 'High Street'],
    priceRange: { min: 8, max: 25 },
    materials: ['Polyester', 'Cotton', 'Viscose', 'Elastane'],
    garmentTypes: ['Dress', 'Top', 'Blazer', 'Jeans', 'Skirt']
  }
};

// Helper to get brand-specific data
export function getBrandInfo(brand) {
  const brandUpper = brand.toUpperCase();
  return brandKnowledge[brandUpper] || null;
}

// Convert brand-specific size to standard
export function convertBrandSize(brand, sizeLabel) {
  const brandInfo = getBrandInfo(brand);
  if (!brandInfo) return sizeLabel;
  
  const sizeInfo = brandInfo.sizes[sizeLabel];
  if (!sizeInfo) return sizeLabel;
  
  return sizeInfo.label || sizeInfo.uk || sizeLabel;
}

// Get optimal keywords for brand
export function getBrandKeywords(brand, garmentType) {
  const brandInfo = getBrandInfo(brand);
  if (!brandInfo) return ['VGC', 'UK', 'Genuine'];
  
  const keywords = [...brandInfo.keywords];
  
  // Add garment-specific keywords
  if (garmentType === 'Dress' && brand === 'OSKA') {
    keywords.push('Quirky', 'Artistic');
  }
  
  return keywords;
}

// Get price suggestion
export function getSuggestedPrice(brand, condition = 7) {
  const brandInfo = getBrandInfo(brand);
  if (!brandInfo) return 15;
  
  const { min, max } = brandInfo.priceRange;
  // Scale price based on condition (1-10)
  const priceRange = max - min;
  const conditionFactor = condition / 10;
  
  return Math.round(min + (priceRange * conditionFactor));
}